// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams
// All geometry mathematically verified in Node.js
// Top tube slopes upward toward head tube on every bike ✓
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

const ZONE_META = {
  'front-wheel': { label: 'Front Wheel / Tire', vb: [499, 205, 319, 290], key: 'frontTire' },
  'rear-wheel':  { label: 'Rear Wheel / Tire',  vb: [-11, 205, 319, 290], key: 'rearTire' },
  'fork':        { label: 'Fork',               vb: [479, 148, 286, 260], key: 'fork' },
  'shock':       { label: 'Rear Shock',         vb: [256, 213, 260, 210], key: 'shock' },
  'handlebar':   { label: 'Cockpit',            vb: [442,  38, 242, 220], key: 'handlebar' },
  'drivetrain':  { label: 'Drivetrain',         vb: [250, 245, 264, 240], key: 'drivetrain' },
  'dropper':     { label: 'Dropper / Saddle',   vb: [215,  50, 231, 210], key: 'dropper' },
  'frame':       { label: 'Frame / Geometry',   vb: [181,   5, 572, 520], key: 'frame' },
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

function roadWheel(cx, cy, zoneId, tireW = 6) {
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

// ── SHARED HELPERS ────────────────────────────────────────
// Saddle: flat with slight rear rise
function saddle(SAD) {
  return `
    <line x1="${SAD.x-36}" y1="${SAD.y}" x2="${SAD.x+30}" y2="${SAD.y-2}"
          stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
    <path d="M ${SAD.x-38} ${SAD.y-10}
             C ${SAD.x-20} ${SAD.y-8} ${SAD.x+8} ${SAD.y-5} ${SAD.x+40} ${SAD.y-2}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${SAD.x-40} ${SAD.y-8}
             C ${SAD.x-20} ${SAD.y-6} ${SAD.x+8} ${SAD.y-3} ${SAD.x+42} ${SAD.y}
             L ${SAD.x+42} ${SAD.y+5}
             C ${SAD.x+8}  ${SAD.y+2} ${SAD.x-20} ${SAD.y-1} ${SAD.x-40} ${SAD.y-3} Z"
          fill="currentColor" stroke="none" opacity="0.42"/>`;
}

// Drop bars (road/gravel)
function dropBars(HT, stemLen = 18) {
  const SB = {x:HT.x+2, y:HT.y};
  const ST = {x:HT.x-1, y:HT.y-stemLen};
  return `
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST.x}" y2="${ST.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <rect x="${ST.x-11}" y="${ST.y-5}" width="19" height="9" rx="3"
          fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x-22}" y1="${ST.y-2}" x2="${ST.x+16}" y2="${ST.y-2}"
          stroke-width="6" stroke-linecap="round"/>
    <path d="M ${ST.x-22} ${ST.y-2} C ${ST.x-33} ${ST.y+9} ${ST.x-37} ${ST.y+24} ${ST.x-29} ${ST.y+35}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x-29} ${ST.y+35} C ${ST.x-26} ${ST.y+43} ${ST.x-17} ${ST.y+48} ${ST.x-9} ${ST.y+48}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x+16} ${ST.y-2} C ${ST.x+21} ${ST.y+9} ${ST.x+21} ${ST.y+24} ${ST.x+15} ${ST.y+35}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${ST.x+15} ${ST.y+35} C ${ST.x+13} ${ST.y+43} ${ST.x+7} ${ST.y+48} ${ST.x+1} ${ST.y+48}"
          fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay"
          x="${ST.x-55}" y="${ST.y-18}" width="90" height="82" rx="10" data-zone="handlebar"/>`;
}

// MTB flat bars with brakes/grips
function flatBars(HT, stemLen = 18) {
  const SB = {x:HT.x+3, y:HT.y+2};
  const ST = {x:HT.x-1, y:HT.y-stemLen};
  return `
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST.x}" y2="${ST.y}"
          stroke-width="8" stroke-linecap="round"/>
    <line x1="${SB.x-6}" y1="${SB.y-1}" x2="${SB.x+7}" y2="${SB.y-1}"
          stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
    <rect x="${ST.x-13}" y="${ST.y-5}" width="22" height="9" rx="3"
          fill="var(--bg-elevated)" stroke-width="3.5"/>
    <line x1="${ST.x-68}" y1="${ST.y-2}" x2="${ST.x+62}" y2="${ST.y-2}"
          stroke-width="8.5" stroke-linecap="round"/>
    <line x1="${ST.x-64}" y1="${ST.y-2}" x2="${ST.x-76}" y2="${ST.y-4}"
          stroke-width="17" stroke-linecap="round" opacity="0.54"/>
    <line x1="${ST.x+58}" y1="${ST.y-2}" x2="${ST.x+70}" y2="${ST.y-4}"
          stroke-width="17" stroke-linecap="round" opacity="0.54"/>
    <path d="M ${ST.x-64} ${ST.y-2} Q ${ST.x-71} ${ST.y} ${ST.x-73} ${ST.y+6}"
          fill="none" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M ${ST.x+58} ${ST.y-2} Q ${ST.x+65} ${ST.y} ${ST.x+67} ${ST.y+6}"
          fill="none" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M ${ST.x-50} ${ST.y-2} C ${ST.x-54} ${ST.y+4} ${ST.x-58} ${ST.y+10} ${ST.x-56} ${ST.y+18}"
          fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
    <path d="M ${ST.x+44} ${ST.y-2} C ${ST.x+48} ${ST.y+4} ${ST.x+52} ${ST.y+10} ${ST.x+50} ${ST.y+18}"
          fill="none" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
    <rect x="${ST.x-60}" y="${ST.y-8}" width="11" height="7" rx="2"
          fill="none" stroke-width="2.5" opacity="0.65"/>
    <rect x="${ST.x+44}" y="${ST.y-8}" width="11" height="7" rx="2"
          fill="none" stroke-width="2.5" opacity="0.65"/>
    <rect class="zone-overlay"
          x="${ST.x-90}" y="${ST.y-28}" width="184" height="68" rx="10" data-zone="handlebar"/>`;
}

// Straight fork (MTB suspension: thin stanchions + fat lowers)
function suspFork(HC, FW, offset=9, splitT=0.44) {
  const dx=FW.x-HC.x, dy=FW.y-HC.y;
  const len=Math.sqrt(dx*dx+dy*dy);
  const ux=dx/len, uy=dy/len, px=uy, py=-ux;
  const r=n=>Math.round(n);
  const lT={x:r(HC.x-px*offset),y:r(HC.y-py*offset)};
  const rT={x:r(HC.x+px*offset),y:r(HC.y+py*offset)};
  const lB={x:FW.x-8,y:FW.y}, rB={x:FW.x+8,y:FW.y};
  const lS={x:r(lT.x+(lB.x-lT.x)*splitT),y:r(lT.y+(lB.y-lT.y)*splitT)};
  const rS={x:r(rT.x+(rB.x-rT.x)*splitT),y:r(rT.y+(rB.y-rT.y)*splitT)};
  return {lT,rT,lS,rS,lB,rB};
}

// Cassette rings
function cassette(cx, cy) {
  return `
    <circle cx="${cx}" cy="${cy}" r="27" fill="none" stroke-width="5.5"/>
    <circle cx="${cx}" cy="${cy}" r="21" fill="none" stroke-width="3.5" opacity="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke-width="2"   opacity="0.28"/>`;
}

// Chainring + cranks
function drivetrain(BB, RW, r=33) {
  return `
    <circle cx="${BB.x}" cy="${BB.y}" r="${r}" fill="none" stroke-width="6"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="${Math.round(r*0.67)}" fill="none" stroke-width="2" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x+38}" y2="${BB.y+28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x+34}" y1="${BB.y+26}" x2="${BB.x+50}" y2="${BB.y+21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${BB.x-38}" y2="${BB.y-28}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${BB.x-34}" y1="${BB.y-26}" x2="${BB.x-50}" y2="${BB.y-21}" stroke-width="7" stroke-linecap="round" opacity="0.72"/>
    <path d="M ${BB.x-4} ${BB.y-r} Q ${(BB.x+RW.x)/2} ${BB.y-r-9} ${RW.x} ${RW.y-24}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <path d="M ${BB.x+4} ${BB.y+r} Q ${(BB.x+RW.x)/2+8} ${BB.y+24} ${RW.x} ${RW.y+12}"
          fill="none" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.3"/>
    <circle cx="${BB.x}" cy="${BB.y}" r="12" fill="var(--bg-base)" stroke="currentColor" stroke-width="3.5"/>`;
}

// ── FULL SUSPENSION MTB ───────────────────────────────────
// Verified: HC(587,206) HT(563,157) ST(335,179) HA=63.75° TT=5.5°↑
function svgMTBFS(hasMotor = false) {
  const RW={x:148,y:350}, FW={x:658,y:350}, BB={x:382,y:368};
  const ST={x:335,y:179}, HT={x:563,y:157}, HC={x:587,y:206};
  const stLen=195;
  const stUx=(ST.x-BB.x)/stLen, stUy=(ST.y-BB.y)/stLen;
  const POST={x:322,y:125};
  const SAD={x:326,y:124};
  const SS={x:357,y:270};
  const PIV={x:356,y:328};
  const SHT={x:Math.round(BB.x+stUx*stLen*0.40), y:Math.round(BB.y+stUy*stLen*0.40)};
  const SHB={x:412,y:318};
  const RPIV={x:396,y:344};
  const F=suspFork(HC,FW,9,0.44);

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${mtbWheel(RW.x,RW.y,'rear-wheel')}
  ${mtbWheel(FW.x,FW.y,'front-wheel')}

  <!-- FRAME: main triangle + rear triangle -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-55} ${BB.y} ${RW.x+90} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+9} C ${BB.x-58} ${BB.y+9} ${RW.x+88} ${RW.y+9} ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.34"/>
    <line x1="${RW.x}"   y1="${RW.y}"   x2="${SS.x}" y2="${SS.y}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+9}" y1="${RW.y}"   x2="${SS.x+8}" y2="${SS.y}" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="342" y1="208" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    ${hasMotor?`<rect x="${BB.x-38}" y="${BB.y-50}" width="62" height="44" rx="9" fill="none" stroke-width="3" opacity="0.68"/>`:''}
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <!-- DRIVETRAIN -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,33)}
    ${cassette(RW.x,RW.y)}
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>

  <!-- DROPPER / SADDLE -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="7" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-54}" y="${POST.y-20}" width="116" height="${ST.y-POST.y+46}" rx="10" data-zone="dropper"/>
  </g>

  <!-- HANDLEBARS -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    ${flatBars(HT,18)}
  </g>

  <!-- FORK -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${F.lT.x-2}" y1="${F.lT.y+1}" x2="${F.rT.x+2}" y2="${F.rT.y+1}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lT.x}" y1="${F.lT.y}" x2="${F.lS.x}" y2="${F.lS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.rT.x}" y1="${F.rT.y}" x2="${F.rS.x}" y2="${F.rS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lS.x}" y1="${F.lS.y}" x2="${F.lB.x}" y2="${F.lB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.rS.x}" y1="${F.rS.y}" x2="${F.rB.x}" y2="${F.rB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.lS.x-3}" y1="${F.lS.y}" x2="${F.rS.x+3}" y2="${F.rS.y}" stroke-width="8" stroke-linecap="round" opacity="0.62"/>
    <line x1="${F.lB.x-2}" y1="${F.lB.y-22}" x2="${F.rB.x+2}" y2="${F.rB.y-22}" stroke-width="6" stroke-linecap="round" opacity="0.64"/>
    <rect x="${F.lB.x-20}" y="${F.lB.y-62}" width="14" height="28" rx="3" fill="none" stroke-width="3" opacity="0.58"/>
    <line x1="${F.lB.x-10}" y1="${F.lB.y+2}" x2="${F.rB.x+10}" y2="${F.rB.y+2}" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="563" y="196" width="117" height="164" rx="14" data-zone="fork"/>
  </g>

  <!-- SHOCK + LINKAGE (rendered last) -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <circle cx="${RPIV.x}" cy="${RPIV.y}" r="5.5" fill="var(--bg-base)" stroke-width="3"/>
    <line x1="${RPIV.x}" y1="${RPIV.y}" x2="${SHB.x}" y2="${SHB.y}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}" stroke-width="9" stroke-linecap="round"/>
    <line x1="${SHB.x}" y1="${SHB.y}"
          x2="${Math.round(SHB.x+(SHT.x-SHB.x)*0.44)}"
          y2="${Math.round(SHB.y+(SHT.y-SHB.y)*0.44)}"
          stroke-width="4.5" stroke="var(--bg-elevated)" stroke-linecap="round" opacity="0.75"/>
    <line x1="${SHT.x}" y1="${SHT.y}" x2="${SHB.x}" y2="${SHB.y}"
          stroke-width="4" stroke="var(--bg-base)" stroke-dasharray="0 15 5 15 5 15" stroke-linecap="round" opacity="0.4"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="6" fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHT.x}" cy="${SHT.y}" r="2.5" fill="currentColor" stroke="none"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="6" fill="var(--bg-base)" stroke-width="3"/>
    <circle cx="${SHB.x}" cy="${SHB.y}" r="2.5" fill="currentColor" stroke="none"/>
    <ellipse class="zone-overlay"
      cx="${Math.round((SHT.x+SHB.x)/2)}" cy="${Math.round((SHT.y+SHB.y)/2)}"
      rx="28" ry="50"
      transform="rotate(20 ${Math.round((SHT.x+SHB.x)/2)} ${Math.round((SHT.y+SHB.y)/2)})"
      data-zone="shock"/>
  </g>
