import { getPresets, createPreset, updatePreset, deletePreset } from './db.js';
import { showToast, openModal, closeModal } from './utils.js';

// ── TUNABLE FIELDS ────────────────────────────────────────
// Order: Fork (PSI first, then damper) → Shock (same) → Tires
const TUNABLE = [
  { section: 'Fork', compKey: 'fork', fields: [
    { key: 'fork.psi',  label: 'Air Pressure',       unit: 'psi',    path: ['fork','psi'],  step: 1, min: 20, max: 350, always: true },
    { key: 'fork.lsr',  label: 'Rebound (LSR)',       unit: 'clicks', path: ['fork','lsr'],  step: 1, min: 0,  max: 40,  damper: ['single','2way','3way','4way'] },
    { key: 'fork.hsr',  label: 'Rebound (HSR)',       unit: 'clicks', path: ['fork','hsr'],  step: 1, min: 0,  max: 40,  damper: ['3way','4way'] },
    { key: 'fork.lsc',  label: 'Compression (LSC)',   unit: 'clicks', path: ['fork','lsc'],  step: 1, min: 0,  max: 40,  damper: ['comp','2way','3way','4way'] },
    { key: 'fork.hsc',  label: 'Compression (HSC)',   unit: 'clicks', path: ['fork','hsc'],  step: 1, min: 0,  max: 40,  damper: ['4way'] },
  ]},
  { section: 'Rear Shock', compKey: 'shock', fields: [
    { key: 'shock.psi', label: 'Air Pressure',        unit: 'psi',    path: ['shock','psi'], step: 1, min: 20, max: 350, always: true },
    { key: 'shock.lsr', label: 'Rebound (LSR)',        unit: 'clicks', path: ['shock','lsr'], step: 1, min: 0,  max: 40,  damper: ['single','2way','3way','4way'] },
    { key: 'shock.hsr', label: 'Rebound (HSR)',        unit: 'clicks', path: ['shock','hsr'], step: 1, min: 0,  max: 40,  damper: ['3way','4way'] },
    { key: 'shock.lsc', label: 'Compression (LSC)',    unit: 'clicks', path: ['shock','lsc'], step: 1, min: 0,  max: 40,  damper: ['comp','2way','3way','4way'] },
    { key: 'shock.hsc', label: 'Compression (HSC)',    unit: 'clicks', path: ['shock','hsc'], step: 1, min: 0,  max: 40,  damper: ['4way'] },
  ]},
  { section: 'Tires', compKey: null, fields: [
    { key: 'frontTire.psi', label: 'Front Tire PSI', unit: 'psi', path: ['frontTire','psi'], step: 1, min: 10, max: 160, always: true },
    { key: 'rearTire.psi',  label: 'Rear Tire PSI',  unit: 'psi', path: ['rearTire','psi'],  step: 1, min: 10, max: 160, always: true },
  ]},
];

const ALL_FIELDS = TUNABLE.flatMap(s => s.fields);

const SECTION_ORDER = ['Fork', 'Rear Shock', 'Tires'];

function getPath(obj, path) {
  return path.reduce((o, k) => o?.[k], obj);
}

// Return only fields relevant for the given baseline's damperType settings
function getActiveFields(baseline) {
  return TUNABLE.map(section => ({
    ...section,
    fields: section.fields.filter(f => {
      if (f.always) return true;
      if (!f.damper) return true;
      const dt = section.compKey ? (baseline?.[section.compKey]?.damperType || '4way') : '4way';
      // 'none' hides all damper fields; 'comp' hides rebound
      if (dt === 'none' && !f.always) return false;
      return f.damper.includes(dt);
    })
  }));
}

