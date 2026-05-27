import { getComponents, updateComponent, createComponent } from './db.js';
import { showToast, openModal, closeModal } from './utils.js';

// ── SERVICE COMPONENT CONFIG ───────────────────────────────
const SERVICE_COMPONENTS = [
  {
    category: 'Fork',
    label:    'Front Suspension',
    icon:     `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><line x1="7" y1="2" x2="7" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/></svg>`,
    tiers: [
      { id: 'lowers',   label: 'Lowers Service',  hours: 50,  types: ['Lower Leg Service','Seal Inspection','Oil Change','Cleaned','Other'] },
      { id: 'full',     label: 'Full Overhaul',    hours: 125, types: ['Full Service','Damper Service','Air Spring','Rebuild','Other'] },
    ],
  },
  {
    category: 'Rear Shock',
    label:    'Rear Shock',
    icon:     `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><line x1="11" y1="2" x2="11" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="7" y="9" width="8" height="6" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`,
    tiers: [
      { id: 'aircan',   label: 'Air Can Service',  hours: 50,  types: ['Air Can Service','Seal Inspection','Re-grease','Cleaned','Other'] },
      { id: 'full',     label: 'Full Overhaul',    hours: 125, types: ['Full Service','Damper Rebuild','IFP Service','Rebuild','Other'] },
    ],
  },
  {
    category: 'Dropper Post',
    label:    'Dropper Post',
    icon:     `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><line x1="11" y1="2" x2="11" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="7" y1="14" x2="15" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    tiers: [
      { id: 'clean',    label: 'Clean & Lube',     hours: 50,  types: ['Clean & Lube','Wiper Seal','Grease','Cleaned','Other'] },
      { id: 'rebuild',  label: 'Full Rebuild',      hours: 120, types: ['Full Rebuild','Cartridge Replace','Bushing Replace','Seal Kit','Other'] },
    ],
  },
  {
    category: 'Brakes',
    label:    'Brakes',
    icon:     `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M11 7v4l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    tiers: [
      { id: 'bleed',    label: 'Brake Bleed',       months: 6, types: ['Brake Bleed','Full Bleed','Fluid Flush','Other'] },
    ],
    timeBased: true,
  },
];

// ── HOURS LOG (localStorage) ───────────────────────────────
function hoursKey(bikeId) { return `quiver_hours_${bikeId}`; }

function getHoursLog(bikeId) {
  try { return JSON.parse(localStorage.getItem(hoursKey(bikeId)) || '[]'); }
  catch { return []; }
}

function addHoursEntry(bikeId, hours) {
  const log = getHoursLog(bikeId);
  log.push({ id: Date.now().toString(), hours: parseFloat(hours), timestamp: Date.now() });
  localStorage.setItem(hoursKey(bikeId), JSON.stringify(log));
}

function getTotalHours(bikeId) {
  return getHoursLog(bikeId).reduce((s, e) => s + (e.hours || 0), 0);
}

// Hours ridden AFTER a given ISO date string (for "since last service")
function getHoursSince(bikeId, sinceDate) {
  if (!sinceDate) return getTotalHours(bikeId);
  const cutoff = new Date(sinceDate + 'T00:00:00').getTime();
  return getHoursLog(bikeId)
    .filter(e => e.timestamp > cutoff)
    .reduce((s, e) => s + (e.hours || 0), 0);
}

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
  const totalHours = getTotalHours(bike.id);

  container.innerHTML = `
    <div class="svc-tab-header">
      <div class="svc-header-left">
        <h2 class="tab-section-title" style="margin:0">Service Tracker</h2>
        <div class="svc-total-hours">
          <span class="svc-hours-num">${totalHours.toFixed(1)}</span>
          <span class="svc-hours-lbl">total hours logged</span>
        </div>
      </div>
      <button class="btn-primary svc-log-hours-btn" id="svc-log-hours">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M7 4.5V7l2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        Log Hours
      </button>
    </div>

    <div class="svc-cards-grid">
      ${SERVICE_COMPONENTS.map(sc => {
        const installed = components.filter(c => c.category === sc.category);
        return renderServiceCard(sc, installed, bike);
      }).join('')}
    </div>`;

  document.getElementById('svc-log-hours').onclick = () => showLogHoursModal(bike, components, () => renderServiceView(container, bike, components));

  container.querySelectorAll('.svc-log-service-btn').forEach(btn => {
    const compId   = btn.dataset.compId;
    const category = btn.dataset.category;
    const tierId   = btn.dataset.tierId;
    const comp     = components.find(c => c.id === compId);
    const sc       = SERVICE_COMPONENTS.find(s => s.category === category);
    const tier     = sc?.tiers.find(t => t.id === tierId);
    if (comp && sc && tier) {
      btn.onclick = () => showLogServiceModal(bike, comp, sc, tier, () => renderServiceTab(bike));
    }
  });

  container.querySelectorAll('.svc-add-comp-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await createComponent(bike.id, { category: btn.dataset.category, brand:'', model:'', notes:'', serviceLog:[] });
        showToast(`${btn.dataset.category} added`,'success');
        renderServiceTab(bike);
      } catch(e) { showToast('Failed','error'); }
    };
  });
}

