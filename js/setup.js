import { updateBike } from './db.js';
import { showToast } from './app.js';

// ── ZONE → FORM RENDERER ──────────────────────────────────

export function renderZoneSettings(zoneId, bike, container, onSaved) {
  const baseline = bike.baseline || {};
  let html = '';

  switch (zoneId) {
    case 'front-wheel': html = tireForm('frontTire', 'Front Tire', baseline.frontTire); break;
    case 'rear-wheel':  html = tireForm('rearTire',  'Rear Tire',  baseline.rearTire);  break;
    case 'fork':  html = suspensionForm('fork',  'Fork',        baseline.fork,  false); break;
    case 'shock': html = suspensionForm('shock', 'Rear Shock',  baseline.shock, true);  break;
    case 'handlebar':  html = cockpitForm(baseline); break;
    case 'drivetrain': html = drivetrainForm(baseline); break;
    case 'dropper':    html = dropperForm(bike.type, baseline); break;
    case 'frame':      html = frameForm(baseline); break;
    default: html = '<p style="color:var(--text-muted);font-size:.85rem">No settings for this zone.</p>';
  }

  container.innerHTML = `
    <div class="zone-settings-header">
      <div>
        <div class="zone-settings-title">${zoneName(zoneId)}</div>
        <div class="zone-settings-sub">Editing baseline</div>
      </div>
    </div>
    <form id="zone-form">${html}</form>
  `;

  // Remove any existing save bar before adding a new one
  container.parentElement.querySelectorAll('.save-bar').forEach(el => el.remove());

  // Add save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = `
    <button type="button" class="btn-secondary" id="btn-cancel-zone">Cancel</button>
    <button type="button" class="btn-primary" id="btn-save-zone">Save Baseline</button>
  `;
  container.parentElement.appendChild(saveBar);

  // Range live update
  container.querySelectorAll('input[type="range"]').forEach(r => {
    const valEl = container.querySelector(`#val-${r.id}`);
    r.addEventListener('input', () => { if (valEl) valEl.textContent = r.value; });
  });

  // Suspension type toggle
  const typeToggle = container.querySelectorAll('input[name$="-type"]');
  typeToggle.forEach(t => {
    t.addEventListener('change', () => {
      updateSuspensionFields(container, t.value);
    });
  });

  document.getElementById('btn-save-zone').addEventListener('click', async () => {
    const data = collectFormData(zoneId, container);
    const updatedBaseline = { ...(bike.baseline || {}), ...data };
    try {
      await updateBike(bike.id, { baseline: updatedBaseline });
      bike.baseline = updatedBaseline;
      showToast('Baseline saved', 'success');
      onSaved && onSaved();
    } catch (e) {
      showToast('Failed to save: ' + e.message, 'error');
    }
  });

  document.getElementById('btn-cancel-zone').addEventListener('click', () => {
    onSaved && onSaved(true); // cancel
  });
}

export function renderSettingsPlaceholder(container) {
  // Remove save bar if present
  const saveBar = container.parentElement.querySelector('.save-bar');
  if (saveBar) saveBar.remove();

  container.innerHTML = `
    <div class="settings-placeholder">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="7" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
        <path d="M20 2v4M20 34v4M2 20h4M34 20h4M5.86 5.86l2.83 2.83M31.31 31.31l2.83 2.83M5.86 34.14l2.83-2.83M31.31 8.69l2.83-2.83" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      </svg>
      <p>Select a zone on the diagram to view and edit settings</p>
    </div>
  `;
}

// ── FORM BUILDERS ─────────────────────────────────────────

function tireForm(key, label, data = {}) {
  return `
    <div class="settings-section-divider">Tire Info</div>
    <div class="field-row">
      ${field('Brand', `${key}-brand`, data.brand, 'e.g. Maxxis')}
      ${field('Model', `${key}-model`, data.model, 'e.g. Minion DHF')}
    </div>
    <div class="field-row">
      ${field('Size', `${key}-size`, data.size, 'e.g. 29x2.5 WT')}
      ${field('Compound', `${key}-compound`, data.compound, 'e.g. 3C MaxxTerra')}
    </div>
    <div class="settings-section-divider">Pressure</div>
    <div class="field-group">
      <label class="field-label">Pressure (PSI)</label>
      <div class="range-container">
        <input type="range" id="${key}-psi" min="10" max="60" step="0.5" value="${data.psi ?? 25}" class="range-slider"/>
        <span class="range-val"><span id="val-${key}-psi">${data.psi ?? 25}</span> psi</span>
      </div>
    </div>
    <div class="field-row">
      ${field('Casing', `${key}-casing`, data.casing, 'e.g. EXO+, DD')}
      ${field('Inserts', `${key}-inserts`, data.inserts, 'e.g. Cushcore, none')}
    </div>
    <div class="field-group">
      ${fieldTextarea('Notes', `${key}-notes`, data.notes)}
    </div>
  `;
}

