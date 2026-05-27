import { getComponents, updateComponent, createComponent } from './db.js';
import { showToast, openModal, closeModal } from './utils.js';

// ── CONFIG: which components get service tracking ──────────
const SERVICE_COMPONENTS = [
  { category: 'Fork',        label: 'Front Suspension', icon: '🔧', bleed: false },
  { category: 'Rear Shock',  label: 'Rear Suspension',  icon: '🔧', bleed: false },
  { category: 'Dropper Post',label: 'Dropper Post',     icon: '📍', bleed: false },
  { category: 'Brakes',      label: 'Brakes (Bleed)',   icon: '🛑', bleed: true  },
];

const SERVICE_TYPES_SUSP    = ['Full Service','Seal Kit','Oil Change','Lower Leg Service','Cleaned','Other'];
const SERVICE_TYPES_DROPPER = ['Full Service','Seal Kit','Cleaned','Cable/Housing','Other'];
const SERVICE_TYPES_BRAKE   = ['Brake Bleed','Pad Replacement','Rotor Replacement','Cleaned','Other'];

// ── ENTRY POINT ────────────────────────────────────────────
export async function renderServiceTab(bike) {
  const container = document.getElementById('tab-service');
  if (!container) return;
  container.innerHTML = `<div class="rides-loading"><span>Loading…</span></div>`;

  let components = [];
  try { components = await getComponents(bike.id); } catch(e) {}

  renderServiceView(container, bike, components);
}

function renderServiceView(container, bike, components) {
  // Match service components to actual installed components
  const cards = SERVICE_COMPONENTS.map(sc => {
    const installed = components.filter(c => c.category === sc.category);
    return { sc, installed };
  });

  const anyOverdue = cards.some(({installed}) =>
    installed.some(c => getStatus(c)?.status === 'overdue')
  );
  const anySoon = cards.some(({installed}) =>
    installed.some(c => getStatus(c)?.status === 'soon')
  );

  container.innerHTML = `
    <div class="rides-toolbar">
      <h2 class="tab-section-title" style="margin:0">Service</h2>
      ${anyOverdue ? '<div class="svc-summary-banner" style="margin:0"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg><span style="color:var(--danger);font-weight:600">Service overdue</span></div>' : ''}
    </div>
    <div class="service-cards-grid">
      ${cards.map(({sc, installed}) => renderServiceCard(sc, installed, bike, components)).join('')}
    </div>`;

  // Wire up buttons
  container.querySelectorAll('.svc-card-log-btn').forEach(btn => {
    const compId = btn.dataset.compId;
    const category = btn.dataset.category;
    const comp = components.find(c => c.id === compId);
    const sc   = SERVICE_COMPONENTS.find(s => s.category === category);
    btn.onclick = () => showLogServiceModal(bike, comp, sc, components, () => renderServiceTab(bike));
  });

  container.querySelectorAll('.svc-card-interval-btn').forEach(btn => {
    const compId  = btn.dataset.compId;
    const category = btn.dataset.category;
    const comp    = components.find(c => c.id === compId);
    btn.onclick = () => showIntervalModal(bike, comp, () => renderServiceTab(bike));
  });

  container.querySelectorAll('.svc-card-add-btn').forEach(btn => {
    const category = btn.dataset.category;
    btn.onclick = () => createServiceComponent(bike, category, components, () => renderServiceTab(bike));
  });
}

