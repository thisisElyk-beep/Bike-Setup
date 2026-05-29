import { getPresets, createPreset, updatePreset, deletePreset, updateBike } from './db.js';
import { showToast, openModal, closeModal } from './utils.js';

// ── TUNABLE FIELDS ────────────────────────────────────────
// Base list — filtered at render time by damperType stored in baseline
const TUNABLE = [
  { section: 'Fork', fields: [
    { key: 'fork.psi',  label: 'Air Pressure',       unit: 'psi',    path: ['fork','psi'],  step: 1,   min: 20, max: 350, always: true },
    { key: 'fork.lsr',  label: 'Rebound (LSR)',        unit: 'clicks', path: ['fork','lsr'],  step: 1,   min: 0,  max: 40,  always: true },
    { key: 'fork.hsr',  label: 'Rebound (HSR)',       unit: 'clicks', path: ['fork','hsr'],  step: 1,   min: 0,  max: 40,  damper: ['3way','4way'] },
    { key: 'fork.lsc',  label: 'Compression (LSC)',   unit: 'clicks', path: ['fork','lsc'],  step: 1,   min: 0,  max: 40,  damper: ['2way','3way','4way'] },
    { key: 'fork.hsc',  label: 'Compression (HSC)',   unit: 'clicks', path: ['fork','hsc'],  step: 1,   min: 0,  max: 40,  damper: ['4way'] },
  ]},
  { section: 'Rear Shock', fields: [
    { key: 'shock.psi', label: 'Air Pressure',        unit: 'psi',    path: ['shock','psi'], step: 1,   min: 20, max: 350, always: true },
    { key: 'shock.lsr', label: 'Rebound (LSR)',        unit: 'clicks', path: ['shock','lsr'], step: 1,   min: 0,  max: 40,  always: true },
    { key: 'shock.hsr', label: 'Rebound (HSR)',       unit: 'clicks', path: ['shock','hsr'], step: 1,   min: 0,  max: 40,  damper: ['3way','4way'] },
    { key: 'shock.lsc', label: 'Compression (LSC)',   unit: 'clicks', path: ['shock','lsc'], step: 1,   min: 0,  max: 40,  damper: ['2way','3way','4way'] },
    { key: 'shock.hsc', label: 'Compression (HSC)',   unit: 'clicks', path: ['shock','hsc'], step: 1,   min: 0,  max: 40,  damper: ['4way'] },
  ]},
  { section: 'Tires', fields: [
    { key: 'frontTire.psi', label: 'PSI', unit: 'psi', path: ['frontTire','psi'], step: 0.5, min: 10, max: 160, always: true },
    { key: 'rearTire.psi',  label: 'PSI', unit: 'psi', path: ['rearTire','psi'],  step: 0.5, min: 10, max: 160, always: true },
  ]},
];

// Return only fields relevant for the given baseline's damperType settings
function getActiveFields(baseline, sectionKey) {
  const fkDt = baseline?.fork?.damperType  || '4way';
  const skDt = baseline?.shock?.damperType || '4way';
  return TUNABLE.map(section => ({
    ...section,
    fields: section.fields.filter(f => {
      if (f.always) return true;
      if (!f.damper) return true;
      const dt = f.key.startsWith('fork.')  ? fkDt
               : f.key.startsWith('shock.') ? skDt
               : '4way';
      return f.damper.includes(dt);
    })
  }));
}

const ALL_FIELDS = TUNABLE.flatMap(s => s.fields);

function getPath(obj, path) {
  return path.reduce((o, k) => o?.[k], obj);
}

function computeDiff(overrides, baseline, fields = ALL_FIELDS) {
  return Object.entries(overrides || {}).map(([key, presetVal]) => {
    const f = fields.find(f => f.key === key);
    if (!f) return null;
    const baseVal = getPath(baseline, f.path);
    const sectionNames = { fork: 'Fork', shock: 'Shock', frontTire: 'Front Tire', rearTire: 'Rear Tire' };
    // Clean up label for single-dial: "Rebound (LSR)" → "Rebound"
    if (f.key.endsWith('.lsr')) {
      const compKey = f.key.split('.')[0];
      const dt = baseline?.[compKey]?.damperType || '4way';
      if (dt === 'single') f = { ...f, label: 'Rebound' };
    }
    const rawSection = f.key.split('.')[0];
    return { key, section: sectionNames[rawSection] || rawSection, label: f.label, unit: f.unit, baseVal, presetVal };
  }).filter(Boolean);
}

