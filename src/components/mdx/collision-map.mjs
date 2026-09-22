// Where collisions happen (hub / shared medium) vs. how a switch prevents them.
// One SVG source for <CollisionMap /> and for scripts/mdx-to-md.mjs, which writes it
// to images/COLLISION_MAP.svg with the CSS variables resolved to their light-theme fallbacks.

export const collisionRows = [
  {
    mark: "A",
    where: "共享介质：多台主机挂在同一根线 / 同一个 Hub 上，两台同时发就撞",
    fix: "Microsegmentation + Dedicated paths：每台主机独占一个交换机端口；交换机内部每对端口之间有独立通路",
    place: "端口 + 内部",
  },
  {
    mark: "B",
    where: "链路上：半双工 (half duplex) 时同一根线不能同时收和发，主机和端口同时发就撞",
    fix: "Full duplex：发送和接收各走一对线，可以同时进行",
    place: "端口 / 链路",
  },
  {
    mark: "C",
    where: "多台主机同时发给同一台（同一个出口端口），出口只能一次发一帧",
    fix: "Buffering：先把帧存进交换机内存 (frame buffers)，再一帧一帧转发",
    place: "内部（内存）",
  },
  {
    mark: "D",
    where: "Hub 把每一帧发给所有端口，线路上的无关流量越多，越容易撞",
    fix: "MAC address table：只从目的端口发出 (forward)，同一端口的直接丢弃 (filter)",
    place: "内部（决策）",
  },
];

const dev = (x, y, label) =>
  `<rect x="${x}" y="${y}" width="60" height="30" rx="6" class="cm-dev"/><text x="${x + 30}" y="${y + 20}" class="cm-t" text-anchor="middle">${label}</text>`;
const badge = (x, y, t, kind) =>
  `<circle cx="${x}" cy="${y}" r="10" class="cm-${kind}"/><text x="${x}" y="${y + 4}" class="cm-bt" text-anchor="middle">${t}</text>`;
const star = (cx, cy, ro, ri, n) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? ri : ro;
    const a = (Math.PI * i) / n - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
// Two parallel wires with opposite arrows = full duplex.
const duplex = (x1, x2, y) =>
  `<line x1="${x1}" y1="${y - 4}" x2="${x2}" y2="${y - 4}" class="cm-wire" marker-end="url(#cm-arr)"/>` +
  `<line x1="${x2}" y1="${y + 4}" x2="${x1}" y2="${y + 4}" class="cm-wire" marker-end="url(#cm-arr)"/>`;

const FONT = `system-ui,-apple-system,'PingFang SC','Hiragino Sans GB',sans-serif`;

export const collisionSvg = `<svg viewBox="0 0 760 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hub 上的冲突与交换机的四种防冲突机制">
<style>
.cm-panel{fill:var(--subtle,#f3f2ee)}
.cm-box{fill:var(--surface,#ffffff);stroke:var(--line-strong,#cfccc4);stroke-width:1.2}
.cm-dev{fill:var(--surface,#ffffff);stroke:var(--fg-3,#8b8b93);stroke-width:1.3}
.cm-wire{stroke:var(--fg-3,#8b8b93);stroke-width:1.5;fill:none}
.cm-path{stroke:var(--c-tip,#067647);stroke-width:1.8;fill:none;stroke-dasharray:5 4}
.cm-arrowhead{fill:var(--fg-3,#8b8b93)}
.cm-burst{fill:var(--c-exam,#b42318);fill-opacity:.14;stroke:var(--c-exam,#b42318);stroke-width:1.3}
.cm-q{fill:var(--c-board,#5b4bc4);fill-opacity:.3;stroke:var(--c-board,#5b4bc4);stroke-width:1}
.cm-bad{fill:var(--c-exam,#b42318)}
.cm-good{fill:var(--c-tip,#067647)}
.cm-t{fill:var(--fg,#16161a);font-family:${FONT};font-size:12px;font-weight:500}
.cm-h{fill:var(--fg,#16161a);font-family:${FONT};font-size:13px;font-weight:600}
.cm-s{fill:var(--fg-3,#8b8b93);font-family:${FONT};font-size:11.5px}
.cm-bt{fill:#ffffff;font-family:${FONT};font-size:11px;font-weight:700}
</style>
<defs><marker id="cm-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="cm-arrowhead"/></marker></defs>

<rect x="8" y="8" width="344" height="324" rx="12" class="cm-panel"/>
<text x="24" y="34" class="cm-h">Hub / 共享介质 — 所有端口 = 1 个冲突域</text>
<polygon points="${star(180, 177, 50, 34, 12)}" class="cm-burst"/>
<line x1="70" y1="100" x2="150" y2="160" class="cm-wire"/>
<line x1="290" y1="100" x2="210" y2="160" class="cm-wire"/>
<line x1="70" y1="250" x2="150" y2="194" class="cm-wire"/>
<line x1="290" y1="250" x2="210" y2="194" class="cm-wire"/>
<rect x="140" y="160" width="80" height="34" rx="6" class="cm-box"/>
<text x="180" y="182" class="cm-t" text-anchor="middle">Hub</text>
${dev(40, 70, "PC1")}${dev(260, 70, "PC2")}${dev(40, 250, "PC3")}${dev(260, 250, "PC4")}
${badge(238, 150, "A", "bad")}${badge(122, 130, "B", "bad")}
<text x="180" y="314" class="cm-s" text-anchor="middle">两台同时发 → 信号在共享线路上叠加 = collision</text>

<rect x="368" y="8" width="384" height="324" rx="12" class="cm-panel"/>
<text x="384" y="34" class="cm-h">Switch — 每个端口 = 1 个独立冲突域</text>
<rect x="480" y="90" width="160" height="190" rx="8" class="cm-box"/>
<text x="560" y="112" class="cm-h" text-anchor="middle">Switch</text>
<line x1="485" y1="140" x2="635" y2="230" class="cm-path"/>
<line x1="485" y1="230" x2="635" y2="140" class="cm-path"/>
<rect x="600" y="150" width="6" height="12" class="cm-q"/><rect x="609" y="150" width="6" height="12" class="cm-q"/><rect x="618" y="150" width="6" height="12" class="cm-q"/>
<text x="490" y="130" class="cm-s">E0</text><text x="490" y="252" class="cm-s">E1</text>
<text x="630" y="130" class="cm-s" text-anchor="end">E2</text><text x="630" y="252" class="cm-s" text-anchor="end">E3</text>
<rect x="515" y="244" width="90" height="28" rx="5" class="cm-dev"/>
<text x="560" y="262" class="cm-t" text-anchor="middle">MAC table</text>
${duplex(444, 480, 140)}${duplex(444, 480, 230)}${duplex(676, 640, 140)}${duplex(676, 640, 230)}
${dev(384, 125, "PC1")}${dev(384, 215, "PC2")}${dev(676, 125, "PC3")}${dev(676, 215, "PC4")}
${badge(560, 172, "A", "good")}${badge(462, 118, "B", "good")}${badge(613, 176, "C", "good")}${badge(517, 244, "D", "good")}
<text x="560" y="314" class="cm-s" text-anchor="middle">独占端口 · 全双工 · 内部独立通路 · 缓冲 · 查表定向转发</text>
</svg>`;

/** Same SVG with every var(--x, #fallback) replaced by its fallback, for files outside the site. */
export const collisionSvgStatic = collisionSvg.replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g, "$1");
