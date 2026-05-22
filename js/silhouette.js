// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams
// Geometry: 2019 Santa Cruz Bronson (63.9° HA, 76° SA)
// All coordinates mathematically derived and verified
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

const ZONE_META = {
  'front-wheel': { label: 'Front Wheel / Tire', vb: [448, 192, 280, 280], key: 'frontTire' },
  'rear-wheel':  { label: 'Rear Wheel / Tire',  vb: [0,   192, 280, 280], key: 'rearTire' },
  'fork':        { label: 'Fork',               vb: [548, 105, 225, 270], key: 'fork' },
  'shock':       { label: 'Rear Shock',         vb: [332, 240, 170, 175], key: 'shock' },
  'handlebar':   { label: 'Cockpit / Bars',     vb: [432,  32, 202, 188], key: 'handlebar' },
  'drivetrain':  { label: 'Drivetrain',         vb: [290, 298, 210, 175], key: 'drivetrain' },
  'dropper':     { label: 'Dropper / Saddle',   vb: [254,  42, 164, 222], key: 'dropper' },
  'frame':       { label: 'Frame / Geometry',   vb: [85,   88, 468, 310], key: 'frame' },
};

// ── WHEEL HELPERS ─────────────────────────────────────────
function wheelSpokes(cx, cy, r, count = 8) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    s += `<line x1="${cx}" y1="${cy}"
               x2="${(cx + Math.cos(a)*(r-26)).toFixed(1)}"
               y2="${(cy + Math.sin(a)*(r-26)).toFixed(1)}"
               stroke-width="1.2" opacity="0.32"/>`;
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
    <circle cx="${cx}" cy="${cy}" r="11"  fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
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
// Verified geometry:
//   RW(148,350) FW(658,350) BB(382,368)
//   76° SA → ST(335,179)   seatpost continues same vector 75px above ST
//   63.9° HA → HT(545,120) HC(581,194)
//   Fork: unit vector from HC to FW → HA = 63.8° ✓
//   Fork split at 44% — mathematically on-line, no kink
//   lTop(573,198) lSplit(607,265) lBot(650,350)
//   rTop(589,190) rSplit(623,260) rBot(666,350)
//   Seatstay: RW → SS(358,270) on seat tube at t=0.52
//   Shock: SHT(363,292) on seat tube, SHB(416,316) on rocker above BB
//   Rocker pivot: (408,346) on chainstay
//   Stem: 18px length (short modern stem)
//   POST top: (317,106)  SAD centre: (321,105)
function svgMTBFS(hasMotor = false) {
  // Primary anchors
  const RW  = {x:148, y:350};
  const FW  = {x:658, y:350};
  const BB  = {x:382, y:368};
  const ST  = {x:335, y:179};   // seat tube top (76° SA, 195px)
  const HT  = {x:545, y:120};   // head tube top (63.9° HA)
  const HC  = {x:581, y:194};   // fork crown / head tube bottom

  // Seat tube unit vector — seatpost continues this exact direction
  const stUx = (ST.x-BB.x)/195, stUy = (ST.y-BB.y)/195;
  // Seatpost top (75px above ST — long dropper)
  const POST = {x: ST.x + stUx*75, y: ST.y + stUy*75};
  const SAD  = {x: POST.x + 4,     y: POST.y - 1};

  // Seatstay junction on seat tube (t=0.52 from BB)
  const SS   = {x:358, y:270};

  // Swingarm/main pivot
  const PIV  = {x:358, y:334};

  // Shock — lower on rocker near BB, upper on seat tube
  const SHT  = {x:363, y:292};   // upper: on seat tube at t=0.40
  const SHB  = {x:416, y:316};   // lower: top of rocker arm
  const RPIV = {x:408, y:346};   // rocker pivot on chainstay
  const RARM = {x:430, y:334};   // rocker arm end (pulls chainstay)

  // Fork legs — all three points mathematically on same line
  const F = {
    lTop:  {x:573, y:198}, lSplit: {x:607, y:265}, lBot: {x:650, y:350},
    rTop:  {x:589, y:190}, rSplit: {x:623, y:260}, rBot: {x:666, y:350},
  };

  // Short stem
  const STEM_BASE = {x: HT.x + 3, y: HT.y + 2};
  const STEM_TOP  = {x: HT.x - 1, y: HT.y - 18}; // 18px = very short

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <!-- ── 1. WHEELS ── -->
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- ── 2. FRAME GROUP (includes full front + rear triangle) ── -->
  <g id="g-frame" class="bike-zone" data-zone="frame">

    <!-- Chainstay upper rail: BB → RW -->
    <path d="M ${BB.x} ${BB.y}
             C ${BB.x-55} ${BB.y}
               ${RW.x+90} ${RW.y-2}
               ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Chainstay lower rail (tube thickness illusion) -->
    <path d="M ${BB.x-3} ${BB.y+9}
             C ${BB.x-58} ${BB.y+9}
               ${RW.x+88} ${RW.y+9}
               ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.36"/>

    <!-- Seatstay: RW → SS (junction on seat tube) -->
    <line x1="${RW.x}"   y1="${RW.y}"   x2="${SS.x}"  y2="${SS.y}"
          stroke-width="5" stroke-linecap="round"/>
    <!-- Second seatstay rail -->
    <line x1="${RW.x+9}" y1="${RW.y}"   x2="${SS.x+8}" y2="${SS.y}"
          stroke-width="3" stroke-linecap="round" opacity="0.34"/>

    <!-- Swingarm pivot -->
    <circle cx="${PIV.x}" cy="${PIV.y}" r="7.5"
            fill="var(--bg-base)" stroke-width="3.5"/>
    <circle cx="${PIV.x}" cy="${PIV.y}" r="3"
            fill="currentColor" stroke="none"/>

    <!-- Down tube: BB → HC -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}"
          stroke-width="11" stroke-linecap="round"/>
    <!-- Seat tube: BB → ST (single straight line, no kink) -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}"
          stroke-width="7.5" stroke-linecap="round"/>
    <!-- Top tube: ST → HT -->
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Head tube: HT → HC (thick, short, 63.9°) -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}"
          stroke-width="15" stroke-linecap="round"/>
    ${hasMotor ? `
    <rect x="${BB.x-38}" y="${BB.y-50}" width="62" height="44" rx="9"
          fill="none" stroke-width="3" opacity="0.68"/>` : ''}

    <!-- Frame hover zone — covers entire main triangle -->
    <polygon class="zone-overlay"
      points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}"
      data-zone="frame"/>
    <!-- Rear triangle hover extension -->
    <polygon class="zone-overlay"
      points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}"
      data-zone="frame"/>
  </g>

  <!-- ── 3. DRIVETRAIN (no RD arm — just chainring + cassette) ── -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <!-- Chainring -->
    <circle cx="${BB.x}" cy="${BB.y}" r="33" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="2" opacity="0.3"/>
    <!-- Crank forward -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+38}" y2="${BB.y+28}"
          stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x+34}" y1="${BB.y+26}" x2="${BB.x+50}" y2="${BB.y+21}"
          stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <!-- Crank back -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-38}" y2="${BB.y-28}"
          stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x-34}" y1="${BB.y-26}" x2="${BB.x-50}" y2="${BB.y-21}"
          stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <!-- Chain upper -->
    <path d="M ${BB.x-4} ${BB.y-33}
             Q ${(BB.x+RW.x)/2} ${BB.y-42} ${RW.x} ${RW.y-24}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <!-- Chain lower -->
    <path d="M ${BB.x+4} ${BB.y+33}
             Q ${(BB.x+RW.x)/2+8} ${BB.y+24} ${RW.x} ${RW.y+12}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <!-- Cassette rings only (no derailleur arm) -->
    <circle cx="${RW.x}" cy="${RW.y}" r="27" fill="none" stroke-width="5.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="21" fill="none" stroke-width="3.5" opacity="0.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15" fill="none" stroke-width="2"   opacity="0.28"/>
    <!-- BB shell -->
    <circle cx="${BB.x}" cy="${BB.y}" r="12"
            fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>

  <!-- ── 4. DROPPER / SADDLE ── -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <!-- Seat clamp at ST top -->
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3"
          fill="var(--bg-elevated)" stroke-width="3"/>
    <!-- Seatpost: exact same direction as seat tube (stUx, stUy) — no kink -->
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}"
          stroke-width="7" stroke-linecap="round"/>
    <!-- Saddle rails -->
    <line x1="${SAD.x-34}" y1="${SAD.y-2}" x2="${SAD.x+30}" y2="${SAD.y-2}"
          stroke-width="2.5" stroke-linecap="round" opacity="0.48"/>
    <!-- Saddle top surface -->
    <path d="M ${SAD.x-38} ${SAD.y-4}
             C ${SAD.x-22} ${SAD.y-15} ${SAD.x+4} ${SAD.y-17} ${SAD.x+40} ${SAD.y-4}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Saddle body -->
    <path d="M ${SAD.x-40} ${SAD.y-2}
             C ${SAD.x-22} ${SAD.y-14} ${SAD.x+4} ${SAD.y-16} ${SAD.x+42} ${SAD.y-2}
             L ${SAD.x+42} ${SAD.y+3}
             C ${SAD.x+4}  ${SAD.y-11} ${SAD.x-22} ${SAD.y-9} ${SAD.x-40} ${SAD.y+3} Z"
          fill="currentColor" stroke="none" opacity="0.42"/>
    <rect class="zone-overlay"
          x="${POST.x-54}" y="${POST.y-28}"
          width="116" height="${ST.y-POST.y+52}" rx="10" data-zone="dropper"/>
  </g>

  <!-- ── 5. HANDLEBARS (short modern stem) ── -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Stem: 18px = short stack -->
    <line x1="${STEM_BASE.x}" y1="${STEM_BASE.y}"
          x2="${STEM_TOP.x}"  y2="${STEM_TOP.y}"
          stroke-width="7.5" stroke-linecap="round"/>
    <!-- Faceplate -->
    <rect x="${STEM_TOP.x-12}" y="${STEM_TOP.y-5}" width="20" height="9" rx="3"
          fill="var(--bg-elevated)" stroke-width="3.5"/>
    <!-- Bar tube — 800mm wide -->
    <line x1="${STEM_TOP.x-68}" y1="${STEM_TOP.y-2}"
          x2="${STEM_TOP.x+62}" y2="${STEM_TOP.y-2}"
          stroke-width="8.5" stroke-linecap="round"/>
    <!-- Grip left -->
    <line x1="${STEM_TOP.x-64}" y1="${STEM_TOP.y-2}"
          x2="${STEM_TOP.x-74}" y2="${STEM_TOP.y-4}"
          stroke-width="16" stroke-linecap="round" opacity="0.58"/>
    <!-- Grip right -->
    <line x1="${STEM_TOP.x+58}" y1="${STEM_TOP.y-2}"
          x2="${STEM_TOP.x+68}" y2="${STEM_TOP.y-4}"
          stroke-width="16" stroke-linecap="round" opacity="0.58"/>
    <!-- Sweep at ends -->
    <path d="M ${STEM_TOP.x-64} ${STEM_TOP.y-2}
             Q ${STEM_TOP.x-70} ${STEM_TOP.y}
               ${STEM_TOP.x-72} ${STEM_TOP.y+5}"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <path d="M ${STEM_TOP.x+58} ${STEM_TOP.y-2}
             Q ${STEM_TOP.x+64} ${STEM_TOP.y}
               ${STEM_TOP.x+66} ${STEM_TOP.y+5}"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Brake levers -->
    <path d="M ${STEM_TOP.x-52} ${STEM_TOP.y-2} L ${STEM_TOP.x-60} ${STEM_TOP.y+12}"
          fill="none" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    <path d="M ${STEM_TOP.x+46} ${STEM_TOP.y-2} L ${STEM_TOP.x+54} ${STEM_TOP.y+12}"
          fill="none" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    <rect class="zone-overlay"
          x="${STEM_TOP.x-90}" y="${STEM_TOP.y-30}"
          width="182" height="80" rx="10" data-zone="handlebar"/>
  </g>

  <!-- ── 6. FORK (dead straight — no kink) ── -->
  <!-- lTop(573,198) lSplit(607,265) lBot(650,350) — verified on-line -->
  <!-- rTop(589,190) rSplit(623,260) rBot(666,350) — verified on-line -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <!-- Crown bridge -->
    <line x1="${F.lTop.x-2}" y1="${F.lTop.y+1}"
          x2="${F.rTop.x+2}" y2="${F.rTop.y+1}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Left stanchion (thin upper tube) -->
    <line x1="${F.lTop.x}" y1="${F.lTop.y}"
          x2="${F.lSplit.x}" y2="${F.lSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Left lower (fat casting) -->
    <line x1="${F.lSplit.x}" y1="${F.lSplit.y}"
          x2="${F.lBot.x}" y2="${F.lBot.y}"
          stroke-width="15" stroke-linecap="round"/>
    <!-- Right stanchion -->
    <line x1="${F.rTop.x}" y1="${F.rTop.y}"
          x2="${F.rSplit.x}" y2="${F.rSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Right lower -->
    <line x1="${F.rSplit.x}" y1="${F.rSplit.y}"
          x2="${F.rBot.x}" y2="${F.rBot.y}"
          stroke-width="15" stroke-linecap="round"/>
    <!-- Dust seal band at split -->
    <line x1="${F.lSplit.x-3}" y1="${F.lSplit.y}"
          x2="${F.rSplit.x+3}" y2="${F.rSplit.y}"
          stroke-width="8" stroke-linecap="round" opacity="0.62"/>
    <!-- Lower arch brace near axle -->
    <line x1="${F.lBot.x-2}" y1="${F.lBot.y-22}"
          x2="${F.rBot.x+2}" y2="${F.rBot.y-22}"
          stroke-width="6" stroke-linecap="round" opacity="0.64"/>
    <!-- Brake caliper mount tab -->
    <rect x="${F.lBot.x-20}" y="${F.lBot.y-62}"
          width="14" height="28" rx="3"
          fill="none" stroke-width="3" opacity="0.58"/>
    <!-- Axle -->
    <line x1="${F.lBot.x-10}" y1="${F.lBot.y+2}"
          x2="${F.rBot.x+10}" y2="${F.rBot.y+2}"
          stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="548" y="105" width="148" height="270" rx="14" data-zone="fork"/>
  </g>

  <!-- ── 7. REAR SHOCK + LINKAGE (rendered last — always on top) ── -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <!-- Rocker arm linkage near BB -->
    <!-- Rocker pivot (on chainstay) -->
    <circle cx="${RPIV.x}" cy="${RPIV.y}" r="5.5"
            fill="var(--bg-base)" stroke-width="3"/>
    <!-- Rocker arm: pivot → shock lower mount -->
    <line x1="${RPIV.x}" y1="${RPIV.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="4.5" stroke-linecap="round"/>
    <!-- Rocker arm other side: pivot → chainstay pull point -->
    <line x1="${RPIV.x}" y1="${RPIV.y}" x2="${RARM.x}" y2="${RARM.y}"
          stroke-width="4.5" stroke-linecap="round"/>
    <!-- Shock body (compact cylinder) -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="9" stroke-linecap="round"/>
    <!-- Shaft (lighter inner section — lower half) -->
    <line x1="${SHB.x}" y1="${SHB.y}"
          x2="${SHB.x+(SHT.x-SHB.x)*0.44}"
          y2="${SHB.y+(SHT.y-SHB.y)*0.44}"
          stroke-width="4.5" stroke="var(--bg-elevated)"
          stroke-linecap="round" opacity="0.75"/>
    <!-- Spring coil marks -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="4" stroke="var(--bg-base)"
          stroke-dasharray="0 16 5 16 5 16" stroke-linecap="round" opacity="0.4"/>
    <!-- Piggyback reservoir (small, angled off body) -->
    <line x1="${SHT.x-4}" y1="${SHT.y+6}"
          x2="${SHT.x-16}" y2="${SHT.y+18}"
          stroke-width="7" stroke-linecap="round" opacity="0.7"/>
    <!-- Upper eyelet -->
    <circle cx="${SHT.x}" cy="${SHT.y}" r="6"
            fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="2.5" fill="currentColor" stroke="none"/>
    <!-- Lower eyelet -->
    <circle cx="${SHB.x}" cy="${SHB.y}" r="6"
            fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="2.5" fill="currentColor" stroke="none"/>
    <!-- Click zone -->
    <ellipse class="zone-overlay"
      cx="${(SHT.x+SHB.x)/2}" cy="${(SHT.y+SHB.y)/2}"
      rx="30" ry="52"
      transform="rotate(22 ${(SHT.x+SHB.x)/2} ${(SHT.y+SHB.y)/2})"
      data-zone="shock"/>
  </g>