// ── ENTRY POINT ───────────────────────────────────────────
export async function renderPresetsTab(bike) {
  const container = document.getElementById('tab-presets');
  if (!container) return;
  container.innerHTML = `<div class="rides-loading"><span>Loading presets…</span></div>`;
  let presets = [];
  try { presets = await getPresets(bike.id); } catch(e) {}
  renderPresetsList(container, presets, bike);
}

function renderPresetsList(container, presets, bike) {
  const baseline = bike.baseline || {};

  container.innerHTML = `
    <div class="rides-toolbar">
      <h2 class="tab-section-title" style="margin:0">Saved Setups</h2>
      <button class="btn-primary" id="btn-new-preset">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        New Preset
      </button>
    </div>

    ${presets.length === 0 ? `
    <div class="empty-state">
      <h3>No saved setups yet</h3>
      <p>Save your current baseline as a preset — great for bike park day, race day, wet conditions, etc. Presets track only the settings that differ from your baseline.</p>
    </div>` : `
    <div class="presets-grid">
      ${presets.map(p => presetCard(p, baseline)).join('')}
    </div>`}`;

  document.getElementById('btn-new-preset').onclick = () =>
    showNewPresetModal(bike, presets, () => renderPresetsTab(bike));

  container.querySelectorAll('.preset-delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this preset?')) return;
      try {
        await deletePreset(bike.id, btn.dataset.id);
        showToast('Preset deleted', 'success');
        renderPresetsTab(bike);
      } catch(e) { showToast('Delete failed', 'error'); }
    };
  });

  container.querySelectorAll('.preset-adjust-btn').forEach(btn => {
    btn.onclick = () => {
      const preset = presets.find(p => p.id === btn.dataset.id);
      if (!preset) return;
      // Merge overrides into a temporary object stored for Quick Adjust to read
      const merged = JSON.parse(JSON.stringify(baseline));
      applyOverrides(merged, preset.overrides || {});
      localStorage.setItem(`quiver_preset_active_${bike.id}`, JSON.stringify({
        id: preset.id, name: preset.name, merged
      }));
      showToast(`"${preset.name}" loaded into Quick Adjust`, 'success');
      document.querySelector('[data-tab="adjust"]')?.click();
    };
  });
}

function applyOverrides(baseline, overrides) {
  for (const [key, val] of Object.entries(overrides)) {
    const f = ALL_FIELDS.find(f => f.key === key);
    if (!f || val == null) continue;
    let obj = baseline;
    for (let i = 0; i < f.path.length - 1; i++) {
      if (!obj[f.path[i]]) obj[f.path[i]] = {};
      obj = obj[f.path[i]];
    }
    obj[f.path[f.path.length - 1]] = val;
  }
}

function presetCard(p, baseline) {
  // Support both new (overrides) and legacy (data) formats
  const overrides = p.overrides || {};
  const activeFields = getActiveFields(baseline).flatMap(s => s.fields);
  const diff = computeDiff(overrides, baseline, activeFields);

  const date = p.createdAt?.toDate?.()
    ? p.createdAt.toDate().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : '';

  const diffRows = diff.length > 0
    ? diff.map(d => `
      <div class="preset-diff-row">
        <span class="preset-diff-label">${d.section} ${d.label}</span>
        <span class="preset-diff-vals">
          <span class="preset-diff-base">${d.baseVal ?? '—'} ${d.unit}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="preset-diff-new">${d.presetVal} ${d.unit}</span>
        </span>
      </div>`).join('')
    : `<div class="preset-diff-empty">Identical to current baseline</div>`;

  return `
    <div class="preset-card">
      <div class="preset-card-header">
        <div>
          <div class="preset-card-name">${escHtml(p.name)}</div>
          ${date ? `<div class="preset-card-date">${date}</div>` : ''}
          ${p.notes ? `<div class="preset-card-notes">${escHtml(p.notes)}</div>` : ''}
        </div>
        <button class="btn-icon-sm preset-delete-btn" data-id="${p.id}" title="Delete" style="color:var(--text-muted)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 5v4M7.5 5v4M2.5 3l.6 6.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <div class="preset-diff-section">
        <div class="preset-diff-title">
          ${diff.length > 0
            ? `<span class="preset-diff-count">${diff.length} change${diff.length !== 1 ? 's' : ''} from baseline</span>`
            : ''}
        </div>
        <div class="preset-diff-list">${diffRows}</div>
      </div>

      <div class="preset-card-actions">
        <button class="btn-primary preset-adjust-btn" data-id="${p.id}" style="font-size:.78rem;padding:.35rem .75rem">
          Load into Adjust
        </button>
      </div>
    </div>`;
}