// ── SERVICE CARD ───────────────────────────────────────────
function renderServiceCard(sc, installed, bike) {
  if (installed.length === 0) {
    return `<div class="svc-card svc-card-empty">
      <div class="svc-card-icon">${sc.icon}</div>
      <div class="svc-card-title">${sc.label}</div>
      <div class="svc-card-sub">Not yet added to components</div>
      <button class="btn-text svc-add-comp-btn" data-category="${sc.category}" style="font-size:.78rem;margin-top:.5rem">
        + Add component
      </button>
    </div>`;
  }

  return installed.map(comp => {
    const log = comp.serviceLog || [];
    const lastSvc = log[0];
    const compName = [comp.brand, comp.model].filter(Boolean).join(' ') || 'No details';

    const tiersHtml = sc.tiers.map(tier => {
      if (tier.months) {
        // Time-based (brakes)
        const monthsSince = lastSvc
          ? (Date.now() - new Date(lastSvc.date+'T00:00:00').getTime()) / (30.44*24*3600*1000)
          : null;
        const pct = monthsSince != null ? Math.min(120, (monthsSince / tier.months) * 100) : 0;
        const status = pct >= 100 ? 'overdue' : pct >= 80 ? 'soon' : 'ok';
        const label  = lastSvc
          ? (status === 'overdue' ? `${Math.round(monthsSince-tier.months)}mo overdue` : `${Math.round(tier.months - monthsSince)}mo remaining`)
          : 'No service logged';
        return tierBar(tier.label, null, tier.months, 0, pct, status, label, comp.id, sc.category, tier.id);
      }
      // Hours-based
      const sinceDateStr = lastSvc?.date || comp.installDate || null;
      const hoursSince   = getHoursSince(bike.id, sinceDateStr);
      const pct = Math.min(120, (hoursSince / tier.hours) * 100);
      const status = pct >= 100 ? 'overdue' : pct >= 80 ? 'soon' : 'ok';
      const remaining = Math.max(0, tier.hours - hoursSince);
      const label = status === 'overdue'
        ? `${(hoursSince - tier.hours).toFixed(0)}h overdue`
        : `${remaining.toFixed(0)}h remaining`;
      return tierBar(tier.label, hoursSince, tier.hours, 0, pct, status, label, comp.id, sc.category, tier.id);
    }).join('');

    return `<div class="svc-card">
      <div class="svc-card-header">
        <div class="svc-card-icon">${sc.icon}</div>
        <div class="svc-card-info">
          <div class="svc-card-title">${sc.label}</div>
          <div class="svc-card-sub">${escHtml(compName)}</div>
          ${lastSvc ? `<div class="svc-last-svc">Last: ${fmtDate(lastSvc.date)} — ${escHtml(lastSvc.type)}</div>` : '<div class="svc-last-svc svc-never">Never serviced</div>'}
        </div>
      </div>
      <div class="svc-tiers">${tiersHtml}</div>
      ${log.length > 0 ? `<div class="svc-history-mini">
        ${log.slice(0,2).map(e => `<div class="svc-history-row">
          <span class="svc-history-date">${fmtDate(e.date)}</span>
          <span class="svc-history-type">${escHtml(e.type)}</span>
          ${e.notes ? `<span class="svc-history-note">${escHtml(e.notes)}</span>` : ''}
        </div>`).join('')}
        ${log.length > 2 ? `<div class="svc-history-more">+${log.length-2} more entries</div>` : ''}
      </div>` : ''}
    </div>`;
  }).join('');
}

function tierBar(label, current, max, min, pct, status, statusLabel, compId, category, tierId) {
  const barColor = status === 'overdue' ? 'var(--danger)'
                 : status === 'soon'    ? 'var(--accent)'
                 : 'var(--success)';
  const barPct = Math.min(100, pct);
  return `<div class="svc-tier">
    <div class="svc-tier-labels">
      <span class="svc-tier-name">${label}</span>
      <span class="svc-tier-status ${status}">${statusLabel}</span>
    </div>
    <div class="svc-progress-track">
      <div class="svc-progress-fill ${status === 'overdue' ? 'svc-overdue-pulse' : ''}"
           style="width:${barPct}%;background:${barColor}"></div>
    </div>
    ${current != null ? `<div class="svc-tier-sub">${current.toFixed(0)}h / ${max}h</div>` : ''}
    <button class="btn-text svc-log-service-btn" style="font-size:.73rem;margin-top:.2rem;color:var(--text-muted)"
            data-comp-id="${compId}" data-category="${category}" data-tier-id="${tierId}">
      + Log service
    </button>
  </div>`;
}

