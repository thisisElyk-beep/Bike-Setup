// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams with zone interaction
// Geometry modeled on modern enduro MTB (65° HA, short stays)
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

const ZONE_META = {
  'front-wheel':  { label: 'Front Wheel / Tire', vb: [458, 188, 288, 288], key: 'frontTire' },
  'rear-wheel':   { label: 'Rear Wheel / Tire',  vb: [8,   188, 288, 288], key: 'rearTire' },
  'fork':         { label: 'Fork',               vb: [472, 112, 228, 262], key: 'fork' },
  'shock':        { label: 'Rear Shock',         vb: [308, 112, 218, 228], key: 'shock' },
  'handlebar':    { label: 'Cockpit / Bars',     vb: [412,  32, 208, 182], key: 'handlebar' },
  'drivetrain':   { label: 'Drivetrain',         vb: [288, 295, 215, 180], key: 'drivetrain' },
  'dropper':      { label: 'Dropper / Saddle',   vb: [215,  65, 202, 218], key: 'dropper' },
  'frame':        { label: 'Frame / Geometry',   vb: [105,  78, 462, 322], key: 'frame' },
};

// ── WHEEL HELPERS ─────────────────────────────────────────
function wheelSpokes(cx, cy, r, count = 8) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * (r - 28);
    const y2 = cy + Math.sin(a) * (r - 28);
    s += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="1.2" opacity="0.32"/>`;
  }
  return s;
}

function mtbWheel(cx, cy, zoneId) {
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="112" fill="none" stroke-width="24"/>
    <circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke-width="1.5" stroke-dasharray="10 5" opacity="0.22"/>
    <circle cx="${cx}" cy="${cy}" r="88" fill="none" stroke-width="3.5"/>
    ${wheelSpokes(cx, cy, 88)}
    <circle cx="${cx}" cy="${cy}" r="11" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="currentColor" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="124" data-zone="${zoneId}"/>
  </g>`;
}

