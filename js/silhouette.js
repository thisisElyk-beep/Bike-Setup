// ─────────────────────────────────────────────────────────
// SILHOUETTE — SVG bike diagrams with zone interaction
// ─────────────────────────────────────────────────────────

const VB_DEFAULT = [0, 0, 800, 480];

// Zone definitions: viewBox target for zoom, label, tooltip key
const ZONE_META = {
  'front-wheel':  { label: 'Front Wheel / Tire', vb: [435, 190, 270, 270], key: 'frontTire' },
  'rear-wheel':   { label: 'Rear Wheel / Tire',  vb: [22,  190, 270, 270], key: 'rearTire' },
  'fork':         { label: 'Fork',               vb: [445, 130, 210, 240], key: 'fork' },
  'shock':        { label: 'Rear Shock',         vb: [218, 145, 230, 200], key: 'shock' },
  'handlebar':    { label: 'Cockpit / Bars',     vb: [430,  88, 185, 165], key: 'handlebar' },
  'drivetrain':   { label: 'Drivetrain',         vb: [285, 305, 200, 165], key: 'drivetrain' },
  'dropper':      { label: 'Dropper / Saddle',   vb: [228,  82, 190, 210], key: 'dropper' },
  'frame':        { label: 'Frame / Geometry',   vb: [120, 110, 440, 300], key: 'frame' },
};

// ── SVG TEMPLATES ─────────────────────────────────────────

