// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams
// Geometry modeled on 2019 Santa Cruz Bronson
// All anchors mathematically derived, no guessing
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

const ZONE_META = {
  'front-wheel': { label: 'Front Wheel / Tire', vb: [448, 192, 280, 280], key: 'frontTire' },
  'rear-wheel':  { label: 'Rear Wheel / Tire',  vb: [0,   192, 280, 280], key: 'rearTire' },
  'fork':        { label: 'Fork',               vb: [548, 108, 220, 268], key: 'fork' },
  'shock':       { label: 'Rear Shock',         vb: [342, 108, 196, 222], key: 'shock' },
  'handlebar':   { label: 'Cockpit / Bars',     vb: [438,  32, 198, 188], key: 'handlebar' },
  'drivetrain':  { label: 'Drivetrain',         vb: [288, 295, 210, 178], key: 'drivetrain' },
  'dropper':     { label: 'Dropper / Saddle',   vb: [245,  58, 175, 218], key: 'dropper' },
  'frame':       { label: 'Frame / Geometry',   vb: [112,  88, 462, 312], key: 'frame' },
};

// ── WHEEL HELPERS ─────────────────────────────────────────
function wheelSpokes(cx, cy, r, count = 8) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * (r - 26);
    const y2 = cy + Math.sin(a) * (r - 26);
    s += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="1.2" opacity="0.32"/>`;
  }
  return s;
}

function mtbWheel(cx, cy, zoneId) {
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="112" fill="none" stroke-width="24"/>
    <circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke-width="1.5" stroke-dasharray="10 6" opacity="0.2"/>
    <circle cx="${cx}" cy="${cy}" r="86"  fill="none" stroke-width="3.5"/>
    ${wheelSpokes(cx, cy, 86)}
    <circle cx="${cx}" cy="${cy}" r="11" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="currentColor" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="126" data-zone="${zoneId}"/>
  </g>`;
}