function suspensionForm(key, label, data = {}, isShock = false) {
  const type = data.type || 'air';
  const isCoil = type === 'coil';

  return `
    <div class="settings-section-divider">Identification</div>
    <div class="field-row">
      ${field('Brand', `${key}-brand`, data.brand, isShock ? 'e.g. Fox, RockShox' : 'e.g. Fox, RockShox')}
      ${field('Model', `${key}-model`, data.model, isShock ? 'e.g. Float X2' : 'e.g. 38 Factory')}
    </div>
    ${!isShock ? `<div class="field-row">
      ${field('Travel', `${key}-travel`, data.travel, 'e.g. 160mm')}
      ${field('Offset', `${key}-offset`, data.offset, 'e.g. 44mm')}
    </div>` : `<div class="field-row">
      ${field('Stroke', `${key}-stroke`, data.stroke, 'e.g. 55mm')}
      ${field('Eye-to-Eye', `${key}-eye`, data.eye, 'e.g. 230mm')}
    </div>`}

    <div class="settings-section-divider">Spring Type</div>
    <div class="field-group">
      <label class="field-label">Spring</label>
      <div class="radio-toggle">
        <input type="radio" id="${key}-type-air" name="${key}-type" value="air" ${!isCoil ? 'checked' : ''}>
        <label for="${key}-type-air">Air</label>
        <input type="radio" id="${key}-type-coil" name="${key}-type" value="coil" ${isCoil ? 'checked' : ''}>
        <label for="${key}-type-coil">Coil</label>
      </div>
    </div>

    <div id="${key}-air-fields" ${isCoil ? 'style="display:none"' : ''}>
      <div class="field-group">
        <label class="field-label">Air Pressure (PSI)</label>
        <div class="range-container">
          <input type="range" id="${key}-psi" min="50" max="300" step="1" value="${data.psi ?? (isShock ? 140 : 90)}" class="range-slider"/>
          <span class="range-val"><span id="val-${key}-psi">${data.psi ?? (isShock ? 140 : 90)}</span> psi</span>
        </div>
      </div>
      <div class="field-row">
        ${field('Volume Spacers / Tokens', `${key}-tokens`, data.tokens, 'e.g. 2', 'number')}
        ${field('Spacer Size', `${key}-spacerSize`, data.spacerSize, 'e.g. 10ml, large')}
      </div>
    </div>

    <div id="${key}-coil-fields" ${!isCoil ? 'style="display:none"' : ''}>
      <div class="field-row">
        ${field('Spring Rate', `${key}-springRate`, data.springRate, 'e.g. 500 lbs/in')}
        ${field('Spring Brand', `${key}-springBrand`, data.springBrand, 'e.g. Öhlins STX22')}
      </div>
    </div>

    <div class="settings-section-divider">Damper — Rebound</div>
    <div class="field-group">
      <label class="field-label">Low Speed Rebound (clicks from closed)</label>
      <div class="range-container">
        <input type="range" id="${key}-lsr" min="0" max="30" step="1" value="${data.lsr ?? 10}" class="range-slider"/>
        <span class="range-val"><span id="val-${key}-lsr">${data.lsr ?? 10}</span></span>
      </div>
    </div>
    ${!isShock ? '' : `
    <div class="field-group">
      <label class="field-label">High Speed Rebound (clicks from closed)</label>
      <div class="range-container">
        <input type="range" id="${key}-hsr" min="0" max="20" step="1" value="${data.hsr ?? 5}" class="range-slider"/>
        <span class="range-val"><span id="val-${key}-hsr">${data.hsr ?? 5}</span></span>
      </div>
    </div>`}
    ${!isShock ? `
    <div class="field-group">
      <label class="field-label">High Speed Rebound (clicks from closed)</label>
      <div class="range-container">
        <input type="range" id="${key}-hsr" min="0" max="20" step="1" value="${data.hsr ?? 5}" class="range-slider"/>
        <span class="range-val"><span id="val-${key}-hsr">${data.hsr ?? 5}</span></span>
      </div>
    </div>` : ''}

    <div class="settings-section-divider">Damper — Compression</div>
    <div class="field-group">
      <label class="field-label">Low Speed Compression (clicks from closed)</label>
      <div class="range-container">
        <input type="range" id="${key}-lsc" min="0" max="30" step="1" value="${data.lsc ?? 8}" class="range-slider"/>
        <span class="range-val"><span id="val-${key}-lsc">${data.lsc ?? 8}</span></span>
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">High Speed Compression (clicks from closed)</label>
      <div class="range-container">
        <input type="range" id="${key}-hsc" min="0" max="20" step="1" value="${data.hsc ?? 4}" class="range-slider"/>
        <span class="range-val"><span id="val-${key}-hsc">${data.hsc ?? 4}</span></span>
      </div>
    </div>
    <div class="field-group">
      ${fieldTextarea('Notes', `${key}-notes`, data.notes)}
    </div>
  `;
}

