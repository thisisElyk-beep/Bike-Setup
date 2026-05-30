import { createTestSession, getTestSessions, updateTestSession, deleteTestSession, updateBike } from './db.js';
import { showToast, openModal, closeModal } from './utils.js';

// ── SESSION STATE ──────────────────────────────────────────
// Active session persists in localStorage so it survives page reloads
function activeKey(bikeId)   { return `quiver_active_session_${bikeId}`; }
function getActiveSession(bikeId) {
  try { return JSON.parse(localStorage.getItem(activeKey(bikeId))); }
  catch { return null; }
}
function saveActiveSession(bikeId, session) {
  if (session) localStorage.setItem(activeKey(bikeId), JSON.stringify(session));
  else localStorage.removeItem(activeKey(bikeId));
}

// ── ENTRY POINT ────────────────────────────────────────────
export async function renderTestingTab(bike) {
  const container = document.getElementById('tab-testing');
  if (!container) return;
  container.innerHTML = `<div class="rides-loading"><span>Loading…</span></div>`;

  let sessions = [];
  try { sessions = await getTestSessions(bike.id); } catch(e) {}

  const active = getActiveSession(bike.id);
  renderTuningView(container, bike, sessions, active);
}

// ── MAIN VIEW ──────────────────────────────────────────────
function renderTuningView(container, bike, sessions, active) {
  container.innerHTML = `
    <div class="rides-toolbar">
      <h2 class="tab-section-title" style="margin:0">Tuning</h2>
      ${!active ? `<button class="btn-primary" id="btn-new-session">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        New Session
      </button>` : ''}
    </div>

    ${active ? renderActiveSession(active) : ''}

    <div id="sessions-list">
      ${sessions.length === 0 && !active
        ? `<div class="empty-state" style="padding:2rem">
            <h3>No tuning sessions yet</h3>
            <p>Start a session to log suspension changes and how they felt on trail.</p>
           </div>`
        : sessions.map(s => renderSessionCard(s)).join('')}
    </div>`;

  // Wire buttons
  document.getElementById('btn-new-session')?.addEventListener('click', () =>
    showNewSessionModal(bike, sessions, () => renderTestingTab(bike))
  );

  document.getElementById('btn-end-session')?.addEventListener('click', () =>
    showEndSessionModal(bike, active, sessions, () => renderTestingTab(bike))
  );

  document.getElementById('btn-add-note')?.addEventListener('click', () =>
    showAddNoteModal(bike, active, () => renderTestingTab(bike))
  );

  // Elapsed timer
  if (active) startElapsedTimer(active.startedAt);

  // Past session delete
  container.querySelectorAll('.session-delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this session?')) return;
      const card = btn.closest('.session-card');
      if (card) card.style.display = 'none'; // hide immediately
      try {
        await deleteTestSession(bike.id, btn.dataset.id);
        sessions = sessions.filter(s => s.id !== btn.dataset.id);
        showToast('Session deleted', 'success');
      } catch(e) {
        if (card) card.style.display = '';
        showToast('Delete failed', 'error');
      }
    };
  });
}

// ── ACTIVE SESSION CARD ────────────────────────────────────
function renderActiveSession(session) {
  const bl = session.settings || {};
  const fk = bl.fork || {}, sk = bl.shock || {};
  const ft = bl.frontTire || {}, rt = bl.rearTire || {};

  // Build chips showing current value + delta from baseline
  const baselineBl = session.baseline || {};
  const bfk = baselineBl.fork || {}, bsk = baselineBl.shock || {};
  const bft = baselineBl.frontTire || {}, brt = baselineBl.rearTire || {};
  const chip = (label, val, baseVal) => {
    if (val == null) return null;
    const delta = baseVal != null && val !== baseVal ? ` (${val > baseVal ? '+' : ''}${val - baseVal})` : '';
    const changed = baseVal != null && val !== baseVal;
    return { label: `${label} ${val}${delta}`, changed };
  };
  const settingChips = [
    chip('Fork', fk.psi, bfk.psi),
    chip('LSR', fk.lsr, bfk.lsr),
    chip('LSC Fork', fk.lsc, bfk.lsc),
    chip('Shock', sk.psi, bsk.psi),
    chip(sk.damperType==='single'?'Rebound':'LSR', sk.lsr, bsk.lsr),
    chip('LSC Shock', sk.lsc, bsk.lsc),
    chip('F Tire', ft.psi, bft.psi),
    chip('R Tire', rt.psi, brt.psi),
  ].filter(Boolean);

  const notes = session.notes || [];

  return `<div class="active-session-card">
    <div class="active-session-header">
      <div class="active-session-pulse"></div>
      <div class="active-session-info">
        <div class="active-session-title">${escHtml(session.title)}</div>
        <div class="active-session-elapsed" id="session-elapsed">—</div>
      </div>
      <div style="display:flex;gap:.5rem">
        <button class="btn-text" id="btn-add-note" style="font-size:.78rem">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Add Note
        </button>
        <button class="btn-danger" id="btn-end-session" style="font-size:.78rem;padding:.35rem .75rem">
          End Session
        </button>
      </div>
    </div>

    <div class="active-session-chips">
      ${settingChips.map(c => `<span class="session-chip ${c.changed ? 'session-chip-changed' : ''}">${escHtml(c.label)}</span>`).join('')}
    </div>

    ${notes.length > 0 ? `
    <div class="session-notes-log">
      ${notes.map(n => `
        <div class="session-note-entry">
          <span class="session-note-time">${fmtElapsed(n.offsetMs)}</span>
          <span class="session-note-text">${escHtml(n.text)}</span>
        </div>`).join('')}
    </div>` : `<div class="session-notes-empty">No notes yet — add notes as you ride to capture how changes felt</div>`}
  </div>`;
}

