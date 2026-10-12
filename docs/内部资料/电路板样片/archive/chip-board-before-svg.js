
(() => {
'use strict';
// 改编自 main 分支 4b3d3d3 的 docs/homepage/index.html；保留元件、布线和绘制。
const cv = document.querySelector('[data-chip-board]');
if (!cv) return;
const ctx = cv.getContext('2d');
if (!ctx) return;


/* ---------- 主题色 ---------- */
const C = {
  ink:   [5, 7, 12],
  board: [9, 13, 22],
  silks: [163, 194, 232],
  theme: [68, 116, 194],
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const LEDCOL = {
  theme: [68, 116, 194], sky: [109, 154, 214], ice: [198, 219, 246], plain: [98, 106, 120],
};

const W = 1600, H = 900, ROW = 20;
const P = new URLSearchParams(location.search);
const REDUCED = false; // 动效偏好与暂停由公共控件控制，静态时只绘制一帧。
const STATIC  = P.has('static');

/* ---------- 小工具 ---------- */
const mulberry32 = a => () => {
  a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const rnd = mulberry32(20261011);
const hash = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const pick = a => a[(rnd() * a.length) | 0];

/* ---------- 元件表 ---------- */
// kind: chip 主控 / mem 内存条 / slot 扩展槽 / body 封装元件 / can 电容 / led 灯
const SPEC = [
  ['cpu',  'chip',  660, 290, 240, 240, 'U1',  1],
  ['pch',  'chip',  720, 660, 140, 110, 'U2',  1],
  ['dsp',  'chip', 1230, 430, 130, 130, 'U3',  1],
  ['fpga', 'chip',  240, 250, 150, 110, 'U4',  1],
  ['pmic', 'chip', 1210, 700, 110,  80, 'U5',  1],
  ['rf',   'chip',  240, 640, 120, 100, 'U6',  1],
  ['mem1', 'mem',  1010, 200, 470,  36, 'DIMM1', 0],
  ['mem2', 'mem',  1010, 262, 470,  36, 'DIMM2', 0],
  ['mem3', 'mem',  1010, 324, 470,  36, 'DIMM3', 0],
  ['exp1', 'slot',  760, 810, 640,  30, 'PCIe x16', 0],
  ['exp2', 'slot',  180, 520, 420,  30, 'P2',  0],
  ['exp3', 'slot',  240, 575, 360,  30, 'P3',  0],
  ['can1', 'can',  1030, 620,  24,  24, 'C1',  0],
  ['can2', 'can',  1095, 620,  24,  24, 'C2',  0],
  ['can3', 'can',  1160, 620,  24,  24, 'C3',  0],
  ['can4', 'can',  1225, 620,  24,  24, 'C4',  0],
  ['can5', 'can',  1290, 620,  24,  24, 'C5',  0],
  ['can6', 'can',  1030, 680,  24,  24, 'C6',  0],
  ['can7', 'can',  1095, 680,  24,  24, 'C7',  0],
  ['can8', 'can',  1160, 680,  24,  24, 'C8',  0],
  ['can9', 'can',  1360, 660,  24,  24, 'C9',  0],
  ['can10','can',  1360, 720,  24,  24, 'C10', 0],
  ['can11','can',   560, 340,  24,  24, 'C11', 0],
  ['can12','can',   560, 410,  24,  24, 'C12', 0],
  ['can13','can',   980, 340,  24,  24, 'C13', 0],
  ['can14','can',   980, 410,  24,  24, 'C14', 0],
  ['can15','can',   540, 620,  24,  24, 'C15', 0],
  ['can16','can',   540, 690,  24,  24, 'C16', 0],
  ['res1', 'body',  620, 260,  12,   7, 'R1',  0],
  ['res2', 'body',  660, 260,  12,   7, 'R2',  0],
  ['res3', 'body',  700, 260,  12,   7, 'R3',  0],
  ['res4', 'body',  900, 260,  12,   7, 'R4',  0],
  ['res5', 'body',  940, 260,  12,   7, 'R5',  0],
  ['res6', 'body',  900, 560,  12,   7, 'R6',  0],
  ['res7', 'body',  940, 560,  12,   7, 'R7',  0],
  ['res8', 'body',  620, 560,  12,   7, 'R8',  0],
  ['res9', 'body',  660, 560,  12,   7, 'R9',  0],
  ['res10','body',  420, 220,  12,   7, 'R10', 0],
  ['res11','body',  420, 420,  12,   7, 'R11', 0],
  ['res12','body', 1160, 460,  12,   7, 'R12', 0],
  ['res13','body', 1160, 470,  12,   7, 'R13', 0],
  ['res14','body',   440, 700,  12,   7, 'R14', 0],
  ['res15','body',   900, 760,  12,   7, 'R15', 0],
  ['res16','body',   960, 760,  12,   7, 'R16', 0],
  // 去耦电容阵列：紧贴各芯片电源引脚，真板上都是这么排的
  ['cap1', 'body',   626, 276,  11,   7, 'C17', 0],
  ['cap2', 'body',   666, 276,  11,   7, 'C18', 0],
  ['cap3', 'body',   706, 276,  11,   7, 'C19', 0],
  ['cap4', 'body',   888, 276,  11,   7, 'C20', 0],
  ['cap5', 'body',   928, 276,  11,   7, 'C21', 0],
  ['cap6', 'body',   626, 542,  11,   7, 'C22', 0],
  ['cap7', 'body',   666, 542,  11,   7, 'C23', 0],
  ['cap8', 'body',   888, 542,  11,   7, 'C24', 0],
  ['cap9', 'body',   928, 542,  11,   7, 'C25', 0],
  ['cap10','body',  1210, 412,  11,   7, 'C26', 0],
  ['cap11','body',  1250, 412,  11,   7, 'C27', 0],
  ['cap12','body',  1430, 412,  11,   7, 'C28', 0],
  ['cap13','body',   240, 232,  11,   7, 'C29', 0],
  ['cap14','body',   280, 232,  11,   7, 'C30', 0],
  ['cap15','body',   240, 400,  11,   7, 'C31', 0],
  ['cap16','body',   240, 620,  11,   7, 'C32', 0],
  // 大电感/钽电容：电源域特征元件，体积大、明显
  ['ind1', 'body',  1450, 640,  22,  16, 'L1',  0],
  ['ind2', 'body',  1450, 720,  22,  16, 'L2',  0],
  ['ind3', 'body',   180, 500,  22,  16, 'L3',  0],
  ['tan1', 'body',  1400, 510,  16,  11, 'C33', 0],
  ['tan2', 'body',  1340, 620,  16,  11, 'C34', 0],
  ['tan3', 'body',   180, 700,  16,  11, 'C35', 0],
  // 时钟晶振：主控旁边一定有，四脚金属壳
  ['xtal1','body',   560, 250,  26,  16, 'Y1',  0],
  ['xtal2','body',   930, 400,  26,  16, 'Y2',  0],
];
const COMP = SPEC.map((s, i) => ({
  kind: s[1], x: s[2], y: s[3], w: s[4], h: s[5], label: s[6], hub: !!s[7], idx: i,
}));
const HUBS = COMP.filter(c => c.hub).map((c, i) => {
  const h = { c, dist: 130 + i * 50, lag: i * 0.03, x: c.x + c.w / 2, y: c.y + c.h / 2, w: c.w, h: c.h };
  c.hubRef = h;
  return h;
});

/* ---------- 板面网格（元件与走线占用） ---------- */
const GW = Math.ceil(W / ROW), GH = Math.ceil(H / ROW);
const grid = new Uint8Array(GW * GH);   // 0 空闲 1 元件 2 已布线
const idx = (c, r) => r * GW + c;
const occupied = (x, y, w, h, allow) => {
  const c0 = Math.floor(x / ROW), c1 = Math.floor((x + w) / ROW);
  const r0 = Math.floor(y / ROW), r1 = Math.floor((y + h) / ROW);
  for (let r = Math.max(0, r0); r <= Math.min(GH - 1, r1); r++)
    for (let c = Math.max(0, c0); c <= Math.min(GW - 1, c1); c++)
      if (grid[idx(c, r)] > allow) return true;
  return false;
};
const mark = (x, y, w, h, v) => {
  const c0 = Math.floor(x / ROW), c1 = Math.floor((x + w) / ROW);
  const r0 = Math.floor(y / ROW), r1 = Math.floor((y + h) / ROW);
  for (let r = Math.max(0, r0); r <= Math.min(GH - 1, r1); r++)
    for (let c = Math.max(0, c0); c <= Math.min(GW - 1, c1); c++) grid[idx(c, r)] = v;
};
COMP.forEach(c => mark(c.x - 4, c.y - 4, c.w + 8, c.h + 8, 1));

/* ---------- 布线：走线格点上的 A*，只在元件的空隙里穿行 ---------- */
const MARGIN = 34;
const inBoard = (x, y) => x > MARGIN && y > MARGIN && x < W - MARGIN && y < H - MARGIN;

// 元件的封锁范围（外扩 8px 当作安全间距），走线只能从空隙穿过去
const BLOCK = COMP.map(c => ({ x0: c.x - 8, y0: c.y - 8, x1: c.x + c.w + 8, y1: c.y + c.h + 8, c }));
const hit = (x, y) => { for (const b of BLOCK) if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return b; return null; };
/** 走线段是否通畅；可传 allow 表示允许穿过某几个元件自己的封锁区（焊盘就在元件边上） */
const segClear = (p, q, allow) => {
  const n = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 6);
  for (let k = 0; k <= n; k++) {
    const x = p.x + (q.x - p.x) * k / n, y = p.y + (q.y - p.y) * k / n;
    if (!inBoard(x, y)) return false;
    const b = hit(x, y);
    if (b && !(allow && allow.includes(b.c))) return false;
  }
  return true;
};

// 路网点阵：走线只能落在网格线上，天然得到横平竖直 + 45° 的规整走线
const LATTICE = 40;
const NX = Math.floor((W - 2 * MARGIN) / LATTICE), NY = Math.floor((H - 2 * MARGIN) / LATTICE);
const nd = (i, j) => ({ x: MARGIN + i * LATTICE, y: MARGIN + j * LATTICE, i, j });
const nodeOK = new Uint8Array(NX * NY).fill(1);
for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
  const n = nd(i, j); if (hit(n.x, n.y)) nodeOK[j * NX + i] = 0;
}
const okNode = (i, j) => i >= 0 && j >= 0 && i < NX && j < NY && nodeOK[j * NX + i];

/** A*：8 邻域；斜向只在两个正交方向都空时才允许（保证斜线是 45° 而且不贴边） */
function routeAStar(a, b) {
  if (!okNode(a.i, a.j) || !okNode(b.i, b.j)) return null;
  const W1 = NX, key = (i, j) => j * W1 + i;
  const g = new Float32Array(NX * NY).fill(Infinity), came = new Int32Array(NX * NY).fill(-1);
  const hx = (i, j) => (Math.abs(i - b.i) + Math.abs(j - b.j)) * LATTICE + (i !== b.i && j !== b.j ? -14 : 0);
  const open = [[a.i, a.j]];
  g[key(a.i, a.j)] = 0;
  const inOpen = new Uint8Array(NX * NY); inOpen[key(a.i, a.j)] = 1;
  let guard = 0;
  while (open.length && guard++ < 2600) {
    let bi = 0;
    for (let k = 1; k < open.length; k++) {
      const s = g[key(open[k][0], open[k][1])] + hx(open[k][0], open[k][1]);
      const t = g[key(open[bi][0], open[bi][1])] + hx(open[bi][0], open[bi][1]);
      if (s < t) bi = k;
    }
    const [ci, cj] = open.splice(bi, 1)[0]; inOpen[key(ci, cj)] = 0;
    if (ci === b.i && cj === b.j) {
      const path = []; let k = key(ci, cj);
      while (k !== -1) { path.push(nd(k % W1, (k / W1) | 0)); k = came[k]; }
      return path.reverse();
    }
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (!okNode(ni, nj)) continue;
      if (di && dj && (!okNode(ci + di, cj) || !okNode(ci, cj + dj))) continue;
      const nk = key(ni, nj);
      const step = (di && dj) ? LATTICE * 1.414 : LATTICE;
      const ng = g[key(ci, cj)] + step;
      if (ng < g[nk]) { g[nk] = ng; came[nk] = key(ci, cj); open.push([ni, nj]); }
    }
  }
  return null;
}
/** 去掉同方向的中间点：只留拐角，走线才干净 */
function simplify(pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) > 1) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const traces = [], leds = [], vias = [];
function padOf(c, toward) {
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  const dx = toward.x - cx, dy = toward.y - cy;
  if (Math.abs(dx) > Math.abs(dy)) return { x: dx > 0 ? c.x + c.w : c.x, y: cy, side: dx > 0 ? 'e' : 'w' };
  return { x: cx, y: dy > 0 ? c.y + c.h : c.y, side: dy > 0 ? 's' : 'n' };
}
const snap = (i) => Math.max(0, Math.min(NX - 1, i));
function wire(a, b, salt = 0) {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const attempts = [[ac, bc], [ac, { x: bc.x + (salt % 3 - 1) * 60, y: bc.y }], [{ x: ac.x + (salt % 3 - 1) * 60, y: ac.y }, bc]];
  for (const [A, B] of attempts) {
    const p = padOf(a, A), q = padOf(b, B);
    // 从焊盘沿出线方向一直走到第一个空着的格点——大芯片（主控 240x240）四周
    // 本来就没有落在格点上的空位，固定偏移量永远出不去
    const stub = (pt, c, side) => {
      const step = { e: [1, 0], w: [-1, 0], s: [0, 1], n: [0, -1] }[side];
      for (let d = 8; d < 240; d += 6) {
        const x = Math.round((pt.x + step[0] * d) / LATTICE) * LATTICE;
        const y = Math.round((pt.y + step[1] * d) / LATTICE) * LATTICE;
        const i = snap(Math.round((x - MARGIN) / LATTICE)), j = snap(Math.round((y - MARGIN) / LATTICE));
        if (!okNode(i, j)) continue;
        const cd = { x: MARGIN + i * LATTICE, y: MARGIN + j * LATTICE, i, j };
        if (!inBoard(cd.x, cd.y)) continue;
        if (segClear(pt, cd, [c])) return cd;
      }
      return null;
    };
    const s0 = stub(p, a, p.side), s1 = stub(q, b, q.side);
    if (!s0 || !s1) continue;
    const mid = routeAStar(s0, s1);
    if (!mid) continue;

    const pts = [{ x: p.x, y: p.y }, ...simplify(mid.map(n => ({ x: n.x, y: n.y }))), { x: q.x, y: q.y }];
    const hub = a.hubRef || b.hubRef || HUBS[0];
    const geo = hub.dist + Math.hypot(p.x - hub.x, p.y - hub.y) + 26;
    traces.push({ pts, geo });
    leds.push({ x: p.x, y: p.y, dist: geo, col: LEDCOL[pick(['theme', 'theme', 'sky', 'plain', 'ice'])], tw: 0.5 + rnd() * 2.2 });
    if (mid.length > 2) { const m = mid[(mid.length / 2) | 0]; vias.push({ x: m.x, y: m.y, r: 2.5 }); }
    return true;
  }
  return false;
}

