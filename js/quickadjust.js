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
    if (f.type !== 'coil') fields.push(psiSpinner('fork-psi', 'Air Pressure', f.psi, 1, 20, 300, 'psi'));
    const fDt = f.damperType || '4way';
    if (fDt !== 'none' && fDt !== 'comp') fields.push(clickSpinner('fork-lsr', fDt==='single'?'Rebound':'LSR', f.lsr, 1, 0, 40));
    if (fDt === '3way' || fDt === '4way')  fields.push(clickSpinner('fork-hsr', 'HSR', f.hsr, 1, 0, 40));
    if (fDt === 'comp' || fDt === '2way' || fDt === '3way' || fDt === '4way') fields.push(clickSpinner('fork-lsc', fDt==='comp'?'Compression':'LSC', f.lsc, 1, 0, 40));
    if (fDt === '4way')  fields.push(clickSpinner('fork-hsc', 'HSC', f.hsc, 1, 0, 40));
    sections.push(section('Fork', f.brand ? `${f.brand} ${f.model || ''}`.trim() : '', fields));
  }

  // Shock
  if (isMTB && isFS && bl.shock) {
    const s = bl.shock;
    const fields = [];
    if (s.type !== 'coil') fields.push(psiSpinner('shock-psi', 'Air Pressure', s.psi, 1, 50, 350, 'psi'));
    const sDt = s.damperType || '4way';
    if (sDt !== 'none' && sDt !== 'comp') fields.push(clickSpinner('shock-lsr', sDt==='single'?'Rebound':'LSR', s.lsr, 1, 0, 40));
    if (sDt === '3way' || sDt === '4way')  fields.push(clickSpinner('shock-hsr', 'HSR', s.hsr, 1, 0, 40));
    if (sDt === 'comp' || sDt === '2way' || sDt === '3way' || sDt === '4way') fields.push(clickSpinner('shock-lsc', sDt==='comp'?'Compression':'LSC', s.lsc, 1, 0, 40));
    if (sDt === '4way')  fields.push(clickSpinner('shock-hsc', 'HSC', s.hsc, 1, 0, 40));
    sections.push(section('Rear Shock', s.brand ? `${s.brand} ${s.model || ''}`.trim() : '', fields));
  }

  // Tires
  const hasFront = bl.frontTire && (bl.frontTire.psi != null || bl.frontTire.brand);
  const hasRear  = bl.rearTire  && (bl.rearTire.psi  != null || bl.rearTire.brand);
  if (hasFront || hasRear) {
    const fields = [];
    if (hasFront) fields.push(psiSpinner('ftire-psi', 'Front', bl.frontTire.psi, 1, 10, 80, 'psi'));
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
        <div class="qa-sub">Trailside tweaks save to your baseline</div>
      </div>
      <div class="qa-header-actions">
        <div class="qa-save-status" id="qa-save-status"></div>
        <button class="btn-primary" id="qa-save-btn" disabled>Save Changes</button>
      </div>
    </div>
    <div class="qa-direction-hint" id="qa-direction-hint">
      <button class="qa-hint-toggle" id="qa-hint-toggle" aria-label="Toggle click direction reminder">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 9V6M6.5 4h.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        Which way do I turn it?
      </button>
      <div class="qa-hint-content">
        <div class="qa-hint-group">
          <div class="qa-hint-group-title">Compression <span class="qa-hint-group-sub">support / how it holds up</span></div>
          <div class="qa-hint-row">
            <span class="qa-hint-dir">Clockwise <span class="qa-hint-sign">＋</span></span>
            <span class="qa-hint-desc">firmer, more support, rides higher</span>
          </div>
          <div class="qa-hint-row">
            <span class="qa-hint-dir">Counter-CW <span class="qa-hint-sign">－</span></span>
            <span class="qa-hint-desc">softer, more small-bump sensitivity</span>
          </div>
        </div>
        <div class="qa-hint-group">
          <div class="qa-hint-group-title">Rebound <span class="qa-hint-group-sub">how fast it returns</span></div>
          <div class="qa-hint-row">
            <span class="qa-hint-dir">Clockwise <span class="qa-hint-sign">＋</span></span>
            <span class="qa-hint-desc">slower return, more controlled</span>
          </div>
          <div class="qa-hint-row">
            <span class="qa-hint-dir">Counter-CW <span class="qa-hint-sign">－</span></span>
            <span class="qa-hint-desc">faster return, more poppy / lively</span>
          </div>
        </div>
      </div>
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
      markDirty();
    });

    field.querySelector('.qa-plus').addEventListener('click', () => {
      const cur = parseFloat(input.value) || 0;
      const next = Math.min(max, parseFloat((cur + step).toFixed(2)));
      input.value = next;
      markDirty();
    });

    input.addEventListener('change', () => markDirty());
  });

  // Save button
  const saveBtn = container.querySelector('#qa-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => save(bike, container));

  // Direction hint toggle
  const hintToggle = container.querySelector('#qa-hint-toggle');
  const hint = container.querySelector('#qa-direction-hint');
  if (hintToggle && hint) {
    hintToggle.addEventListener('click', () => hint.classList.toggle('expanded'));
  }
}

// ── SAVE ──────────────────────────────────────────────────
function markDirty() {
  const btn = document.getElementById('qa-save-btn');
  if (btn) { btn.disabled = false; }
  const status = document.getElementById('qa-save-status');
  if (status) { status.textContent = 'Unsaved changes'; status.className = 'qa-save-status dirty'; }
}

async function save(bike, container) {
  const btn = document.getElementById('qa-save-btn');
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

  const status = document.getElementById('qa-save-status');
  if (status) { status.textContent = 'Saving…'; status.className = 'qa-save-status saving'; }
  if (btn) btn.disabled = true;

  try {
    await updateBike(bike.id, { baseline: bl });
    bike.baseline = bl;
    if (status) {
      status.textContent = 'Saved';
      status.className = 'qa-save-status saved';
      setTimeout(() => { if (status) { status.textContent = ''; status.className = 'qa-save-status'; }}, 1800);
    }
  } catch (e) {
    if (status) { status.textContent = 'Save failed'; status.className = 'qa-save-status error'; }
    if (btn) btn.disabled = false;
    showToast('Save failed: ' + e.message, 'error');
  }
}