function roadWheel(cx, cy, zoneId, tireW = 6) {
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke-width="${tireW}"/>
    <circle cx="${cx}" cy="${cy}" r="100" fill="none" stroke-width="2"/>
    ${wheelSpokes(cx, cy, 100)}
    <circle cx="${cx}" cy="${cy}" r="9" fill="var(--bg-base)" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="currentColor" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="122" data-zone="${zoneId}"/>
  </g>`;
}

// ── FULL SUSPENSION MTB ───────────────────────────────────
//
// Geometry anchors (65° head angle verified):
//   HT(502,91) → HC(538,168): dx=36,dy=77 → arctan(36/77)=25° from vert → HA=65° ✓
//   HC(538,168) → FW(618,340): dx=80,dy=172 → arctan(80/172)=25° from vert → HA=65° ✓
//   BB(380,356) → ST(335,176): ≈76° seat angle ✓
//   Wheelbase: 618-165=453px — wider for longer top tube
//
function svgMTBFS(hasMotor = false) {
  const RW  = { x: 165, y: 340 };   // rear axle
  const FW  = { x: 618, y: 340 };   // front axle
  const BB  = { x: 380, y: 356 };   // bottom bracket
  const ST  = { x: 335, y: 176 };   // seat tube top
  const HT  = { x: 502, y: 91  };   // head tube top
  const HC  = { x: 538, y: 168 };   // fork crown / HT bottom

  // Point on seat tube where seatstay attaches (~55% up from BB)
  const SS  = { x: 353, y: 246 };   // seatstay junction (on seat tube)

  // Main suspension pivot
  const PIV = { x: 356, y: 324 };   // swingarm pivot (near BB)

  // Rear shock mounts — inside main triangle, angled back-down
  const SHT = { x: 438, y: 144 };   // shock upper (on top tube)
  const SHB = { x: 356, y: 298 };   // shock lower (on swingarm link)

  // Fork leg coordinates — thick 36mm stanchions
  // Left leg:  (529,172) stanchion → (568,270) junction → (606,340) axle
  // Right leg: (548,173) stanchion → (587,271) junction → (625,341) axle
  const FL = {
    l: { sx:529, sy:172, mx:565, my:270, ex:606, ey:340 },
    r: { sx:548, sy:173, mx:584, my:271, ex:626, ey:341 },
  };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <!-- ── WHEELS ─────────────────────────────────────────── -->
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- ── REAR TRIANGLE geometry (no clickzone — frame/shock handle it) ── -->
  <g class="bike-part">
    <!-- Chainstay upper rail -->
    <path d="M ${BB.x} ${BB.y}
             C ${BB.x - 60} ${BB.y - 4}
               ${RW.x + 80} ${RW.y - 4}
               ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Chainstay lower rail (tube depth illusion) -->
    <path d="M ${BB.x - 4} ${BB.y + 8}
             C ${BB.x - 64} ${BB.y + 4}
               ${RW.x + 78} ${RW.y + 8}
               ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
    <!-- Seatstay — RW axle up to seat tube junction -->
    <line x1="${RW.x}" y1="${RW.y}"
          x2="${SS.x}"  y2="${SS.y}"
          stroke-width="5" stroke-linecap="round"/>
    <!-- Second seatstay (parallel offset for tube illusion) -->
    <line x1="${RW.x + 8}" y1="${RW.y}"
          x2="${SS.x + 7}"  y2="${SS.y}"
          stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    <!-- Seatstay bridge (small cross-brace near RW) -->
    <line x1="${RW.x + 14}" y1="${RW.y - 20}"
          x2="${RW.x + 22}"  y2="${RW.y - 24}"
          stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>
    <!-- Swingarm pivot -->
    <circle cx="${PIV.x}" cy="${PIV.y}" r="7" fill="var(--bg-base)" stroke-width="3.5"/>
    <circle cx="${PIV.x}" cy="${PIV.y}" r="3" fill="currentColor" stroke="none"/>
    <!-- Link from pivot to seatstay junction -->
    <line x1="${PIV.x}" y1="${PIV.y}"
          x2="${SS.x}"  y2="${SS.y}"
          stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>
  </g>

  <!-- ── MAIN FRAME geometry ────────────────────────────── -->
  <g class="bike-part">
    <!-- Down tube (thickest tube on bike) -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="10" stroke-linecap="round"/>
    <!-- Seat tube -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <!-- Top tube — long and prominent -->
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Head tube — short, very thick, clearly angled at 65° -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="14" stroke-linecap="round"/>
    ${hasMotor ? `
    <rect x="${BB.x - 40}" y="${BB.y - 48}" width="64" height="44" rx="9"
          fill="none" stroke-width="3" opacity="0.7"/>
    <line x1="${BB.x - 40}" y1="${BB.y - 28}" x2="${BB.x + 24}" y2="${BB.y - 28}"
          stroke-width="1.5" opacity="0.4"/>` : ''}
  </g>

  <!-- ── REAR SHOCK (rendered before overlays but after frame geometry) ── -->
  <!-- Visual elements -->
  <g class="bike-part shock-visual">
    <!-- Shock body (thick cylinder) -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="12" stroke-linecap="round"/>
    <!-- Shaft (inner lighter section — upper half) -->
    <line x1="${SHT.x}" y1="${SHT.y}"
          x2="${SHT.x + (SHB.x-SHT.x)*0.48}" y2="${SHT.y + (SHB.y-SHT.y)*0.48}"
          stroke-width="5.5" stroke="var(--bg-elevated)" stroke-linecap="round" opacity="0.7"/>
    <!-- Spring coil marks on body -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="5" stroke="var(--bg-base)"
          stroke-dasharray="0 22 7 22 7 22 7 22" stroke-linecap="round" opacity="0.35"/>
    <!-- Air can / reservoir (small cylinder at bottom) -->
    <line x1="${SHB.x + 10}" y1="${SHB.y - 4}"
          x2="${SHB.x + 26}" y2="${SHB.y - 14}"
          stroke-width="8" stroke-linecap="round" opacity="0.7"/>
    <!-- Upper eyelet -->
    <circle cx="${SHT.x}" cy="${SHT.y}" r="7" fill="var(--bg-base)" stroke-width="3.5"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="3" fill="currentColor" stroke="none"/>
    <!-- Lower eyelet -->
    <circle cx="${SHB.x}" cy="${SHB.y}" r="7" fill="var(--bg-base)" stroke-width="3.5"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="3" fill="currentColor" stroke="none"/>
  </g>

  <!-- ── FORK ───────────────────────────────────────────── -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <!-- Crown arch (connects stanchions at top) -->
    <path d="M ${FL.l.sx - 2} ${FL.l.sy + 4}
             Q ${(FL.l.sx + FL.r.sx)/2} ${FL.l.sy - 8}
               ${FL.r.sx + 2} ${FL.r.sy + 4}"
          fill="none" stroke-width="10" stroke-linecap="round"/>
    <!-- Left stanchion (upper tube, 36mm = thick) -->
    <line x1="${FL.l.sx}" y1="${FL.l.sy}"
          x2="${FL.l.mx}" y2="${FL.l.my}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Right stanchion -->
    <line x1="${FL.r.sx}" y1="${FL.r.sy}"
          x2="${FL.r.mx}" y2="${FL.r.my}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Left lower (wider, aluminum casting) -->
    <line x1="${FL.l.mx - 1}" y1="${FL.l.my}"
          x2="${FL.l.ex}" y2="${FL.l.ey}"
          stroke-width="14" stroke-linecap="round"/>
    <!-- Right lower -->
    <line x1="${FL.r.mx + 1}" y1="${FL.r.my}"
          x2="${FL.r.ex}" y2="${FL.r.ey}"
          stroke-width="14" stroke-linecap="round"/>
    <!-- Stanchion/lower junction band (dust seal area) -->
    <line x1="${FL.l.mx - 4}" y1="${FL.l.my}"
          x2="${FL.r.mx + 4}" y2="${FL.r.my}"
          stroke-width="7" stroke-linecap="round" opacity="0.65"/>
    <!-- Lower arch brace (near axle) -->
    <line x1="${FL.l.ex - 2}" y1="${FL.l.ey - 20}"
          x2="${FL.r.ex + 2}" y2="${FL.r.ey - 20}"
          stroke-width="6" stroke-linecap="round" opacity="0.7"/>
    <!-- Brake caliper mount (tab on left lower) -->
    <rect x="${FL.l.ex - 20}" y="${FL.l.ey - 60}" width="14" height="26"
          rx="3" fill="none" stroke-width="3" opacity="0.65"/>
    <!-- Axle -->
    <line x1="${FL.l.ex - 8}" y1="${FL.l.ey + 2}"
          x2="${FL.r.ex + 8}" y2="${FL.r.ey + 2}"
          stroke-width="7" stroke-linecap="round"/>
    <!-- Click zone -->
    <rect class="zone-overlay" x="490" y="100" width="162" height="268" rx="14" data-zone="fork"/>
  </g>

  <!-- ── HANDLEBARS ─────────────────────────────────────── -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Stem body -->
    <line x1="${HT.x + 3}" y1="${HT.y + 2}"
          x2="${HT.x - 3}" y2="${HT.y - 44}"
          stroke-width="7" stroke-linecap="round"/>
    <!-- Stem faceplate -->
    <rect x="${HT.x - 13}" y="${HT.y - 50}" width="22" height="10" rx="3"
          fill="var(--bg-elevated)" stroke-width="3.5"/>
    <!-- Bar tube — 800mm wide -->
    <line x1="${HT.x - 66}" y1="${HT.y - 48}"
          x2="${HT.x + 60}" y2="${HT.y - 48}"
          stroke-width="8.5" stroke-linecap="round"/>
    <!-- Grip left (thick rubber) -->
    <line x1="${HT.x - 62}" y1="${HT.y - 48}"
          x2="${HT.x - 72}" y2="${HT.y - 50}"
          stroke-width="16" stroke-linecap="round" opacity="0.6"/>
    <!-- Grip right -->
    <line x1="${HT.x + 56}" y1="${HT.y - 48}"
          x2="${HT.x + 66}" y2="${HT.y - 50}"
          stroke-width="16" stroke-linecap="round" opacity="0.6"/>
    <!-- Bar sweep (slight downward curve at ends) -->
    <path d="M ${HT.x - 62} ${HT.y - 48}
             Q ${HT.x - 68} ${HT.y - 46}
               ${HT.x - 70} ${HT.y - 42}"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <path d="M ${HT.x + 56} ${HT.y - 48}
             Q ${HT.x + 62} ${HT.y - 46}
               ${HT.x + 64} ${HT.y - 42}"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Brake lever left -->
    <path d="M ${HT.x - 50} ${HT.y - 48}
             L ${HT.x - 58} ${HT.y - 36}"
          fill="none" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    <!-- Brake lever right -->
    <path d="M ${HT.x + 44} ${HT.y - 48}
             L ${HT.x + 52} ${HT.y - 36}"
          fill="none" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    <!-- Click zone -->
    <rect class="zone-overlay" x="${HT.x - 88}" y="${HT.y - 74}" width="172" height="88" rx="10" data-zone="handlebar"/>
  </g>

  <!-- ── DROPPER / SADDLE ───────────────────────────────── -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <!-- Seat clamp collar -->
    <rect x="${ST.x - 10}" y="${ST.y - 5}" width="20" height="12" rx="3"
          fill="var(--bg-elevated)" stroke-width="3"/>
    <!-- Seatpost tube -->
    <line x1="${ST.x}" y1="${ST.y + 3}"
          x2="${ST.x - 5}" y2="${ST.y - 52}"
          stroke-width="7" stroke-linecap="round"/>
    <!-- Saddle rails -->
    <line x1="${ST.x - 32}" y1="${ST.y - 53}"
          x2="${ST.x + 30}" y2="${ST.y - 53}"
          stroke-width="3" stroke-linecap="round" opacity="0.55"/>
    <!-- Saddle top surface (curved) -->
    <path d="M ${ST.x - 36} ${ST.y - 55}
             C ${ST.x - 20} ${ST.y - 66}
               ${ST.x + 5}  ${ST.y - 68}
               ${ST.x + 38} ${ST.y - 55}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Saddle body fill -->
    <path d="M ${ST.x - 38} ${ST.y - 53}
             C ${ST.x - 20} ${ST.y - 65}
               ${ST.x + 5}  ${ST.y - 67}
               ${ST.x + 40} ${ST.y - 53}
             L ${ST.x + 40} ${ST.y - 48}
             C ${ST.x + 5}  ${ST.y - 63}
               ${ST.x - 20} ${ST.y - 61}
               ${ST.x - 38} ${ST.y - 48} Z"
          fill="currentColor" stroke="none" opacity="0.4"/>
    <!-- Dropper remote indicator -->
    <circle cx="${ST.x - 5}" cy="${ST.y - 24}" r="3.5"
            fill="none" stroke-width="2" opacity="0.5"/>
    <!-- Click zone -->
    <rect class="zone-overlay" x="${ST.x - 56}" y="${ST.y - 86}" width="122" height="118" rx="10" data-zone="dropper"/>
  </g>

  <!-- ── DRIVETRAIN ─────────────────────────────────────── -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <!-- Chainring outer -->
    <circle cx="${BB.x}" cy="${BB.y}" r="32" fill="none" stroke-width="6"/>
    <!-- Chainring inner detail -->
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="2" opacity="0.35"/>
    <!-- Crank arm forward -->
    <line x1="${BB.x}" y1="${BB.y}"
          x2="${BB.x + 38}" y2="${BB.y + 28}"
          stroke-width="8" stroke-linecap="round"/>
    <!-- Pedal forward -->
    <line x1="${BB.x + 34}" y1="${BB.y + 26}"
          x2="${BB.x + 48}" y2="${BB.y + 21}"
          stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <!-- Crank arm back -->
    <line x1="${BB.x}" y1="${BB.y}"
          x2="${BB.x - 38}" y2="${BB.y - 28}"
          stroke-width="8" stroke-linecap="round"/>
    <!-- Pedal back -->
    <line x1="${BB.x - 34}" y1="${BB.y - 26}"
          x2="${BB.x - 48}" y2="${BB.y - 21}"
          stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <!-- Chain upper run -->
    <path d="M ${BB.x - 4} ${BB.y - 32}
             Q ${(BB.x + RW.x)/2} ${BB.y - 40}
               ${RW.x} ${RW.y - 22}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.35"/>
    <!-- Chain lower run -->
    <path d="M ${BB.x + 2} ${BB.y + 32}
             Q ${(BB.x + RW.x)/2 + 10} ${BB.y + 22}
               ${RW.x} ${RW.y + 10}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.35"/>
    <!-- Cassette (stacked rings at rear hub) -->
    <circle cx="${RW.x}" cy="${RW.y}" r="26" fill="none" stroke-width="5.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="20" fill="none" stroke-width="3.5" opacity="0.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="14" fill="none" stroke-width="2.5" opacity="0.3"/>
    <!-- Rear derailleur -->
    <path d="M ${RW.x + 22} ${RW.y + 16}
             Q ${RW.x + 44} ${RW.y + 40}
               ${RW.x + 32} ${RW.y + 58}"
          fill="none" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${RW.x + 30}" cy="${RW.y + 60}" r="8" fill="none" stroke-width="3"/>
    <circle cx="${RW.x + 30}" cy="${RW.y + 60}" r="3" fill="currentColor" stroke="none" opacity="0.5"/>
    <!-- BB shell -->
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <!-- Click zone -->
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="56" data-zone="drivetrain"/>
  </g>

  <!-- ── FRAME ZONE (clickable area for frame tubes) ─────── -->
  <!-- Rendered BEFORE shock zone so shock overlay wins in overlap area -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <!-- Approximate polygon of main triangle for hit-testing -->
    <polygon class="zone-overlay"
      points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}"
      data-zone="frame" style="opacity:0"/>
    <!-- Seat tube strip -->
    <rect class="zone-overlay"
      x="${ST.x - 18}" y="${ST.y - 5}" width="36" height="${BB.y - ST.y + 10}"
      rx="10" data-zone="frame"/>
    <!-- Top tube strip -->
    <rect class="zone-overlay"
      x="${ST.x - 5}" y="${HT.y - 14}" width="${HT.x - ST.x + 14}" height="38"
      rx="10" transform="rotate(-24 ${ST.x} ${ST.y})" data-zone="frame"/>
  </g>

  <!-- ── SHOCK ZONE (rendered LAST → always on top and clickable) ── -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <!-- Invisible overlay — large enough to be easy to click -->
    <ellipse class="zone-overlay"
      cx="${(SHT.x + SHB.x) / 2}"
      cy="${(SHT.y + SHB.y) / 2}"
      rx="36" ry="90"
      transform="rotate(-28 ${(SHT.x + SHB.x) / 2} ${(SHT.y + SHB.y) / 2})"
      data-zone="shock"/>
  </g>

</svg>`;
}

