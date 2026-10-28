// Routing (ISOM 5190 week 1): routing-table lookup with static / default routes (slides 11–16),
// distance-vector rounds like RIP (slide 21 + board p.5) and link-state SPF (board p.7).
// Pure functions shared by routing-lab.tsx and the README export in scripts/lib/mdx-core.mjs.

// ---------- addresses ----------
export const ipToInt = (ip) => {
  const p = String(ip).trim().split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const s of p) {
    if (!/^\d{1,3}$/.test(s) || Number(s) > 255) return null;
    n = n * 256 + Number(s);
  }
  return n;
};
export const maskBits = (prefix) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);
export const prefixToMask = (prefix) => {
  const m = maskBits(prefix);
  return [24, 16, 8, 0].map((s) => (m >>> s) & 255).join(".");
};
export const inNet = (ip, net, prefix) => ((ipToInt(ip) & maskBits(prefix)) >>> 0) === ((ipToInt(net) & maskBits(prefix)) >>> 0);

// ---------- 1. Routing-table lookup: Sterling — Hoboken — Waycross (slides 11, 12, 15) ----------
// Each router: interfaces (connected subnets) + the static / default routes the slides configure.
export const LOOKUP_ROUTERS = {
  sterling: {
    label: "Sterling",
    ifaces: [
      { name: "E0", net: "172.16.1.0", prefix: 24, ip: "172.16.1.1" },
      { name: "S0", net: "172.16.2.0", prefix: 24, ip: "172.16.2.1" },
    ],
    statics: [{ id: "def", net: "0.0.0.0", prefix: 0, out: "S0", hop: null, note: "默认路由：只有一个出口，全部丢给 Hoboken" }],
  },
  hoboken: {
    label: "Hoboken",
    ifaces: [
      { name: "S1", net: "172.16.2.0", prefix: 24, ip: "172.16.2.2" },
      { name: "E0", net: "172.16.3.0", prefix: 24, ip: "172.16.3.1" },
      { name: "S0", net: "172.16.4.0", prefix: 24, ip: "172.16.4.1" },
    ],
    statics: [
      { id: "to1-int", net: "172.16.1.0", prefix: 24, out: "S1", hop: null, note: "Slide 11：指定出接口" },
      { id: "to5-int", net: "172.16.5.0", prefix: 24, out: "S0", hop: null, note: "Slide 11：指定出接口" },
      { id: "to1-hop", net: "172.16.1.0", prefix: 24, out: "S1", hop: "172.16.2.1", note: "Slide 12：指定下一跳 IP" },
      { id: "to5-hop", net: "172.16.5.0", prefix: 24, out: "S0", hop: "172.16.4.2", note: "Slide 12：指定下一跳 IP" },
    ],
  },
  waycross: {
    label: "Waycross",
    ifaces: [
      { name: "S1", net: "172.16.4.0", prefix: 24, ip: "172.16.4.2" },
      { name: "E0", net: "172.16.5.0", prefix: 24, ip: "172.16.5.1" },
    ],
    statics: [{ id: "def", net: "0.0.0.0", prefix: 0, out: "S1", hop: null, note: "Slide 15：ip route 0.0.0.0 0.0.0.0 s1" }],
  },
};

export const LOOKUP_PRESETS = [
  { router: "hoboken", on: [], down: [], dest: "172.16.5.10", label: "Hoboken 只有直连路由，去 5.0" },
  { router: "hoboken", on: ["to1-int", "to5-int"], down: [], dest: "172.16.5.10", label: "加上 Slide 11 的两条静态路由" },
  { router: "hoboken", on: ["to1-hop", "to5-hop"], down: [], dest: "172.16.1.20", label: "改用下一跳 IP（Slide 12）" },
  { router: "hoboken", on: ["to1-int", "to5-int"], down: ["S0"], dest: "172.16.5.10", label: "S0 断了：静态路由也被撤掉" },
  { router: "waycross", on: [], down: [], dest: "172.16.1.20", label: "Waycross 没有默认路由" },
  { router: "waycross", on: ["def"], down: [], dest: "172.16.1.20", label: "Waycross 加默认路由（Slide 15）" },
];

export const staticCommand = (r) =>
  `ip route ${r.net} ${prefixToMask(r.prefix)} ${r.hop ?? r.out.toLowerCase()}`;

