import { updateBike } from './db.js';
import { showToast } from './utils.js';

let _saveTimer = null;

// ── ENTRY POINT ───────────────────────────────────────────
export function renderQuickAdjustTab(bike) {
  const container = document.getElementById('tab-adjust');
  if (!container) return;
  container.innerHTML = buildQuickAdjust(bike);
  bindControls(bike, container);
}

// ── BUILD UI ──────────────────────────────────────────────
function buildQuickAdjust(bike) {
  const bl = bike.baseline || {};
  const isMTB = ['mtb','emtb'].includes(bike.type);
  const isFS  = (bike.suspensionType || 'full') === 'full';

  const sections = [];

  // Fork
  if (isMTB && bl.fork) {
    const f = bl.fork;
    const fields = [];
    if (f.type !== 'coil') fields.push(psiSpinner('fork-psi', 'Air Pressure', f.psi, 0.5, 20, 300, 'psi'));
    const fDt = f.damperType || '4way';
    const fSingle = fDt === 'single';
    fields.push(clickSpinner('fork-lsr', fSingle ? 'Rebound' : 'LSR', f.lsr, 1, 0, 40));
    if (fDt === '3way' || fDt === '4way') fields.push(clickSpinner('fork-hsr', 'HSR', f.hsr, 1, 0, 40));
    if (fDt !== 'single') fields.push(clickSpinner('fork-lsc', 'LSC', f.lsc, 1, 0, 40));
    if (fDt === '4way') fields.push(clickSpinner('fork-hsc', 'HSC', f.hsc, 1, 0, 40));
    sections.push(section('Fork', f.brand ? `${f.brand} ${f.model || ''}`.trim() : '', fields));
  }

  // Shock
  if (isMTB && isFS && bl.shock) {
    const s = bl.shock;
    const fields = [];
    if (s.type !== 'coil') fields.push(psiSpinner('shock-psi', 'Air Pressure', s.psi, 0.5, 50, 350, 'psi'));
    const sDt = s.damperType || '4way';
    const sSingle = sDt === 'single';
    fields.push(clickSpinner('shock-lsr', sSingle ? 'Rebound' : 'LSR', s.lsr, 1, 0, 40));
    if (sDt === '3way' || sDt === '4way') fields.push(clickSpinner('shock-hsr', 'HSR', s.hsr, 1, 0, 40));
    if (sDt !== 'single') fields.push(clickSpinner('shock-lsc', 'LSC', s.lsc, 1, 0, 40));
    if (sDt === '4way') fields.push(clickSpinner('shock-hsc', 'HSC', s.hsc, 1, 0, 40));
    sections.push(section('Rear Shock', s.brand ? `${s.brand} ${s.model || ''}`.trim() : '', fields));
  }

  // Tires
  const hasFront = bl.frontTire && (bl.frontTire.psi != null || bl.frontTire.brand);
  const hasRear  = bl.rearTire  && (bl.rearTire.psi  != null || bl.rearTire.brand);
  if (hasFront || hasRear) {
    const fields = [];
    if (hasFront) fields.push(psiSpinner('ftire-psi', 'Front', bl.frontTire.psi, 0.5, 10, 80, 'psi'));
    if (hasRear)  fields.push(psiSpinner('rtire-psi', 'Rear',  bl.rearTire.psi,  0.5, 10, 80, 'psi'));
    const tireLabel = [bl.frontTire?.brand, bl.rearTire?.brand].filter(Boolean)[0] || '';
    sections.push(section('Tires', tireLabel, fields));
  }

  if (sections.length === 0) {
    return `<div class="empty-state">
      <svg class="empty-icon" width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="14" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
        <path d="M22 14v5M22 22v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      </svg>
      <h3>No setup data yet</h3>
      <p>Add your fork, shock, and tire pressures in the Setup tab first — then come back here to make quick trailside tweaks.</p>
      <button class="btn-primary" style="margin-top:.75rem" id="qa-go-setup">
        Go to Setup →
      </button>
    </div>`;
  }

  return `
    <div class="qa-header">
      <div>
        <div class="qa-title">Quick Adjust</div>
        <div class="qa-sub">Trailside tweaks save directly to your baseline</div>
      </div>
      <div class="qa-save-status" id="qa-save-status"></div>
    </div>
    <div class="qa-grid">${sections.join('')}</div>
  `;
}

function section(title, subtitle, fields) {
  return `
    <div class="qa-section">
      <div class="qa-section-title">${title}${subtitle ? `<span class="qa-section-sub">${subtitle}</span>` : ''}</div>
      <div class="qa-fields">${fields.join('')}</div>
    </div>`;
}