function cockpitForm(baseline = {}) {
  const hb = baseline.handlebar || {};
  const st = baseline.stem || {};
  const br = baseline.brakes || {};
  const gr = baseline.grips || {};
  return `
    <div class="settings-section-divider">Handlebar</div>
    <div class="field-row">
      ${field('Brand', 'hb-brand', hb.brand)}
      ${field('Model', 'hb-model', hb.model)}
    </div>
    <div class="field-row">
      ${field('Width', 'hb-width', hb.width, 'e.g. 780mm')}
      ${field('Rise', 'hb-rise', hb.rise, 'e.g. 20mm')}
    </div>
    <div class="field-row">
      ${field('Backsweep', 'hb-sweep', hb.sweep, 'e.g. 9°')}
      ${field('Material', 'hb-material', hb.material, 'e.g. Carbon, Alloy')}
    </div>
    <div class="settings-section-divider">Stem</div>
    <div class="field-row">
      ${field('Brand', 'st-brand', st.brand)}
      ${field('Model', 'st-model', st.model)}
    </div>
    <div class="field-row">
      ${field('Length', 'st-length', st.length, 'e.g. 50mm')}
      ${field('Clamp Diameter', 'st-clamp', st.clamp, 'e.g. 31.8mm')}
    </div>
    <div class="settings-section-divider">Brakes</div>
    <div class="field-row">
      ${field('Brand', 'br-brand', br.brand, 'e.g. SRAM, Shimano')}
      ${field('Model', 'br-model', br.model, 'e.g. Code RSC')}
    </div>
    <div class="field-row">
      ${field('Lever Reach', 'br-reach', br.reach, 'e.g. 3 clicks')}
      ${field('Bite Point', 'br-bite', br.bite, 'e.g. 4 clicks')}
    </div>
    <div class="settings-section-divider">Grips</div>
    <div class="field-row">
      ${field('Brand', 'gr-brand', gr.brand, 'e.g. Ergon, ODI')}
      ${field('Model', 'gr-model', gr.model, 'e.g. GA2 Fat')}
    </div>
    <div class="field-group">${fieldTextarea('Notes', 'cockpit-notes', baseline.cockpitNotes)}</div>
  `;
}

function drivetrainForm(baseline = {}) {
  const dt = baseline.drivetrain || {};
  return `
    <div class="settings-section-divider">Drivetrain</div>
    <div class="field-row">
      ${field('Brand', 'dt-brand', dt.brand, 'e.g. SRAM, Shimano')}
      ${field('Group / Model', 'dt-model', dt.model, 'e.g. GX Eagle AXS')}
    </div>
    <div class="field-row">
      ${field('Cassette', 'dt-cassette', dt.cassette, 'e.g. 10-52t')}
      ${field('Chainring', 'dt-chainring', dt.chainring, 'e.g. 32t')}
    </div>
    <div class="field-row">
      ${field('Chain', 'dt-chain', dt.chain, 'e.g. SRAM XX1 Eagle')}
      ${field('Rear Derailleur', 'dt-rd', dt.rd, 'e.g. GX Eagle')}
    </div>
    <div class="field-group">${fieldTextarea('Notes', 'dt-notes', dt.notes)}</div>
  `;
}

