import { getTestSessions, createTestSession, updateTestSession, deleteTestSession, updateBike } from './db.js';
import { showToast, openModal, closeModal } from './utils.js';

let _activeBike = null;
let _sessions = [];

export async function renderTestingTab(bike) {
  _activeBike = bike;
  const historyList = document.getElementById('test-history-list');
  const emptyEl = document.getElementById('test-empty');
  const activePanel = document.getElementById('active-test-panel');

  historyList.innerHTML = '<div style="padding:1rem 2rem;color:var(--text-muted);font-size:.85rem">Loading...</div>';

  try {
    _sessions = await getTestSessions(bike.id);
    historyList.innerHTML = '';

    const active = _sessions.find(s => !s.adopted && s.isActive);

    if (active) {
      renderActivePanel(active, bike);
    } else {
      activePanel.classList.add('hidden');
      activePanel.innerHTML = '';
    }

    if (_sessions.length === 0) {
      historyList.classList.add('hidden');
      emptyEl.classList.remove('hidden');
    } else {
      historyList.classList.remove('hidden');
      emptyEl.classList.add('hidden');
      _sessions.forEach(s => historyList.appendChild(buildSessionCard(s, bike)));
    }
  } catch (e) {
    historyList.innerHTML = `<p style="color:var(--danger);padding:1rem 2rem">Error: ${e.message}</p>`;
  }

  document.getElementById('btn-new-test').onclick = () => showNewTestModal(bike);
}

// ── ACTIVE TEST PANEL ─────────────────────────────────────

function renderActivePanel(session, bike) {
  const panel = document.getElementById('active-test-panel');
  panel.classList.remove('hidden');

  const delta = computeDelta(bike.baseline || {}, session.testSettings || {});
  const deltaRows = delta.map(r => `
    <tr>
      <td class="delta-param">${escHtml(r.param)}</td>
      <td class="delta-base">${escHtml(r.base)}</td>
      <td class="delta-test">${escHtml(r.test)}</td>
      <td class="delta-diff ${r.cssClass}">${escHtml(r.diff)}</td>
    </tr>
  `).join('');

  panel.innerHTML = `
    <div class="active-test-header">
      <span class="active-test-badge">Active Session</span>
    </div>
    <div class="active-test-name">${escHtml(session.name)}</div>
    <div class="active-test-meta">
      ${session.trail ? `Trail: ${escHtml(session.trail)}` : ''}
      ${session.conditions ? ` · ${escHtml(session.conditions)}` : ''}
      ${session.weather ? ` · ${escHtml(session.weather)}` : ''}
    </div>
    ${delta.length > 0 ? `
    <table class="delta-table">
      <thead><tr>
        <th>Parameter</th><th>Baseline</th><th>Test</th><th>Δ</th>
      </tr></thead>
      <tbody>${deltaRows}</tbody>
    </table>` : '<p style="font-size:.82rem;color:var(--text-muted)">No numeric differences from baseline.</p>'}
    ${session.notes ? `<div class="test-notes">${escHtml(session.notes)}</div>` : ''}
    <div class="active-test-actions">
      <button class="btn-success" id="btn-adopt-active">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5L11 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Adopt as Baseline
      </button>
      <button class="btn-danger" id="btn-discard-active">Discard Session</button>
    </div>
  `;

  document.getElementById('btn-adopt-active').onclick = () => adoptSession(session, bike);
  document.getElementById('btn-discard-active').onclick = () => discardSession(session, bike);
}

// ── SESSION CARD (history) ────────────────────────────────

