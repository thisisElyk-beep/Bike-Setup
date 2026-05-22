import { getBikes, createBike, updateBike, deleteBike } from './db.js';
import { createSilhouette, createMiniSilhouette, setupZoneInteraction, resetZoom } from './silhouette.js';
import { renderZoneSettings, renderSettingsPlaceholder } from './setup.js';
import { renderComponentsTab } from './components.js';
import { renderTestingTab } from './testing.js';
import { renderPresetsTab } from './presets.js';
import { exportBikePDF } from './export.js';

// ── STATE ─────────────────────────────────────────────────
let _bikes    = [];
let _bike     = null;
let _tab      = 'setup';

// ── DOM REFS ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  registerServiceWorker();
  initTheme();
  bindHeader();
  bindTabs();
  bindModal();

  await loadFleet();
  showView('bikes');
});

async function loadFleet() {
  try {
    _bikes = await getBikes();
  } catch (e) {
    // Firebase not configured yet
    _bikes = [];
    if (e.message?.includes('projectId') || e.code === 'failed-precondition') {
      showToast('Configure Firebase in js/config.js to persist data', 'info');
    }
  }
  renderFleet();
}

// ── FLEET VIEW ────────────────────────────────────────────
function renderFleet() {
  const grid  = $('bikes-grid');
  const empty = $('bikes-empty');
  grid.innerHTML = '';

  if (_bikes.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
  } else {
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    _bikes.forEach(b => grid.appendChild(buildBikeCard(b)));
  }
}