function roadWheel(cx, cy, zoneId, tireW = 7) {
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke-width="${tireW}"/>
    <circle cx="${cx}" cy="${cy}" r="100" fill="none" stroke-width="2"/>
    ${wheelSpokes(cx, cy, 100)}
    <circle cx="${cx}" cy="${cy}" r="9"   fill="var(--bg-base)" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="currentColor" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="122" data-zone="${zoneId}"/>
  </g>`;
}

// ── FULL SUSPENSION MTB ───────────────────────────────────
// Bronson geometry:
//   Wheelbase 510px, BB drop, 76° SA, 65° HA
//   RW(148,350) FW(658,350) BB(382,368)
//   ST top(335,179)  — seat tube is one straight line BB→ST
//   HT top(552,123)  HC(587,198)  — 65° head angle
//   Seatpost continues same vector above ST
//   Seatstay meets seat tube at SS(358,279)  — mid-seat-tube
//   Shock: compact, SHT(416,155) on top-tube, SHB(388,262) on swingarm
//   Fork legs: dead straight, no bends
function svgMTBFS(hasMotor = false) {
  // ── Primary anchors ──
  const RW  = { x: 148, y: 350 };
  const FW  = { x: 658, y: 350 };
  const BB  = { x: 382, y: 368 };
  const ST  = { x: 335, y: 179 };   // seat tube top (straight line from BB)
  const HT  = { x: 552, y: 123 };   // head tube top
  const HC  = { x: 587, y: 198 };   // fork crown

  // Seatpost direction = same unit vector as seat tube
  // BB→ST: dx=-47, dy=-189, len=195
  const stUx = -47 / 195, stUy = -189 / 195;
  const POST = { x: ST.x + stUx * 58, y: ST.y + stUy * 58 }; // post top
  const SAD  = { x: POST.x, y: POST.y - 2 };                  // saddle centre

  // Seatstay junction (t=0.52 up seat tube from BB)
  const SS  = { x: 358, y: 279 };
  // Swingarm pivot (near BB)
  const PIV = { x: 352, y: 335 };

  // Shock mounts — compact, inside triangle
  const SHT = { x: 416, y: 158 };   // on top tube
  const SHB = { x: 390, y: 262 };   // on swingarm link

  // Fork legs — STRAIGHT lines, no mid-point bend
  // Direction from crown to FW axle: dx=71, dy=152 → unit=(0.424, 0.906)
  // Stanchion/lower split at 44% of leg length (crown→axle)
  // Left leg:  crown offset -7 from centre → (580,200) → (649,350)  split(611,261)
  // Right leg: crown offset +7              → (594,200) → (663,350)  split(625,262)
  const F = {
    lTop: { x: 580, y: 200 }, lSplit: { x: 611, y: 261 }, lBot: { x: 648, y: 350 },
    rTop: { x: 594, y: 200 }, rSplit: { x: 626, y: 262 }, rBot: { x: 662, y: 350 },
  };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <!-- ── 1. WHEELS ── -->
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- ── 2. REAR TRIANGLE (non-clickable geometry) ── -->
  <g class="bike-part">
    <!-- Chainstay (BB → RW) — two lines for tube illusion -->
    <path d="M ${BB.x} ${BB.y}
             C ${BB.x - 55} ${BB.y}
               ${RW.x + 90} ${RW.y - 2}
               ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x - 3} ${BB.y + 9}
             C ${BB.x - 58} ${BB.y + 9}
               ${RW.x + 88} ${RW.y + 9}
               ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.38"/>

    <!-- Seatstay: RW axle → seat tube junction SS -->
    <line x1="${RW.x}"  y1="${RW.y}"  x2="${SS.x}" y2="${SS.y}"
          stroke-width="5" stroke-linecap="round"/>
    <!-- Second seatstay rail (tube depth) -->
    <line x1="${RW.x + 9}" y1="${RW.y}" x2="${SS.x + 8}" y2="${SS.y}"
          stroke-width="3" stroke-linecap="round" opacity="0.36"/>

    <!-- Swingarm pivot -->
    <circle cx="${PIV.x}" cy="${PIV.y}" r="7.5"
            fill="var(--bg-base)" stroke-width="3.5"/>
    <circle cx="${PIV.x}" cy="${PIV.y}" r="3"
            fill="currentColor" stroke="none"/>
    <!-- Swingarm link: pivot → SS -->
    <line x1="${PIV.x}" y1="${PIV.y}" x2="${SS.x}" y2="${SS.y}"
          stroke-width="3.5" stroke-linecap="round" opacity="0.55"/>
  </g>

  <!-- ── 3. MAIN FRAME (#g-frame must wrap all tube visuals for hover) ── -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <!-- Down tube: BB → HC (thickest tube) -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}"
          stroke-width="11" stroke-linecap="round"/>
    <!-- Seat tube: BB → ST (one perfectly straight line) -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}"
          stroke-width="7.5" stroke-linecap="round"/>
    <!-- Top tube: ST → HT -->
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Head tube: HT → HC (thick, short, angled) -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}"
          stroke-width="15" stroke-linecap="round"/>
    ${hasMotor ? `
    <!-- Motor -->
    <rect x="${BB.x - 38}" y="${BB.y - 50}" width="62" height="44" rx="9"
          fill="none" stroke-width="3" opacity="0.68"/>
    <line x1="${BB.x - 38}" y1="${BB.y - 28}" x2="${BB.x + 24}" y2="${BB.y - 28}"
          stroke-width="1.5" opacity="0.38"/>` : ''}

    <!-- Frame hover zone — large transparent rect covering main triangle -->
    <polygon class="zone-overlay"
      points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y} ${BB.x},${BB.y}"
      data-zone="frame"/>
    <!-- Extra strip along seat tube so it registers even where seatstay crosses -->
    <rect class="zone-overlay"
      x="${Math.min(BB.x, ST.x) - 20}" y="${ST.y - 8}"
      width="52" height="${BB.y - ST.y + 16}"
      rx="8" data-zone="frame"/>
  </g>

  <!-- ── 4. DRIVETRAIN ── -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="33" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="2" opacity="0.32"/>
    <!-- Crank forward -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x + 38}" y2="${BB.y + 28}"
          stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x + 34}" y1="${BB.y + 26}" x2="${BB.x + 50}" y2="${BB.y + 21}"
          stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <!-- Crank back -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x - 38}" y2="${BB.y - 28}"
          stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x - 34}" y1="${BB.y - 26}" x2="${BB.x - 50}" y2="${BB.y - 21}"
          stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <!-- Chain lines -->
    <path d="M ${BB.x - 4} ${BB.y - 33}
             Q ${(BB.x + RW.x) / 2} ${BB.y - 42} ${RW.x} ${RW.y - 24}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.32"/>
    <path d="M ${BB.x + 4} ${BB.y + 33}
             Q ${(BB.x + RW.x) / 2 + 8} ${BB.y + 24} ${RW.x} ${RW.y + 12}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.32"/>
    <!-- Cassette -->
    <circle cx="${RW.x}" cy="${RW.y}" r="27" fill="none" stroke-width="5.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="21" fill="none" stroke-width="3.5" opacity="0.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15" fill="none" stroke-width="2"   opacity="0.28"/>
    <!-- RD -->
    <path d="M ${RW.x + 24} ${RW.y + 18}
             Q ${RW.x + 46} ${RW.y + 42}
               ${RW.x + 34} ${RW.y + 60}"
          fill="none" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${RW.x + 32}" cy="${RW.y + 62}" r="9" fill="none" stroke-width="3"/>
    <circle cx="${RW.x + 32}" cy="${RW.y + 62}" r="3.5" fill="currentColor" stroke="none" opacity="0.45"/>
    <!-- BB shell -->
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>

  <!-- ── 5. DROPPER / SADDLE ── -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <!-- Seat clamp -->
    <rect x="${ST.x - 10}" y="${ST.y - 6}" width="20" height="12" rx="3"
          fill="var(--bg-elevated)" stroke-width="3"/>
    <!-- Seatpost: continues exactly same angle as seat tube (stUx, stUy) -->
    <line x1="${ST.x}" y1="${ST.y}"
          x2="${POST.x}" y2="${POST.y}"
          stroke-width="7" stroke-linecap="round"/>
    <!-- Saddle rails -->
    <line x1="${SAD.x - 34}" y1="${SAD.y - 2}"
          x2="${SAD.x + 30}" y2="${SAD.y - 2}"
          stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    <!-- Saddle top surface -->
    <path d="M ${SAD.x - 38} ${SAD.y - 4}
             C ${SAD.x - 22} ${SAD.y - 15}
               ${SAD.x +  4} ${SAD.y - 17}
               ${SAD.x + 40} ${SAD.y - 4}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Saddle body fill -->
    <path d="M ${SAD.x - 40} ${SAD.y - 2}
             C ${SAD.x - 22} ${SAD.y - 14}
               ${SAD.x +  4} ${SAD.y - 16}
               ${SAD.x + 42} ${SAD.y - 2}
             L ${SAD.x + 42} ${SAD.y + 3}
             C ${SAD.x +  4} ${SAD.y - 11}
               ${SAD.x - 22} ${SAD.y -  9}
               ${SAD.x - 40} ${SAD.y + 3} Z"
          fill="currentColor" stroke="none" opacity="0.42"/>
    <rect class="zone-overlay"
          x="${POST.x - 54}" y="${POST.y - 30}"
          width="116" height="${ST.y - POST.y + 50}" rx="10" data-zone="dropper"/>
  </g>

  <!-- ── 6. HANDLEBARS ── -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Stem -->
    <line x1="${HT.x + 3}" y1="${HT.y + 2}"
          x2="${HT.x - 3}" y2="${HT.y - 46}"
          stroke-width="7.5" stroke-linecap="round"/>
    <!-- Faceplate -->
    <rect x="${HT.x - 13}" y="${HT.y - 52}" width="22" height="10" rx="3"
          fill="var(--bg-elevated)" stroke-width="3.5"/>
    <!-- Bar tube -->
    <line x1="${HT.x - 68}" y1="${HT.y - 50}"
          x2="${HT.x + 62}" y2="${HT.y - 50}"
          stroke-width="8.5" stroke-linecap="round"/>
    <!-- Grips -->
    <line x1="${HT.x - 64}" y1="${HT.y - 50}"
          x2="${HT.x - 74}" y2="${HT.y - 52}"
          stroke-width="16" stroke-linecap="round" opacity="0.58"/>
    <line x1="${HT.x + 58}" y1="${HT.y - 50}"
          x2="${HT.x + 68}" y2="${HT.y - 52}"
          stroke-width="16" stroke-linecap="round" opacity="0.58"/>
    <!-- Sweep at bar ends -->
    <path d="M ${HT.x - 64} ${HT.y - 50}
             Q ${HT.x - 70} ${HT.y - 48}
               ${HT.x - 72} ${HT.y - 43}"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <path d="M ${HT.x + 58} ${HT.y - 50}
             Q ${HT.x + 64} ${HT.y - 48}
               ${HT.x + 66} ${HT.y - 43}"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Brake levers -->
    <path d="M ${HT.x - 52} ${HT.y - 50} L ${HT.x - 60} ${HT.y - 37}"
          fill="none" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    <path d="M ${HT.x + 46} ${HT.y - 50} L ${HT.x + 54} ${HT.y - 37}"
          fill="none" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    <rect class="zone-overlay"
          x="${HT.x - 90}" y="${HT.y - 78}"
          width="178" height="88" rx="10" data-zone="handlebar"/>
  </g>

  <!-- ── 7. FORK (straight legs — zero bend) ── -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <!-- Crown bridge (connects both stanchions at top) -->
    <line x1="${F.lTop.x - 2}" y1="${F.lTop.y}"
          x2="${F.rTop.x + 2}" y2="${F.rTop.y}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- LEFT: stanchion (thin upper) -->
    <line x1="${F.lTop.x}" y1="${F.lTop.y}"
          x2="${F.lSplit.x}" y2="${F.lSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- LEFT: lower leg (thick casting) -->
    <line x1="${F.lSplit.x}" y1="${F.lSplit.y}"
          x2="${F.lBot.x}"   y2="${F.lBot.y}"
          stroke-width="15" stroke-linecap="round"/>
    <!-- RIGHT: stanchion -->
    <line x1="${F.rTop.x}" y1="${F.rTop.y}"
          x2="${F.rSplit.x}" y2="${F.rSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- RIGHT: lower leg -->
    <line x1="${F.rSplit.x}" y1="${F.rSplit.y}"
          x2="${F.rBot.x}"   y2="${F.rBot.y}"
          stroke-width="15" stroke-linecap="round"/>
    <!-- Dust seal band at stanchion/lower junction -->
    <line x1="${F.lSplit.x - 3}" y1="${F.lSplit.y}"
          x2="${F.rSplit.x + 3}" y2="${F.rSplit.y}"
          stroke-width="8" stroke-linecap="round" opacity="0.62"/>
    <!-- Lower arch brace near axle -->
    <line x1="${F.lBot.x - 2}" y1="${F.lBot.y - 22}"
          x2="${F.rBot.x + 2}" y2="${F.rBot.y - 22}"
          stroke-width="6" stroke-linecap="round" opacity="0.65"/>
    <!-- Brake caliper tab -->
    <rect x="${F.lBot.x - 20}" y="${F.lBot.y - 62}"
          width="14" height="28" rx="3"
          fill="none" stroke-width="3" opacity="0.6"/>
    <!-- Axle -->
    <line x1="${F.lBot.x - 10}" y1="${F.lBot.y + 2}"
          x2="${F.rBot.x + 10}" y2="${F.rBot.y + 2}"
          stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="548" y="108" width="148" height="268" rx="14" data-zone="fork"/>
  </g>

  <!-- ── 8. REAR SHOCK (rendered LAST — always on top, always clickable) ── -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <!-- Shock body — compact, thin, angled inside main triangle -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="9" stroke-linecap="round"/>
    <!-- Shaft (lighter inner tube — upper portion) -->
    <line x1="${SHT.x}" y1="${SHT.y}"
          x2="${SHT.x + (SHB.x - SHT.x) * 0.46}"
          y2="${SHT.y + (SHB.y - SHT.y) * 0.46}"
          stroke-width="4.5" stroke="var(--bg-elevated)" stroke-linecap="round" opacity="0.75"/>
    <!-- Spring bands -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="4" stroke="var(--bg-base)"
          stroke-dasharray="0 18 6 18 6 18" stroke-linecap="round" opacity="0.38"/>
    <!-- Small piggyback reservoir -->
    <line x1="${SHB.x + 9}"  y1="${SHB.y - 3}"
          x2="${SHB.x + 22}" y2="${SHB.y - 12}"
          stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <!-- Upper eyelet -->
    <circle cx="${SHT.x}" cy="${SHT.y}" r="6.5"
            fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="2.5" fill="currentColor" stroke="none"/>
    <!-- Lower eyelet -->
    <circle cx="${SHB.x}" cy="${SHB.y}" r="6.5"
            fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="2.5" fill="currentColor" stroke="none"/>
    <!-- Click zone (rotated ellipse around shock body) -->
    <ellipse class="zone-overlay"
      cx="${(SHT.x + SHB.x) / 2}"
      cy="${(SHT.y + SHB.y) / 2}"
      rx="32" ry="68"
      transform="rotate(-15 ${(SHT.x + SHB.x) / 2} ${(SHT.y + SHB.y) / 2})"
      data-zone="shock"/>
  </g>

</svg>`;
}

