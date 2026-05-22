// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams with zone interaction
// Geometry modeled on modern enduro/trail MTB proportions
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

// Zone definitions: viewBox target for zoom, label, key
const ZONE_META = {
  'front-wheel':  { label: 'Front Wheel / Tire', vb: [452, 185, 290, 290], key: 'frontTire' },
  'rear-wheel':   { label: 'Rear Wheel / Tire',  vb: [12,  185, 290, 290], key: 'rearTire' },
  'fork':         { label: 'Fork',               vb: [462, 118, 235, 258], key: 'fork' },
  'shock':        { label: 'Rear Shock',         vb: [288, 165, 230, 208], key: 'shock' },
  'handlebar':    { label: 'Cockpit / Bars',     vb: [415,  42, 205, 178], key: 'handlebar' },
  'drivetrain':   { label: 'Drivetrain',         vb: [288, 298, 218, 178], key: 'drivetrain' },
  'dropper':      { label: 'Dropper / Saddle',   vb: [210,  68, 205, 215], key: 'dropper' },
  'frame':        { label: 'Frame / Geometry',   vb: [108,  88, 468, 318], key: 'frame' },
};

// ── WHEEL HELPER ──────────────────────────────────────────
function wheelSpokes(cx, cy, r, count = 8) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * (r - 26);
    const y2 = cy + Math.sin(a) * (r - 26);
    s += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="1.2" opacity="0.35"/>`;
  }
  return s;
}

// Fat MTB wheel (29")
function mtbWheel(cx, cy, zoneId) {
  const tR = 112, rimR = 88;
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <!-- Tire -->
    <circle cx="${cx}" cy="${cy}" r="${tR}" fill="none" stroke-width="22"/>
    <!-- Tread texture -->
    <circle cx="${cx}" cy="${cy}" r="${tR - 2}" fill="none" stroke-width="1.5" stroke-dasharray="9 5" opacity="0.28"/>
    <!-- Rim -->
    <circle cx="${cx}" cy="${cy}" r="${rimR}" fill="none" stroke-width="3.5"/>
    <!-- Spokes -->
    ${wheelSpokes(cx, cy, rimR)}
    <!-- Hub -->
    <circle cx="${cx}" cy="${cy}" r="10" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="currentColor" stroke="none"/>
    <!-- Click zone -->
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="${tR + 12}" data-zone="${zoneId}"/>
  </g>`;
}