function dropperForm(bikeType, baseline = {}) {
  const dp = baseline.dropper || {};
  const isRoad = bikeType === 'road';
  const label = isRoad ? 'Seatpost' : 'Dropper Post';
  return `
    <div class="settings-section-divider">${label}</div>
    <div class="field-row">
      ${field('Brand', 'dp-brand', dp.brand)}
      ${field('Model', 'dp-model', dp.model)}
    </div>
    <div class="field-row">
      ${!isRoad ? field('Travel', 'dp-travel', dp.travel, 'e.g. 170mm') : field('Length', 'dp-length', dp.length, 'e.g. 350mm')}
      ${field('Diameter', 'dp-diameter', dp.diameter, 'e.g. 31.6mm')}
    </div>
    <div class="field-group">${fieldTextarea('Notes', 'dp-notes', dp.notes)}</div>
  `;
}

function frameForm(baseline = {}) {
  const fr = baseline.frame || {};
  const wh = baseline.wheels || {};
  return `
    <div class="settings-section-divider">Frame</div>
    <div class="field-row">
      ${field('Brand', 'fr-brand', fr.brand)}
      ${field('Model', 'fr-model', fr.model)}
    </div>
    <div class="field-row">
      ${field('Year', 'fr-year', fr.year, 'e.g. 2024')}
      ${field('Size', 'fr-size', fr.size, 'e.g. Large, XL')}
    </div>
    <div class="field-row">
      ${field('Material', 'fr-material', fr.material, 'e.g. Carbon, Alloy')}
      ${field('Color', 'fr-color', fr.color)}
    </div>
    <div class="settings-section-divider">Wheels</div>
    <div class="field-row">
      ${field('Brand', 'wh-brand', wh.brand, 'e.g. Industry Nine')}
      ${field('Model', 'wh-model', wh.model)}
    </div>
    <div class="field-row">
      ${field('Wheel Size', 'wh-size', wh.size, 'e.g. 29", 27.5"')}
      ${field('Hub Standard', 'wh-hub', wh.hub, 'e.g. Boost 148')}
    </div>
    <div class="field-group">${fieldTextarea('Notes', 'fr-notes', fr.notes)}</div>
  `;
}

// ── FIELD HELPERS ─────────────────────────────────────────

function field(label, id, value = '', placeholder = '', type = 'text') {
  return `<div class="field-group">
    <label class="field-label" for="${id}">${label}</label>
    <input type="${type}" id="${id}" class="field-input" value="${escHtml(value ?? '')}" placeholder="${escHtml(placeholder)}">
  </div>`;
}

function fieldTextarea(label, id, value = '') {
  return `<label class="field-label" for="${id}">${label}</label>
  <textarea id="${id}" class="field-input" rows="3">${escHtml(value ?? '')}</textarea>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── COLLECT FORM DATA ─────────────────────────────────────

function collectFormData(zoneId, container) {
  const val = id => container.querySelector(`#${id}`)?.value?.trim() || '';
  const num = id => { const v = container.querySelector(`#${id}`)?.value; return v ? parseFloat(v) : null; };
  const radio = name => container.querySelector(`input[name="${name}"]:checked`)?.value;

  switch (zoneId) {
    case 'front-wheel': return { frontTire: { brand: val('frontTire-brand'), model: val('frontTire-model'), size: val('frontTire-size'), compound: val('frontTire-compound'), casing: val('frontTire-casing'), inserts: val('frontTire-inserts'), psi: num('frontTire-psi'), notes: val('frontTire-notes') } };
    case 'rear-wheel':  return { rearTire:  { brand: val('rearTire-brand'),  model: val('rearTire-model'),  size: val('rearTire-size'),  compound: val('rearTire-compound'),  casing: val('rearTire-casing'),  inserts: val('rearTire-inserts'),  psi: num('rearTire-psi'),  notes: val('rearTire-notes') } };
    case 'fork': return { fork: collectSuspension('fork', container) };
    case 'shock': return { shock: collectSuspension('shock', container) };
    case 'handlebar': return {
      handlebar: { brand: val('hb-brand'), model: val('hb-model'), width: val('hb-width'), rise: val('hb-rise'), sweep: val('hb-sweep'), material: val('hb-material') },
      stem:      { brand: val('st-brand'), model: val('st-model'), length: val('st-length'), clamp: val('st-clamp') },
      brakes:    { brand: val('br-brand'), model: val('br-model'), reach: val('br-reach'), bite: val('br-bite') },
      grips:     { brand: val('gr-brand'), model: val('gr-model') },
      cockpitNotes: val('cockpit-notes')
    };
    case 'drivetrain': return { drivetrain: { brand: val('dt-brand'), model: val('dt-model'), cassette: val('dt-cassette'), chainring: val('dt-chainring'), chain: val('dt-chain'), rd: val('dt-rd'), notes: val('dt-notes') } };
    case 'dropper': return { dropper: { brand: val('dp-brand'), model: val('dp-model'), travel: val('dp-travel'), length: val('dp-length'), diameter: val('dp-diameter'), notes: val('dp-notes') } };
    case 'frame': return {
      frame:  { brand: val('fr-brand'), model: val('fr-model'), year: val('fr-year'), size: val('fr-size'), material: val('fr-material'), color: val('fr-color'), notes: val('fr-notes') },
      wheels: { brand: val('wh-brand'), model: val('wh-model'), size: val('wh-size'), hub: val('wh-hub') }
    };
    default: return {};
  }
}