// ── NEW PRESET MODAL ──────────────────────────────────────
function showNewPresetModal(bike, existingPresets, onSaved) {
  const baseline = bike.baseline || {};

  // Build fields — only show sections where baseline has data, filtered by damperType
  const activeTunable = getActiveFields(baseline);
  const sectionHtml = activeTunable.map(section => {
    const fieldHtml = section.fields.map(f => {
      const baseVal = getPath(baseline, f.path);
      if (baseVal == null) return ''; // skip fields with no baseline
      return `
        <div class="preset-field-row">
          <label class="preset-field-label">${f.label}
            <span class="preset-field-base">baseline: ${baseVal}${f.unit}</span>
          </label>
          <div class="spinner-row" style="max-width:140px">
            <button type="button" class="spinner-btn spinner-minus"
                    data-id="pf-${f.key}" data-step="${f.step}" data-min="${f.min}" data-max="${f.max}">−</button>
            <input type="number" id="pf-${f.key}" class="field-input spinner-input"
                   value="${baseVal}" min="${f.min}" max="${f.max}" step="${f.step}">
            <button type="button" class="spinner-btn spinner-plus"
                    data-id="pf-${f.key}" data-step="${f.step}" data-min="${f.min}" data-max="${f.max}">+</button>
          </div>
        </div>`;
    }).join('');
    if (!fieldHtml.trim()) return '';
    return `<div class="settings-section-divider">${section.section}</div>${fieldHtml}`;
  }).join('');

  const body = `
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Preset Name</label>
        <input id="preset-name" class="field-input" type="text" placeholder="e.g. Bike Park Day, Wet Conditions">
      </div>
    </div>
    <div class="field-group" style="margin-bottom:.75rem">
      <label class="field-label">Notes (optional)</label>
      <input id="preset-notes" class="field-input" type="text" placeholder="e.g. -7psi front, +2 clicks LSC">
    </div>
    <p class="preset-modal-hint">Adjust only the settings that differ for this context. Unchanged values won't be stored.</p>
    ${sectionHtml || '<p style="color:var(--text-muted);font-size:.85rem">Fill in your baseline setup first before creating presets.</p>'}`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-preset">Save Preset</button>`;

  openModal('New Preset', body, footer);

  // Bind spinners
  document.querySelectorAll('#modal-body .spinner-btn').forEach(btn => {
    btn.onclick = () => {
      const inp = document.getElementById(btn.dataset.id);
      if (!inp) return;
      const step = parseFloat(btn.dataset.step), min = parseFloat(btn.dataset.min), max = parseFloat(btn.dataset.max);
      const cur  = parseFloat(inp.value) || 0;
      inp.value  = Math.max(min, Math.min(max,
        parseFloat((cur + (btn.classList.contains('spinner-minus') ? -step : step)).toFixed(3))
      ));
    };
  });

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save-preset').onclick = async () => {
    const name = document.getElementById('preset-name')?.value.trim();
    if (!name) { showToast('Enter a name', 'error'); return; }

    // Compute overrides — only store values that differ from baseline
    // Uses active fields filtered by damperType
    const activeFields = getActiveFields(baseline).flatMap(s => s.fields);
    const overrides = {};
    activeFields.forEach(f => {
      const inp = document.getElementById(`pf-${f.key}`);
      if (!inp) return;
      const inputVal = parseFloat(inp.value);
      const baseVal  = getPath(baseline, f.path);
      if (baseVal != null && inputVal !== baseVal) {
        overrides[f.key] = inputVal;
      }
    });

    const notes = document.getElementById('preset-notes')?.value.trim() || '';
    try {
      await createPreset(bike.id, { name, notes, overrides, createdAt: Date.now() });
      showToast('Preset saved', 'success');
      closeModal();
      onSaved();
    } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
  };
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
