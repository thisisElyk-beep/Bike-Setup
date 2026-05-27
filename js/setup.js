import { updateBike } from './db.js';
import { showToast } from './utils.js';

// Bike type helpers
const isDropBar = t => ['gravel','road'].includes(t);
const isRigidFork = t => ['gravel','road','dirtjumper'].includes(t);
const hasDrooper = t => ['mtb','emtb','hardtail'].includes(t);

// ── ZONE → FORM RENDERER ──────────────────────────────────

export function renderZoneSettings(zoneId, bike, container, onSaved) {
  const baseline = bike.baseline || {};
  const type = bike.type || 'mtb';
  let html = '';

  switch (zoneId) {
    case 'front-wheel': html = tireForm('frontTire', baseline.frontTire, baseline.frontWheel || {}, type); break;
    case 'rear-wheel':  html = tireForm('rearTire',  baseline.rearTire,  baseline.rearWheel  || {}, type); break;
    case 'fork':
      html = isRigidFork(type)
        ? rigidForkForm(baseline.fork)
        : suspensionForm('fork', 'Fork', baseline.fork, false);
      break;
    case 'shock': html = suspensionForm('shock', 'Rear Shock', baseline.shock, true); break;
    case 'handlebar':  html = cockpitForm(baseline, type); break;
    case 'drivetrain': html = drivetrainForm(baseline, type); break;
    case 'dropper':    html = hasDrooper(type) ? dropperForm(baseline) : seatpostForm(baseline); break;
    case 'frame':      html = frameForm(baseline); break;
    default: html = '<p style="color:var(--text-muted);font-size:.85rem">No settings for this zone.</p>';
  }

  // Check if this zone has any existing data
  const hasData = zoneHasData(zoneId, baseline, type);
  container.innerHTML = `
    <div class="zone-settings-header">
      <div style="display:flex;align-items:center;gap:.5rem">
        <div class="zone-settings-title">${zoneName(zoneId, type)}</div>
        ${hasData ? '<span class="zone-filled-badge">Saved</span>' : '<span class="zone-empty-badge">Empty</span>'}
      </div>
      <div class="zone-settings-sub">Editing baseline</div>
    </div>
    <form id="zone-form">${html}</form>
  `;

  container.parentElement.querySelectorAll('.save-bar').forEach(el => el.remove());
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = `
    <button type="button" class="btn-secondary" id="btn-cancel-zone">Cancel</button>
    <button type="button" class="btn-primary" id="btn-save-zone">Save Baseline</button>
  `;
  container.parentElement.appendChild(saveBar);

  // Bind damper preset buttons
  container.querySelectorAll('.damper-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      container.querySelectorAll(`.damper-preset-btn[data-key="${key}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Re-render the damper fields based on new preset
      const dt = btn.dataset.preset;
      const fieldsEl = container.querySelector(`#${key}-damper-fields`);
      if (!fieldsEl) return;
      // Get current values before wiping
      const getVal = id => { const el = container.querySelector(`#${id}`); return el ? parseFloat(el.value) || null : null; };
      const fakeData = {
        damperType: dt,
        lsr: getVal(`${key}-lsr`), hsr: getVal(`${key}-hsr`),
        lsc: getVal(`${key}-lsc`), hsc: getVal(`${key}-hsc`),
      };
      fieldsEl.innerHTML = damperFieldsHtml(key, fakeData);
      // Re-bind spinners in new content
      fieldsEl.querySelectorAll('.spinner-btn').forEach(sb => {
        sb.addEventListener('click', () => {
          const inp = container.querySelector(`#${sb.dataset.id}`);
          if (!inp) return;
          const step=parseFloat(sb.dataset.step||1), min=parseFloat(sb.dataset.min??0), max=parseFloat(sb.dataset.max??999);
          const cur=parseFloat(inp.value)||0;
          inp.value = sb.classList.contains('spinner-minus')
            ? Math.max(min,parseFloat((cur-step).toFixed(3)))
            : Math.min(max,parseFloat((cur+step).toFixed(3)));
        });
      });
    });
  });

  // Bind spinner −/+ buttons
  container.querySelectorAll('.spinner-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = container.querySelector(`#${btn.dataset.id}`);
      if (!input) return;
      const step = parseFloat(btn.dataset.step || 1);
      const min  = parseFloat(btn.dataset.min ?? -Infinity);
      const max  = parseFloat(btn.dataset.max ?? Infinity);
      const cur  = parseFloat(input.value) || 0;
      const next = btn.classList.contains('spinner-minus')
        ? Math.max(min, parseFloat((cur - step).toFixed(3)))
        : Math.min(max, parseFloat((cur + step).toFixed(3)));
      input.value = next;
    });
  });

  container.querySelectorAll('input[name$="-type"]').forEach(t => {
    t.addEventListener('change', () => updateSuspensionFields(container, t.value));
  });

  document.getElementById('btn-save-zone').addEventListener('click', async () => {
    const data = collectFormData(zoneId, container, type);
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
    onSaved && onSaved(true);
  });
}