// 布线清单：主控到每个外围元件 1~2 条，外围之间连最近邻，小元件挂到最近的芯片
const CHIPS = COMP.filter(c => c.kind === 'chip');
const cpu = COMP[0];
const rest = COMP.filter(c => c !== cpu && c.kind !== 'body');
let salt = 0;
for (const t of rest) { wire(cpu, t, salt++); if (rnd() < 0.55) wire(cpu, t, salt++); }
for (const c of rest) {
  const nb = rest.filter(o => o !== c)
    .map(o => ({ o, d: Math.hypot(o.x + o.w / 2 - c.x - c.w / 2, o.y + o.h / 2 - c.y - c.h / 2) }))
    .sort((p, q) => p.d - q.d).slice(0, 2);
  for (const { o } of nb) if (rnd() < 0.5) wire(c, o, salt++);
}
for (const c of COMP.filter(c => c.kind === 'body')) {
  const host = CHIPS.slice().sort((p, q) =>
    Math.hypot(p.x - c.x, p.y - c.y) - Math.hypot(q.x - c.x, q.y - c.y))[0];
  wire(c, host, salt++);
}
// 第三层：邻近互联。只连 300px 以内的邻居，把板面填满而不出现横穿全板的长线。
const cluster = COMP.filter(c => c.kind !== 'body');
for (const a of cluster) {
  const near = cluster.filter(o => o !== a)
    .map(o => ({ o, d: Math.hypot(o.x + o.w / 2 - a.x - a.w / 2, o.y + o.h / 2 - a.y - a.h / 2) }))
    .filter(v => v.d < 300).sort((p, q) => p.d - q.d);
  for (const { o } of near.slice(0, 3)) if (rnd() < 0.7) wire(a, o, salt++);
}

