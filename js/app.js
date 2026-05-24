import { getBikes, createBike, updateBike, deleteBike } from './db.js';
import { getPresets } from './db.js';
import { createSilhouette, createMiniSilhouette, setupZoneInteraction, resetZoom } from './silhouette.js';
import { renderZoneSettings, renderSettingsPlaceholder } from './setup.js';
import { renderComponentsTab } from './components.js';
import { renderTestingTab } from './testing.js';
import { renderPresetsTab } from './presets.js';
import { exportBikePDF } from './export.js';

// ── STATE ─────────────────────────────────────────────────
let _bikes = [];
let _bike  = null;
let _tab   = 'setup';
let _scratchpadTimer = null;

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

  const mini  = createMiniSilhouette(bike.type);
  const label = bikeTypeLabel(bike.type);
  const susp  = bike.type === 'mtb' ? (bike.suspensionType === 'hardtail' ? 'Hardtail' : 'Full Suspension') : '';

  // Key stats for card — show up to 3 meaningful values
  const bl = bike.baseline || {};
  const stats = [
    bl.fork?.brand  && bl.fork?.psi  ? `Fork ${bl.fork.psi} psi`   : bl.fork?.brand  ? `Fork: ${bl.fork.brand}`   : null,
    bl.shock?.brand && bl.shock?.psi ? `Shock ${bl.shock.psi} psi` : bl.shock?.brand ? `Shock: ${bl.shock.brand}` : null,
    bl.frontTire?.psi ? `F ${bl.frontTire.psi} / R ${bl.rearTire?.psi ?? '?'} psi` : null,
  ].filter(Boolean).slice(0, 3);

  card.innerHTML = `
    <div class="bike-card-silhouette">${mini}</div>
    <div class="bike-card-body">
      <div class="bike-card-type">${label}${susp ? ' · ' + susp : ''}</div>
      <div class="bike-card-name">${escHtml(bike.name)}</div>
      <div class="bike-card-stats">
        ${stats.length ? stats.map(s => `<span class="bike-card-stat">${escHtml(s)}</span>`).join('') : '<span class="bike-card-stat" style="color:var(--text-muted)">No setup yet</span>'}
      </div>
    </div>
    <div class="bike-card-actions">
      <button class="btn-icon-sm btn-dupe-bike" title="Duplicate bike">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      </button>
      <button class="btn-icon-sm btn-edit-bike" title="Rename bike">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2.5l2 2L3 12H1v-2L8.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      </button>
      <button class="btn-icon-sm btn-delete-bike" title="Delete bike" style="color:var(--danger)">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5 5.5v4M8 5.5v4M2.5 3.5l.75 7a.5.5 0 00.5.5h5.5a.5.5 0 00.5-.5l.75-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `;

  card.addEventListener('click', e => { if (e.target.closest('.bike-card-actions')) return; openBike(bike); });
  card.querySelector('.btn-dupe-bike').onclick   = e => { e.stopPropagation(); duplicateBike(bike); };
  card.querySelector('.btn-edit-bike').onclick   = e => { e.stopPropagation(); showRenameBikeModal(bike); };
  card.querySelector('.btn-delete-bike').onclick = e => { e.stopPropagation(); confirmDeleteBike(bike); };
  return card;
}

// ── BIKE DETAIL ───────────────────────────────────────────
function openBike(bike) {
  _bike = bike;
  _tab  = 'setup';
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
          // Redraw dots after save
          const svg = container.querySelector('#bike-svg');
          if (svg) {
            const { drawZoneDots, updateCompletenessRing, getAvailableZones } = {};
            // Re-run zone interaction to refresh dots
            setupZoneInteraction(container, bike, arguments.callee);
          }
        }
      });
    }
  });

  $('btn-zoom-reset').onclick = () => {
    resetZoom(container.querySelector('#bike-svg'));
    $('btn-zoom-reset').classList.add('hidden');
    renderSettingsPlaceholder(settingsContent);
  };

  // Silhouette collapse toggle (mobile)
  const collapseBtn = $('btn-collapse-silhouette');
  const silPanel    = $('silhouette-container')?.closest('.silhouette-panel');
  if (collapseBtn && silPanel) {
    collapseBtn.onclick = () => {
      const collapsed = silPanel.classList.toggle('silhouette-collapsed');
      const icon = $('collapse-icon');
      if (icon) icon.style.transform = collapsed ? 'rotate(180deg)' : '';
    };
  }

  // Scratchpad
  initScratchpad(bike);

  // Preset quick-load
  initPresetQuickLoad(bike, container, settingsContent);
}