// ── PAST SESSION CARD ──────────────────────────────────────
function renderSessionCard(s) {
  const duration = s.endedAt && s.startedAt
    ? fmtElapsed(s.endedAt - s.startedAt) : '—';
  const notes = s.notes || [];
  const adopted = s.adopted ? '<span class="session-adopted-badge">Adopted</span>' : '';

  return `<div class="session-card">
    <div class="session-card-header">
      <div>
        <div class="session-card-title">${escHtml(s.title || 'Untitled Session')} ${adopted}</div>
        <div class="session-card-meta">${fmtDate(s.startedAt)} · ${duration}</div>
      </div>
      <button class="btn-icon-sm session-delete-btn" data-id="${s.id}" title="Delete" style="color:var(--text-muted)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 5v4M7.5 5v4M2.5 3l.6 6.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    ${notes.length > 0 ? `<div class="session-notes-log">
      ${notes.slice(0,3).map(n => `
        <div class="session-note-entry">
          <span class="session-note-time">${fmtElapsed(n.offsetMs)}</span>
          <span class="session-note-text">${escHtml(n.text)}</span>
        </div>`).join('')}
      ${notes.length > 3 ? `<div style="font-size:.72rem;color:var(--text-muted)">+${notes.length-3} more notes</div>` : ''}
    </div>` : ''}
  </div>`;
}