function computeDiff(overrides, baseline, fields = ALL_FIELDS) {
  // Build diff grouped by section order
  const sectionNames = { fork: 'Fork', shock: 'Rear Shock', frontTire: 'Tires', rearTire: 'Tires' };
  const grouped = {};
  SECTION_ORDER.forEach(s => { grouped[s] = []; });

  Object.entries(overrides || {}).forEach(([key, presetVal]) => {
    let f = fields.find(f => f.key === key);
    if (!f) return;
    const baseVal = getPath(baseline, f.path);
    const rawSection = f.key.split('.')[0];
    const section = sectionNames[rawSection] || rawSection;

    // Single-dial label
    let label = f.label;
    if (f.key.endsWith('.lsr') && rawSection !== 'frontTire' && rawSection !== 'rearTire') {
      const dt = baseline?.[rawSection]?.damperType || '4way';
      if (dt === 'single') label = 'Rebound';
    }

    if (grouped[section]) {
      grouped[section].push({ key, section, label, unit: f.unit, baseVal, presetVal });
    }
  });

  // Flatten in section order
  return SECTION_ORDER.flatMap(s => grouped[s] || []);
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
      <p>Save contextual settings for different conditions — bike park day, race day, wet conditions. Presets show only what differs from your baseline so you know exactly what to change.</p>
    </div>` : `
    <div class="presets-grid">
      ${presets.map(p => presetCard(p, baseline)).join('')}
    </div>`}`;

  document.getElementById('btn-new-preset').onclick = () =>
    showPresetModal(bike, null, presets, () => renderPresetsTab(bike));

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

  container.querySelectorAll('.preset-edit-btn').forEach(btn => {
    btn.onclick = () => {
      const preset = presets.find(p => p.id === btn.dataset.id);
      if (preset) showPresetModal(bike, preset, presets, () => renderPresetsTab(bike));
    };
  });
}

function presetCard(p, baseline) {
  const overrides    = p.overrides || {};
  const activeFields = getActiveFields(baseline).flatMap(s => s.fields);
  const diff         = computeDiff(overrides, baseline, activeFields);

  const date = p.createdAt?.toDate?.()
    ? p.createdAt.toDate().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : '';

  // Group diff rows by section for display
  const grouped = {};
  SECTION_ORDER.forEach(s => { grouped[s] = []; });
  diff.forEach(d => { if (grouped[d.section]) grouped[d.section].push(d); });

  const diffHtml = diff.length === 0
    ? `<div class="preset-diff-empty">No changes from baseline</div>`
    : SECTION_ORDER.map(section => {
        const rows = grouped[section];
        if (!rows || rows.length === 0) return '';
        return `
          <div class="preset-diff-section-header">${section}</div>
          ${rows.map(d => `
            <div class="preset-diff-row">
              <span class="preset-diff-label">${d.label}</span>
              <span class="preset-diff-vals">
                <span class="preset-diff-base">${d.baseVal ?? '—'} ${d.unit}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="preset-diff-new">${d.presetVal} ${d.unit}</span>
              </span>
            </div>`).join('')}`;
      }).join('');

  return `
    <div class="preset-card">
      <div class="preset-card-header">
        <div>
          <div class="preset-card-name">${escHtml(p.name)}</div>
          ${date ? `<div class="preset-card-date">${date}</div>` : ''}
          ${p.notes ? `<div class="preset-card-notes">${escHtml(p.notes)}</div>` : ''}
        </div>
        <div style="display:flex;gap:.25rem;align-items:center">
          <button class="btn-icon-sm preset-edit-btn" data-id="${p.id}" title="Edit preset">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1.5l2.5 2.5L3.5 10.5H1V8L8 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
          </button>
          <button class="btn-icon-sm preset-delete-btn" data-id="${p.id}" title="Delete" style="color:var(--text-muted)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 5v4M7.5 5v4M2.5 3l.6 6.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>

      <div class="preset-diff-list">
        ${diff.length > 0
          ? `<div class="preset-diff-count">${diff.length} change${diff.length !== 1 ? 's' : ''} from baseline</div>`
          : ''}
        ${diffHtml}
      </div>
    </div>`;
}