function buildSessionCard(session, bike) {
  const card = document.createElement('div');
  card.className = 'test-session-card';

  const date = session.createdAt?.toDate
    ? session.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : session.createdAt
      ? new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Unknown date';

  const adopted = session.adopted;

  card.innerHTML = `
    <div class="test-session-header">
      <div>
        <div class="test-session-name">${escHtml(session.name)}</div>
        <div class="test-session-meta">
          <span>${date}</span>
          ${session.trail ? `<span>· ${escHtml(session.trail)}</span>` : ''}
          ${session.conditions ? `<span>· ${escHtml(session.conditions)}</span>` : ''}
          <span class="test-session-badge ${adopted ? 'adopted' : 'pending'}">${adopted ? 'Adopted' : 'Not Adopted'}</span>
        </div>
      </div>
      <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;transition:transform .2s;color:var(--text-muted)">
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="test-session-body">
      ${buildDeltaTable(bike, session)}
      ${session.notes ? `<div class="test-notes">${escHtml(session.notes)}</div>` : ''}
      <div class="test-session-actions">
        ${!adopted ? `<button class="btn-success btn-adopt-hist" data-id="${session.id}">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5L11 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Adopt as Baseline
        </button>` : ''}
        <button class="btn-danger btn-delete-sess" data-id="${session.id}">Delete</button>
      </div>
    </div>
  `;

  // Expand/collapse
  const header = card.querySelector('.test-session-header');
  const body   = card.querySelector('.test-session-body');
  const chev   = card.querySelector('.chevron');
  header.addEventListener('click', () => {
    const open = body.classList.toggle('open');
    chev.style.transform = open ? 'rotate(180deg)' : '';
  });

  const adoptBtn = card.querySelector('.btn-adopt-hist');
  if (adoptBtn) adoptBtn.onclick = (e) => { e.stopPropagation(); adoptSession(session, bike); };

  card.querySelector('.btn-delete-sess').onclick = (e) => {
    e.stopPropagation();
    confirmDeleteSession(session, bike);
  };

  return card;
}

