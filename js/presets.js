import { getPresets, createPreset, deletePreset, updateBike } from './db.js';
import { showToast, openModal, closeModal } from './utils.js';

export async function renderPresetsTab(bike) {
  const grid  = document.getElementById('presets-grid');
  const empty = document.getElementById('presets-empty');
  grid.innerHTML = '<div style="padding:1rem;color:var(--text-muted);font-size:.85rem">Loading...</div>';

  try {
    const presets = await getPresets(bike.id);
    grid.innerHTML = '';

    if (presets.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
    } else {
      grid.classList.remove('hidden');
      empty.classList.add('hidden');
      presets.forEach(p => grid.appendChild(buildPresetCard(p, bike)));
    }
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--danger);padding:1rem">Error: ${e.message}</p>`;
  }

  document.getElementById('btn-save-preset').onclick = () => showSavePresetModal(bike);
}

function buildPresetCard(preset, bike) {
  const card = document.createElement('div');
  card.className = 'preset-card';

  const date = preset.createdAt?.toDate
    ? preset.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : preset.createdAt
      ? new Date(preset.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

  const summary = buildPresetSummary(preset.settings || {});

  card.innerHTML = `
    <div class="preset-card-name">${escHtml(preset.name)}</div>
    <div class="preset-card-date">Saved ${date}</div>
    <div class="preset-card-summary">
      ${summary.map(({ key, val }) => `
        <div class="preset-summary-item">
          <span class="preset-summary-key">${escHtml(key)}</span>
          <span class="preset-summary-val">${escHtml(val)}</span>
        </div>
      `).join('')}
      ${summary.length === 0 ? '<span style="font-size:.78rem;color:var(--text-muted)">No settings recorded</span>' : ''}
    </div>
    <div class="preset-card-actions">
      <button class="btn-icon-sm btn-delete-preset" title="Delete" style="color:var(--danger)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5.5 6.5v4M8.5 6.5v4M3 4l.75 7.5a.5.5 0 00.5.5h5.5a.5.5 0 00.5-.5L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.btn-delete-preset')) return;
    confirmLoadPreset(preset, bike);
  });

  card.querySelector('.btn-apply-preset')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm(`Apply "${preset.name}" to your current baseline? This will overwrite your existing setup.`)) return;
    try {
      await updateBike(bike.id, { baseline: preset.data });
      bike.baseline = preset.data;
      showToast(`"${preset.name}" applied to baseline`, 'success');
    } catch(err) { showToast('Failed to apply preset', 'error'); }
  });

  card.querySelector('.btn-delete-preset').onclick = (e) => {
    e.stopPropagation();
    confirmDeletePreset(preset, bike);
  };

  return card;
}

function buildPresetSummary(settings) {
  const items = [];
  const ft = settings.frontTire;
  const rt = settings.rearTire;
  const fk = settings.fork;
  const sk = settings.shock;

  if (ft?.psi != null) items.push({ key: 'F Tire', val: `${ft.psi} psi` });
  if (rt?.psi != null) items.push({ key: 'R Tire', val: `${rt.psi} psi` });
  if (fk?.psi != null) items.push({ key: 'Fork',   val: `${fk.psi} psi` });
  if (sk?.psi != null) items.push({ key: 'Shock',  val: `${sk.psi} psi` });
  if (fk?.lsr != null) items.push({ key: 'Fork LSR', val: `${fk.lsr} clicks` });
  if (fk?.lsc != null) items.push({ key: 'Fork LSC', val: `${fk.lsc} clicks` });
  if (sk?.lsr != null) items.push({ key: 'Shock LSR', val: `${sk.lsr} clicks` });
  if (sk?.lsc != null) items.push({ key: 'Shock LSC', val: `${sk.lsc} clicks` });

  return items.slice(0, 6); // cap at 6 rows for card size
}

// ── SAVE PRESET MODAL ─────────────────────────────────────

function showSavePresetModal(bike) {
  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:1.25rem">
      Saves your current baseline as a named preset you can recall later.
    </p>
    <div class="field-group">
      <label class="field-label" for="preset-name">Preset Name</label>
      <input id="preset-name" class="field-input" type="text"
        placeholder="e.g. Whistler DH, Enduro race day, Singletrack mellow">
    </div>
  `;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-preset">Save Preset</button>
  `;

  openModal('Save as Preset', body, footer);

  const input = document.getElementById('preset-name');
  input.focus();

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save-preset').onclick = async () => {
    const name = input.value.trim();
    if (!name) { showToast('Enter a preset name', 'error'); return; }

    try {
      await createPreset(bike.id, {
        name,
        settings: bike.baseline || {},
      });
      showToast(`"${name}" saved`, 'success');
      closeModal();
      renderPresetsTab(bike);
    } catch (e) {
      showToast('Failed to save: ' + e.message, 'error');
    }
  };
}

// ── LOAD PRESET ───────────────────────────────────────────

function confirmLoadPreset(preset, bike) {
  const body = `
    <p style="font-size:.9rem;color:var(--text-secondary);line-height:1.6">
      Load <strong style="color:var(--text-primary)">${escHtml(preset.name)}</strong> as your baseline?
      <br><br>
      This will overwrite your current baseline settings. Consider saving a preset first if you want to keep them.
    </p>
  `;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-confirm-load">Load Preset</button>
  `;

  openModal('Load Preset', body, footer);

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-confirm-load').onclick = async () => {
    try {
      await updateBike(bike.id, { baseline: preset.settings });
      bike.baseline = preset.settings;
      showToast(`Baseline updated to "${preset.name}"`, 'success');
      closeModal();
      renderPresetsTab(bike);
    } catch (e) {
      showToast('Failed to load: ' + e.message, 'error');
    }
  };
}

// ── DELETE PRESET ─────────────────────────────────────────

async function confirmDeletePreset(preset, bike) {
  if (!confirm(`Delete preset "${preset.name}"?`)) return;
  try {
    await deletePreset(bike.id, preset.id);
    showToast('Preset deleted', 'success');
    renderPresetsTab(bike);
  } catch (e) {
    showToast('Delete failed', 'error');
  }
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