// ── HARDTAIL MTB ──────────────────────────────────────────
function svgHardtail(isDJ = false) {
  const RW  = { x: 148, y: 350 };
  const FW  = { x: 658, y: 350 };
  const BB  = { x: 382, y: 368 };
  const ST  = isDJ ? { x: 345, y: 185 } : { x: 335, y: 179 };
  const HT  = isDJ ? { x: 558, y: 135 } : { x: 552, y: 123 };
  const HC  = isDJ ? { x: 590, y: 210 } : { x: 587, y: 198 };
  const SS  = { x: ST.x - 2, y: ST.y + 68 };   // seatstay meets seat tube

  // Seatpost same direction as seat tube
  const dx = ST.x - BB.x, dy = ST.y - BB.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const POST = { x: ST.x + ux * 56, y: ST.y + uy * 56 };
  const SAD  = { x: POST.x, y: POST.y - 2 };

  // Fork: straight legs
  const fDx = FW.x - HC.x, fDy = FW.y - HC.y;
  const fLen = Math.sqrt(fDx * fDx + fDy * fDy);
  const fUx = fDx / fLen, fUy = fDy / fLen;
  const fSplit = 0.44;
  const F = {
    lTop:  { x: HC.x - 8,  y: HC.y + 2 },
    rTop:  { x: HC.x + 8,  y: HC.y + 2 },
    lSplit:{ x: HC.x - 8  + fUx * fLen * fSplit, y: HC.y + 2 + fUy * fLen * fSplit },
    rSplit:{ x: HC.x + 8  + fUx * fLen * fSplit, y: HC.y + 2 + fUy * fLen * fSplit },
    lBot:  { x: FW.x - 9,  y: FW.y },
    rBot:  { x: FW.x + 9,  y: FW.y },
  };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- Rigid rear triangle -->
  <g class="bike-part">
    <path d="M ${BB.x} ${BB.y}
             C ${BB.x - 55} ${BB.y} ${RW.x + 88} ${RW.y - 2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x - 3} ${BB.y + 9}
             C ${BB.x - 58} ${BB.y + 9} ${RW.x + 86} ${RW.y + 9} ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.36"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x}" y2="${SS.y}"
          stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x + 9}" y1="${RW.y}" x2="${SS.x + 8}" y2="${SS.y}"
          stroke-width="3" stroke-linecap="round" opacity="0.34"/>
  </g>

  <!-- Main frame -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    <polygon class="zone-overlay"
      points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}"
      data-zone="frame"/>
    <rect class="zone-overlay"
      x="${Math.min(BB.x, ST.x) - 18}" y="${ST.y - 6}"
      width="48" height="${BB.y - ST.y + 12}" rx="8" data-zone="frame"/>
  </g>

  <!-- Fork -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${F.lTop.x - 1}" y1="${F.lTop.y}" x2="${F.rTop.x + 1}" y2="${F.rTop.y}"
          stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lTop.x}" y1="${F.lTop.y}" x2="${F.lSplit.x}" y2="${F.lSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.rTop.x}" y1="${F.rTop.y}" x2="${F.rSplit.x}" y2="${F.rSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    ${isDJ
      ? `<!-- DJ: rigid legs -->
         <line x1="${F.lSplit.x}" y1="${F.lSplit.y}" x2="${F.lBot.x}" y2="${F.lBot.y}" stroke-width="10" stroke-linecap="round"/>
         <line x1="${F.rSplit.x}" y1="${F.rSplit.y}" x2="${F.rBot.x}" y2="${F.rBot.y}" stroke-width="10" stroke-linecap="round"/>`
      : `<!-- HT: lowers (fat) -->
         <line x1="${F.lSplit.x}" y1="${F.lSplit.y}" x2="${F.lBot.x}" y2="${F.lBot.y}" stroke-width="15" stroke-linecap="round"/>
         <line x1="${F.rSplit.x}" y1="${F.rSplit.y}" x2="${F.rBot.x}" y2="${F.rBot.y}" stroke-width="15" stroke-linecap="round"/>
         <line x1="${F.lSplit.x - 2}" y1="${F.lSplit.y}" x2="${F.rSplit.x + 2}" y2="${F.rSplit.y}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
         <line x1="${F.lBot.x - 2}" y1="${F.lBot.y - 22}" x2="${F.rBot.x + 2}" y2="${F.rBot.y - 22}" stroke-width="6" stroke-linecap="round" opacity="0.62"/>
         <rect x="${F.lBot.x - 20}" y="${F.lBot.y - 62}" width="14" height="28" rx="3" fill="none" stroke-width="3" opacity="0.6"/>`
    }
    <line x1="${F.lBot.x - 10}" y1="${F.lBot.y + 2}" x2="${F.rBot.x + 10}" y2="${F.rBot.y + 2}" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="548" y="108" width="148" height="268" rx="14" data-zone="fork"/>
  </g>

  <!-- Handlebars -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${HT.x + 3}" y1="${HT.y + 2}" x2="${HT.x - 3}" y2="${HT.y - 46}" stroke-width="7.5" stroke-linecap="round"/>
    <rect x="${HT.x - 13}" y="${HT.y - 52}" width="22" height="10" rx="3" fill="var(--bg-elevated)" stroke-width="3.5"/>
    ${isDJ
      ? `<line x1="${HT.x - 4}" y1="${HT.y - 46}" x2="${HT.x - 4}" y2="${HT.y - 80}" stroke-width="7" stroke-linecap="round"/>
         <line x1="${HT.x - 70}" y1="${HT.y - 78}" x2="${HT.x + 62}" y2="${HT.y - 78}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${HT.x - 70}" y1="${HT.y - 78}" x2="${HT.x - 80}" y2="${HT.y - 80}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>
         <line x1="${HT.x + 62}" y1="${HT.y - 78}" x2="${HT.x + 72}" y2="${HT.y - 80}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>`
      : `<line x1="${HT.x - 68}" y1="${HT.y - 50}" x2="${HT.x + 62}" y2="${HT.y - 50}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${HT.x - 64}" y1="${HT.y - 50}" x2="${HT.x - 74}" y2="${HT.y - 52}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>
         <line x1="${HT.x + 58}" y1="${HT.y - 50}" x2="${HT.x + 68}" y2="${HT.y - 52}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>
         <path d="M ${HT.x - 64} ${HT.y - 50} Q ${HT.x - 70} ${HT.y - 48} ${HT.x - 72} ${HT.y - 43}" fill="none" stroke-width="7" stroke-linecap="round"/>
         <path d="M ${HT.x + 58} ${HT.y - 50} Q ${HT.x + 64} ${HT.y - 48} ${HT.x + 66} ${HT.y - 43}" fill="none" stroke-width="7" stroke-linecap="round"/>
         <path d="M ${HT.x - 52} ${HT.y - 50} L ${HT.x - 60} ${HT.y - 37}" fill="none" stroke-width="4" stroke-linecap="round" opacity="0.62"/>
         <path d="M ${HT.x + 46} ${HT.y - 50} L ${HT.x + 54} ${HT.y - 37}" fill="none" stroke-width="4" stroke-linecap="round" opacity="0.62"/>`
    }
    <rect class="zone-overlay" x="${HT.x - 92}" y="${HT.y - 80}" width="180" height="90" rx="10" data-zone="handlebar"/>
  </g>

  <!-- Dropper/saddle -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x - 10}" y="${ST.y - 6}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${SAD.x - 34}" y1="${SAD.y - 2}" x2="${SAD.x + 30}" y2="${SAD.y - 2}" stroke-width="2.5" stroke-linecap="round" opacity="0.48"/>
    <path d="M ${SAD.x - 38} ${SAD.y - 4} C ${SAD.x - 22} ${SAD.y - 15} ${SAD.x + 4} ${SAD.y - 17} ${SAD.x + 40} ${SAD.y - 4}" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${SAD.x - 40} ${SAD.y - 2} C ${SAD.x - 22} ${SAD.y - 14} ${SAD.x + 4} ${SAD.y - 16} ${SAD.x + 42} ${SAD.y - 2} L ${SAD.x + 42} ${SAD.y + 3} C ${SAD.x + 4} ${SAD.y - 11} ${SAD.x - 22} ${SAD.y - 9} ${SAD.x - 40} ${SAD.y + 3} Z" fill="currentColor" stroke="none" opacity="0.4"/>
    <rect class="zone-overlay" x="${POST.x - 54}" y="${POST.y - 30}" width="116" height="${ST.y - POST.y + 50}" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drivetrain -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="33" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="2" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x + 38}" y2="${BB.y + 28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x + 34}" y1="${BB.y + 26}" x2="${BB.x + 50}" y2="${BB.y + 21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x - 38}" y2="${BB.y - 28}" stroke-width="8" stroke-linecap="round"/>
    <path d="M ${BB.x - 4} ${BB.y - 33} Q ${(BB.x + RW.x) / 2} ${BB.y - 42} ${RW.x} ${RW.y - 24}" fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="27" fill="none" stroke-width="5.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="21" fill="none" stroke-width="3.5" opacity="0.48"/>
    <path d="M ${RW.x + 24} ${RW.y + 18} Q ${RW.x + 46} ${RW.y + 42} ${RW.x + 34} ${RW.y + 60}" fill="none" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${RW.x + 32}" cy="${RW.y + 62}" r="9" fill="none" stroke-width="3"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── GRAVEL / ROAD ─────────────────────────────────────────
