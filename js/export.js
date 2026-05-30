import { getComponents, getTestSessions } from './db.js';
import { showToast } from './utils.js';

// ── THEME COLOR MAP ────────────────────────────────────────
// Resolved hex values per theme (can't use CSS vars in jsPDF)
const THEME_PALETTES = {
  dark:    { bg: '#141210', surface: '#1c1916', accent: '#f59e0b', text: '#f5f0e8', muted: '#504840', border: '#3d3828' },
  teal:    { bg: '#070c10', surface: '#131f2e', accent: '#00d4b8', text: '#e8f4f8', muted: '#3a6070', border: '#2a4060' },
  carbon:  { bg: '#0a0a0a', surface: '#141414', accent: '#e0ff4f', text: '#ffffff', muted: '#787878', border: '#303030' },
  slate:   { bg: '#0b0d14', surface: '#171c2c', accent: '#818cf8', text: '#e8eaf6', muted: '#404870', border: '#313b55' },
  forest:  { bg: '#080e09', surface: '#0e1a10', accent: '#4ade80', text: '#d8edd6', muted: '#3a6038', border: '#1e3323' },
  orange:  { bg: '#0e0804', surface: '#1a1008', accent: '#f97316', text: '#f5ece0', muted: '#6a4428', border: '#3a2010' },
  glacier: { bg: '#050c12', surface: '#0a1822', accent: '#38bdf8', text: '#dceeff', muted: '#2a5070', border: '#1a3048' },
  rose:    { bg: '#120a0c', surface: '#1e1014', accent: '#f472b6', text: '#f5e0e8', muted: '#6a3850', border: '#3c2030' },
  light:   { bg: '#f4f6f8', surface: '#ffffff', accent: '#2563eb', text: '#0d1117', muted: '#8896aa', border: '#dde1e8' },
};

function hex2rgb(hex) {
  const h = hex.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function getThemePalette() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  return THEME_PALETTES[theme] || THEME_PALETTES.dark;
}