function collectSuspension(key, container) {
  const val = id => container.querySelector(`#${id}`)?.value?.trim() || '';
  const num = id => { const v = container.querySelector(`#${id}`)?.value; return v ? parseFloat(v) : null; };
  const radio = name => container.querySelector(`input[name="${name}"]:checked`)?.value;

  const type = radio(`${key}-type`) || 'air';
  return {
    brand: val(`${key}-brand`), model: val(`${key}-model`),
    travel: val(`${key}-travel`), offset: val(`${key}-offset`),
    stroke: val(`${key}-stroke`), eye: val(`${key}-eye`),
    type,
    psi:        type === 'air' ? num(`${key}-psi`)        : null,
    tokens:     type === 'air' ? num(`${key}-tokens`)     : null,
    spacerSize: type === 'air' ? val(`${key}-spacerSize`) : null,
    springRate: type === 'coil' ? val(`${key}-springRate`) : null,
    springBrand: type === 'coil' ? val(`${key}-springBrand`) : null,
    lsr: num(`${key}-lsr`), hsr: num(`${key}-hsr`),
    lsc: num(`${key}-lsc`), hsc: num(`${key}-hsc`),
    notes: val(`${key}-notes`)
  };
}

function updateSuspensionFields(container, type) {
  const isCoil = type === 'coil';
  container.querySelectorAll('[id$="-air-fields"]').forEach(el => {
    el.style.display = isCoil ? 'none' : '';
  });
  container.querySelectorAll('[id$="-coil-fields"]').forEach(el => {
    el.style.display = isCoil ? '' : 'none';
  });
}

function zoneName(id) {
  const names = {
    'front-wheel': 'Front Wheel & Tire',
    'rear-wheel':  'Rear Wheel & Tire',
    'fork':        'Fork',
    'shock':       'Rear Shock',
    'handlebar':   'Cockpit & Bars',
    'drivetrain':  'Drivetrain',
    'dropper':     'Dropper / Saddle',
    'frame':       'Frame',
  };
  return names[id] || id;
}

// ── FULL BASELINE SUMMARY ─────────────────────────────────
// Returns a compact text summary of all baseline settings
export function baselineSummary(bike) {
  const bl = bike.baseline || {};
  const lines = [];
  const ft = bl.frontTire; if (ft?.brand) lines.push(`F Tire: ${ft.brand} ${ft.model||''} ${ft.size||''} @ ${ft.psi||'?'}psi`);
  const rt = bl.rearTire;  if (rt?.brand) lines.push(`R Tire: ${rt.brand} ${rt.model||''} ${rt.size||''} @ ${rt.psi||'?'}psi`);
  const fk = bl.fork;      if (fk?.brand) lines.push(`Fork: ${fk.brand} ${fk.model||''} ${fk.type==='air'?`@ ${fk.psi||'?'}psi`:'(coil)'} | LSR:${fk.lsr??'?'} HSR:${fk.hsr??'?'} LSC:${fk.lsc??'?'} HSC:${fk.hsc??'?'}`);
  const sk = bl.shock;     if (sk?.brand) lines.push(`Shock: ${sk.brand} ${sk.model||''} ${sk.type==='air'?`@ ${sk.psi||'?'}psi`:'(coil)'} | LSR:${sk.lsr??'?'} HSR:${sk.hsr??'?'} LSC:${sk.lsc??'?'} HSC:${sk.hsc??'?'}`);
  return lines;
}

