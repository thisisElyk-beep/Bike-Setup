// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams
// All geometry mathematically verified in Node.js
// Top tube slopes upward toward head tube on every bike ✓
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

const ZONE_META = {
  'front-wheel': { label: 'Front Wheel / Tire', vb: [499, 205, 319, 290], key: 'frontTire' },
  'rear-wheel':  { label: 'Rear Wheel / Tire',  vb: [-11, 205, 319, 290], key: 'reimport { getBikes, createBike, updateBike, deleteBike } from './db.js';
import { initProfile, showProfilePicker, renderProfileChip, THEMES, getProfileTheme, setProfileTheme, applyTheme } from './profiles.js';
import { getPresets } from './db.js';
import { createSilhouette, createMiniSilhouette, setupZoneInteraction, resetZoom, createCockpitFrontView, setupCockpitInteraction } from './silhouette.js';
import { renderZoneSettings, renderSettingsPlaceholder, renderCockpitSubZone } from './setup.js';
import { renderComponentsTab } from './components.js';
import { renderQuickAdjustTab } from './quickadjust.js';
import { renderRidesTab } from './rides.js';
import { renderTestingTab } from './testing.js';
import { renderPresetsTab } from './presets.js';
import { exportBikePDF, copySetupSummary } from './export.js';

// ── STATE ─────────────────────────────────────────────────
let _bikes = [];
let _bike  = null;
let _tab   = 'setup';
let _cockpitMode    = false;
let _scratchpadTimer = null;

const $ = id => document.getElementById(id);

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  registerServiceWorker();
  initTheme();
  updateThemeBtn(document.documentElement.getAttribute('data-theme') || 'dark');
  bindHeader();
  bindTabs();
  bindModal();

  const activeProfileId = initProfile();
  if (!activeProfileId) {
    // No profile selected yet — show picker before loading fleet
    showProfilePicker(profileId => {
      renderProfileChip(profileId, newProfileId => {
        showView('bikes');
        loadFleet();
      });
      showView('bikes');
      loadFleet();
    });
  } else {
    renderProfileChip(activeProfileId, newProfileId => {
      showView('bikes');
      loadFleet();
    });
    await loadFleet();
    showView('bikes');
  }
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

  card.innerHTML = `
    <div class="bike-card-silhouette">${mini}</div>
    <div class="bike-card-body">
      <div class="bike-card-type">${label}${susp ? ' · ' + susp : ''}</div>
      <div class="bike-card-name">${escHtml(bike.name)}</div>
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
  const nameBtn = $('bike-name-header');
  nameBtn.innerHTML = `${escHtml(bike.name)}<svg class="rename-icon" width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 1.5l2.5 2.5L3 10H.5V7.5L7 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  nameBtn.classList.remove('hidden');
  nameBtn.onclick = () => showRenameBikeModal(bike);
  // Rides tab: road/gravel only. Test Mode tab: MTB/DJ/hardtail only.
  const ridesTab   = $('tab-btn-rides');
  const testingTab = $('tab-btn-testing');
  const isRoadGravel = ['road','gravel'].includes(bike.type);
  if (ridesTab)   ridesTab.classList.toggle('hidden',   !isRoadGravel);
  if (testingTab) testingTab.classList.toggle('hidden',  isRoadGravel);
  $('btn-export').classList.remove('hidden');
  $('btn-add-bike-header').classList.add('hidden');
  showView('detail');
  activateTab('setup');
  loadSetupTab(bike);
}

function loadSetupTab(bike) {
  _cockpitMode = false;
  const container       = $('silhouette-container');
  const settingsContent = $('settings-content');

  container.innerHTML = createSilhouette(bike);
  container.insertAdjacentHTML('beforeend', '<div class="silhouette-hint">Click a component to inspect &amp; edit</div>');
  renderSettingsPlaceholder(settingsContent);

  setupZoneInteraction(container, bike, (zoneId) => {
    if (!zoneId) {
      renderSettingsPlaceholder(settingsContent);
    } else if (zoneId === 'handlebar') {
      enterCockpitMode(bike, container, settingsContent);
    } else {
      renderZoneSettings(zoneId, bike, settingsContent, (cancelled) => {
        if (cancelled) {
          renderSettingsPlaceholder(settingsContent);
          resetZoom(container.querySelector('#bike-svg'));
          $('btn-zoom-reset').classList.add('hidden');
        } else {
          import('./silhouette.js').then(({ setupZoneInteraction: reInit }) => {
            reInit(container, bike, () => {});
          });
        }
      });
    }
  });

  const zoomBtn = $('btn-zoom-reset');
  zoomBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1h4M1 1v4M12 12h-4M12 12v-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg> Reset View`;
  zoomBtn.classList.add('hidden');
  zoomBtn.onclick = () => {
    if (_cockpitMode) {
      exitCockpitMode(bike);
    } else {
      resetZoom(container.querySelector('#bike-svg'));
      zoomBtn.classList.add('hidden');
      renderSettingsPlaceholder(settingsContent);
    }
  };

  const collapseBtn = $('btn-collapse-silhouette');
  const silPanel    = container.closest('.silhouette-panel');
  if (collapseBtn && silPanel) {
    collapseBtn.onclick = () => {
      const collapsed = silPanel.classList.toggle('silhouette-collapsed');
      const icon = $('collapse-icon');
      if (icon) icon.style.transform = collapsed ? 'rotate(180deg)' : '';
    };
  }

  initScratchpad(bike);
  initPresetQuickLoad(bike, container, settingsContent);
}

function enterCockpitMode(bike, container, settingsContent) {
  _cockpitMode = true;
  const currentSvg = container.querySelector('svg');
  if (currentSvg) { currentSvg.style.transition = 'opacity 0.22s ease'; currentSvg.style.opacity = '0'; }

  const zoomBtn = $('btn-zoom-reset');
  zoomBtn.classList.remove('hidden');
  zoomBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 2L3 7l5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Bike View`;

  setTimeout(() => {
    container.innerHTML = createCockpitFrontView(bike);
    container.insertAdjacentHTML('beforeend', '<div class="silhouette-hint">Click a component to inspect &amp; edit</div>');
    renderSettingsPlaceholder(settingsContent);

    const newSvg = container.querySelector('svg');
    if (newSvg) {
      newSvg.style.opacity = '0';
      newSvg.style.transition = 'opacity 0.22s ease';
      requestAnimationFrame(() => { newSvg.style.opacity = '1'; });
    }

    setupCockpitInteraction(container, bike, (subZone) => {
      if (!subZone) { exitCockpitMode(bike); return; }
      renderCockpitSubZone(subZone, bike, settingsContent, () => {
        renderSettingsPlaceholder(settingsContent);
      });
    });
  }, 240);
}

function exitCockpitMode(bike) {
  _cockpitMode = false;
  const container = $('silhouette-container');
  const currentSvg = container.querySelector('svg');
  if (currentSvg) { currentSvg.style.transition = 'opacity 0.22s ease'; currentSvg.style.opacity = '0'; }
  setTimeout(() => { loadSetupTab(bike); }, 240);
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
    case 'components': renderComponentsTab(_bike);    break;
    case 'adjust':     renderQuickAdjustTab(_bike);   break;
    case 'rides':      renderRidesTab(_bike);          break;
    case 'testing':    renderTestingTab(_bike);       break;
    case 'presets':    renderPresetsTab(_bike);       break;
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
  $('btn-theme').onclick  = (e) => showThemeDropdown(e);
  $('btn-export').onclick = () => _bike && exportBikePDF(_bike);
  $('btn-add-bike-header').onclick = showAddBikeModal;
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
      <label class="field-label">Air Pressure <span class="field-unit">psi</span></label>
      <div class="spinner-row">
        <button type="button" class="spinner-btn spinner-minus" data-id="ob-fork-psi" data-step="1" data-min="20" data-max="350">−</button>
        <input type="number" id="ob-fork-psi" class="field-input spinner-input" value="80" min="20" max="350" step="1">
        <button type="button" class="spinner-btn spinner-plus" data-id="ob-fork-psi" data-step="1" data-min="20" data-max="350">+</button>
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
      <label class="field-label">Air Pressure <span class="field-unit">psi</span></label>
      <div class="spinner-row">
        <button type="button" class="spinner-btn spinner-minus" data-id="ob-shock-psi" data-step="1" data-min="20" data-max="350">−</button>
        <input type="number" id="ob-shock-psi" class="field-input spinner-input" value="140" min="20" max="350" step="1">
        <button type="button" class="spinner-btn spinner-plus" data-id="ob-shock-psi" data-step="1" data-min="20" data-max="350">+</button>
      </div>
    </div>
    ` : ''}
    <div class="settings-section-divider">Tires</div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Front PSI</label>
        <div class="spinner-row">
          <button type="button" class="spinner-btn spinner-minus" data-id="ob-ft-psi" data-step="0.5" data-min="10" data-max="160">−</button>
          <input type="number" id="ob-ft-psi" class="field-input spinner-input" value="25" min="10" max="160" step="0.5">
          <button type="button" class="spinner-btn spinner-plus" data-id="ob-ft-psi" data-step="0.5" data-min="10" data-max="160">+</button>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Rear PSI</label>
        <div class="spinner-row">
          <button type="button" class="spinner-btn spinner-minus" data-id="ob-rt-psi" data-step="0.5" data-min="10" data-max="160">−</button>
          <input type="number" id="ob-rt-psi" class="field-input spinner-input" value="27" min="10" max="160" step="0.5">
          <button type="button" class="spinner-btn spinner-plus" data-id="ob-rt-psi" data-step="0.5" data-min="10" data-max="160">+</button>
        </div>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn-secondary" id="ob-skip">Skip for now</button>
    <button class="btn-primary"   id="ob-save">Save &amp; Open Bike</button>
  `;

  openModal(`Quick Setup — ${bike.name}`, body, footer);

  // Bind onboarding spinner buttons
  document.querySelectorAll('#modal-body .spinner-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.id);
      if (!input) return;
      const step = parseFloat(btn.dataset.step || 1);
      const min  = parseFloat(btn.dataset.min ?? 0);
      const max  = parseFloat(btn.dataset.max ?? 9999);
      const cur  = parseFloat(input.value) || 0;
      input.value = btn.classList.contains('spinner-minus')
        ? Math.max(min, parseFloat((cur - step).toFixed(3)))
        : Math.min(max, parseFloat((cur + step).toFixed(3)));
    });
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
      // Refresh header if we're inside the bike view
      const nameBtn = $('bike-name-header');
      if (nameBtn && !nameBtn.classList.contains('hidden')) {
        nameBtn.innerHTML = `${escHtml(name)}<svg class="rename-icon" width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 1.5l2.5 2.5L3 10H.5V7.5L7 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
      }
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
  // Apply immediately using saved profile theme, fallback to dark
  const profileId = localStorage.getItem('dialed_active_profile');
  const saved = profileId
    ? localStorage.getItem(`quiver_theme_${profileId}`) || 'dark'
    : 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function showThemeDropdown(e) {
  e.stopPropagation();
  const existing = document.getElementById('theme-dropdown');
  if (existing) { existing.remove(); return; }

  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const profileId = localStorage.getItem('dialed_active_profile') || 'default';
  const rect = e.currentTarget.getBoundingClientRect();

  const drop = document.createElement('div');
  drop.id = 'theme-dropdown';
  drop.className = 'profile-dropdown theme-dropdown-panel';
  drop.style.cssText = `position:fixed;top:${rect.bottom+6}px;left:${rect.left}px;z-index:9999;min-width:220px`;
  drop.innerHTML = `
    <div class="profile-drop-header">Choose Theme</div>
    ${THEMES.map(t => `
      <button class="theme-drop-item ${t.id === cur ? 'active' : ''}" data-theme="${t.id}">
        <div class="theme-drop-swatch" style="background:${t.swatch[0]};border-color:${t.swatch[1]}22">
          <div class="theme-drop-accent" style="background:${t.swatch[1]}"></div>
        </div>
        <span>${t.name}</span>
        ${t.id === cur ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
      </button>`).join('')}`;

  document.body.appendChild(drop);

  drop.querySelectorAll('.theme-drop-item').forEach(btn => {
    btn.onclick = () => {
      const themeId = btn.dataset.theme;
      setProfileTheme(profileId, themeId);
      updateThemeBtn(themeId);
      drop.remove();
    };
  });

  setTimeout(() => {
    document.addEventListener('click', function h() { drop.remove(); document.removeEventListener('click', h); });
  }, 0);
}

function toggleTheme() { showThemeDropdown({stopPropagation:()=>{},currentTarget:$('btn-theme')}); }

function updateThemeBtn(themeId) {
  const btn = $('btn-theme');
  if (!btn) return;
  const theme = THEMES.find(t => t.id === themeId);
  // Show a small color dot + name tooltip
  btn.title = `Theme: ${theme?.name || themeId} (click to cycle)`;
  // Update dot color indicator inside button
  let dot = btn.querySelector('.theme-dot');
  if (!dot) {
    dot = document.createElement('span');
    dot.className = 'theme-dot';
    btn.appendChild(dot);
  }
  dot.style.background = theme?.swatch[1] || '#f59e0b';
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
}arTire' },
  'fork':        { label: 'Fork',               vb: [479, 148, 286, 260], key: 'fork' },
  'shock':       { label: 'Rear Shock',         vb: [256, 213, 260, 210], key: 'shock' },
  'handlebar':   { label: 'Cockpit',            vb: [442,  38, 242, 220], key: 'handlebar' },
  'drivetrain':  { label: 'Drivetrain',         vb: [250, 245, 264, 240], key: 'drivetrain' },
  'dropper':     { label: 'Dropper / Saddle',   vb: [215,  50, 231, 210], key: 'dropper' },
  'frame':       { label: 'Frame / Geometry',   vb: [181,   5, 572, 520], key: 'frame' },
};

// ── WHEELS ────────────────────────────────────────────────
function wheelSpokes(cx, cy, r, count = 8) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    s += `<line x1="${cx}" y1="${cy}"
               x2="${(cx + Math.cos(a)*(r-26)).toFixed(1)}"
               y2="${(cy + Math.sin(a)*(r-26)).toFixed(1)}"
               stroke-width="1.2" opacity="0.32"/>`;
  }
  return s;
}

function mtbWheel(cx, cy, zoneId) {
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="112" fill="none" stroke-width="24"/>
    <circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke-width="1.5" stroke-dasharray="10 6" opacity="0.2"/>
    <circle cx="${cx}" cy="${cy}" r="86"  fill="none" stroke-width="3.5"/>
    ${wheelSpokes(cx, cy, 86)}
    <circle cx="${cx}" cy="${cy}" r="11"  fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="currentColor" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="126" data-zone="${zoneId}"/>
  </g>`;
}

function roadWheel(cx, cy, zoneId, tireW = 6) {
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke-width="${tireW}"/>
    <circle cx="${cx}" cy="${cy}" r="100" fill="none" stroke-width="2"/>
    ${wheelSpokes(cx, cy, 100)}
    <circle cx="${cx}" cy="${cy}" r="9"   fill="var(--bg-base)" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="currentColor" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="122" data-zone="${zoneId}"/>
  </g>`;
}

// ── SHARED HELPERS ────────────────────────────────────────
// Saddle: flat with slight rear rise
function saddle(SAD) {
  return `
    <line x1="${SAD.x-36}" y1="${SAD.y}" x2="${SAD.x+30}" y2="${SAD.y-2}"
          stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
    <path d="M ${SAD.x-38} ${SAD.y-10}
             C ${SAD.x-20} ${SAD.y-8} ${SAD.x+8} ${SAD.y-5} ${SAD.x+40} ${SAD.y-2}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${SAD.x-40} ${SAD.y-8}
             C ${SAD.x-20} ${SAD.y-6} ${SAD.x+8} ${SAD.y-3} ${SAD.x+42} ${SAD.y}
             L ${SAD.x+42} ${SAD.y+5}
             C ${SAD.x+8}  ${SAD.y+2} ${SAD.x-20} ${SAD.y-1} ${SAD.x-40} ${SAD.y-3} Z"
          fill="currentColor" stroke="none" opacity="0.42"/>`;
}

// Drop bars (road/gravel)
function dropBars(HT, stemLen = 18) {
  const SB = {x:HT.x+2, y:HT.y};
  const ST = {x:HT.x-1, y:HT.y-stemLen};
  return `
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST.x}" y2="${ST.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <rect x="${ST.x-11}" y="${ST.y-5}" width="19" height="9" rx="3"
          fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x-22}" y1="${ST.y-2}" x2="${ST.x+16}" y2="${ST.y-2}"
          stroke-width="6" stroke-linecap="round"/>
    <path d="M ${ST.x-22} ${ST.y-2} C ${ST.x-33} ${ST.y+9} ${ST.x-37} ${ST.y+24} ${ST.x-29} ${ST.y+35}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x-29} ${ST.y+35} C ${ST.x-26} ${ST.y+43} ${ST.x-17} ${ST.y+48} ${ST.x-9} ${ST.y+48}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x+16} ${ST.y-2} C ${ST.x+21} ${ST.y+9} ${ST.x+21} ${ST.y+24} ${ST.x+15} ${ST.y+35}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x+15} ${ST.y+35} C ${ST.x+13} ${ST.y+43} ${ST.x+7} ${ST.y+48} ${ST.x+1} ${ST.y+48}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay"
          x="${ST.x-55}" y="${ST.y-18}" width="90" height="82" rx="10" data-zone="handlebar"/>`;
}

// MTB flat bars with brakes/grips
function flatBars(HT, stemLen = 18) {
  const SB = {x:HT.x+3, y:HT.y+2};
  const ST = {x:HT.x-1, y:HT.y-stemLen};
  return `
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST.x}" y2="${ST.y}"
          stroke-width="8" stroke-linecap="round"/>
    <line x1="${SB.x-6}" y1="${SB.y-1}" x2="${SB.x+7}" y2="${SB.y-1}"
          stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
    <rect x="${ST.x-13}" y="${ST.y-5}" width="22" height="9" rx="3"
          fill="var(--bg-elevated)" stroke-width="3.5"/>
    <line x1="${ST.x-68}" y1="${ST.y-2}" x2="${ST.x+62}" y2="${ST.y-2}"
          stroke-width="8.5" stroke-linecap="round"/>
    <line x1="${ST.x-64}" y1="${ST.y-2}" x2="${ST.x-76}" y2="${ST.y-4}"
          stroke-width="17" stroke-linecap="round" opacity="0.54"/>
    <line x1="${ST.x+58}" y1="${ST.y-2}" x2="${ST.x+70}" y2="${ST.y-4}"
          stroke-width="17" stroke-linecap="round" opacity="0.54"/>
    <path d="M ${ST.x-64} ${ST.y-2} Q ${ST.x-71} ${ST.y} ${ST.x-73} ${ST.y+6}"
          fill="none" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M ${ST.x+58} ${ST.y-2} Q ${ST.x+65} ${ST.y} ${ST.x+67} ${ST.y+6}"
          fill="none" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M ${ST.x-50} ${ST.y-2} C ${ST.x-54} ${ST.y+4} ${ST.x-58} ${ST.y+10} ${ST.x-56} ${ST.y+18}"
          fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
    <path d="M ${ST.x+44} ${ST.y-2} C ${ST.x+48} ${ST.y+4} ${ST.x+52} ${ST.y+10} ${ST.x+50} ${ST.y+18}"
          fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
    <rect x="${ST.x-60}" y="${ST.y-8}" width="11" height="7" rx="2"
          fill="none" stroke-width="2.5" opacity="0.65"/>
    <rect x="${ST.x+44}" y="${ST.y-8}" width="11" height="7" rx="2"
          fill="none" stroke-width="2.5" opacity="0.65"/>
    <rect class="zone-overlay"
          x="${ST.x-90}" y="${ST.y-28}" width="184" height="68" rx="10" data-zone="handlebar"/>`;
}

// Straight fork (MTB suspension: thin stanchions + fat lowers)
function suspFork(HC, FW, offset=9, splitT=0.44) {
  const dx=FW.x-HC.x, dy=FW.y-HC.y;
  const len=Math.sqrt(dx*dx+dy*dy);
  const ux=dx/len, uy=dy/len, px=uy, py=-ux;
  const r=n=>Math.round(n);
  const lT={x:r(HC.x-px*offset),y:r(HC.y-py*offset)};
  const rT={x:r(HC.x+px*offset),y:r(HC.y+py*offset)};
  const lB={x:FW.x-8,y:FW.y}, rB={x:FW.x+8,y:FW.y};
  const lS={x:r(lT.x+(lB.x-lT.x)*splitT),y:r(lT.y+(lB.y-lT.y)*splitT)};
  const rS={x:r(rT.x+(rB.x-rT.x)*splitT),y:r(rT.y+(rB.y-rT.y)*splitT)};
  return {lT,rT,lS,rS,lB,rB};
}

// Cassette rings
function cassette(cx, cy) {
  return `
    <circle cx="${cx}" cy="${cy}" r="27" fill="none" stroke-width="5.5"/>
    <circle cx="${cx}" cy="${cy}" r="21" fill="none" stroke-width="3.5" opacity="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke-width="2"   opacity="0.28"/>`;
}