// ── SCRATCHPAD ────────────────────────────────────────────
function initScratchpad(bike) {
  const area  = $('scratchpad-area');
  const input = $('scratchpad-input');
  const hint  = $('scratchpad-saving');
  if (!area || !input) return;

  area.style.display = '';
  input.value = bike.notes || '';
  if (hint) hint.textContent = '';

  input.oninput = () => {
    if (_scratchpadTimer) clearTimeout(_scratchpadTimer);
    if (hint) hint.textContent = 'Saving...';
    _scratchpadTimer = setTimeout(async () => {
      try {
        await updateBike(bike.id, { notes: input.value });
        bike.notes = input.value;
        if (hint) { hint.textContent = 'Saved'; setTimeout(() => { if (hint) hint.textContent = ''; }, 1500); }
      } catch { if (hint) hint.textContent = 'Save failed'; }
    }, 900);
  };
}

// ── PRESET QUICK-LOAD ─────────────────────────────────────
async function initPresetQuickLoad(bike, container, settingsContent) {
  const wrapper = $('preset-quick-load');
  const select  = $('preset-quick-select');
  if (!wrapper || !select) return;

  try {
    const presets = await getPresets(bike.id);
    if (presets.length === 0) { wrapper.style.display = 'none'; return; }
    wrapper.style.display = 'flex';
    select.innerHTML = '<option value="">Load preset...</option>' +
      presets.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');

    select.onchange = async () => {
      const id = select.value;
      if (!id) return;
      const preset = presets.find(p => p.id === id);
      if (!preset) return;
      if (!confirm(`Load "${preset.name}" as baseline?`)) { select.value = ''; return; }
      try {
        await updateBike(bike.id, { baseline: preset.settings });
        bike.baseline = preset.settings;
        showToast(`"${preset.name}" loaded`, 'success');
        select.value = '';
        loadSetupTab(bike); // refresh
      } catch (e) {
        showToast('Failed to load preset', 'error');
      }
    };
  } catch { wrapper.style.display = 'none'; }
}

// ── TABS ──────────────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (!_bike) return; activateTab(btn.dataset.tab); });
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
    $('scratchpad-area').style.display = 'none';
    $('preset-quick-load').style.display = 'none';
    _bike = null;
  }
}

// ── HEADER ────────────────────────────────────────────────
function bindHeader() {
  $('logo-home').onclick  = () => showView('bikes');
  $('btn-back').onclick   = () => showView('bikes');
  $('btn-theme').onclick  = toggleTheme;
  $('btn-export').onclick = () => _bike && exportBikePDF(_bike);
  $('btn-add-bike-header').onclick = showAddBikeModal;
  $('btn-add-bike-hero').onclick   = showAddBikeModal;
  $('btn-add-bike-empty').onclick  = showAddBikeModal;
}

// ── ADD BIKE + ONBOARDING ─────────────────────────────────
function showAddBikeModal() {
  const body = `
    <div class="field-group">
      <label class="field-label" for="new-bike-name">Bike Name</label>
      <input id="new-bike-name" class="field-input" type="text" placeholder="e.g. Yeti SB160, Evil Offering">
    </div>
    <div class="field-group" style="margin-top:1.1rem">
      <label class="field-label">Bike Type</label>
      <div class="bike-type-grid">
        ${bikeTypeOption('mtb',        'Mountain Bike', iconMTB(),    true)}
        ${bikeTypeOption('emtb',       'E-MTB',         iconEMTB(),   false)}
        ${bikeTypeOption('gravel',     'Gravel',         iconGravel(), false)}
        ${bikeTypeOption('road',       'Road',           iconRoad(),   false)}
        ${bikeTypeOption('dirtjumper', 'Dirt Jumper',    iconDJ(),     false)}
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
    <button class="btn-primary"   id="modal-add-bike">Next: Quick Setup →</button>
  `;
  openModal('Add New Bike', body, footer);
  const nameInput = $('new-bike-name');
  nameInput.focus();

  document.querySelectorAll('input[name="bike-type"]').forEach(r => {
    r.addEventListener('change', () => {
      $('suspension-toggle-row').style.display = ['mtb','emtb'].includes(r.value) ? '' : 'none';
    });
  });

  $('modal-cancel').onclick = closeModal;
  $('modal-add-bike').onclick = async () => {
    const name = nameInput.value.trim();
    if (!name) { showToast('Enter a bike name', 'error'); return; }
    const type          = document.querySelector('input[name="bike-type"]:checked')?.value || 'mtb';
    const suspensionType = document.querySelector('input[name="susp-type"]:checked')?.value || 'full';
    try {
      const id      = await createBike({ name, type, suspensionType, baseline: {} });
      const newBike = { id, name, type, suspensionType, baseline: {} };
      _bikes.push(newBike);
      closeModal();
      showOnboarding(newBike);
    } catch (e) {
      showToast('Failed to create bike: ' + e.message, 'error');
    }
  };
}