// Thin road/gravel wheel
function roadWheel(cx, cy, zoneId, tireW = 6) {
  const tR = 110, rimR = 100;
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="${tR}" fill="none" stroke-width="${tireW}"/>
    <circle cx="${cx}" cy="${cy}" r="${rimR}" fill="none" stroke-width="2"/>
    ${wheelSpokes(cx, cy, rimR)}
    <circle cx="${cx}" cy="${cy}" r="9" fill="var(--bg-base)" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="currentColor" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="${tR + 12}" data-zone="${zoneId}"/>
  </g>`;
}

// ── FULL SUSPENSION MTB ───────────────────────────────────
// Geometry: 65° head angle, short chainstays, modern enduro proportions
// Key points verified geometrically:
//   HT (500,108) → Crown(530,172): angle = arctan(30/64) from vert = 25° → HA = 65° ✓
//   Crown(530,172) → FW axle(608,340): angle = arctan(78/168) from vert = 24.9° → 65° ✓
//   BB(382,356) → ST top(336,178): angle ≈ 76° from horizontal ✓
function svgMTBFS(hasMotor = false) {
  // Geometry anchors
  const RW  = { x: 175, y: 340 };  // rear axle
  const FW  = { x: 608, y: 340 };  // front axle
  const BB  = { x: 382, y: 356 };  // bottom bracket
  const ST  = { x: 336, y: 178 };  // seat tube top
  const HT  = { x: 500, y: 108 };  // head tube top
  const HC  = { x: 530, y: 172 };  // head tube bottom / fork crown

  // Fork leg positions (two legs, slight spread)
  const FL1 = { sx: 528, sy: 175, mx: 572, my: 268, ex: 603, ey: 340 }; // left stanchion
  const FL2 = { sx: 537, sy: 176, mx: 582, my: 270, ex: 614, ey: 341 }; // right stanchion

  // Rear suspension
  const PIVOT  = { x: 348, y: 316 };  // swingarm main pivot
  const SS_TOP = { x: 272, y: 250 };  // seatstay junction on frame
  const SH_T   = { x: 442, y: 224 };  // shock upper mount (on top tube)
  const SH_B   = { x: 356, y: 308 };  // shock lower mount (on swingarm)

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  <defs>
    <filter id="zone-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ── WHEELS ── -->
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- ── REAR TRIANGLE (draw behind main frame) ── -->
  <g class="bike-part">
    <!-- Chainstay upper -->
    <path d="M ${BB.x} ${BB.y} C ${(BB.x+RW.x)/2+20} ${BB.y-4} ${RW.x+60} ${RW.y-5} ${RW.x} ${RW.y}" fill="none" stroke-width="6" stroke-linecap="round"/>
    <!-- Chainstay lower (offset for tube width) -->
    <path d="M ${BB.x-2} ${BB.y+8} C ${(BB.x+RW.x)/2+18} ${BB.y+6} ${RW.x+58} ${RW.y+7} ${RW.x} ${RW.y}" fill="none" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    <!-- Seatstay from RW to junction on seat tube -->
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS_TOP.x}" y2="${SS_TOP.y}" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Small bridge between seatstays (upper) -->
    <line x1="${SS_TOP.x}" y1="${SS_TOP.y}" x2="${ST.x - 4}" y2="${ST.y + 42}" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>
    <!-- Pivot circle -->
    <circle cx="${PIVOT.x}" cy="${PIVOT.y}" r="6" fill="var(--bg-surface)" stroke-width="3"/>
  </g>

  <!-- ── REAR SHOCK ── -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <!-- Shock body -->
    <line x1="${SH_T.x}" y1="${SH_T.y}" x2="${SH_B.x}" y2="${SH_B.y}" stroke-width="10" stroke-linecap="round"/>
    <!-- Shaft (lighter inner line) -->
    <line x1="${SH_T.x}" y1="${SH_T.y}" x2="${(SH_T.x+SH_B.x)/2}" y2="${(SH_T.y+SH_B.y)/2}" stroke-width="4" stroke="var(--bg-surface)" opacity="0.5" stroke-linecap="round"/>
    <!-- Spring coil marks -->
    <line x1="${SH_T.x}" y1="${SH_T.y}" x2="${SH_B.x}" y2="${SH_B.y}" stroke-width="4" stroke="var(--bg-surface)" stroke-dasharray="0 18 6 18 6 18" stroke-linecap="round" opacity="0.4"/>
    <!-- Mount eyelets -->
    <circle cx="${SH_T.x}" cy="${SH_T.y}" r="6" fill="none" stroke-width="3"/>
    <circle cx="${SH_B.x}" cy="${SH_B.y}" r="6" fill="none" stroke-width="3"/>
    <!-- Click zone -->
    <ellipse class="zone-overlay" cx="${(SH_T.x+SH_B.x)/2}" cy="${(SH_T.y+SH_B.y)/2}" rx="44" ry="68" transform="rotate(-32 ${(SH_T.x+SH_B.x)/2} ${(SH_T.y+SH_B.y)/2})" data-zone="shock"/>
  </g>

  <!-- ── MAIN FRAME ── -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <!-- Down tube (thickest tube) -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="9" stroke-linecap="round"/>
    <!-- Seat tube -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7" stroke-linecap="round"/>
    <!-- Top tube -->
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6" stroke-linecap="round"/>
    <!-- Head tube (short, thick, angled) -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="12" stroke-linecap="round"/>
    ${hasMotor ? `
    <!-- Motor unit -->
    <rect x="${BB.x - 38}" y="${BB.y - 44}" width="60" height="42" rx="8" fill="none" stroke-width="3" opacity="0.7"/>
    <line x1="${BB.x - 38}" y1="${BB.y - 25}" x2="${BB.x + 22}" y2="${BB.y - 25}" stroke-width="1.5" opacity="0.4"/>
    <rect x="${BB.x - 30}" y="${BB.y - 40}" width="16" height="7" rx="2" fill="var(--text-muted)" stroke="none" opacity="0.5"/>
    ` : ''}
    <!-- Frame click zone -->
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y} ${BB.x},${BB.y}" data-zone="frame" style="fill:transparent;stroke:none"/>
    <rect class="zone-overlay" x="245" y="95" width="310" height="290" rx="12" data-zone="frame"/>
  </g>

  <!-- ── FORK ── -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <!-- Crown plate -->
    <rect x="${HC.x - 12}" y="${HC.y - 5}" width="28" height="14" rx="4" fill="none" stroke-width="3"/>
    <!-- Stanchion left (upper) -->
    <line x1="${FL1.sx}" y1="${FL1.sy}" x2="${FL1.mx}" y2="${FL1.my}" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Stanchion right (upper) -->
    <line x1="${FL2.sx}" y1="${FL2.sy}" x2="${FL2.mx}" y2="${FL2.my}" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Lower left (wider, fatter) -->
    <line x1="${FL1.mx}" y1="${FL1.my}" x2="${FL1.ex}" y2="${FL1.ey}" stroke-width="8.5" stroke-linecap="round"/>
    <!-- Lower right -->
    <line x1="${FL2.mx}" y1="${FL2.my}" x2="${FL2.ex}" y2="${FL2.ey}" stroke-width="8.5" stroke-linecap="round"/>
    <!-- Lower brace (axle clamp area) -->
    <line x1="${FL1.ex - 2}" y1="${FL1.ey - 18}" x2="${FL2.ex + 2}" y2="${FL2.ey - 18}" stroke-width="5" stroke-linecap="round"/>
    <!-- Brake caliper mount -->
    <rect x="${FL1.ex - 16}" y="${FL1.ey - 48}" width="12" height="20" rx="3" fill="none" stroke-width="2.5" opacity="0.7"/>
    <!-- Fork click zone -->
    <rect class="zone-overlay" x="490" y="108" width="148" height="258" rx="12" data-zone="fork"/>
  </g>

  <!-- ── HANDLEBARS ── -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Stem -->
    <line x1="${HT.x + 2}" y1="${HT.y}" x2="${HT.x - 2}" y2="${HT.y - 42}" stroke-width="6" stroke-linecap="round"/>
    <!-- Stem face plate (small rect at top) -->
    <rect x="${HT.x - 12}" y="${HT.y - 48}" width="20" height="9" rx="3" fill="none" stroke-width="3"/>
    <!-- Handlebar tube (wide MTB bar ~780mm) -->
    <line x1="${HT.x - 58}" y1="${HT.y - 46}" x2="${HT.x + 52}" y2="${HT.y - 46}" stroke-width="7" stroke-linecap="round"/>
    <!-- Grip left -->
    <line x1="${HT.x - 58}" y1="${HT.y - 46}" x2="${HT.x - 66}" y2="${HT.y - 48}" stroke-width="13" stroke-linecap="round" opacity="0.65"/>
    <!-- Grip right -->
    <line x1="${HT.x + 52}" y1="${HT.y - 46}" x2="${HT.x + 60}" y2="${HT.y - 48}" stroke-width="13" stroke-linecap="round" opacity="0.65"/>
    <!-- Bar ends (slight downward sweep at ends) -->
    <path d="M ${HT.x - 58} ${HT.y - 46} Q ${HT.x - 63} ${HT.y - 44} ${HT.x - 65} ${HT.y - 40}" fill="none" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${HT.x + 52} ${HT.y - 46} Q ${HT.x + 57} ${HT.y - 44} ${HT.x + 59} ${HT.y - 40}" fill="none" stroke-width="6" stroke-linecap="round"/>
    <!-- Click zone -->
    <rect class="zone-overlay" x="${HT.x - 80}" y="${HT.y - 72}" width="158" height="85" rx="10" data-zone="handlebar"/>
  </g>

  <!-- ── DROPPER / SADDLE ── -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <!-- Seatpost collar / clamp at seat tube top -->
    <rect x="${ST.x - 9}" y="${ST.y - 3}" width="18" height="10" rx="3" fill="var(--bg-surface)" stroke-width="2.5"/>
    <!-- Seatpost tube -->
    <line x1="${ST.x}" y1="${ST.y + 2}" x2="${ST.x - 4}" y2="${ST.y - 50}" stroke-width="6" stroke-linecap="round"/>
    <!-- Saddle rails -->
    <line x1="${ST.x - 30}" y1="${ST.y - 50}" x2="${ST.x + 28}" y2="${ST.y - 50}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
    <!-- Saddle body -->
    <path d="M ${ST.x - 32} ${ST.y - 52} C ${ST.x - 18} ${ST.y - 62} ${ST.x + 8} ${ST.y - 64} ${ST.x + 34} ${ST.y - 52}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <!-- Saddle fill (slightly thick underside) -->
    <path d="M ${ST.x - 34} ${ST.y - 50} C ${ST.x - 18} ${ST.y - 61} ${ST.x + 8} ${ST.y - 63} ${ST.x + 36} ${ST.y - 50} L ${ST.x + 36} ${ST.y - 46} C ${ST.x + 8} ${ST.y - 59} ${ST.x - 18} ${ST.y - 57} ${ST.x - 34} ${ST.y - 46} Z" fill="currentColor" stroke="none" opacity="0.45"/>
    <!-- Click zone -->
    <rect class="zone-overlay" x="${ST.x - 50}" y="${ST.y - 82}" width="116" height="115" rx="10" data-zone="dropper"/>
  </g>

  <!-- ── DRIVETRAIN ── -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <!-- Chainring -->
    <circle cx="${BB.x}" cy="${BB.y}" r="30" fill="none" stroke-width="5.5"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="20" fill="none" stroke-width="1.8" opacity="0.4"/>
    <!-- Chainring bolts -->
    <circle cx="${BB.x}" cy="${BB.y - 25}" r="2.5" fill="currentColor" stroke="none" opacity="0.5"/>
    <circle cx="${BB.x + 24}" cy="${BB.y + 8}" r="2.5" fill="currentColor" stroke="none" opacity="0.5"/>
    <circle cx="${BB.x - 24}" cy="${BB.y + 8}" r="2.5" fill="currentColor" stroke="none" opacity="0.5"/>
    <!-- Crank arm forward -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x + 36}" y2="${BB.y + 26}" stroke-width="7" stroke-linecap="round"/>
    <!-- Crank arm back -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x - 36}" y2="${BB.y - 26}" stroke-width="7" stroke-linecap="round"/>
    <!-- Pedal forward -->
    <line x1="${BB.x + 32}" y1="${BB.y + 24}" x2="${BB.x + 44}" y2="${BB.y + 20}" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
    <!-- Pedal back -->
    <line x1="${BB.x - 32}" y1="${BB.y - 24}" x2="${BB.x - 44}" y2="${BB.y - 20}" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
    <!-- Chain run (upper) -->
    <path d="M ${BB.x - 2} ${BB.y - 30} Q ${(BB.x + RW.x) / 2} ${BB.y - 38} ${RW.x} ${RW.y - 20}" fill="none" stroke-width="2" stroke-dasharray="7 3" opacity="0.38"/>
    <!-- Chain run (lower) -->
    <path d="M ${BB.x} ${BB.y + 30} Q ${(BB.x + RW.x) / 2} ${BB.y + 20} ${RW.x} ${RW.y + 8}" fill="none" stroke-width="2" stroke-dasharray="7 3" opacity="0.38"/>
    <!-- Cassette at rear hub -->
    <circle cx="${RW.x}" cy="${RW.y}" r="24" fill="none" stroke-width="5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="18" fill="none" stroke-width="3.5" opacity="0.55"/>
    <!-- Rear derailleur -->
    <path d="M ${RW.x + 20} ${RW.y + 14} Q ${RW.x + 40} ${RW.y + 36} ${RW.x + 30} ${RW.y + 52}" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="${RW.x + 28}" cy="${RW.y + 54}" r="7" fill="none" stroke-width="2.5"/>
    <!-- BB shell -->
    <circle cx="${BB.x}" cy="${BB.y}" r="11" fill="var(--bg-surface)" stroke="currentColor" stroke-width="3"/>
    <!-- Click zone -->
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="54" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── HARDTAIL MTB ──────────────────────────────────────────
function svgHardtail(isDJ = false) {
  const RW = { x: 178, y: 340 };
  const FW = { x: 608, y: 340 };
  const BB = { x: 382, y: 358 };
  // DJ: steeper seat angle, sloppy top tube
  const ST = isDJ ? { x: 344, y: 185 } : { x: 338, y: 178 };
  const HT = isDJ ? { x: 512, y: 122 } : { x: 500, y: 108 };
  const HC = isDJ ? { x: 540, y: 198 } : { x: 530, y: 172 };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- Rigid rear triangle -->
  <g class="bike-part">
    <path d="M ${BB.x} ${BB.y} C ${(BB.x+RW.x)/2+18} ${BB.y-3} ${RW.x+55} ${RW.y-5} ${RW.x} ${RW.y}" fill="none" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${BB.x-2} ${BB.y+7} C ${(BB.x+RW.x)/2+16} ${BB.y+5} ${RW.x+53} ${RW.y+6} ${RW.x} ${RW.y}" fill="none" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${ST.x - 8}" y2="${ST.y + 38}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${ST.x}" y2="${ST.y + 2}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  </g>

  <!-- Main frame -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="9" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="12" stroke-linecap="round"/>
    <rect class="zone-overlay" x="252" y="92" width="316" height="294" rx="12" data-zone="frame"/>
  </g>

  <!-- Fork (rigid crown, suspension legs for HT, full rigid for DJ) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <rect x="${HC.x - 12}" y="${HC.y - 5}" width="28" height="14" rx="4" fill="none" stroke-width="3"/>
    ${isDJ
      ? `<!-- Rigid fork (DJ) -->
         <line x1="${HC.x - 4}" y1="${HC.y}" x2="${FW.x - 6}" y2="${FW.y}" stroke-width="6" stroke-linecap="round"/>
         <line x1="${HC.x + 4}" y1="${HC.y + 2}" x2="${FW.x + 6}" y2="${FW.y}" stroke-width="6" stroke-linecap="round"/>
         <path d="M ${HC.x - 4} ${HC.y} Q ${HC.x} ${HC.y - 6} ${HC.x + 4} ${HC.y + 2}" fill="none" stroke-width="5" stroke-linecap="round"/>`
      : `<!-- Suspension fork (hardtail) -->
         <line x1="${HC.x - 2}" y1="${HC.y + 2}" x2="${HC.x + 42}" y2="${HC.y + 90}" stroke-width="5.5" stroke-linecap="round"/>
         <line x1="${HC.x + 8}" y1="${HC.y + 2}" x2="${HC.x + 52}" y2="${HC.y + 92}" stroke-width="5.5" stroke-linecap="round"/>
         <line x1="${HC.x + 42}" y1="${HC.y + 90}" x2="${FW.x - 5}" y2="${FW.y}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${HC.x + 52}" y1="${HC.y + 92}" x2="${FW.x + 7}" y2="${FW.y}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${FW.x - 4}" y1="${FW.y - 18}" x2="${FW.x + 8}" y2="${FW.y - 18}" stroke-width="5" stroke-linecap="round"/>
         <rect x="${FW.x - 16}" y="${FW.y - 50}" width="12" height="22" rx="3" fill="none" stroke-width="2.5" opacity="0.7"/>`
    }
    <rect class="zone-overlay" x="490" y="108" width="148" height="258" rx="12" data-zone="fork"/>
  </g>

  <!-- Handlebars -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${HT.x + 2}" y1="${HT.y}" x2="${HT.x - 2}" y2="${HT.y - 40}" stroke-width="6" stroke-linecap="round"/>
    <rect x="${HT.x - 12}" y="${HT.y - 46}" width="20" height="9" rx="3" fill="none" stroke-width="3"/>
    ${isDJ
      ? `<!-- DJ riser bars (tall riser, wide) -->
         <line x1="${HT.x - 4}" y1="${HT.y - 40}" x2="${HT.x - 4}" y2="${HT.y - 72}" stroke-width="6" stroke-linecap="round"/>
         <line x1="${HT.x - 62}" y1="${HT.y - 70}" x2="${HT.x + 54}" y2="${HT.y - 70}" stroke-width="7" stroke-linecap="round"/>
         <line x1="${HT.x - 62}" y1="${HT.y - 70}" x2="${HT.x - 70}" y2="${HT.y - 72}" stroke-width="13" stroke-linecap="round" opacity="0.65"/>
         <line x1="${HT.x + 54}" y1="${HT.y - 70}" x2="${HT.x + 62}" y2="${HT.y - 72}" stroke-width="13" stroke-linecap="round" opacity="0.65"/>`
      : `<!-- MTB flat/riser bars -->
         <line x1="${HT.x - 58}" y1="${HT.y - 44}" x2="${HT.x + 52}" y2="${HT.y - 44}" stroke-width="7" stroke-linecap="round"/>
         <line x1="${HT.x - 58}" y1="${HT.y - 44}" x2="${HT.x - 66}" y2="${HT.y - 46}" stroke-width="13" stroke-linecap="round" opacity="0.65"/>
         <line x1="${HT.x + 52}" y1="${HT.y - 44}" x2="${HT.x + 60}" y2="${HT.y - 46}" stroke-width="13" stroke-linecap="round" opacity="0.65"/>
         <path d="M ${HT.x - 58} ${HT.y - 44} Q ${HT.x - 63} ${HT.y - 42} ${HT.x - 65} ${HT.y - 38}" fill="none" stroke-width="6" stroke-linecap="round"/>
         <path d="M ${HT.x + 52} ${HT.y - 44} Q ${HT.x + 57} ${HT.y - 42} ${HT.x + 59} ${HT.y - 38}" fill="none" stroke-width="6" stroke-linecap="round"/>`
    }
    <rect class="zone-overlay" x="${HT.x - 82}" y="${HT.y - 70}" width="162" height="82" rx="10" data-zone="handlebar"/>
  </g>

  <!-- Dropper / saddle (no dropper on DJ) -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x - 9}" y="${ST.y - 3}" width="18" height="10" rx="3" fill="var(--bg-surface)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y + 2}" x2="${ST.x - 4}" y2="${ST.y - 46}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${ST.x - 28}" y1="${ST.y - 46}" x2="${ST.x + 26}" y2="${ST.y - 46}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M ${ST.x - 30} ${ST.y - 48} C ${ST.x - 16} ${ST.y - 58} ${ST.x + 6} ${ST.y - 60} ${ST.x + 32} ${ST.y - 48}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x - 32} ${ST.y - 46} C ${ST.x - 16} ${ST.y - 57} ${ST.x + 6} ${ST.y - 59} ${ST.x + 34} ${ST.y - 46} L ${ST.x + 34} ${ST.y - 42} C ${ST.x + 6} ${ST.y - 55} ${ST.x - 16} ${ST.y - 53} ${ST.x - 32} ${ST.y - 42} Z" fill="currentColor" stroke="none" opacity="0.42"/>
    <rect class="zone-overlay" x="${ST.x - 50}" y="${ST.y - 78}" width="116" height="112" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drivetrain -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="30" fill="none" stroke-width="5.5"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="20" fill="none" stroke-width="1.8" opacity="0.4"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x + 36}" y2="${BB.y + 26}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x - 36}" y2="${BB.y - 26}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${BB.x + 32}" y1="${BB.y + 24}" x2="${BB.x + 44}" y2="${BB.y + 20}" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
    <path d="M ${BB.x - 2} ${BB.y - 30} Q ${(BB.x + RW.x) / 2} ${BB.y - 38} ${RW.x} ${RW.y - 20}" fill="none" stroke-width="2" stroke-dasharray="7 3" opacity="0.38"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="22" fill="none" stroke-width="5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="16" fill="none" stroke-width="3.5" opacity="0.55"/>
    <path d="M ${RW.x + 18} ${RW.y + 12} Q ${RW.x + 38} ${RW.y + 34} ${RW.x + 28} ${RW.y + 48}" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="${RW.x + 26}" cy="${RW.y + 50}" r="7" fill="none" stroke-width="2.5"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="11" fill="var(--bg-surface)" stroke="currentColor" stroke-width="3"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="54" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── GRAVEL / ROAD ─────────────────────────────────────────
function svgGravelRoad(isRoad = false) {
  const RW = { x: 178, y: 340 };
  const FW = { x: 608, y: 340 };
  const BB = { x: 382, y: 352 };
  // Road: 72° HA — more upright, shorter reach
  // Gravel: 70° HA — slightly slacker
  const HT = isRoad ? { x: 512, y: 118 } : { x: 506, y: 112 };
  const HC = isRoad ? { x: 534, y: 198 } : { x: 538, y: 206 };
  const ST = isRoad ? { x: 346, y: 174 } : { x: 340, y: 170 };

  const tireW = isRoad ? 6 : 14;

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${isRoad ? roadWheel(RW.x, RW.y, 'rear-wheel', tireW) : roadWheel(RW.x, RW.y, 'rear-wheel', tireW)}
  ${isRoad ? roadWheel(FW.x, FW.y, 'front-wheel', tireW) : roadWheel(FW.x, FW.y, 'front-wheel', tireW)}

  <!-- Rear triangle -->
  <g class="bike-part">
    <path d="M ${BB.x} ${BB.y} C ${(BB.x+RW.x)/2+14} ${BB.y-2} ${RW.x+50} ${RW.y-4} ${RW.x} ${RW.y}" fill="none" stroke-width="${isRoad ? 4 : 5}" stroke-linecap="round"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${ST.x - 6}" y2="${ST.y + 32}" stroke-width="${isRoad ? 3 : 4}" stroke-linecap="round"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="${isRoad ? 3 : 3.5}" stroke-linecap="round" opacity="0.55"/>
  </g>

  <!-- Frame -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad ? 6 : 7}" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="${isRoad ? 5 : 6}" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="${isRoad ? 4.5 : 5.5}" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad ? 9 : 10}" stroke-linecap="round"/>
    <rect class="zone-overlay" x="255" y="95" width="320" height="286" rx="12" data-zone="frame"/>
  </g>

  <!-- Fork (rigid, curved) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <path d="M ${HC.x} ${HC.y} C ${HC.x + 18} ${HC.y + 55} ${FW.x + 14} ${FW.y - 65} ${FW.x + 8} ${FW.y}" fill="none" stroke-width="${isRoad ? 4.5 : 5.5}" stroke-linecap="round"/>
    <path d="M ${HC.x + 8} ${HC.y + 2} C ${HC.x + 26} ${HC.y + 56} ${FW.x + 22} ${FW.y - 64} ${FW.x + 16} ${FW.y}" fill="none" stroke-width="${isRoad ? 4.5 : 5.5}" stroke-linecap="round"/>
    <path d="M ${HC.x} ${HC.y} Q ${HC.x + 4} ${HC.y - 6} ${HC.x + 8} ${HC.y + 2}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="500" y="115" width="145" height="248" rx="12" data-zone="fork"/>
  </g>

  <!-- Drop bars (road/gravel) -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${HT.x + 2}" y1="${HT.y}" x2="${HT.x - 2}" y2="${HT.y - 36}" stroke-width="5" stroke-linecap="round"/>
    <rect x="${HT.x - 10}" y="${HT.y - 42}" width="18" height="8" rx="3" fill="none" stroke-width="2.5"/>
    <!-- Hood top (flat section) -->
    <line x1="${HT.x - 22}" y1="${HT.y - 42}" x2="${HT.x + 16}" y2="${HT.y - 42}" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Hood shape left -->
    <path d="M ${HT.x - 22} ${HT.y - 42} C ${HT.x - 30} ${HT.y - 34} ${HT.x - 34} ${HT.y - 20} ${HT.x - 28} ${HT.y - 10}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Drop section left -->
    <path d="M ${HT.x - 28} ${HT.y - 10} C ${HT.x - 26} ${HT.y - 2} ${HT.x - 18} ${HT.y + 4} ${HT.x - 10} ${HT.y + 4}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Hood shape right -->
    <path d="M ${HT.x + 16} ${HT.y - 42} C ${HT.x + 18} ${HT.y - 34} ${HT.x + 18} ${HT.y - 20} ${HT.x + 14} ${HT.y - 10}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M ${HT.x + 14} ${HT.y - 10} C ${HT.x + 12} ${HT.y - 2} ${HT.x + 6} ${HT.y + 4} ${HT.x} ${HT.y + 4}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${HT.x - 52}" y="${HT.y - 62}" width="88" height="82" rx="10" data-zone="handlebar"/>
  </g>

  <!-- Saddle (no dropper) -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x - 8}" y="${ST.y - 2}" width="16" height="9" rx="3" fill="var(--bg-surface)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y + 2}" x2="${ST.x - 3}" y2="${ST.y - 44}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${ST.x - 28} ${ST.y - 47} C ${ST.x - 14} ${ST.y - 57} ${ST.x + 8} ${ST.y - 58} ${ST.x + 30} ${ST.y - 47}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M ${ST.x - 30} ${ST.y - 45} C ${ST.x - 14} ${ST.y - 56} ${ST.x + 8} ${ST.y - 57} ${ST.x + 32} ${ST.y - 45} L ${ST.x + 32} ${ST.y - 41} C ${ST.x + 8} ${ST.y - 53} ${ST.x - 14} ${ST.y - 52} ${ST.x - 30} ${ST.y - 41} Z" fill="currentColor" stroke="none" opacity="0.42"/>
    <rect class="zone-overlay" x="${ST.x - 46}" y="${ST.y - 74}" width="108" height="106" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drivetrain (road: 2x chainring) -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="${isRoad ? 32 : 28}" fill="none" stroke-width="5"/>
    ${isRoad ? `<circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="3.5" opacity="0.5"/>` : ''}
    <circle cx="${BB.x}" cy="${BB.y}" r="18" fill="none" stroke-width="1.5" opacity="0.35"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x + 34}" y2="${BB.y + 24}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x - 34}" y2="${BB.y - 24}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${BB.x + 30}" y1="${BB.y + 22}" x2="${BB.x + 42}" y2="${BB.y + 18}" stroke-width="5.5" stroke-linecap="round" opacity="0.75"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="18" fill="none" stroke-width="4"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="12" fill="none" stroke-width="3" opacity="0.5"/>
    <path d="M ${RW.x + 16} ${RW.y + 10} Q ${RW.x + 34} ${RW.y + 28} ${RW.x + 24} ${RW.y + 42}" fill="none" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${RW.x + 22}" cy="${RW.y + 44}" r="6" fill="none" stroke-width="2.5"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="10" fill="var(--bg-surface)" stroke="currentColor" stroke-width="2.5"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="50" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── SVG FACTORY ───────────────────────────────────────────
export function createSilhouette(bike) {
  const type = bike.type || 'mtb';
  const isFull = (bike.suspensionType || 'full') === 'full';
  switch (type) {
    case 'mtb':        return isFull ? svgMTBFS(false) : svgHardtail(false);
    case 'emtb':       return svgMTBFS(true);
    case 'dirtjumper': return svgHardtail(true);
    case 'gravel':     return svgGravelRoad(false);
    case 'road':       return svgGravelRoad(true);
    default:           return svgMTBFS(false);
  }
}

// Mini silhouette for bike cards (no interactivity)
export function createMiniSilhouette(bikeType) {
  const fake = {
    mtb:        { type: 'mtb',        suspensionType: 'full' },
    emtb:       { type: 'emtb',       suspensionType: 'full' },
    dirtjumper: { type: 'dirtjumper', suspensionType: 'hardtail' },
    gravel:     { type: 'gravel' },
    road:       { type: 'road' },
  };
  let svg = createSilhouette(fake[bikeType] || fake.mtb);
  // Strip interactivity for card display
  svg = svg.replace(/id="bike-svg"/, 'class="mini-silhouette"');
  svg = svg.replace(/<[^>]*class="zone-overlay[^"]*"[^/]*\/>/g, '');
  svg = svg.replace(/id="g-[^"]*"/g, '');
  return svg;
}

// ── ZOOM INTERACTION ──────────────────────────────────────
let _currentVB = [...VB_DEFAULT];
let _animFrame = null;
let _activeZone = null;

function lerpVB(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

export function animateViewBox(svg, targetVB, duration = 480) {
  if (_animFrame) cancelAnimationFrame(_animFrame);
  const startVB = [..._currentVB];
  const start = performance.now();
  function step(now) {
    const raw = Math.min((now - start) / duration, 1);
    const t = easeOutCubic(raw);
    _currentVB = lerpVB(startVB, targetVB, t);
    svg.setAttribute('viewBox', _currentVB.join(' '));
    if (raw < 1) _animFrame = requestAnimationFrame(step);
  }
  _animFrame = requestAnimationFrame(step);
}

export function resetZoom(svg) {
  _activeZone = null;
  if (svg) animateViewBox(svg, VB_DEFAULT);
}

// ── ZONE EVENT SETUP ──────────────────────────────────────
export function setupZoneInteraction(container, bike, onZoneClick) {
  const svg = container.querySelector('#bike-svg');
  if (!svg) return;
  _currentVB = [...VB_DEFAULT];
  _activeZone = null;
  svg.setAttribute('viewBox', VB_DEFAULT.join(' '));

  const tooltip = document.getElementById('zone-tooltip');
  const overlays = svg.querySelectorAll('.zone-overlay');
  const available = getAvailableZones(bike);

  overlays.forEach(overlay => {
    const zoneId = overlay.getAttribute('data-zone');
    if (!available.includes(zoneId)) { overlay.style.display = 'none'; return; }
    const group = svg.querySelector(`#g-${zoneId}`);

    overlay.addEventListener('mouseenter', e => {
      if (group) group.classList.add('zone-hovered');
      showTooltip(tooltip, zoneId, bike, e, container);
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity', '0');
    });
    overlay.addEventListener('mouseleave', () => {
      if (group && _activeZone !== zoneId) group.classList.remove('zone-hovered');
      tooltip.classList.add('hidden');
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity', '');
    });
    overlay.addEventListener('mousemove', e => positionTooltip(tooltip, e, container));

    overlay.addEventListener('click', () => {
      if (_activeZone) {
        const prev = svg.querySelector(`#g-${_activeZone}`);
        if (prev) prev.classList.remove('zone-active', 'zone-hovered');
      }
      if (_activeZone === zoneId) {
        _activeZone = null;
        resetZoom(svg);
        document.getElementById('btn-zoom-reset')?.classList.add('hidden');
        onZoneClick(null);
      } else {
        _activeZone = zoneId;
        if (group) { group.classList.remove('zone-hovered'); group.classList.add('zone-active'); }
        const meta = ZONE_META[zoneId];
        if (meta) animateViewBox(svg, meta.vb);
        document.getElementById('btn-zoom-reset')?.classList.remove('hidden');
        onZoneClick(zoneId);
      }
    });
  });
}