// ── PRESET MODAL (create + edit) ──────────────────────────
function showPresetModal(bike, existingPreset, allPresets, onSaved) {
  const baseline  = bike.baseline || {};
  const isEdit    = !!existingPreset;
  const overrides = existingPreset?.overrides || {};

  const activeTunable = getActiveFields(baseline);
  const sectionHtml = activeTunable.map(section => {
    const fieldHtml = section.fields.map(f => {
      const baseVal = getPath(baseline, f.path);
      if (baseVal == null) return '';
      // Pre-fill with existing override if editing, otherwise baseline
      const currentVal = overrides[f.key] ?? baseVal;
      const isChanged  = isEdit && overrides[f.key] != null;
      return `
        <div class="preset-field-row ${isChanged ? 'preset-field-changed' : ''}">
          <label class="preset-field-label">${f.label}
            <span class="preset-field-base">baseline: ${baseVal} ${f.unit}</span>
          </label>
          <div class="spinner-row" style="max-width:140px">
            <button type="button" class="spinner-btn spinner-minus"
                    data-id="pf-${f.key}" data-step="${f.step}" data-min="${f.min}" data-max="${f.max}">−</button>
            <input type="number" id="pf-${f.key}" class="field-input spinner-input"
                   value="${currentVal}" min="${f.min}" max="${f.max}" step="${f.step}">
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
        <input id="preset-name" class="field-input" type="text"
               value="${escHtml(existingPreset?.name || '')}"
               placeholder="e.g. Bike Park Day, Wet Conditions">
      </div>
    </div>
    <div class="field-group" style="margin-bottom:.75rem">
      <label class="field-label">Notes (optional)</label>
      <input id="preset-notes" class="field-input" type="text"
             value="${escHtml(existingPreset?.notes || '')}"
             placeholder="e.g. -7 psi front, +2 clicks LSC">
    </div>
    <p class="preset-modal-hint">Adjust only the settings that differ for this context. Fields highlighted in amber already have overrides saved.</p>
    ${sectionHtml || '<p style="color:var(--text-muted);font-size:.85rem">Fill in your baseline setup first before creating presets.</p>'}`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-preset">${isEdit ? 'Save Changes' : 'Save Preset'}</button>`;

  openModal(isEdit ? `Edit — ${existingPreset.name}` : 'New Preset', body, footer);

  // Spinner binding via delegation
  document.getElementById('modal-body').addEventListener('click', e => {
    const btn = e.target.closest('.spinner-btn');
    if (!btn) return;
    const inp = document.getElementById(btn.dataset.id);
    if (!inp) return;
    const step = parseFloat(btn.dataset.step || 1);
    const min  = parseFloat(btn.dataset.min ?? 0);
    const max  = parseFloat(btn.dataset.max ?? 9999);
    const cur  = parseFloat(inp.value) || 0;
    inp.value  = btn.classList.contains('spinner-minus')
      ? Math.max(min, Math.round(cur - step))
      : Math.min(max, Math.round(cur + step));
  });

  document.getElementById('modal-cancel').onclick = closeModal;

  document.getElementById('modal-save-preset').onclick = async () => {
    const name = document.getElementById('preset-name')?.value.trim();
    if (!name) { showToast('Enter a name', 'error'); return; }

    const activeFields = getActiveFields(baseline).flatMap(s => s.fields);
    const newOverrides = {};
    activeFields.forEach(f => {
      const inp = document.getElementById(`pf-${f.key}`);
      if (!inp) return;
      const inputVal = parseFloat(inp.value);
      const baseVal  = getPath(baseline, f.path);
      if (baseVal != null && inputVal !== baseVal) {
        newOverrides[f.key] = inputVal;
      }
    });

    const notes = document.getElementById('preset-notes')?.value.trim() || '';
    try {
      if (isEdit) {
        await updatePreset(bike.id, existingPreset.id, { name, notes, overrides: newOverrides });
      } else {
        await createPreset(bike.id, { name, notes, overrides: newOverrides, createdAt: Date.now() });
      }
      showToast(isEdit ? 'Preset updated' : 'Preset saved', 'success');
      closeModal();
      onSaved();
    } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
  };
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
