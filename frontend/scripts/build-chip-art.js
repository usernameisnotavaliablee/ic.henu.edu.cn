// 原创俯视芯片；参考 Magic UI 的路径信号机制，无第三方运行时。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../src');
const traces = [], pins = [], nodes = [];
const sides = ['top', 'right', 'bottom', 'left'];
// 四边分别布线：同组线保持平行，组与组的长度、拐点和扇出距离错开。
const routing = [
  { bend: 190, spread: [76, 42], ends: [355, 365, 328, 350] },
  { bend: 214, spread: [58, 86], ends: [414, 460, 442, 382] },
  { bend: 184, spread: [44, 82], ends: [315, 354, 373, 338] },
  { bend: 200, spread: [108, 60], ends: [530, 446, 510, 572] },
];
// 直接计算二维坐标，不使用透视、倾斜或立体投影。
function point(side, across, depth) {
  const offsets = [[across, -depth], [depth, across], [-across, depth], [-depth, -across]];
  const [x, y] = offsets[side];
  return `${1100 + x} ${400 + y}`;
}
for (let side = 0; side < 4; side++) {
  for (let lane = 0; lane < 12; lane++) {
    const direction = lane < 6 ? -1 : 1;
    const across = (lane - 5.5) * 18 + direction * 8;
    const route = routing[side];
    const bend = route.bend + Math.min(lane, 11 - lane) * 10;
    const spread = route.spread[lane < 6 ? 0 : 1];
    const endDepth = Math.max(route.ends[Math.floor(lane / 3)], bend + spread + 24);
    const endAcross = across + direction * spread;
    const d = `M ${point(side, across, 164)} L ${point(side, across, bend)} L ${point(side, endAcross, bend + spread)} L ${point(side, endAcross, endDepth)}`;
    traces.push({ d, side: sides[side], lane });
    pins.push(`<path d="M ${point(side, across, 140)} L ${point(side, across, 164)}"/>`);
    const [x, y] = point(side, endAcross, endDepth).split(' ');
    nodes.push(lane % 3 === 0
      ? `<circle cx="${x}" cy="${y}" r="3.6" fill="#071e3d" stroke="#82c9ed" stroke-width="1.4"/>`
      : `<circle cx="${x}" cy="${y}" r="2.4"/>`);
  }
}
// 每面仅两条线有光点，16秒一轮，错开出现；其余走线保持安静。
const signalDelays = [0, 10, 6, 14, 4, 12, 8, 2];
const signals = traces.filter(trace => trace.lane === 2 || trace.lane === 9).map((trace, i) =>
  `<path class="chip-signal chip-signal--${trace.lane === 2 ? 'in' : 'out'}" data-side="${trace.side}" style="--signal-delay:-${signalDelays[i]}s" pathLength="100" stroke-dasharray=".6 99.4" d="${trace.d}"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" fill="none" aria-hidden="true">
<defs>
 <radialGradient id="aura"><stop stop-color="#2585c3" stop-opacity=".5"/><stop offset="1" stop-color="#071e3d" stop-opacity="0"/></radialGradient>
 <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" stroke="#85beee" stroke-opacity=".045"/></pattern>
 <pattern id="cells" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M3 3h8v8H3z" stroke="#8eceff" stroke-opacity=".16"/></pattern>
</defs>
<path fill="#071e3d" d="M0 0h1600v800H0z"/>
<path fill="url(#grid)" d="M0 0h1600v800H0z"/>
<ellipse class="chip-aura" cx="1100" cy="400" rx="580" ry="420" fill="url(#aura)" opacity=".55"/>
<g stroke="#589dc8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".48">${traces.map(trace => `<path data-trace="${trace.side}" d="${trace.d}"/>`).join('')}</g>
<g fill="#82c9ed" fill-opacity=".5">${nodes.join('')}</g>
<g stroke="#c2efff" stroke-width="4" stroke-linecap="round" opacity="0" class="chip-signals">${signals}</g>
<g stroke="#8ebdd9" stroke-width="7" stroke-linecap="butt">${pins.join('')}</g>
<rect x="960" y="260" width="280" height="280" rx="8" fill="#0b2848" stroke="#86b9d8" stroke-width="2"/>
<rect class="chip-core-ring" x="973" y="273" width="254" height="254" rx="3" stroke="#91d9f5" stroke-opacity=".45"/>
<rect x="992" y="292" width="216" height="216" fill="#103657"/>
<rect x="992" y="292" width="216" height="216" fill="url(#cells)"/>
<g stroke="#79b9dc" stroke-opacity=".45" fill="#174565">
 <path d="M1004 304h114v54h-114z M1130 304h66v22h-66z M1130 338h66v20h-66z"/>
 <path d="M1004 442h46v54h-46z M1062 442h134v22h-134z M1062 476h88v20h-88z"/>
</g>
<rect x="1022" y="372" width="156" height="56" rx="2" fill="#0b2848" stroke="#71b9dd" stroke-opacity=".4"/>
<text x="1104" y="410" text-anchor="middle" fill="#d5effc" font-family="Arial,sans-serif" font-size="32" letter-spacing="8">IC</text>
<circle cx="975" cy="525" r="3" fill="#a9d8ed"/>
</svg>`;
fs.writeFileSync(path.join(root, 'assets/chip-banner.svg'), svg + '\n');
fs.writeFileSync(path.join(root, 'templates/partials/chip-art.svg'), svg + '\n');
console.log('已生成2D芯片：四面48条成组走线、48个引脚、8条间歇双向信号。');