// The routing table the router would install: connected routes for interfaces that are up,
// plus static routes whose outgoing interface is up (slide 10: otherwise not installed).
export function buildTable(routerId, on = [], down = []) {
  const R = LOOKUP_ROUTERS[routerId];
  const up = (name) => !down.includes(name);
  const rows = [];
  for (const i of R.ifaces) if (up(i.name)) rows.push({ src: "C", net: i.net, prefix: i.prefix, out: i.name, hop: null, note: "直连" });
  for (const s of R.statics)
    if (on.includes(s.id) && up(s.out)) rows.push({ src: s.prefix === 0 ? "S*" : "S", net: s.net, prefix: s.prefix, out: s.out, hop: s.hop, note: s.note, id: s.id });
  const skipped = R.statics.filter((s) => on.includes(s.id) && !up(s.out));
  return { rows, skipped };
}

// Compare the destination with every row; the most specific (longest prefix) match wins.
export function lookup(rows, dest) {
  if (ipToInt(dest) === null) return { ok: false, error: "不是合法的 IPv4 地址" };
  const matches = rows.map((r, i) => ({ i, hit: inNet(dest, r.net, r.prefix) }));
  const hits = matches.filter((m) => m.hit);
  if (!hits.length) return { ok: true, index: -1, matches, action: "discard", why: `路由表里没有任何一条能匹配 ${dest}，也没有默认路由 → 丢弃 (discard)` };
  const best = hits.reduce((a, b) => (rows[b.i].prefix > rows[a.i].prefix ? b : a));
  const r = rows[best.i];
  let why;
  if (r.src === "C") why = `${dest} 在直连网段 ${r.net}/${r.prefix} 里 → 从 ${r.out} 直接送给目的主机（Next-Hop 对直连路由没有意义）`;
  else if (r.prefix === 0) why = `没有更具体的匹配，用默认路由 (gateway of last resort) → 从 ${r.out} 发出${r.hop ? `，交给 ${r.hop}` : ""}`;
  else why = `匹配静态路由 ${r.net}/${r.prefix} → 从 ${r.out} 发出${r.hop ? `，交给下一跳 ${r.hop}` : "（只写了出接口，对端是谁由链路决定）"}`;
  if (hits.length > 1) why += `；同时匹配了 ${hits.length} 条，选掩码最长（最具体）的那条`;
  return { ok: true, index: best.i, matches, action: "forward", why };
}

// ---------- 2. Distance vector (RIP-like rounds) ----------
// Topology = routers + networks; a network lists the routers attached to it.
export const DV_TOPOLOGIES = {
  slide21: {
    label: "Slide 21：W – A – X – B – Y – C – Z",
    routers: ["A", "B", "C"],
    nets: [
      { id: "W", routers: ["A"] },
      { id: "X", routers: ["A", "B"] },
      { id: "Y", routers: ["B", "C"] },
      { id: "Z", routers: ["C"] },
    ],
  },
  board: {
    label: "板书 p.5：R1 – R2 – R3 三角形",
    routers: ["R1", "R2", "R3"],
    nets: [
      { id: "1.0", routers: ["R1"] },
      { id: "3.0", routers: ["R2"] },
      { id: "5.0", routers: ["R3"] },
      { id: "12.0", routers: ["R1", "R2"] },
      { id: "23.0", routers: ["R2", "R3"] },
      { id: "13.0", routers: ["R1", "R3"] },
    ],
  },
};
export const RIP_INFINITY = 16;

const neighborsOf = (topo, r, failed) => {
  const out = [];
  for (const n of topo.nets) {
    if (failed.includes(n.id) || !n.routers.includes(r)) continue;
    for (const o of n.routers) if (o !== r) out.push({ router: o, via: n.id });
  }
  return out;
};

const connected = (topo, r, failed) =>
  Object.fromEntries(topo.nets.filter((n) => n.routers.includes(r) && !failed.includes(n.id)).map((n) => [n.id, { metric: 0, hop: null, src: "C" }]));

// One synchronous update round: every router hears every neighbour's previous table.
// splitHorizon: don't advertise a route back to the neighbour it was learned from.
function dvRound(topo, prev, failed, splitHorizon) {
  const next = {};
  for (const r of topo.routers) {
    const t = connected(topo, r, failed);
    for (const { router: nb } of neighborsOf(topo, r, failed)) {
      for (const [net, e] of Object.entries(prev[nb] ?? {})) {
        if (splitHorizon && e.hop === r) continue;
        const metric = Math.min(e.metric + 1, RIP_INFINITY);
        if (metric >= RIP_INFINITY) continue;
        const cur = t[net];
        if (!cur || metric < cur.metric) t[net] = { metric, hop: nb, src: "R" };
      }
    }
    next[r] = t;
  }
  return next;
}