// 元件自身到源点的距离（只算一次）
for (const c of COMP) {
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  let g = Infinity;
  for (const h of HUBS) g = Math.min(g, h.dist + Math.hypot(cx - h.x, cy - h.y));
  c.geo = g;
}

/* ---------- 心跳 / 波纹 ---------- */
// 双峰脉搏：主峰 + 0.24s 后的次峰，约 1.05s 一次 —— 和真心跳一样是「咚-哒」
const BEAT = 1.05;
const burst = (x, w) => { const t = x / w; return t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0; };
const beat = p => {
  const x = ((p % BEAT) + BEAT) % BEAT;
  return burst(x, 0.22) + 0.5 * burst(x - 0.24, 0.16);
};
const WAVE = 380;   // 波速 px/s
const CX = COMP[0].x + COMP[0].w / 2, CY = COMP[0].y + COMP[0].h / 2;   // 波源＝主控中心
const RIPPLES = [0, 0.17, 0.36];   // 同一次心跳里连续推三圈，强化水波层次

/* 信号强度：从最近的源点传来，其余源点叠加成干涉 —— 板子越大越柔和 */
function signal(geo, t, i) {
  // 周期脉冲持续沿走线传播，修复原样片运行几秒后光波消失的问题。
  let strength = 0;
  for (let k = 0; k < HUBS.length; k++) {
    const delay = Math.max(0, geo - HUBS[k].dist) / WAVE + HUBS[k].lag;
    strength = Math.max(strength, beat(t - delay) * (k === 0 ? 1 : 0.55));
  }
  return Math.min(1.3, strength);
}