// Chainring + cranks
function drivetrain(BB, RW, r=33) {
  return `
    <circle cx="${BB.x}" cy="${BB.y}" r="${r}" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="${Math.round(r*0.67)}" fill="none" stroke-width="2" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+38}" y2="${BB.y+28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x+34}" y1="${BB.y+26}" x2="${BB.x+50}" y2="${BB.y+21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-38}" y2="${BB.y-28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x-34}" y1="${BB.y-26}" x2="${BB.x-50}" y2="${BB.y-21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <path d="M ${BB.x-4} ${BB.y-r} Q ${(BB.x+RW.x)/2} ${BB.y-r-9} ${RW.x} ${RW.y-24}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <path d="M ${BB.x+4} ${BB.y+r} Q ${(BB.x+RW.x)/2+8} ${BB.y+24} ${RW.x} ${RW.y+12}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>`;
}

// ── FULL SUSPENSION MTB ───────────────────────────────────
// HC(580,191) HT(563,157) ST(335,179) HA=63.9° — shorter head tube (38px)
function svgMTBFS(hasMotor = false) {
  const RW={x:148,y:350}, FW={x:658,y:350}, BB={x:382,y:368};
  const ST={x:335,y:179}, HT={x:563,y:157}, HC={x:580,y:191};
  const stLen=195;
  const stUx=(ST.x-BB.x)/stLen, stUy=(ST.y-BB.y)/stLen;
  const POST={x:322,y:125};
  const SAD={x:326,y:124};
  const SS={x:357,y:270};
  const PIV={x:356,y:328};
  const SHT={x:Math.round(BB.x+stUx*stLen*0.40), y:Math.round(BB.y+stUy*stLen*0.40)};
  const SHB={x:412,y:318};
  const RPIV={x:396,y:344};
  const F=suspFork(HC,FW,9,0.44);

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${roadWheel(RW.x,RW.y,'rear-wheel',14)}
  ${roadWheel(FW.x,FW.y,'front-wheel',14)}

  <!-- FRAME: main triangle + rear triangle -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-55} ${BB.y} ${RW.x+90} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+9} C ${BB.x-58} ${BB.y+9} ${RW.x+88} ${RW.y+9} ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.34"/>
    <line x1="${RW.x}"   y1="${RW.y}"   x2="${SS.x}" y2="${SS.y}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+9}" y1="${RW.y}"   x2="${SS.x+8}" y2="${SS.y}" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="342" y1="208" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    ${hasMotor?`<rect x="${BB.x-38}" y="${BB.y-50}" width="62" height="44" rx="9" fill="none" stroke-width="3" opacity="0.68"/>`:''}
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <!-- DRIVETRAIN -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,33)}
    ${cassette(RW.x,RW.y)}
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>

  <!-- DROPPER / SADDLE -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="7" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-54}" y="${POST.y-20}" width="116" height="${ST.y-POST.y+46}" rx="10" data-zone="dropper"/>
  </g>

  <!-- HANDLEBARS -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    ${flatBars(HT,18)}
  </g>

  <!-- FORK -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${F.lT.x-2}" y1="${F.lT.y+1}" x2="${F.rT.x+2}" y2="${F.rT.y+1}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lT.x}" y1="${F.lT.y}" x2="${F.lS.x}" y2="${F.lS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.rT.x}" y1="${F.rT.y}" x2="${F.rS.x}" y2="${F.rS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lS.x}" y1="${F.lS.y}" x2="${F.lB.x}" y2="${F.lB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.rS.x}" y1="${F.rS.y}" x2="${F.rB.x}" y2="${F.rB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.lS.x-3}" y1="${F.lS.y}" x2="${F.rS.x+3}" y2="${F.rS.y}" stroke-width="8" stroke-linecap="round" opacity="0.62"/>
    <line x1="${F.lB.x-2}" y1="${F.lB.y-22}" x2="${F.rB.x+2}" y2="${F.rB.y-22}" stroke-width="6" stroke-linecap="round" opacity="0.64"/>
    <rect x="${F.lB.x-20}" y="${F.lB.y-62}" width="14" height="28" rx="3" fill="none" stroke-width="3" opacity="0.58"/>
    <line x1="${F.lB.x-10}" y1="${F.lB.y+2}" x2="${F.rB.x+10}" y2="${F.rB.y+2}" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="555" y="183" width="140" height="181" rx="14" data-zone="fork"/>
  </g>

  <!-- SHOCK + LINKAGE (rendered last) -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <circle cx="${RPIV.x}" cy="${RPIV.y}" r="5.5" fill="var(--bg-base)" stroke-width="3"/>
    <line x1="${RPIV.x}" y1="${RPIV.y}" x2="${SHB.x}" y2="${SHB.y}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}" stroke-width="9" stroke-linecap="round"/>
    <line x1="${SHB.x}" y1="${SHB.y}"
          x2="${Math.round(SHB.x+(SHT.x-SHB.x)*0.44)}"
          y2="${Math.round(SHB.y+(SHT.y-SHB.y)*0.44)}"
          stroke-width="4.5" stroke="var(--bg-elevated)" stroke-linecap="round" opacity="0.75"/>
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="4" stroke="var(--bg-base)" stroke-dasharray="0 15 5 15 5 15" stroke-linecap="round" opacity="0.4"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="6" fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="2.5" fill="currentColor" stroke="none"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="6" fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="2.5" fill="currentColor" stroke="none"/>
    <ellipse class="zone-overlay"
      cx="${Math.round((SHT.x+SHB.x)/2)}" cy="${Math.round((SHT.y+SHB.y)/2)}"
      rx="28" ry="50"
      transform="rotate(20 ${Math.round((SHT.x+SHB.x)/2)} ${Math.round((SHT.y+SHB.y)/2)})"
      data-zone="shock"/>
  </g>
