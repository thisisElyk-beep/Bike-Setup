import { getComponents, createComponent, updateComponent, deleteComponent } from './db.js';
import { showToast, openModal, closeModal } from './app.js';

// ── ICONS ─────────────────────────────────────────────────
function icon(path, vb = '0 0 20 20') {
  return `<svg width="16" height="16" viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
}
const frameIcon      = () => icon(`<rect x="2" y="6" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6L10 2l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`);
const forkIcon       = () => icon(`<path d="M7 2v8l-3 6M13 2v8l3 6M7 10h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`);
const shockIcon      = () => icon(`<line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="10" y1="2" x2="10" y2="10" stroke="var(--bg-elevated)" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="14" x2="13" y2="14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`);
const barIcon        = () => icon(`<path d="M2 10h16M2 10c0-1.5 1-2 2-2M18 10c0-1.5-1-2-2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10" y1="8" x2="10" y2="6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`);
const stemIcon       = () => icon(`<path d="M4 16l4-8h4l4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`);
const gripIcon       = () => icon(`<rect x="3" y="7" width="14" height="7" rx="3.5" stroke="currentColor" stroke-width="1.4"/><line x1="7" y1="7" x2="7" y2="14" stroke="currentColor" stroke-width="1" opacity="0.5"/><line x1="10" y1="7" x2="10" y2="14" stroke="currentColor" stroke-width="1" opacity="0.5"/><line x1="13" y1="7" x2="13" y2="14" stroke="currentColor" stroke-width="1" opacity="0.5"/>`);
const headsetIcon    = () => icon(`<circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/>`);
const brakeIcon      = () => icon(`<path d="M4 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="7" y="13" width="6" height="3" rx="1" stroke="currentColor" stroke-width="1.3"/>`);
const rotorIcon      = () => icon(`<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="3" x2="10" y2="5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10" y1="14.5" x2="10" y2="17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="3" y1="10" x2="5.5" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="14.5" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`);
const driveIcon      = () => icon(`<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.4"/>`);
const cassetteIcon   = () => icon(`<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="5" stroke="currentColor" stroke-width="1.2" opacity="0.6"/><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.2" opacity="0.4"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/>`);
const chainIcon      = () => icon(`<rect x="2" y="7" width="5" height="6" rx="2" stroke="currentColor" stroke-width="1.3"/><rect x="13" y="7" width="5" height="6" rx="2" stroke="currentColor" stroke-width="1.3"/><line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="1.4"/>`);
const crankIcon      = () => icon(`<circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="10" x2="16" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="10" x2="4" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`);
const derailleurIcon = () => icon(`<path d="M4 4l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="13" cy="13" r="3" stroke="currentColor" stroke-width="1.4"/><circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.4"/>`);
const shifterIcon    = () => icon(`<rect x="5" y="4" width="7" height="12" rx="3" stroke="currentColor" stroke-width="1.4"/><path d="M12 9h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`);
const pedalIcon      = () => icon(`<rect x="3" y="8" width="14" height="4" rx="1.5" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="8" x2="6" y2="12" stroke="currentColor" stroke-width="1" opacity="0.5"/><line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" stroke-width="1" opacity="0.5"/><line x1="14" y1="8" x2="14" y2="12" stroke="currentColor" stroke-width="1" opacity="0.5"/>`);
const bbIcon         = () => icon(`<circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.4"/><line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="10" cy="10" r="2" fill="currentColor"/>`);
const wheelIcon      = () => icon(`<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="2" x2="10" y2="8" stroke="currentColor" stroke-width="1.1" opacity="0.5"/><line x1="10" y1="12" x2="10" y2="18" stroke="currentColor" stroke-width="1.1" opacity="0.5"/><line x1="2" y1="10" x2="8" y2="10" stroke="currentColor" stroke-width="1.1" opacity="0.5"/><line x1="12" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.1" opacity="0.5"/>`);
const hubIcon        = () => icon(`<circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><line x1="2" y1="10" x2="6" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`);
const tireIcon       = () => icon(`<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="3"/><circle cx="10" cy="10" r="5" stroke="var(--bg-base)" stroke-width="1" fill="none"/>`);
const dropperIcon    = () => icon(`<line x1="10" y1="2" x2="10" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><rect x="6" y="12" width="8" height="3" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M6 18h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`);
const saddleIcon     = () => icon(`<path d="M2 12c2-3 5-4 8-4s6 1 8 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 12c2 1 5 1.5 8 1.5S16 13 18 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`);
const seatpostIcon   = () => icon(`<line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><rect x="7" y="8" width="6" height="3" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"/>`);
const clampIcon      = () => icon(`<circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="4" x2="10" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="8" y="1" width="4" height="2" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/>`);
const otherIcon      = () => icon(`<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M10 7v1.5a2 2 0 010 3V13M10 14.5v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`);

// ── CATEGORY DEFINITIONS ──────────────────────────────────
const CATEGORY_META = {
  'Frame':            { icon: frameIcon,      group: 'Frame & Contact' },
  'Fork':             { icon: forkIcon,       group: 'Suspension' },
  'Rear Shock':       { icon: shockIcon,      group: 'Suspension' },
  'Handlebar':        { icon: barIcon,        group: 'Frame & Contact' },
  'Stem':             { icon: stemIcon,       group: 'Frame & Contact' },
  'Grips / Tape':     { icon: gripIcon,       group: 'Frame & Contact' },
  'Headset':          { icon: headsetIcon,    group: 'Frame & Contact' },
  'Brakes':           { icon: brakeIcon,      group: 'Braking' },
  'Rotors':           { icon: rotorIcon,      group: 'Braking' },
  'Drivetrain':       { icon: driveIcon,      group: 'Drivetrain' },
  'Cassette':         { icon: cassetteIcon,   group: 'Drivetrain' },
  'Chain':            { icon: chainIcon,      group: 'Drivetrain' },
  'Chainring / Crank':{ icon: crankIcon,      group: 'Drivetrain' },
  'Derailleur':       { icon: derailleurIcon, group: 'Drivetrain' },
  'Shifter':          { icon: shifterIcon,    group: 'Drivetrain' },
  'Pedals':           { icon: pedalIcon,      group: 'Drivetrain' },
  'Bottom Bracket':   { icon: bbIcon,         group: 'Drivetrain' },
  'Wheels / Rims':    { icon: wheelIcon,      group: 'Wheels & Tires' },
  'Hubs':             { icon: hubIcon,        group: 'Wheels & Tires' },
  'Front Tire':       { icon: tireIcon,      group: 'Wheels & Tires' },
  'Rear Tire':        { icon: tireIcon,      group: 'Wheels & Tires' },
  'Dropper Post':     { icon: dropperIcon,    group: 'Saddle & Post' },
  'Saddle':           { icon: saddleIcon,     group: 'Saddle & Post' },
  'Seatpost':         { icon: seatpostIcon,   group: 'Saddle & Post' },
  'Seat Clamp':       { icon: clampIcon,      group: 'Saddle & Post' },
  'Other':            { icon: otherIcon,      group: 'Other' },
};

const CATEGORIES = Object.keys(CATEGORY_META);

const GROUP_ORDER = [
  'Frame & Contact', 'Suspension', 'Braking',
  'Drivetrain', 'Wheels & Tires', 'Saddle & Post', 'Other'
];

// ── RENDER ─────────────────────────────────────────────────
export async function renderComponentsTab(bike) {
  const list  = document.getElementById('components-grid');
  const empty = document.getElementById('components-empty');
  list.innerHTML = '<div style="padding:2rem;color:var(--text-muted);font-size:.85rem">Loading...</div>';

  try {
    const components = await getComponents(bike.id);
    list.innerHTML = '';

    if (components.length === 0) {
      list.classList.add('hidden');
      empty.classList.remove('hidden');
    } else {
      list.classList.remove('hidden');
      empty.classList.add('hidden');

      // Service summary banner
      const overdue = components.filter(c => getServiceStatus(c)?.status === 'overdue').length;
      const soon    = components.filter(c => getServiceStatus(c)?.status === 'soon').length;
      let banner = document.getElementById('svc-summary-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'svc-summary-banner';
        list.parentElement.insertBefore(banner, list);
      }
      if (overdue || soon) {
        const parts = [];
        if (overdue) parts.push(`<span style="color:var(--danger);font-weight:600">${overdue} overdue</span>`);
        if (soon)    parts.push(`<span style="color:var(--accent);font-weight:600">${soon} coming up</span>`);
        banner.innerHTML = `
          <div class="svc-summary-banner">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            ${parts.join(' · ')} for service
          </div>`;
      } else {
        banner.innerHTML = '';
      }

      renderComponentList(list, components, bike);
    }
  } catch (e) {
    list.innerHTML = `<p style="color:var(--danger);padding:1rem 2rem">Error: ${e.message}</p>`;
  }

  document.getElementById('btn-add-component').onclick    = () => showAddModal(bike);
  document.getElementById('btn-import-setup').onclick = () => showImportModal(bike);
}

function renderComponentList(container, components, bike) {
  // Group by category group, then category
  const byGroup = {};
  GROUP_ORDER.forEach(g => byGroup[g] = {});

  components.forEach(c => {
    const cat  = c.category || 'Other';
    const meta = CATEGORY_META[cat] || CATEGORY_META['Other'];
    const grp  = meta.group;
    if (!byGroup[grp]) byGroup[grp] = {};
    if (!byGroup[grp][cat]) byGroup[grp][cat] = [];
    byGroup[grp][cat].push(c);
  });

  GROUP_ORDER.forEach(grp => {
    const cats = byGroup[grp];
    if (!cats || Object.keys(cats).length === 0) return;

    // Group header
    const header = document.createElement('div');
    header.className = 'comp-group-header';
    header.textContent = grp;
    container.appendChild(header);

    // Items within group, sorted by category name
    Object.keys(cats).sort().forEach(cat => {
      cats[cat].forEach(comp => {
        container.appendChild(buildRow(comp, bike));
      });
    });
  });
}

// ── SERVICE STATUS ────────────────────────────────────────
function getServiceStatus(comp) {
  const intervalMonths = comp.serviceIntervalMonths ? parseFloat(comp.serviceIntervalMonths) : null;
  const intervalHours  = comp.serviceIntervalHours  ? parseFloat(comp.serviceIntervalHours)  : null;
  if (!intervalMonths && !intervalHours) return null;

  // Use most recent service log entry, fall back to install date
  const log      = comp.serviceLog || [];
  const lastDate = log[0]?.date || comp.installDate || null;
  if (!lastDate) return { status: 'unknown', label: 'No service date' };

  if (intervalMonths) {
    const last    = new Date(lastDate + 'T00:00:00');
    const due     = new Date(last);
    due.setMonth(due.getMonth() + intervalMonths);
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((due - today) / 86400000);
    const totalDays = intervalMonths * 30.44;

    if (daysLeft < 0) {
      return { status: 'overdue', label: `Overdue ${Math.abs(daysLeft)}d`, dueDate: due };
    } else if (daysLeft <= 30 || daysLeft <= totalDays * 0.2) {
      return { status: 'soon', label: `Due ${formatDate(due.toISOString().slice(0,10))}`, dueDate: due };
    }
    return { status: 'ok', label: `Due ${formatDate(due.toISOString().slice(0,10))}`, dueDate: due };
  }

  // Hours only — can't calculate due date without ride hours tracking
  // Show interval as reference only
  return { status: 'ok', label: `Every ${intervalHours}h` };
}

function serviceStatusBadge(status) {
  if (!status || status.status === 'ok') return '';
  const color = status.status === 'overdue' ? 'var(--danger)' : 'var(--accent)';
  return `<span class="svc-status-dot" style="background:${color}" title="${status.label}"></span>`;
}

// ── BUILD ROW ─────────────────────────────────────────────
function buildRow(comp, bike) {
  const row = document.createElement('div');
  row.className = 'comp-row';
  row.dataset.id = comp.id;

  const meta      = CATEGORY_META[comp.category] || CATEGORY_META['Other'];
  const svcStatus = getServiceStatus(comp);
  if (svcStatus?.status === 'overdue') row.classList.add('comp-row-overdue');
  if (svcStatus?.status === 'soon')    row.classList.add('comp-row-soon');

  // Date column: show service info if due/overdue, else install date
  let dateDisplay = '';
  if (svcStatus && (svcStatus.status === 'overdue' || svcStatus.status === 'soon')) {
    dateDisplay = `<span class="comp-row-date svc-${svcStatus.status}">${svcStatus.label}</span>`;
  } else if (comp.installDate) {
    dateDisplay = `<span class="comp-row-date">${formatDate(comp.installDate.slice(0,10))}</span>`;
  } else {
    dateDisplay = `<span class="comp-row-date"></span>`;
  }

  row.innerHTML = `
    <div class="comp-row-summary">
      <span class="comp-row-icon">${meta.icon()}</span>
      <span class="comp-row-cat">${escHtml(comp.category || 'Other')}</span>
      <span class="comp-row-name">${escHtml([comp.brand, comp.model].filter(Boolean).join(' ') || '—')}</span>
      ${dateDisplay}
      ${serviceStatusBadge(svcStatus)}
      <svg class="comp-row-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="comp-row-detail hidden">
      <div class="comp-edit-form">
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Brand</label>
            <input class="field-input comp-field-brand" type="text" value="${escHtml(comp.brand || '')}" placeholder="Brand">
          </div>
          <div class="field-group">
            <label class="field-label">Model</label>
            <input class="field-input comp-field-model" type="text" value="${escHtml(comp.model || '')}" placeholder="Model">
          </div>
        </div>
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Install Date</label>
            <input class="field-input comp-field-date" type="date" value="${comp.installDate ? comp.installDate.slice(0,10) : ''}">
          </div>
          <div class="field-group">
            <label class="field-label">Service Interval
              <span style="font-weight:400;color:var(--text-muted);text-transform:none;letter-spacing:0;margin-left:.3rem">(months)</span>
            </label>
            <input class="field-input comp-field-interval-months" type="number" min="1" max="120"
                   value="${comp.serviceIntervalMonths || ''}" placeholder="e.g. 6">
          </div>
        </div>
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Service Interval
              <span style="font-weight:400;color:var(--text-muted);text-transform:none;letter-spacing:0;margin-left:.3rem">(hours)</span>
            </label>
            <input class="field-input comp-field-interval-hours" type="number" min="1" max="5000"
                   value="${comp.serviceIntervalHours || ''}" placeholder="e.g. 200">
          </div>
          <div class="field-group"></div>
        </div>
        <div class="field-group">
          <label class="field-label">Notes</label>
          <textarea class="field-input comp-field-notes" rows="2">${escHtml(comp.notes || '')}</textarea>
        </div>
        <div class="comp-edit-actions">
          <button class="btn-danger btn-comp-delete">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5 5.5v4M8 5.5v4M2.5 3.5l.75 7a.5.5 0 00.5.5h5.5a.5.5 0 00.5-.5l.75-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Delete
          </button>
          <div style="display:flex;gap:.5rem">
            <button class="btn-secondary btn-comp-cancel">Cancel</button>
            <button class="btn-primary btn-comp-save">Save</button>
          </div>
        </div>
      </div>

      <!-- SERVICE LOG — shown above edit form for easy access -->
      <div class="service-log">
        <div class="service-log-header">
          <span class="service-log-title">Service History</span>
          <button class="btn-primary btn-log-service" style="font-size:.72rem;padding:.3rem .7rem;display:flex;align-items:center;gap:.35rem">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Log Service
          </button>
        </div>
        <div class="service-log-add hidden">
          <div class="field-row" style="margin-bottom:.5rem">
            <div class="field-group">
              <label class="field-label">Date</label>
              <input class="field-input svc-date" type="date" value="${new Date().toISOString().slice(0,10)}">
            </div>
            <div class="field-group">
              <label class="field-label">Type</label>
              <select class="field-select svc-type">
                <option>Full Service</option>
                <option>Seal Kit</option>
                <option>Oil Change</option>
                <option>Brake Bleed</option>
                <option>Chain Replaced</option>
                <option>Cable / Housing</option>
                <option>Cleaned</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div class="field-group" style="margin-bottom:.5rem">
            <input class="field-input svc-notes" type="text" placeholder="Notes (optional)">
          </div>
          <div style="display:flex;gap:.5rem;justify-content:flex-end">
            <button class="btn-secondary btn-svc-cancel" style="font-size:.72rem;padding:.3rem .65rem">Cancel</button>
            <button class="btn-primary btn-svc-save" style="font-size:.72rem;padding:.3rem .65rem">Add Entry</button>
          </div>
        </div>
        <div class="service-log-entries"></div>
      </div>
    </div>
  `;

  const summary = row.querySelector('.comp-row-summary');
  const detail  = row.querySelector('.comp-row-detail');
  const chevron = row.querySelector('.comp-row-chevron');

  // Toggle expand on summary click
  summary.addEventListener('click', () => {
    const isOpen = !detail.classList.contains('hidden');
    // Close any other open rows
    document.querySelectorAll('.comp-row-detail:not(.hidden)').forEach(d => {
      d.classList.add('hidden');
      d.closest('.comp-row')?.querySelector('.comp-row-chevron')?.style.removeProperty('transform');
      d.closest('.comp-row')?.classList.remove('comp-row-open');
    });
    if (!isOpen) {
      detail.classList.remove('hidden');
      chevron.style.transform = 'rotate(180deg)';
      row.classList.add('comp-row-open');
      row.querySelector('.comp-field-brand')?.focus();
    }
  });

  // Save inline
  row.querySelector('.btn-comp-save').onclick = async (e) => {
    e.stopPropagation();
    const brand          = row.querySelector('.comp-field-brand').value.trim();
    const model          = row.querySelector('.comp-field-model').value.trim();
    const installDate    = row.querySelector('.comp-field-date').value || null;
    const notes          = row.querySelector('.comp-field-notes').value.trim();
    const intMonthsEl    = row.querySelector('.comp-field-interval-months');
    const intHoursEl     = row.querySelector('.comp-field-interval-hours');
    const intervalMonths = intMonthsEl?.value ? parseFloat(intMonthsEl.value) : null;
    const intervalHours  = intHoursEl?.value  ? parseFloat(intHoursEl.value)  : null;
    try {
      await updateComponent(bike.id, comp.id, {
        category: comp.category, brand, model, installDate, notes,
        serviceIntervalMonths: intervalMonths,
        serviceIntervalHours:  intervalHours,
      });
      comp.brand = brand; comp.model = model;
      comp.installDate = installDate; comp.notes = notes;
      comp.serviceIntervalMonths = intervalMonths;
      comp.serviceIntervalHours  = intervalHours;
      // Refresh status display
      row.querySelector('.comp-row-name').textContent = [brand, model].filter(Boolean).join(' ') || '—';
      const newStatus = getServiceStatus(comp);
      row.classList.remove('comp-row-overdue','comp-row-soon');
      if (newStatus?.status === 'overdue') row.classList.add('comp-row-overdue');
      if (newStatus?.status === 'soon')    row.classList.add('comp-row-soon');
      const dateEl = row.querySelector('.comp-row-date');
      if (dateEl) {
        if (newStatus && (newStatus.status === 'overdue' || newStatus.status === 'soon')) {
          dateEl.textContent  = newStatus.label;
          dateEl.className    = `comp-row-date svc-${newStatus.status}`;
        } else if (installDate) {
          dateEl.textContent  = formatDate(installDate.slice(0,10));
          dateEl.className    = 'comp-row-date';
        }
      }
      detail.classList.add('hidden');
      chevron.style.removeProperty('transform');
      row.classList.remove('comp-row-open');
      showToast('Saved', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  // Cancel
  row.querySelector('.btn-comp-cancel').onclick = (e) => {
    e.stopPropagation();
    // Reset fields
    row.querySelector('.comp-field-brand').value = comp.brand || '';
    row.querySelector('.comp-field-model').value = comp.model || '';
    row.querySelector('.comp-field-date').value  = comp.installDate ? comp.installDate.slice(0,10) : '';
    row.querySelector('.comp-field-notes').value = comp.notes || '';
    detail.classList.add('hidden');
    chevron.style.removeProperty('transform');
    row.classList.remove('comp-row-open');
  };

  // Delete
  row.querySelector('.btn-comp-delete').onclick = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete ${comp.model || comp.brand || 'this component'}?`)) return;
    try {
      await deleteComponent(bike.id, comp.id);
      row.style.overflow = 'hidden';
      row.style.transition = 'max-height .22s ease, opacity .18s ease';
      row.style.maxHeight = row.offsetHeight + 'px';
      requestAnimationFrame(() => { row.style.maxHeight = '0'; row.style.opacity = '0'; });
      setTimeout(() => row.remove(), 240);
      showToast('Component removed', 'success');
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  // Service log
  renderServiceLog(row, comp, bike);
  row.querySelector('.btn-log-service').onclick = e => {
    e.stopPropagation();
    const addForm = row.querySelector('.service-log-add');
    addForm.classList.toggle('hidden');
    if (!addForm.classList.contains('hidden')) row.querySelector('.svc-notes')?.focus();
  };
  row.querySelector('.btn-svc-cancel').onclick = e => {
    e.stopPropagation();
    row.querySelector('.service-log-add').classList.add('hidden');
  };
  row.querySelector('.btn-svc-save').onclick = async e => {
    e.stopPropagation();
    const date  = row.querySelector('.svc-date').value;
    const type  = row.querySelector('.svc-type').value;
    const notes = row.querySelector('.svc-notes').value.trim();
    if (!date) { showToast('Pick a date', 'error'); return; }
    const entry = { id: Date.now().toString(), date, type, notes };
    comp.serviceLog = [...(comp.serviceLog || []), entry];
    comp.serviceLog.sort((a,b) => b.date.localeCompare(a.date));
    try {
      await updateComponent(bike.id, comp.id, { serviceLog: comp.serviceLog });
      row.querySelector('.service-log-add').classList.add('hidden');
      row.querySelector('.svc-notes').value = '';
      renderServiceLog(row, comp, bike);
      updateLastServiceDate(row, comp);
      showToast('Service logged', 'success');
    } catch(err) { showToast('Failed: ' + err.message, 'error'); }
  };

  return row;
}

// ── SERVICE LOG HELPERS ───────────────────────────────────
function renderServiceLog(row, comp, bike) {
  const entriesEl = row.querySelector('.service-log-entries');
  if (!entriesEl) return;
  const log = comp.serviceLog || [];
  if (log.length === 0) {
    entriesEl.innerHTML = `<div class="service-log-empty">No service history yet</div>`;
    return;
  }
  entriesEl.innerHTML = log.map(e => `
    <div class="service-entry" data-id="${e.id}">
      <div class="service-entry-left">
        <span class="service-entry-type">${escHtml(e.type)}</span>
        <span class="service-entry-date">${formatDate(e.date)}</span>
        ${e.notes ? `<span class="service-entry-notes">${escHtml(e.notes)}</span>` : ''}
      </div>
      <button class="btn-icon-sm service-entry-delete" title="Delete entry">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 5v4M7.5 5v4M2.5 3l.6 6.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>`).join('');

  entriesEl.querySelectorAll('.service-entry-delete').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const id = btn.closest('.service-entry').dataset.id;
      comp.serviceLog = (comp.serviceLog || []).filter(e => e.id !== id);
      try {
        await updateComponent(bike.id, comp.id, { serviceLog: comp.serviceLog });
        renderServiceLog(row, comp, bike);
        updateLastServiceDate(row, comp);
      } catch(err) { showToast('Delete failed', 'error'); }
    };
  });
}

function updateLastServiceDate(row, comp) {
  const log = comp.serviceLog || [];
  if (log.length === 0) return;
  const latest = log[0]; // sorted descending
  const dateEl = row.querySelector('.comp-row-date');
  if (dateEl) dateEl.textContent = `Svc: ${formatDate(latest.date)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── IMPORT FROM SETUP ─────────────────────────────────────
// Maps baseline keys to component categories
const IMPORT_MAP = [
  { key: 'frame',      category: 'Frame',          label: 'Frame' },
  { key: 'fork',       category: 'Fork',           label: 'Fork' },
  { key: 'shock',      category: 'Rear Shock',     label: 'Rear Shock' },
  { key: 'handlebar',  category: 'Handlebar',      label: 'Handlebar' },
  { key: 'stem',       category: 'Stem',           label: 'Stem' },
  { key: 'brakes',     category: 'Brakes',         label: 'Brakes' },
  { key: 'shifters',   category: 'Shifter',        label: 'Shifter' },
  { key: 'drivetrain', category: 'Drivetrain',     label: 'Drivetrain' },
  { key: 'dropper',    category: 'Dropper Post',   label: 'Dropper Post' },
  { key: 'grips',      category: 'Grips / Tape',   label: 'Grips' },
  { key: 'headset',    category: 'Headset',        label: 'Headset' },
  { key: 'frontWheel', category: 'Wheels / Rims',  label: 'Front Wheel' },
  { key: 'rearWheel',  category: 'Wheels / Rims',  label: 'Rear Wheel' },
  { key: 'frontTire',  category: 'Front Tire',     label: 'Front Tire' },
  { key: 'rearTire',   category: 'Rear Tire',      label: 'Rear Tire' },
];

async function showImportModal(bike) {
  const bl = bike.baseline || {};

  // Build candidates — only baseline entries that have a brand
  const candidates = IMPORT_MAP.filter(({ key }) => bl[key]?.brand);

  if (candidates.length === 0) {
    showToast('No component data found in Setup. Fill in brands in the Setup tab first.', 'info');
    return;
  }

  // Fetch existing to flag duplicates
  let existing = [];
  try { existing = await getComponents(bike.id); } catch(e) {}
  const existingCategories = new Set(existing.map(c => c.category));

  const rows = candidates.map(({ key, category, label }) => {
    const d = bl[key];
    const name = [d.brand, d.model].filter(Boolean).join(' ');
    const isDupe = existingCategories.has(category);
    return `
      <label class="import-row${isDupe ? ' import-row-dupe' : ''}">
        <input type="checkbox" class="import-check" value="${key}" ${isDupe ? '' : 'checked'} ${isDupe ? 'disabled' : ''}>
        <div class="import-row-info">
          <span class="import-row-cat">${escHtml(category)}</span>
          <span class="import-row-name">${escHtml(name)}${isDupe ? '<span class="import-dupe-tag">already exists</span>' : ''}</span>
        </div>
      </label>`;
  }).join('');

  const body = `
    <p style="font-size:.83rem;color:var(--text-secondary);margin-bottom:1rem;line-height:1.5">
      Select which components to import. Each will appear in the Components tab with brand and model pre-filled.
    </p>
    <div class="import-list">${rows}</div>
    <label class="import-select-all" style="margin-top:.75rem;display:flex;align-items:center;gap:.5rem;font-size:.8rem;color:var(--text-secondary);cursor:pointer">
      <input type="checkbox" id="import-toggle-all" checked>
      Select all
    </label>`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary"   id="modal-import">Import Selected</button>`;

  openModal('Import from Setup', body, footer);

  // Toggle all
  document.getElementById('import-toggle-all').onchange = function() {
    document.querySelectorAll('.import-check').forEach(cb => cb.checked = this.checked);
  };

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-import').onclick = async () => {
    const selected = [...document.querySelectorAll('.import-check:checked')].map(cb => cb.value);
    if (selected.length === 0) { showToast('Nothing selected', 'error'); return; }

    // Fetch existing components to check for duplicates
    let existing = [];
    try { existing = await getComponents(bike.id); } catch(e) {}
    const existingCategories = new Set(existing.map(c => c.category));

    let imported = 0, skipped = 0;
    for (const key of selected) {
      const { category } = IMPORT_MAP.find(m => m.key === key);
      const d = bl[key];

      if (existingCategories.has(category)) {
        skipped++;
        continue;
      }

      try {
        await createComponent(bike.id, {
          category,
          brand:  d.brand  || '',
          model:  d.model  || '',
          notes:  d.notes  || '',
          installDate: null,
          serviceLog: [],
        });
        existingCategories.add(category); // prevent double-import if two keys map to same category
        imported++;
      } catch(e) {}
    }

    const msg = skipped > 0
      ? `${imported} imported, ${skipped} skipped (already exist)`
      : `${imported} component${imported !== 1 ? 's' : ''} imported`;
    showToast(msg, skipped > 0 && imported === 0 ? 'info' : 'success');
    closeModal();
    renderComponentsTab(bike);
  };
}

// ── ADD MODAL ─────────────────────────────────────────────
function showAddModal(bike) {
  // Icon grid for category selection
  const iconGrid = CATEGORIES.map(cat => {
    const meta = CATEGORY_META[cat];
    return `
      <label class="comp-cat-option">
        <input type="radio" name="comp-cat-pick" value="${escHtml(cat)}">
        <span class="comp-cat-label">
          <span class="comp-cat-icon">${meta.icon()}</span>
          <span class="comp-cat-name">${escHtml(cat)}</span>
        </span>
      </label>`;
  }).join('');

  const body = `
    <div class="field-group">
      <label class="field-label">Category</label>
      <div class="comp-cat-grid">${iconGrid}</div>
    </div>
    <div class="field-row" style="margin-top:1rem">
      <div class="field-group">
        <label class="field-label" for="new-comp-brand">Brand</label>
        <input id="new-comp-brand" class="field-input" type="text" placeholder="Brand">
      </div>
      <div class="field-group">
        <label class="field-label" for="new-comp-model">Model</label>
        <input id="new-comp-model" class="field-input" type="text" placeholder="Model">
      </div>
    </div>
    <div class="field-group">
      <label class="field-label" for="new-comp-date">Install Date</label>
      <input id="new-comp-date" class="field-input" type="date">
    </div>
    <div class="field-group">
      <label class="field-label" for="new-comp-notes">Notes</label>
      <textarea id="new-comp-notes" class="field-input" rows="2" placeholder="Optional notes"></textarea>
    </div>
  `;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save">Add Component</button>
  `;

  openModal('Add Component', body, footer);

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save').onclick = async () => {
    const category    = document.querySelector('input[name="comp-cat-pick"]:checked')?.value;
    const brand       = document.getElementById('new-comp-brand').value.trim();
    const model       = document.getElementById('new-comp-model').value.trim();
    const installDate = document.getElementById('new-comp-date').value || null;
    const notes       = document.getElementById('new-comp-notes').value.trim();

    if (!category) { showToast('Pick a category', 'error'); return; }
    try {
      await createComponent(bike.id, { category, brand, model, installDate, notes });
      showToast('Component added', 'success');
      closeModal();
      renderComponentsTab(bike);
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