function renderServiceCard(sc, installed, bike, components) {
  if (installed.length === 0) {
    return `<div class="service-card service-card-empty">
      <div class="service-card-header">
        <div class="service-card-title">${sc.label}</div>
        <div class="service-card-sub">Not in components</div>
      </div>
      <button class="btn-text svc-card-add-btn" data-category="${sc.category}" style="font-size:.78rem;margin-top:.5rem;color:var(--text-muted)">
        + Add to components
      </button>
    </div>`;
  }

  return installed.map(comp => {
    const status  = getStatus(comp);
    const log     = comp.serviceLog || [];
    const lastSvc = log[0];
    const statusClass = status?.status === 'overdue' ? 'svc-card-overdue'
                      : status?.status === 'soon'    ? 'svc-card-soon' : '';

    return `<div class="service-card ${statusClass}">
      <div class="service-card-header">
        <div>
          <div class="service-card-title">${sc.label}</div>
          <div class="service-card-sub">${escHtml([comp.brand, comp.model].filter(Boolean).join(' ') || 'No brand set')}</div>
        </div>
        ${status ? `<div class="service-card-status-badge status-${status.status}">${status.label}</div>` : ''}
      </div>

      <div class="service-card-body">
        <div class="service-stat">
          <span class="service-stat-label">Last Service</span>
          <span class="service-stat-val">${lastSvc ? fmtDate(lastSvc.date) + ' — ' + lastSvc.type : 'Never'}</span>
        </div>
        ${comp.serviceIntervalMonths ? `<div class="service-stat">
          <span class="service-stat-label">Interval</span>
          <span class="service-stat-val">Every ${comp.serviceIntervalMonths} months</span>
        </div>` : ''}
        ${comp.serviceIntervalHours ? `<div class="service-stat">
          <span class="service-stat-label">Hours</span>
          <span class="service-stat-val">Every ${comp.serviceIntervalHours}h</span>
        </div>` : ''}
      </div>

      ${log.length > 0 ? `<div class="service-history-mini">
        ${log.slice(0,3).map(e => `<div class="svc-history-row">
          <span class="svc-history-date">${fmtDate(e.date)}</span>
          <span class="svc-history-type">${escHtml(e.type)}</span>
          ${e.notes ? `<span class="svc-history-note">${escHtml(e.notes)}</span>` : ''}
        </div>`).join('')}
        ${log.length > 3 ? `<div class="svc-history-more">+${log.length-3} more</div>` : ''}
      </div>` : ''}

      <div class="service-card-actions">
        <button class="btn-primary svc-card-log-btn" data-comp-id="${comp.id}" data-category="${sc.category}"
                style="font-size:.78rem;padding:.35rem .75rem">
          Log Service
        </button>
        <button class="btn-secondary svc-card-interval-btn" data-comp-id="${comp.id}" data-category="${sc.category}"
                style="font-size:.78rem;padding:.35rem .65rem">
          Set Interval
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── STATUS CALCULATION ────────────────────────────────────
function getStatus(comp) {
  const months = comp.serviceIntervalMonths ? parseFloat(comp.serviceIntervalMonths) : null;
  const hours  = comp.serviceIntervalHours  ? parseFloat(comp.serviceIntervalHours)  : null;
  if (!months && !hours) return null;

  const log = comp.serviceLog || [];
  const lastDate = log[0]?.date || comp.installDate || null;
  if (!lastDate) return { status: 'unknown', label: 'No date' };

  if (months) {
    const last = new Date(lastDate + 'T00:00:00');
    const due  = new Date(last);
    due.setMonth(due.getMonth() + months);
    const today = new Date(); today.setHours(0,0,0,0);
    const daysLeft = Math.round((due - today) / 86400000);
    const totalDays = months * 30.44;
    if (daysLeft < 0)  return { status: 'overdue', label: `${Math.abs(daysLeft)}d overdue`, due };
    if (daysLeft <= 30 || daysLeft <= totalDays * 0.2)
                       return { status: 'soon',    label: `Due ${fmtDate(due.toISOString().slice(0,10))}`, due };
    return             { status: 'ok',      label: `Due ${fmtDate(due.toISOString().slice(0,10))}`, due };
  }
  return { status: 'ok', label: `Every ${hours}h` };
}

// ── LOG SERVICE MODAL ─────────────────────────────────────
function showLogServiceModal(bike, comp, sc, components, onSaved) {
  const today = new Date().toISOString().slice(0,10);
  const types = sc.bleed ? SERVICE_TYPES_BRAKE
              : sc.category === 'Dropper Post' ? SERVICE_TYPES_DROPPER
              : SERVICE_TYPES_SUSP;

  const body = `
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Date</label>
        <input id="svc-date" class="field-input" type="date" value="${today}">
      </div>
      <div class="field-group">
        <label class="field-label">Service Type</label>
        <select id="svc-type" class="field-select">
          ${types.map(t => `<option>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-group" style="margin-top:.5rem">
      <label class="field-label">Notes (optional)</label>
      <input id="svc-notes" class="field-input" type="text" placeholder="e.g. Used Fox Suspension Fluid 5wt">
    </div>`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-svc">Save</button>`;

  openModal(`Log Service — ${sc.label}`, body, footer);
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save-svc').onclick = async () => {
    const date  = document.getElementById('svc-date').value;
    const type  = document.getElementById('svc-type').value;
    const notes = document.getElementById('svc-notes').value.trim();
    if (!date) { showToast('Pick a date','error'); return; }
    const entry = { id: Date.now().toString(), date, type, notes };
    const log   = [...(comp.serviceLog||[]), entry].sort((a,b)=>b.date.localeCompare(a.date));
    try {
      await updateComponent(bike.id, comp.id, { serviceLog: log });
      comp.serviceLog = log;
      showToast('Service logged','success');
      closeModal();
      onSaved();
    } catch(e) { showToast('Save failed','error'); }
  };
}

// ── SET INTERVAL MODAL ────────────────────────────────────
function showIntervalModal(bike, comp, onSaved) {
  const body = `
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Every (months)</label>
        <input id="int-months" class="field-input" type="number" min="1" max="120"
               value="${comp.serviceIntervalMonths||''}" placeholder="e.g. 6">
      </div>
      <div class="field-group">
        <label class="field-label">Every (hours)</label>
        <input id="int-hours" class="field-input" type="number" min="1" max="5000"
               value="${comp.serviceIntervalHours||''}" placeholder="e.g. 200">
      </div>
    </div>
    <p style="font-size:.78rem;color:var(--text-muted);margin-top:.5rem">Set one or both. Months drives the due-date calculation.</p>`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-int">Save</button>`;

  openModal('Set Service Interval', body, footer);
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save-int').onclick = async () => {
    const months = document.getElementById('int-months').value;
    const hours  = document.getElementById('int-hours').value;
    try {
      await updateComponent(bike.id, comp.id, {
        serviceIntervalMonths: months ? parseFloat(months) : null,
        serviceIntervalHours:  hours  ? parseFloat(hours)  : null,
      });
      comp.serviceIntervalMonths = months ? parseFloat(months) : null;
      comp.serviceIntervalHours  = hours  ? parseFloat(hours)  : null;
      showToast('Interval saved','success');
      closeModal();
      onSaved();
    } catch(e) { showToast('Save failed','error'); }
  };
}

async function createServiceComponent(bike, category, components, onSaved) {
  try {
    await createComponent(bike.id, { category, brand:'', model:'', notes:'', serviceLog:[] });
    showToast(`${category} added to components`,'success');
    onSaved();
  } catch(e) { showToast('Failed','error'); }
}

// ── HELPERS ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  return new Date(d+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