// ── HARDTAIL MTB ──────────────────────────────────────────
function svgHardtail(isDJ = false) {
  const RW = { x: 165, y: 340 };
  const FW = { x: 618, y: 340 };
  const BB = { x: 380, y: 356 };
  const ST = isDJ ? { x: 348, y: 188 } : { x: 335, y: 176 };
  const HT = isDJ ? { x: 515, y: 125 } : { x: 502, y: 91  };
  const HC = isDJ ? { x: 543, y: 202 } : { x: 538, y: 168 };
  // Seatstay attaches to seat tube (rigid rear triangle)
  const SS = { x: ST.x - 4, y: ST.y + 52 };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- Rigid rear triangle -->
  <g class="bike-part">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-60} ${BB.y-4} ${RW.x+80} ${RW.y-4} ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x-4} ${BB.y+8} C ${BB.x-64} ${BB.y+4} ${RW.x+78} ${RW.y+8} ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.42"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+8}" y1="${RW.y}" x2="${SS.x+7}" y2="${SS.y}" stroke-width="3" stroke-linecap="round" opacity="0.38"/>
    <line x1="${RW.x+14}" y1="${RW.y-20}" x2="${RW.x+22}" y2="${RW.y-24}" stroke-width="3.5" stroke-linecap="round" opacity="0.55"/>
  </g>

  <!-- Main frame -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="14" stroke-linecap="round"/>
    <rect class="zone-overlay" x="255" y="88" width="318" height="296" rx="14" data-zone="frame"/>
  </g>

  <!-- Fork -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <path d="M ${HC.x-3} ${HC.y+4} Q ${HC.x+10} ${HC.y-8} ${HC.x+12} ${HC.y+4}"
          fill="none" stroke-width="10" stroke-linecap="round"/>
    ${isDJ ? `
    <line x1="${HC.x-2}" y1="${HC.y+6}" x2="${FW.x-7}" y2="${FW.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${HC.x+10}" y1="${HC.y+6}" x2="${FW.x+7}" y2="${FW.y}" stroke-width="8" stroke-linecap="round"/>
    ` : `
    <line x1="${HC.x-2}" y1="${HC.y+4}" x2="${HC.x+42}" y2="${HC.y+95}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${HC.x+12}" y1="${HC.y+4}" x2="${HC.x+57}" y2="${HC.y+96}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${HC.x+42}" y1="${HC.y+95}" x2="${FW.x-5}" y2="${FW.y}" stroke-width="14" stroke-linecap="round"/>
    <line x1="${HC.x+57}" y1="${HC.y+96}" x2="${FW.x+10}" y2="${FW.y}" stroke-width="14" stroke-linecap="round"/>
    <line x1="${HC.x+40}" y1="${HC.y+94}" x2="${HC.x+59}" y2="${HC.y+95}" stroke-width="7" stroke-linecap="round" opacity="0.65"/>
    <line x1="${FW.x-4}" y1="${FW.y-22}" x2="${FW.x+10}" y2="${FW.y-22}" stroke-width="6" stroke-linecap="round"/>
    <rect x="${FW.x-18}" y="${FW.y-58}" width="14" height="24" rx="3" fill="none" stroke-width="3" opacity="0.65"/>
    <line x1="${FW.x-6}" y1="${FW.y+2}" x2="${FW.x+12}" y2="${FW.y+2}" stroke-width="7" stroke-linecap="round"/>
    `}
    <rect class="zone-overlay" x="494" y="100" width="158" height="264" rx="14" data-zone="fork"/>
  </g>

  <!-- Handlebars -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${HT.x+3}" y1="${HT.y+2}" x2="${HT.x-3}" y2="${HT.y-44}" stroke-width="7" stroke-linecap="round"/>
    <rect x="${HT.x-13}" y="${HT.y-50}" width="22" height="10" rx="3" fill="var(--bg-elevated)" stroke-width="3.5"/>
    ${isDJ ? `
    <line x1="${HT.x-4}" y1="${HT.y-44}" x2="${HT.x-4}" y2="${HT.y-76}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${HT.x-66}" y1="${HT.y-74}" x2="${HT.x+58}" y2="${HT.y-74}" stroke-width="8.5" stroke-linecap="round"/>
    <line x1="${HT.x-66}" y1="${HT.y-74}" x2="${HT.x-76}" y2="${HT.y-76}" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
    <line x1="${HT.x+58}" y1="${HT.y-74}" x2="${HT.x+68}" y2="${HT.y-76}" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
    ` : `
    <line x1="${HT.x-66}" y1="${HT.y-48}" x2="${HT.x+60}" y2="${HT.y-48}" stroke-width="8.5" stroke-linecap="round"/>
    <line x1="${HT.x-66}" y1="${HT.y-48}" x2="${HT.x-76}" y2="${HT.y-50}" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
    <line x1="${HT.x+60}" y1="${HT.y-48}" x2="${HT.x+70}" y2="${HT.y-50}" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
    <path d="M ${HT.x-66} ${HT.y-48} Q ${HT.x-72} ${HT.y-46} ${HT.x-74} ${HT.y-41}" fill="none" stroke-width="7" stroke-linecap="round"/>
    <path d="M ${HT.x+60} ${HT.y-48} Q ${HT.x+66} ${HT.y-46} ${HT.x+68} ${HT.y-41}" fill="none" stroke-width="7" stroke-linecap="round"/>
    <path d="M ${HT.x-52} ${HT.y-48} L ${HT.x-60} ${HT.y-36}" fill="none" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    <path d="M ${HT.x+46} ${HT.y-48} L ${HT.x+54} ${HT.y-36}" fill="none" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    `}
    <rect class="zone-overlay" x="${HT.x-92}" y="${HT.y-78}" width="178" height="88" rx="10" data-zone="handlebar"/>
  </g>

  <!-- Dropper/saddle -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-10}" y="${ST.y-5}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y+3}" x2="${ST.x-5}" y2="${ST.y-52}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${ST.x-32}" y1="${ST.y-53}" x2="${ST.x+30}" y2="${ST.y-53}" stroke-width="3" stroke-linecap="round" opacity="0.52"/>
    <path d="M ${ST.x-36} ${ST.y-55} C ${ST.x-20} ${ST.y-66} ${ST.x+5} ${ST.y-68} ${ST.x+38} ${ST.y-55}" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${ST.x-38} ${ST.y-53} C ${ST.x-20} ${ST.y-65} ${ST.x+5} ${ST.y-67} ${ST.x+40} ${ST.y-53} L ${ST.x+40} ${ST.y-48} C ${ST.x+5} ${ST.y-63} ${ST.x-20} ${ST.y-61} ${ST.x-38} ${ST.y-48} Z" fill="currentColor" stroke="none" opacity="0.4"/>
    <rect class="zone-overlay" x="${ST.x-56}" y="${ST.y-86}" width="122" height="118" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drivetrain -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="32" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="2" opacity="0.35"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+38}" y2="${BB.y+28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x+34}" y1="${BB.y+26}" x2="${BB.x+48}" y2="${BB.y+21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-38}" y2="${BB.y-28}" stroke-width="8" stroke-linecap="round"/>
    <path d="M ${BB.x-4} ${BB.y-32} Q ${(BB.x+RW.x)/2} ${BB.y-40} ${RW.x} ${RW.y-22}" fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.35"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="26" fill="none" stroke-width="5.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="20" fill="none" stroke-width="3.5" opacity="0.5"/>
    <path d="M ${RW.x+22} ${RW.y+16} Q ${RW.x+44} ${RW.y+40} ${RW.x+32} ${RW.y+58}" fill="none" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${RW.x+30}" cy="${RW.y+60}" r="8" fill="none" stroke-width="3"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="56" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── GRAVEL / ROAD ─────────────────────────────────────────