</svg>`;
}

// ── HARDTAIL MTB ──────────────────────────────────────────
function svgHardtail(isDJ = false) {
  const RW = {x:148, y:350}, FW = {x:658, y:350}, BB = {x:382, y:368};
  const ST = isDJ ? {x:345, y:188} : {x:335, y:179};
  const HT = isDJ ? {x:548, y:132} : {x:545, y:120};
  const HC = isDJ ? {x:582, y:208} : {x:581, y:194};
  // Seatstay to seat tube at t=0.52
  const SS = {x: BB.x + (ST.x-BB.x)*0.52, y: BB.y + (ST.y-BB.y)*0.52};
  // Seatpost continues same vector 75px above ST
  const stLen = Math.sqrt((ST.x-BB.x)**2+(ST.y-BB.y)**2);
  const stUx = (ST.x-BB.x)/stLen, stUy = (ST.y-BB.y)/stLen;
  const POST = {x: ST.x+stUx*75, y: ST.y+stUy*75};
  const SAD  = {x: POST.x+4, y: POST.y-1};
  // Fork — straight from HC to FW
  const fDx = FW.x-HC.x, fDy = FW.y-HC.y;
  const fLen = Math.sqrt(fDx*fDx+fDy*fDy);
  const fUx = fDx/fLen, fUy = fDy/fLen;
  const fPx = fUy, fPy = -fUx; // perpendicular
  const off = 9, sp = 0.44;
  const F = {
    lTop: {x:HC.x-fPx*off, y:HC.y-fPy*off},
    rTop: {x:HC.x+fPx*off, y:HC.y+fPy*off},
    lBot: {x:FW.x-8, y:FW.y}, rBot: {x:FW.x+8, y:FW.y},
  };
  F.lSplit = {x:F.lTop.x+(F.lBot.x-F.lTop.x)*sp, y:F.lTop.y+(F.lBot.y-F.lTop.y)*sp};
  F.rSplit = {x:F.rTop.x+(F.rBot.x-F.rTop.x)*sp, y:F.rTop.y+(F.rBot.y-F.rTop.y)*sp};
  const ST2 = {x:HT.x+3, y:HT.y+2};
  const STP = {x:HT.x-1, y:HT.y-18};

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-55} ${BB.y} ${RW.x+90} ${RW.y-2} ${RW.x} ${RW.y}" fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+9} C ${BB.x-58} ${BB.y+9} ${RW.x+88} ${RW.y+9} ${RW.x} ${RW.y}" fill="none" stroke-width="3" stroke-linecap="round" opacity="0.34"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x.toFixed(0)}" y2="${SS.y.toFixed(0)}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+9}" y1="${RW.y}" x2="${(SS.x+8).toFixed(0)}" y2="${SS.y.toFixed(0)}" stroke-width="3" stroke-linecap="round" opacity="0.32"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x.toFixed(0)},${SS.y.toFixed(0)} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${F.lTop.x.toFixed(0)}" y1="${F.lTop.y.toFixed(0)}" x2="${F.rTop.x.toFixed(0)}" y2="${F.rTop.y.toFixed(0)}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lTop.x.toFixed(0)}" y1="${F.lTop.y.toFixed(0)}" x2="${F.lSplit.x.toFixed(0)}" y2="${F.lSplit.y.toFixed(0)}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.rTop.x.toFixed(0)}" y1="${F.rTop.y.toFixed(0)}" x2="${F.rSplit.x.toFixed(0)}" y2="${F.rSplit.y.toFixed(0)}" stroke-width="10" stroke-linecap="round"/>
    ${isDJ
      ? `<line x1="${F.lSplit.x.toFixed(0)}" y1="${F.lSplit.y.toFixed(0)}" x2="${F.lBot.x}" y2="${F.lBot.y}" stroke-width="10" stroke-linecap="round"/>
         <line x1="${F.rSplit.x.toFixed(0)}" y1="${F.rSplit.y.toFixed(0)}" x2="${F.rBot.x}" y2="${F.rBot.y}" stroke-width="10" stroke-linecap="round"/>`
      : `<line x1="${F.lSplit.x.toFixed(0)}" y1="${F.lSplit.y.toFixed(0)}" x2="${F.lBot.x}" y2="${F.lBot.y}" stroke-width="15" stroke-linecap="round"/>
         <line x1="${F.rSplit.x.toFixed(0)}" y1="${F.rSplit.y.toFixed(0)}" x2="${F.rBot.x}" y2="${F.rBot.y}" stroke-width="15" stroke-linecap="round"/>
         <line x1="${(F.lSplit.x-3).toFixed(0)}" y1="${F.lSplit.y.toFixed(0)}" x2="${(F.rSplit.x+3).toFixed(0)}" y2="${F.rSplit.y.toFixed(0)}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
         <line x1="${F.lBot.x-2}" y1="${F.lBot.y-22}" x2="${F.rBot.x+2}" y2="${F.rBot.y-22}" stroke-width="6" stroke-linecap="round" opacity="0.62"/>
         <rect x="${F.lBot.x-20}" y="${F.lBot.y-62}" width="14" height="28" rx="3" fill="none" stroke-width="3" opacity="0.58"/>`}
    <line x1="${F.lBot.x-10}" y1="${F.lBot.y+2}" x2="${F.rBot.x+10}" y2="${F.rBot.y+2}" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="548" y="108" width="148" height="268" rx="14" data-zone="fork"/>
  </g>

  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${ST2.x}" y1="${ST2.y}" x2="${STP.x}" y2="${STP.y}" stroke-width="7.5" stroke-linecap="round"/>
    <rect x="${STP.x-12}" y="${STP.y-5}" width="20" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="3.5"/>
    ${isDJ
      ? `<line x1="${STP.x-4}" y1="${STP.y}" x2="${STP.x-4}" y2="${STP.y-32}" stroke-width="7" stroke-linecap="round"/>
         <line x1="${STP.x-70}" y1="${STP.y-30}" x2="${STP.x+62}" y2="${STP.y-30}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${STP.x-70}" y1="${STP.y-30}" x2="${STP.x-80}" y2="${STP.y-32}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>
         <line x1="${STP.x+62}" y1="${STP.y-30}" x2="${STP.x+72}" y2="${STP.y-32}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>`
      : `<line x1="${STP.x-68}" y1="${STP.y-2}" x2="${STP.x+62}" y2="${STP.y-2}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${STP.x-64}" y1="${STP.y-2}" x2="${STP.x-74}" y2="${STP.y-4}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>
         <line x1="${STP.x+58}" y1="${STP.y-2}" x2="${STP.x+68}" y2="${STP.y-4}" stroke-width="16" stroke-linecap="round" opacity="0.56"/>
         <path d="M ${STP.x-64} ${STP.y-2} Q ${STP.x-70} ${STP.y} ${STP.x-72} ${STP.y+5}" fill="none" stroke-width="7" stroke-linecap="round"/>
         <path d="M ${STP.x+58} ${STP.y-2} Q ${STP.x+64} ${STP.y} ${STP.x+66} ${STP.y+5}" fill="none" stroke-width="7" stroke-linecap="round"/>
         <path d="M ${STP.x-52} ${STP.y-2} L ${STP.x-60} ${STP.y+12}" fill="none" stroke-width="4" stroke-linecap="round" opacity="0.62"/>
         <path d="M ${STP.x+46} ${STP.y-2} L ${STP.x+54} ${STP.y+12}" fill="none" stroke-width="4" stroke-linecap="round" opacity="0.62"/>`}
    <rect class="zone-overlay" x="${STP.x-92}" y="${STP.y-32}" width="182" height="72" rx="10" data-zone="handlebar"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x.toFixed(0)}" y2="${POST.y.toFixed(0)}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${(SAD.x-34).toFixed(0)}" y1="${(SAD.y-2).toFixed(0)}" x2="${(SAD.x+30).toFixed(0)}" y2="${(SAD.y-2).toFixed(0)}" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
    <path d="M ${(SAD.x-38).toFixed(0)} ${(SAD.y-4).toFixed(0)} C ${(SAD.x-22).toFixed(0)} ${(SAD.y-15).toFixed(0)} ${(SAD.x+4).toFixed(0)} ${(SAD.y-17).toFixed(0)} ${(SAD.x+40).toFixed(0)} ${(SAD.y-4).toFixed(0)}" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${(SAD.x-40).toFixed(0)} ${(SAD.y-2).toFixed(0)} C ${(SAD.x-22).toFixed(0)} ${(SAD.y-14).toFixed(0)} ${(SAD.x+4).toFixed(0)} ${(SAD.y-16).toFixed(0)} ${(SAD.x+42).toFixed(0)} ${(SAD.y-2).toFixed(0)} L ${(SAD.x+42).toFixed(0)} ${(SAD.y+3).toFixed(0)} C ${(SAD.x+4).toFixed(0)} ${(SAD.y-11).toFixed(0)} ${(SAD.x-22).toFixed(0)} ${(SAD.y-9).toFixed(0)} ${(SAD.x-40).toFixed(0)} ${(SAD.y+3).toFixed(0)} Z" fill="currentColor" stroke="none" opacity="0.42"/>
    <rect class="zone-overlay" x="${(POST.x-54).toFixed(0)}" y="${(POST.y-28).toFixed(0)}" width="116" height="${(ST.y-POST.y+52).toFixed(0)}" rx="10" data-zone="dropper"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="33" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="2" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+38}" y2="${BB.y+28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x+34}" y1="${BB.y+26}" x2="${BB.x+50}" y2="${BB.y+21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-38}" y2="${BB.y-28}" stroke-width="8" stroke-linecap="round"/>
    <path d="M ${BB.x-4} ${BB.y-33} Q ${(BB.x+RW.x)/2} ${BB.y-42} ${RW.x} ${RW.y-24}" fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="27" fill="none" stroke-width="5.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="21" fill="none" stroke-width="3.5" opacity="0.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15" fill="none" stroke-width="2" opacity="0.28"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── GRAVEL / ROAD ─────────────────────────────────────────