function svgGravelRoad(isRoad = false) {
  const RW = { x: 152, y: 350 };
  const FW = { x: 648, y: 350 };
  const BB = { x: 380, y: 362 };
  const HT = isRoad ? { x: 545, y: 128 } : { x: 540, y: 122 };
  const HC = isRoad ? { x: 566, y: 206 } : { x: 572, y: 212 };
  const ST = { x: 340, y: 182 };
  const SS = { x: ST.x - 3, y: ST.y + 62 };
  const dx = ST.x - BB.x, dy = ST.y - BB.y;
  const len = Math.sqrt(dx*dx+dy*dy);
  const POST = { x: ST.x + (dx/len)*52, y: ST.y + (dy/len)*52 };
  const SAD  = { x: POST.x, y: POST.y - 2 };
  const tW   = isRoad ? 6 : 14;

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${roadWheel(RW.x, RW.y, 'rear-wheel', tW)}
  ${roadWheel(FW.x, FW.y, 'front-wheel', tW)}

  <g class="bike-part">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-54} ${BB.y} ${RW.x+86} ${RW.y-2} ${RW.x} ${RW.y}" fill="none" stroke-width="${isRoad?4:5}" stroke-linecap="round"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="${isRoad?3.5:4.5}" stroke-linecap="round"/>
    <line x1="${RW.x+7}" y1="${RW.y}" x2="${SS.x+6}" y2="${SS.y}" stroke-width="${isRoad?2.5:3}" stroke-linecap="round" opacity="0.35"/>
  </g>

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?7:8}" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="${isRoad?6:7}" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="${isRoad?5.5:6.5}" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?11:12}" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <rect class="zone-overlay" x="${Math.min(BB.x,ST.x)-18}" y="${ST.y-6}" width="48" height="${BB.y-ST.y+12}" rx="8" data-zone="frame"/>
  </g>

  <!-- Rigid fork with curve (road/gravel style) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <path d="M ${HC.x - 5} ${HC.y + 2} C ${HC.x + 14} ${HC.y + 55} ${FW.x + 12} ${FW.y - 68} ${FW.x + 6} ${FW.y}" fill="none" stroke-width="${isRoad?5.5:7}" stroke-linecap="round"/>
    <path d="M ${HC.x + 7} ${HC.y + 2} C ${HC.x + 24} ${HC.y + 56} ${FW.x + 22} ${FW.y - 67} ${FW.x + 16} ${FW.y}" fill="none" stroke-width="${isRoad?5.5:7}" stroke-linecap="round"/>
    <line x1="${HC.x - 5}" y1="${HC.y + 2}" x2="${HC.x + 7}" y2="${HC.y + 2}" stroke-width="8" stroke-linecap="round"/>
    <rect class="zone-overlay" x="518" y="115" width="140" height="254" rx="12" data-zone="fork"/>
  </g>

  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${HT.x + 2}" y1="${HT.y}" x2="${HT.x - 2}" y2="${HT.y - 38}" stroke-width="6" stroke-linecap="round"/>
    <rect x="${HT.x - 11}" y="${HT.y - 44}" width="19" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${HT.x - 22}" y1="${HT.y - 44}" x2="${HT.x + 16}" y2="${HT.y - 44}" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${HT.x - 22} ${HT.y - 44} C ${HT.x - 33} ${HT.y - 33} ${HT.x - 37} ${HT.y - 17} ${HT.x - 29} ${HT.y - 6}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${HT.x - 29} ${HT.y - 6} C ${HT.x - 26} ${HT.y + 3} ${HT.x - 17} ${HT.y + 8} ${HT.x - 9} ${HT.y + 8}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${HT.x + 16} ${HT.y - 44} C ${HT.x + 21} ${HT.y - 33} ${HT.x + 21} ${HT.y - 17} ${HT.x + 15} ${HT.y - 6}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${HT.x + 15} ${HT.y - 6} C ${HT.x + 13} ${HT.y + 3} ${HT.x + 7} ${HT.y + 8} ${HT.x + 1} ${HT.y + 8}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${HT.x - 55}" y="${HT.y - 66}" width="90" height="88" rx="10" data-zone="handlebar"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x - 9}" y="${ST.y - 5}" width="18" height="11" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${SAD.x - 30} ${SAD.y - 4} C ${SAD.x - 16} ${SAD.y - 14} ${SAD.x + 6} ${SAD.y - 15} ${SAD.x + 32} ${SAD.y - 4}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${SAD.x - 32} ${SAD.y - 2} C ${SAD.x - 16} ${SAD.y - 13} ${SAD.x + 6} ${SAD.y - 14} ${SAD.x + 34} ${SAD.y - 2} L ${SAD.x + 34} ${SAD.y + 3} C ${SAD.x + 6} ${SAD.y - 10} ${SAD.x - 16} ${SAD.y - 9} ${SAD.x - 32} ${SAD.y + 3} Z" fill="currentColor" stroke="none" opacity="0.4"/>
    <rect class="zone-overlay" x="${POST.x - 50}" y="${POST.y - 28}" width="112" height="${ST.y - POST.y + 48}" rx="10" data-zone="dropper"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="${isRoad?35:30}" fill="none" stroke-width="${isRoad?5.5:6}"/>
    ${isRoad ? `<circle cx="${BB.x}" cy="${BB.y}" r="25" fill="none" stroke-width="4" opacity="0.42"/>` : ''}
    <circle cx="${BB.x}" cy="${BB.y}" r="18" fill="none" stroke-width="1.5" opacity="0.28"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+36}" y2="${BB.y+26}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${BB.x+32}" y1="${BB.y+24}" x2="${BB.x+48}" y2="${BB.y+19}" stroke-width="6.5" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-36}" y2="${BB.y-26}" stroke-width="7.5" stroke-linecap="round"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="22" fill="none" stroke-width="4.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15" fill="none" stroke-width="3" opacity="0.45"/>
    <path d="M ${RW.x+19} ${RW.y+13} Q ${RW.x+38} ${RW.y+34} ${RW.x+28} ${RW.y+50}" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="${RW.x+26}" cy="${RW.y+52}" r="7.5" fill="none" stroke-width="2.5"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="11" fill="var(--bg-base)" stroke="currentColor" stroke-width="3"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="54" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── SVG FACTORY ───────────────────────────────────────────