function svgGravelRoad(isRoad = false) {
  const RW = { x: 168, y: 340 };
  const FW = { x: 614, y: 340 };
  const BB = { x: 380, y: 350 };
  const HT = isRoad ? { x: 514, y: 120 } : { x: 508, y: 114 };
  const HC = isRoad ? { x: 536, y: 198 } : { x: 540, y: 206 };
  const ST = { x: 342, y: 172 };
  const SS = { x: ST.x - 5, y: ST.y + 48 };
  const tW = isRoad ? 6 : 14;

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${roadWheel(RW.x, RW.y, 'rear-wheel', tW)}
  ${roadWheel(FW.x, FW.y, 'front-wheel', tW)}

  <g class="bike-part">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-58} ${BB.y-3} ${RW.x+76} ${RW.y-3} ${RW.x} ${RW.y}" fill="none" stroke-width="${isRoad?4:5}" stroke-linecap="round"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="${isRoad?3.5:4.5}" stroke-linecap="round"/>
    <line x1="${RW.x+7}" y1="${RW.y}" x2="${SS.x+6}" y2="${SS.y}" stroke-width="${isRoad?2.5:3}" stroke-linecap="round" opacity="0.4"/>
  </g>

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?6:7}" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="${isRoad?5.5:6.5}" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="${isRoad?5:6}" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?10:11}" stroke-linecap="round"/>
    <rect class="zone-overlay" x="260" y="100" width="314" height="278" rx="14" data-zone="frame"/>
  </g>

  <g id="g-fork" class="bike-zone" data-zone="fork">
    <path d="M ${HC.x} ${HC.y} C ${HC.x+20} ${HC.y+55} ${FW.x+16} ${FW.y-65} ${FW.x+8} ${FW.y}" fill="none" stroke-width="${isRoad?5:6}" stroke-linecap="round"/>
    <path d="M ${HC.x+10} ${HC.y+2} C ${HC.x+30} ${HC.y+57} ${FW.x+26} ${FW.y-64} ${FW.x+18} ${FW.y}" fill="none" stroke-width="${isRoad?5:6}" stroke-linecap="round"/>
    <path d="M ${HC.x} ${HC.y} Q ${HC.x+5} ${HC.y-7} ${HC.x+10} ${HC.y+2}" fill="none" stroke-width="6" stroke-linecap="round"/>
    <rect class="zone-overlay" x="504" y="118" width="142" height="248" rx="12" data-zone="fork"/>
  </g>

  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${HT.x+2}" y1="${HT.y}" x2="${HT.x-2}" y2="${HT.y-36}" stroke-width="5.5" stroke-linecap="round"/>
    <rect x="${HT.x-11}" y="${HT.y-42}" width="19" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${HT.x-22}" y1="${HT.y-42}" x2="${HT.x+16}" y2="${HT.y-42}" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${HT.x-22} ${HT.y-42} C ${HT.x-32} ${HT.y-32} ${HT.x-36} ${HT.y-16} ${HT.x-28} ${HT.y-6}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${HT.x-28} ${HT.y-6} C ${HT.x-25} ${HT.y+2} ${HT.x-16} ${HT.y+7} ${HT.x-8} ${HT.y+7}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${HT.x+16} ${HT.y-42} C ${HT.x+20} ${HT.y-32} ${HT.x+20} ${HT.y-16} ${HT.x+14} ${HT.y-6}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${HT.x+14} ${HT.y-6} C ${HT.x+12} ${HT.y+2} ${HT.x+6} ${HT.y+7} ${HT.x} ${HT.y+7}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${HT.x-54}" y="${HT.y-64}" width="90" height="86" rx="10" data-zone="handlebar"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-9}" y="${ST.y-4}" width="18" height="10" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y+2}" x2="${ST.x-4}" y2="${ST.y-46}" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${ST.x-30} ${ST.y-49} C ${ST.x-14} ${ST.y-59} ${ST.x+8} ${ST.y-60} ${ST.x+32} ${ST.y-49}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x-32} ${ST.y-47} C ${ST.x-14} ${ST.y-58} ${ST.x+8} ${ST.y-59} ${ST.x+34} ${ST.y-47} L ${ST.x+34} ${ST.y-42} C ${ST.x+8} ${ST.y-55} ${ST.x-14} ${ST.y-54} ${ST.x-32} ${ST.y-42} Z" fill="currentColor" stroke="none" opacity="0.4"/>
    <rect class="zone-overlay" x="${ST.x-48}" y="${ST.y-76}" width="112" height="108" rx="10" data-zone="dropper"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="${isRoad?34:30}" fill="none" stroke-width="5.5"/>
    ${isRoad ? `<circle cx="${BB.x}" cy="${BB.y}" r="24" fill="none" stroke-width="4" opacity="0.45"/>` : ''}
    <circle cx="${BB.x}" cy="${BB.y}" r="18" fill="none" stroke-width="1.5" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+36}" y2="${BB.y+26}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${BB.x+32}" y1="${BB.y+24}" x2="${BB.x+46}" y2="${BB.y+19}" stroke-width="6" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-36}" y2="${BB.y-26}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="20" fill="none" stroke-width="4.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="13" fill="none" stroke-width="3" opacity="0.45"/>
    <path d="M ${RW.x+18} ${RW.y+12} Q ${RW.x+36} ${RW.y+32} ${RW.x+26} ${RW.y+46}" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="${RW.x+24}" cy="${RW.y+48}" r="7" fill="none" stroke-width="2.5"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="11" fill="var(--bg-base)" stroke="currentColor" stroke-width="3"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="52" data-zone="drivetrain"/>
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

