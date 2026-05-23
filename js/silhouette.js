// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams
// Geometry: 2019 Santa Cruz Bronson (63.9° HA, 76° SA)
// All coordinates mathematically verified in Node.js
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

const ZONE_META = {
  'front-wheel': { label: 'Front Wheel / Tire', vb: [448, 192, 280, 280], key: 'frontTire' },
  'rear-wheel':  { label: 'Rear Wheel / Tire',  vb: [0,   192, 280, 280], key: 'rearTire' },
  'fork':        { label: 'Fork',               vb: [548, 128, 225, 248], key: 'fork' },
  'shock':       { label: 'Rear Shock',         vb: [322, 238, 168, 168], key: 'shock' },
  'handlebar':   { label: 'Cockpit / Bars',     vb: [444,  60, 210, 168], key: 'handlebar' },
  'drivetrain':  { label: 'Drivetrain',         vb: [290, 298, 210, 175], key: 'drivetrain' },
  'dropper':     { label: 'Dropper / Saddle',   vb: [262,  48, 162, 218], key: 'dropper' },
  'frame':       { label: 'Frame / Geometry',   vb: [85,  102, 468, 295], key: 'frame' },
};

// ── WHEELS ────────────────────────────────────────────────
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
// Verified geometry (Node.js):
//   RW(148,350) FW(658,350) BB(382,368)
//   76° SA, stLen=240 → ST(324,135)
//   63.9° HA: HC(599,230) → HT(575,181)  fork HA=63.82° ✓
//   Top tube (324,135)→(575,181): 10.3° downward toward front ✓
//   Fork: lTop(591,234) lSplit(617,285) lBot(650,350) — on-line ✓
//          rTop(607,226) rSplit(633,281) rBot(666,350) — on-line ✓
//   SS(352,247) — seatstay meets seat tube at t=0.52
//   Shock: SHT(359,275) on seat tube t=0.40, SHB(412,318) on rocker
//   Both shock mounts inside main triangle ✓
//   POST(311,82) — dropper 55px above ST, same vector
function svgMTBFS(hasMotor = false) {
  const RW   = {x:148, y:350};
  const FW   = {x:658, y:350};
  const BB   = {x:382, y:368};
  const ST   = {x:324, y:135};   // 76° SA, stLen=240
  const HT   = {x:575, y:181};   // 63.9° HA, htLen=55
  const HC   = {x:599, y:230};   // fork crown

  // Seat tube unit vector
  const stLen=240;
  const stUx=(ST.x-BB.x)/stLen, stUy=(ST.y-BB.y)/stLen;
  // Seatpost: 55px above ST, same direction
  const POST = {x:311, y:82};
  const SAD  = {x:315, y:81};

  // Seatstay junction on seat tube t=0.52
  const SS   = {x:352, y:247};
  // Swingarm pivot
  const PIV  = {x:356, y:328};

  // Shock — both mounts inside main triangle (verified)
  const SHT  = {x:359, y:275};   // on seat tube at t=0.40
  const SHB  = {x:412, y:318};   // rocker arm tip
  // Rocker pivot — on chainstay, just above BB
  const RPIV = {x:396, y:344};

  // Fork legs: mathematically on-line (verified at 63.82°)
  const F = {
    lTop:  {x:591, y:234}, lSplit: {x:617, y:285}, lBot: {x:650, y:350},
    rTop:  {x:607, y:226}, rSplit: {x:633, y:281}, rBot: {x:666, y:350},
  };

  // Short stem: 18px
  const STEM_B = {x:HT.x+3, y:HT.y+2};
  const STEM_T = {x:HT.x-1, y:HT.y-18};

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <!-- WHEELS -->
  ${mtbWheel(RW.x, RW.y, 'rear-wheel')}
  ${mtbWheel(FW.x, FW.y, 'front-wheel')}

  <!-- FRAME: full front triangle + rear triangle in one group -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <!-- Chainstay upper -->
    <path d="M ${BB.x} ${BB.y} C ${BB.x-55} ${BB.y} ${RW.x+90} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Chainstay lower rail -->
    <path d="M ${BB.x-3} ${BB.y+9} C ${BB.x-58} ${BB.y+9} ${RW.x+88} ${RW.y+9} ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.34"/>
    <!-- Seatstay: RW → SS -->
    <line x1="${RW.x}"   y1="${RW.y}"   x2="${SS.x}" y2="${SS.y}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+9}" y1="${RW.y}"   x2="${SS.x+8}" y2="${SS.y}" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
    <!-- Swingarm pivot -->
    <circle cx="${PIV.x}" cy="${PIV.y}" r="7.5" fill="var(--bg-base)" stroke-width="3.5"/>
    <circle cx="${PIV.x}" cy="${PIV.y}" r="3" fill="currentColor" stroke="none"/>
    <!-- Down tube: BB → HC -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <!-- Seat tube: BB → ST (single straight line) -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <!-- Top tube: ST → HT (slopes 10° downward toward front) -->
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Head tube: HT → HC (short, thick, 63.9°) -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    ${hasMotor ? `<rect x="${BB.x-38}" y="${BB.y-50}" width="62" height="44" rx="9" fill="none" stroke-width="3" opacity="0.68"/>` : ''}
    <!-- Hover zones -->
    <polygon class="zone-overlay"
      points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}"
      data-zone="frame"/>
    <polygon class="zone-overlay"
      points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}"
      data-zone="frame"/>
  </g>

  <!-- DRIVETRAIN -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${BB.x}" cy="${BB.y}" r="33" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="2" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+38}" y2="${BB.y+28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x+34}" y1="${BB.y+26}" x2="${BB.x+50}" y2="${BB.y+21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-38}" y2="${BB.y-28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x-34}" y1="${BB.y-26}" x2="${BB.x-50}" y2="${BB.y-21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <path d="M ${BB.x-4} ${BB.y-33} Q ${(BB.x+RW.x)/2} ${BB.y-42} ${RW.x} ${RW.y-24}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <path d="M ${BB.x+4} ${BB.y+33} Q ${(BB.x+RW.x)/2+8} ${BB.y+24} ${RW.x} ${RW.y+12}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="27" fill="none" stroke-width="5.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="21" fill="none" stroke-width="3.5" opacity="0.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15" fill="none" stroke-width="2"   opacity="0.28"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>

  <!-- DROPPER / SADDLE -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <!-- Seat clamp at ST top -->
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3"
          fill="var(--bg-elevated)" stroke-width="3"/>
    <!-- Seatpost: continues exact seat tube vector -->
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}"
          stroke-width="7" stroke-linecap="round"/>
    <!-- Saddle rails -->
    <line x1="${SAD.x-36}" y1="${SAD.y}" x2="${SAD.x+30}" y2="${SAD.y-2}"
          stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
    <!-- Saddle: flat with slight rear rise — tail(left) higher, nose(right) lower -->
    <path d="M ${SAD.x-38} ${SAD.y-10}
             C ${SAD.x-20} ${SAD.y-8}
               ${SAD.x+8}  ${SAD.y-5}
               ${SAD.x+40} ${SAD.y-2}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Saddle body fill -->
    <path d="M ${SAD.x-40} ${SAD.y-8}
             C ${SAD.x-20} ${SAD.y-6}
               ${SAD.x+8}  ${SAD.y-3}
               ${SAD.x+42} ${SAD.y}
             L ${SAD.x+42} ${SAD.y+5}
             C ${SAD.x+8}  ${SAD.y+2}
               ${SAD.x-20} ${SAD.y-1}
               ${SAD.x-40} ${SAD.y-3} Z"
          fill="currentColor" stroke="none" opacity="0.42"/>
    <rect class="zone-overlay"
          x="${POST.x-54}" y="${POST.y-20}"
          width="116" height="${ST.y-POST.y+46}" rx="10" data-zone="dropper"/>
  </g>

  <!-- HANDLEBARS -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Short stem: 18px -->
    <line x1="${STEM_B.x}" y1="${STEM_B.y}" x2="${STEM_T.x}" y2="${STEM_T.y}"
          stroke-width="8" stroke-linecap="round"/>
    <!-- Stem clamp ring -->
    <line x1="${STEM_B.x-6}" y1="${STEM_B.y-1}" x2="${STEM_B.x+7}" y2="${STEM_B.y-1}"
          stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
    <!-- Stem faceplate -->
    <rect x="${STEM_T.x-13}" y="${STEM_T.y-5}" width="22" height="9" rx="3"
          fill="var(--bg-elevated)" stroke-width="3.5"/>
    <!-- Handlebar tube -->
    <line x1="${STEM_T.x-68}" y1="${STEM_T.y-2}" x2="${STEM_T.x+62}" y2="${STEM_T.y-2}"
          stroke-width="8.5" stroke-linecap="round"/>
    <!-- Grips (thick rubber sections) -->
    <line x1="${STEM_T.x-64}" y1="${STEM_T.y-2}" x2="${STEM_T.x-76}" y2="${STEM_T.y-4}"
          stroke-width="17" stroke-linecap="round" opacity="0.54"/>
    <line x1="${STEM_T.x+58}" y1="${STEM_T.y-2}" x2="${STEM_T.x+70}" y2="${STEM_T.y-4}"
          stroke-width="17" stroke-linecap="round" opacity="0.54"/>
    <!-- Bar end sweep -->
    <path d="M ${STEM_T.x-64} ${STEM_T.y-2} Q ${STEM_T.x-71} ${STEM_T.y} ${STEM_T.x-73} ${STEM_T.y+6}"
          fill="none" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M ${STEM_T.x+58} ${STEM_T.y-2} Q ${STEM_T.x+65} ${STEM_T.y} ${STEM_T.x+67} ${STEM_T.y+6}"
          fill="none" stroke-width="7.5" stroke-linecap="round"/>
    <!-- Brake levers (curved blades below bar) -->
    <path d="M ${STEM_T.x-50} ${STEM_T.y-2} C ${STEM_T.x-54} ${STEM_T.y+4} ${STEM_T.x-58} ${STEM_T.y+10} ${STEM_T.x-56} ${STEM_T.y+18}"
          fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
    <path d="M ${STEM_T.x+44} ${STEM_T.y-2} C ${STEM_T.x+48} ${STEM_T.y+4} ${STEM_T.x+52} ${STEM_T.y+10} ${STEM_T.x+50} ${STEM_T.y+18}"
          fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
    <!-- Brake reservoirs (small body above each lever) -->
    <rect x="${STEM_T.x-60}" y="${STEM_T.y-8}" width="11" height="7" rx="2"
          fill="none" stroke-width="2.5" opacity="0.65"/>
    <rect x="${STEM_T.x+44}" y="${STEM_T.y-8}" width="11" height="7" rx="2"
          fill="none" stroke-width="2.5" opacity="0.65"/>
    <rect class="zone-overlay"
          x="${STEM_T.x-90}" y="${STEM_T.y-28}"
          width="184" height="68" rx="10" data-zone="handlebar"/>
  </g>

  <!-- FORK (dead straight, 63.82°, no kink) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <!-- Crown bridge -->
    <line x1="${F.lTop.x-2}" y1="${F.lTop.y+1}" x2="${F.rTop.x+2}" y2="${F.rTop.y+1}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Left stanchion -->
    <line x1="${F.lTop.x}" y1="${F.lTop.y}" x2="${F.lSplit.x}" y2="${F.lSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Left lower casting -->
    <line x1="${F.lSplit.x}" y1="${F.lSplit.y}" x2="${F.lBot.x}" y2="${F.lBot.y}"
          stroke-width="15" stroke-linecap="round"/>
    <!-- Right stanchion -->
    <line x1="${F.rTop.x}" y1="${F.rTop.y}" x2="${F.rSplit.x}" y2="${F.rSplit.y}"
          stroke-width="10" stroke-linecap="round"/>
    <!-- Right lower casting -->
    <line x1="${F.rSplit.x}" y1="${F.rSplit.y}" x2="${F.rBot.x}" y2="${F.rBot.y}"
          stroke-width="15" stroke-linecap="round"/>
    <!-- Dust seal band -->
    <line x1="${F.lSplit.x-3}" y1="${F.lSplit.y}" x2="${F.rSplit.x+3}" y2="${F.rSplit.y}"
          stroke-width="8" stroke-linecap="round" opacity="0.62"/>
    <!-- Lower arch brace -->
    <line x1="${F.lBot.x-2}" y1="${F.lBot.y-22}" x2="${F.rBot.x+2}" y2="${F.rBot.y-22}"
          stroke-width="6" stroke-linecap="round" opacity="0.64"/>
    <!-- Brake caliper tab -->
    <rect x="${F.lBot.x-20}" y="${F.lBot.y-62}" width="14" height="28" rx="3"
          fill="none" stroke-width="3" opacity="0.58"/>
    <!-- Axle -->
    <line x1="${F.lBot.x-10}" y1="${F.lBot.y+2}" x2="${F.rBot.x+10}" y2="${F.rBot.y+2}"
          stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="565" y="128" width="136" height="248" rx="14" data-zone="fork"/>
  </g>

  <!-- REAR SHOCK + LINKAGE (rendered last — always on top) -->
  <!-- Issue 2 fix: RARM removed — only rocker pivot + single arm to SHB -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <!-- Rocker pivot on chainstay -->
    <circle cx="${RPIV.x}" cy="${RPIV.y}" r="5.5"
            fill="var(--bg-base)" stroke-width="3"/>
    <!-- Single rocker arm: pivot → shock lower mount (stays inside main triangle) -->
    <line x1="${RPIV.x}" y1="${RPIV.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="4.5" stroke-linecap="round"/>
    <!-- Shock body -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="9" stroke-linecap="round"/>
    <!-- Shaft (lighter inner, lower portion) -->
    <line x1="${SHB.x}" y1="${SHB.y}"
          x2="${SHB.x+(SHT.x-SHB.x)*0.44}"
          y2="${SHB.y+(SHT.y-SHB.y)*0.44}"
          stroke-width="4.5" stroke="var(--bg-elevated)" stroke-linecap="round" opacity="0.75"/>
    <!-- Spring coil marks -->
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="4" stroke="var(--bg-base)"
          stroke-dasharray="0 15 5 15 5 15" stroke-linecap="round" opacity="0.4"/>
    <!-- Piggyback reservoir (small, next to upper mount) -->
    <line x1="${SHT.x-4}" y1="${SHT.y+6}" x2="${SHT.x-14}" y2="${SHT.y+17}"
          stroke-width="7" stroke-linecap="round" opacity="0.68"/>
    <!-- Eyelets -->
    <circle cx="${SHT.x}" cy="${SHT.y}" r="6" fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="2.5" fill="currentColor" stroke="none"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="6" fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="2.5" fill="currentColor" stroke="none"/>
    <!-- Click zone -->
    <ellipse class="zone-overlay"
      cx="${(SHT.x+SHB.x)/2}" cy="${(SHT.y+SHB.y)/2}"
      rx="28" ry="50"
      transform="rotate(20 ${(SHT.x+SHB.x)/2} ${(SHT.y+SHB.y)/2})"
      data-zone="shock"/>
  </g>