// Returns array of [label, value] pairs for damper fields, respecting damperType
function getDamperFields(comp, prefix = '') {
  if (!comp) return [];
  const dt = comp.damperType || '4way';
  if (dt === 'none') return [];
  const showLSR = dt !== 'comp';
  const showHSR = dt === '3way' || dt === '4way';
  const showLSC = dt === 'comp' || dt === '2way' || dt === '3way' || dt === '4way';
  const showHSC = dt === '4way';
  const lbl = (name) => prefix ? `${prefix} ${name}` : name;
  const fields = [];
  if (showLSR && comp.lsr != null) fields.push([lbl(dt==='single'?'Rebound':'LSR'), `${comp.lsr} clicks`]);
  if (showHSR && comp.hsr != null) fields.push([lbl('HSR'), `${comp.hsr} clicks`]);
  if (showLSC && comp.lsc != null) fields.push([lbl(dt==='comp'?'Compression':'LSC'), `${comp.lsc} clicks`]);
  if (showHSC && comp.hsc != null) fields.push([lbl('HSC'), `${comp.hsc} clicks`]);
  return fields;
}
// ── TEXT SUMMARY (clipboard) ───────────────────────────────
export function copySetupSummary(bike) {
  const bl = bike.baseline || {};
  const lines = [];

  lines.push(`\uD83D\uDEB2 ${bike.name}`);
  if (bike.type) lines.push(`Type: ${bike.type.toUpperCase()}`);
  lines.push('');

  const section = (title, fields) => {
    const filled = fields.filter(([,v]) => v);
    if (!filled.length) return;
    lines.push(`\u2500\u2500 ${title} \u2500\u2500`);
    filled.forEach(([k,v]) => lines.push(`${k}: ${v}`));
    lines.push('');
  };

  const fr = bl.frame || {};
  section('Frame', [['Brand / Model', [fr.brand, fr.model].filter(Boolean).join(' ')], ['Size', fr.size], ['Year', fr.year]]);

  const fk = bl.fork || {};
  if (fk.brand || fk.travel) section('Fork', [
    ['Brand / Model', [fk.brand, fk.model].filter(Boolean).join(' ')],
    ['Travel', fk.travel], ['Offset', fk.offset],
    ['Air Pressure', fk.psi ? `${fk.psi} psi` : null],
    ...getDamperFields(fk),
  ]);

  const sk = bl.shock || {};
  if (sk.brand || sk.psi) section('Rear Shock', [
    ['Brand / Model', [sk.brand, sk.model].filter(Boolean).join(' ')],
    ['Air Pressure', sk.psi ? `${sk.psi} psi` : null],
    ...getDamperFields(sk),
  ]);

  const ft = bl.frontTire || {}, rt = bl.rearTire || {};
  if (ft.brand || ft.psi || rt.brand || rt.psi) {
    lines.push('\u2500\u2500 Tires \u2500\u2500');
    if (ft.brand || ft.psi) lines.push(`Front: ${[ft.brand, ft.model, ft.size].filter(Boolean).join(' ')}${ft.psi ? ` @ ${ft.psi} psi` : ''}`);
    if (rt.brand || rt.psi) lines.push(`Rear:  ${[rt.brand, rt.model, rt.size].filter(Boolean).join(' ')}${rt.psi ? ` @ ${rt.psi} psi` : ''}`);
    lines.push('');
  }

  const hb = bl.handlebar || {}, st = bl.stem || {};
  if (hb.brand || st.brand) section('Cockpit', [
    ['Bars', [hb.brand, hb.model].filter(Boolean).join(' ')],
    ['Width', hb.width], ['Rise', hb.rise],
    ['Stem', [st.brand, st.model, st.length].filter(Boolean).join(' ')],
  ]);

  const dt = bl.drivetrain || {};
  if (dt.brand || dt.model) section('Drivetrain', [
    ['Brand / Group', [dt.brand, dt.model].filter(Boolean).join(' ')],
    ['Cassette', dt.cassette], ['Chainring', dt.chainring],
  ]);

  const dp = bl.dropper || {};
  if (dp.brand) section('Post', [
    ['Brand / Model', [dp.brand, dp.model].filter(Boolean).join(' ')],
    ['Travel', dp.travel], ['Diameter', dp.diameter],
  ]);

  lines.push(`Generated by Quiver \u2014 ${new Date().toLocaleDateString()}`);

  const text = lines.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    showToast('Setup copied to clipboard', 'success');
  }).catch(() => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem';
    modal.innerHTML = `<div style="background:var(--bg-surface);border-radius:12px;padding:1.5rem;max-width:500px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:.75rem">
      <div style="font-family:var(--font-display);font-weight:700;font-size:.9rem;letter-spacing:.05em">Copy Setup Summary</div>
      <textarea style="flex:1;min-height:240px;font-family:var(--font-mono);font-size:.78rem;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:.75rem;color:var(--text-primary);resize:none" readonly>${text}</textarea>
      <button onclick="this.closest('div[style]').remove()" style="align-self:flex-end;padding:.4rem 1rem;background:var(--accent);color:#000;border:none;border-radius:6px;font-weight:700;cursor:pointer">Done</button>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('textarea').select();
  });
}

// ── PDF EXPORT ─────────────────────────────────────────────
export async function exportBikePDF(bike) {
  showToast('Generating PDF…', 'info');

  // Load jsPDF
  let jsPDF;
  try {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; document.head.appendChild(script); });
    }
    jsPDF = window.jspdf.jsPDF;
  } catch(e) { showToast('Failed to load PDF library', 'error'); return; }

  const [components, sessions] = await Promise.all([
    getComponents(bike.id).catch(() => []),
    getTestSessions(bike.id).catch(() => []),
  ]);

  // ── Theme-aware colors ────────────────────────────────────
  // Strategy: page body always white/near-black for readability.
  // Accent color provides theme personality on headers, bars, key values.
  const pal    = getThemePalette();
  const isLight = (document.documentElement.getAttribute('data-theme') || 'dark') === 'light';

  const C_ACCENT     = hex2rgb(pal.accent);
  const C_COVER_BG   = hex2rgb(pal.bg);      // dark bg for cover header only
  const C_COVER_TEXT = isLight ? [25, 20, 16] : [245, 242, 238]; // cover text

  // Body pages: always high-contrast for readability
  const C_PAGE_BG   = [255, 255, 255];        // white page
  const C_TEXT      = [20, 18, 16];           // near-black body text
  const C_MUTED     = [100, 95, 90];          // medium grey labels
  const C_SUBTLE    = [150, 145, 140];        // lighter metadata
  const C_BORDER    = [220, 215, 208];        // light rule lines
  const C_SURFACE   = [248, 246, 243];        // off-white section bg

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, ML = 18, MR = 18, TW = W - ML - MR;
  let y = 0;
  let pageNum = 1;

  // ── Core helpers ──────────────────────────────────────────
  const checkPage = (needed = 10) => {
    if (y + needed > 274) { doc.addPage(); y = 20; }
  };

  const txt = (str, x, yy, opts = {}) => {
    doc.setFontSize(opts.size || 9.5);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setTextColor(...(opts.color || C_TEXT));
    doc.text(String(str ?? ''), x, yy, opts.align ? { align: opts.align } : undefined);
  };

  const hRule = (yy, color = C_BORDER, w = 0.2) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(w);
    doc.line(ML, yy, W - MR, yy);
  };

  // Section header: left accent bar + uppercase label
  const sectionHeader = (title) => {
    checkPage(16);
    y += 7;
    // Light off-white background strip
    doc.setFillColor(...C_SURFACE);
    doc.rect(ML - 2, y - 4.5, TW + 4, 9.5, 'F');
    // Left accent bar — theme color
    doc.setFillColor(...C_ACCENT);
    doc.rect(ML - 2, y - 4.5, 3, 9.5, 'F');
    // Title in accent color on light background
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C_ACCENT);
    doc.text(title.toUpperCase(), ML + 4, y + 1.5);
    y += 11;
  };

  // Key-value row — two columns
  const kv = (key, val, opts = {}) => {
    if (val == null || val === '') return;
    checkPage(7);
    // Key: medium grey, readable on white
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C_MUTED);
    doc.text(String(key), ML + (opts.indent || 0), y);
    // Value: near-black, strong
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C_TEXT);
    const valX = ML + TW * 0.44;
    doc.text(String(val), valX, y, { maxWidth: TW * 0.56 });
    y += 6;
  };

  // Pressure chip — colored accent value
  const kvPressure = (key, val) => {
    if (val == null) return;
    checkPage(7);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C_MUTED);
    doc.text(String(key), ML, y);
    // Accent-colored value
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C_ACCENT);
    doc.text(String(val), ML + TW * 0.44, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C_TEXT);
    y += 6;
  };

  // ── COVER HEADER ──────────────────────────────────────────
  const HEADER_H = 48;
  doc.setFillColor(...C_COVER_BG);
  doc.rect(0, 0, W, HEADER_H, 'F');

  // Accent left bar
  doc.setFillColor(...C_ACCENT);
  doc.rect(0, 0, 4, HEADER_H, 'F');

  // Bike name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C_COVER_TEXT);
  doc.text(bike.name || 'Untitled Bike', ML + 4, 22);

  // Bike type badge
  const typeLabel = (bike.type || 'MTB').toUpperCase();
  const suspLabel = bike.suspensionType === 'hardtail' ? 'HARDTAIL' : '';
  const badgeText = [typeLabel, suspLabel].filter(Boolean).join(' · ');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C_ACCENT);
  doc.text(badgeText, ML + 4, 31);

  // Date + Quiver branding (right-aligned)
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C_MUTED);
  doc.text(`QUIVER`, W - MR, 20, { align: 'right' });
  doc.text(`Setup Export — ${today}`, W - MR, 27, { align: 'right' });

  // Thin accent rule below header
  doc.setDrawColor(...C_ACCENT);
  doc.setLineWidth(0.5);
  doc.line(0, HEADER_H, W, HEADER_H);

  y = HEADER_H + 12;

  // ── FRAME ─────────────────────────────────────────────────
  const fr = bike.baseline?.frame || {};
  if (fr.brand || fr.model || fr.size) {
    sectionHeader('Frame & Geometry');
    [['Brand', fr.brand], ['Model', fr.model], ['Year', fr.year],
     ['Size', fr.size], ['Material', fr.material], ['Color', fr.color]]
      .filter(([,v]) => v).forEach(([k,v]) => kv(k, v));
    if (fr.notes) kv('Notes', fr.notes);
  }

  // ── SUSPENSION ────────────────────────────────────────────
  const fk = bike.baseline?.fork || {};
  if (fk.brand) {
    sectionHeader('Fork');
    kv('Brand / Model', [fk.brand, fk.model].filter(Boolean).join(' '));
    kv('Travel', fk.travel); kv('Offset', fk.offset);
    kv('Spring Type', fk.type || 'Air');
    if (fk.type !== 'coil') {
      kvPressure('Air Pressure', fk.psi ? `${fk.psi} psi` : null);
      kv('Volume Tokens', fk.tokens != null ? `${fk.tokens}` : null);
    } else {
      kv('Spring Rate', fk.springRate); kv('Spring Brand', fk.springBrand);
    }
    getDamperFields(fk, 'Fork').forEach(([k,v]) => kv(k, v));
    if (fk.notes) kv('Notes', fk.notes);
  }

  const sk = bike.baseline?.shock || {};
  if (sk.brand) {
    sectionHeader('Rear Shock');
    kv('Brand / Model', [sk.brand, sk.model].filter(Boolean).join(' '));
    kv('Stroke', sk.stroke); kv('Eye-to-Eye', sk.eye);
    kv('Spring Type', sk.type || 'Air');
    if (sk.type !== 'coil') {
      kvPressure('Air Pressure', sk.psi ? `${sk.psi} psi` : null);
      kv('Volume Tokens', sk.tokens != null ? `${sk.tokens}` : null);
    } else {
      kv('Spring Rate', sk.springRate); kv('Spring Brand', sk.springBrand);
    }
    getDamperFields(sk, 'Shock').forEach(([k,v]) => kv(k, v));
    if (sk.notes) kv('Notes', sk.notes);
  }

  // ── TIRES ─────────────────────────────────────────────────
  const ft = bike.baseline?.frontTire || {};
  const rt = bike.baseline?.rearTire  || {};
  if (ft.brand || ft.psi || rt.brand || rt.psi) {
    sectionHeader('Wheels & Tires');
    if (ft.brand || ft.psi) {
      checkPage(6);
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...C_SUBTLE);
      doc.text('FRONT', ML, y); y += 5;
      kv('Brand / Model', [ft.brand, ft.model].filter(Boolean).join(' '));
      kv('Size / Width', ft.size); kv('Compound', ft.compound); kv('Casing', ft.casing); kv('Inserts', ft.inserts);
      kvPressure('Pressure', ft.psi ? `${ft.psi} psi` : null);
    }
    if (rt.brand || rt.psi) {
      checkPage(6);
      y += 2;
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...C_SUBTLE);
      doc.text('REAR', ML, y); y += 5;
      kv('Brand / Model', [rt.brand, rt.model].filter(Boolean).join(' '));
      kv('Size / Width', rt.size); kv('Compound', rt.compound); kv('Casing', rt.casing); kv('Inserts', rt.inserts);
      kvPressure('Pressure', rt.psi ? `${rt.psi} psi` : null);
    }
  }

  // ── COCKPIT ───────────────────────────────────────────────
  const hb = bike.baseline?.handlebar || {};
  const st = bike.baseline?.stem      || {};
  if (hb.brand || st.brand) {
    sectionHeader('Cockpit');
    if (hb.brand) {
      kv('Handlebar', [hb.brand, hb.model].filter(Boolean).join(' '));
      kv('Width', hb.width); kv('Rise', hb.rise); kv('Sweep', hb.sweep);
    }
    if (st.brand) {
      kv('Stem', [st.brand, st.model].filter(Boolean).join(' '));
      kv('Length', st.length); kv('Clamp', st.clamp);
    }
  }

  // ── DRIVETRAIN & POST ─────────────────────────────────────
  const dt2 = bike.baseline?.drivetrain || {};
  if (dt2.brand) {
    sectionHeader('Drivetrain');
    kv('Brand / Group', [dt2.brand, dt2.model].filter(Boolean).join(' '));
    kv('Cassette', dt2.cassette); kv('Chainring', dt2.chainring);
    kv('Chain', dt2.chain); kv('Rear Derailleur', dt2.rd);
  }

  const dp = bike.baseline?.dropper || {};
  if (dp.brand) {
    sectionHeader('Dropper Post');
    kv('Brand / Model', [dp.brand, dp.model].filter(Boolean).join(' '));
    kv('Travel', dp.travel); kv('Diameter', dp.diameter);
  }

  // ── COMPONENTS ────────────────────────────────────────────
  if (components.length > 0) {
    sectionHeader(`Components (${components.length})`);
    const grouped = {};
    components.forEach(c => {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    });
    Object.keys(grouped).sort().forEach(cat => {
      grouped[cat].forEach(c => {
        kv(c.category, [c.brand, c.model].filter(Boolean).join(' ') || '—');
      });
    });
  }

  // ── FOOTER ────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Thin accent rule above footer
    doc.setDrawColor(...C_ACCENT);
    doc.setLineWidth(0.5);
    doc.line(ML, 284, W - MR, 284);
    // Footer text — subtle grey on white
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C_SUBTLE);
    doc.text(`QUIVER — ${bike.name || 'Bike Setup'}`, ML, 289);
    doc.text(`${i} / ${pageCount}`, W - MR, 289, { align: 'right' });
  }

  const filename = `quiver-${(bike.name || 'bike').toLowerCase().replace(/\s+/g,'-')}-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  showToast('PDF exported', 'success');
}