function svgGravelRoad(isRoad = false) {
  const RW = {x:152, y:350}, FW = {x:648, y:350}, BB = {x:380, y:362};
  const HT = isRoad ? {x:538,y:128} : {x:532,y:122};
  const HC = isRoad ? {x:559,y:206} : {x:564,y:212};
  const ST = {x:340, y:182};
  const SS = {x: BB.x+(ST.x-BB.x)*0.52, y: BB.y+(ST.y-BB.y)*0.52};
  const stLen = Math.sqrt((ST.x-BB.x)**2+(ST.y-BB.y)**2);
  const stUx=(ST.x-BB.x)/stLen, stUy=(ST.y-BB.y)/stLen;
  const POST = {x:ST.x+stUx*70, y:ST.y+stUy*70};
  const SAD  = {x:POST.x+4, y:POST.y-1};
  const tW   = isRoad ? 6 : 14;
  const ST2  = {x:HT.x+2, y:HT.y};
  const STP  = {x:HT.x-1, y:HT.y-18};

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${roadWheel(RW.x, RW.y, 'rear-wheel', tW)}
  ${roadWheel(FW.x, FW.y, 'front-wheel', tW)}

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-54} ${BB.y} ${RW.x+86} ${RW.y-2} ${RW.x} ${RW.y}" fill="none" stroke-width="${isRoad?4:5}" stroke-linecap="round"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x.toFixed(0)}" y2="${SS.y.toFixed(0)}" stroke-width="${isRoad?3.5:4.5}" stroke-linecap="round"/>
    <line x1="${RW.x+7}" y1="${RW.y}" x2="${(SS.x+6).toFixed(0)}" y2="${SS.y.toFixed(0)}" stroke-width="${isRoad?2.5:3}" stroke-linecap="round" opacity="0.33"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?7:8}" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="${isRoad?6:7}" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="${isRoad?5.5:6.5}" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?11:12}" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x.toFixed(0)},${SS.y.toFixed(0)} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <g id="g-fork" class="bike-zone" data-zone="fork">
    <path d="M ${HC.x-5} ${HC.y+2} C ${HC.x+14} ${HC.y+55} ${FW.x+12} ${FW.y-68} ${FW.x+6} ${FW.y}" fill="none" stroke-width="${isRoad?5.5:7}" stroke-linecap="round"/>
    <path d="M ${HC.x+7} ${HC.y+2} C ${HC.x+24} ${HC.y+56} ${FW.x+22} ${FW.y-67} ${FW.x+16} ${FW.y}" fill="none" stroke-width="${isRoad?5.5:7}" stroke-linecap="round"/>
    <line x1="${HC.x-5}" y1="${HC.y+2}" x2="${HC.x+7}" y2="${HC.y+2}" stroke-width="8" stroke-linecap="round"/>
    <rect class="zone-overlay" x="518" y="118" width="140" height="250" rx="12" data-zone="fork"/>
  </g>

  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${ST2.x}" y1="${ST2.y}" x2="${STP.x}" y2="${STP.y}" stroke-width="6" stroke-linecap="round"/>
    <rect x="${STP.x-11}" y="${STP.y-5}" width="19" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${STP.x-22}" y1="${STP.y-2}" x2="${STP.x+16}" y2="${STP.y-2}" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${STP.x-22} ${STP.y-2} C ${STP.x-33} ${STP.y+9} ${STP.x-37} ${STP.y+24} ${STP.x-29} ${STP.y+35}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${STP.x-29} ${STP.y+35} C ${STP.x-26} ${STP.y+43} ${STP.x-17} ${STP.y+48} ${STP.x-9} ${STP.y+48}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${STP.x+16} ${STP.y-2} C ${STP.x+21} ${STP.y+9} ${STP.x+21} ${STP.y+24} ${STP.x+15} ${STP.y+35}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${STP.x+15} ${STP.y+35} C ${STP.x+13} ${STP.y+43} ${STP.x+7} ${STP.y+48} ${STP.x+1} ${STP.y+48}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${STP.x-55}" y="${STP.y-18}" width="90" height="82" rx="10" data-zone="handlebar"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-9}" y="${ST.y-5}" width="18" height="11" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x.toFixed(0)}" y2="${POST.y.toFixed(0)}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${(SAD.x-30).toFixed(0)} ${(SAD.y-4).toFixed(0)} C ${(SAD.x-16).toFixed(0)} ${(SAD.y-14).toFixed(0)} ${(SAD.x+6).toFixed(0)} ${(SAD.y-15).toFixed(0)} ${(SAD.x+32).toFixed(0)} ${(SAD.y-4).toFixed(0)}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${(SAD.x-32).toFixed(0)} ${(SAD.y-2).toFixed(0)} C ${(SAD.x-16).toFixed(0)} ${(SAD.y-13).toFixed(0)} ${(SAD.x+6).toFixed(0)} ${(SAD.y-14).toFixed(0)} ${(SAD.x+34).toFixed(0)} ${(SAD.y-2).toFixed(0)} L ${(SAD.x+34).toFixed(0)} ${(SAD.y+3).toFixed(0)} C ${(SAD.x+6).toFixed(0)} ${(SAD.y-10).toFixed(0)} ${(SAD.x-16).toFixed(0)} ${(SAD.y-9).toFixed(0)} ${(SAD.x-32).toFixed(0)} ${(SAD.y+3).toFixed(0)} Z" fill="currentColor" stroke="none" opacity="0.4"/>
    <rect class="zone-overlay" x="${(POST.x-50).toFixed(0)}" y="${(POST.y-26).toFixed(0)}" width="112" height="${(ST.y-POST.y+48).toFixed(0)}" rx="10" data-zone="dropper"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="${isRoad?35:30}" fill="none" stroke-width="${isRoad?5.5:6}"/>
    ${isRoad?`<circle cx="${BB.x}" cy="${BB.y}" r="25" fill="none" stroke-width="4" opacity="0.4"/>`:''}
    <circle cx="${BB.x}" cy="${BB.y}" r="18" fill="none" stroke-width="1.5" opacity="0.28"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+36}" y2="${BB.y+26}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${BB.x+32}" y1="${BB.y+24}" x2="${BB.x+48}" y2="${BB.y+19}" stroke-width="6.5" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-36}" y2="${BB.y-26}" stroke-width="7.5" stroke-linecap="round"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="22" fill="none" stroke-width="4.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15" fill="none" stroke-width="3" opacity="0.45"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="11" fill="var(--bg-base)" stroke="currentColor" stroke-width="3"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="52" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── FACTORY ───────────────────────────────────────────────
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
    mtb:        {type:'mtb',        suspensionType:'full'},
    emtb:       {type:'emtb',       suspensionType:'full'},
    dirtjumper: {type:'dirtjumper', suspensionType:'hardtail'},
    gravel:     {type:'gravel'},
    road:       {type:'road'},
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