</svg>`;
}

// ── HARDTAIL MTB ──────────────────────────────────────────
function svgHardtail(isDJ = false) {
  const RW={x:148,y:350}, FW={x:658,y:350}, BB={x:382,y:368};
  // Same geometry as FS for consistency
  const ST=isDJ?{x:332,y:148}:{x:324,y:135};
  const HT=isDJ?{x:568,y:190}:{x:575,y:181};
  const HC=isDJ?{x:594,y:242}:{x:599,y:230};
  const stLen=isDJ?230:240;
  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stMag=Math.sqrt(stDx*stDx+stDy*stDy);
  const stUx=stDx/stMag, stUy=stDy/stMag;
  const POST={x:Math.round(ST.x+stUx*55), y:Math.round(ST.y+stUy*55)};
  const SAD={x:POST.x+4, y:POST.y-1};
  const SS={x:Math.round(BB.x+stUx*stLen*0.52), y:Math.round(BB.y+stUy*stLen*0.52)};
  // Fork: straight from HC to FW
  const fDx=FW.x-HC.x, fDy=FW.y-HC.y;
  const fLen=Math.sqrt(fDx*fDx+fDy*fDy);
  const fUx=fDx/fLen, fUy=fDy/fLen, fPx=fUy, fPy=-fUx;
  const off=9, sp=0.44;
  const F={
    lTop:{x:Math.round(HC.x-fPx*off),y:Math.round(HC.y-fPy*off)},
    rTop:{x:Math.round(HC.x+fPx*off),y:Math.round(HC.y+fPy*off)},
    lBot:{x:FW.x-8,y:FW.y}, rBot:{x:FW.x+8,y:FW.y},
  };
  F.lSplit={x:Math.round(F.lTop.x+(F.lBot.x-F.lTop.x)*sp),y:Math.round(F.lTop.y+(F.lBot.y-F.lTop.y)*sp)};
  F.rSplit={x:Math.round(F.rTop.x+(F.rBot.x-F.rTop.x)*sp),y:Math.round(F.rTop.y+(F.rBot.y-F.rTop.y)*sp)};
  const PIV={x:Math.round(BB.x+stUx*stLen*0.52-4),y:Math.round(BB.y+stUy*stLen*0.52+16)};
  const SB={x:HT.x+3,y:HT.y+2}, ST2={x:HT.x-1,y:HT.y-18};

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${mtbWheel(RW.x,RW.y,'rear-wheel')}
  ${mtbWheel(FW.x,FW.y,'front-wheel')}

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-55} ${BB.y} ${RW.x+90} ${RW.y-2} ${RW.x} ${RW.y}" fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+9} C ${BB.x-58} ${BB.y+9} ${RW.x+88} ${RW.y+9} ${RW.x} ${RW.y}" fill="none" stroke-width="3" stroke-linecap="round" opacity="0.32"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+9}" y1="${RW.y}" x2="${SS.x+8}" y2="${SS.y}" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${F.lTop.x-2}" y1="${F.lTop.y+1}" x2="${F.rTop.x+2}" y2="${F.rTop.y+1}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lTop.x}" y1="${F.lTop.y}" x2="${F.lSplit.x}" y2="${F.lSplit.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.rTop.x}" y1="${F.rTop.y}" x2="${F.rSplit.x}" y2="${F.rSplit.y}" stroke-width="10" stroke-linecap="round"/>
    ${isDJ
      ? `<line x1="${F.lSplit.x}" y1="${F.lSplit.y}" x2="${F.lBot.x}" y2="${F.lBot.y}" stroke-width="10" stroke-linecap="round"/>
         <line x1="${F.rSplit.x}" y1="${F.rSplit.y}" x2="${F.rBot.x}" y2="${F.rBot.y}" stroke-width="10" stroke-linecap="round"/>`
      : `<line x1="${F.lSplit.x}" y1="${F.lSplit.y}" x2="${F.lBot.x}" y2="${F.lBot.y}" stroke-width="15" stroke-linecap="round"/>
         <line x1="${F.rSplit.x}" y1="${F.rSplit.y}" x2="${F.rBot.x}" y2="${F.rBot.y}" stroke-width="15" stroke-linecap="round"/>
         <line x1="${F.lSplit.x-3}" y1="${F.lSplit.y}" x2="${F.rSplit.x+3}" y2="${F.rSplit.y}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
         <line x1="${F.lBot.x-2}" y1="${F.lBot.y-22}" x2="${F.rBot.x+2}" y2="${F.rBot.y-22}" stroke-width="6" stroke-linecap="round" opacity="0.62"/>
         <rect x="${F.lBot.x-20}" y="${F.lBot.y-62}" width="14" height="28" rx="3" fill="none" stroke-width="3" opacity="0.58"/>`}
    <line x1="${F.lBot.x-10}" y1="${F.lBot.y+2}" x2="${F.rBot.x+10}" y2="${F.rBot.y+2}" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="565" y="130" width="136" height="246" rx="14" data-zone="fork"/>
  </g>

  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST2.x}" y2="${ST2.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${SB.x-6}" y1="${SB.y-1}" x2="${SB.x+7}" y2="${SB.y-1}" stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
    <rect x="${ST2.x-13}" y="${ST2.y-5}" width="22" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="3.5"/>
    ${isDJ
      ? `<line x1="${ST2.x-4}" y1="${ST2.y}" x2="${ST2.x-4}" y2="${ST2.y-30}" stroke-width="7" stroke-linecap="round"/>
         <line x1="${ST2.x-70}" y1="${ST2.y-28}" x2="${ST2.x+62}" y2="${ST2.y-28}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${ST2.x-70}" y1="${ST2.y-28}" x2="${ST2.x-82}" y2="${ST2.y-30}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>
         <line x1="${ST2.x+62}" y1="${ST2.y-28}" x2="${ST2.x+74}" y2="${ST2.y-30}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>`
      : `<line x1="${ST2.x-68}" y1="${ST2.y-2}" x2="${ST2.x+62}" y2="${ST2.y-2}" stroke-width="8.5" stroke-linecap="round"/>
         <line x1="${ST2.x-64}" y1="${ST2.y-2}" x2="${ST2.x-76}" y2="${ST2.y-4}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>
         <line x1="${ST2.x+58}" y1="${ST2.y-2}" x2="${ST2.x+70}" y2="${ST2.y-4}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>
         <path d="M ${ST2.x-64} ${ST2.y-2} Q ${ST2.x-71} ${ST2.y} ${ST2.x-73} ${ST2.y+6}" fill="none" stroke-width="7.5" stroke-linecap="round"/>
         <path d="M ${ST2.x+58} ${ST2.y-2} Q ${ST2.x+65} ${ST2.y} ${ST2.x+67} ${ST2.y+6}" fill="none" stroke-width="7.5" stroke-linecap="round"/>
         <path d="M ${ST2.x-50} ${ST2.y-2} C ${ST2.x-54} ${ST2.y+4} ${ST2.x-58} ${ST2.y+10} ${ST2.x-56} ${ST2.y+18}" fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
         <path d="M ${ST2.x+44} ${ST2.y-2} C ${ST2.x+48} ${ST2.y+4} ${ST2.x+52} ${ST2.y+10} ${ST2.x+50} ${ST2.y+18}" fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
         <rect x="${ST2.x-60}" y="${ST2.y-8}" width="11" height="7" rx="2" fill="none" stroke-width="2.5" opacity="0.65"/>
         <rect x="${ST2.x+44}" y="${ST2.y-8}" width="11" height="7" rx="2" fill="none" stroke-width="2.5" opacity="0.65"/>`}
    <rect class="zone-overlay" x="${ST2.x-92}" y="${ST2.y-32}" width="184" height="72" rx="10" data-zone="handlebar"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${SAD.x-36}" y1="${SAD.y}" x2="${SAD.x+30}" y2="${SAD.y-2}" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
    <path d="M ${SAD.x-38} ${SAD.y-10} C ${SAD.x-20} ${SAD.y-8} ${SAD.x+8} ${SAD.y-5} ${SAD.x+40} ${SAD.y-2}" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${SAD.x-40} ${SAD.y-8} C ${SAD.x-20} ${SAD.y-6} ${SAD.x+8} ${SAD.y-3} ${SAD.x+42} ${SAD.y} L ${SAD.x+42} ${SAD.y+5} C ${SAD.x+8} ${SAD.y+2} ${SAD.x-20} ${SAD.y-1} ${SAD.x-40} ${SAD.y-3} Z" fill="currentColor" stroke="none" opacity="0.42"/>
    <rect class="zone-overlay" x="${POST.x-54}" y="${POST.y-18}" width="116" height="${ST.y-POST.y+44}" rx="10" data-zone="dropper"/>
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
  const RW={x:152,y:350}, FW={x:648,y:350}, BB={x:380,y:362};
  const HT=isRoad?{x:532,y:178}:{x:526,y:172};
  const HC=isRoad?{x:554,y:228}:{x:560,y:234};
  const ST={x:330,y:148};
  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stMag=Math.sqrt(stDx*stDx+stDy*stDy);
  const stUx=stDx/stMag, stUy=stDy/stMag;
  const POST={x:Math.round(ST.x+stUx*55),y:Math.round(ST.y+stUy*55)};
  const SAD={x:POST.x+4,y:POST.y-1};
  const SS={x:Math.round(BB.x+stUx*stMag*0.52),y:Math.round(BB.y+stUy*stMag*0.52)};
  const tW=isRoad?6:14;
  const SB={x:HT.x+2,y:HT.y}, ST2={x:HT.x-1,y:HT.y-18};
  const r=n=>Math.round(n);

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  ${roadWheel(RW.x,RW.y,'rear-wheel',tW)}
  ${roadWheel(FW.x,FW.y,'front-wheel',tW)}
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-54} ${BB.y} ${RW.x+86} ${RW.y-2} ${RW.x} ${RW.y}" fill="none" stroke-width="${isRoad?4:5}" stroke-linecap="round"/>
    <line x1="${RW.x}" y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="${isRoad?3.5:4.5}" stroke-linecap="round"/>
    <line x1="${RW.x+7}" y1="${RW.y}" x2="${SS.x+6}" y2="${SS.y}" stroke-width="${isRoad?2.5:3}" stroke-linecap="round" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?7:8}" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="${isRoad?6:7}" stroke-linecap="round"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="${isRoad?5.5:6.5}" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="${isRoad?11:12}" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <path d="M ${HC.x-5} ${HC.y+2} C ${HC.x+14} ${HC.y+52} ${FW.x+12} ${FW.y-65} ${FW.x+6} ${FW.y}" fill="none" stroke-width="${isRoad?5.5:7}" stroke-linecap="round"/>
    <path d="M ${HC.x+7} ${HC.y+2} C ${HC.x+24} ${HC.y+53} ${FW.x+22} ${FW.y-64} ${FW.x+16} ${FW.y}" fill="none" stroke-width="${isRoad?5.5:7}" stroke-linecap="round"/>
    <line x1="${HC.x-5}" y1="${HC.y+2}" x2="${HC.x+7}" y2="${HC.y+2}" stroke-width="8" stroke-linecap="round"/>
    <rect class="zone-overlay" x="518" y="138" width="140" height="238" rx="12" data-zone="fork"/>
  </g>
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST2.x}" y2="${ST2.y}" stroke-width="6.5" stroke-linecap="round"/>
    <rect x="${ST2.x-11}" y="${ST2.y-5}" width="19" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST2.x-22}" y1="${ST2.y-2}" x2="${ST2.x+16}" y2="${ST2.y-2}" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${ST2.x-22} ${ST2.y-2} C ${ST2.x-33} ${ST2.y+9} ${ST2.x-37} ${ST2.y+24} ${ST2.x-29} ${ST2.y+35}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST2.x-29} ${ST2.y+35} C ${ST2.x-26} ${ST2.y+43} ${ST2.x-17} ${ST2.y+48} ${ST2.x-9} ${ST2.y+48}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST2.x+16} ${ST2.y-2} C ${ST2.x+21} ${ST2.y+9} ${ST2.x+21} ${ST2.y+24} ${ST2.x+15} ${ST2.y+35}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST2.x+15} ${ST2.y+35} C ${ST2.x+13} ${ST2.y+43} ${ST2.x+7} ${ST2.y+48} ${ST2.x+1} ${ST2.y+48}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${ST2.x-55}" y="${ST2.y-18}" width="90" height="82" rx="10" data-zone="handlebar"/>
  </g>
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-9}" y="${ST.y-5}" width="18" height="11" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${r(SAD.x-38)} ${r(SAD.y-10)} C ${r(SAD.x-20)} ${r(SAD.y-8)} ${r(SAD.x+8)} ${r(SAD.y-5)} ${r(SAD.x+40)} ${r(SAD.y-2)}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${r(SAD.x-40)} ${r(SAD.y-8)} C ${r(SAD.x-20)} ${r(SAD.y-6)} ${r(SAD.x+8)} ${r(SAD.y-3)} ${r(SAD.x+42)} ${r(SAD.y)} L ${r(SAD.x+42)} ${r(SAD.y+5)} C ${r(SAD.x+8)} ${r(SAD.y+2)} ${r(SAD.x-20)} ${r(SAD.y-1)} ${r(SAD.x-40)} ${r(SAD.y-3)} Z" fill="currentColor" stroke="none" opacity="0.4"/>
    <rect class="zone-overlay" x="${r(POST.x-50)}" y="${r(POST.y-18)}" width="112" height="${r(ST.y-POST.y+44)}" rx="10" data-zone="dropper"/>
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
  const type=bike.type||'mtb', isFull=(bike.suspensionType||'full')==='full';
  switch(type){
    case 'mtb':        return isFull?svgMTBFS(false):svgHardtail(false);
    case 'emtb':       return svgMTBFS(true);
    case 'dirtjumper': return svgHardtail(true);
    case 'gravel':     return svgGravelRoad(false);
    case 'road':       return svgGravelRoad(true);
    default:           return svgMTBFS(false);
  }
}