export function createSilhouette(bike) {
  const type   = bike.type || 'mtb';
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
  svg = svg.replace(/<(?:circle|ellipse|rect|polygon)[^>]*class="zone-overlay[^"]*"[^/]*\/>/g, '');
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
  const start   = performance.now();
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
  _currentVB  = [...VB_DEFAULT];
  _activeZone = null;
  svg.setAttribute('viewBox', VB_DEFAULT.join(' '));

  const tooltip   = document.getElementById('zone-tooltip');
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
  const type   = bike.type || 'mtb';
  const isFull = (bike.suspensionType || 'full') === 'full';
  if ((type === 'mtb' || type === 'emtb') && isFull) base.push('shock');
  return base;
}

function showTooltip(tooltip, zoneId, bike, e, container) {
  const meta = ZONE_META[zoneId];
  if (!meta) return;
  tooltip.querySelector('.tooltip-zone-name').textContent  = meta.label;
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
    case 'front-wheel': { const t = bl.frontTire; return t?.brand ? `${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim() : 'Not set'; }
    case 'rear-wheel':  { const t = bl.rearTire;  return t?.brand ? `${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim() : 'Not set'; }
    case 'fork':  { const f = bl.fork;  return f?.brand ? `${f.brand} ${f.model||''} ${f.type==='air'&&f.psi?'· '+f.psi+' psi':f.type==='coil'?'· Coil':''}`.trim() : 'Not set'; }
    case 'shock': { const s = bl.shock; return s?.brand ? `${s.brand} ${s.model||''} ${s.type==='air'&&s.psi?'· '+s.psi+' psi':s.type==='coil'?'· Coil':''}`.trim() : 'Not set'; }
    case 'handlebar':  return bl.handlebar?.brand  ? `${bl.handlebar.brand} ${bl.handlebar.model||''}`.trim()  : 'Not set';
    case 'drivetrain': return bl.drivetrain?.brand ? `${bl.drivetrain.brand} ${bl.drivetrain.model||''}`.trim() : 'Not set';
    case 'dropper':    return bl.dropper?.brand    ? `${bl.dropper.brand} ${bl.dropper.model||''}`.trim()    : 'Not set';
    case 'frame':      return bl.frame?.brand      ? `${bl.frame.brand} ${bl.frame.model||''}`.trim()        : 'Not set';
    default: return '—';
  }
}

export { ZONE_META };