function lerpVB(a, b, t) { return a.map((v,i) => v + (b[i]-v)*t); }
function easeOutCubic(t) { return 1 - Math.pow(1-t, 3); }

export function animateViewBox(svg, targetVB, duration = 480) {
  if (_animFrame) cancelAnimationFrame(_animFrame);
  const startVB = [..._currentVB], start = performance.now();
  function step(now) {
    const raw = Math.min((now-start)/duration, 1);
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
  _currentVB = [...VB_DEFAULT]; _activeZone = null;
  svg.setAttribute('viewBox', VB_DEFAULT.join(' '));

  const tooltip   = document.getElementById('zone-tooltip');
  const available = getAvailableZones(bike);

  svg.querySelectorAll('.zone-overlay').forEach(overlay => {
    const zoneId = overlay.getAttribute('data-zone');
    if (!available.includes(zoneId)) { overlay.style.display='none'; return; }
    const group = svg.querySelector(`#g-${zoneId}`);

    overlay.addEventListener('mouseenter', e => {
      if (group) group.classList.add('zone-hovered');
      showTooltip(tooltip, zoneId, bike, e, container);
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','0');
    });
    overlay.addEventListener('mouseleave', () => {
      if (group && _activeZone !== zoneId) group.classList.remove('zone-hovered');
      tooltip.classList.add('hidden');
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','');
    });
    overlay.addEventListener('mousemove', e => positionTooltip(tooltip, e, container));
    overlay.addEventListener('click', () => {
      if (_activeZone) {
        const prev = svg.querySelector(`#g-${_activeZone}`);
        if (prev) prev.classList.remove('zone-active','zone-hovered');
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
  if ((type==='mtb'||type==='emtb') && isFull) base.push('shock');
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
    case 'front-wheel': { const t=bl.frontTire; return t?.brand?`${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim():'Not set'; }
    case 'rear-wheel':  { const t=bl.rearTire;  return t?.brand?`${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim():'Not set'; }
    case 'fork':  { const f=bl.fork;  return f?.brand?`${f.brand} ${f.model||''} ${f.type==='air'&&f.psi?'· '+f.psi+' psi':f.type==='coil'?'· Coil':''}`.trim():'Not set'; }
    case 'shock': { const s=bl.shock; return s?.brand?`${s.brand} ${s.model||''} ${s.type==='air'&&s.psi?'· '+s.psi+' psi':s.type==='coil'?'· Coil':''}`.trim():'Not set'; }
    case 'handlebar':  return bl.handlebar?.brand  ?`${bl.handlebar.brand} ${bl.handlebar.model||''}`.trim() :'Not set';
    case 'drivetrain': return bl.drivetrain?.brand ?`${bl.drivetrain.brand} ${bl.drivetrain.model||''}`.trim():'Not set';
    case 'dropper':    return bl.dropper?.brand    ?`${bl.dropper.brand} ${bl.dropper.model||''}`.trim()    :'Not set';
    case 'frame':      return bl.frame?.brand      ?`${bl.frame.brand} ${bl.frame.model||''}`.trim()        :'Not set';
    default: return '—';
  }
}

export { ZONE_META };