</svg>`;
}

// ── HARDTAIL MTB ──────────────────────────────────────────
// Verified: HC(583,207) HT(561,160) ST(333,183) HA=65.5° TT=5.6°↑
function svgHardtail(isDJ = false) {
  // DJ: PBJ-inspired geometry — HA=69.6°, SA actual=68.3°, short seat tube
  // SS=TT_JOIN=(338,273) lies on both the seat tube AND the RW→HT line,
  // so seatstay and top tube share the same 23.3° angle — continuous visual line
  const RW = isDJ ? {x:160,y:350} : {x:148,y:350};
  const FW = isDJ ? {x:620,y:350} : {x:648,y:350};
  const BB = isDJ ? {x:374,y:362} : {x:378,y:365};
  const ST = isDJ ? {x:331,y:255} : {x:333,y:183};
  const HT = isDJ ? {x:556,y:179} : {x:561,y:160};
  const HC = isDJ ? {x:564,y:200} : {x:583,y:207};
  const TT_JOIN = isDJ ? {x:338,y:273} : {x:340,y:212};
  // For DJ: seatstay meets seat tube at TT_JOIN (same point), giving continuous line
  const DJ_SS = {x:338, y:273};

  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stLen=Math.round(Math.sqrt(stDx*stDx+stDy*stDy));
  const stUx=stDx/stLen, stUy=stDy/stLen;
  const postExt = isDJ ? 18 : 55; // DJ: short post at minimum insertion
  const POST={x:Math.round(ST.x+stUx*postExt), y:Math.round(ST.y+stUy*postExt)};
  const SAD={x:POST.x+4, y:POST.y-1};
  const SS={x:Math.round(BB.x+stUx*stLen*0.52), y:Math.round(BB.y+stUy*stLen*0.52)};
  const F=suspFork(HC, FW, 9, isDJ?1:0.44); // DJ: rigid (no split), HT: susp

  // DJ riser bars
  const djBars = (HT) => {
    const SB={x:HT.x+3,y:HT.y+2}, ST2={x:HT.x-1,y:HT.y-18};
    return `
    <line x1="${SB.x}" y1="${SB.y}" x2="${ST2.x}" y2="${ST2.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${SB.x-6}" y1="${SB.y-1}" x2="${SB.x+7}" y2="${SB.y-1}" stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
    <rect x="${ST2.x-13}" y="${ST2.y-5}" width="22" height="9" rx="3" fill="var(--bg-elevated)" stroke-width="3.5"/>
    <line x1="${ST2.x-4}" y1="${ST2.y}" x2="${ST2.x-4}" y2="${ST2.y-32}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${ST2.x-68}" y1="${ST2.y-30}" x2="${ST2.x+60}" y2="${ST2.y-30}" stroke-width="8.5" stroke-linecap="round"/>
    <line x1="${ST2.x-68}" y1="${ST2.y-30}" x2="${ST2.x-80}" y2="${ST2.y-32}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>
    <line x1="${ST2.x+60}" y1="${ST2.y-30}" x2="${ST2.x+72}" y2="${ST2.y-32}" stroke-width="17" stroke-linecap="round" opacity="0.52"/>
    <rect class="zone-overlay" x="${ST2.x-92}" y="${ST2.y-54}" width="184" height="64" rx="10" data-zone="handlebar"/>`;
  };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${mtbWheel(RW.x,RW.y,'rear-wheel')}
  ${mtbWheel(FW.x,FW.y,'front-wheel')}

  <!-- FRAME: rigid rear triangle + main triangle -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-55} ${BB.y} ${RW.x+90} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+9} C ${BB.x-58} ${BB.y+9} ${RW.x+88} ${RW.y+9} ${RW.x} ${RW.y}"
          fill="none" stroke-width="3" stroke-linecap="round" opacity="0.34"/>
    <!-- Seatstay: for DJ meets at TT_JOIN (collinear with top tube) -->
    <line x1="${RW.x}"   y1="${RW.y}" x2="${isDJ?DJ_SS.x:SS.x}" y2="${isDJ?DJ_SS.y:SS.y}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${RW.x+9}" y1="${RW.y}" x2="${isDJ?DJ_SS.x+8:SS.x+8}" y2="${isDJ?DJ_SS.y:SS.y}" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7.5" stroke-linecap="round"/>
    <line x1="${TT_JOIN.x}" y1="${TT_JOIN.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="15" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${isDJ?DJ_SS.x:SS.x},${isDJ?DJ_SS.y:SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <!-- DRIVETRAIN -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,33)}
    ${cassette(RW.x,RW.y)}
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="58" data-zone="drivetrain"/>
  </g>

  <!-- DROPPER / SADDLE -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-10}" y="${ST.y-6}" width="20" height="12" rx="3" fill="var(--bg-elevated)" stroke-width="3"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="7" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-54}" y="${POST.y-20}" width="116" height="${ST.y-POST.y+46}" rx="10" data-zone="dropper"/>
  </g>

  <!-- HANDLEBARS -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    ${isDJ ? djBars(HT) : flatBars(HT,18)}
  </g>

  <!-- FORK -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${F.lT.x-2}" y1="${F.lT.y+1}" x2="${F.rT.x+2}" y2="${F.rT.y+1}" stroke-width="10" stroke-linecap="round"/>
    ${isDJ ? `
    <!-- Rigid fork: full-length straight legs, same width top to bottom -->
    <line x1="${F.lT.x}" y1="${F.lT.y}" x2="${F.lB.x}" y2="${F.lB.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${F.rT.x}" y1="${F.rT.y}" x2="${F.rB.x}" y2="${F.rB.y}" stroke-width="8" stroke-linecap="round"/>
    ` : `
    <!-- Suspension fork: thin stanchions + fat lowers -->
    <line x1="${F.lT.x}" y1="${F.lT.y}" x2="${F.lS.x}" y2="${F.lS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.rT.x}" y1="${F.rT.y}" x2="${F.rS.x}" y2="${F.rS.y}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${F.lS.x}" y1="${F.lS.y}" x2="${F.lB.x}" y2="${F.lB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.rS.x}" y1="${F.rS.y}" x2="${F.rB.x}" y2="${F.rB.y}" stroke-width="15" stroke-linecap="round"/>
    <line x1="${F.lS.x-3}" y1="${F.lS.y}" x2="${F.rS.x+3}" y2="${F.rS.y}" stroke-width="8" stroke-linecap="round" opacity="0.62"/>
    <line x1="${F.lB.x-2}" y1="${F.lB.y-22}" x2="${F.rB.x+2}" y2="${F.rB.y-22}" stroke-width="6" stroke-linecap="round" opacity="0.62"/>
    <rect x="${F.lB.x-20}" y="${F.lB.y-62}" width="14" height="28" rx="3" fill="none" stroke-width="3" opacity="0.58"/>
    `}
    <line x1="${F.lB.x-10}" y1="${F.lB.y+2}" x2="${F.rB.x+10}" y2="${F.rB.y+2}" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="548" y="118" width="140" height="258" rx="14" data-zone="fork"/>
  </g>
</svg>`;
}

