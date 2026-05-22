import { getComponents, createComponent, updateComponent, deleteComponent } from './db.js';
import { showToast, openModal, closeModal } from './app.js';

const CATEGORIES = [
  'Frame', 'Fork', 'Rear Shock', 'Handlebar', 'Stem', 'Grips / Tape',
  'Headset', 'Brakes', 'Rotors', 'Drivetrain', 'Cassette', 'Chain',
  'Chainring / Crank', 'Pedals', 'Wheels / Rims', 'Hubs', 'Tires',
  'Dropper Post', 'Saddle', 'Seatpost', 'Seat Clamp',
  'Bottom Bracket', 'Derailleur', 'Shifter', 'Other'
];

export async function renderComponentsTab(bike) {
  const grid = document.getElementById('components-grid');
  const empty = document.getElementById('components-empty');
  grid.innerHTML = '<div class="loading-row">Loading...</div>';

  try {
    const components = await getComponents(bike.id);
    grid.innerHTML = '';

    if (components.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
    } else {
      grid.classList.remove('hidden');
      empty.classList.add('hidden');

      // Group by category
      const grouped = {};
      components.forEach(c => {
        const cat = c.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(c);
      });

      Object.keys(grouped).sort().forEach(cat => {
        grouped[cat].forEach(comp => {
          grid.appendChild(buildComponentCard(comp, bike));
        });
      });
    }
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--danger);padding:1rem">Error loading components: ${e.message}</p>`;
  }

  // Add component button
  document.getElementById('btn-add-component').onclick = () => showComponentModal(null, bike);
}

function buildComponentCard(comp, bike) {
  const card = document.createElement('div');
  card.className = 'component-card';
  card.dataset.id = comp.id;

  const installDate = comp.installDate
    ? new Date(comp.installDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  card.innerHTML = `
    <div class="component-card-category">${escHtml(comp.category || 'Other')}</div>
    <div class="component-card-brand">${escHtml(comp.brand || '')}</div>
    <div class="component-card-model">${escHtml(comp.model || '—')}</div>
    <div class="component-card-meta">
      ${installDate ? `<span>Installed ${installDate}</span>` : ''}
      ${comp.notes ? `<span title="${escHtml(comp.notes)}">Has notes</span>` : ''}
    </div>
    <div class="component-card-actions">
      <button class="btn-icon-sm btn-edit-comp" title="Edit">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      </button>
      <button class="btn-icon-sm btn-delete-comp" title="Delete" style="color:var(--danger)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5.5 6.5v4M8.5 6.5v4M3 4l.75 7.5a.5.5 0 00.5.5h5.5a.5.5 0 00.5-.5L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `;

  card.querySelector('.btn-edit-comp').onclick = (e) => {
    e.stopPropagation();
    showComponentModal(comp, bike);
  };

  card.querySelector('.btn-delete-comp').onclick = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete ${comp.model || 'this component'}?`)) return;
    try {
      await deleteComponent(bike.id, comp.id);
      showToast('Component removed', 'success');
      renderComponentsTab(bike);
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  return card;
}

function showComponentModal(comp, bike) {
  const isEdit = !!comp;
  const data = comp || {};

  const categoryOptions = CATEGORIES.map(c =>
    `<option value="${c}" ${data.category === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  const body = `
    <div class="field-group">
      <label class="field-label" for="comp-category">Category</label>
      <select id="comp-category" class="field-select">
        <option value="">Select category...</option>
        ${categoryOptions}
      </select>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label" for="comp-brand">Brand</label>
        <input id="comp-brand" class="field-input" type="text" value="${escHtml(data.brand || '')}" placeholder="e.g. Fox, SRAM">
      </div>
      <div class="field-group">
        <label class="field-label" for="comp-model">Model</label>
        <input id="comp-model" class="field-input" type="text" value="${escHtml(data.model || '')}" placeholder="e.g. 38 Factory">
      </div>
    </div>
    <div class="field-group">
      <label class="field-label" for="comp-install-date">Install Date</label>
      <input id="comp-install-date" class="field-input" type="date" value="${data.installDate ? data.installDate.slice(0,10) : ''}">
    </div>
    <div class="field-group">
      <label class="field-label" for="comp-notes">Notes</label>
      <textarea id="comp-notes" class="field-input" rows="3">${escHtml(data.notes || '')}</textarea>
    </div>
  `;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save">${isEdit ? 'Save Changes' : 'Add Component'}</button>
  `;

  openModal(isEdit ? 'Edit Component' : 'Add Component', body, footer);

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save').onclick = async () => {
    const category   = document.getElementById('comp-category').value;
    const brand      = document.getElementById('comp-brand').value.trim();
    const model      = document.getElementById('comp-model').value.trim();
    const installDate = document.getElementById('comp-install-date').value || null;
    const notes      = document.getElementById('comp-notes').value.trim();

    if (!category) { showToast('Select a category', 'error'); return; }

    try {
      if (isEdit) {
        await updateComponent(bike.id, comp.id, { category, brand, model, installDate, notes });
        showToast('Component updated', 'success');
      } else {
        await createComponent(bike.id, { category, brand, model, installDate, notes });
        showToast('Component added', 'success');
      }
      closeModal();
      renderComponentsTab(bike);
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