function buildDeltaTable(bike, session) {
  const delta = computeDelta(bike.baseline || {}, session.testSettings || {});
  if (delta.length === 0) return '<p style="font-size:.82rem;color:var(--text-muted);margin-bottom:.75rem">No recorded setting differences.</p>';

  const rows = delta.map(r => `
    <tr>
      <td class="delta-param">${escHtml(r.param)}</td>
      <td class="delta-base">${escHtml(r.base)}</td>
      <td class="delta-test">${escHtml(r.test)}</td>
      <td class="delta-diff ${r.cssClass}">${escHtml(r.diff)}</td>
    </tr>
  `).join('');

  return `
    <table class="delta-table" style="margin-bottom:.75rem">
      <thead><tr><th>Parameter</th><th>Baseline</th><th>Test</th><th>Δ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── DELTA COMPUTATION ─────────────────────────────────────

function computeDelta(baseline, testSettings) {
  const rows = [];

  const checks = [
    { param: 'F Tire PSI',  base: baseline.frontTire?.psi,  test: testSettings.frontTire?.psi,  unit: 'psi' },
    { param: 'R Tire PSI',  base: baseline.rearTire?.psi,   test: testSettings.rearTire?.psi,   unit: 'psi' },
    { param: 'Fork PSI',    base: baseline.fork?.psi,       test: testSettings.fork?.psi,       unit: 'psi' },
    { param: 'Shock PSI',   base: baseline.shock?.psi,      test: testSettings.shock?.psi,      unit: 'psi' },
    // Fork damper rows — filtered by damperType
    ...(() => {
      const dt = baseline.fork?.damperType || '4way';
      const rows = [];
      if (dt !== 'none' && dt !== 'comp') rows.push({ param: dt==='single'?'Fork Rebound':'Fork LSR', base: baseline.fork?.lsr, test: testSettings.fork?.lsr, unit: 'clicks' });
      if (dt === '3way' || dt === '4way')  rows.push({ param: 'Fork HSR', base: baseline.fork?.hsr, test: testSettings.fork?.hsr, unit: 'clicks' });
      if (dt === 'comp' || dt === '2way' || dt === '3way' || dt === '4way') rows.push({ param: dt==='comp'?'Fork Compression':'Fork LSC', base: baseline.fork?.lsc, test: testSettings.fork?.lsc, unit: 'clicks' });
      if (dt === '4way') rows.push({ param: 'Fork HSC', base: baseline.fork?.hsc, test: testSettings.fork?.hsc, unit: 'clicks' });
      return rows;
    })(),
    // Shock damper rows — filtered by damperType
    ...(() => {
      const dt = baseline.shock?.damperType || '4way';
      const rows = [];
      if (dt !== 'none' && dt !== 'comp') rows.push({ param: dt==='single'?'Shock Rebound':'Shock LSR', base: baseline.shock?.lsr, test: testSettings.shock?.lsr, unit: 'clicks' });
      if (dt === '3way' || dt === '4way')  rows.push({ param: 'Shock HSR', base: baseline.shock?.hsr, test: testSettings.shock?.hsr, unit: 'clicks' });
      if (dt === 'comp' || dt === '2way' || dt === '3way' || dt === '4way') rows.push({ param: dt==='comp'?'Shock Compression':'Shock LSC', base: baseline.shock?.lsc, test: testSettings.shock?.lsc, unit: 'clicks' });
      if (dt === '4way') rows.push({ param: 'Shock HSC', base: baseline.shock?.hsc, test: testSettings.shock?.hsc, unit: 'clicks' });
      return rows;
    })(),
  ];

  checks.forEach(({ param, base, test, unit }) => {
    if (base == null && test == null) return;
    const baseNum = parseFloat(base);
    const testNum = parseFloat(test);

    if (!isNaN(baseNum) && !isNaN(testNum) && baseNum !== testNum) {
      const diff = testNum - baseNum;
      rows.push({
        param,
        base: `${baseNum} ${unit}`,
        test: `${testNum} ${unit}`,
        diff: diff > 0 ? `+${diff}` : `${diff}`,
        cssClass: diff > 0 ? 'positive' : 'negative',
      });
    }
  });

  return rows;
}

// ── NEW TEST MODAL ────────────────────────────────────────

function showNewTestModal(bike) {
  const body = `
    <div class="field-group">
      <label class="field-label" for="test-name">Session Name</label>
      <input id="test-name" class="field-input" type="text" placeholder="e.g. Whistler lower fork pressure">
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label" for="test-trail">Trail / Location</label>
        <input id="test-trail" class="field-input" type="text" placeholder="e.g. Hatcher Pass">
      </div>
      <div class="field-group">
        <label class="field-label" for="test-conditions">Conditions</label>
        <input id="test-conditions" class="field-input" type="text" placeholder="e.g. Wet loam, chunky">
      </div>
    </div>
    <div class="field-group">
      <label class="field-label" for="test-weather">Weather</label>
      <input id="test-weather" class="field-input" type="text" placeholder="e.g. 48°F, overcast">
    </div>

    <div class="divider"></div>
    <p style="font-size:.8rem;color:var(--text-secondary);margin-bottom:1rem">
      Enter only the settings you're changing. Everything else inherits from baseline.
    </p>

    ${testSettingsForm(bike.baseline || {})}

    <div class="field-group" style="margin-top:1rem">
      <label class="field-label" for="test-notes">Notes</label>
      <textarea id="test-notes" class="field-input" rows="3" placeholder="Observations, feel, what to try next..."></textarea>
    </div>
  `;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-start-test">Start Session</button>
  `;

  openModal('New Test Session', body, footer);

  // Bind spinners via delegation — works after innerHTML is set
  document.getElementById('modal-body').addEventListener('click', function spinHandler(e) {
    const btn = e.target.closest('.spinner-btn');
    if (!btn) return;
    const inp = document.getElementById(btn.dataset.id);
    if (!inp) return;
    const step = parseFloat(btn.dataset.step || 1);
    const min  = parseFloat(btn.dataset.min ?? 0);
    const max  = parseFloat(btn.dataset.max ?? 9999);
    const cur  = parseFloat(inp.value) || 0;
    inp.value = btn.classList.contains('spinner-minus')
      ? Math.max(min, parseFloat((cur - step).toFixed(3)))
      : Math.min(max, parseFloat((cur + step).toFixed(3)));
  });

  // Range live update
  document.querySelectorAll('#modal-body input[type="range"]').forEach(r => {
    const valEl = document.querySelector(`#val-${r.id}`);
    r.addEventListener('input', () => { if (valEl) valEl.textContent = r.value; });
  });

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-start-test').onclick = async () => {
    const name = document.getElementById('test-name').value.trim();
    if (!name) { showToast('Give this session a name', 'error'); return; }

    const testSettings = collectTestSettings(bike.baseline || {});

    try {
      await createTestSession(bike.id, {
        name,
        trail:       document.getElementById('test-trail').value.trim(),
        conditions:  document.getElementById('test-conditions').value.trim(),
        weather:     document.getElementById('test-weather').value.trim(),
        notes:       document.getElementById('test-notes').value.trim(),
        testSettings,
        baselineSnapshot: bike.baseline || {},
        isActive: true,
      });
      showToast('Test session started', 'success');
      closeModal();
      renderTestingTab(bike);
    } catch (e) {
      showToast('Failed to create session: ' + e.message, 'error');
    }
  };
}