function psiSpinner(id, label, value, step, min, max, unit) {
  const val = value != null ? parseFloat(value) : '';
  return `
    <div class="qa-field" data-id="${id}" data-step="${step}" data-min="${min}" data-max="${max}">
      <div class="qa-field-label">${label}</div>
      <div class="qa-spinner">
        <button class="qa-btn qa-minus" aria-label="Decrease">−</button>
        <input class="qa-input" id="${id}" type="number"
               value="${val}" min="${min}" max="${max}" step="${step}" placeholder="—">
        <button class="qa-btn qa-plus" aria-label="Increase">+</button>
      </div>
      <div class="qa-field-unit">${unit}</div>
    </div>`;
}

function clickSpinner(id, label, value, step, min, max) {
  const val = value != null ? parseInt(value) : '';
  return `
    <div class="qa-field" data-id="${id}" data-step="${step}" data-min="${min}" data-max="${max}">
      <div class="qa-field-label">${label}</div>
      <div class="qa-spinner">
        <button class="qa-btn qa-minus" aria-label="Decrease">−</button>
        <input class="qa-input" id="${id}" type="number"
               value="${val}" min="${min}" max="${max}" step="${step}" placeholder="—">
        <button class="qa-btn qa-plus" aria-label="Increase">+</button>
      </div>
      <div class="qa-field-unit">clicks</div>
    </div>`;
}

// ── BIND CONTROLS ─────────────────────────────────────────
function bindControls(bike, container) {
  // +/− buttons
  container.querySelectorAll('.qa-field').forEach(field => {
    const input  = field.querySelector('.qa-input');
    const step   = parseFloat(field.dataset.step  || 1);
    const min    = parseFloat(field.dataset.min   ?? -Infinity);
    const max    = parseFloat(field.dataset.max   ?? Infinity);

    field.querySelector('.qa-minus').addEventListener('click', () => {
      const cur = parseFloat(input.value) || 0;
      const next = Math.max(min, parseFloat((cur - step).toFixed(2)));
      input.value = next;
      scheduleSave(bike, container);
    });

    field.querySelector('.qa-plus').addEventListener('click', () => {
      const cur = parseFloat(input.value) || 0;
      const next = Math.min(max, parseFloat((cur + step).toFixed(2)));
      input.value = next;
      scheduleSave(bike, container);
    });

    input.addEventListener('change', () => scheduleSave(bike, container));
  });
}

// ── SAVE ──────────────────────────────────────────────────
function scheduleSave(bike, container) {
  const status = document.getElementById('qa-save-status');
  if (status) { status.textContent = 'Saving...'; status.className = 'qa-save-status saving'; }
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => save(bike, container), 800);
}

async function save(bike, container) {
  const val = id => {
    const el = container.querySelector(`#${id}`);
    if (!el || el.value === '') return null;
    return parseFloat(el.value);
  };

  const bl = { ...(bike.baseline || {}) };

  if (bl.fork) {
    bl.fork = { ...bl.fork };
    if (val('fork-psi') != null) bl.fork.psi = val('fork-psi');
    if (val('fork-lsr') != null) bl.fork.lsr = val('fork-lsr');
    if (val('fork-hsr') != null) bl.fork.hsr = val('fork-hsr');
    if (val('fork-lsc') != null) bl.fork.lsc = val('fork-lsc');
    if (val('fork-hsc') != null) bl.fork.hsc = val('fork-hsc');
  }

  if (bl.shock) {
    bl.shock = { ...bl.shock };
    if (val('shock-psi') != null) bl.shock.psi = val('shock-psi');
    if (val('shock-lsr') != null) bl.shock.lsr = val('shock-lsr');
    if (val('shock-hsr') != null) bl.shock.hsr = val('shock-hsr');
    if (val('shock-lsc') != null) bl.shock.lsc = val('shock-lsc');
    if (val('shock-hsc') != null) bl.shock.hsc = val('shock-hsc');
  }

  if (bl.frontTire && val('ftire-psi') != null) bl.frontTire = { ...bl.frontTire, psi: val('ftire-psi') };
  if (bl.rearTire  && val('rtire-psi') != null) bl.rearTire  = { ...bl.rearTire,  psi: val('rtire-psi') };

  try {
    await updateBike(bike.id, { baseline: bl });
    bike.baseline = bl;
    const status = document.getElementById('qa-save-status');
    if (status) {
      status.textContent = 'Saved';
      status.className = 'qa-save-status saved';
      setTimeout(() => { if (status) { status.textContent = ''; status.className = 'qa-save-status'; }}, 1800);
    }
  } catch (e) {
    const status = document.getElementById('qa-save-status');
    if (status) { status.textContent = 'Save failed'; status.className = 'qa-save-status error'; }
    showToast('Save failed: ' + e.message, 'error');
  }
}