// ── COCKPIT SUB-ZONE FORMS ────────────────────────────────
export function renderCockpitSubZone(subZone, bike, container, onSaved) {
  const bl = bike.baseline || {};
  let html = '', title = '';

  switch(subZone) {
    case 'cockpit-bars': {
      title = 'Handlebar';
      const hb = bl.handlebar || {};
      html = `
        <div class="field-row">${field('Brand','hb-brand',hb.brand)}${field('Model','hb-model',hb.model)}</div>
        <div class="field-row">${field('Width','hb-width',hb.width,'e.g. 780mm')}${field('Rise','hb-rise',hb.rise,'e.g. 20mm')}</div>
        <div class="field-row">${field('Backsweep','hb-sweep',hb.sweep,'e.g. 9°')}${field('Material','hb-material',hb.material,'e.g. Carbon, Alloy')}</div>`;
      break;
    }
    case 'cockpit-stem': {
      title = 'Stem';
      const st = bl.stem || {};
      html = `
        <div class="field-row">${field('Brand','st-brand',st.brand)}${field('Model','st-model',st.model)}</div>
        <div class="field-row">${field('Length','st-length',st.length,'e.g. 50mm')}${field('Clamp','st-clamp',st.clamp,'e.g. 31.8mm')}</div>`;
      break;
    }
    case 'cockpit-brakes': {
      title = 'Brakes & Shifters';
      const br = bl.brakes || {};
      html = `
        <div class="field-row">${field('Brand','br-brand',br.brand,'e.g. SRAM, Shimano')}${field('Model','br-model',br.model,'e.g. Code RSC')}</div>
        <div class="field-row">${field('Lever Reach','br-reach',br.reach,'e.g. 3 clicks')}${field('Bite Point','br-bite',br.bite,'e.g. 4 clicks')}</div>`;
      break;
    }
    case 'cockpit-grips': {
      title = 'Grips';
      const gr = bl.grips || {};
      html = `<div class="field-row">${field('Brand','gr-brand',gr.brand,'e.g. Ergon, ODI')}${field('Model','gr-model',gr.model,'e.g. GA2 Fat')}</div>`;
      break;
    }
    case 'cockpit-stack': {
      title = 'Stack & Headset';
      const hs = bl.headset || {};
      html = `
        <div class="field-row">${field('Headset Brand','hs-brand',hs.brand,'e.g. Cane Creek')}${field('Headset Model','hs-model',hs.model,'e.g. 40 Series')}</div>
        <div class="field-row">${field('Stack Height','hs-stack',hs.stack,'e.g. 25mm')}${field('Spacers','hs-spacers',hs.spacers,'e.g. 3× 5mm')}</div>`;
      break;
    }
    default: return;
  }

  container.innerHTML = `
    <div class="zone-settings-header">
      <div>
        <div class="zone-settings-title">${title}</div>
        <div class="zone-settings-sub">Cockpit detail</div>
      </div>
    </div>
    <form id="zone-form">${html}</form>`;

  container.parentElement.querySelectorAll('.save-bar').forEach(el => el.remove());
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = `
    <button type="button" class="btn-secondary" id="btn-cancel-zone">Cancel</button>
    <button type="button" class="btn-primary"   id="btn-save-zone">Save</button>`;
  container.parentElement.appendChild(saveBar);

  document.getElementById('btn-save-zone').addEventListener('click', async () => {
    const val = id => container.querySelector(`#${id}`)?.value?.trim() || '';
    let data = {};
    switch(subZone) {
      case 'cockpit-bars':   data = { handlebar: {...(bl.handlebar||{}), brand:val('hb-brand'), model:val('hb-model'), width:val('hb-width'), rise:val('hb-rise'), sweep:val('hb-sweep'), material:val('hb-material') }}; break;
      case 'cockpit-stem':   data = { stem:      {...(bl.stem||{}),      brand:val('st-brand'), model:val('st-model'), length:val('st-length'), clamp:val('st-clamp') }}; break;
      case 'cockpit-brakes': data = { brakes:    {...(bl.brakes||{}),    brand:val('br-brand'), model:val('br-model'), reach:val('br-reach'), bite:val('br-bite') }}; break;
      case 'cockpit-grips':  data = { grips:     {...(bl.grips||{}),     brand:val('gr-brand'), model:val('gr-model') }}; break;
      case 'cockpit-stack':  data = { headset:   { brand:val('hs-brand'), model:val('hs-model'), stack:val('hs-stack'), spacers:val('hs-spacers') }}; break;
    }
    const updatedBaseline = {...(bike.baseline||{}), ...data};
    try {
      await updateBike(bike.id, { baseline: updatedBaseline });
      bike.baseline = updatedBaseline;
      showToast('Saved', 'success');
      onSaved && onSaved();
    } catch(e) { showToast('Failed: ' + e.message, 'error'); }
  });

  document.getElementById('btn-cancel-zone').addEventListener('click', () => {
    onSaved && onSaved(true);
  });
}
