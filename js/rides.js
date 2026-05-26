import { getRides, createRide, updateRide, deleteRide } from './db.js';
import { showToast, openModal, closeModal } from './app.js';

// ── ENTRY POINT ───────────────────────────────────────────
export async function renderRidesTab(bike) {
  const container = document.getElementById('tab-rides');
  if (!container) return;
  container.innerHTML = `<div class="rides-loading"><span>Loading rides…</span></div>`;
  try {
    const rides = await getRides(bike.id);
    renderRidesList(container, rides, bike);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><p>Failed to load rides: ${e.message}</p></div>`;
  }
}

// ── LIST VIEW ─────────────────────────────────────────────
function renderRidesList(container, rides, bike) {
  const routes = [...new Set(rides.map(r => r.routeName).filter(Boolean))].sort();

  container.innerHTML = `
    <div class="rides-toolbar">
      <div style="display:flex;align-items:center;gap:.75rem">
        <h2 class="tab-section-title" style="margin:0">Rides</h2>
        ${routes.length > 1 ? `
        <select id="rides-route-filter" class="field-select" style="font-size:.78rem;padding:.3rem .6rem;width:auto">
          <option value="">All routes</option>
          ${routes.map(r => `<option value="${escHtml(r)}">${escHtml(r)}</option>`).join('')}
        </select>` : ''}
      </div>
      <div style="display:flex;gap:.5rem">
        ${rides.length >= 2 ? `<button class="btn-secondary" id="btn-compare-rides">Compare</button>` : ''}
        <button class="btn-primary" id="btn-new-ride">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          New Ride
        </button>
      </div>
    </div>
    <div id="rides-list-container"></div>`;

  renderFilteredList(rides, bike);

  document.getElementById('btn-new-ride').onclick = () => showNewRideModal(bike, rides, () => renderRidesTab(bike));
  const compareBtn = document.getElementById('btn-compare-rides');
  if (compareBtn) compareBtn.onclick = () => showCompareView(container, rides, bike);
  const filter = document.getElementById('rides-route-filter');
  if (filter) filter.onchange = () => renderFilteredList(
    filter.value ? rides.filter(r => r.routeName === filter.value) : rides, bike
  );
}

function renderFilteredList(rides, bike) {
  const el = document.getElementById('rides-list-container');
  if (!el) return;
  if (rides.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <h3>No rides logged yet</h3>
      <p>Log your first ride to start tracking performance</p>
    </div>`;
    return;
  }

  // Group by month
  const groups = {};
  rides.forEach(r => {
    const d = new Date(r.date + 'T00:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  el.innerHTML = Object.entries(groups).map(([month, monthRides]) => `
    <div class="rides-month-group">
      <div class="rides-month-header">${month}</div>
      ${monthRides.map(r => rideCard(r)).join('')}
    </div>`).join('');

  el.querySelectorAll('.ride-card').forEach(card => {
    const id = card.dataset.id;
    const ride = rides.find(r => r.id === id);
    card.querySelector('.ride-card-compare')?.addEventListener('click', e => {
      e.stopPropagation();
      showCompareView(container, rides, bike, id);
    });
    card.querySelector('.ride-card-delete')?.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Delete this ride?')) return;
      try {
        await deleteRide(bike.id, id);
        showToast('Ride deleted', 'success');
        renderRidesTab(bike);
      } catch(err) { showToast('Delete failed', 'error'); }
    });
  });
}

function rideCard(r) {
  const speed = r.avgSpeed ? `${r.avgSpeed.toFixed(1)} km/h` : '—';
  const dist  = r.distance ? `${r.distance.toFixed(1)} km` : '—';
  const elev  = r.elevationGain ? `${Math.round(r.elevationGain)}m ↑` : '—';
  const time  = r.elapsedTime  ? fmtTime(r.elapsedTime) : '—';
  const cond  = [r.conditions?.weather, r.conditions?.surface].filter(Boolean).join(' · ');
  return `
    <div class="ride-card" data-id="${r.id}">
      <div class="ride-card-main">
        <div class="ride-card-date">${fmtDate(r.date)}</div>
        <div class="ride-card-route">${escHtml(r.routeName || 'Unnamed route')}</div>
        <div class="ride-card-stats">
          <span class="ride-stat"><strong>${speed}</strong> avg</span>
          <span class="ride-stat-sep">·</span>
          <span class="ride-stat">${dist}</span>
          <span class="ride-stat-sep">·</span>
          <span class="ride-stat">${elev}</span>
          <span class="ride-stat-sep">·</span>
          <span class="ride-stat">${time}</span>
        </div>
        ${cond ? `<div class="ride-card-cond">${escHtml(cond)}</div>` : ''}
      </div>
      <button class="btn-icon-sm ride-card-compare" title="Compare with another ride" style="margin-right:.25rem">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M8 3.5l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="btn-icon-sm ride-card-delete" title="Delete ride">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 5v4M7.5 5v4M2.5 3l.6 6.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>`;
}

// ── NEW RIDE MODAL ────────────────────────────────────────
function showNewRideModal(bike, existingRides, onSaved) {
  const bl = bike.baseline || {};
  const routes = [...new Set(existingRides.map(r => r.routeName).filter(Boolean))];
  const today = new Date().toISOString().slice(0, 10);

  // Prefer most recent ride's settings as defaults (rider rarely changes all at once)
  // Fall back to baseline for any field not in prior ride
  const lastRide = existingRides.length > 0
    ? [...existingRides].sort((a,b) => b.date.localeCompare(a.date))[0]
    : null;
  const prev = lastRide?.settings || {};

  const settingVal = (rideKey, blVal) => {
    const v = prev[rideKey];
    return v != null ? v : (blVal || '');
  };

  const body = `
    <div class="ride-modal-tabs">
      <button class="ride-modal-tab active" data-mode="gpx">GPX Import</button>
      <button class="ride-modal-tab" data-mode="manual">Manual Entry</button>
    </div>

    <div id="ride-gpx-section">
      <div class="gpx-drop-zone" id="gpx-drop-zone">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4v16M10 14l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 24h20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <p>Drop a <strong>.gpx</strong> file here, or <label class="gpx-browse-label" for="gpx-file-input">browse</label></p>
        <input type="file" id="gpx-file-input" accept=".gpx" style="display:none">
      </div>
      <div id="gpx-parsed-preview" class="gpx-preview hidden"></div>
    </div>

    <div class="field-row" style="margin-top:1rem">
      <div class="field-group">
        <label class="field-label">Route Name</label>
        <input id="ride-route" class="field-input" type="text" placeholder="e.g. Morning Loop"
               list="route-suggestions" value="">
        <datalist id="route-suggestions">
          ${routes.map(r => `<option value="${escHtml(r)}">`).join('')}
        </datalist>
      </div>
      <div class="field-group">
        <label class="field-label">Date</label>
        <input id="ride-date" class="field-input" type="date" value="${today}">
      </div>
    </div>

    <div id="ride-manual-section" class="hidden">
      <div class="settings-section-divider">Performance</div>
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Distance (km)</label>
          <input id="ride-distance" class="field-input" type="number" step="0.1" placeholder="42.0">
        </div>
        <div class="field-group">
          <label class="field-label">Elapsed Time</label>
          <input id="ride-time" class="field-input" type="text" placeholder="1:18:45">
        </div>
      </div>
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Elevation Gain (m)</label>
          <input id="ride-elev" class="field-input" type="number" placeholder="320">
        </div>
        <div class="field-group">
          <label class="field-label">Avg Heart Rate (optional)</label>
          <input id="ride-hr" class="field-input" type="number" placeholder="145">
        </div>
      </div>
    </div>

    <div class="settings-section-divider">Settings Used ${lastRide ? `<span style="font-weight:400;color:var(--text-muted);text-transform:none;letter-spacing:0;font-size:.75rem">— pre-filled from ${fmtDate(lastRide.date)}</span>` : ''}</div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Seat Height (mm)</label>
        <input id="rs-seatHeight" class="field-input" type="number" value="${settingVal('seatHeight', bl.seatHeight)}">
      </div>
      <div class="field-group">
        <label class="field-label">Stack / Spacers (mm)</label>
        <input id="rs-stackHeight" class="field-input" type="number" value="${settingVal('stackHeight', bl.headset?.stack)}">
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Crank Length (mm)</label>
        <input id="rs-crankLength" class="field-input" type="number" value="${settingVal('crankLength', bl.crankLength)}">
      </div>
      <div class="field-group">
        <label class="field-label">Seat Offset (mm)</label>
        <input id="rs-seatOffset" class="field-input" type="number" value="${settingVal('seatOffset', bl.seatpost?.setback)}">
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Reach (mm)</label>
        <input id="rs-reach" class="field-input" type="number" value="${settingVal('reach', bl.handlebar?.reach)}">
      </div>
      <div class="field-group"></div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Tire PSI — Front</label>
        <input id="rs-tirePsiF" class="field-input" type="number" step="0.5" value="${settingVal('tirePsiF', bl.frontTire?.psi)}">
      </div>
      <div class="field-group">
        <label class="field-label">Tire PSI — Rear</label>
        <input id="rs-tirePsiR" class="field-input" type="number" step="0.5" value="${settingVal('tirePsiR', bl.rearTire?.psi)}">
      </div>
    </div>

    <div class="settings-section-divider">Conditions</div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Temperature (°C)</label>
        <input id="rc-temp" class="field-input" type="number" placeholder="18">
      </div>
      <div class="field-group">
        <label class="field-label">Surface</label>
        <select id="rc-surface" class="field-select">
          <option value="">—</option>
          <option>Tarmac</option><option>Gravel</option><option>Mixed</option>
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Wind</label>
        <select id="rc-wind" class="field-select">
          <option value="">—</option>
          <option>None</option><option>Light</option><option>Moderate</option><option>Strong</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Wind Direction</label>
        <select id="rc-windDir" class="field-select">
          <option value="">—</option>
          <option>Headwind</option><option>Tailwind</option><option>Crosswind</option><option>Variable</option>
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Weather</label>
        <select id="rc-weather" class="field-select">
          <option value="">—</option>
          <option>Sunny</option><option>Cloudy</option><option>Overcast</option><option>Wet</option>
        </select>
      </div>
      <div class="field-group"></div>
    </div>

    <div class="field-group" style="margin-top:.75rem">
      <label class="field-label">Notes</label>
      <textarea id="ride-notes" class="field-input" rows="2" placeholder="How did it feel?"></textarea>
    </div>`;

  const footer = `
    <button class="btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn-primary" id="modal-save-ride">Save Ride</button>`;

  openModal('Log Ride', body, footer);

  // Tab switching
  let mode = 'gpx';
  document.querySelectorAll('.ride-modal-tab').forEach(btn => {
    btn.onclick = () => {
      mode = btn.dataset.mode;
      document.querySelectorAll('.ride-modal-tab').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('ride-gpx-section').classList.toggle('hidden', mode !== 'gpx');
      document.getElementById('ride-manual-section').classList.toggle('hidden', mode !== 'manual');
    };
  });

  // GPX drop zone
  let parsedGPX = null;
  const dropZone = document.getElementById('gpx-drop-zone');
  const fileInput = document.getElementById('gpx-file-input');

  const handleGPXFile = async file => {
    try {
      const text = await file.text();
      parsedGPX = parseGPX(text);
      showGPXPreview(parsedGPX);
      if (parsedGPX.date) document.getElementById('ride-date').value = parsedGPX.date;
    } catch(e) {
      showToast('Could not parse GPX file: ' + e.message, 'error');
    }
  };

  dropZone.ondragover = e => { e.preventDefault(); dropZone.classList.add('dragover'); };
  dropZone.ondragleave = () => dropZone.classList.remove('dragover');
  dropZone.ondrop = e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleGPXFile(file);
  };
  fileInput.onchange = () => { if (fileInput.files[0]) handleGPXFile(fileInput.files[0]); };

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save-ride').onclick = async () => {
    const route = document.getElementById('ride-route').value.trim();
    const date  = document.getElementById('ride-date').value;
    if (!route) { showToast('Enter a route name', 'error'); return; }
    if (!date)  { showToast('Pick a date', 'error'); return; }

    const numVal = id => {
      const v = document.getElementById(id)?.value;
      return v ? parseFloat(v) : null;
    };
    const selVal = id => document.getElementById(id)?.value || null;

    // Performance data from GPX or manual
    let perf = {};
    if (parsedGPX) {
      perf = {
        distance: parsedGPX.distance,
        elapsedTime: parsedGPX.elapsedTime,
        movingTime: parsedGPX.movingTime,
        avgSpeed: parsedGPX.avgSpeed,
        elevationGain: parsedGPX.elevationGain,
        avgHR: parsedGPX.avgHR || null,
        avgPower: parsedGPX.avgPower || null,
      };
    } else {
      const timeStr = document.getElementById('ride-time')?.value || '';
      perf = {
        distance: numVal('ride-distance'),
        elapsedTime: parseTimeStr(timeStr),
        elevationGain: numVal('ride-elev'),
        avgHR: numVal('ride-hr'),
      };
      if (perf.distance && perf.elapsedTime) {
        perf.avgSpeed = (perf.distance / (perf.elapsedTime / 3600));
      }
    }

    const ride = {
      routeName: route,
      date,
      ...perf,
      settings: {
        seatHeight:   numVal('rs-seatHeight'),
        stackHeight:  numVal('rs-stackHeight'),
        crankLength:  numVal('rs-crankLength'),
        seatOffset:   numVal('rs-seatOffset'),
        reach:        numVal('rs-reach'),
        tirePsiF:     numVal('rs-tirePsiF'),
        tirePsiR:     numVal('rs-tirePsiR'),
      },
      conditions: {
        temp:     numVal('rc-temp'),
        wind:     selVal('rc-wind'),
        windDir:  selVal('rc-windDir'),
        surface:  selVal('rc-surface'),
        weather:  selVal('rc-weather'),
      },
      notes: document.getElementById('ride-notes').value.trim(),
    };

    try {
      await createRide(bike.id, ride);
      showToast('Ride saved', 'success');
      closeModal();
      onSaved && onSaved();
    } catch(e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  };
}

function showGPXPreview(data) {
  const el = document.getElementById('gpx-parsed-preview');
  if (!el) return;
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="gpx-preview-stats">
      <div class="gpx-stat"><span class="gpx-stat-val">${data.avgSpeed?.toFixed(1) ?? '—'}</span><span class="gpx-stat-lbl">km/h avg</span></div>
      <div class="gpx-stat"><span class="gpx-stat-val">${data.distance?.toFixed(1) ?? '—'}</span><span class="gpx-stat-lbl">km</span></div>
      <div class="gpx-stat"><span class="gpx-stat-val">${data.elevationGain ? Math.round(data.elevationGain) : '—'}</span><span class="gpx-stat-lbl">m elev</span></div>
      <div class="gpx-stat"><span class="gpx-stat-val">${data.elapsedTime ? fmtTime(data.elapsedTime) : '—'}</span><span class="gpx-stat-lbl">time</span></div>
      ${data.avgHR ? `<div class="gpx-stat"><span class="gpx-stat-val">${Math.round(data.avgHR)}</span><span class="gpx-stat-lbl">bpm avg</span></div>` : ''}
    </div>
    <div class="gpx-parsed-label">✓ GPX parsed successfully</div>`;
  document.getElementById('gpx-drop-zone').style.display = 'none';
}

// ── COMPARE VIEW ──────────────────────────────────────────
function showCompareView(container, rides, bike, preselectedBaseId = null) {
  const sorted = [...rides].sort((a,b) => b.date.localeCompare(a.date));

  const rideOpts = sorted.map(r =>
    `<option value="${r.id}">${fmtDate(r.date)}${r.routeName ? ' — ' + escHtml(r.routeName) : ''} · ${r.avgSpeed?.toFixed(1) ?? '?'} km/h</option>`
  ).join('');

  container.innerHTML = `
    <div class="rides-toolbar">
      <button class="btn-secondary" id="btn-back-to-rides">← Rides</button>
      <h2 class="tab-section-title" style="margin:0">Compare Rides</h2>
      <div></div>
    </div>

    <div class="compare-setup" style="padding:1rem 2rem">
      <div class="compare-pickers" style="display:flex;align-items:flex-end;gap:1rem;flex-wrap:wrap">
        <div class="compare-picker">
          <label class="field-label">Base ride <span style="font-weight:400;color:var(--text-muted)">(reference)</span></label>
          <select id="cmp-base" class="field-select" style="min-width:260px">
            ${rideOpts}
          </select>
        </div>
        <div class="compare-vs">vs</div>
        <div class="compare-picker">
          <label class="field-label">Test ride <span style="font-weight:400;color:var(--text-muted)">(newer / different setup)</span></label>
          <select id="cmp-test" class="field-select" style="min-width:260px">
            ${rideOpts}
          </select>
        </div>
        <button class="btn-primary" id="btn-run-compare">Compare →</button>
      </div>
      <div id="cmp-error" style="font-size:.8rem;color:var(--danger);margin-top:.5rem;display:none">Pick two different rides to compare.</div>
    </div>

    <div id="compare-result"></div>`;

  // Default: base = oldest, test = most recent; or use preselected
  const baseEl = document.getElementById('cmp-base');
  const testEl = document.getElementById('cmp-test');
  if (sorted.length >= 2) {
    testEl.value = sorted[0].id;
    baseEl.value = preselectedBaseId || sorted[sorted.length - 1].id;
    // If preselected is the most recent, make it the test instead
    if (preselectedBaseId === sorted[0].id && sorted.length >= 2) {
      baseEl.value = sorted[1].id;
      testEl.value = preselectedBaseId;
    }
  }

  document.getElementById('btn-back-to-rides').onclick = () => renderRidesTab(bike);

  document.getElementById('btn-run-compare').onclick = () => {
    const baseId = baseEl.value;
    const testId = testEl.value;
    const errEl = document.getElementById('cmp-error');
    if (baseId === testId) { errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    const base = rides.find(r => r.id === baseId);
    const test = rides.find(r => r.id === testId);
    renderCompareResult(document.getElementById('compare-result'), base, test);
  };

  // Auto-run if two rides already selected
  if (sorted.length >= 2) {
    document.getElementById('btn-run-compare').click();
  }
}

function renderCompareResult(el, base, test) {
  const row = (label, baseVal, testVal, higherIsBetter = true, unit = '', isCond = false) => {
    const bNum = parseFloat(baseVal), tNum = parseFloat(testVal);
    const hasNums = !isNaN(bNum) && !isNaN(tNum);
    let deltaHtml = '', cls = '';
    if (hasNums) {
      const delta = tNum - bNum;
      const better = higherIsBetter ? delta > 0 : delta < 0;
      const worse  = higherIsBetter ? delta < 0 : delta > 0;
      const sign   = delta > 0 ? '+' : '';
      const fmtDelta = Number.isInteger(bNum) && Number.isInteger(tNum)
        ? `${sign}${delta}` : `${sign}${delta.toFixed(2)}`;
      cls = isCond ? '' : (better ? 'cmp-better' : worse ? 'cmp-worse' : '');
      const icon = isCond
        ? (delta !== 0 ? '<span class="cmp-cond-warn" title="Conditions differ">⚠️</span>' : '')
        : '';
      deltaHtml = delta !== 0
        ? `<span class="cmp-delta ${cls}">${fmtDelta}${unit}</span>${icon}`
        : `<span class="cmp-delta cmp-same">—</span>`;
    }
    const changed = hasNums && bNum !== tNum && !isCond;
    const settingHighlight = changed && !isCond && cls === '' ? 'cmp-setting-changed' : '';
    return `<tr class="${settingHighlight}">
      <td class="cmp-label">${label}</td>
      <td class="cmp-val">${baseVal != null ? `${baseVal}${unit}` : '—'}</td>
      <td class="cmp-val ${cls}">${testVal != null ? `${testVal}${unit}` : '—'}</td>
      <td class="cmp-delta-cell">${deltaHtml}</td>
    </tr>`;
  };

  const condRow = (label, bVal, tVal) => row(label, bVal, tVal, true, '', true);

  const fmtSpeed = v => v != null ? v.toFixed(1) : null;
  const fmtDist  = v => v != null ? v.toFixed(1) : null;
  const fmtElev  = v => v != null ? Math.round(v) : null;
  const fmtTime2 = v => v != null ? fmtTime(v) : null;

  el.innerHTML = `
    <div class="compare-result-wrap">
      <div class="compare-header-row">
        <div class="compare-header-label"></div>
        <div class="compare-header-val">
          <div class="cmp-ride-badge base-badge">Base</div>
          <div class="cmp-ride-date">${fmtDate(base.date)}</div>
        </div>
        <div class="compare-header-val">
          <div class="cmp-ride-badge test-badge">Test</div>
          <div class="cmp-ride-date">${fmtDate(test.date)}</div>
        </div>
        <div class="compare-header-delta">Delta</div>
      </div>

      <div class="cmp-section-title">Performance</div>
      <table class="cmp-table">
        ${row('Avg Speed', fmtSpeed(base.avgSpeed), fmtSpeed(test.avgSpeed), true, ' km/h')}
        ${row('Elapsed Time', fmtTime2(base.elapsedTime), fmtTime2(test.elapsedTime), false, '')}
        ${row('Distance', fmtDist(base.distance), fmtDist(test.distance), true, ' km')}
        ${row('Elevation Gain', fmtElev(base.elevationGain), fmtElev(test.elevationGain), true, 'm')}
        ${base.avgHR || test.avgHR ? row('Avg Heart Rate', base.avgHR, test.avgHR, false, ' bpm') : ''}
      </table>

      <div class="cmp-section-title">Settings</div>
      <table class="cmp-table">
        ${row('Seat Height', base.settings?.seatHeight, test.settings?.seatHeight, true, 'mm')}
        ${row('Stack / Spacers', base.settings?.stackHeight, test.settings?.stackHeight, true, 'mm')}
        ${row('Crank Length', base.settings?.crankLength, test.settings?.crankLength, true, 'mm')}
        ${row('Seat Offset', base.settings?.seatOffset, test.settings?.seatOffset, true, 'mm')}
        ${row('Reach', base.settings?.reach, test.settings?.reach, true, 'mm')}
        ${row('Tire PSI Front', base.settings?.tirePsiF, test.settings?.tirePsiF, true, ' psi')}
        ${row('Tire PSI Rear', base.settings?.tirePsiR, test.settings?.tirePsiR, true, ' psi')}
      </table>

      <div class="cmp-section-title">Conditions <span style="font-size:.72rem;font-weight:400;color:var(--text-muted)">(⚠️ = differs between rides)</span></div>
      <table class="cmp-table">
        ${condRow('Temperature', base.conditions?.temp != null ? base.conditions.temp + '°C' : null, test.conditions?.temp != null ? test.conditions.temp + '°C' : null)}
        ${condRow('Wind', base.conditions?.wind, test.conditions?.wind)}
        ${condRow('Wind Direction', base.conditions?.windDir, test.conditions?.windDir)}
        ${condRow('Surface', base.conditions?.surface, test.conditions?.surface)}
        ${condRow('Weather', base.conditions?.weather, test.conditions?.weather)}
      </table>

      ${(base.notes || test.notes) ? `
      <div class="cmp-section-title">Notes</div>
      <div class="cmp-notes-row">
        <div class="cmp-note">${escHtml(base.notes || '—')}</div>
        <div class="cmp-note">${escHtml(test.notes || '—')}</div>
      </div>` : ''}
    </div>`;
}

// ── GPX PARSER ────────────────────────────────────────────
function parseGPX(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const pts = [...doc.querySelectorAll('trkpt')];
  if (!pts.length) throw new Error('No track points found in GPX');

  let dist = 0, elevGain = 0, prevEle = null;
  let sumHR = 0, hrCount = 0;
  let sumPwr = 0, pwrCount = 0;
  let prevLat = null, prevLon = null;

  const times = pts.map(p => p.querySelector('time')?.textContent).filter(Boolean);
  const startTime = times[0]  ? new Date(times[0])  : null;
  const endTime   = times[times.length-1] ? new Date(times[times.length-1]) : null;
  const elapsedTime = (startTime && endTime) ? (endTime - startTime) / 1000 : null;

  // Extract date from first point
  const date = startTime ? startTime.toISOString().slice(0,10) : null;

  pts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat'));
    const lon = parseFloat(pt.getAttribute('lon'));
    const ele = parseFloat(pt.querySelector('ele')?.textContent ?? 'NaN');
    const hr  = parseFloat(pt.querySelector('hr,gpxtpx\\:hr')?.textContent ?? 'NaN');
    const pwr = parseFloat(pt.querySelector('power,gpxtpx\\:power')?.textContent ?? 'NaN');

    if (prevLat !== null) dist += haversine(prevLat, prevLon, lat, lon);
    if (!isNaN(ele) && prevEle !== null && ele > prevEle) elevGain += (ele - prevEle);

    prevLat = lat; prevLon = lon; prevEle = isNaN(ele) ? prevEle : ele;
    if (!isNaN(hr))  { sumHR  += hr;  hrCount++;  }
    if (!isNaN(pwr)) { sumPwr += pwr; pwrCount++; }
  });

  const distKm = dist / 1000;
  return {
    date,
    distance: distKm,
    elevationGain: elevGain,
    elapsedTime,
    movingTime: elapsedTime, // GPX doesn't distinguish moving vs elapsed
    avgSpeed: elapsedTime ? distKm / (elapsedTime / 3600) : null,
    avgHR:    hrCount  ? sumHR  / hrCount  : null,
    avgPower: pwrCount ? sumPwr / pwrCount : null,
  };
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── HELPERS ───────────────────────────────────────────────
function fmtTime(secs) {
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = Math.round(secs%60);
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
               : `${m}:${String(s).padStart(2,'0')}`;
}

function parseTimeStr(str) {
  if (!str) return null;
  const p = str.split(':').map(Number);
  if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
  if (p.length === 2) return p[0]*60 + p[1];
  return null;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