export function createMiniSilhouette(bikeType) {
  const fake = {
    mtb:        { type:'mtb',        suspensionType:'full' },
    emtb:       { type:'emtb',       suspensionType:'full' },
    dirtjumper: { type:'dirtjumper', suspensionType:'hardtail' },
    gravel:     { type:'gravel' },
    road:       { type:'road' },
  };
  let svg = createSilhouette(fake[bikeType] || fake.mtb);
  svg = svg.replace(/id="bike-svg"/, 'class="mini-silhouette"');
  svg = svg.replace(/<[^>]* class="zone-overlay[^"]*"[^/]*\/>/g, '');
  svg = svg.replace(/<polygon[^>]*class="zone-overlay[^"]*"[^/]*\/>/g, '');
  svg = svg.replace(/id="g-[^"]*"/g, '');
  return svg;
}

// ── ZOOM ──────────────────────────────────────────────────
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
    _currentVB = lerpVB(startVB, targetVB, easeOutCubic(raw));
    svg.setAttribute('viewBox', _currentVB.join(' '));
    if (raw < 1) _animFrame = requestAnimationFrame(step);
  }
  _animFrame = requestAnimationFrame(step);
}

export function resetZoom(svg) {
  _activeZone = null;
  if (svg) animateViewBox(svg, VB_DEFAULT);
}