function showOnboarding(bike) {
  const isMTB = ['mtb','emtb'].includes(bike.type);
  const isFS  = bike.suspensionType === 'full';

  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:1.25rem;line-height:1.6">
      Fill in what you know now — you can always update these later from the Setup tab.
    </p>
    <div class="settings-section-divider" style="margin-top:0">Frame</div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">Brand</label><input id="ob-frame-brand" class="field-input" type="text" placeholder="e.g. Santa Cruz"></div>
      <div class="field-group"><label class="field-label">Model</label><input id="ob-frame-model" class="field-input" type="text" placeholder="e.g. Bronson CC"></div>
    </div>
    ${isMTB ? `
    <div class="settings-section-divider">Fork</div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">Brand</label><input id="ob-fork-brand" class="field-input" type="text" placeholder="e.g. Fox, RockShox"></div>
      <div class="field-group"><label class="field-label">Model</label><input id="ob-fork-model" class="field-input" type="text" placeholder="e.g. 38 Factory"></div>
    </div>
    <div class="field-group">
      <label class="field-label">Air Pressure (PSI)</label>
      <div class="range-container">
        <input type="range" id="ob-fork-psi" min="50" max="300" step="1" value="80" class="range-slider"/>
        <span class="range-val"><span id="val-ob-fork-psi">80</span> psi</span>
      </div>
    </div>
    ` : ''}
    ${isMTB && isFS ? `
    <div class="settings-section-divider">Rear Shock</div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">Brand</label><input id="ob-shock-brand" class="field-input" type="text" placeholder="e.g. Fox, RockShox"></div>
      <div class="field-group"><label class="field-label">Model</label><input id="ob-shock-model" class="field-input" type="text" placeholder="e.g. Float X2"></div>
    </div>
    <div class="field-group">
      <label class="field-label">Air Pressure (PSI)</label>
      <div class="range-container">
        <input type="range" id="ob-shock-psi" min="50" max="350" step="1" value="140" class="range-slider"/>
        <span class="range-val"><span id="val-ob-shock-psi">140</span> psi</span>
      </div>
    </div>
    ` : ''}
    <div class="settings-section-divider">Tires</div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Front PSI</label>
        <div class="range-container">
          <input type="range" id="ob-ft-psi" min="10" max="60" step="0.5" value="25" class="range-slider"/>
          <span class="range-val"><span id="val-ob-ft-psi">25</span> psi</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Rear PSI</label>
        <div class="range-container">
          <input type="range" id="ob-rt-psi" min="10" max="60" step="0.5" value="27" class="range-slider"/>
          <span class="range-val"><span id="val-ob-rt-psi">27</span> psi</span>
        </div>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn-secondary" id="ob-skip">Skip for now</button>
    <button class="btn-primary"   id="ob-save">Save &amp; Open Bike</button>
  `;

  openModal(`Quick Setup — ${bike.name}`, body, footer);

  // Range live update
  document.querySelectorAll('#modal-body input[type="range"]').forEach(r => {
    const valEl = document.getElementById(`val-${r.id}`);
    r.addEventListener('input', () => { if (valEl) valEl.textContent = r.value; });
  });

  const finish = async (save) => {
    if (save) {
      const val = id => document.getElementById(id)?.value?.trim() || '';
      const num = id => { const v = document.getElementById(id)?.value; return v ? parseFloat(v) : null; };
      const baseline = {
        frame:     { brand: val('ob-frame-brand'), model: val('ob-frame-model') },
        frontTire: { psi: num('ob-ft-psi') },
        rearTire:  { psi: num('ob-rt-psi') },
      };
      if (isMTB) {
        baseline.fork  = { brand: val('ob-fork-brand'),  model: val('ob-fork-model'),  type: 'air', psi: num('ob-fork-psi')  };
      }
      if (isMTB && isFS) {
        baseline.shock = { brand: val('ob-shock-brand'), model: val('ob-shock-model'), type: 'air', psi: num('ob-shock-psi') };
      }
      try {
        await updateBike(bike.id, { baseline });
        bike.baseline = baseline;
      } catch {}
    }
    closeModal();
    renderFleet();
    openBike(bike);
    showToast(`${bike.name} added`, 'success');
  };

  $('ob-skip').onclick = () => finish(false);
  $('ob-save').onclick = () => finish(true);
}

// ── DUPLICATE BIKE ────────────────────────────────────────
async function duplicateBike(bike) {
  const name = `${bike.name} (copy)`;
  try {
    const id      = await createBike({ name, type: bike.type, suspensionType: bike.suspensionType, baseline: bike.baseline || {} });
    const newBike = { id, name, type: bike.type, suspensionType: bike.suspensionType, baseline: bike.baseline || {} };
    _bikes.push(newBike);
    showToast(`Duplicated as "${name}"`, 'success');
    renderFleet();
  } catch (e) {
    showToast('Duplicate failed: ' + e.message, 'error');
  }
}

// ── RENAME / DELETE ───────────────────────────────────────
function showRenameBikeModal(bike) {
  const body   = `<div class="field-group"><label class="field-label">Bike Name</label><input id="rename-bike-input" class="field-input" type="text" value="${escHtml(bike.name)}"></div>`;
  const footer = `<button class="btn-secondary" id="modal-cancel">Cancel</button><button class="btn-primary" id="modal-rename">Save</button>`;
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
      _bikes = _bikes.map(b => b.id === bike.id ? {...b, name} : b);
      showToast('Renamed', 'success');
      closeModal();
      renderFleet();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };
}

async function confirmDeleteBike(bike) {
  if (!confirm(`Delete "${bike.name}" and all its data? This cannot be undone.`)) return;
  try {
    await deleteBike(bike.id);
    _bikes = _bikes.filter(b => b.id !== bike.id);
    showToast('Bike deleted', 'success');
    renderFleet();
  } catch (e) { showToast('Delete failed: ' + e.message, 'error'); }
}

// ── MODAL ─────────────────────────────────────────────────
function bindModal() {
  $('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) closeModal(); });
  $('modal-close').onclick = closeModal;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
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
    ${type === 'error'   ? '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 3l9 9M12 3L3 12" stroke="var(--danger)" stroke-width="1.6" stroke-linecap="round"/></svg>' : ''}
    ${type === 'info'    ? '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="var(--accent)" stroke-width="1.4"/><path d="M7.5 5v1M7.5 7.5v3" stroke="var(--accent)" stroke-width="1.4" stroke-linecap="round"/></svg>' : ''}
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
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('dialed-theme', next);
}

// ── SERVICE WORKER ────────────────────────────────────────
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }
}

// ── BIKE TYPE OPTIONS ─────────────────────────────────────
function bikeTypeOption(value, label, iconSvg, checked) {
  return `<div class="bike-type-option"><input type="radio" id="type-${value}" name="bike-type" value="${value}" ${checked?'checked':''}><label for="type-${value}">${iconSvg}${label}</label></div>`;
}
function bikeTypeLabel(type) {
  return {mtb:'Mountain Bike',emtb:'E-MTB',gravel:'Gravel',road:'Road',dirtjumper:'Dirt Jumper'}[type] || type;
}

// ── SVG ICONS ─────────────────────────────────────────────
function iconMTB() { return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none"><circle cx="8" cy="19" r="6" stroke-width="1.8"/><circle cx="32" cy="19" r="6" stroke-width="1.8"/><path d="M8 19 L16 8 L22 13 L32 5 L32 19" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><line x1="20" y1="9" x2="22" y2="13" stroke-width="1.5" stroke-linecap="round"/></svg>`; }
function iconEMTB() { return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none"><circle cx="8" cy="19" r="6" stroke-width="1.8"/><circle cx="32" cy="19" r="6" stroke-width="1.8"/><path d="M8 19 L16 8 L22 13 L32 5 L32 19" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><rect x="16" y="14" width="8" height="5" rx="1" stroke-width="1.3" opacity="0.8"/><path d="M20 13L18.5 16.5H21L19.5 20" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconGravel() { return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none"><circle cx="8" cy="19" r="6" stroke-width="1.5"/><circle cx="32" cy="19" r="6" stroke-width="1.5"/><path d="M8 19 L16 9 L28 9 L32 19" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M26 8 C28 5 30 5 32 8" fill="none" stroke-width="1.3" stroke-linecap="round"/></svg>`; }
function iconRoad() { return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none"><circle cx="8" cy="19" r="6" stroke-width="1.2"/><circle cx="32" cy="19" r="6" stroke-width="1.2"/><path d="M8 19 L15 10 L28 10 L32 19" stroke-width="1.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M27 9 C28 6 30 6 32 9" fill="none" stroke-width="1.2" stroke-linecap="round"/></svg>`; }
function iconDJ() { return `<svg width="40" height="26" viewBox="0 0 40 26" fill="none"><circle cx="8" cy="19" r="5.5" stroke-width="1.8"/><circle cx="32" cy="19" r="5.5" stroke-width="1.8"/><path d="M8 19 L16 10 L23 14 L32 5" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><line x1="23" y1="14" x2="32" y2="19" stroke-width="1.5" stroke-linecap="round"/></svg>`; }

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
