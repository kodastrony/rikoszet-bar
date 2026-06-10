// Ilustracje nagłówkowe paneli + ikony zasobów. Spójna paleta marki.
const C = {
  bg: '#16382c',
  bg2: '#1d4738',
  cream: '#f2e9d6',
  amber: '#e3a93c',
  coral: '#ff5a48',
  green: '#2e7d5b',
  felt: '#1f5c41',
  wood: '#8a5a34',
  ink: '#10231b',
};

const wrap = (inner, id) => `
<svg class="art art-${id}" viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" role="img">
  <defs>
    <radialGradient id="glow-${id}" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="${C.bg2}"/><stop offset="100%" stop-color="${C.bg}"/>
    </radialGradient>
  </defs>
  <rect width="400" height="220" fill="url(#glow-${id})"/>
  ${inner}
</svg>`;

const ARTS = {
  bar: wrap(`
    <g stroke="${C.cream}" stroke-width="0" fill="none">
      <rect x="40" y="48" width="320" height="6" rx="3" fill="${C.wood}"/>
      <rect x="40" y="98" width="320" height="6" rx="3" fill="${C.wood}"/>
      ${[70, 110, 150, 250, 290, 330].map((x, i) => `
        <rect x="${x}" y="${20 + (i % 3) * 4}" width="14" height="${28 - (i % 3) * 4}" rx="4" fill="${[C.amber, C.green, C.coral, C.cream, C.amber, C.green][i]}" opacity=".92"/>
        <rect x="${x + 4}" y="${12 + (i % 3) * 4}" width="6" height="9" rx="2" fill="${C.cream}" opacity=".7"/>`).join('')}
      ${[78, 122, 252, 296, 338].map((x, i) => `
        <rect x="${x}" y="${72 + (i % 2) * 3}" width="12" height="${24 - (i % 2) * 3}" rx="4" fill="${[C.cream, C.coral, C.green, C.amber, C.cream][i]}" opacity=".9"/>`).join('')}
      <rect x="178" y="58" width="46" height="84" rx="8" fill="${C.ink}"/>
      <rect x="186" y="70" width="30" height="40" rx="4" fill="${C.amber}"/>
      <path d="M186 82 q15 10 30 0 v28 h-30z" fill="#f7f0de"/>
      <rect x="196" y="118" width="10" height="16" fill="${C.cream}" opacity=".8"/>
      <rect x="30" y="150" width="340" height="16" rx="8" fill="${C.wood}"/>
      <rect x="30" y="166" width="340" height="34" rx="6" fill="#6e4527"/>
      <circle cx="90" cy="158" r="3" fill="${C.cream}" opacity=".5"/>
      <circle cx="310" cy="158" r="3" fill="${C.cream}" opacity=".5"/>
    </g>`, 'bar'),

  bilard: wrap(`
    <rect x="58" y="36" width="284" height="148" rx="18" fill="${C.wood}"/>
    <rect x="72" y="50" width="256" height="120" rx="8" fill="${C.felt}"/>
    ${[[72, 50], [200, 46], [328, 50], [72, 170], [200, 174], [328, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.ink}"/>`).join('')}
    <g>
      <circle cx="258" cy="110" r="11" fill="${C.amber}"/>
      <circle cx="280" cy="98" r="11" fill="${C.coral}"/>
      <circle cx="280" cy="122" r="11" fill="#3f6fae"/>
      <circle cx="302" cy="86" r="11" fill="${C.green}"/>
      <circle cx="302" cy="110" r="11" fill="${C.ink}" stroke="${C.cream}" stroke-width="2"/>
      <text x="302" y="114" font-size="11" font-weight="800" text-anchor="middle" fill="${C.cream}">8</text>
      <circle cx="302" cy="134" r="11" fill="#b04a8f"/>
    </g>
    <circle cx="128" cy="110" r="10" fill="#f5efdf"/>
    <rect x="20" y="104" width="96" height="7" rx="3.5" fill="#caa05c" transform="rotate(4 20 104)"/>
    <rect x="20" y="104" width="26" height="7" rx="3.5" fill="${C.ink}" transform="rotate(4 20 104)"/>
  `, 'bilard'),

  rzutki: wrap(`
    <g transform="translate(255,110)">
      <circle r="86" fill="${C.ink}"/>
      ${Array.from({ length: 20 }, (_, i) => {
        const a0 = (i * 18 - 99) * Math.PI / 180, a1 = ((i + 1) * 18 - 99) * Math.PI / 180;
        const big = (r0, r1, col) => `<path d="M${Math.cos(a0) * r0} ${Math.sin(a0) * r0} A${r0} ${r0} 0 0 1 ${Math.cos(a1) * r0} ${Math.sin(a1) * r0} L${Math.cos(a1) * r1} ${Math.sin(a1) * r1} A${r1} ${r1} 0 0 0 ${Math.cos(a0) * r1} ${Math.sin(a0) * r1} Z" fill="${col}"/>`;
        return big(78, 48, i % 2 ? '#f0e8d4' : '#23231f') + big(46, 30, i % 2 ? C.coral : C.green) + big(28, 10, i % 2 ? '#f0e8d4' : '#23231f');
      }).join('')}
      <circle r="9" fill="${C.green}"/><circle r="4" fill="${C.coral}"/>
      <circle r="86" fill="none" stroke="${C.amber}" stroke-width="3"/>
    </g>
    <g transform="rotate(18 110 96)">
      <rect x="48" y="92" width="58" height="7" rx="3" fill="${C.amber}"/>
      <path d="M106 88 l26 7.5 -26 7.5 z" fill="#cfd6da"/>
      <path d="M48 89 l-16 -10 6 16.5 -6 16.5 16 -10z" fill="${C.coral}"/>
    </g>
    <path d="M60 150 q20 -8 40 0" stroke="${C.cream}" stroke-width="3" fill="none" opacity=".4" stroke-linecap="round"/>
    <path d="M52 162 q26 -10 52 0" stroke="${C.cream}" stroke-width="3" fill="none" opacity=".25" stroke-linecap="round"/>
  `, 'rzutki'),

  scena: wrap(`
    <circle cx="200" cy="34" r="17" fill="#cfd6da"/>
    ${Array.from({ length: 5 }, (_, i) => `<line x1="${186 + i * 7}" y1="20" x2="${186 + i * 7}" y2="48" stroke="${C.bg}" stroke-width="1.6"/>`).join('')}
    ${Array.from({ length: 4 }, (_, i) => `<line x1="184" y1="${24 + i * 7}" x2="216" y2="${24 + i * 7}" stroke="${C.bg}" stroke-width="1.6"/>`).join('')}
    <path d="M86 6 L196 120 L106 120 Z" fill="${C.amber}" opacity=".22"/>
    <path d="M314 6 L204 120 L294 120 Z" fill="${C.coral}" opacity=".2"/>
    <rect x="40" y="170" width="320" height="22" rx="6" fill="${C.wood}"/>
    <rect x="52" y="190" width="296" height="14" fill="#6e4527"/>
    <g transform="translate(200,118)">
      <circle cx="0" cy="-16" r="14" fill="${C.ink}" stroke="${C.cream}" stroke-width="3"/>
      <rect x="-3" y="-4" width="6" height="44" rx="3" fill="${C.cream}"/>
      <path d="M-20 52 L0 38 L20 52" stroke="${C.cream}" stroke-width="6" fill="none" stroke-linecap="round"/>
    </g>
    ${[[80, 60], [120, 38], [300, 52], [330, 76]].map(([x, y]) => `<path d="M${x} ${y} l3.5 7 7.5 1 -5.5 5.5 1.5 7.5 -7 -4 -7 4 1.5 -7.5 -5.5 -5.5 7.5 -1z" fill="${C.cream}" opacity=".75"/>`).join('')}
  `, 'scena'),

  salka: wrap(`
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${28 + i * 39} 18 l16 26 h-32 z" fill="${[C.amber, C.coral, C.green, C.cream][i % 4]}" transform="rotate(180 ${28 + i * 39} 31)"/>`).join('')}
    <path d="M12 16 Q200 44 388 16" stroke="${C.cream}" stroke-width="3" fill="none" opacity=".6"/>
    <g>
      <ellipse cx="92" cy="84" rx="26" ry="32" fill="${C.coral}"/>
      <path d="M92 116 l-6 10 12 0 z" fill="${C.coral}"/>
      <path d="M92 126 q-6 22 6 40" stroke="${C.cream}" stroke-width="2.5" fill="none"/>
      <ellipse cx="146" cy="70" rx="24" ry="30" fill="${C.amber}"/>
      <path d="M146 100 l-6 10 12 0 z" fill="${C.amber}"/>
      <path d="M146 110 q8 26 -4 52" stroke="${C.cream}" stroke-width="2.5" fill="none"/>
      <ellipse cx="310" cy="84" rx="26" ry="32" fill="${C.ink}" stroke="${C.cream}" stroke-width="3"/>
      <text x="310" y="93" font-size="26" font-weight="800" text-anchor="middle" fill="${C.cream}">8</text>
      <path d="M310 116 l-6 10 12 0 z" fill="${C.ink}"/>
      <path d="M310 126 q6 22 -6 40" stroke="${C.cream}" stroke-width="2.5" fill="none"/>
    </g>
    <rect x="150" y="150" width="120" height="14" rx="7" fill="${C.wood}"/>
    <rect x="160" y="164" width="8" height="34" fill="#6e4527"/>
    <rect x="252" y="164" width="8" height="34" fill="#6e4527"/>
    <rect x="186" y="118" width="48" height="34" rx="5" fill="#f5efdf"/>
    <rect x="186" y="128" width="48" height="6" fill="${C.coral}"/>
    <rect x="207" y="104" width="6" height="16" rx="2" fill="${C.amber}"/>
    <ellipse cx="210" cy="101" rx="5" ry="7" fill="${C.coral}"/>
  `, 'salka'),

  ogrodek: wrap(`
    <circle cx="338" cy="40" r="22" fill="${C.amber}" opacity=".9"/>
    <path d="M30 30 Q120 64 210 34" stroke="#2c2c2c" stroke-width="2.5" fill="none"/>
    ${Array.from({ length: 7 }, (_, i) => { const t = i / 6; const x = 30 + (210 - 30) * t; const y = 30 + Math.sin(Math.PI * t) * 32 + (t * 4); return `<circle cx="${x}" cy="${y + 4}" r="5" fill="${C.amber}"/>`; }).join('')}
    <g transform="translate(120,86)">
      <path d="M0 18 L-78 30 Q-40 -28 0 -34 Q40 -28 78 30 Z" fill="${C.green}"/>
      <path d="M0 18 L-40 26 Q-20 -22 0 -34 Q20 -22 40 26 Z" fill="${C.cream}" opacity=".25"/>
      <rect x="-3" y="-34" width="6" height="120" rx="3" fill="#5d564a"/>
    </g>
    <rect x="64" y="150" width="112" height="11" rx="5" fill="${C.wood}"/>
    <rect x="112" y="161" width="9" height="42" fill="#6e4527"/>
    <g transform="translate(286,128)">
      <rect x="-26" y="0" width="52" height="56" rx="9" fill="#f5efdf"/>
      <path d="M26 12 q22 4 0 30" stroke="#f5efdf" stroke-width="9" fill="none"/>
      <path d="M-26 12 q0 -18 26 -18 q26 0 26 18 z" fill="${C.cream}"/>
      <circle cx="-8" cy="-8" r="5" fill="${C.cream}" opacity=".9"/>
      <circle cx="8" cy="-12" r="6" fill="${C.cream}" opacity=".9"/>
    </g>
    <rect x="20" y="200" width="360" height="10" rx="5" fill="${C.wood}" opacity=".8"/>
  `, 'ogrodek'),

  historia: wrap(`
    <g stroke="${C.cream}" stroke-width="3" fill="none" opacity=".95">
      <rect x="110" y="56" width="180" height="120" rx="2"/>
      <line x1="110" y1="96" x2="290" y2="96"/>
      ${[132, 172, 212, 252].map((x) => `<rect x="${x}" y="110" width="22" height="34" rx="10"/>`).join('')}
      <rect x="186" y="148" width="28" height="28"/>
      <path d="M104 56 L200 24 L296 56"/>
      <line x1="140" y1="76" x2="180" y2="76"/><line x1="220" y1="76" x2="260" y2="76"/>
    </g>
    <text x="200" y="205" font-size="15" letter-spacing="6" text-anchor="middle" fill="${C.amber}" font-weight="700">ROZLEWNIA · 1926</text>
    <circle cx="60" cy="120" r="26" fill="none" stroke="${C.amber}" stroke-width="3" stroke-dasharray="5 7"/>
    <text x="60" y="126" font-size="16" font-weight="800" text-anchor="middle" fill="${C.amber}">RKS</text>
    <circle cx="340" cy="120" r="26" fill="none" stroke="${C.coral}" stroke-width="3"/>
    <text x="340" y="126" font-size="16" font-weight="800" text-anchor="middle" fill="${C.coral}">8</text>
  `, 'historia'),
};

export function art(id) {
  return ARTS[id] ?? ARTS.bar;
}

// ── małe ikony do kart rezerwacji ───────────────────────────
const ICONS = {
  bilard: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#16181a"/><circle cx="16" cy="12.4" r="6.4" fill="#f2e9d6"/><text x="16" y="15.6" font-size="9" font-weight="800" text-anchor="middle" fill="#16181a">8</text></svg>`,
  rzutki: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#23231f"/><circle cx="16" cy="16" r="9" fill="#f0e8d4"/><circle cx="16" cy="16" r="5.5" fill="#ff5a48"/><circle cx="16" cy="16" r="2" fill="#16382c"/><rect x="15.2" y="1" width="1.6" height="9" fill="#e3a93c"/></svg>`,
  loza: `<svg viewBox="0 0 32 32"><path d="M5 14 v9 h22 v-9" stroke="#16382c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 15 v-5 a3 3 0 0 1 3-3 h10 a3 3 0 0 1 3 3 v5" stroke="#16382c" stroke-width="3" fill="none"/><rect x="8" y="14" width="16" height="5" rx="2" fill="#e3a93c"/></svg>`,
  salka: `<svg viewBox="0 0 32 32"><ellipse cx="11" cy="11" rx="6" ry="7.4" fill="#ff5a48"/><path d="M11 18.4 q-2 6 1.4 10" stroke="#16382c" stroke-width="2" fill="none"/><ellipse cx="22" cy="9" rx="5.4" ry="6.6" fill="#e3a93c"/><path d="M22 15.6 q2 6 -1 12" stroke="#16382c" stroke-width="2" fill="none"/></svg>`,
};
export function icon(id) {
  return ICONS[id] ?? ICONS.bilard;
}

// logo 8-ball do topbara / intro
export const LOGO_SVG = `
<svg viewBox="0 0 40 40" class="logo-mark" aria-hidden="true">
  <circle cx="20" cy="20" r="18.5" fill="#16181a"/>
  <circle cx="20" cy="20" r="18.5" fill="none" stroke="#e3a93c" stroke-width="2.4"/>
  <circle cx="20" cy="15.4" r="8.6" fill="#f2e9d6"/>
  <text x="20" y="19.8" font-size="12.5" font-weight="800" text-anchor="middle" fill="#16181a" font-family="'Bricolage Grotesque Variable',sans-serif">8</text>
</svg>`;