/* ---------- 绘制 ---------- */
// canvas 由顶部安全初始化。
const base = document.createElement('canvas');
const bg = base.getContext('2d');
let scale = 1;

function resize() {
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  scale = cv.width / W;
  paintBase();
}
function paintBase() {
  base.width = cv.width; base.height = cv.height;
  bg.setTransform(scale, 0, 0, scale, 0, 0);
  bg.clearRect(0, 0, W, H);

  // 基板：深墨底 + 极淡的蓝调渐变，黑白灰里带一点主题色
  bg.fillStyle = rgba(C.ink, 1); bg.fillRect(0, 0, W, H);
  const g = bg.createRadialGradient(760, 420, 60, 760, 420, 900);
  g.addColorStop(0, rgba(C.board, 1)); g.addColorStop(1, rgba([6, 9, 16], 1));
  bg.fillRect(0, 0, W, H); bg.fillStyle = g; bg.fillRect(0, 0, W, H);

  // 电源域分区（丝印色，压到几乎看不见）
  bg.strokeStyle = rgba(C.silks, 0.055); bg.lineWidth = 1;
  [[380, 60, 720, 660], [110, 60, 240, 780], [1080, 60, 400, 780]].forEach(([x, y, w, h]) => bg.strokeRect(x, y, w, h));
  bg.setLineDash([2, 8]); bg.strokeStyle = rgba(C.silks, 0.07);
  bg.strokeRect(400, 70, 680, 640); bg.setLineDash([]);

  // 大面积铺铜（hatched pour）：45° 交叉阴影，避开所有元件与走线
  bg.save();
  bg.beginPath(); bg.rect(24, 24, W - 48, H - 48); bg.clip();
  bg.strokeStyle = rgba(C.theme, 0.13); bg.lineWidth = 0.9;
  const spacing = 22;
  for (let k = -H; k < W + H; k += spacing) {
    bg.beginPath(); bg.moveTo(k, 0); bg.lineTo(k + H, H); bg.stroke();      // ／向
    bg.beginPath(); bg.moveTo(k, H); bg.lineTo(k + H, 0); bg.stroke();      // ＼向
  }
  bg.restore();
  // 铺铜被元件挖掉的"隔离区"：元件外扩一圈的透明轮廓，做出避让感
  bg.strokeStyle = rgba([6, 9, 16], 0.7); bg.lineWidth = 3.5;
  for (const c of COMP) bg.strokeRect(c.x - 4, c.y - 4, c.w + 8, c.h + 8);

  // 电源域分区再叠一层：粗线框出主控供电路径
  bg.strokeStyle = rgba(C.theme, 0.1); bg.lineWidth = 2; bg.setLineDash([14, 6]);
  bg.beginPath(); bg.moveTo(300, 430); bg.lineTo(660, 430); bg.stroke();
  bg.beginPath(); bg.moveTo(900, 410); bg.lineTo(1240, 410); bg.stroke();
  bg.setLineDash([]);

  // 走线静态层：暗铜一样的低亮度底
  const p = new Path2D();
  for (const t of traces) { p.moveTo(t.pts[0].x, t.pts[0].y); for (let i = 1; i < t.pts.length; i++) p.lineTo(t.pts[i].x, t.pts[i].y); }
  bg.lineCap = 'round'; bg.lineJoin = 'round';
  // 先铺一层宽的暗色底（阻焊下的铜），再压窄的亮线 —— 两条走线并行时能看出层次
  bg.strokeStyle = rgba(C.silks, 0.07); bg.lineWidth = 3.4; bg.stroke(p);
  bg.strokeStyle = rgba(C.theme, 0.32); bg.lineWidth = 1.7; bg.stroke(p);
  // 主控出来的主干线加粗一档（电源/时钟走线）
  const power = new Path2D();
  for (const t of traces.slice(0, 14)) { power.moveTo(t.pts[0].x, t.pts[0].y); for (let i = 1; i < t.pts.length; i++) power.lineTo(t.pts[i].x, t.pts[i].y); }
  bg.strokeStyle = rgba(C.theme, 0.4); bg.lineWidth = 2.6; bg.stroke(power);

  // 缝合过孔（stitching vias）：铺铜区里成排的小过孔
  for (let gx = 60; gx < W - 50; gx += 78) for (let gy = 60; gy < H - 50; gy += 78) {
    const jx = gx + ((hash(gx * 31 + gy) * 8) | 0) - 4, jy = gy + ((hash(gy * 17 + gx) * 8) | 0) - 4;
    if (COMP.some(c => jx > c.x - 14 && jx < c.x + c.w + 14 && jy > c.y - 14 && jy < c.y + c.h + 14)) continue;
    bg.beginPath(); bg.arc(jx, jy, 1.7, 0, 7); bg.fillStyle = rgba(C.silks, 0.17); bg.fill();
    bg.beginPath(); bg.arc(jx, jy, 0.7, 0, 7); bg.fillStyle = rgba(C.ink, 0.85); bg.fill();
  }

  // 走线上的过孔
  for (const v of vias) {
    bg.beginPath(); bg.arc(v.x, v.y, v.r, 0, 7); bg.fillStyle = rgba(C.silks, 0.2); bg.fill();
    bg.beginPath(); bg.arc(v.x, v.y, v.r * 0.4, 0, 7); bg.fillStyle = rgba(C.ink, 0.9); bg.fill();
  }

  // 焊盘泪滴：走线接到焊盘处加粗，防止钻孔断裂 —— 真板子上每根线都有
  bg.fillStyle = rgba(C.theme, 0.22);
  for (const l of leds) { bg.beginPath(); bg.arc(l.x, l.y, 3.6, 0, 7); bg.fill(); }

  // BGA 逃逸过孔（dogbone escape）：芯片四周成排的扇出孔，
  // 真板上每个 BGA 焊球都要就近打一个孔引到内层，这是最像真板子的细节
  for (const c of COMP) {
    if (c.kind !== 'chip') continue;
    const step = 13;
    const viasAt = [];
    for (let x = c.x + 8; x < c.x + c.w - 6; x += step) viasAt.push([x, c.y - 4], [x, c.y + c.h + 4]);
    for (let y = c.y + 8; y < c.y + c.h - 6; y += step) viasAt.push([c.x - 4, y], [c.x + c.w + 4, y]);
    // 先挖隔离盘，再画铜环，最后点钻孔 —— 三层叠加才不会跟铺铜糊在一起
    for (const [vx, vy] of viasAt) {
      bg.beginPath(); bg.arc(vx, vy, 3, 0, 7); bg.fillStyle = rgba([8, 11, 19], 1); bg.fill();
    }
    for (const [vx, vy] of viasAt) {
      bg.beginPath(); bg.arc(vx, vy, 2.6, 0, 7);
      bg.strokeStyle = rgba(C.silks, 0.3); bg.lineWidth = 1; bg.stroke();
      bg.beginPath(); bg.arc(vx, vy, 1, 0, 7); bg.fillStyle = rgba(C.ink, 1); bg.fill();
    }
  }

  // 元件本体
  for (const c of COMP) drawComp(bg, c);

  // 元件位号丝印：每个料旁边一行小字，像真板子上的 R12 / C8 / U3
  bg.textBaseline = 'middle';
  bg.font = '600 6px ui-monospace,SFMono-Regular,Menlo,monospace';
  bg.fillStyle = rgba(C.silks, 0.26);
  bg.textAlign = 'left';
  for (const c of COMP) {
    const ty = c.y - 6;
    if (ty < 30) continue;
    bg.fillText(c.label, c.x, ty);
  }
  bg.textAlign = 'left';

  // 丝印文字
  bg.fillStyle = rgba(C.silks, 0.5);
  bg.font = '600 13px ui-monospace,SFMono-Regular,Menlo,monospace';
  bg.fillText('HENU · SCHOOL OF INTEGRATED CIRCUITS & MICRO-NANO ELECTRONICS', 60, 92);
  bg.font = '600 12px ui-monospace,SFMono-Regular,Menlo,monospace';
  bg.fillStyle = rgba(C.silks, 0.3);
  bg.fillText('CONCEPT VISUAL', 60, 112);
  bg.fillText('NOT AN ELECTRICAL DESIGN', 60, 132);
  bg.fillText('IC-01', 60, 800);
  bg.font = '700 16px ui-monospace,SFMono-Regular,Menlo,monospace';
  bg.fillStyle = rgba(C.silks, 0.16);
  bg.fillText('SN-HENU-ICMN', 640, 862);

  // 板框：最外圈的外形线 + 内侧的元件禁布带
  bg.strokeStyle = rgba(C.silks, 0.2); bg.lineWidth = 1.2;
  bg.strokeRect(20, 20, W - 40, H - 40);
  bg.setLineDash([5, 5]);
  bg.strokeStyle = rgba(C.silks, 0.07); bg.lineWidth = 0.8;
  bg.strokeRect(30, 30, W - 60, H - 60);
  bg.setLineDash([]);

  // 安装孔：铜环 + 钻孔 + 十字基准线，真板子四角都有
  [[46, 46], [W - 46, 46], [46, H - 46], [W - 46, H - 46]].forEach(([x, y]) => {
    bg.beginPath(); bg.arc(x, y, 9, 0, 7);            // 铜环
    bg.strokeStyle = rgba(C.silks, 0.28); bg.lineWidth = 1.6; bg.stroke();
    bg.beginPath(); bg.arc(x, y, 5.5, 0, 7);          // 钻孔
    bg.fillStyle = rgba(C.ink, 1); bg.fill();
    bg.strokeStyle = rgba(C.silks, 0.14); bg.lineWidth = 0.8;
    bg.beginPath(); bg.moveTo(x - 14, y); bg.lineTo(x - 11, y);
    bg.moveTo(x + 11, y); bg.lineTo(x + 14, y);
    bg.moveTo(x, y - 14); bg.lineTo(x, y - 11);
    bg.moveTo(x, y + 11); bg.lineTo(x, y + 14); bg.stroke();
  });
  // 光学基准点（fiducial）：贴片机对位用，实心圆 + 空旷区
  [[150, 840], [1450, 840], [150, 130], [1450, 130]].forEach(([x, y]) => {
    bg.beginPath(); bg.arc(x, y, 4.2, 0, 7); bg.fillStyle = rgba(C.silks, 0.42); bg.fill();
    bg.beginPath(); bg.arc(x, y, 8, 0, 7); bg.strokeStyle = rgba(C.silks, 0.12); bg.lineWidth = 0.8; bg.stroke();
  });
}
/* ---------- 走线分段表 ---------- */
// 预先把折线拆成线段，每段存 (x1,y1,x2,y2, 沿线的几何距离, 长度, 相位抖动)。
// 用扁平 Float32Array 而不是对象数组：段数上千，每帧遍历两遍，扁平数组省掉属性查找。
const SEG_STRIDE = 7;
const segBuf = [];
const segMeta = [];
for (const tr of traces) {
  let d = tr.geo;
  for (let i = 1; i < tr.pts.length; i++) {
    const a = tr.pts[i - 1], b = tr.pts[i];
    const m = Math.hypot(b.x - a.x, b.y - a.y);
    if (m < 0.5) continue;
    segBuf.push(a.x, a.y, b.x, b.y, d, m, (i * 7919) % 997);
    d += m;
  }
}
const segs = new Float32Array(segBuf);