// ── LOG HOURS MODAL ────────────────────────────────────────
function showLogHoursModal(bike, components, onSaved) {
  const total = getTotalHours(bike.id);
  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:1rem">
      Hours will be applied to all service-tracked components simultaneously.
      <strong style="color:var(--text-primary)">${total.toFixed(1)}h</strong> total logged so far.
    </p>
    <div class="field-group">
      <label class="field-label">Hours ridden</label>
      <div class="spinner-row" style="max-width:160px">
        <button type="button" class="spinner-btn spinner-minus" data-id="hours-input" data-step="0.5" data-min="0.5" data-max="24">−</button>
        <input type="number" id="hours-input" class="field-input spinner-input" value="2" min="0.5" max="24" step="0.5">
        <button type="button" class="spinner-btn spinner-plus" data-id="hours-input" data-step="0.5" data-min="0.5" data-max="24">+</button>
      </div>
    </div>`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-log-hours">Log Hours</button>`;

  openModal('Log Ride Hours', body, footer);

  // Bind spinner
  document.querySelectorAll('#modal-body .spinner-btn').forEach(btn => {
    btn.onclick = () => {
      const inp = document.getElementById(btn.dataset.id);
      if (!inp) return;
      const step=parseFloat(btn.dataset.step), min=parseFloat(btn.dataset.min), max=parseFloat(btn.dataset.max);
      const cur=parseFloat(inp.value)||0;
      inp.value = Math.max(min, Math.min(max, parseFloat((cur+(btn.classList.contains('spinner-minus')?-step:step)).toFixed(2))));
    };
  });

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-log-hours').onclick = () => {
    const hrs = parseFloat(document.getElementById('hours-input').value);
    if (!hrs || hrs <= 0) { showToast('Enter valid hours','error'); return; }

    // Also update serviceIntervalHours counter on all service components in Firestore
    addHoursEntry(bike.id, hrs);

    // Update rideHours on each service component in DB
    const tracked = components.filter(c =>
      SERVICE_COMPONENTS.some(s => s.category === c.category)
    );
    Promise.all(tracked.map(c => {
      const newHours = (parseFloat(c.rideHours) || 0) + hrs;
      c.rideHours = newHours;
      return updateComponent(bike.id, c.id, { rideHours: newHours });
    })).catch(() => {});

    showToast(`${hrs}h logged`, 'success');
    closeModal();
    onSaved();
  };
}

// ── LOG SERVICE MODAL ──────────────────────────────────────
function showLogServiceModal(bike, comp, sc, tier, onSaved) {
  const today = new Date().toISOString().slice(0,10);
  const body = `
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Date</label>
        <input id="svc-date" class="field-input" type="date" value="${today}">
      </div>
      <div class="field-group">
        <label class="field-label">Service Type</label>
        <select id="svc-type" class="field-select">
          ${tier.types.map(t => `<option>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-group" style="margin-top:.5rem">
      <label class="field-label">Notes (optional)</label>
      <input id="svc-notes" class="field-input" type="text" placeholder="e.g. Fox 5wt bath oil, 10ml per leg">
    </div>`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-svc">Save</button>`;

  openModal(`Log ${tier.label} — ${sc.label}`, body, footer);
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save-svc').onclick = async () => {
    const date  = document.getElementById('svc-date').value;
    const type  = document.getElementById('svc-type').value;
    const notes = document.getElementById('svc-notes').value.trim();
    if (!date) { showToast('Pick a date','error'); return; }
    const entry = { id: Date.now().toString(), date, type, tier: tier.id, notes };
    const log   = [...(comp.serviceLog||[]), entry].sort((a,b)=>b.date.localeCompare(a.date));
    try {
      await updateComponent(bike.id, comp.id, { serviceLog: log, rideHours: 0 });
      comp.serviceLog  = log;
      comp.rideHours   = 0;
      // Also reset the hours log entries before this date (clear hours since last service)
      // We don't delete them — we rely on getHoursSince(sinceDate) to filter correctly
      showToast('Service logged — hours reset','success');
      closeModal();
      onSaved();
    } catch(e) { showToast('Save failed','error'); }
  };
}

// ── HELPERS ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  return new Date(d+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Export for components tab to read total hours
export function getBikeHours(bikeId) { return getTotalHours(bikeId); }