function testSettingsForm(baseline) {
  const bl = baseline;
  const fk = bl.fork  || {};
  const sk = bl.shock || {};
  const ft = bl.frontTire || {};
  const rt = bl.rearTire  || {};

  const spinnerField = (label, id, min, max, step, val, unit = '') => `
    <div class="field-group">
      <label class="field-label">${label}${unit ? ' <span class="field-unit">'+unit+'</span>' : ''}</label>
      <div class="spinner-row">
        <button type="button" class="spinner-btn spinner-minus" data-id="${id}" data-step="${step}" data-min="${min}" data-max="${max}">−</button>
        <input type="number" id="${id}" class="field-input spinner-input" value="${val ?? 0}" min="${min}" max="${max}" step="${step}">
        <button type="button" class="spinner-btn spinner-plus" data-id="${id}" data-step="${step}" data-min="${min}" data-max="${max}">+</button>
      </div>
    </div>
  `;

  // Helper: render damper fields respecting damperType setting
  const damperFields = (prefix, data) => {
    const dt = data.damperType || '4way';
    const showLSR = dt !== 'none' && dt !== 'comp';
    const showHSR = dt === '3way' || dt === '4way';
    const showLSC = dt === 'comp' || dt === '2way' || dt === '3way' || dt === '4way';
    const showHSC = dt === '4way';
    let html = '';
    if (showLSR) html += spinnerField(dt==='single'?'Rebound':'LSR', prefix+'-lsr', 0, 40, 1, data.lsr ?? 10, 'clicks');
    if (showHSR) html += spinnerField('HSR', prefix+'-hsr', 0, 40, 1, data.hsr ?? 5, 'clicks');
    if (showLSC) html += spinnerField(dt==='comp'?'Compression':'LSC', prefix+'-lsc', 0, 40, 1, data.lsc ?? 8, 'clicks');
    if (showHSC) html += spinnerField('HSC', prefix+'-hsc', 0, 40, 1, data.hsc ?? 4, 'clicks');
    return html;
  };

  return `
    <div class="settings-section-divider">Tire Pressure</div>
    <div class="field-row">
      ${spinnerField('Front PSI', 'ts-ft-psi', 10, 160, 1, ft.psi ?? 25, 'psi')}
      ${spinnerField('Rear PSI',  'ts-rt-psi', 10, 160, 1,   rt.psi ?? 25, 'psi')}
    </div>

    ${fk.brand ? `
    <div class="settings-section-divider">Fork</div>
    ${fk.type !== 'coil' ? spinnerField('Air Pressure', 'ts-fk-psi', 20, 350, 1, fk.psi ?? 80, 'psi') : ''}
    <div class="field-row">
      ${damperFields('ts-fk', fk)}
    </div>` : ''}

    ${sk.brand ? `
    <div class="settings-section-divider">Rear Shock</div>
    ${sk.type !== 'coil' ? spinnerField('Air Pressure', 'ts-sk-psi', 20, 350, 1, sk.psi ?? 140, 'psi') : ''}
    <div class="field-row">
      ${damperFields('ts-sk', sk)}
    </div>` : ''}
  `;
}