function getAvailableZones(bike) {
  const base = ['front-wheel', 'rear-wheel', 'fork', 'handlebar', 'drivetrain', 'dropper', 'frame'];
  const type = bike.type || 'mtb';
  const isFull = (bike.suspensionType || 'full') === 'full';
  if ((type === 'mtb' || type === 'emtb') && isFull) base.push('shock');
  return base;
}

function showTooltip(tooltip, zoneId, bike, e, container) {
  const meta = ZONE_META[zoneId];
  if (!meta) return;
  tooltip.querySelector('.tooltip-zone-name').textContent = meta.label;
  tooltip.querySelector('.tooltip-zone-value').textContent = getZoneQuickValue(zoneId, bike);
  tooltip.classList.remove('hidden');
  positionTooltip(tooltip, e, container);
}

function positionTooltip(tooltip, e, container) {
  const rect = container.getBoundingClientRect();
  tooltip.style.left = `${e.clientX - rect.left}px`;
  tooltip.style.top  = `${e.clientY - rect.top}px`;
}

export function getZoneQuickValue(zoneId, bike) {
  const bl = bike.baseline || {};
  switch (zoneId) {
    case 'front-wheel': { const t = bl.frontTire; return t?.brand ? `${t.brand} ${t.model||''} ${t.psi ? '· '+t.psi+' psi' : ''}`.trim() : 'Not set'; }
    case 'rear-wheel':  { const t = bl.rearTire;  return t?.brand ? `${t.brand} ${t.model||''} ${t.psi ? '· '+t.psi+' psi' : ''}`.trim() : 'Not set'; }
    case 'fork':   { const f = bl.fork;  return f?.brand ? `${f.brand} ${f.model||''} ${f.type==='air'&&f.psi ? '· '+f.psi+' psi' : f.type==='coil' ? '· Coil' : ''}`.trim() : 'Not set'; }
    case 'shock':  { const s = bl.shock; return s?.brand ? `${s.brand} ${s.model||''} ${s.type==='air'&&s.psi ? '· '+s.psi+' psi' : s.type==='coil' ? '· Coil' : ''}`.trim() : 'Not set'; }
    case 'handlebar':  return bl.handlebar?.brand ? `${bl.handlebar.brand} ${bl.handlebar.model||''}`.trim() : 'Not set';
    case 'drivetrain': return bl.drivetrain?.brand ? `${bl.drivetrain.brand} ${bl.drivetrain.model||''}`.trim() : 'Not set';
    case 'dropper':    return bl.dropper?.brand ? `${bl.dropper.brand} ${bl.dropper.model||''}`.trim() : 'Not set';
    case 'frame':      return bl.frame?.brand ? `${bl.frame.brand} ${bl.frame.model||''}`.trim() : 'Not set';
    default: return '—';
  }
}

export { ZONE_META };