function wheelSpokes(cx, cy, r, count = 8) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * (r - 20);
    const y2 = cy + Math.sin(a) * (r - 20);
    s += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="1" opacity="0.3"/>`;
  }
  return s;
}

function wheel(cx, cy, r, zoneId) {
  return `
  <g id="g-${zoneId}" class="bike-zone" data-zone="${zoneId}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="12"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 22}" fill="none" stroke-width="1.5" stroke-dasharray="7 4" opacity="0.35"/>
    ${wheelSpokes(cx, cy, r)}
    <circle cx="${cx}" cy="${cy}" r="11" fill="var(--text-muted)" stroke="none"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="var(--bg-base)" stroke="none"/>
    <circle class="zone-overlay" cx="${cx}" cy="${cy}" r="${r + 14}" data-zone="${zoneId}"/>
  </g>`;
}

// Full Suspension MTB / E-MTB
function svgMTBFS(hasMotor = false) {
  const rw = { cx: 182, cy: 332, r: 112 };
  const fw = { cx: 600, cy: 332, r: 112 };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  <defs>
    <filter id="zone-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  ${wheel(rw.cx, rw.cy, rw.r, 'rear-wheel')}
  ${wheel(fw.cx, fw.cy, fw.r, 'front-wheel')}

  <!-- Rear swingarm -->
  <g class="bike-part">
    <path d="M 378 370 Q 280 366 182 332" fill="none" stroke-width="5" stroke-linecap="round"/>
    <line x1="182" y1="332" x2="260" y2="232" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="260" cy="232" r="5.5" fill="none" stroke-width="3"/>
    <circle cx="318" cy="278" r="6.5" fill="none" stroke-width="2.5"/>
  </g>

  <!-- Main frame -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="378" y1="370" x2="312" y2="160" stroke-width="6" stroke-linecap="round"/>
    <path d="M 312 160 C 396 148 496 167 514 185" fill="none" stroke-width="6" stroke-linecap="round"/>
    <line x1="378" y1="370" x2="534" y2="250" stroke-width="7" stroke-linecap="round"/>
    <line x1="514" y1="185" x2="534" y2="250" stroke-width="8" stroke-linecap="round"/>
    ${hasMotor ? `
    <rect x="348" y="282" width="70" height="48" rx="7" fill="none" stroke-width="3" opacity="0.7"/>
    <line x1="348" y1="305" x2="418" y2="305" stroke-width="1.5" opacity="0.5"/>
    <rect x="362" y="290" width="18" height="7" rx="2" fill="var(--text-muted)" opacity="0.5" stroke="none"/>
    ` : ''}
    <rect class="zone-overlay" x="240" y="128" width="330" height="268" rx="10" data-zone="frame"/>
  </g>

  <!-- Rear shock -->
  <g id="g-shock" class="bike-zone" data-zone="shock">
    <line x1="350" y1="215" x2="274" y2="296" stroke-width="9" stroke-linecap="round"/>
    <line x1="350" y1="215" x2="274" y2="296" stroke-width="4" stroke="var(--bg-surface)" stroke-dasharray="0 14 9 14" stroke-linecap="round"/>
    <circle cx="350" cy="215" r="7" fill="none" stroke-width="3"/>
    <circle cx="274" cy="296" r="7" fill="none" stroke-width="3"/>
    <ellipse class="zone-overlay" cx="312" cy="256" rx="52" ry="68" transform="rotate(-44 312 256)" data-zone="shock"/>
  </g>

  <!-- Fork -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="534" y1="250" x2="581" y2="332" stroke-width="6" stroke-linecap="round"/>
    <line x1="524" y1="246" x2="572" y2="330" stroke-width="6" stroke-linecap="round"/>
    <path d="M 524 246 Q 529 238 534 250" fill="none" stroke-width="5" stroke-linecap="round"/>
    <line x1="575" y1="308" x2="584" y2="308" stroke-width="4" stroke-linecap="round"/>
    <rect class="zone-overlay" x="490" y="158" width="126" height="215" rx="10" data-zone="fork"/>
  </g>

  <!-- Handlebars -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="514" y1="185" x2="506" y2="146" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="470" y1="143" x2="542" y2="143" stroke-width="8" stroke-linecap="round"/>
    <line x1="466" y1="143" x2="473" y2="143" stroke-width="14" stroke-linecap="round" opacity="0.7"/>
    <line x1="537" y1="143" x2="544" y2="143" stroke-width="14" stroke-linecap="round" opacity="0.7"/>
    <rect class="zone-overlay" x="450" y="105" width="115" height="92" rx="10" data-zone="handlebar"/>
  </g>

  <!-- Dropper / Saddle -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <line x1="312" y1="160" x2="308" y2="124" stroke-width="5.5" stroke-linecap="round"/>
    <rect x="303" y="155" width="14" height="9" rx="3" fill="var(--text-muted)" stroke="none" opacity="0.6"/>
    <path d="M 280 121 C 297 112 320 110 344 121" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M 277 123 C 296 114 322 112 347 123 L 347 128 C 324 119 298 121 277 128 Z" fill="var(--text-secondary)" stroke="none" opacity="0.55"/>
    <rect class="zone-overlay" x="248" y="92" width="122" height="112" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drivetrain -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="378" cy="370" r="30" fill="none" stroke-width="4.5"/>
    <circle cx="378" cy="370" r="17" fill="none" stroke-width="2" opacity="0.45"/>
    <line x1="378" y1="340" x2="378" y2="353" stroke-width="3.5" opacity="0.55"/>
    <line x1="378" y1="387" x2="378" y2="400" stroke-width="3.5" opacity="0.55"/>
    <line x1="349" y1="370" x2="361" y2="370" stroke-width="3.5" opacity="0.55"/>
    <line x1="395" y1="370" x2="408" y2="370" stroke-width="3.5" opacity="0.55"/>
    <path d="M 406 370 C 510 348 555 338 568 332" fill="none" stroke-width="2" stroke-dasharray="6 3" opacity="0.4"/>
    <path d="M 378 398 C 350 428 262 382 198 354" fill="none" stroke-width="2" stroke-dasharray="6 3" opacity="0.4"/>
    <circle cx="182" cy="332" r="22" fill="none" stroke-width="4.5"/>
    <line x1="378" y1="370" x2="400" y2="398" stroke-width="6" stroke-linecap="round"/>
    <line x1="396" y1="400" x2="414" y2="400" stroke-width="5" stroke-linecap="round"/>
    <circle class="zone-overlay" cx="378" cy="370" r="56" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// Hardtail MTB / Dirt Jumper
function svgHardtail(isDJ = false) {
  const rw = { cx: 182, cy: 332, r: isDJ ? 100 : 112 };
  const fw = { cx: 600, cy: 332, r: isDJ ? 100 : 112 };
  // DJ has sloped top tube
  const seatTop = isDJ ? { x: 330, y: 168 } : { x: 312, y: 160 };
  const headTop  = isDJ ? { x: 535, y: 200 } : { x: 514, y: 185 };
  const headBot  = isDJ ? { x: 552, y: 262 } : { x: 534, y: 250 };
  const bb       = { x: 378, y: 370 };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  <defs>
    <filter id="zone-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  ${wheel(rw.cx, rw.cy, rw.r, 'rear-wheel')}
  ${wheel(fw.cx, fw.cy, fw.r, 'front-wheel')}

  <!-- Rigid rear triangle -->
  <g class="bike-part">
    <path d="M ${bb.x} ${bb.y} Q 280 366 ${rw.cx} ${rw.cy}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <line x1="${rw.cx}" y1="${rw.cy}" x2="${seatTop.x}" y2="${seatTop.y}" stroke-width="4.5" stroke-linecap="round"/>
  </g>

  <!-- Main frame -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${bb.x}" y1="${bb.y}" x2="${seatTop.x}" y2="${seatTop.y}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${seatTop.x}" y1="${seatTop.y}" x2="${headTop.x}" y2="${headTop.y}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${bb.x}" y1="${bb.y}" x2="${headBot.x}" y2="${headBot.y}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${headTop.x}" y1="${headTop.y}" x2="${headBot.x}" y2="${headBot.y}" stroke-width="8" stroke-linecap="round"/>
    <rect class="zone-overlay" x="250" y="135" width="330" height="262" rx="10" data-zone="frame"/>
  </g>

  <!-- Fork -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <line x1="${headBot.x}" y1="${headBot.y}" x2="${fw.cx - 12}" y2="${fw.cy}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${headBot.x - 10}" y1="${headBot.y - 4}" x2="${fw.cx - 22}" y2="${fw.cy}" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${headBot.x - 10} ${headBot.y - 4} Q ${headBot.x - 5} ${headBot.y - 11} ${headBot.x} ${headBot.y}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <line x1="${fw.cx - 20}" y1="${fw.cy - 25}" x2="${fw.cx - 10}" y2="${fw.cy - 25}" stroke-width="4" stroke-linecap="round"/>
    <rect class="zone-overlay" x="505" y="162" width="122" height="212" rx="10" data-zone="fork"/>
  </g>

  <!-- Handlebars ${isDJ ? '(riser bars)' : ''} -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    ${isDJ
      ? `<line x1="${headTop.x}" y1="${headTop.y}" x2="${headTop.x - 6}" y2="${headTop.y - 45}" stroke-width="5.5" stroke-linecap="round"/>
         <line x1="${headTop.x - 42}" y1="${headTop.y - 45}" x2="${headTop.x + 42}" y2="${headTop.y - 45}" stroke-width="9" stroke-linecap="round"/>
         <line x1="${headTop.x - 46}" y1="${headTop.y - 45}" x2="${headTop.x - 38}" y2="${headTop.y - 45}" stroke-width="15" stroke-linecap="round" opacity="0.7"/>
         <line x1="${headTop.x + 38}" y1="${headTop.y - 45}" x2="${headTop.x + 46}" y2="${headTop.y - 45}" stroke-width="15" stroke-linecap="round" opacity="0.7"/>`
      : `<line x1="${headTop.x}" y1="${headTop.y}" x2="${headTop.x - 8}" y2="${headTop.y - 39}" stroke-width="5.5" stroke-linecap="round"/>
         <line x1="${headTop.x - 44}" y1="${headTop.y - 40}" x2="${headTop.x + 36}" y2="${headTop.y - 40}" stroke-width="8" stroke-linecap="round"/>
         <line x1="${headTop.x - 48}" y1="${headTop.y - 40}" x2="${headTop.x - 41}" y2="${headTop.y - 40}" stroke-width="14" stroke-linecap="round" opacity="0.7"/>
         <line x1="${headTop.x + 33}" y1="${headTop.y - 40}" x2="${headTop.x + 40}" y2="${headTop.y - 40}" stroke-width="14" stroke-linecap="round" opacity="0.7"/>`
    }
    <rect class="zone-overlay" x="${headTop.x - 60}" y="${headTop.y - 80}" width="128" height="90" rx="10" data-zone="handlebar"/>
  </g>

  <!-- ${isDJ ? 'No dropper — seat is fixed on DJ' : 'Dropper / Saddle'} -->
  ${!isDJ ? `<g id="g-dropper" class="bike-zone" data-zone="dropper">
    <line x1="${seatTop.x}" y1="${seatTop.y}" x2="${seatTop.x - 4}" y2="${seatTop.y - 36}" stroke-width="5.5" stroke-linecap="round"/>
    <rect x="${seatTop.x - 9}" y="${seatTop.y - 5}" width="14" height="9" rx="3" fill="var(--text-muted)" stroke="none" opacity="0.6"/>
    <path d="M ${seatTop.x - 32} ${seatTop.y - 39} C ${seatTop.x - 15} ${seatTop.y - 48} ${seatTop.x + 8} ${seatTop.y - 50} ${seatTop.x + 34} ${seatTop.y - 39}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M ${seatTop.x - 35} ${seatTop.y - 37} C ${seatTop.x - 14} ${seatTop.y - 47} ${seatTop.x + 10} ${seatTop.y - 49} ${seatTop.x + 37} ${seatTop.y - 37} L ${seatTop.x + 37} ${seatTop.y - 32} C ${seatTop.x + 10} ${seatTop.y - 44} ${seatTop.x - 14} ${seatTop.y - 42} ${seatTop.x - 35} ${seatTop.y - 32} Z" fill="var(--text-secondary)" stroke="none" opacity="0.55"/>
    <rect class="zone-overlay" x="${seatTop.x - 48}" y="${seatTop.y - 72}" width="120" height="108" rx="10" data-zone="dropper"/>
  </g>` : `
  <!-- DJ saddle (not a dropper) -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <line x1="${seatTop.x}" y1="${seatTop.y}" x2="${seatTop.x - 2}" y2="${seatTop.y - 30}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${seatTop.x - 28} ${seatTop.y - 33} C ${seatTop.x - 10} ${seatTop.y - 40} ${seatTop.x + 12} ${seatTop.y - 42} ${seatTop.x + 30} ${seatTop.y - 33}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M ${seatTop.x - 31} ${seatTop.y - 31} C ${seatTop.x - 11} ${seatTop.y - 39} ${seatTop.x + 13} ${seatTop.y - 41} ${seatTop.x + 33} ${seatTop.y - 31} L ${seatTop.x + 33} ${seatTop.y - 26} C ${seatTop.x + 13} ${seatTop.y - 36} ${seatTop.x - 11} ${seatTop.y - 34} ${seatTop.x - 31} ${seatTop.y - 26} Z" fill="var(--text-secondary)" stroke="none" opacity="0.55"/>
    <rect class="zone-overlay" x="${seatTop.x - 44}" y="${seatTop.y - 65}" width="118" height="100" rx="10" data-zone="dropper"/>
  </g>`}

  <!-- Drivetrain -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${bb.x}" cy="${bb.y}" r="30" fill="none" stroke-width="4.5"/>
    <circle cx="${bb.x}" cy="${bb.y}" r="17" fill="none" stroke-width="2" opacity="0.45"/>
    <line x1="${bb.x}" y1="${bb.y - 30}" x2="${bb.x}" y2="${bb.y - 17}" stroke-width="3.5" opacity="0.55"/>
    <line x1="${bb.x}" y1="${bb.y + 17}" x2="${bb.x}" y2="${bb.y + 30}" stroke-width="3.5" opacity="0.55"/>
    <line x1="${bb.x - 30}" y1="${bb.y}" x2="${bb.x - 17}" y2="${bb.y}" stroke-width="3.5" opacity="0.55"/>
    <line x1="${bb.x + 17}" y1="${bb.y}" x2="${bb.x + 30}" y2="${bb.y}" stroke-width="3.5" opacity="0.55"/>
    <circle cx="${rw.cx}" cy="${rw.cy}" r="22" fill="none" stroke-width="4.5"/>
    <line x1="${bb.x}" y1="${bb.y}" x2="${bb.x + 22}" y2="${bb.y + 28}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${bb.x + 18}" y1="${bb.y + 30}" x2="${bb.x + 36}" y2="${bb.y + 30}" stroke-width="5" stroke-linecap="round"/>
    <circle class="zone-overlay" cx="${bb.x}" cy="${bb.y}" r="56" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// Gravel / Road (drop bars, no suspension)
function svgGravelRoad(isRoad = false) {
  const tireR = isRoad ? 5 : 9;
  const rw = { cx: 182, cy: 332, r: 112 };
  const fw = { cx: 600, cy: 332, r: 112 };
  const bb = { x: 378, y: 370 };
  const headTop = { x: 542, y: 192 };
  const headBot = { x: 558, y: 255 };
  const seatTop = { x: 320, y: 162 };

  return `<svg id="bike-svg" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike-silhouette" preserveAspectRatio="xMidYMid meet">
  <defs>
    <filter id="zone-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Rear wheel -->
  <g id="g-rear-wheel" class="bike-zone" data-zone="rear-wheel">
    <circle cx="${rw.cx}" cy="${rw.cy}" r="${rw.r}" fill="none" stroke-width="${isRoad ? 6 : 11}"/>
    ${!isRoad ? `<circle cx="${rw.cx}" cy="${rw.cy}" r="${rw.r - 20}" fill="none" stroke-width="1.5" stroke-dasharray="7 4" opacity="0.3"/>` : ''}
    ${wheelSpokes(rw.cx, rw.cy, rw.r)}
    <circle cx="${rw.cx}" cy="${rw.cy}" r="11" fill="var(--text-muted)" stroke="none"/>
    <circle cx="${rw.cx}" cy="${rw.cy}" r="5" fill="var(--bg-base)" stroke="none"/>
    <circle class="zone-overlay" cx="${rw.cx}" cy="${rw.cy}" r="${rw.r + 14}" data-zone="rear-wheel"/>
  </g>

  <!-- Front wheel -->
  <g id="g-front-wheel" class="bike-zone" data-zone="front-wheel">
    <circle cx="${fw.cx}" cy="${fw.cy}" r="${fw.r}" fill="none" stroke-width="${isRoad ? 6 : 11}"/>
    ${!isRoad ? `<circle cx="${fw.cx}" cy="${fw.cy}" r="${fw.r - 20}" fill="none" stroke-width="1.5" stroke-dasharray="7 4" opacity="0.3"/>` : ''}
    ${wheelSpokes(fw.cx, fw.cy, fw.r)}
    <circle cx="${fw.cx}" cy="${fw.cy}" r="11" fill="var(--text-muted)" stroke="none"/>
    <circle cx="${fw.cx}" cy="${fw.cy}" r="5" fill="var(--bg-base)" stroke="none"/>
    <circle class="zone-overlay" cx="${fw.cx}" cy="${fw.cy}" r="${fw.r + 14}" data-zone="front-wheel"/>
  </g>

  <!-- Rear triangle -->
  <g class="bike-part">
    <path d="M ${bb.x} ${bb.y} Q 280 366 ${rw.cx} ${rw.cy}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="${rw.cx}" y1="${rw.cy}" x2="${seatTop.x}" y2="${seatTop.y}" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- Main frame -->
  <g id="g-frame" class="bike-zone" data-zone="frame">
    <line x1="${bb.x}" y1="${bb.y}" x2="${seatTop.x}" y2="${seatTop.y}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${seatTop.x}" y1="${seatTop.y}" x2="${headTop.x}" y2="${headTop.y}" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="${bb.x}" y1="${bb.y}" x2="${headBot.x}" y2="${headBot.y}" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="${headTop.x}" y1="${headTop.y}" x2="${headBot.x}" y2="${headBot.y}" stroke-width="8" stroke-linecap="round"/>
    <rect class="zone-overlay" x="252" y="130" width="345" height="268" rx="10" data-zone="frame"/>
  </g>

  <!-- Rigid fork (road/gravel) -->
  <g id="g-fork" class="bike-zone" data-zone="fork">
    <path d="M ${headBot.x} ${headBot.y} C ${headBot.x + 15} ${headBot.y + 50} ${fw.cx + 12} ${fw.cy - 60} ${fw.cx + 8} ${fw.cy}" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${headBot.x - 8} ${headBot.y - 2} C ${headBot.x + 8} ${headBot.y + 48} ${fw.cx + 2} ${fw.cy - 60} ${fw.cx - 2} ${fw.cy}" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M ${headBot.x - 8} ${headBot.y - 2} Q ${headBot.x - 4} ${headBot.y - 9} ${headBot.x} ${headBot.y}" fill="none" stroke-width="5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="520" y="160" width="115" height="215" rx="10" data-zone="fork"/>
  </g>

  <!-- Drop bars -->
  <g id="g-handlebar" class="bike-zone" data-zone="handlebar">
    <line x1="${headTop.x}" y1="${headTop.y}" x2="${headTop.x - 4}" y2="${headTop.y - 38}" stroke-width="5" stroke-linecap="round"/>
    <!-- Hood -->
    <path d="M ${headTop.x - 22} ${headTop.y - 40} C ${headTop.x - 10} ${headTop.y - 48} ${headTop.x + 4} ${headTop.y - 44} ${headTop.x + 10} ${headTop.y - 38}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Drop -->
    <path d="M ${headTop.x - 22} ${headTop.y - 40} C ${headTop.x - 30} ${headTop.y - 30} ${headTop.x - 32} ${headTop.y - 15} ${headTop.x - 22} ${headTop.y - 8}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M ${headTop.x + 10} ${headTop.y - 38} C ${headTop.x + 14} ${headTop.y - 30} ${headTop.x + 14} ${headTop.y - 15} ${headTop.x + 4} ${headTop.y - 8}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <rect class="zone-overlay" x="${headTop.x - 48}" y="${headTop.y - 80}" width="100" height="90" rx="10" data-zone="handlebar"/>
  </g>

  <!-- Saddle (no dropper for road/gravel) -->
  <g id="g-dropper" class="bike-zone" data-zone="dropper">
    <line x1="${seatTop.x}" y1="${seatTop.y}" x2="${seatTop.x - 2}" y2="${seatTop.y - 38}" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${seatTop.x - 30} ${seatTop.y - 40} C ${seatTop.x - 12} ${seatTop.y - 50} ${seatTop.x + 10} ${seatTop.y - 52} ${seatTop.x + 32} ${seatTop.y - 40}" fill="none" stroke-width="4" stroke-linecap="round"/>
    <path d="M ${seatTop.x - 33} ${seatTop.y - 38} C ${seatTop.x - 12} ${seatTop.y - 49} ${seatTop.x + 11} ${seatTop.y - 51} ${seatTop.x + 35} ${seatTop.y - 38} L ${seatTop.x + 35} ${seatTop.y - 33} C ${seatTop.x + 11} ${seatTop.y - 46} ${seatTop.x - 12} ${seatTop.y - 44} ${seatTop.x - 33} ${seatTop.y - 33} Z" fill="var(--text-secondary)" stroke="none" opacity="0.55"/>
    <rect class="zone-overlay" x="${seatTop.x - 46}" y="${seatTop.y - 72}" width="116" height="110" rx="10" data-zone="dropper"/>
  </g>

  <!-- Drivetrain -->
  <g id="g-drivetrain" class="bike-zone" data-zone="drivetrain">
    <circle cx="${bb.x}" cy="${bb.y}" r="30" fill="none" stroke-width="4.5"/>
    <circle cx="${bb.x}" cy="${bb.y}" r="20" fill="none" stroke-width="2" opacity="0.45"/>
    <circle cx="${rw.cx}" cy="${rw.cy}" r="18" fill="none" stroke-width="4.5"/>
    <line x1="${bb.x}" y1="${bb.y}" x2="${bb.x + 22}" y2="${bb.y + 28}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${bb.x + 18}" y1="${bb.y + 30}" x2="${bb.x + 36}" y2="${bb.y + 30}" stroke-width="5" stroke-linecap="round"/>
    <circle class="zone-overlay" cx="${bb.x}" cy="${bb.y}" r="55" data-zone="drivetrain"/>
  </g>