// ── NEW SESSION MODAL ──────────────────────────────────────
function showNewSessionModal(bike, sessions, onSaved) {
  const bl = bike.baseline || {};
  const fk = bl.fork || {}, sk = bl.shock || {};
  const ft = bl.frontTire || {}, rt = bl.rearTire || {};

  const spinnerField = (label, id, val, min, max) => `
    <div class="field-group">
      <label class="field-label">${label}</label>
      <div class="spinner-row">
        <button type="button" class="spinner-btn spinner-minus" data-id="${id}" data-step="1" data-min="${min}" data-max="${max}">−</button>
        <input type="number" id="${id}" class="field-input spinner-input" value="${val ?? ''}" min="${min}" max="${max}" step="1" placeholder="—">
        <button type="button" class="spinner-btn spinner-plus" data-id="${id}" data-step="1" data-min="${min}" data-max="${max}">+</button>
      </div>
    </div>`;

  const fkDt = fk.damperType || '4way';
  const skDt = sk.damperType || '4way';

  const body = `
    <div class="field-group" style="margin-bottom:.75rem">
      <label class="field-label">Session Title</label>
      <input id="session-title" class="field-input" type="text" placeholder="e.g. Lower PSI test, +2 LSC clicks" autofocus>
    </div>
    <p class="preset-modal-hint">Settings are pre-filled from your baseline. Change only what you're testing.</p>

    <div class="settings-section-divider">Fork</div>
    <div class="field-row">
      ${spinnerField('Air Pressure (psi)', 'ss-fk-psi', fk.psi, 20, 350)}
      ${fkDt !== 'none' && fkDt !== 'comp' ? spinnerField(fkDt==='single'?'Rebound':'LSR', 'ss-fk-lsr', fk.lsr, 0, 40) : ''}
    </div>
    ${fkDt === '3way' || fkDt === '4way' ? `<div class="field-row">${spinnerField('HSR','ss-fk-hsr',fk.hsr,0,40)}${spinnerField('LSC','ss-fk-lsc',fk.lsc,0,40)}</div>` : ''}
    ${fkDt === 'comp' || fkDt === '2way' ? `<div class="field-row">${spinnerField('LSC','ss-fk-lsc',fk.lsc,0,40)}</div>` : ''}
    ${fkDt === '4way' ? `<div class="field-row">${spinnerField('HSC','ss-fk-hsc',fk.hsc,0,40)}</div>` : ''}

    <div class="settings-section-divider">Rear Shock</div>
    <div class="field-row">
      ${spinnerField('Air Pressure (psi)', 'ss-sk-psi', sk.psi, 20, 350)}
      ${skDt !== 'none' && skDt !== 'comp' ? spinnerField(skDt==='single'?'Rebound':'LSR', 'ss-sk-lsr', sk.lsr, 0, 40) : ''}
    </div>
    ${skDt === '3way' || skDt === '4way' ? `<div class="field-row">${spinnerField('HSR','ss-sk-hsr',sk.hsr,0,40)}${spinnerField('LSC','ss-sk-lsc',sk.lsc,0,40)}</div>` : ''}
    ${skDt === 'comp' || skDt === '2way' ? `<div class="field-row">${spinnerField('LSC','ss-sk-lsc',sk.lsc,0,40)}</div>` : ''}
    ${skDt === '4way' ? `<div class="field-row">${spinnerField('HSC','ss-sk-hsc',sk.hsc,0,40)}</div>` : ''}

    <div class="settings-section-divider">Tires</div>
    <div class="field-row">
      ${spinnerField('Front PSI', 'ss-ft-psi', ft.psi, 10, 160)}
      ${spinnerField('Rear PSI',  'ss-rt-psi', rt.psi, 10, 160)}
    </div>`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-start-session">Start Session</button>`;

  openModal('New Tuning Session', body, footer);

  // Spinner binding
  document.getElementById('modal-body').addEventListener('click', e => {
    const btn = e.target.closest('.spinner-btn');
    if (!btn) return;
    const inp = document.getElementById(btn.dataset.id);
    if (!inp) return;
    const step = 1, min = parseFloat(btn.dataset.min), max = parseFloat(btn.dataset.max);
    const cur = parseFloat(inp.value) || 0;
    inp.value = btn.classList.contains('spinner-minus')
      ? Math.max(min, Math.round(cur - step))
      : Math.min(max, Math.round(cur + step));
  });

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-start-session').onclick = () => {
    const title = document.getElementById('session-title').value.trim();
    if (!title) { showToast('Enter a session title', 'error'); return; }
    const n = id => { const el = document.getElementById(id); return el && el.value !== '' ? parseFloat(el.value) : null; };

    const session = {
      id: 'session_' + Date.now(),
      title,
      startedAt: Date.now(),
      endedAt: null,
      notes: [],
      baseline: JSON.parse(JSON.stringify(bike.baseline || {})),
      settings: {
        fork:      { ...fk, psi: n('ss-fk-psi'), lsr: n('ss-fk-lsr'), hsr: n('ss-fk-hsr'), lsc: n('ss-fk-lsc'), hsc: n('ss-fk-hsc') },
        shock:     { ...sk, psi: n('ss-sk-psi'), lsr: n('ss-sk-lsr'), hsr: n('ss-sk-hsr'), lsc: n('ss-sk-lsc'), hsc: n('ss-sk-hsc') },
        frontTire: { ...ft, psi: n('ss-ft-psi') },
        rearTire:  { ...rt, psi: n('ss-rt-psi') },
      },
    };

    saveActiveSession(bike.id, session);
    closeModal();
    renderTestingTab(bike);
  };
}

// ── ADD NOTE MODAL ─────────────────────────────────────────
function showAddNoteModal(bike, session, onSaved) {
  const body = `
    <div class="field-group">
      <label class="field-label">Note</label>
      <textarea id="note-text" class="field-input" rows="3"
        placeholder="e.g. Felt more planted in corners but pushed through rock garden — try 1 more click LSC"></textarea>
    </div>`;
  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-note">Add Note</button>`;

  openModal('Add Note', body, footer);
  setTimeout(() => document.getElementById('note-text')?.focus(), 50);
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save-note').onclick = () => {
    const text = document.getElementById('note-text').value.trim();
    if (!text) { showToast('Write something first', 'error'); return; }
    const updated = { ...session, notes: [...(session.notes||[]), { text, offsetMs: Date.now() - session.startedAt }] };
    saveActiveSession(bike.id, updated);
    closeModal();
    onSaved();
  };
}