const sameTables = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Run from cold start until converged; optionally fail a network after convergence and keep going.
// Returns every round's tables plus where the failure happened.
/** @param {string} topoId @param {{ failNet?: string | null, splitHorizon?: boolean, maxRounds?: number }} [opts] */
export function dvRun(topoId, { failNet = null, splitHorizon = true, maxRounds = 40 } = {}) {
  const topo = DV_TOPOLOGIES[topoId];
  const sort = (t) => Object.fromEntries(topo.nets.filter((n) => t[n.id]).map((n) => [n.id, t[n.id]]));
  let tables = Object.fromEntries(topo.routers.map((r) => [r, sort(connected(topo, r, []))]));
  const rounds = [{ label: "开机：只有直连", tables, phase: "boot" }];
  let failed = [];
  let failAt = null;
  for (let i = 1; i <= maxRounds; i++) {
    let next = dvRound(topo, tables, failed, splitHorizon);
    next = Object.fromEntries(Object.entries(next).map(([r, t]) => [r, sort(t)]));
    if (sameTables(next, tables)) {
      if (failNet && failAt === null) {
        failed = [failNet];
        failAt = rounds.length;
        // routers attached to the failed network drop it at once
        tables = Object.fromEntries(Object.entries(tables).map(([r, t]) => [r, sort(Object.fromEntries(Object.entries(t).filter(([n, e]) => !(n === failNet && e.src === "C"))))]));
        rounds.push({ label: `${failNet} 断开`, tables, phase: "fail" });
        continue;
      }
      break;
    }
    tables = next;
    rounds.push({ label: `第 ${i} 次更新（${i * 30}s）`, tables, phase: failAt === null ? "learn" : "after" });
  }
  const convergedAt = rounds.length - 1;
  return { topo, rounds, failAt, convergedAt, hitLimit: rounds.length > maxRounds };
}

// ---------- 3. Link state + SPF (board p.7 pentagon) ----------
export const LS_ROUTERS = ["A", "B", "C", "D", "E"];
export const LS_POS = { A: [70, 120], B: [210, 40], E: [350, 120], D: [300, 250], C: [120, 250] };
// Router-to-router links (transit networks) and stub networks; addresses follow board p.7 (B: 2.0 · 3.0 · 4.0).
export const LS_LINKS = [
  { id: "AB", a: "A", b: "B", net: "10.0.2.0", cost: 1 },
  { id: "BE", a: "B", b: "E", net: "10.0.4.0", cost: 1 },
  { id: "ED", a: "E", b: "D", net: "10.0.5.0", cost: 1 },
  { id: "DC", a: "D", b: "C", net: "10.0.7.0", cost: 1 },
  { id: "CA", a: "C", b: "A", net: "10.0.9.0", cost: 1 },
];
export const LS_STUBS = [
  { router: "A", net: "10.0.1.0", label: "PC1 LAN" },
  { router: "B", net: "10.0.3.0", label: "B 的 LAN" },
  { router: "E", net: "10.0.10.0", label: "去 ISP" },
  { router: "D", net: "10.0.6.0", label: "PC4 LAN" },
  { router: "C", net: "10.0.8.0", label: "PC3 LAN" },
];
export const LS_PRESETS = [
  { label: "板书：全部 cost = 1，从 A 看", root: "A", costs: {}, down: [] },
  { label: "A–B 链路 cost 调成 10", root: "A", costs: { AB: 10 }, down: [] },
  { label: "B–E 链路断了，从 B 看", root: "B", costs: {}, down: ["BE"] },
];

export const linkCost = (l, costs) => costs[l.id] ?? l.cost;

// LSA of one router: its own links (neighbour, network, cost) + stub networks. Firsthand info only.
export function lsaOf(r, costs = {}, down = []) {
  const links = LS_LINKS.filter((l) => !down.includes(l.id) && (l.a === r || l.b === r)).map((l) => ({
    id: l.id,
    neighbor: l.a === r ? l.b : l.a,
    net: l.net,
    cost: linkCost(l, costs),
  }));
  const stubs = LS_STUBS.filter((s) => s.router === r).map((s) => ({ net: s.net, label: s.label, cost: 1 }));
  return { router: r, links, stubs };
}