export function renderSettingsPlaceholder(container) {
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

function tireForm(key, tireData = {}, wheelData = {}, bikeType = 'mtb') {
  const wKey = key === 'frontTire' ? 'frontWheel' : 'rearWheel';
  const showInserts = !isDropBar(bikeType); // inserts only relevant for MTB/DJ
  return `
    <div class="settings-section-divider">Wheel</div>
    <div class="field-row">
      ${field('Brand', `${wKey}-brand`, wheelData.brand)}
      ${field('Model', `${wKey}-model`, wheelData.model)}
    </div>
    <div class="field-row">
      ${field('Size', `${wKey}-size`, wheelData.size, 'e.g. 29"')}
      ${field('Hub Standard', `${wKey}-hub`, wheelData.hub, 'e.g. Boost 148')}
    </div>
    <div class="settings-section-divider">Tire</div>
    <div class="field-row">
      ${field('Brand', `${key}-brand`, tireData.brand)}
      ${field('Model', `${key}-model`, tireData.model)}
    </div>
    <div class="field-row">
      ${field('Size', `${key}-size`, tireData.size, isDropBar(bikeType) ? 'e.g. 700×40c' : 'e.g. 29×2.5 WT')}
      ${field('Compound', `${key}-compound`, tireData.compound, isDropBar(bikeType) ? 'e.g. Clincher, Tubeless' : 'e.g. 3C MaxxTerra')}
    </div>
    <div class="settings-section-divider">Pressure</div>
    ${spinner('Pressure', `${key}-psi`, tireData.psi ?? 25, 0.5, 10, isDropBar(bikeType) ? 160 : 65, 'psi')}
    <div class="field-row">
      ${field('Casing', `${key}-casing`, tireData.casing, isDropBar(bikeType) ? 'e.g. Folding, Wire' : 'e.g. EXO+, DD')}
      ${showInserts ? field('Inserts', `${key}-inserts`, tireData.inserts, 'e.g. Cushcore, none') : ''}
    </div>
    <div class="field-group">${fieldTextarea('Notes', `${key}-notes`, tireData.notes)}</div>
  `;
}

// Suspension fork (MTB / Hardtail)
// ── DAMPER FIELDS (called by suspensionForm and preset buttons) ──
function damperFieldsHtml(key, data) {
  const dt     = (data && data.damperType) || '4way';
  const single  = dt === 'single';
  const showHSR = dt === '3way' || dt === '4way';
  const showLSC = dt === '2way' || dt === '3way' || dt === '4way';
  const showHSC = dt === '4way';
  const lsr = (data && data.lsr != null) ? data.lsr : 10;
  const hsr = (data && data.hsr != null) ? data.hsr : 5;
  const lsc = (data && data.lsc != null) ? data.lsc : 8;
  const hsc = (data && data.hsc != null) ? data.hsc : 4;
  const hidden = (id, val) => '<input type="hidden" id="' + id + '" value="' + val + '">';
  let html = '<div class="settings-section-divider">Damper \u2014 Rebound</div>';
  html += spinner(single ? 'Rebound' : 'Low Speed Rebound', key + '-lsr', lsr, 1, 0, 40, 'clicks');
  html += showHSR ? spinner('High Speed Rebound', key + '-hsr', hsr, 1, 0, 40, 'clicks') : hidden(key + '-hsr', hsr);
  if (showLSC || showHSC) html += '<div class="settings-section-divider">Damper \u2014 Compression</div>';
  html += showLSC ? spinner('Low Speed Compression', key + '-lsc', lsc, 1, 0, 40, 'clicks') : hidden(key + '-lsc', lsc);
  html += showHSC ? spinner('High Speed Compression', key + '-hsc', hsc, 1, 0, 40, 'clicks') : hidden(key + '-hsc', hsc);
  return html;
}

function suspensionForm(key, label, data = {}, isShock = false) {
  const type = data.type || 'air';
  const isCoil = type === 'coil';
  return `
    <div class="settings-section-divider">Identification</div>
    <div class="field-row">
      ${field('Brand', `${key}-brand`, data.brand)}
      ${field('Model', `${key}-model`, data.model)}
    </div>
    <div class="field-group">
      <label class="field-label">Damper Type</label>
      <div class="damper-presets" id="${key}-damper-type">
        ${[
          {id:'single',  label:'Rebound Only'},
          {id:'2way',    label:'LSR + LSC'},
          {id:'3way',    label:'LSR + HSR + LSC'},
          {id:'4way',    label:'LSR + HSR + LSC + HSC'},
        ].map(p => `<button type="button" class="damper-preset-btn ${(data.damperType||'4way')===p.id?'active':''}" data-key="${key}" data-preset="${p.id}">${p.label}</button>`).join('')}
      </div>
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
      ${spinner('Air Pressure', `${key}-psi`, data.psi ?? (isShock ? 140 : 90), 1, 20, 350, 'psi')}
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
    <div id="${key}-damper-fields">
    ${damperFieldsHtml(key, data)}
    </div>
    ${!isShock ? `
    <div class="settings-section-divider">Damper Internals</div>
    <div class="field-row">
      ${field('Damper Brand', `${key}-damperBrand`, data.damperBrand)}
      ${field('Damper Model', `${key}-damperModel`, data.damperModel)}
    </div>
    <div class="field-row">
      ${field('Tune', `${key}-tune`, data.tune, 'e.g. Medium, Firm')}
      ${field('Oil Weight', `${key}-oilWeight`, data.oilWeight, 'e.g. 5wt, 7.5wt')}
    </div>
    <div class="field-row">
      ${field('Lower Leg Oil', `${key}-lowerLegOil`, data.lowerLegOil, 'e.g. 10ml 15wt')}
      ${field('Last Service', `${key}-lastService`, data.lastService, '', 'date')}
    </div>` : ''}
    <div class="field-group">${fieldTextarea('Notes', `${key}-notes`, data.notes)}</div>
  `;
}

// Rigid fork (DJ / Gravel / Road)
function rigidForkForm(data = {}) {
  return `
    <div class="settings-section-divider">Fork</div>
    <div class="field-row">
      ${field('Brand', 'fork-brand', data.brand)}
      ${field('Model', 'fork-model', data.model)}
    </div>
    <div class="field-row">
      ${field('Rake / Offset', 'fork-offset', data.offset, 'e.g. 47mm')}
      ${field('Material', 'fork-material', data.material, 'e.g. Carbon, Steel')}
    </div>
    <div class="field-row">
      ${field('Blade Shape', 'fork-blade', data.blade, 'e.g. Round, Aero')}
      ${field('Axle Standard', 'fork-axle', data.axle, 'e.g. 12×100, QR')}
    </div>
    <div class="field-group">${fieldTextarea('Notes', 'fork-notes', data.notes)}</div>
  `;
}

// Cockpit overview (handlebar zone — full summary)
function cockpitForm(baseline = {}, bikeType = 'mtb') {
  const hb = baseline.handlebar || {};
  const st = baseline.stem || {};
  const br = baseline.brakes || {};
  const gr = baseline.grips || {};
  const bt = baseline.bartape || {};
  const drop = isDropBar(bikeType);

  return `
    <div class="settings-section-divider">Handlebar</div>
    <div class="field-row">
      ${field('Brand', 'hb-brand', hb.brand)}
      ${field('Model', 'hb-model', hb.model)}
    </div>
    <div class="field-row">
      ${field('Width', 'hb-width', hb.width, drop ? 'e.g. 420mm' : 'e.g. 780mm')}
      ${drop
        ? field('Reach', 'hb-reach', hb.reach, 'e.g. 80mm')
        : field('Rise', 'hb-rise', hb.rise, 'e.g. 20mm')}
    </div>
    <div class="field-row">
      ${drop
        ? field('Drop', 'hb-drop', hb.drop, 'e.g. 128mm')
        : field('Backsweep', 'hb-sweep', hb.sweep, 'e.g. 9°')}
      ${drop
        ? field('Flare', 'hb-flare', hb.flare, 'e.g. 12°')
        : field('Material', 'hb-material', hb.material, 'e.g. Carbon, Alloy')}
    </div>
    ${!drop ? `<div class="field-row">
      ${field('Material', 'hb-material', hb.material, 'e.g. Carbon, Alloy')}
      <div class="field-group"></div>
    </div>` : `<div class="field-row">
      ${field('Material', 'hb-material', hb.material, 'e.g. Carbon, Alloy')}
      <div class="field-group"></div>
    </div>`}
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
      ${field('Brand', 'br-brand', br.brand)}
      ${field('Model', 'br-model', br.model)}
    </div>
    <div class="field-row">
      ${field('Lever Reach', 'br-reach', br.reach, 'e.g. 3 clicks')}
      ${field('Bite Point', 'br-bite', br.bite, 'e.g. 4 clicks')}
    </div>
    ${drop ? `
    <div class="settings-section-divider">Bar Tape</div>
    <div class="field-row">
      ${field('Brand', 'bt-brand', bt.brand)}
      ${field('Model', 'bt-model', bt.model)}
    </div>
    <div class="field-row">
      ${field('Material', 'bt-material', bt.material, 'e.g. Cork, Gel, Foam')}
      ${field('Color', 'bt-color', bt.color)}
    </div>` : `
    <div class="settings-section-divider">Grips</div>
    <div class="field-row">
      ${field('Brand', 'gr-brand', gr.brand)}
      ${field('Model', 'gr-model', gr.model)}
    </div>`}
    <div class="field-group">${fieldTextarea('Notes', 'cockpit-notes', baseline.cockpitNotes)}</div>
  `;
}

// Drivetrain — bike-type-aware
function drivetrainForm(baseline = {}, bikeType = 'mtb') {
  const dt = baseline.drivetrain || {};
  if (bikeType === 'road') {
    return `
      <div class="settings-section-divider">Groupset</div>
      <div class="field-row">
        ${field('Brand', 'dt-brand', dt.brand, 'e.g. Shimano, SRAM')}
        ${field('Groupset', 'dt-model', dt.model, 'e.g. Dura-Ace Di2 12sp')}
      </div>
      <div class="field-row">
        ${field('Speeds', 'dt-speeds', dt.speeds, 'e.g. 11, 12')}
        ${field('Cable / Di2 / AXS', 'dt-actuation', dt.actuation, 'e.g. Di2, AXS, Cable')}
      </div>
      <div class="field-row">
        ${field('Cassette', 'dt-cassette', dt.cassette, 'e.g. 11-30t')}
        ${field('Chain', 'dt-chain', dt.chain, 'e.g. CN-HG901')}
      </div>
      <div class="field-group">${fieldTextarea('Notes', 'dt-notes', dt.notes)}</div>
    `;
  }
  if (bikeType === 'gravel') {
    return `
      <div class="settings-section-divider">Drivetrain</div>
      <div class="field-row">
        ${field('Brand', 'dt-brand', dt.brand, 'e.g. SRAM, Shimano')}
        ${field('Group / Model', 'dt-model', dt.model, 'e.g. Rival AXS')}
      </div>
      <div class="field-row">
        ${field('Configuration', 'dt-config', dt.config, 'e.g. 1×, 2×')}
        ${field('Speeds', 'dt-speeds', dt.speeds, 'e.g. 12')}
      </div>
      <div class="field-row">
        ${field('Cassette', 'dt-cassette', dt.cassette, 'e.g. 10-44t')}
        ${field('Chainring(s)', 'dt-chainring', dt.chainring, 'e.g. 40t or 46/30')}
      </div>
      <div class="field-row">
        ${field('Chain', 'dt-chain', dt.chain, 'e.g. SRAM Rival')}
        ${field('Rear Derailleur', 'dt-rd', dt.rd, 'e.g. Rival AXS')}
      </div>
      <div class="field-group">${fieldTextarea('Notes', 'dt-notes', dt.notes)}</div>
    `;
  }
  // MTB / Hardtail / DJ
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

// Dropper post (MTB / Hardtail)
function dropperForm(baseline = {}) {
  const dp = baseline.dropper || {};
  return `
    <div class="settings-section-divider">Dropper Post</div>
    <div class="field-row">
      ${field('Brand', 'dp-brand', dp.brand)}
      ${field('Model', 'dp-model', dp.model)}
    </div>
    <div class="field-row">
      ${field('Travel', 'dp-travel', dp.travel, 'e.g. 170mm')}
      ${field('Diameter', 'dp-diameter', dp.diameter, 'e.g. 31.6mm')}
    </div>
    <div class="field-row">
      ${field('Actuation', 'dp-actuation', dp.actuation, 'e.g. Cable, Reverb AXS')}
      <div class="field-group"></div>
    </div>
    <div class="field-group">${fieldTextarea('Notes', 'dp-notes', dp.notes)}</div>
  `;
}

// Seatpost (DJ / Gravel / Road)
function seatpostForm(baseline = {}) {
  const sp = baseline.seatpost || baseline.dropper || {};
  return `
    <div class="settings-section-divider">Seatpost</div>
    <div class="field-row">
      ${field('Brand', 'sp-brand', sp.brand)}
      ${field('Model', 'sp-model', sp.model)}
    </div>
    <div class="field-row">
      ${field('Length', 'sp-length', sp.length, 'e.g. 350mm')}
      ${field('Diameter', 'sp-diameter', sp.diameter, 'e.g. 27.2mm')}
    </div>
    <div class="field-row">
      ${field('Setback', 'sp-setback', sp.setback, 'e.g. 0mm, 20mm')}
      ${field('Material', 'sp-material', sp.material, 'e.g. Carbon, Alloy')}
    </div>
    <div class="field-group">${fieldTextarea('Notes', 'sp-notes', sp.notes)}</div>
  `;
}

function frameForm(baseline = {}) {
  const fr = baseline.frame || {};
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

// Spinner: −/input/+ replacing range sliders
function spinner(label, id, value, step, min, max, unit = '') {
  const val = value != null ? value : '';
  return `<div class="field-group">
    <label class="field-label" for="${id}">${label}${unit ? ` <span class="field-unit">${unit}</span>` : ''}</label>
    <div class="spinner-row">
      <button type="button" class="spinner-btn spinner-minus" data-id="${id}" data-step="${step}" data-min="${min}" data-max="${max}" aria-label="Decrease">−</button>
      <input type="number" id="${id}" class="field-input spinner-input"
             value="${val}" min="${min}" max="${max}" step="${step}" placeholder="—">
      <button type="button" class="spinner-btn spinner-plus" data-id="${id}" data-step="${step}" data-min="${min}" data-max="${max}" aria-label="Increase">+</button>
    </div>
  </div>`;
}



// ── COLLECT FORM DATA ─────────────────────────────────────

function collectFormData(zoneId, container, bikeType = 'mtb') {
  const val = id => container.querySelector(`#${id}`)?.value?.trim() || '';
  const num = id => { const v = container.querySelector(`#${id}`)?.value; return v ? parseFloat(v) : null; };
  const drop = isDropBar(bikeType);

  switch (zoneId) {
    case 'front-wheel': return {
      frontTire:  { brand: val('frontTire-brand'), model: val('frontTire-model'), size: val('frontTire-size'), compound: val('frontTire-compound'), casing: val('frontTire-casing'), inserts: val('frontTire-inserts'), psi: num('frontTire-psi'), notes: val('frontTire-notes') },
      frontWheel: { brand: val('frontWheel-brand'), model: val('frontWheel-model'), size: val('frontWheel-size'), hub: val('frontWheel-hub') },
    };
    case 'rear-wheel': return {
      rearTire:   { brand: val('rearTire-brand'), model: val('rearTire-model'), size: val('rearTire-size'), compound: val('rearTire-compound'), casing: val('rearTire-casing'), inserts: val('rearTire-inserts'), psi: num('rearTire-psi'), notes: val('rearTire-notes') },
      rearWheel:  { brand: val('rearWheel-brand'), model: val('rearWheel-model'), size: val('rearWheel-size'), hub: val('rearWheel-hub') },
    };
    case 'fork':
      if (isRigidFork(bikeType)) return { fork: { brand: val('fork-brand'), model: val('fork-model'), offset: val('fork-offset'), material: val('fork-material'), blade: val('fork-blade'), axle: val('fork-axle'), notes: val('fork-notes') } };
      return { fork: collectSuspension('fork', container) };
    case 'shock': return { shock: collectSuspension('shock', container) };
    case 'handlebar': return {
      handlebar: drop
        ? { brand: val('hb-brand'), model: val('hb-model'), width: val('hb-width'), reach: val('hb-reach'), drop: val('hb-drop'), flare: val('hb-flare'), material: val('hb-material') }
        : { brand: val('hb-brand'), model: val('hb-model'), width: val('hb-width'), rise: val('hb-rise'), sweep: val('hb-sweep'), material: val('hb-material') },
      stem:    { brand: val('st-brand'), model: val('st-model'), length: val('st-length'), clamp: val('st-clamp') },
      brakes:  { brand: val('br-brand'), model: val('br-model'), reach: val('br-reach'), bite: val('br-bite') },
      ...(drop
        ? { bartape: { brand: val('bt-brand'), model: val('bt-model'), material: val('bt-material'), color: val('bt-color') } }
        : { grips:   { brand: val('gr-brand'), model: val('gr-model') } }),
      cockpitNotes: val('cockpit-notes'),
    };
    case 'drivetrain':
      if (bikeType === 'road') return { drivetrain: { brand: val('dt-brand'), model: val('dt-model'), speeds: val('dt-speeds'), actuation: val('dt-actuation'), cassette: val('dt-cassette'), chain: val('dt-chain'), notes: val('dt-notes') } };
      if (bikeType === 'gravel') return { drivetrain: { brand: val('dt-brand'), model: val('dt-model'), config: val('dt-config'), speeds: val('dt-speeds'), cassette: val('dt-cassette'), chainring: val('dt-chainring'), chain: val('dt-chain'), rd: val('dt-rd'), notes: val('dt-notes') } };
      return { drivetrain: { brand: val('dt-brand'), model: val('dt-model'), cassette: val('dt-cassette'), chainring: val('dt-chainring'), chain: val('dt-chain'), rd: val('dt-rd'), notes: val('dt-notes') } };
    case 'dropper':
      if (hasDrooper(bikeType)) return { dropper: { brand: val('dp-brand'), model: val('dp-model'), travel: val('dp-travel'), diameter: val('dp-diameter'), actuation: val('dp-actuation'), notes: val('dp-notes') } };
      return { seatpost: { brand: val('sp-brand'), model: val('sp-model'), length: val('sp-length'), diameter: val('sp-diameter'), setback: val('sp-setback'), material: val('sp-material'), notes: val('sp-notes') } };
    case 'frame': return {
      frame: { brand: val('fr-brand'), model: val('fr-model'), year: val('fr-year'), size: val('fr-size'), material: val('fr-material'), color: val('fr-color'), notes: val('fr-notes') },
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
    psi:         type === 'air'  ? num(`${key}-psi`)         : null,
    tokens:      type === 'air'  ? num(`${key}-tokens`)      : null,
    spacerSize:  type === 'air'  ? val(`${key}-spacerSize`)  : null,
    springRate:  type === 'coil' ? val(`${key}-springRate`)  : null,
    springBrand: type === 'coil' ? val(`${key}-springBrand`) : null,
    lsr: num(`${key}-lsr`), hsr: num(`${key}-hsr`),
    lsc: num(`${key}-lsc`), hsc: num(`${key}-hsc`),
    damperBrand: val(`${key}-damperBrand`) || undefined,
    damperModel: val(`${key}-damperModel`) || undefined,
    tune:        val(`${key}-tune`)        || undefined,
    oilWeight:   val(`${key}-oilWeight`)   || undefined,
    lowerLegOil: val(`${key}-lowerLegOil`) || undefined,
    lastService: val(`${key}-lastService`) || undefined,
    damperType: container.querySelector(`.damper-preset-btn.active[data-key='${key}']`)?.dataset.preset || data.damperType || '4way',
    notes: val(`${key}-notes`),
  };
}

function updateSuspensionFields(container, type) {
  const isCoil = type === 'coil';
  container.querySelectorAll('[id$="-air-fields"]').forEach(el => { el.style.display = isCoil ? 'none' : ''; });
  container.querySelectorAll('[id$="-coil-fields"]').forEach(el => { el.style.display = isCoil ? '' : 'none'; });
}

function zoneHasData(zoneId, baseline, bikeType) {
  const bl = baseline || {};
  switch(zoneId) {
    case 'front-wheel': return !!(bl.frontTire?.brand || bl.frontTire?.psi);
    case 'rear-wheel':  return !!(bl.rearTire?.brand  || bl.rearTire?.psi);
    case 'fork':        return !!(bl.fork?.brand       || bl.fork?.psi);
    case 'shock':       return !!(bl.shock?.brand      || bl.shock?.psi);
    case 'handlebar':   return !!(bl.handlebar?.brand  || bl.stem?.brand);
    case 'drivetrain':  return !!(bl.drivetrain?.brand || bl.drivetrain?.model);
    case 'dropper':     return !!(bl.dropper?.brand    || bl.seatpost?.brand);
    case 'frame':       return !!(bl.frame?.brand      || bl.frame?.model);
    default: return false;
  }
}

function zoneName(id, bikeType = 'mtb') {
  const names = {
    'front-wheel': 'Front Wheel & Tire',
    'rear-wheel':  'Rear Wheel & Tire',
    'fork':        'Fork',
    'shock':       'Rear Shock',
    'handlebar':   'Cockpit',
    'drivetrain':  'Drivetrain',
    'dropper':     hasDrooper(bikeType) ? 'Dropper / Saddle' : 'Seatpost / Saddle',
    'frame':       'Frame',
  };
  return names[id] || id;
}

// ── FULL BASELINE SUMMARY ─────────────────────────────────
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
  const bikeType = bike.type || 'mtb';
  const drop = isDropBar(bikeType);
  let html = '', title = '';

  switch(subZone) {
    case 'cockpit-bars': {
      title = 'Handlebar';
      const hb = bl.handlebar || {};
      if (drop) {
        html = `
          <div class="field-row">${field('Brand','hb-brand',hb.brand)}${field('Model','hb-model',hb.model)}</div>
          <div class="field-row">${field('Width','hb-width',hb.width,'e.g. 420mm')}${field('Reach','hb-reach',hb.reach,'e.g. 80mm')}</div>
          <div class="field-row">${field('Drop','hb-drop',hb.drop,'e.g. 128mm')}${field('Flare','hb-flare',hb.flare,'e.g. 12°')}</div>
          <div class="field-row">${field('Material','hb-material',hb.material,'e.g. Carbon, Alloy')}<div class="field-group"></div></div>`;
      } else {
        html = `
          <div class="field-row">${field('Brand','hb-brand',hb.brand)}${field('Model','hb-model',hb.model)}</div>
          <div class="field-row">${field('Width','hb-width',hb.width,'e.g. 780mm')}${field('Rise','hb-rise',hb.rise,'e.g. 20mm')}</div>
          <div class="field-row">${field('Backsweep','hb-sweep',hb.sweep,'e.g. 9°')}${field('Material','hb-material',hb.material,'e.g. Carbon, Alloy')}</div>`;
      }
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
      const br = bl.brakes  || {};
      const sh = bl.shifters || {};
      if (drop) {
        // Road/Gravel: integrated levers, no separate shifter section
        title = 'Brakes & Levers';
        html = `
          <div class="field-row">${field('Brand','br-brand',br.brand)}${field('Model','br-model',br.model)}</div>
          <div class="field-row">${field('Lever Reach','br-reach',br.reach,'e.g. 3 clicks')}${field('Bite Point','br-bite',br.bite,'e.g. 4 clicks')}</div>`;
      } else {
        // MTB/DJ: separate brakes + shifters
        title = 'Brakes & Shifters';
        html = `
          <div class="settings-section-divider" style="margin-top:0">Brakes</div>
          <div class="field-row">${field('Brand','br-brand',br.brand)}${field('Model','br-model',br.model)}</div>
          <div class="field-row">${field('Lever Reach','br-reach',br.reach,'e.g. 3 clicks')}${field('Bite Point','br-bite',br.bite,'e.g. 4 clicks')}</div>
          <div class="settings-section-divider">Shifters</div>
          <div class="field-row">${field('Brand','sh-brand',sh.brand)}${field('Model','sh-model',sh.model)}</div>
          <div class="field-row">${field('Speeds','sh-speeds',sh.speeds,'e.g. 12')}${field('Cable / Di2','sh-type',sh.type,'e.g. Cable, Di2')}</div>`;
      }
      break;
    }
    case 'cockpit-grips': {
      if (drop) {
        title = 'Bar Tape';
        const bt = bl.bartape || {};
        html = `
          <div class="field-row">${field('Brand','bt-brand',bt.brand)}${field('Model','bt-model',bt.model)}</div>
          <div class="field-row">${field('Material','bt-material',bt.material,'e.g. Cork, Gel, Foam')}${field('Color','bt-color',bt.color)}</div>`;
      } else {
        title = 'Grips';
        const gr = bl.grips || {};
        html = `<div class="field-row">${field('Brand','gr-brand',gr.brand)}${field('Model','gr-model',gr.model)}</div>`;
      }
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
    <button type="button" class="btn-primary" id="btn-save-zone">Save</button>`;
  container.parentElement.appendChild(saveBar);

  document.getElementById('btn-save-zone').addEventListener('click', async () => {
    const val = id => container.querySelector(`#${id}`)?.value?.trim() || '';
    let data = {};
    switch(subZone) {
      case 'cockpit-bars':
        data = { handlebar: { ...(bl.handlebar||{}),
          brand: val('hb-brand'), model: val('hb-model'), width: val('hb-width'), material: val('hb-material'),
          ...(drop
            ? { reach: val('hb-reach'), drop: val('hb-drop'), flare: val('hb-flare') }
            : { rise: val('hb-rise'), sweep: val('hb-sweep') })
        }}; break;
      case 'cockpit-stem':
        data = { stem: { ...(bl.stem||{}), brand: val('st-brand'), model: val('st-model'), length: val('st-length'), clamp: val('st-clamp') }}; break;
      case 'cockpit-brakes':
        data = {
          brakes: { ...(bl.brakes||{}), brand: val('br-brand'), model: val('br-model'), reach: val('br-reach'), bite: val('br-bite') },
          ...(!drop ? { shifters: { ...(bl.shifters||{}), brand: val('sh-brand'), model: val('sh-model'), speeds: val('sh-speeds'), type: val('sh-type') } } : {}),
        }; break;
      case 'cockpit-grips':
        data = drop
          ? { bartape: { ...(bl.bartape||{}), brand: val('bt-brand'), model: val('bt-model'), material: val('bt-material'), color: val('bt-color') } }
          : { grips:   { ...(bl.grips||{}),   brand: val('gr-brand'), model: val('gr-model') } };
        break;
      case 'cockpit-stack':
        data = { headset: { brand: val('hs-brand'), model: val('hs-model'), stack: val('hs-stack'), spacers: val('hs-spacers') }}; break;
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