</svg>`;
}

// ── SVG FACTORY ───────────────────────────────────────────

export function createSilhouette(bike) {
  const type = bike.type || 'mtb';
  const isFull = (bike.suspensionType || 'full') === 'full';

  switch (type) {
    case 'mtb':     return isFull ? svgMTBFS(false) : svgHardtail(false);
    case 'emtb':    return svgMTBFS(true);
    case 'dirtjumper': return svgHardtail(true);
    case 'gravel':  return svgGravelRoad(false);
    case 'road':    return svgGravelRoad(true);
    default:        return svgMTBFS(false);
  }
}

// Mini silhouette for bike cards
export function createMiniSilhouette(bikeType) {
  const maps = {
    mtb: svgMTBFS(false),
    emtb: svgMTBFS(true),
    dirtjumper: svgHardtail(true),
    gravel: svgGravelRoad(false),
    road: svgGravelRoad(true),
  };
  const svg = maps[bikeType] || maps.mtb;
  return svg
    .replace(/id="bike-svg"/, 'class="mini-silhouette"')
    .replace(/class="zone-overlay[^"]*"[^/]*\/>/g, '')
    .replace(/data-zone="[^"]*"/g, '')
    .replace(/id="g-[^"]*"/g, '');
}

// ── ZOOM INTERACTION ──────────────────────────────────────

let _currentVB = [...VB_DEFAULT];
let _animFrame = null;
let _activeZone = null;

function lerpVB(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

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
  animateViewBox(svg, VB_DEFAULT);
}

// ── ZONE EVENT SETUP ──────────────────────────────────────

export function setupZoneInteraction(container, bike, onZoneClick) {
  const svg = container.querySelector('#bike-svg');
  if (!svg) return;

  _currentVB = [...VB_DEFAULT];
  svg.setAttribute('viewBox', VB_DEFAULT.join(' '));

  const tooltip = document.getElementById('zone-tooltip');
  const overlays = svg.querySelectorAll('.zone-overlay');

  // Zones available for this bike type
  const availableZones = getAvailableZones(bike);

  overlays.forEach(overlay => {
    const zoneId = overlay.getAttribute('data-zone');
    if (!availableZones.includes(zoneId)) {
      overlay.style.display = 'none';
      return;
    }

    const group = svg.querySelector(`#g-${zoneId}`);

    overlay.addEventListener('mouseenter', (e) => {
      if (group) group.classList.add('zone-hovered');
      showTooltip(tooltip, overlay, zoneId, bike, e);
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity', '0');
    });

    overlay.addEventListener('mouseleave', () => {
      if (group && _activeZone !== zoneId) group.classList.remove('zone-hovered');
      tooltip.classList.add('hidden');
      document.querySelector('.silhouette-hint')?.style.setProperty('opacity', '');
    });

    overlay.addEventListener('mousemove', (e) => {
      positionTooltip(tooltip, e, container);
    });

    overlay.addEventListener('click', () => {
      // Deactivate previous
      if (_activeZone) {
        const prev = svg.querySelector(`#g-${_activeZone}`);
        if (prev) { prev.classList.remove('zone-active', 'zone-hovered'); }
      }

      if (_activeZone === zoneId) {
        // Click same zone → reset
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
  if (type === 'road' || type === 'gravel') {
    return base.filter(z => z !== 'shock');
  }
  if (type === 'dirtjumper') {
    return base.filter(z => z !== 'shock');
  }
  return base;
}

function showTooltip(tooltip, overlay, zoneId, bike, e) {
  const meta = ZONE_META[zoneId];
  if (!meta) return;

  const zoneName = tooltip.querySelector('.tooltip-zone-name');
  const zoneVal = tooltip.querySelector('.tooltip-zone-value');
  zoneName.textContent = meta.label;
  zoneVal.textContent = getZoneQuickValue(zoneId, bike);
  tooltip.classList.remove('hidden');
}

function positionTooltip(tooltip, e, container) {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

export function getZoneQuickValue(zoneId, bike) {
  const bl = bike.baseline || {};
  switch (zoneId) {
    case 'front-wheel': {
      const t = bl.frontTire;
      if (!t?.brand) return 'Not set';
      return `${t.brand} ${t.model || ''} ${t.size ? `· ${t.size}` : ''} ${t.psi ? `· ${t.psi} PSI` : ''}`.trim();
    }
    case 'rear-wheel': {
      const t = bl.rearTire;
      if (!t?.brand) return 'Not set';
      return `${t.brand} ${t.model || ''} ${t.size ? `· ${t.size}` : ''} ${t.psi ? `· ${t.psi} PSI` : ''}`.trim();
    }
    case 'fork': {
      const f = bl.fork;
      if (!f?.brand) return 'Not set';
      const psi = f.type === 'air' && f.psi ? `· ${f.psi} PSI` : f.type === 'coil' ? '· Coil' : '';
      return `${f.brand} ${f.model || ''} ${psi}`.trim();
    }
    case 'shock': {
      const s = bl.shock;
      if (!s?.brand) return 'Not set';
      const psi = s.type === 'air' && s.psi ? `· ${s.psi} PSI` : s.type === 'coil' ? '· Coil' : '';
      return `${s.brand} ${s.model || ''} ${psi}`.trim();
    }
    case 'handlebar': return bl.handlebar?.brand ? `${bl.handlebar.brand} ${bl.handlebar.model || ''}`.trim() : 'Not set';
    case 'drivetrain': return bl.drivetrain?.brand ? `${bl.drivetrain.brand} ${bl.drivetrain.model || ''}`.trim() : 'Not set';
    case 'dropper':    return bl.dropper?.brand ? `${bl.dropper.brand} ${bl.dropper.model || ''}`.trim() : 'Not set';
    case 'frame':      return bl.frame?.brand ? `${bl.frame.brand} ${bl.frame.model || ''}`.trim() : 'Not set';
    default: return '—';
  }
}

export { ZONE_META };