// Dijkstra from root over the topological database (all LSAs). Returns the step log,
// the SPF tree (parent of each router) and the root's routing table.
export function spf(root, costs = {}, down = []) {
  const db = LS_ROUTERS.map((r) => lsaOf(r, costs, down));
  const dist = Object.fromEntries(LS_ROUTERS.map((r) => [r, Infinity]));
  const parent = {};
  const first = {}; // first hop from root
  dist[root] = 0;
  const done = [];
  const steps = [];
  while (done.length < LS_ROUTERS.length) {
    const cand = LS_ROUTERS.filter((r) => !done.includes(r) && dist[r] < Infinity);
    if (!cand.length) break;
    // lowest cost first; ties broken alphabetically so the result is deterministic
    const u = cand.sort((x, y) => dist[x] - dist[y] || x.localeCompare(y))[0];
    done.push(u);
    const relaxed = [];
    for (const l of db.find((x) => x.router === u).links) {
      const v = l.neighbor;
      if (done.includes(v)) continue;
      const nd = dist[u] + l.cost;
      if (nd < dist[v]) {
        dist[v] = nd;
        parent[v] = u;
        first[v] = u === root ? v : first[u];
        relaxed.push(`${v}=${nd}`);
      }
    }
    steps.push({ pick: u, cost: dist[u], relaxed, tentative: { ...dist } });
  }
  const table = [];
  for (const r of LS_ROUTERS) {
    if (dist[r] === Infinity) continue;
    const lsa = db.find((x) => x.router === r);
    for (const s of lsa.stubs) table.push({ net: s.net, label: s.label, cost: dist[r] + s.cost, hop: r === root ? null : first[r], via: r });
    for (const l of lsa.links) {
      const other = dist[l.neighbor];
      // a transit network is reached through whichever of its two routers is closer
      if (dist[r] < other || (dist[r] === other && r < l.neighbor))
        table.push({ net: l.net, label: `${r}–${l.neighbor} 链路`, cost: dist[r] + l.cost, hop: r === root ? null : first[r], via: r });
    }
  }
  table.sort((x, y) => ipToInt(x.net) - ipToInt(y.net));
  const unreachable = LS_ROUTERS.filter((r) => dist[r] === Infinity);
  return { db, steps, dist, parent, first, table, unreachable };
}

// Pentagon with the SPF tree highlighted. Colours as var(--token, #light) so the README export can flatten them.
export function lsSvg(root, costs = {}, down = []) {
  const { parent } = spf(root, costs, down);
  const tree = new Set(Object.entries(parent).map(([v, u]) => [u, v].sort().join("")));
  const lines = LS_LINKS.map((l) => {
    const [x1, y1] = LS_POS[l.a];
    const [x2, y2] = LS_POS[l.b];
    const isDown = down.includes(l.id);
    const inTree = tree.has([l.a, l.b].sort().join(""));
    const stroke = isDown ? "var(--c-warn, #c2410c)" : inTree ? "var(--accent, #2563eb)" : "var(--line-strong, #a3a3a3)";
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${inTree ? 4 : 2}"${isDown ? ' stroke-dasharray="6 5"' : ""}/>` +
      `<rect x="${mx - 13}" y="${my - 10}" width="26" height="20" rx="4" fill="var(--bg, #ffffff)" stroke="var(--line, #e5e5e5)"/>` +
      `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="12" fill="var(--fg-2, #525252)">${isDown ? "✕" : linkCost(l, costs)}</text>`;
  }).join("");
  const nodes = LS_ROUTERS.map((r) => {
    const [x, y] = LS_POS[r];
    const isRoot = r === root;
    return `<circle cx="${x}" cy="${y}" r="20" fill="${isRoot ? "var(--accent, #2563eb)" : "var(--surface, #fafafa)"}" stroke="var(--accent, #2563eb)" stroke-width="2"/>` +
      `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="600" fill="${isRoot ? "var(--bg, #ffffff)" : "var(--fg, #171717)"}">${r}</text>`;
  }).join("");
  return `<svg viewBox="0 0 420 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Link-state topology A–E with SPF tree from ${root}" style="max-width:420px;width:100%">${lines}${nodes}</svg>`;
}

export const toStaticSvg = (svg) => svg.replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g, "$1");
