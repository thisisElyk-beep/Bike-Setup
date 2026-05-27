import { getBikes, createBike, updateBike, deleteBike } from './db.js';
import { initProfile, showProfilePicker, renderProfileChip, THEMES, getProfileTheme, setProfileTheme, applyTheme, getActiveProfileId as getActiveProfile } from './profiles.js';
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
}