</svg>`;
}

// ── HARDTAIL MTB ──────────────────────────────────────────
// Verified: HC(583,207) HT(561,160) ST(333,183) HA=65.5° TT=5.6°↑
function svgHardtail(isDJ = false) {
  // DJ: PBJ-inspired geometry — HA=69.6°, SA actual=68.3°, short seat tube
  // SS=TT_JOIN=(338,273) lies on both the seat tube AND the RW→HT line,
  // so seatstay and top tube share the same 23.3° angle — continuous visual line
  // DJ: PBJ wheelbase 422px (vs 460px old) — short chainstay 158px, HA=69.5° maintained
  const RW = isDJ ? {x:216,y:350} : {x:148,y:350};
  const FW = isDJ ? {x:598,y:350} : {x:648,y:350};
  const BB = isDJ ? {x:374,y:362} : {x:378,y:365};
  const ST = isDJ ? {x:331,y:255} : {x:333,y:183};
  const HT = isDJ ? {x:543,y:202} : {x:561,y:160};
  const HC = isDJ ? {x:549,y:219} : {x:583,y:207};
  const TT_JOIN = isDJ ? {x:346,y:291} : {x:340,y:212};
  // DJ_SS collinear with RW→HT on seat tube (24.4° ≈ 24.3° — continuous line)
  const DJ_SS = isDJ ? {x:346,y:291} : {x:0,y:0};

  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stLen=Math.round(Math.sqrt(stDx*stDx+stDy*stDy));
  const stUx=stDx/stLen, stUy=stDy/stLen;
  const postExt = isDJ ? 18 : 55; // DJ: short post at minimum insertion
  const POST={x:Math.round(ST.x+stUx*postExt), y:Math.round(ST.y+stUy*postExt)};
  const SAD={x:POST.x+4, y:POST.y-1};
  const SS={x:Math.round(BB.x+stUx*stLen*0.52), y:Math.round(BB.y+stUy*stLen*0.52)};
  const F=suspFork(HC, FW, 9, isDJ?1:0.44); // DJ: rigid (no split), HT: susp

  // DJ riser bars
  const djBars = (HT) => {
    const SB={x:HT.x+3,y:HT.y+2}, ST2={x:HT.x-1,y:HT.y-18};
    return `
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST2.x}" y2="${ST2.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${SB.x-6}" y1="${SB.y-1}" x2="${SB.x+7}" y2="${SB.y-1}" stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
    <rect x="${ST2.x-13}" y="${ST2.y-5}" width="22" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="3.5"/>
    <line x1="${ST2.x-4}" y1="${ST2.y}" x2="${ST2.x-4}" y2="${ST2.y-32}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${ST2.x-68}" y1="${ST2.y-30}" x2="${ST2.x+60}" y2="${ST2.y-30}" stroke-width="8.5" stroke-linecap="round"/>
    <line x1="${ST2.x-68}" y1="${ST2.y-30}" x2="${ST2.x-80}" y2="${ST2.y-32}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>
    <line x1="${ST2.x+60}" y1="${ST2.y-30}" x2="${ST2.x+72}" y2="${ST2.y-32}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>
    <rect class="zone-overlay" x="${ST2.x-92}" y="${ST2.y-54}" width="184" height="64" rx="10" data-zone="handlebar"/>`;
  };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${isDJ ? roadWheel(RW.x,RW.y,'rear-wheel',12) : mtbWheel(RW.x,RW.y,'rear-wheel')}
  ${isDJ ? roadWheel(FW.x,FW.y,'front-wheel',12) : mtbWheel(FW.x,FW.y,'front-wheel')}

  <!-- FRAME: rigid rear triangle + main triangle -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-55} ${BB.y} ${RW.x+90} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+9} C ${BB.x-58} ${BB.y+9} ${RW.x+88} ${RW.y+9} ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.34"/>
    <!-- Seatstay: for DJ meets at TT_JOIN (collinear with top tube) -->
    <line x1="${RW.x}"   y1="${RW.y}" x2="${isDJ?DJ_SS.x:SS.x}" y2="${isDJ?DJ_SS.y:SS.y}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+9}" y1="${RW.y}" x2="${isDJ?DJ_SS.x+8:SS.x+8}" y2="${isDJ?DJ_SS.y:SS.y}" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${TT_JOIN.x}" y1="${TT_JOIN.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${isDJ?DJ_SS.x:SS.x},${isDJ?DJ_SS.y:SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <!-- DRIVETRAIN -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,33)}
    ${cassette(RW.x,RW.y)}
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>

  <!-- DROPPER / SADDLE -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="7" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-54}" y="${POST.y-20}" width="116" height="${ST.y-POST.y+46}" rx="10" data-zone="dropper"/>
  </g>

  <!-- HANDLEBARS -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    ${isDJ ? djBars(HT) : flatBars(HT,18)}
  </g>

  <!-- FORK -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${F.lT.x-2}" y1="${F.lT.y+1}" x2="${F.rT.x+2}" y2="${F.rT.y+1}" stroke-width="10" stroke-linecap="round"/>
    ${isDJ ? `
    <!-- Rigid fork: full-length straight legs, same width top to bottom -->
    <line x1="${F.lT.x}" y1="${F.lT.y}" x2="${F.lB.x}" y2="${F.lB.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${F.rT.x}" y1="${F.rT.y}" x2="${F.rB.x}" y2="${F.rB.y}" stroke-width="8" stroke-linecap="round"/>
    ` : `
    <!-- Suspension fork: thin stanchions + fat lowers -->
    <line x1="${F.lT.x}" y1="${F.lT.y}" x2="${F.lS.x}" y2="${F.lS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.rT.x}" y1="${F.rT.y}" x2="${F.rS.x}" y2="${F.rS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lS.x}" y1="${F.lS.y}" x2="${F.lB.x}" y2="${F.lB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.rS.x}" y1="${F.rS.y}" x2="${F.rB.x}" y2="${F.rB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.lS.x-3}" y1="${F.lS.y}" x2="${F.rS.x+3}" y2="${F.rS.y}" stroke-width="8" stroke-linecap="round" opacity="0.62"/>
    <line x1="${F.lB.x-2}" y1="${F.lB.y-22}" x2="${F.rB.x+2}" y2="${F.rB.y-22}" stroke-width="6" stroke-linecap="round" opacity="0.62"/>
    <rect x="${F.lB.x-20}" y="${F.lB.y-62}" width="14" height="28" rx="3" fill="none" stroke-width="3" opacity="0.58"/>
    `}
    <line x1="${F.lB.x-10}" y1="${F.lB.y+2}" x2="${F.rB.x+10}" y2="${F.rB.y+2}" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="548" y="118" width="140" height="258" rx="14" data-zone="fork"/>
  </g>
</svg>`;
}