// ── ZONE INTERACTION ──────────────────────────────────────
export function setupZoneInteraction(container, bike, onZoneClick) {
  const svg = container.querySelector('#bike-svg');
  if (!svg) return;
  _currentVB = [...VB_DEFAULT];
  _activeZone = null;
  svg.setAttribute('viewBox', VB_DEFAULT.join(' '));

  const tooltip  = document.getElementById('zone-tooltip');
  const available = getAvailableZones(bike);

  svg.querySelectorAll('.zone-overlay').forEach(overlay => {
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
  const base = ['front-wheel','rear-wheel','fork','handlebar','drivetrain','dropper','frame'];
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
    case 'front-wheel': { const t = bl.frontTire; return t?.brand ? `${t.brand} ${t.model||''} ${t.psi ? '· '+t.psi+' psi':''}`.trim() : 'Not set'; }
    case 'rear-wheel':  { const t = bl.rearTire;  return t?.brand ? `${t.brand} ${t.model||''} ${t.psi ? '· '+t.psi+' psi':''}`.trim() : 'Not set'; }
    case 'fork':   { const f = bl.fork;  return f?.brand ? `${f.brand} ${f.model||''} ${f.type==='air'&&f.psi ? '· '+f.psi+' psi':f.type==='coil'?'· Coil':''}`.trim() : 'Not set'; }
    case 'shock':  { const s = bl.shock; return s?.brand ? `${s.brand} ${s.model||''} ${s.type==='air'&&s.psi ? '· '+s.psi+' psi':s.type==='coil'?'· Coil':''}`.trim() : 'Not set'; }
    case 'handlebar':  return bl.handlebar?.brand ? `${bl.handlebar.brand} ${bl.handlebar.model||''}`.trim() : 'Not set';
    case 'drivetrain': return bl.drivetrain?.brand ? `${bl.drivetrain.brand} ${bl.drivetrain.model||''}`.trim() : 'Not set';
    case 'dropper':    return bl.dropper?.brand    ? `${bl.dropper.brand} ${bl.dropper.model||''}`.trim()    : 'Not set';
    case 'frame':      return bl.frame?.brand      ? `${bl.frame.brand} ${bl.frame.model||''}`.trim()        : 'Not set';
    default: return '—';
  }
}

export { ZONE_META };