function buildBikeCard(bike) {
  const card = document.createElement('div');
  card.className = 'bike-card';
  card.dataset.id = bike.id;

  const mini = createMiniSilhouette(bike.type);
  const label = bikeTypeLabel(bike.type);
  const susp  = bike.type === 'mtb' ? (bike.suspensionType === 'hardtail' ? 'Hardtail' : 'Full Suspension') : '';

  card.innerHTML = `
    <div class="bike-card-silhouette">${mini}</div>
    <div class="bike-card-body">
      <div class="bike-card-type">${label}${susp ? ' · ' + susp : ''}</div>
      <div class="bike-card-name">${escHtml(bike.name)}</div>
      <div class="bike-card-stats">
        ${bike.baseline?.fork?.brand  ? `<span class="bike-card-stat">Fork: ${escHtml(bike.baseline.fork.brand)}</span>` : ''}
        ${bike.baseline?.shock?.brand ? `<span class="bike-card-stat">Shock: ${escHtml(bike.baseline.shock.brand)}</span>` : ''}
      </div>
    </div>
    <div class="bike-card-actions">
      <button class="btn-icon-sm btn-edit-bike" title="Rename bike">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2.5l2 2L3 12H1v-2L8.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      </button>
      <button class="btn-icon-sm btn-delete-bike" title="Delete bike" style="color:var(--danger)">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5 5.5v4M8 5.5v4M2.5 3.5l.75 7a.5.5 0 00.5.5h5.5a.5.5 0 00.5-.5l.75-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.bike-card-actions')) return;
    openBike(bike);
  });

  card.querySelector('.btn-edit-bike').onclick = (e) => {
    e.stopPropagation();
    showRenameBikeModal(bike);
  };

  card.querySelector('.btn-delete-bike').onclick = (e) => {
    e.stopPropagation();
    confirmDeleteBike(bike);
  };

  return card;
}

// ── BIKE DETAIL ───────────────────────────────────────────
function openBike(bike) {
  _bike = bike;
  _tab  = 'setup';

  // Update header
  $('logo-home').classList.add('hidden');
  $('btn-back').classList.remove('hidden');
  $('bike-name-header').textContent = bike.name;
  $('bike-name-header').classList.remove('hidden');
  $('btn-export').classList.remove('hidden');
  $('btn-add-bike-header').classList.add('hidden');

  showView('detail');
  activateTab('setup');
  loadSetupTab(bike);
}

function loadSetupTab(bike) {
  const container = $('silhouette-container');
  container.innerHTML = createSilhouette(bike);
  container.insertAdjacentHTML('beforeend', '<div class="silhouette-hint">Click a component to inspect &amp; edit</div>');

  const settingsContent = $('settings-content');
  renderSettingsPlaceholder(settingsContent);

  setupZoneInteraction(container, bike, (zoneId) => {
    if (!zoneId) {
      renderSettingsPlaceholder(settingsContent);
    } else {
      renderZoneSettings(zoneId, bike, settingsContent, (cancelled) => {
        if (cancelled) {
          renderSettingsPlaceholder(settingsContent);
          resetZoom(container.querySelector('#bike-svg'));
          $('btn-zoom-reset').classList.add('hidden');
        } else {
          // Refresh silhouette tooltip values after save
        }
      });
    }
  });

  $('btn-zoom-reset').onclick = () => {
    resetZoom(container.querySelector('#bike-svg'));
    $('btn-zoom-reset').classList.add('hidden');
    renderSettingsPlaceholder(settingsContent);
  };
}

// ── TABS ──────────────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!_bike) return;
      activateTab(btn.dataset.tab);
    });
  });
}

function activateTab(tab) {
  _tab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));

  if (!_bike) return;
  switch (tab) {
    case 'components': renderComponentsTab(_bike); break;
    case 'testing':    renderTestingTab(_bike);    break;
    case 'presets':    renderPresetsTab(_bike);    break;
  }
}

// ── VIEWS ─────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));

  if (name === 'bikes') {
    $('logo-home').classList.remove('hidden');
    $('btn-back').classList.add('hidden');
    $('bike-name-header').classList.add('hidden');
    $('btn-export').classList.add('hidden');
    $('btn-add-bike-header').classList.remove('hidden');
    _bike = null;
  }
}

// ── HEADER ────────────────────────────────────────────────
function bindHeader() {
  $('logo-home').onclick   = () => showView('bikes');
  $('btn-back').onclick    = () => showView('bikes');
  $('btn-theme').onclick   = toggleTheme;
  $('btn-export').onclick  = () => _bike && exportBikePDF(_bike);

  $('btn-add-bike-header').onclick = showAddBikeModal;
  $('btn-add-bike-hero').onclick   = showAddBikeModal;
  $('btn-add-bike-empty').onclick  = showAddBikeModal;
}

// ── ADD / RENAME / DELETE BIKE ────────────────────────────
function showAddBikeModal() {
  const body = `
    <div class="field-group">
      <label class="field-label" for="new-bike-name">Bike Name</label>
      <input id="new-bike-name" class="field-input" type="text" placeholder="e.g. Yeti SB160, Evil Offering">
    </div>

    <div class="field-group" style="margin-top:1.1rem">
      <label class="field-label">Bike Type</label>
      <div class="bike-type-grid">
        ${bikeTypeOption('mtb', 'Mountain Bike', iconMTB(), true)}
        ${bikeTypeOption('emtb', 'E-MTB', iconEMTB(), false)}
        ${bikeTypeOption('gravel', 'Gravel', iconGravel(), false)}
        ${bikeTypeOption('road', 'Road', iconRoad(), false)}
        ${bikeTypeOption('dirtjumper', 'Dirt Jumper', iconDJ(), false)}
      </div>
    </div>

    <div id="suspension-toggle-row" class="field-group" style="margin-top:1rem">
      <label class="field-label">Suspension</label>
      <div class="radio-toggle">
        <input type="radio" id="susp-full"     name="susp-type" value="full"     checked>
        <label for="susp-full">Full Suspension</label>
        <input type="radio" id="susp-hardtail" name="susp-type" value="hardtail">
        <label for="susp-hardtail">Hardtail</label>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary"   id="modal-add-bike">Add Bike</button>
  `;

  openModal('Add New Bike', body, footer);

  const nameInput = $('new-bike-name');
  nameInput.focus();

  // Show/hide suspension toggle based on type
  document.querySelectorAll('input[name="bike-type"]').forEach(r => {
    r.addEventListener('change', () => {
      const showSusp = ['mtb', 'emtb'].includes(r.value);
      $('suspension-toggle-row').style.display = showSusp ? '' : 'none';
    });
  });

  $('modal-cancel').onclick = closeModal;
  $('modal-add-bike').onclick = async () => {
    const name = nameInput.value.trim();
    if (!name) { showToast('Enter a bike name', 'error'); return; }

    const type = document.querySelector('input[name="bike-type"]:checked')?.value || 'mtb';
    const suspensionType = document.querySelector('input[name="susp-type"]:checked')?.value || 'full';

    try {
      const id = await createBike({ name, type, suspensionType, baseline: {} });
      const newBike = { id, name, type, suspensionType, baseline: {} };
      _bikes.push(newBike);
      showToast(`${name} added`, 'success');
      closeModal();
      renderFleet();
      openBike(newBike);
    } catch (e) {
      showToast('Failed to create bike: ' + e.message, 'error');
    }
  };
}

function showRenameBikeModal(bike) {
  const body = `
    <div class="field-group">
      <label class="field-label" for="rename-bike-input">Bike Name</label>
      <input id="rename-bike-input" class="field-input" type="text" value="${escHtml(bike.name)}">
    </div>
  `;
  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-rename">Save</button>
  `;
  openModal('Rename Bike', body, footer);
  const input = $('rename-bike-input');
  input.focus(); input.select();

  $('modal-cancel').onclick = closeModal;
  $('modal-rename').onclick = async () => {
    const name = input.value.trim();
    if (!name) return;
    try {
      await updateBike(bike.id, { name });
      bike.name = name;
      _bikes = _bikes.map(b => b.id === bike.id ? { ...b, name } : b);
      showToast('Renamed', 'success');
      closeModal();
      renderFleet();
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  };
}

async function confirmDeleteBike(bike) {
  if (!confirm(`Delete "${bike.name}" and all its data? This cannot be undone.`)) return;
  try {
    await deleteBike(bike.id);
    _bikes = _bikes.filter(b => b.id !== bike.id);
    showToast('Bike deleted', 'success');
    renderFleet();
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error');
  }
}

// ── MODAL ─────────────────────────────────────────────────
function bindModal() {
  $('modal-overlay').addEventListener('click', e => {
    if (e.target === $('modal-overlay')) closeModal();
  });
  $('modal-close').onclick = closeModal;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

export function openModal(title, bodyHTML, footerHTML = '') {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML    = bodyHTML;
  $('modal-footer').innerHTML  = footerHTML;
  $('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  $('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── TOAST ─────────────────────────────────────────────────
export function showToast(message, type = 'info') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${type === 'success' ? '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 8L6 11.5L12.5 4" stroke="var(--success)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
    ${type === 'error' ? '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 3l9 9M12 3L3 12" stroke="var(--danger)" stroke-width="1.6" stroke-linecap="round"/></svg>' : ''}
    ${type === 'info' ? '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="var(--accent)" stroke-width="1.4"/><path d="M7.5 5v1M7.5 7.5v3" stroke="var(--accent)" stroke-width="1.4" stroke-linecap="round"/></svg>' : ''}
    ${message}
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── THEME ─────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('dialed-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('dialed-theme', next);
}

// ── SERVICE WORKER ────────────────────────────────────────
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

// ── BIKE TYPE OPTIONS ─────────────────────────────────────
function bikeTypeOption(value, label, iconSvg, checked) {
  return `
    <div class="bike-type-option">
      <input type="radio" id="type-${value}" name="bike-type" value="${value}" ${checked ? 'checked' : ''}>
      <label for="type-${value}">${iconSvg}${label}</label>
    </div>
  `;
}

function bikeTypeLabel(type) {
  const map = { mtb: 'Mountain Bike', emtb: 'E-MTB', gravel: 'Gravel', road: 'Road', dirtjumper: 'Dirt Jumper' };
  return map[type] || type;
}

// ── SVG ICONS ─────────────────────────────────────────────
function iconMTB() {
  return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="19" r="6" stroke-width="1.8"/>
    <circle cx="32" cy="19" r="6" stroke-width="1.8"/>
    <path d="M8 19 L16 8 L22 13 L32 5 L32 19" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <line x1="20" y1="9" x2="22" y2="13" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

function iconEMTB() {
  return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="19" r="6" stroke-width="1.8"/>
    <circle cx="32" cy="19" r="6" stroke-width="1.8"/>
    <path d="M8 19 L16 8 L22 13 L32 5 L32 19" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <rect x="16" y="14" width="8" height="5" rx="1" stroke-width="1.3" opacity="0.8"/>
    <path d="M20 13L18.5 16.5H21L19.5 20" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function iconGravel() {
  return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="19" r="6" stroke-width="1.5"/>
    <circle cx="32" cy="19" r="6" stroke-width="1.5"/>
    <path d="M8 19 L16 9 L28 9 L32 19" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M26 8 C28 5 30 5 32 8" fill="none" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
}

function iconRoad() {
  return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="19" r="6" stroke-width="1.2"/>
    <circle cx="32" cy="19" r="6" stroke-width="1.2"/>
    <path d="M8 19 L15 10 L28 10 L32 19" stroke-width="1.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M27 9 C28 6 30 6 32 9" fill="none" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;
}

function iconDJ() {
  return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="19" r="5.5" stroke-width="1.8"/>
    <circle cx="32" cy="19" r="5.5" stroke-width="1.8"/>
    <path d="M8 19 L16 10 L23 14 L32 5" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <line x1="23" y1="14" x2="32" y2="19" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