// ── GRAVEL BIKE ───────────────────────────────────────────
// 72° HA, 73° SA — shorter frame, higher DT connection, 3.8° TT slope
// HC(560,226) HT(548,188) ST(315,164) TT_JOIN(324,203)
function svgGravel() {
  const RW={x:155,y:350}, FW={x:600,y:350}, BB={x:375,y:360};
  const ST={x:315,y:164}, HT={x:544,y:177}, HC={x:560,y:226};
  const TT_TOP={x:548,y:188}; // TT meets head tube 12px below HT
  const TT_JOIN={x:324,y:203}; // 4.4° downward slope from HT // 30px below ST along seat tube

  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stLen=Math.round(Math.sqrt(stDx*stDx+stDy*stDy));
  const stUx=stDx/stLen, stUy=stDy/stLen;
  const POST={x:311, y:150};
  const SAD={x:315, y:149};
  // SS: just below TT_JOIN (~12px down seat tube) for tight high rear triangle
  const SS={x:328, y:214};

  // Straight fork: perp offsets ±7px from HC→FW line
  const fDx=FW.x-HC.x, fDy=FW.y-HC.y;
  const fLen=Math.sqrt(fDx*fDx+fDy*fDy);
  const fux=fDx/fLen, fuy=fDy/fLen, fpx=fuy, fpy=-fux;
  const lT={x:553,y:228}, rT={x:567,y:224};
  const lB={x:FW.x-6,y:FW.y}, rB={x:FW.x+6,y:FW.y};

  // Drop bars — side-view profile
  // Stem: from HT going forward (right) and very slightly down
  const StemTip={x:590,y:173};
  // Bar top: extends rearward (left) from stem tip
  const BarRear={x:562,y:168};
  // Drop: curves rearward and down from BarRear, bottom curls forward
  const DropBot={x:560,y:218};
  // Hood body (brake hood area, near stem)
  const HoodX=566, HoodY=166;

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${roadWheel(RW.x,RW.y,'rear-wheel',14)}

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <!-- Chainstay -->
    <path d="M ${BB.x} ${BB.y} C ${BB.x-52} ${BB.y} ${RW.x+84} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+8} C ${BB.x-55} ${BB.y+8} ${RW.x+82} ${RW.y+8} ${RW.x} ${RW.y}"
          fill="none" stroke-width="2.5" stroke-linecap="round" opacity="0.32"/>
    <!-- Seatstay -->
    <line x1="${RW.x}"   y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="${RW.x+8}" y1="${RW.y}" x2="${SS.x+7}" y2="${SS.y}" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
    <!-- Down tube -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="8" stroke-linecap="round"/>
    <!-- Seat tube -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7" stroke-linecap="round"/>
    <!-- Top tube: connects to TT_TOP (stub above exposed above) -->
    <line x1="${TT_JOIN.x}" y1="${TT_JOIN.y}" x2="${TT_TOP.x}" y2="${TT_TOP.y}" stroke-width="6" stroke-linecap="round"/>
    <!-- Head tube: HT is top stub, TT_TOP is where top tube meets, HC is crown -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="12" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${TT_TOP.x},${TT_TOP.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,30)}
    <!-- Gravel 1x or 2x — show inner ring -->
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="3.5" opacity="0.42"/>
    ${cassette(RW.x,RW.y)}
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="54" data-zone="drivetrain"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-9}" y="${ST.y-5}" width="18" height="11" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="6.5" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-50}" y="${POST.y-18}" width="112" height="${ST.y-POST.y+44}" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drop bars — side-view profile -->

  <!-- Straight fork (modern gravel — no curve) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${lT.x-1}" y1="${lT.y}" x2="${rT.x+1}" y2="${rT.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${lT.x}" y1="${lT.y}" x2="${lB.x}" y2="${lB.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${rT.x}" y1="${rT.y}" x2="${rB.x}" y2="${rB.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${lB.x-1}" y1="${lB.y-20}" x2="${rB.x+1}" y2="${rB.y-20}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    <line x1="${lB.x-8}" y1="${lB.y+2}" x2="${rB.x+8}" y2="${rB.y+2}" stroke-width="6" stroke-linecap="round"/>
    <rect class="zone-overlay" x="543" y="218" width="72" height="148" rx="12" data-zone="fork"/>
  </g>

  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Stem: forward from HT, nearly horizontal -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${StemTip.x}" y2="${StemTip.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Stem faceplate -->
    <rect x="${StemTip.x-5}" y="${StemTip.y-9}" width="8" height="16" rx="3"
          fill="var(--bg-elevated)" stroke-width="3"/>
    <!-- Bar top section: extends rearward from stem tip -->
    <line x1="${StemTip.x}" y1="${StemTip.y}"
          x2="${BarRear.x}" y2="${BarRear.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Brake hood body (silicone hood over lever) -->
    <path d="M ${HoodX} ${HoodY} Q ${HoodX-8} ${HoodY+8} ${HoodX-4} ${HoodY+18}"
          fill="none" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
    <!-- Drop: convex forward — bezier bulges RIGHT (forward direction) -->
    <path d="M ${BarRear.x} ${BarRear.y}
             C ${BarRear.x+16} ${BarRear.y+14}
               ${DropBot.x+16} ${DropBot.y-14}
               ${DropBot.x} ${DropBot.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Bottom curl rearward (hook shape) -->
    <path d="M ${DropBot.x} ${DropBot.y}
             Q ${DropBot.x-10} ${DropBot.y+8}
               ${DropBot.x-14} ${DropBot.y+2}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${BarRear.x-16}" y="${HT.y-24}" width="120" height="108" rx="10" data-zone="handlebar"/>
  </g>
  </g>

  ${roadWheel(FW.x,FW.y,'front-wheel',14)}
</svg>`;
}

// ── ROAD BIKE ─────────────────────────────────────────────
// Verified: HC(591,204) HT(573,145) ST(319,183) HA=73° TT=8.5°↑
// Curved fork (road bikes still use raked forks)
function svgRoad() {
  const RW={x:155,y:350}, FW={x:575,y:350}, BB={x:372,y:355};
  const ST={x:318,y:178}, HT={x:535,y:214}, HC={x:546,y:250};
  const TT_TOP={x:535,y:214}; // TT meets head tube here, stub extends above

  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stLen=Math.round(Math.sqrt(stDx*stDx+stDy*stDy));
  const stUx=stDx/stLen, stUy=stDy/stLen;
  const POST={x:314, y:164};
  const SAD={x:318, y:163};
  // SS: just below TT_JOIN (~12px down seat tube) for high tight rear triangle
  const SS={x:331, y:238};

  // Curved fork: two bezier paths from crown to axle
  const fCx1=HC.x+6, fCy1=HC.y+35, fCx2=FW.x+6, fCy2=FW.y-25;
  const fCx1r=HC.x+14, fCy1r=HC.y+36, fCx2r=FW.x+14, fCy2r=FW.y-24;

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${roadWheel(RW.x,RW.y,'rear-wheel',6)}

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-50} ${BB.y} ${RW.x+80} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M ${BB.x-2} ${BB.y+7} C ${BB.x-52} ${BB.y+7} ${RW.x+78} ${RW.y+7} ${RW.x} ${RW.y}"
          fill="none" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
    <line x1="${RW.x}"   y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="4" stroke-linecap="round"/>
    <line x1="${RW.x+7}" y1="${RW.y}" x2="${SS.x+6}" y2="${SS.y}" stroke-width="2" stroke-linecap="round" opacity="0.28"/>
    <!-- Down tube: thicker than top tube (road frame character) -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="6" stroke-linecap="round"/>
    <!-- Top tube: connects to TT_TOP, HT stub extends above -->
    <line x1="327" y1="227" x2="${TT_TOP.x}" y2="${TT_TOP.y}" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${TT_TOP.x},${TT_TOP.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,34)}
    <!-- Road: 2x chainrings -->
    <circle cx="${BB.x}" cy="${BB.y}" r="24" fill="none" stroke-width="4" opacity="0.5"/>
    <!-- Road cassette: tight cog cluster (7 rings, small to large) -->
    <circle cx="${RW.x}" cy="${RW.y}" r="24" fill="none" stroke-width="3.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="21" fill="none" stroke-width="2.5" opacity="0.75"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="18" fill="none" stroke-width="2" opacity="0.6"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15.5" fill="none" stroke-width="2" opacity="0.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="13" fill="none" stroke-width="1.8" opacity="0.4"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="11" fill="none" stroke-width="1.5" opacity="0.32"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="9" fill="none" stroke-width="2.5" opacity="0.55"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="52" data-zone="drivetrain"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-9}" y="${ST.y-5}" width="18" height="11" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="6" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-48}" y="${POST.y-18}" width="108" height="${ST.y-POST.y+42}" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drop bars — side-view profile (matching gravel style) -->

  <!-- Curved fork (road — raked) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <!-- Crown -->
    <line x1="${HC.x-6}" y1="${HC.y+2}" x2="${HC.x+8}" y2="${HC.y+2}" stroke-width="8" stroke-linecap="round"/>
    <!-- Left leg: curved bezier -->
    <path d="M ${HC.x-5} ${HC.y+3}
             C ${fCx1-2} ${fCy1} ${fCx2-2} ${fCy2} ${FW.x+6} ${FW.y}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Right leg -->
    <path d="M ${HC.x+7} ${HC.y+3}
             C ${fCx1r} ${fCy1r} ${fCx2r} ${fCy2r} ${FW.x+16} ${FW.y}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Lower brace -->
    <line x1="${FW.x+4}" y1="${FW.y-18}" x2="${FW.x+18}" y2="${FW.y-18}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    <!-- Axle -->
    <line x1="${FW.x-2}" y1="${FW.y+2}" x2="${FW.x+22}" y2="${FW.y+2}" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Fork hitbox: narrow polygon along upper fork, above wheel overlay -->
    <polygon class="zone-overlay" points="540,252 554,252 562,320 548,320" data-zone="fork"/>
  </g>

  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Stem: forward from HT, nearly horizontal -->
    <line x1="${HT.x}" y1="${HT.y}" x2="590" y2="210"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Stem faceplate -->
    <rect x="585" y="201" width="8" height="16" rx="3"
          fill="var(--bg-elevated)" stroke-width="3"/>
    <!-- Bar top section: extends rearward from stem tip -->
    <line x1="590" y1="210" x2="560" y2="205"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Brake hood body -->
    <path d="M 566 203 Q 558 211 562 221"
          fill="none" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
    <!-- Drop: convex forward — bezier bulges RIGHT (forward direction) -->
    <path d="M 560 205 C 578 221 576 242 558 258"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Bottom curl rearward (hook shape) -->
    <path d="M 558 258 Q 546 266 542 260"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="530" y="190" width="108" height="110" rx="10" data-zone="handlebar"/>
  </g>
  </g>

  ${roadWheel(FW.x,FW.y,'front-wheel',6)}
</svg>`;
}

// ── FACTORY ───────────────────────────────────────────────
export function createSilhouette(bike) {
  const type=bike.type||'mtb', isFull=(bike.suspensionType||'full')==='full';
  switch(type){
    case 'mtb':        return isFull?svgMTBFS(false):svgHardtail(false);
    case 'emtb':       return svgMTBFS(true);
    case 'dirtjumper': return svgHardtail(true);
    case 'gravel':     return svgGravel();
    case 'road':       return svgRoad();
    default:           return svgMTBFS(false);
  }
}

export function createMiniSilhouette(bikeType) {
  const fake={
    mtb:{type:'mtb',suspensionType:'full'}, emtb:{type:'emtb',suspensionType:'full'},
    dirtjumper:{type:'dirtjumper',suspensionType:'hardtail'}, gravel:{type:'gravel'}, road:{type:'road'},
  };
  let svg=createSilhouette(fake[bikeType]||fake.mtb);
  svg=svg.replace(/id="bike-svg"/,'class="mini-silhouette"');
  svg=svg.replace(/<(?:circle|ellipse|rect|polygon)[^>]*class="zone-overlay[^"]*"[^/]*\/>/g,'');
  svg=svg.replace(/id="g-[^"]*"/g,'');
  return svg;
}

// ── ZOOM ──────────────────────────────────────────────────
let _currentVB=[...VB_DEFAULT],_animFrame=null,_activeZone=null;
function lerpVB(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
function easeOutCubic(t){return 1-Math.pow(1-t,3);}

export function animateViewBox(svg,targetVB,duration=480){
  if(_animFrame)cancelAnimationFrame(_animFrame);
  const startVB=[..._currentVB],start=performance.now();
  function step(now){
    const raw=Math.min((now-start)/duration,1);
    _currentVB=lerpVB(startVB,targetVB,easeOutCubic(raw));
    svg.setAttribute('viewBox',_currentVB.join(' '));
    if(raw<1)_animFrame=requestAnimationFrame(step);
  }
  _animFrame=requestAnimationFrame(step);
}

export function resetZoom(svg){_activeZone=null;if(svg)animateViewBox(svg,VB_DEFAULT);}

// ── ZONE INTERACTION ──────────────────────────────────────
export function setupZoneInteraction(container,bike,onZoneClick){
  const svg=container.querySelector('#bike-svg');
  if(!svg)return;
  _currentVB=[...VB_DEFAULT];_activeZone=null;
  svg.setAttribute('viewBox',VB_DEFAULT.join(' '));
  const tooltip=document.getElementById('zone-tooltip');
  const available=getAvailableZones(bike);

  // Update completeness ring
  updateCompletenessRing(bike, available);

  svg.querySelectorAll('.zone-overlay').forEach(overlay=>{
    const zoneId=overlay.getAttribute('data-zone');
    if(!available.includes(zoneId)){overlay.style.display='none';return;}
    const group=svg.querySelector(`#g-${zoneId}`);
    overlay.addEventListener('mouseenter',e=>{
      if(group)group.classList.add('zone-hovered');
      showTooltip(tooltip,zoneId,bike,e,container);
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','0');
    });
    overlay.addEventListener('mouseleave',()=>{
      if(group&&_activeZone!==zoneId)group.classList.remove('zone-hovered');
      tooltip.classList.add('hidden');
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','');
    });
    overlay.addEventListener('mousemove',e=>positionTooltip(tooltip,e,container));
    overlay.addEventListener('click', e => {
      e.stopPropagation();
      // Clear ALL active/hovered states (fixes one-at-a-time)
      svg.querySelectorAll('.zone-active, .zone-hovered').forEach(el => {
        el.classList.remove('zone-active', 'zone-hovered');
      });
      if(_activeZone===zoneId){
        _activeZone=null;resetZoom(svg);
        document.getElementById('btn-zoom-reset')?.classList.add('hidden');
        onZoneClick(null);
      } else {
        _activeZone=zoneId;
        if(group)group.classList.add('zone-active');
        const meta=ZONE_META[zoneId];if(meta)animateViewBox(svg,meta.vb);
        document.getElementById('btn-zoom-reset')?.classList.remove('hidden');
        onZoneClick(zoneId);
      }
    });
  });

  // Background click → clear all highlights and reset
  svg.addEventListener('click', () => {
    svg.querySelectorAll('.zone-active, .zone-hovered').forEach(el => {
      el.classList.remove('zone-active', 'zone-hovered');
    });
    const wasActive = _activeZone;
    _activeZone = null;
    resetZoom(svg);
    document.getElementById('btn-zoom-reset')?.classList.add('hidden');
    if (wasActive) onZoneClick(null);
  });
}

function getAvailableZones(bike){
  const base=['front-wheel','rear-wheel','fork','handlebar','drivetrain','dropper','frame'];
  if((bike.type==='mtb'||bike.type==='emtb')&&(bike.suspensionType||'full')==='full')base.push('shock');
  return base;
}

function showTooltip(tooltip,zoneId,bike,e,container){
  const meta=ZONE_META[zoneId];if(!meta)return;
  tooltip.querySelector('.tooltip-zone-name').textContent=meta.label;
  tooltip.querySelector('.tooltip-zone-value').textContent=getZoneQuickValue(zoneId,bike);
  tooltip.classList.remove('hidden');
  positionTooltip(tooltip,e,container);
}

function positionTooltip(tooltip,e,container){
  const rect=container.getBoundingClientRect();
  tooltip.style.left=`${e.clientX-rect.left}px`;
  tooltip.style.top=`${e.clientY-rect.top}px`;
}

export function getZoneQuickValue(zoneId,bike){
  const bl=bike.baseline||{};
  switch(zoneId){
    case 'front-wheel':{const t=bl.frontTire;return t?.brand?`${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim():'Not set';}
    case 'rear-wheel': {const t=bl.rearTire; return t?.brand?`${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim():'Not set';}
    case 'fork': {const f=bl.fork; return f?.brand?`${f.brand} ${f.model||''} ${f.type==='air'&&f.psi?'· '+f.psi+' psi':f.type==='coil'?'· Coil':''}`.trim():'Not set';}
    case 'shock':{const s=bl.shock;return s?.brand?`${s.brand} ${s.model||''} ${s.type==='air'&&s.psi?'· '+s.psi+' psi':s.type==='coil'?'· Coil':''}`.trim():'Not set';}
    case 'handlebar': return 'Click to explore cockpit';
    case 'drivetrain':return bl.drivetrain?.brand?`${bl.drivetrain.brand} ${bl.drivetrain.model||''}`.trim():'Not set';
    case 'dropper':   return bl.dropper?.brand   ?`${bl.dropper.brand} ${bl.dropper.model||''}`.trim()    :'Not set';
    case 'frame':     return bl.frame?.brand     ?`${bl.frame.brand} ${bl.frame.model||''}`.trim()        :'Not set';
    default:return '—';
  }
}

// Zone dot positions (where to place the amber dot for each zone)
const ZONE_DOT_POS = {
  'front-wheel': {x:658, y:238}, 'rear-wheel': {x:148, y:238},
  'fork':        {x:620, y:210}, 'shock':      {x:415, y:298},
  'handlebar':   {x:575, y:133}, 'drivetrain': {x:415, y:345},
  'dropper':     {x:340, y:130}, 'frame':      {x:480, y:200},
};

function zoneHasData(zoneId, bike) {
  const bl = bike.baseline || {};
  switch(zoneId) {
    case 'front-wheel': return !!(bl.frontTire?.brand || bl.frontTire?.psi);
    case 'rear-wheel':  return !!(bl.rearTire?.brand  || bl.rearTire?.psi);
    case 'fork':        return !!(bl.fork?.brand);
    case 'shock':       return !!(bl.shock?.brand);
    case 'handlebar':   return !!(bl.handlebar?.brand || bl.stem?.brand);
    case 'drivetrain':  return !!(bl.drivetrain?.brand);
    case 'dropper':     return !!(bl.dropper?.brand);
    case 'frame':       return !!(bl.frame?.brand);
    default: return false;
  }
}

function drawZoneDots(svg, bike, available) {
  // Remove old dots
  svg.querySelectorAll('.zone-dot').forEach(d => d.remove());
  available.forEach(zoneId => {
    if (!zoneHasData(zoneId, bike)) return;
    const pos = ZONE_DOT_POS[zoneId];
    if (!pos) return;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', '5');
    circle.setAttribute('class', 'zone-dot');
    svg.appendChild(circle);
  });
}

function updateCompletenessRing(bike, available) {
  const fill  = document.getElementById('completeness-fill');
  const label = document.getElementById('completeness-label');
  if (!fill || !label) return;
  const total = available.length;
  const done  = available.filter(z => zoneHasData(z, bike)).length;
  const circumference = 50.3; // 2π×8
  const offset = circumference - (done / total) * circumference;
  fill.setAttribute('stroke-dashoffset', offset.toFixed(1));
  label.textContent = `${done}/${total}`;
}

// ── COCKPIT FRONT VIEW ────────────────────────────────────
const COCKPIT_META = {
  'cockpit-bars':   { label: 'Handlebar',         key: 'handlebar' },
  'cockpit-stem':   { label: 'Stem',              key: 'stem' },
  'cockpit-brakes': { label: 'Brakes & Shifters', key: 'brakes' },
  'cockpit-grips':  { label: 'Grips',             key: 'grips' },
  'cockpit-stack':  { label: 'Stack & Headset',   key: 'headset' },
};

export function createCockpitFrontView(bike) {
  const isDropBar = ['gravel','road'].includes(bike.type);
  return isDropBar ? cockpitDropBars() : cockpitFlatBars();
}

function cockpitFlatBars() {
  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <g id="g-cockpit-bars" class="bike-zone" data-zone="cockpit-bars">
    <line x1="208" y1="248" x2="366" y2="248" stroke-width="8" stroke-linecap="round"/>
    <line x1="434" y1="248" x2="592" y2="248" stroke-width="8" stroke-linecap="round"/>
    <rect class="zone-overlay" x="208" y="236" width="158" height="28" rx="4" data-zone="cockpit-bars"/>
    <rect class="zone-overlay" x="434" y="236" width="158" height="28" rx="4" data-zone="cockpit-bars"/>
  </g>

  <g id="g-cockpit-grips" class="bike-zone" data-zone="cockpit-grips">
    <line x1="78" y1="248" x2="210" y2="248" stroke-width="22" stroke-linecap="round" opacity="0.75"/>
    <path d="M 78 248 Q 70 248 68 256" fill="none" stroke-width="20" stroke-linecap="round" opacity="0.75"/>
    <line x1="108" y1="237" x2="108" y2="259" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="130" y1="236" x2="130" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="152" y1="236" x2="152" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="174" y1="236" x2="174" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="196" y1="237" x2="196" y2="259" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="590" y1="248" x2="722" y2="248" stroke-width="22" stroke-linecap="round" opacity="0.75"/>
    <path d="M 722 248 Q 730 248 732 256" fill="none" stroke-width="20" stroke-linecap="round" opacity="0.75"/>
    <line x1="612" y1="236" x2="612" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="634" y1="236" x2="634" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="656" y1="236" x2="656" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="678" y1="236" x2="678" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="700" y1="237" x2="700" y2="259" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <rect class="zone-overlay" x="60" y="228" width="158" height="40" rx="8" data-zone="cockpit-grips"/>
    <rect class="zone-overlay" x="582" y="228" width="158" height="40" rx="8" data-zone="cockpit-grips"/>
  </g>

  <g id="g-cockpit-brakes" class="bike-zone" data-zone="cockpit-brakes">
    <rect x="202" y="230" width="48" height="20" rx="5" fill="none" stroke-width="2.5"/>
    <line x1="202" y1="247" x2="250" y2="247" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    <path d="M 226 248 C 220 278 214 312 221 346" fill="none" stroke-width="6" stroke-linecap="round"/>
    <line x1="215" y1="338" x2="228" y2="352" stroke-width="5" stroke-linecap="round"/>
    <rect x="260" y="230" width="54" height="20" rx="4" fill="none" stroke-width="2.5"/>
    <line x1="280" y1="248" x2="280" y2="264" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
    <rect x="550" y="230" width="48" height="20" rx="5" fill="none" stroke-width="2.5"/>
    <line x1="550" y1="247" x2="598" y2="247" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    <path d="M 574 248 C 580 278 586 312 579 346" fill="none" stroke-width="6" stroke-linecap="round"/>
    <line x1="585" y1="338" x2="572" y2="352" stroke-width="5" stroke-linecap="round"/>
    <rect x="486" y="230" width="54" height="20" rx="4" fill="none" stroke-width="2.5"/>
    <line x1="520" y1="248" x2="520" y2="264" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
    <rect class="zone-overlay" x="194" y="220" width="132" height="148" rx="8" data-zone="cockpit-brakes"/>
    <rect class="zone-overlay" x="474" y="220" width="132" height="148" rx="8" data-zone="cockpit-brakes"/>
  </g>

  <g id="g-cockpit-stem" class="bike-zone" data-zone="cockpit-stem">
    <rect x="378" y="170" width="44" height="18" rx="5" fill="none" stroke-width="3.5"/>
    <path d="M 385 188 L 368 218 L 432 218 L 415 188 Z" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="360" y="216" width="80" height="14" rx="4" fill="none" stroke-width="4"/>
    <circle cx="376" cy="223" r="3.5" fill="none" stroke-width="2"/>
    <circle cx="424" cy="223" r="3.5" fill="none" stroke-width="2"/>
    <rect class="zone-overlay" x="352" y="162" width="96" height="82" rx="10" data-zone="cockpit-stem"/>
  </g>

  <g id="g-cockpit-stack" class="bike-zone" data-zone="cockpit-stack">
    <line x1="400" y1="44" x2="400" y2="168" stroke-width="5" stroke-linecap="round"/>
    <rect x="385" y="116" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="130" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="144" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <line x1="380" y1="114" x2="420" y2="114" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="378" y="38" width="44" height="132" rx="8" data-zone="cockpit-stack"/>
  </g>
</svg>`;
}

// Drop bars front view (Gravel / Road)
// Layout: steerer top center → stem → flat bar sections L+R → drops curving down
function cockpitDropBars() {
  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <!-- Flat top sections of the bar (either side of stem) -->
  <g id="g-cockpit-bars" class="bike-zone" data-zone="cockpit-bars">
    <line x1="178" y1="232" x2="368" y2="232" stroke-width="7" stroke-linecap="round"/>
    <line x1="432" y1="232" x2="622" y2="232" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="178" y="220" width="190" height="26" rx="4" data-zone="cockpit-bars"/>
    <rect class="zone-overlay" x="432" y="220" width="190" height="26" rx="4" data-zone="cockpit-bars"/>
  </g>

  <!-- Bottom of drops — hands in drop position -->
  <g id="g-cockpit-grips" class="bike-zone" data-zone="cockpit-grips">
    <!-- Left drop bottom curl -->
    <path d="M 156 336 Q 166 358 188 362 Q 204 365 216 358"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Right drop bottom curl -->
    <path d="M 644 336 Q 634 358 612 362 Q 596 365 584 358"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="148" y="318" width="88" height="62" rx="10" data-zone="cockpit-grips"/>
    <rect class="zone-overlay" x="564" y="318" width="88" height="62" rx="10" data-zone="cockpit-grips"/>
  </g>

  <!-- Brake hoods + lever blades + drop curves -->
  <g id="g-cockpit-brakes" class="bike-zone" data-zone="cockpit-brakes">
    <!-- Left hood silhouette -->
    <path d="M 230 232 Q 218 226 212 236 Q 206 248 214 258 Q 222 266 236 264 L 248 260 Q 258 254 258 244 Q 258 232 248 228 Z"
          fill="none" stroke-width="2.8"/>
    <!-- Left drop curve -->
    <path d="M 178 232 C 170 272 158 304 156 336" fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Left lever blade (hangs down from inside of drop) -->
    <path d="M 226 258 C 228 284 224 314 218 342" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Right hood silhouette (mirrored) -->
    <path d="M 570 232 Q 582 226 588 236 Q 594 248 586 258 Q 578 266 564 264 L 552 260 Q 542 254 542 244 Q 542 232 552 228 Z"
          fill="none" stroke-width="2.8"/>
    <!-- Right drop curve -->
    <path d="M 622 232 C 630 272 642 304 644 336" fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Right lever blade -->
    <path d="M 574 258 C 572 284 576 314 582 342" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="148" y="218" width="128" height="134" rx="10" data-zone="cockpit-brakes"/>
    <rect class="zone-overlay" x="524" y="218" width="128" height="134" rx="10" data-zone="cockpit-brakes"/>
  </g>

  <!-- Stem + faceplate -->
  <g id="g-cockpit-stem" class="bike-zone" data-zone="cockpit-stem">
    <rect x="378" y="168" width="44" height="18" rx="5" fill="none" stroke-width="3.5"/>
    <path d="M 384 186 L 366 216 L 434 216 L 416 186 Z" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="358" y="214" width="84" height="14" rx="4" fill="none" stroke-width="4"/>
    <circle cx="374" cy="221" r="3.5" fill="none" stroke-width="2"/>
    <circle cx="426" cy="221" r="3.5" fill="none" stroke-width="2"/>
    <rect class="zone-overlay" x="350" y="160" width="100" height="82" rx="10" data-zone="cockpit-stem"/>
  </g>

  <!-- Stack + spacers + headset -->
  <g id="g-cockpit-stack" class="bike-zone" data-zone="cockpit-stack">
    <line x1="400" y1="44" x2="400" y2="166" stroke-width="5" stroke-linecap="round"/>
    <rect x="385" y="114" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="128" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="142" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <line x1="380" y1="112" x2="420" y2="112" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="378" y="38" width="44" height="130" rx="8" data-zone="cockpit-stack"/>
  </g>
</svg>`;
}

export function setupCockpitInteraction(container, bike, onSubZoneClick) {
  const svg = container.querySelector('#bike-svg');
  if (!svg) return;
  const tooltip = document.getElementById('zone-tooltip');
  let _activeCockpitZone = null;

  svg.querySelectorAll('.zone-overlay').forEach(overlay => {
    const zoneId = overlay.getAttribute('data-zone');
    if (!COCKPIT_META[zoneId]) return;
    const group = svg.querySelector(`#g-${zoneId}`);

    overlay.addEventListener('mouseenter', e => {
      if (group) group.classList.add('zone-hovered');
      const meta = COCKPIT_META[zoneId];
      const bl   = bike.baseline || {};
      let val = 'Not set';
      if      (zoneId==='cockpit-bars'   && bl.handlebar?.brand) val=`${bl.handlebar.brand} ${bl.handlebar.width||''}`.trim();
      else if (zoneId==='cockpit-stem'   && bl.stem?.brand)      val=`${bl.stem.brand} ${bl.stem.length||''}`.trim();
      else if (zoneId==='cockpit-brakes' && bl.brakes?.brand)    val=`${bl.brakes.brand} ${bl.brakes.model||''}`.trim();
      else if (zoneId==='cockpit-grips'  && (bl.grips?.brand || bl.bartape?.brand)) val=`${bl.grips?.brand || bl.bartape?.brand || ''} ${bl.grips?.model || bl.bartape?.model || ''}`.trim();
      else if (zoneId==='cockpit-stack'  && bl.headset?.brand)   val=`${bl.headset.brand} ${bl.headset.model||''}`.trim();
      const isDropBike = ['gravel','road'].includes(bike.type);
      const gripsLabel = zoneId === 'cockpit-grips' ? (isDropBike ? 'Bar Tape' : 'Grips') : meta.label;
      tooltip.querySelector('.tooltip-zone-name').textContent  = gripsLabel;
      tooltip.querySelector('.tooltip-zone-value').textContent = val;
      tooltip.classList.remove('hidden');
      positionTooltip(tooltip, e, container);
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','0');
    });
    overlay.addEventListener('mouseleave', () => {
      if (group && _activeCockpitZone !== zoneId) group.classList.remove('zone-hovered');
      tooltip.classList.add('hidden');
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','');
    });
    overlay.addEventListener('mousemove', e => positionTooltip(tooltip, e, container));
    overlay.addEventListener('click', e => {
      e.stopPropagation();
      svg.querySelectorAll('.zone-active,.zone-hovered').forEach(el=>el.classList.remove('zone-active','zone-hovered'));
      if (_activeCockpitZone === zoneId) {
        _activeCockpitZone = null;
        onSubZoneClick(null);
      } else {
        _activeCockpitZone = zoneId;
        if (group) group.classList.add('zone-active');
        onSubZoneClick(zoneId);
      }
    });
  });

  // Background click → signal exit
  svg.addEventListener('click', () => {
    svg.querySelectorAll('.zone-active,.zone-hovered').forEach(el=>el.classList.remove('zone-active','zone-hovered'));
    _activeCockpitZone = null;
    onSubZoneClick(null);
  });
}

export { ZONE_META };