// ── END SESSION MODAL ──────────────────────────────────────
function showEndSessionModal(bike, session, sessions, onSaved) {
  const bl = bike.baseline || {};
  const s = session.settings || {};

  // Compute diff between session settings and baseline
  const FIELDS = [
    ['Fork Air', bl.fork?.psi,       s.fork?.psi,       'psi'],
    ['Fork LSR', bl.fork?.lsr,       s.fork?.lsr,       'clicks'],
    ['Fork HSR', bl.fork?.hsr,       s.fork?.hsr,       'clicks'],
    ['Fork LSC', bl.fork?.lsc,       s.fork?.lsc,       'clicks'],
    ['Fork HSC', bl.fork?.hsc,       s.fork?.hsc,       'clicks'],
    ['Shock Air',bl.shock?.psi,      s.shock?.psi,      'psi'],
    ['Shock LSR',bl.shock?.lsr,      s.shock?.lsr,      'clicks'],
    ['Shock HSR',bl.shock?.hsr,      s.shock?.hsr,      'clicks'],
    ['Shock LSC',bl.shock?.lsc,      s.shock?.lsc,      'clicks'],
    ['Shock HSC',bl.shock?.hsc,      s.shock?.hsc,      'clicks'],
    ['Front PSI',bl.frontTire?.psi,  s.frontTire?.psi,  'psi'],
    ['Rear PSI', bl.rearTire?.psi,   s.rearTire?.psi,   'psi'],
  ].filter(([,base,test]) => base != null && test != null && base !== test);

  const diffHtml = diff => diff.length === 0
    ? '<div style="font-size:.85rem;color:var(--text-muted);padding:.5rem 0">No changes from baseline</div>'
    : diff.map(([label, base, test, unit]) => `
        <div class="preset-diff-row">
          <span class="preset-diff-label">${label}</span>
          <span class="preset-diff-vals">
            <span class="preset-diff-base">${base} ${unit}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="preset-diff-new">${test} ${unit}</span>
          </span>
        </div>`).join('');

  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:1rem">
      How do you want to handle <strong>${escHtml(session.title)}</strong>?
    </p>
    ${FIELDS.length > 0 ? `
    <div class="settings-section-divider">Changes from baseline</div>
    <div class="preset-diff-list" style="margin-bottom:1rem">
      ${diffHtml(FIELDS)}
    </div>` : ''}
    <div class="end-session-options">
      <button class="end-option-btn" data-choice="adopt" id="end-adopt">
        <div class="end-option-title">Adopt as Baseline</div>
        <div class="end-option-sub">Save session + update your baseline with these settings</div>
      </button>
      <button class="end-option-btn" data-choice="save" id="end-save">
        <div class="end-option-title">Save for Reference</div>
        <div class="end-option-sub">Keep session logged without changing baseline</div>
      </button>
      <button class="end-option-btn" data-choice="discard" id="end-discard">
        <div class="end-option-title" style="color:var(--danger)">Discard Session</div>
        <div class="end-option-sub">Remove session without saving</div>
      </button>
    </div>
    <button class="btn-primary" id="end-confirm" disabled style="width:100%;margin-top:.75rem;opacity:.4">
      Confirm
    </button>`;

  openModal('End Session', body, '');

  let selectedChoice = null;
  const confirmBtn = document.getElementById('end-confirm');

  document.querySelectorAll('.end-option-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.end-option-btn').forEach(b => b.classList.remove('end-option-selected'));
      btn.classList.add('end-option-selected');
      selectedChoice = btn.dataset.choice;
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
    };
  });

  confirmBtn.onclick = async () => {
    if (!selectedChoice) return;
    try {
      if (selectedChoice === 'adopt') {
        const newBaseline = { ...bl, fork: { ...bl.fork, ...s.fork }, shock: { ...bl.shock, ...s.shock }, frontTire: { ...bl.frontTire, ...s.frontTire }, rearTire: { ...bl.rearTire, ...s.rearTire } };
        await updateBike(bike.id, { baseline: newBaseline });
        bike.baseline = newBaseline;
        const ended = { ...session, endedAt: Date.now(), adopted: true };
        await createTestSession(bike.id, ended);
        saveActiveSession(bike.id, null);
        showToast('Session saved + baseline updated', 'success');
      } else if (selectedChoice === 'save') {
        const ended = { ...session, endedAt: Date.now(), adopted: false };
        await createTestSession(bike.id, ended);
        saveActiveSession(bike.id, null);
        showToast('Session saved', 'success');
      } else {
        saveActiveSession(bike.id, null);
        showToast('Session discarded', 'info');
      }
      closeModal();
      onSaved();
    } catch(e) { showToast('Failed: ' + e.message, 'error'); }
  };
}

// ── ELAPSED TIMER ──────────────────────────────────────────
function startElapsedTimer(startedAt) {
  const el = document.getElementById('session-elapsed');
  if (!el) return;
  const update = () => {
    const ms = Date.now() - startedAt;
    el.textContent = fmtElapsed(ms);
  };
  update();
  const interval = setInterval(() => {
    if (!document.getElementById('session-elapsed')) { clearInterval(interval); return; }
    update();
  }, 1000);
}

// ── HELPERS ────────────────────────────────────────────────
function fmtElapsed(ms) {
  if (!ms) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