function collectTestSettings(baseline) {
  const num = id => { const el = document.getElementById(id); return el ? parseFloat(el.value) : null; };
  const fk = baseline.fork  || {};
  const sk = baseline.shock || {};

  const numIfPresent = id => {
    const el = document.getElementById(id);
    return el && el.type !== 'hidden' ? parseFloat(el.value) : null;
  };
  return {
    frontTire: { ...baseline.frontTire, psi: num('ts-ft-psi') },
    rearTire:  { ...baseline.rearTire,  psi: num('ts-rt-psi') },
    fork:  fk.brand ? { ...fk,
      psi: num('ts-fk-psi'),
      lsr: numIfPresent('ts-fk-lsr'),
      hsr: numIfPresent('ts-fk-hsr'),
      lsc: numIfPresent('ts-fk-lsc'),
      hsc: numIfPresent('ts-fk-hsc'),
    } : null,
    shock: sk.brand ? { ...sk,
      psi: num('ts-sk-psi'),
      lsr: numIfPresent('ts-sk-lsr'),
      hsr: numIfPresent('ts-sk-hsr'),
      lsc: numIfPresent('ts-sk-lsc'),
      hsc: numIfPresent('ts-sk-hsc'),
    } : null,
  };
}

// ── ADOPT / DISCARD ───────────────────────────────────────

async function adoptSession(session, bike) {
  if (!confirm(`Adopt "${session.name}" settings as your new baseline? This overwrites the current baseline.`)) return;
  try {
    const newBaseline = mergeTestIntoBaseline(bike.baseline || {}, session.testSettings || {});
    await updateBike(bike.id, { baseline: newBaseline });
    await updateTestSession(bike.id, session.id, { adopted: true, isActive: false });
    bike.baseline = newBaseline;
    showToast('Baseline updated', 'success');
    renderTestingTab(bike);
  } catch (e) {
    showToast('Failed to adopt: ' + e.message, 'error');
  }
}

async function discardSession(session, bike) {
  if (!confirm('Discard this session? It will be kept in history but marked inactive.')) return;
  try {
    await updateTestSession(bike.id, session.id, { isActive: false });
    showToast('Session discarded', 'info');
    renderTestingTab(bike);
  } catch (e) {
    showToast('Failed: ' + e.message, 'error');
  }
}

async function confirmDeleteSession(session, bike) {
  if (!confirm(`Permanently delete "${session.name}"?`)) return;
  try {
    await deleteTestSession(bike.id, session.id);
    showToast('Session deleted', 'success');
    renderTestingTab(bike);
  } catch (e) {
    showToast('Delete failed', 'error');
  }
}

function mergeTestIntoBaseline(baseline, testSettings) {
  const merged = { ...baseline };
  if (testSettings.frontTire) merged.frontTire = { ...(baseline.frontTire || {}), ...testSettings.frontTire };
  if (testSettings.rearTire)  merged.rearTire  = { ...(baseline.rearTire  || {}), ...testSettings.rearTire  };
  if (testSettings.fork)      merged.fork       = { ...(baseline.fork      || {}), ...testSettings.fork       };
  if (testSettings.shock)     merged.shock      = { ...(baseline.shock     || {}), ...testSettings.shock      };
  return merged;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