export function createMiniSilhouette(bikeType) {
  const fake={
    mtb:{type:'mtb',suspensionType:'full'}, emtb:{type:'emtb',suspensionType:'full'},
    dirtjumper:{type:'dirtjumper',suspensionType:'hardtail'}, gravel:{type:'gravel'}, road:{type:'road'},
  };
  let svg=createSilhouette(fake[bikeType]||fake.mtb);
  svg=svg.replace(/id="bike-svg"/,'class="mini-silhouette"');
  svg=svg.replace(/<(?:circle|ellipse|rect|polygon)[^>]*class="zone-overlay[^"]*"[^/]*\/>/g,'');
  svg=svg.replace(/id="g-[^"]*"/g,'');
  return svg;
}

// ── ZOOM ──────────────────────────────────────────────────
let _currentVB=[...VB_DEFAULT],_animFrame=null,_activeZone=null;
function lerpVB(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
function easeOutCubic(t){return 1-Math.pow(1-t,3);}

export function animateViewBox(svg,targetVB,duration=480){
  if(_animFrame)cancelAnimationFrame(_animFrame);
  const startVB=[..._currentVB],start=performance.now();
  function step(now){
    const raw=Math.min((now-start)/duration,1);
    _currentVB=lerpVB(startVB,targetVB,easeOutCubic(raw));
    svg.setAttribute('viewBox',_currentVB.join(' '));
    if(raw<1)_animFrame=requestAnimationFrame(step);
  }
  _animFrame=requestAnimationFrame(step);
}

export function resetZoom(svg){_activeZone=null;if(svg)animateViewBox(svg,VB_DEFAULT);}

// ── ZONE INTERACTION ──────────────────────────────────────
export function setupZoneInteraction(container,bike,onZoneClick){
  const svg=container.querySelector('#bike-svg');
  if(!svg)return;
  _currentVB=[...VB_DEFAULT];_activeZone=null;
  svg.setAttribute('viewBox',VB_DEFAULT.join(' '));
  const tooltip=document.getElementById('zone-tooltip');
  const available=getAvailableZones(bike);
  svg.querySelectorAll('.zone-overlay').forEach(overlay=>{
    const zoneId=overlay.getAttribute('data-zone');
    if(!available.includes(zoneId)){overlay.style.display='none';return;}
    const group=svg.querySelector(`#g-${zoneId}`);
    overlay.addEventListener('mouseenter',e=>{
      if(group)group.classList.add('zone-hovered');
      showTooltip(tooltip,zoneId,bike,e,container);
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','0');
    });
    overlay.addEventListener('mouseleave',()=>{
      if(group&&_activeZone!==zoneId)group.classList.remove('zone-hovered');
      tooltip.classList.add('hidden');
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','');
    });
    overlay.addEventListener('mousemove',e=>positionTooltip(tooltip,e,container));
    overlay.addEventListener('click',()=>{
      if(_activeZone){const prev=svg.querySelector(`#g-${_activeZone}`);if(prev)prev.classList.remove('zone-active','zone-hovered');}
      if(_activeZone===zoneId){
        _activeZone=null;resetZoom(svg);
        document.getElementById('btn-zoom-reset')?.classList.add('hidden');
        onZoneClick(null);
      } else {
        _activeZone=zoneId;
        if(group){group.classList.remove('zone-hovered');group.classList.add('zone-active');}
        const meta=ZONE_META[zoneId];if(meta)animateViewBox(svg,meta.vb);
        document.getElementById('btn-zoom-reset')?.classList.remove('hidden');
        onZoneClick(zoneId);
      }
    });
  });
}

function getAvailableZones(bike){
  const base=['front-wheel','rear-wheel','fork','handlebar','drivetrain','dropper','frame'];
  if((bike.type==='mtb'||bike.type==='emtb')&&(bike.suspensionType||'full')==='full')base.push('shock');
  return base;
}

function showTooltip(tooltip,zoneId,bike,e,container){
  const meta=ZONE_META[zoneId];if(!meta)return;
  tooltip.querySelector('.tooltip-zone-name').textContent=meta.label;
  tooltip.querySelector('.tooltip-zone-value').textContent=getZoneQuickValue(zoneId,bike);
  tooltip.classList.remove('hidden');
  positionTooltip(tooltip,e,container);
}

function positionTooltip(tooltip,e,container){
  const rect=container.getBoundingClientRect();
  tooltip.style.left=`${e.clientX-rect.left}px`;
  tooltip.style.top=`${e.clientY-rect.top}px`;
}

export function getZoneQuickValue(zoneId,bike){
  const bl=bike.baseline||{};
  switch(zoneId){
    case 'front-wheel':{const t=bl.frontTire;return t?.brand?`${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim():'Not set';}
    case 'rear-wheel': {const t=bl.rearTire; return t?.brand?`${t.brand} ${t.model||''} ${t.psi?'· '+t.psi+' psi':''}`.trim():'Not set';}
    case 'fork': {const f=bl.fork; return f?.brand?`${f.brand} ${f.model||''} ${f.type==='air'&&f.psi?'· '+f.psi+' psi':f.type==='coil'?'· Coil':''}`.trim():'Not set';}
    case 'shock':{const s=bl.shock;return s?.brand?`${s.brand} ${s.model||''} ${s.type==='air'&&s.psi?'· '+s.psi+' psi':s.type==='coil'?'· Coil':''}`.trim():'Not set';}
    case 'handlebar': return bl.handlebar?.brand ?`${bl.handlebar.brand} ${bl.handlebar.model||''}`.trim() :'Not set';
    case 'drivetrain':return bl.drivetrain?.brand?`${bl.drivetrain.brand} ${bl.drivetrain.model||''}`.trim():'Not set';
    case 'dropper':   return bl.dropper?.brand   ?`${bl.dropper.brand} ${bl.dropper.model||''}`.trim()    :'Not set';
    case 'frame':     return bl.frame?.brand     ?`${bl.frame.brand} ${bl.frame.model||''}`.trim()        :'Not set';
    default:return '—';
  }
}

export {ZONE_META};