/* 波峰颜色：主题蓝往冰白过渡，越靠近波峰越白越亮 */
const mix = (v) => {
  const k = Math.min(1, Math.max(0, v));
  return `rgba(${(68 + 130 * k) | 0},${(116 + 83 * k) | 0},${(194 + 52 * k) | 0},1)`;
};

/* ---------- 每帧渲染 ---------- */
/**
 * t     = 秒
 * bump  = 这一拍的心搏强度（双峰心跳的包络），0..1.5
 */
function render(t, bump) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(base, 0, 0, W, H);

  // 板底随心跳整体微微提亮 —— 心搏那一下连基板都跟着亮一点
  if (bump > 0.02) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(C.theme, 0.012 * bump);
    ctx.fillRect(0, 0, W, H);
  }

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // 走线：三段叠加 —— 宽而暗的光晕、中等的本体、细而亮的线芯。
  // 波峰所在的一段最亮最粗，形成一条沿走线跑动的光带。
  for (const pass of [{ w: 7.5, k: 0.055 }, { w: 3.2, k: 0.28 }, { w: 1.6, k: 0.5 }]) {
    ctx.lineWidth = pass.w;
    const core = pass.w < 2;
    for (let o = 0; o < segs.length; o += SEG_STRIDE) {
      const g = segs[o + 4], m = segs[o + 5], ph = segs[o + 6];
      const v = signal(g + m, t, ph);
      if (v <= 0.03) continue;
      ctx.globalAlpha = Math.min(1, v) * pass.k;
      ctx.strokeStyle = core ? mix(v) : rgba(C.theme, 1);
      ctx.beginPath();
      ctx.moveTo(segs[o], segs[o + 1]); ctx.lineTo(segs[o + 2], segs[o + 3]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // 元件：波到达时点亮
  for (const c of COMP) {
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    const v = signal(c.geo, t, 3);
    if (v <= 0.03) continue;
    if (c.kind === 'chip') {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(c.w, c.h) * 0.95);
      g.addColorStop(0, rgba(C.theme, 0.3 * v)); g.addColorStop(1, rgba(C.theme, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(c.x - 90, c.y - 90, c.w + 180, c.h + 180);
      // 芯片四边的焊盘跟着亮，像引脚在通电
      ctx.globalAlpha = v * 0.5; ctx.strokeStyle = rgba(C.silks, 0.9); ctx.lineWidth = 1;
      ctx.strokeRect(c.x - 0.5, c.y - 0.5, c.w + 1, c.h + 1);
    } else if (c.kind === 'can' || c.kind === 'body') {
      const r = Math.max(c.w, c.h) * (c.kind === 'can' ? 2.4 : 3.6);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, rgba(C.theme, 0.4 * v)); g.addColorStop(1, rgba(C.theme, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.globalAlpha = v * 0.22; ctx.fillStyle = rgba(C.theme, 1);
      ctx.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2);
    }
  }

  // 端点指示灯
  for (const l of leds) {
    const v = signal(l.dist, t, 3);
    const idle = .1 + .07 * Math.sin(t * l.tw + l.x * .013);
    const a = Math.max(idle, v);
    const R = 13 * a + 2.5;
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, R);
    g.addColorStop(0, rgba(l.col, 0.75 * a)); g.addColorStop(1, rgba(l.col, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(l.x - R, l.y - R, R * 2, R * 2);
    ctx.globalAlpha = Math.min(1, 0.4 + a); ctx.fillStyle = rgba(C.silks, 0.6 + 0.4 * a);
    ctx.beginPath(); ctx.arc(l.x, l.y, 1.5 + a * 1.2, 0, 7); ctx.fill();
  }

  // 扩散的水波圆环：一圈推一圈往外走，越外越淡
  if (!REDUCED) for (const d of RIPPLES) for (let age = 0; age < 3; age++) {
    const phase = ((t - d) % BEAT + BEAT) % BEAT;
    const rr = (phase + age * BEAT) * WAVE - 90;
    if (rr < 40) continue;
    const fade = Math.max(0, 1 - rr / 900), i = (1 - d * 1.7) * fade;
    if (i <= 0.01) continue;
    const band = 62;
    const g = ctx.createRadialGradient(CX, CY, Math.max(0, rr - band), CX, CY, rr + band);
    // 0.5 处才是波峰；两侧是对称的渐隐，这样看起来是一道推出去的浪，不是一圈暗晕
    g.addColorStop(0.00, rgba(C.theme, 0));
    g.addColorStop(0.30, rgba(C.theme, 0.035 * i));
    g.addColorStop(0.46, rgba(C.theme, 0.10 * i));
    g.addColorStop(0.50, rgba(C.silks, 0.16 * i));   // 波峰偏白，像水面高光
    g.addColorStop(0.54, rgba(C.theme, 0.10 * i));
    g.addColorStop(0.70, rgba(C.theme, 0.035 * i));
    g.addColorStop(1.00, rgba(C.theme, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(CX, CY, rr + band, 0, 7); ctx.fill();
  }

  // 主控心搏的整体气氛光：范围放大、中心压低，
  // 免得中心过曝把水波环衬成一圈暗影
  if (bump > 0.01) {
    const R = 520;
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    g.addColorStop(0, rgba(C.theme, 0.03 * bump));
    g.addColorStop(0.5, rgba(C.theme, 0.025 * bump));
    g.addColorStop(1, rgba(C.theme, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * 元件封装绘制。真板子和示意图的差别全在这一层：
 * 焊盘、引脚间距、极性标记、丝印编号 —— 有了这些才像焊过东西的板子。
 */
function drawComp(g, c) {
  const { x, y, w, h, kind } = c;
  const body = kind === 'chip' ? rgba([12, 17, 27], 1) : kind === 'mem' ? rgba([10, 14, 23], 1)
             : kind === 'slot' ? rgba([13, 19, 30], 1) : rgba([16, 22, 34], 1);
  const grey = rgba([86, 92, 104], 1);

  // 元件外框（阻焊开的窗）
  g.beginPath();
  const rr = kind === 'can' ? Math.min(w, h) / 2 : 3;
  if (g.roundRect) g.roundRect(x, y, w, h, rr); else g.rect(x, y, w, h);
  g.fillStyle = body; g.fill();
  g.strokeStyle = rgba(C.silks, kind === 'body' ? 0.24 : 0.34); g.lineWidth = 1; g.stroke();

  if (kind === 'chip') {
    // QFN/BGA：四周一圈焊盘，间距 5px，比芯片本体略窄
    const pad = 5, gap = 3;
    g.fillStyle = rgba(C.silks, 0.2);
    for (let px = x + 10; px < x + w - 10; px += pad + gap) { g.fillRect(px, y - 4, pad, 4); g.fillRect(px, y + h, pad, 4); }
    for (let py = y + 10; py < y + h - 10; py += pad + gap) { g.fillRect(x - 4, py, 4, pad); g.fillRect(x + w, py, 4, pad); }
    // 封装内圈 + 第一脚标记
    g.strokeStyle = rgba(C.silks, 0.13); g.strokeRect(x + 9, y + 9, w - 18, h - 18);
    g.fillStyle = rgba(C.silks, 0.34); g.beginPath(); g.arc(x + 16, y + 16, 3.4, 0, 7); g.fill();
    // BGA 焊球阵列（行列按芯片大小给，不是硬编码 9x9）
    const bx = Math.max(4, ((w - 68) / 19) | 0), by = Math.max(4, ((h - 68) / 19) | 0);
    const ox = x + (w - (bx - 1) * 19) / 2, oy = y + (h - (by - 1) * 19) / 2;
    for (let r = 0; r < by; r++) for (let q = 0; q < bx; q++) {
      g.beginPath(); g.arc(ox + q * 19, oy + r * 19, 2.1, 0, 7); g.fillStyle = rgba(C.silks, 0.16); g.fill();
    }
    g.font = '700 14px ui-monospace,SFMono-Regular,Menlo,monospace';
    g.fillStyle = rgba(C.silks, 0.55); g.textAlign = 'center';
    g.fillText(c.label, x + w / 2, y + h / 2 + 4);
    g.textAlign = 'left';
    return;
  }

  if (kind === 'can') {                       // 电解电容：极性条 + 顶面十字防爆纹 + 底面焊盘
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
    g.beginPath(); g.arc(cx, cy, r - 3, 0, 7);
    g.strokeStyle = rgba(C.silks, 0.26); g.lineWidth = 1; g.stroke();
    g.strokeStyle = rgba(C.silks, 0.2); g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx - r * .45, cy); g.lineTo(cx + r * .45, cy);
    g.moveTo(cx, cy - r * .45); g.lineTo(cx, cy + r * .45); g.stroke();
    g.fillStyle = rgba(C.silks, 0.34);            // 负极标记
    g.fillRect(x - 1, y + h * .22, 3, h * .56);
    g.fillStyle = grey;                            // 两个引脚焊盘
    g.beginPath(); g.arc(cx, y + h + 4, 2.4, 0, 7); g.fill();
    g.beginPath(); g.arc(cx, y - 4, 2.4, 0, 7); g.fill();
    return;
  }

  if (kind === 'mem' || kind === 'slot') {
    // 金手指：一对一对的触点 + 定位缺口 + 卡扣脚
    g.fillStyle = rgba(C.silks, 0.17);
    for (let i = x + 6; i < x + w - 6; i += 10) g.fillRect(i, y + h / 2 - 1.5, 5, 3);
    g.fillStyle = rgba(C.ink, 1);
    g.fillRect(x + w / 2 - 3, y, 6, h);            // 防呆缺口
    g.fillStyle = grey;
    g.fillRect(x - 3, y + h / 2 - 5, 3, 10); g.fillRect(x + w, y + h / 2 - 5, 3, 10);
    return;
  }

  // 分立元件（电阻/电容/电感）：两端焊盘 + 中间本体 + 丝印
  if (kind === 'body') {
    const long = w >= h;
    g.fillStyle = grey;
    if (long) { g.fillRect(x - 3, y + h / 2 - h / 2, 3, h); g.fillRect(x + w, y + h / 2 - h / 2, 3, h); }
    else { g.fillRect(x + w / 2 - w / 2, y - 3, w, 3); g.fillRect(x + w / 2 - w / 2, y + h, w, 3); }
    g.fillStyle = rgba(C.silks, 0.5);
    g.font = '600 7px ui-monospace,SFMono-Regular,Menlo,monospace';
    g.fillText(c.label, x, y - 4);
    return;
  }
}

/* ---------- 首页播放控制：与轮播换图分离 ---------- */
let elapsed = 0.35, lastFrame = 0, request = 0, onScreen = true;
const slide = cv.closest('[data-slide]');
const isPaused = () => STATIC || document.documentElement.dataset.motionPaused === 'true' || document.hidden || !onScreen || slide.hidden;
function draw() { render(elapsed, beat(elapsed)); }
function frame(ms) {
  request = 0;
  if (isPaused()) return;
  if (!lastFrame) lastFrame = ms;
  const delta = ms - lastFrame;
  // 最多30帧/秒，后台/离屏不补播。
  if (delta >= 1000 / 30) {
    elapsed += Math.min(delta, 100) / 1000;
    draw();
    lastFrame = ms;
  }
  request = requestAnimationFrame(frame);
}
function syncPlayback() {
  if (request) cancelAnimationFrame(request);
  request = 0;
  lastFrame = 0;
  cv.dataset.playback = isPaused() ? 'paused' : 'playing';
  if (!isPaused()) request = requestAnimationFrame(frame);
}
function syncSize() {
  if (cv.getBoundingClientRect().width < 1) return;
  resize(); draw(); syncPlayback();
}
window.addEventListener('ic:motion', syncPlayback);
document.addEventListener('visibilitychange', syncPlayback);
new MutationObserver(() => { if (!slide.hidden) syncSize(); else syncPlayback(); }).observe(slide, { attributes: true, attributeFilter: ['hidden'] });
if ('ResizeObserver' in window) new ResizeObserver(syncSize).observe(cv);
else window.addEventListener('resize', syncSize);
if ('IntersectionObserver' in window) new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; syncPlayback(); }).observe(cv);
syncSize();
})();