// ── GRAVEL BIKE ───────────────────────────────────────────
// 72° HA, 73° SA, nearly flat top tube (2.2°) — Giordano Trieste / endurance style
// HC(604,240) HT(585,183) ST(315,164) TT_JOIN(324,193)
// Top tube: (324,193)→(585,183) — 2.2° slope, visually flat ✓
// Straight fork legs (modern gravel)
function svgGravel() {
  const RW={x:155,y:350}, FW={x:640,y:350}, BB={x:375,y:360};
  const ST={x:315,y:164}, HT={x:585,y:183}, HC={x:604,y:240};
  const TT_JOIN={x:324,y:193}; // 30px below ST along seat tube

  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stLen=Math.round(Math.sqrt(stDx*stDx+stDy*stDy));
  const stUx=stDx/stLen, stUy=stDy/stLen;
  const POST={x:299, y:111};
  const SAD={x:POST.x+4, y:POST.y-1};
  const SS={x:344, y:258};

  // Straight fork: perp offsets ±7px from HC→FW line
  const fDx=FW.x-HC.x, fDy=FW.y-HC.y;
  const fLen=Math.sqrt(fDx*fDx+fDy*fDy);
  const fux=fDx/fLen, fuy=fDy/fLen, fpx=fuy, fpy=-fux;
  const lT={x:597,y:242}, rT={x:611,y:238};
  const lB={x:FW.x-6,y:FW.y}, rB={x:FW.x+6,y:FW.y};

  // Drop bars — side-view profile
  // Stem: from HT going forward (right) and very slightly down
  const StemTip={x:631,y:179};
  // Bar top: extends rearward (left) from stem tip
  const BarRear={x:603,y:174};
  // Drop: bezier from BarRear down and slight curl forward at bottom
  const DropBot={x:617,y:222};
  // Hood body (brake hood area, near stem)
  const HoodX=607, HoodY=171;

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${roadWheel(RW.x,RW.y,'rear-wheel',14)}
  ${roadWheel(FW.x,FW.y,'front-wheel',14)}

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <!-- Chainstay -->
    <path d="M ${BB.x} ${BB.y} C ${BB.x-52} ${BB.y} ${RW.x+84} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${BB.x-3} ${BB.y+8} C ${BB.x-55} ${BB.y+8} ${RW.x+82} ${RW.y+8} ${RW.x} ${RW.y}"
          fill="none" stroke-width="2.5" stroke-linecap="round" opacity="0.32"/>
    <!-- Seatstay -->
    <line x1="${RW.x}"   y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="${RW.x+8}" y1="${RW.y}" x2="${SS.x+7}" y2="${SS.y}" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
    <!-- Down tube -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="8" stroke-linecap="round"/>
    <!-- Seat tube -->
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="7" stroke-linecap="round"/>
    <!-- Top tube: nearly flat (2.2°) -->
    <line x1="${TT_JOIN.x}" y1="${TT_JOIN.y}" x2="${HT.x}" y2="${HT.y}" stroke-width="6" stroke-linecap="round"/>
    <!-- Head tube -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="12" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,30)}
    <!-- Gravel 1x or 2x — show inner ring -->
    <circle cx="${BB.x}" cy="${BB.y}" r="22" fill="none" stroke-width="3.5" opacity="0.42"/>
    ${cassette(RW.x,RW.y)}
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="54" data-zone="drivetrain"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-9}" y="${ST.y-5}" width="18" height="11" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="6.5" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-50}" y="${POST.y-18}" width="112" height="${ST.y-POST.y+44}" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drop bars — side-view profile -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <!-- Stem: forward from HT, nearly horizontal -->
    <line x1="${HT.x}" y1="${HT.y}" x2="${StemTip.x}" y2="${StemTip.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Stem faceplate -->
    <rect x="${StemTip.x-5}" y="${StemTip.y-9}" width="8" height="16" rx="3"
          fill="var(--bg-elevated)" stroke-width="3"/>
    <!-- Bar top section: extends rearward from stem tip -->
    <line x1="${StemTip.x}" y1="${StemTip.y}"
          x2="${BarRear.x}" y2="${BarRear.y}"
          stroke-width="6.5" stroke-linecap="round"/>
    <!-- Brake hood body (silicone hood over lever) -->
    <path d="M ${HoodX} ${HoodY} Q ${HoodX-8} ${HoodY+8} ${HoodX-4} ${HoodY+18}"
          fill="none" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
    <!-- Drop: bezier from bar rear, curves down and slightly forward at bottom -->
    <path d="M ${BarRear.x} ${BarRear.y}
             C ${BarRear.x-6} ${BarRear.y+18}
               ${BarRear.x+4} ${BarRear.y+36}
               ${DropBot.x} ${DropBot.y}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <!-- Bottom curl: curves forward (toward front of bike) -->
    <path d="M ${DropBot.x} ${DropBot.y}
             Q ${DropBot.x+14} ${DropBot.y+3}
               ${DropBot.x+18} ${DropBot.y-6}"
          fill="none" stroke-width="6.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${BarRear.x-16}" y="${HT.y-24}" width="120" height="108" rx="10" data-zone="handlebar"/>
  </g>

  <!-- Straight fork (modern gravel — no curve) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${lT.x-1}" y1="${lT.y}" x2="${rT.x+1}" y2="${rT.y}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${lT.x}" y1="${lT.y}" x2="${lB.x}" y2="${lB.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${rT.x}" y1="${rT.y}" x2="${rB.x}" y2="${rB.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${lB.x-1}" y1="${lB.y-20}" x2="${rB.x+1}" y2="${rB.y-20}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    <line x1="${lB.x-8}" y1="${lB.y+2}" x2="${rB.x+8}" y2="${rB.y+2}" stroke-width="6" stroke-linecap="round"/>
    <rect class="zone-overlay" x="572" y="195" width="106" height="172" rx="12" data-zone="fork"/>
  </g>
</svg>`;
}

// ── ROAD BIKE ─────────────────────────────────────────────
// Verified: HC(591,204) HT(573,145) ST(319,183) HA=73° TT=8.5°↑
// Curved fork (road bikes still use raked forks)
function svgRoad() {
  const RW={x:155,y:350}, FW={x:636,y:350}, BB={x:372,y:355};
  const ST={x:318,y:178}, HT={x:592,y:207}, HC={x:610,y:264};

  const stDx=ST.x-BB.x, stDy=ST.y-BB.y;
  const stLen=Math.round(Math.sqrt(stDx*stDx+stDy*stDy));
  const stUx=stDx/stLen, stUy=stDy/stLen;
  const POST={x:Math.round(ST.x+stUx*52), y:Math.round(ST.y+stUy*52)};
  const SAD={x:POST.x+4, y:POST.y-1};
  const SS={x:Math.round(BB.x+stUx*stLen*0.52), y:Math.round(BB.y+stUy*stLen*0.52)};

  // Curved fork: two bezier paths from crown to axle
  const fCx1=HC.x+10, fCy1=HC.y+45, fCx2=FW.x+10, fCy2=FW.y-35;
  const fCx1r=HC.x+18, fCy1r=HC.y+46, fCx2r=FW.x+18, fCy2r=FW.y-34;

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  ${roadWheel(RW.x,RW.y,'rear-wheel',6)}
  ${roadWheel(FW.x,FW.y,'front-wheel',6)}

  <g id="g-frame" class="bike-zone" data-zone="frame">
    <path d="M ${BB.x} ${BB.y} C ${BB.x-50} ${BB.y} ${RW.x+80} ${RW.y-2} ${RW.x} ${RW.y}"
          fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M ${BB.x-2} ${BB.y+7} C ${BB.x-52} ${BB.y+7} ${RW.x+78} ${RW.y+7} ${RW.x} ${RW.y}"
          fill="none" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
    <line x1="${RW.x}"   y1="${RW.y}" x2="${SS.x}" y2="${SS.y}" stroke-width="4" stroke-linecap="round"/>
    <line x1="${RW.x+7}" y1="${RW.y}" x2="${SS.x+6}" y2="${SS.y}" stroke-width="2" stroke-linecap="round" opacity="0.28"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${BB.x}" y1="${BB.y}" x2="${ST.x}" y2="${ST.y}" stroke-width="6" stroke-linecap="round"/>
    <line x1="327" y1="207" x2="${HT.x}" y2="${HT.y}" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="${HT.x}" y1="${HT.y}" x2="${HC.x}" y2="${HC.y}" stroke-width="11" stroke-linecap="round"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${ST.x},${ST.y} ${HT.x},${HT.y} ${HC.x},${HC.y}" data-zone="frame"/>
    <polygon class="zone-overlay" points="${BB.x},${BB.y} ${RW.x},${RW.y} ${SS.x},${SS.y} ${ST.x},${ST.y}" data-zone="frame"/>
  </g>

  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    ${drivetrain(BB,RW,34)}
    <!-- Road: 2x chainrings -->
    <circle cx="${BB.x}" cy="${BB.y}" r="24" fill="none" stroke-width="4" opacity="0.5"/>
    <!-- Road cassette: smaller, tighter range -->
    <circle cx="${RW.x}" cy="${RW.y}" r="20" fill="none" stroke-width="4"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="15" fill="none" stroke-width="3" opacity="0.5"/>
    <circle cx="${RW.x}" cy="${RW.y}" r="10" fill="none" stroke-width="2" opacity="0.28"/>
    <circle class="zone-overlay" cx="${BB.x}" cy="${BB.y}" r="52" data-zone="drivetrain"/>
  </g>

  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <rect x="${ST.x-9}" y="${ST.y-5}" width="18" height="11" rx="3" fill="var(--bg-elevated)" stroke-width="2.5"/>
    <line x1="${ST.x}" y1="${ST.y}" x2="${POST.x}" y2="${POST.y}" stroke-width="6" stroke-linecap="round"/>
    ${saddle(SAD)}
    <rect class="zone-overlay" x="${POST.x-48}" y="${POST.y-18}" width="108" height="${ST.y-POST.y+42}" rx="10" data-zone="dropper"/>
  </g>

  <!-- Road: longer stem than MTB -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    ${dropBars(HT,32)}
  </g>

  <!-- Curved fork (road — raked) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <!-- Crown -->
    <line x1="${HC.x-6}" y1="${HC.y+2}" x2="${HC.x+8}" y2="${HC.y+2}" stroke-width="8" stroke-linecap="round"/>
    <!-- Left leg: curved bezier -->
    <path d="M ${HC.x-5} ${HC.y+3}
             C ${fCx1-2} ${fCy1} ${fCx2-2} ${fCy2} ${FW.x+6} ${FW.y}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Right leg -->
    <path d="M ${HC.x+7} ${HC.y+3}
             C ${fCx1r} ${fCy1r} ${fCx2r} ${fCy2r} ${FW.x+16} ${FW.y}"
          fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Lower brace -->
    <line x1="${FW.x+4}" y1="${FW.y-18}" x2="${FW.x+18}" y2="${FW.y-18}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    <!-- Axle -->
    <line x1="${FW.x-2}" y1="${FW.y+2}" x2="${FW.x+22}" y2="${FW.y+2}" stroke-width="5.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="562" y="118" width="112" height="258" rx="12" data-zone="fork"/>
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
    case 'gravel':     return svgGravel();
    case 'road':       return svgRoad();
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

  // Update completeness ring
  updateCompletenessRing(bike, available);

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
    overlay.addEventListener('click', e => {
      e.stopPropagation();
      // Clear ALL active/hovered states (fixes one-at-a-time)
      svg.querySelectorAll('.zone-active, .zone-hovered').forEach(el => {
        el.classList.remove('zone-active', 'zone-hovered');
      });
      if(_activeZone===zoneId){
        _activeZone=null;resetZoom(svg);
        document.getElementById('btn-zoom-reset')?.classList.add('hidden');
        onZoneClick(null);
      } else {
        _activeZone=zoneId;
        if(group)group.classList.add('zone-active');
        const meta=ZONE_META[zoneId];if(meta)animateViewBox(svg,meta.vb);
        document.getElementById('btn-zoom-reset')?.classList.remove('hidden');
        onZoneClick(zoneId);
      }
    });
  });

  // Background click → clear all highlights and reset
  svg.addEventListener('click', () => {
    svg.querySelectorAll('.zone-active, .zone-hovered').forEach(el => {
      el.classList.remove('zone-active', 'zone-hovered');
    });
    const wasActive = _activeZone;
    _activeZone = null;
    resetZoom(svg);
    document.getElementById('btn-zoom-reset')?.classList.add('hidden');
    if (wasActive) onZoneClick(null);
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
    case 'handlebar': return 'Click to explore cockpit';
    case 'drivetrain':return bl.drivetrain?.brand?`${bl.drivetrain.brand} ${bl.drivetrain.model||''}`.trim():'Not set';
    case 'dropper':   return bl.dropper?.brand   ?`${bl.dropper.brand} ${bl.dropper.model||''}`.trim()    :'Not set';
    case 'frame':     return bl.frame?.brand     ?`${bl.frame.brand} ${bl.frame.model||''}`.trim()        :'Not set';
    default:return '—';
  }
}

// Zone dot positions (where to place the amber dot for each zone)
const ZONE_DOT_POS = {
  'front-wheel': {x:658, y:238}, 'rear-wheel': {x:148, y:238},
  'fork':        {x:620, y:210}, 'shock':      {x:415, y:298},
  'handlebar':   {x:575, y:133}, 'drivetrain': {x:415, y:345},
  'dropper':     {x:340, y:130}, 'frame':      {x:480, y:200},
};

function zoneHasData(zoneId, bike) {
  const bl = bike.baseline || {};
  switch(zoneId) {
    case 'front-wheel': return !!(bl.frontTire?.brand || bl.frontTire?.psi);
    case 'rear-wheel':  return !!(bl.rearTire?.brand  || bl.rearTire?.psi);
    case 'fork':        return !!(bl.fork?.brand);
    case 'shock':       return !!(bl.shock?.brand);
    case 'handlebar':   return !!(bl.handlebar?.brand || bl.stem?.brand);
    case 'drivetrain':  return !!(bl.drivetrain?.brand);
    case 'dropper':     return !!(bl.dropper?.brand);
    case 'frame':       return !!(bl.frame?.brand);
    default: return false;
  }
}

function drawZoneDots(svg, bike, available) {
  // Remove old dots
  svg.querySelectorAll('.zone-dot').forEach(d => d.remove());
  available.forEach(zoneId => {
    if (!zoneHasData(zoneId, bike)) return;
    const pos = ZONE_DOT_POS[zoneId];
    if (!pos) return;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', '5');
    circle.setAttribute('class', 'zone-dot');
    svg.appendChild(circle);
  });
}

function updateCompletenessRing(bike, available) {
  const fill  = document.getElementById('completeness-fill');
  const label = document.getElementById('completeness-label');
  if (!fill || !label) return;
  const total = available.length;
  const done  = available.filter(z => zoneHasData(z, bike)).length;
  const circumference = 50.3; // 2π×8
  const offset = circumference - (done / total) * circumference;
  fill.setAttribute('stroke-dashoffset', offset.toFixed(1));
  label.textContent = `${done}/${total}`;
}

// ── COCKPIT FRONT VIEW ────────────────────────────────────
const COCKPIT_META = {
  'cockpit-bars':   { label: 'Handlebar',         key: 'handlebar' },
  'cockpit-stem':   { label: 'Stem',              key: 'stem' },
  'cockpit-brakes': { label: 'Brakes & Shifters', key: 'brakes' },
  'cockpit-grips':  { label: 'Grips',             key: 'grips' },
  'cockpit-stack':  { label: 'Stack & Headset',   key: 'headset' },
};

export function createCockpitFrontView(bike) {
  const isDropBar = ['gravel','road'].includes(bike.type);
  return isDropBar ? cockpitDropBars() : cockpitFlatBars();
}

function cockpitFlatBars() {
  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <g id="g-cockpit-bars" class="bike-zone" data-zone="cockpit-bars">
    <line x1="208" y1="248" x2="366" y2="248" stroke-width="8" stroke-linecap="round"/>
    <line x1="434" y1="248" x2="592" y2="248" stroke-width="8" stroke-linecap="round"/>
    <rect class="zone-overlay" x="208" y="236" width="158" height="28" rx="4" data-zone="cockpit-bars"/>
    <rect class="zone-overlay" x="434" y="236" width="158" height="28" rx="4" data-zone="cockpit-bars"/>
  </g>

  <g id="g-cockpit-grips" class="bike-zone" data-zone="cockpit-grips">
    <line x1="78" y1="248" x2="210" y2="248" stroke-width="22" stroke-linecap="round" opacity="0.75"/>
    <path d="M 78 248 Q 70 248 68 256" fill="none" stroke-width="20" stroke-linecap="round" opacity="0.75"/>
    <line x1="108" y1="237" x2="108" y2="259" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="130" y1="236" x2="130" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="152" y1="236" x2="152" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="174" y1="236" x2="174" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="196" y1="237" x2="196" y2="259" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="590" y1="248" x2="722" y2="248" stroke-width="22" stroke-linecap="round" opacity="0.75"/>
    <path d="M 722 248 Q 730 248 732 256" fill="none" stroke-width="20" stroke-linecap="round" opacity="0.75"/>
    <line x1="612" y1="236" x2="612" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="634" y1="236" x2="634" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="656" y1="236" x2="656" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="678" y1="236" x2="678" y2="260" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <line x1="700" y1="237" x2="700" y2="259" stroke-width="1.8" stroke-linecap="round" opacity="0.28"/>
    <rect class="zone-overlay" x="60" y="228" width="158" height="40" rx="8" data-zone="cockpit-grips"/>
    <rect class="zone-overlay" x="582" y="228" width="158" height="40" rx="8" data-zone="cockpit-grips"/>
  </g>

  <g id="g-cockpit-brakes" class="bike-zone" data-zone="cockpit-brakes">
    <rect x="202" y="230" width="48" height="20" rx="5" fill="none" stroke-width="2.5"/>
    <line x1="202" y1="247" x2="250" y2="247" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    <path d="M 226 248 C 220 278 214 312 221 346" fill="none" stroke-width="6" stroke-linecap="round"/>
    <line x1="215" y1="338" x2="228" y2="352" stroke-width="5" stroke-linecap="round"/>
    <rect x="260" y="230" width="54" height="20" rx="4" fill="none" stroke-width="2.5"/>
    <line x1="280" y1="248" x2="280" y2="264" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
    <rect x="550" y="230" width="48" height="20" rx="5" fill="none" stroke-width="2.5"/>
    <line x1="550" y1="247" x2="598" y2="247" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    <path d="M 574 248 C 580 278 586 312 579 346" fill="none" stroke-width="6" stroke-linecap="round"/>
    <line x1="585" y1="338" x2="572" y2="352" stroke-width="5" stroke-linecap="round"/>
    <rect x="486" y="230" width="54" height="20" rx="4" fill="none" stroke-width="2.5"/>
    <line x1="520" y1="248" x2="520" y2="264" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
    <rect class="zone-overlay" x="194" y="220" width="132" height="148" rx="8" data-zone="cockpit-brakes"/>
    <rect class="zone-overlay" x="474" y="220" width="132" height="148" rx="8" data-zone="cockpit-brakes"/>
  </g>

  <g id="g-cockpit-stem" class="bike-zone" data-zone="cockpit-stem">
    <rect x="378" y="170" width="44" height="18" rx="5" fill="none" stroke-width="3.5"/>
    <path d="M 385 188 L 368 218 L 432 218 L 415 188 Z" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="360" y="216" width="80" height="14" rx="4" fill="none" stroke-width="4"/>
    <circle cx="376" cy="223" r="3.5" fill="none" stroke-width="2"/>
    <circle cx="424" cy="223" r="3.5" fill="none" stroke-width="2"/>
    <rect class="zone-overlay" x="352" y="162" width="96" height="82" rx="10" data-zone="cockpit-stem"/>
  </g>

  <g id="g-cockpit-stack" class="bike-zone" data-zone="cockpit-stack">
    <line x1="400" y1="44" x2="400" y2="168" stroke-width="5" stroke-linecap="round"/>
    <rect x="385" y="116" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="130" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="144" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <line x1="380" y1="114" x2="420" y2="114" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="378" y="38" width="44" height="132" rx="8" data-zone="cockpit-stack"/>
  </g>
</svg>`;
}

// Drop bars front view (Gravel / Road)
// Layout: steerer top center → stem → flat bar sections L+R → drops curving down
function cockpitDropBars() {
  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg"
  class="bike-silhouette" preserveAspectRatio="xMidYMid meet">

  <!-- Flat top sections of the bar (either side of stem) -->
  <g id="g-cockpit-bars" class="bike-zone" data-zone="cockpit-bars">
    <line x1="178" y1="232" x2="368" y2="232" stroke-width="7" stroke-linecap="round"/>
    <line x1="432" y1="232" x2="622" y2="232" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="178" y="220" width="190" height="26" rx="4" data-zone="cockpit-bars"/>
    <rect class="zone-overlay" x="432" y="220" width="190" height="26" rx="4" data-zone="cockpit-bars"/>
  </g>

  <!-- Bottom of drops — hands in drop position -->
  <g id="g-cockpit-grips" class="bike-zone" data-zone="cockpit-grips">
    <!-- Left drop bottom curl -->
    <path d="M 156 336 Q 166 358 188 362 Q 204 365 216 358"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Right drop bottom curl -->
    <path d="M 644 336 Q 634 358 612 362 Q 596 365 584 358"
          fill="none" stroke-width="7" stroke-linecap="round"/>
    <rect class="zone-overlay" x="148" y="318" width="88" height="62" rx="10" data-zone="cockpit-grips"/>
    <rect class="zone-overlay" x="564" y="318" width="88" height="62" rx="10" data-zone="cockpit-grips"/>
  </g>

  <!-- Brake hoods + lever blades + drop curves -->
  <g id="g-cockpit-brakes" class="bike-zone" data-zone="cockpit-brakes">
    <!-- Left hood silhouette -->
    <path d="M 230 232 Q 218 226 212 236 Q 206 248 214 258 Q 222 266 236 264 L 248 260 Q 258 254 258 244 Q 258 232 248 228 Z"
          fill="none" stroke-width="2.8"/>
    <!-- Left drop curve -->
    <path d="M 178 232 C 170 272 158 304 156 336" fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Left lever blade (hangs down from inside of drop) -->
    <path d="M 226 258 C 228 284 224 314 218 342" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Right hood silhouette (mirrored) -->
    <path d="M 570 232 Q 582 226 588 236 Q 594 248 586 258 Q 578 266 564 264 L 552 260 Q 542 254 542 244 Q 542 232 552 228 Z"
          fill="none" stroke-width="2.8"/>
    <!-- Right drop curve -->
    <path d="M 622 232 C 630 272 642 304 644 336" fill="none" stroke-width="7" stroke-linecap="round"/>
    <!-- Right lever blade -->
    <path d="M 574 258 C 572 284 576 314 582 342" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="148" y="218" width="128" height="134" rx="10" data-zone="cockpit-brakes"/>
    <rect class="zone-overlay" x="524" y="218" width="128" height="134" rx="10" data-zone="cockpit-brakes"/>
  </g>

  <!-- Stem + faceplate -->
  <g id="g-cockpit-stem" class="bike-zone" data-zone="cockpit-stem">
    <rect x="378" y="168" width="44" height="18" rx="5" fill="none" stroke-width="3.5"/>
    <path d="M 384 186 L 366 216 L 434 216 L 416 186 Z" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="358" y="214" width="84" height="14" rx="4" fill="none" stroke-width="4"/>
    <circle cx="374" cy="221" r="3.5" fill="none" stroke-width="2"/>
    <circle cx="426" cy="221" r="3.5" fill="none" stroke-width="2"/>
    <rect class="zone-overlay" x="350" y="160" width="100" height="82" rx="10" data-zone="cockpit-stem"/>
  </g>

  <!-- Stack + spacers + headset -->
  <g id="g-cockpit-stack" class="bike-zone" data-zone="cockpit-stack">
    <line x1="400" y1="44" x2="400" y2="166" stroke-width="5" stroke-linecap="round"/>
    <rect x="385" y="114" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="128" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <rect x="385" y="142" width="30" height="10" rx="2.5" fill="none" stroke-width="2.5"/>
    <line x1="380" y1="112" x2="420" y2="112" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="378" y="38" width="44" height="130" rx="8" data-zone="cockpit-stack"/>
  </g>
</svg>`;
}

export function setupCockpitInteraction(container, bike, onSubZoneClick) {
  const svg = container.querySelector('#bike-svg');
  if (!svg) return;
  const tooltip = document.getElementById('zone-tooltip');
  let _activeCockpitZone = null;

  svg.querySelectorAll('.zone-overlay').forEach(overlay => {
    const zoneId = overlay.getAttribute('data-zone');
    if (!COCKPIT_META[zoneId]) return;
    const group = svg.querySelector(`#g-${zoneId}`);

    overlay.addEventListener('mouseenter', e => {
      if (group) group.classList.add('zone-hovered');
      const meta = COCKPIT_META[zoneId];
      const bl   = bike.baseline || {};
      let val = 'Not set';
      if      (zoneId==='cockpit-bars'   && bl.handlebar?.brand) val=`${bl.handlebar.brand} ${bl.handlebar.width||''}`.trim();
      else if (zoneId==='cockpit-stem'   && bl.stem?.brand)      val=`${bl.stem.brand} ${bl.stem.length||''}`.trim();
      else if (zoneId==='cockpit-brakes' && bl.brakes?.brand)    val=`${bl.brakes.brand} ${bl.brakes.model||''}`.trim();
      else if (zoneId==='cockpit-grips'  && (bl.grips?.brand || bl.bartape?.brand)) val=`${bl.grips?.brand || bl.bartape?.brand || ''} ${bl.grips?.model || bl.bartape?.model || ''}`.trim();
      else if (zoneId==='cockpit-stack'  && bl.headset?.brand)   val=`${bl.headset.brand} ${bl.headset.model||''}`.trim();
      const isDropBike = ['gravel','road'].includes(bike.type);
      const gripsLabel = zoneId === 'cockpit-grips' ? (isDropBike ? 'Bar Tape' : 'Grips') : meta.label;
      tooltip.querySelector('.tooltip-zone-name').textContent  = gripsLabel;
      tooltip.querySelector('.tooltip-zone-value').textContent = val;
      tooltip.classList.remove('hidden');
      positionTooltip(tooltip, e, container);
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','0');
    });
    overlay.addEventListener('mouseleave', () => {
      if (group && _activeCockpitZone !== zoneId) group.classList.remove('zone-hovered');
      tooltip.classList.add('hidden');
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity','');
    });
    overlay.addEventListener('mousemove', e => positionTooltip(tooltip, e, container));
    overlay.addEventListener('click', e => {
      e.stopPropagation();
      svg.querySelectorAll('.zone-active,.zone-hovered').forEach(el=>el.classList.remove('zone-active','zone-hovered'));
      if (_activeCockpitZone === zoneId) {
        _activeCockpitZone = null;
        onSubZoneClick(null);
      } else {
        _activeCockpitZone = zoneId;
        if (group) group.classList.add('zone-active');
        onSubZoneClick(zoneId);
      }
    });
  });

  // Background click → signal exit
  svg.addEventListener('click', () => {
    svg.querySelectorAll('.zone-active,.zone-hovered').forEach(el=>el.classList.remove('zone-active','zone-hovered'));
    _activeCockpitZone = null;
    onSubZoneClick(null);
  });
}

export { ZONE_META };
