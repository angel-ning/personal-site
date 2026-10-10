// Topology addressing (ISOM 5180 final): given one classful network and a drawing of routers,
// LANs and router-to-router links, work out how many subnets are needed, how many bits can be
// borrowed, the subnet table, the Device / Interface / IP / Mask / Default Gateway table,
// each router's routing table and the IP / MAC addresses of a packet on every hop.
// Shared by <AddressingLab />, <AddressingQuiz /> and scripts/lib/mdx-core.mjs.
//
// Conventions (Assignment 2 rules; the final leaves the router rule out of the question, so it is the default):
// - one subnet per LAN and per router-to-router link, LANs first, in the order of `nets`;
// - router LAN (Ethernet) interface = first usable address = the hosts' default gateway;
// - hosts get the next usable addresses (second, third, …);
// - a link's two ends get the first and second usable addresses;
// - routers have no default gateway (N/A).
import { parseIp } from "./ip-logic.mjs";
import { subnetPlan, planOptions, classOf } from "./subnet-logic.mjs";

const toInt = (o) => ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
const dotted = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
const ipInt = (s) => {
  const o = parseIp(s);
  return o ? toInt(o) : null;
};
const CLASS_BITS = { A: 8, B: 16, C: 24 };

/*
 * Each topology: routers (with drawing positions) and nets in addressing order.
 * - LAN: { kind: "lan", router, iface, hosts: [{ name, x, y }], bus: [x1, y1, x2, y2] }
 * - link: { kind: "serial" | "ether", ends: [{ router, iface }, { router, iface }] }
 * Drawing hints: `side` (1 = labels above / right of the line, −1 = below / left), `netSide`, `netAt`
 * (where along a link its subnet label sits), `hostIp` ("right" of the box instead of below), `labelBelow`.
 * `mode`: "given" (mask given in the question), "max" (maximize hosts per subnet = borrow the minimum),
 * "need" (requirements; any borrow between min and max works).
 */
export const TOPOLOGIES = [
  {
    id: "a2",
    label: "Assignment 2：两个 LAN + 一条串行线",
    source: "Assignment 2",
    base: "192.168.10.0",
    mode: "given",
    givenBorrow: 2,
    question: "Given 192.168.10.0/24, use subnet mask 255.255.255.192. Subnet 0 = LAN A, Subnet 1 = LAN B, Subnet 2 = WAN serial link, Subnet 3 = reserved.",
    view: [720, 240],
    routers: [
      { id: "A", name: "Router A", x: 240, y: 80 },
      { id: "B", name: "Router B", x: 480, y: 80 },
    ],
    nets: [
      { id: "lanA", kind: "lan", label: "LAN A", router: "A", iface: "Gig0/0", bus: [50, 160, 270, 160], hosts: [{ name: "PC A", x: 110, y: 205 }] },
      { id: "lanB", kind: "lan", label: "LAN B", router: "B", iface: "Gig0/0", bus: [450, 160, 670, 160], hosts: [{ name: "PC B", x: 610, y: 205 }] },
      { id: "wan", kind: "serial", label: "WAN", ends: [{ router: "A", iface: "Se0/0/0" }, { router: "B", iface: "Se0/0/0" }], netSide: -1 },
    ],
    walk: ["PC A", "PC B"],
  },
  {
    id: "q1",
    label: "SubnetQuestions 1：A 连 B、C、D",
    source: "SubnetQuestions Q1 / M4 板书 ①",
    base: "200.1.1.0",
    mode: "max",
    question: "Use network 200.1.1.0. Choose a mask that will maximize the number of hosts per subnet.（图里每个 LAN 只画了一条线；这里每个 LAN 放一台示例主机）",
    view: [720, 400],
    routers: [
      { id: "A", name: "Router A", x: 360, y: 125 },
      { id: "B", name: "Router B", x: 140, y: 280 },
      { id: "C", name: "Router C", x: 360, y: 280 },
      { id: "D", name: "Router D", x: 580, y: 280 },
    ],
    nets: [
      { id: "lanA", kind: "lan", label: "LAN A", router: "A", iface: "E0", bus: [270, 60, 460, 60], hosts: [{ name: "Host A", x: 420, y: 25 }], hostIp: "right" },
      { id: "lanB", kind: "lan", label: "LAN B", router: "B", iface: "E0", bus: [35, 340, 245, 340], hosts: [{ name: "Host B", x: 195, y: 375 }], hostIp: "right" },
      { id: "lanC", kind: "lan", label: "LAN C", router: "C", iface: "E0", bus: [262, 340, 462, 340], hosts: [{ name: "Host C", x: 415, y: 375 }], hostIp: "right" },
      { id: "lanD", kind: "lan", label: "LAN D", router: "D", iface: "E0", bus: [482, 340, 690, 340], hosts: [{ name: "Host D", x: 635, y: 375 }], hostIp: "right" },
      { id: "ab", kind: "ether", label: "A–B", ends: [{ router: "A", iface: "E1" }, { router: "B", iface: "E1" }], netSide: 1 },
      { id: "ac", kind: "ether", label: "A–C", ends: [{ router: "A", iface: "E2", d: 64 }, { router: "C", iface: "E1" }], side: 1, netSide: -1, netAt: 0.62 },
      { id: "ad", kind: "ether", label: "A–D", ends: [{ router: "A", iface: "E3" }, { router: "D", iface: "E1" }], netSide: 1 },
    ],
    walk: ["Host B", "Host D"],
  },
  {
    id: "q2",
    label: "SubnetQuestions 2：三台路由器串行三角形",
    source: "SubnetQuestions Q2 / M4 板书 ②",
    base: "172.16.0.0",
    mode: "need",
    needSubnets: 100,
    needHosts: 200,
    question: "The network might grow to need at most 100 subnets, with 200 hosts per subnet maximum. Use network 172.16.0.0 and the same subnet mask for all subnets. Determine all masks that meet the criteria; choose one and pick enough subnets for this topology.",
    view: [720, 410],
    routers: [
      { id: "A", name: "Router A", x: 360, y: 125 },
      { id: "B", name: "Router B", x: 150, y: 290 },
      { id: "C", name: "Router C", x: 570, y: 290 },
    ],
    nets: [
      { id: "lanA", kind: "lan", label: "LAN A", router: "A", iface: "E0", bus: [250, 60, 470, 60], hosts: [{ name: "Host A", x: 430, y: 25 }], hostIp: "right" },
      { id: "lanB", kind: "lan", label: "LAN B", router: "B", iface: "E0", bus: [40, 350, 260, 350], hosts: [{ name: "Host B", x: 205, y: 385 }], hostIp: "right", side: -1 },
      { id: "lanC", kind: "lan", label: "LAN C", router: "C", iface: "E0", bus: [460, 350, 680, 350], hosts: [{ name: "Host C", x: 625, y: 385 }], hostIp: "right" },
      { id: "ab", kind: "serial", label: "A–B", ends: [{ router: "A", iface: "S0" }, { router: "B", iface: "S0" }] },
      { id: "ac", kind: "serial", label: "A–C", ends: [{ router: "A", iface: "S1" }, { router: "C", iface: "S0" }] },
      { id: "bc", kind: "serial", label: "B–C", ends: [{ router: "B", iface: "S1" }, { router: "C", iface: "S1" }], side: -1 },
    ],
    walk: ["Host B", "Host C"],
  },
  {
    id: "chain",
    label: "M4 板书 p.3：A–B–C–D 一条链，10 台 PC",
    source: "M4 Supplementary p.3",
    base: "192.168.10.0",
    mode: "need",
    question: "只给一个 Class C 网络 192.168.10.0，给图里所有需要地址的地方编址（每个 LAN 2 台 PC）。",
    view: [800, 290],
    routers: [
      { id: "A", name: "Router A", x: 240, y: 230 },
      { id: "B", name: "Router B", x: 410, y: 230 },
      { id: "C", name: "Router C", x: 570, y: 230 },
      { id: "D", name: "Router D", x: 720, y: 230 },
    ],
    nets: [
      { id: "lan12", kind: "lan", label: "PC1, PC2", router: "A", iface: "E0", bus: [20, 230, 160, 230], hosts: [{ name: "PC1", x: 45, y: 185 }, { name: "PC2", x: 120, y: 185 }], labelBelow: true, hostIp: "right" },
      { id: "lan34", kind: "lan", label: "PC3, PC4", router: "A", iface: "E1", bus: [240, 40, 240, 150], hosts: [{ name: "PC3", x: 295, y: 60 }, { name: "PC4", x: 295, y: 125 }] },
      { id: "lan56", kind: "lan", label: "PC5, PC6", router: "B", iface: "E0", bus: [410, 40, 410, 150], hosts: [{ name: "PC5", x: 465, y: 60 }, { name: "PC6", x: 465, y: 125 }] },
      { id: "lan78", kind: "lan", label: "PC7, PC8", router: "C", iface: "E0", bus: [570, 40, 570, 150], hosts: [{ name: "PC7", x: 625, y: 60 }, { name: "PC8", x: 625, y: 125 }] },
      { id: "lan910", kind: "lan", label: "PC9, PC10", router: "D", iface: "E0", bus: [720, 40, 720, 150], hosts: [{ name: "PC9", x: 770, y: 60 }, { name: "PC10", x: 770, y: 125 }] },
      { id: "ab", kind: "ether", label: "A–B", ends: [{ router: "A", iface: "E2" }, { router: "B", iface: "E1" }] },
      { id: "bc", kind: "ether", label: "B–C", ends: [{ router: "B", iface: "E2" }, { router: "C", iface: "E1" }] },
      { id: "cd", kind: "ether", label: "C–D", ends: [{ router: "C", iface: "E2" }, { router: "D", iface: "E1" }] },
    ],
    walk: ["PC1", "PC9"],
  },
  {
    id: "mock",
    label: "预测卷 B1：三台路由器、4 个 LAN",
    source: "期末预测卷 B1",
    base: "192.168.100.0",
    mode: "need",
    needHosts: 26,
    needNote: "（最大的 LAN1 有 25 台 + 路由器接口 1 个）",
    question: "Use 192.168.100.0 and the same mask for all subnets. LAN1 has 20 hosts, LAN2 25 hosts, LAN3 10 hosts, LAN4 5 hosts. R1–R2 is a serial link, R2–R3 an Ethernet link. Each LAN shows one PC.",
    view: [720, 310],
    routers: [
      { id: "R1", name: "Router R1", x: 150, y: 150 },
      { id: "R2", name: "Router R2", x: 360, y: 150 },
      { id: "R3", name: "Router R3", x: 570, y: 150 },
    ],
    nets: [
      { id: "lan1", kind: "lan", label: "LAN1", router: "R1", iface: "E0", bus: [40, 240, 240, 240], hosts: [{ name: "PC1", x: 195, y: 275 }], hostIp: "right", labelBelow: true },
      { id: "lan2", kind: "lan", label: "LAN2", router: "R2", iface: "E0", bus: [262, 240, 455, 240], hosts: [{ name: "PC2", x: 412, y: 275 }], hostIp: "right", labelBelow: true },
      { id: "lan3", kind: "lan", label: "LAN3", router: "R3", iface: "E0", bus: [472, 240, 690, 240], hosts: [{ name: "PC3", x: 640, y: 275 }], hostIp: "right", labelBelow: true },
      { id: "lan4", kind: "lan", label: "LAN4", router: "R3", iface: "E1", bus: [440, 60, 690, 60], hosts: [{ name: "PC4", x: 640, y: 25 }], hostIp: "right" },
      { id: "r12", kind: "serial", label: "R1–R2", ends: [{ router: "R1", iface: "S0" }, { router: "R2", iface: "S0" }] },
      { id: "r23", kind: "ether", label: "R2–R3", ends: [{ router: "R2", iface: "E1" }, { router: "R3", iface: "E2" }] },
    ],
    walk: ["PC1", "PC4"],
  },
];

export const topologyById = (id) => TOPOLOGIES.find((t) => t.id === id) ?? TOPOLOGIES[0];

const isLink = (n) => n.kind !== "lan";
const hostsOf = (n) => (n.kind === "lan" ? n.hosts.length + 1 : 2); // a LAN also needs an address for the router interface
const attached = (n) => (n.kind === "lan" ? [n.router] : n.ends.map((e) => e.router));
const netsOfRouter = (topo, r) => topo.nets.filter((n) => attached(n).includes(r));
const ifaceOn = (n, r) => (n.kind === "lan" ? n.iface : n.ends.find((e) => e.router === r)?.iface);
export const netLabel = (n) => (n.kind === "lan" ? n.label : `${n.label} ${n.kind === "serial" ? "串行" : "以太网"}链路`);

/**
 * Step 1–2: how many subnets and addresses are needed, and which numbers of borrowed bits work.
 * Hosts needed per subnet counts the router interface too (2 PCs + router = 3 addresses).
 */
export function requirements(topo) {
  const cls = classOf(parseIp(topo.base));
  const lans = topo.nets.filter((n) => n.kind === "lan").length;
  const links = topo.nets.length - lans;
  const subnetsDrawn = topo.nets.length;
  const subnetsNeeded = Math.max(subnetsDrawn, topo.needSubnets ?? 0);
  const hostsDrawn = Math.max(...topo.nets.map(hostsOf));
  const hostsNeeded = Math.max(hostsDrawn, topo.needHosts ?? 0);
  const p = planOptions(cls, subnetsNeeded, hostsNeeded);
  const options = [];
  for (let b = p.minBorrow; b <= p.maxBorrow; b++) options.push(b);
  const allowed = topo.mode === "given" ? [topo.givenBorrow] : topo.mode === "max" ? [p.minBorrow] : options;
  const pick = topo.mode === "given" ? topo.givenBorrow : topo.mode === "max" ? p.minBorrow : options.includes(8) ? 8 : p.minBorrow;
  return { cls, netBits: CLASS_BITS[cls], lans, links, subnetsDrawn, subnetsNeeded, hostsDrawn, hostsNeeded, total: p.total, minBorrow: p.minBorrow, minHostBits: p.minHostBits, maxBorrow: p.maxBorrow, options, allowed, pick };
}

const macOf = (dev, iface) => (iface ? `MAC-${dev}-${iface}` : `MAC-${dev.replace(/\s+/g, "")}`);

/**
 * Step 3–4: subnet table and the device addressing table for a chosen number of borrowed bits.
 * Returns null if the borrow is out of range or there are not enough subnets for the drawing.
 */
export function addressPlan(topo, borrow) {
  const p = subnetPlan(topo.base, borrow);
  if (!p || p.subnets < topo.nets.length) return null;
  const R = Object.fromEntries(topo.routers.map((r) => [r.id, r]));
  const subnets = topo.nets.map((n, i) => {
    const s = p.subnet(i);
    const net = ipInt(s.network);
    return { ...s, net: n, usage: netLabel(n), at: (k) => dotted(net + k) };
  });
  const rows = []; // routers first (router order, then nets order), then hosts
  topo.routers.forEach((r) => {
    subnets.forEach((s) => {
      const n = s.net;
      if (!attached(n).includes(r.id)) return;
      const nth = n.kind === "lan" ? 1 : n.ends.findIndex((e) => e.router === r.id) + 1;
      rows.push({
        key: `${r.id}|${ifaceOn(n, r.id)}`,
        device: r.name,
        router: r.id,
        iface: ifaceOn(n, r.id),
        ip: s.at(nth),
        mask: p.mask.dotted,
        gateway: "N/A",
        netId: n.id,
        role: n.kind === "lan" ? "router-lan" : "router-link",
        rule: n.kind === "lan" ? `${n.label} 第 1 个可用地址（= 这个 LAN 的默认网关）` : `${n.label} 链路第 ${nth} 个可用地址`,
      });
    });
  });
  subnets.forEach((s) => {
    const n = s.net;
    if (n.kind !== "lan") return;
    n.hosts.forEach((h, k) => {
      rows.push({
        key: `host|${h.name}`,
        device: h.name,
        iface: "NIC",
        ip: s.at(k + 2),
        mask: p.mask.dotted,
        gateway: s.at(1),
        netId: n.id,
        role: "host",
        rule: `${n.label} 第 ${k + 2} 个可用地址；网关 = ${R[n.router].name} ${n.iface}`,
      });
    });
  });
  return { plan: p, subnets, rows, unused: p.subnets - topo.nets.length, mask: p.mask.dotted, prefix: p.prefix, borrow: p.borrow };
}

// Router graph: neighbors over links (edge seen from `from`).
function neighbors(topo) {
  const g = Object.fromEntries(topo.routers.map((r) => [r.id, []]));
  topo.nets.filter(isLink).forEach((n) => {
    const [a, b] = n.ends;
    g[a.router].push({ from: a.router, to: b.router, net: n, myIface: a.iface, theirIface: b.iface });
    g[b.router].push({ from: b.router, to: a.router, net: n, myIface: b.iface, theirIface: a.iface });
  });
  return g;
}

// BFS over routers: hop distance and the edge each router was reached by.
function bfs(topo, start) {
  const g = neighbors(topo);
  const dist = { [start]: 0 };
  const via = {};
  const q = [start];
  while (q.length) {
    const u = q.shift();
    for (const e of g[u]) {
      if (dist[e.to] != null) continue;
      dist[e.to] = dist[u] + 1;
      via[e.to] = e;
      q.push(e.to);
    }
  }
  const pathTo = (target) => {
    const out = [];
    for (let v = target; v !== start; v = via[v].from) out.unshift(via[v]);
    return out;
  };
  return { dist, pathTo };
}

/** Step 5: each router's routing table (connected first, then learned), with next hop and hop count. */
export function routingTables(topo, ap) {
  const ipOf = (router, iface) => ap.rows.find((r) => r.key === `${router}|${iface}`)?.ip;
  return topo.routers.map((r) => {
    const { dist, pathTo } = bfs(topo, r.id);
    const rows = ap.subnets.map((s) => {
      const n = s.net;
      if (attached(n).includes(r.id)) return { src: "C", network: s.network, prefix: ap.prefix, iface: ifaceOn(n, r.id), nextHop: "—", hops: 0, netId: n.id };
      const target = attached(n).reduce((best, id) => (best == null || dist[id] < dist[best] ? id : best), null);
      const e = pathTo(target)[0];
      return { src: "R", network: s.network, prefix: ap.prefix, iface: e.myIface, nextHop: ipOf(e.to, e.theirIface), hops: dist[target], netId: n.id };
    });
    rows.sort((a, b) => (a.src === b.src ? 0 : a.src === "C" ? -1 : 1));
    return { router: r.id, name: r.name, rows };
  });
}

export const hostNames = (topo) => topo.nets.filter((n) => n.kind === "lan").flatMap((n) => n.hosts.map((h) => h.name));

/**
 * Step 6: send one packet from host `src` to host `dst`. IP (S, D) stays the same end to end;
 * the Layer 2 header is rebuilt on every hop. Serial links use PPP / HDLC framing (no MAC address).
 */
export function walkPacket(topo, ap, src, dst) {
  const lanOf = (h) => topo.nets.find((n) => n.kind === "lan" && n.hosts.some((x) => x.name === h));
  const ls = lanOf(src);
  const ld = lanOf(dst);
  if (!ls || !ld || src === dst) return null;
  const ip = (key) => ap.rows.find((r) => r.key === key)?.ip;
  const sIp = ip(`host|${src}`);
  const dIp = ip(`host|${dst}`);
  if (ls.id === ld.id) {
    const segs = [{ from: src, to: dst, l2: [macOf(src), macOf(dst)], arp: `${dIp}（同一网络，直接 ARP 对方）`, kind: "ether", netId: ls.id }];
    return { sIp, dIp, same: true, segs, path: [ls.id] };
  }
  const gw = ip(`${ls.router}|${ls.iface}`);
  const segs = [{ from: src, to: `${ls.router} ${ls.iface}`, l2: [macOf(src), macOf(ls.router, ls.iface)], arp: `${gw}（默认网关）`, kind: "ether", netId: ls.id }];
  bfs(topo, ls.router)
    .pathTo(ld.router)
    .forEach((e) => {
      const serial = e.net.kind === "serial";
      segs.push({
        from: `${e.from} ${e.myIface}`,
        to: `${e.to} ${e.theirIface}`,
        l2: serial ? null : [macOf(e.from, e.myIface), macOf(e.to, e.theirIface)],
        arp: serial ? "不用 ARP（串行点对点链路）" : `${ip(`${e.to}|${e.theirIface}`)}（路由表里的 next hop）`,
        kind: e.net.kind,
        netId: e.net.id,
      });
    });
  segs.push({ from: `${ld.router} ${ld.iface}`, to: dst, l2: [macOf(ld.router, ld.iface), macOf(dst)], arp: `${dIp}（直连网络，直接 ARP 目的主机）`, kind: "ether", netId: ld.id });
  return { sIp, dIp, same: false, segs, path: segs.map((s) => s.netId) };
}

// ---------- self-check: free-form table (test mode) ----------

/** "255.255.255.224" or "/27" or "27" → prefix length, or null. */
export function parseMask(text) {
  const t = String(text ?? "").trim();
  const m = t.match(/^\/?(\d{1,2})$/);
  if (m) return Number(m[1]) <= 32 ? Number(m[1]) : null;
  const o = parseIp(t);
  if (!o) return null;
  const bits = o.map((x) => x.toString(2).padStart(8, "0")).join("");
  return /^1*0*$/.test(bits) ? bits.indexOf("0") === -1 ? 32 : bits.indexOf("0") : null;
}

export const deviceOptions = (topo) => [
  ...topo.routers.map((r) => ({ value: r.id, label: r.name })),
  ...hostNames(topo).map((h) => ({ value: h, label: h })),
];

const NA = /^(n\/?a|-|—|none|无|)$/i;

/**
 * Check a learner's own table. Nothing tells them which interfaces need an address:
 * each row is { device, iface, ip, mask, gateway } with `device` a router id or host name.
 * The checker works out the mask they used, which network each address lands in (a small
 * matching search: a router row can belong to any network that router is attached to), then
 * reports wrong cells and what is missing (e.g. a router's LAN interface, the far end of a link).
 */
export function checkFreeRows(topo, rows) {
  const req = requirements(topo);
  const R = Object.fromEntries(topo.routers.map((r) => [r.id, r]));
  const lanOfHost = Object.fromEntries(topo.nets.filter((n) => n.kind === "lan").flatMap((n) => n.hosts.map((h) => [h.name, n])));
  const results = rows.map(() => ({ device: null, iface: null, ip: null, mask: null, gateway: null, net: null }));
  const filled = rows.map((r, i) => ({ ...r, i })).filter((r) => r.device || r.ip || r.mask || r.gateway || r.iface);

  // 1. mask: the most common valid one decides the plan
  const prefixes = filled.map((r) => parseMask(r.mask));
  const count = {};
  prefixes.forEach((p) => p != null && (count[p] = (count[p] ?? 0) + 1));
  const prefix = Number(Object.keys(count).sort((a, b) => count[b] - count[a])[0] ?? NaN);
  const borrow = prefix - req.netBits;
  const plan = Number.isInteger(borrow) ? subnetPlan(topo.base, borrow) : null;
  const borrowOk = plan && req.allowed.includes(borrow) && plan.subnets >= topo.nets.length;
  const general = [];
  if (!plan) general.push({ ok: "bad", msg: `掩码没填或不合法。${topo.base} 是 Class ${req.cls}，默认 /${req.netBits}，掩码要比它长（借了几位就多几个 1）。` });
  else if (!borrowOk)
    general.push({
      ok: "bad",
      msg:
        plan.subnets < topo.nets.length
          ? `/${prefix} 只借了 ${borrow} 位 → 2^${borrow} = ${plan.subnets} 个子网，不够图里的 ${topo.nets.length} 个网络。`
          : topo.mode === "max"
            ? `/${prefix} 能用，但题目要每个子网主机最多 → 借最少的位：${req.minBorrow} 位（/${req.netBits + req.minBorrow}）。`
            : `/${prefix} 不满足题目要求：可以借的位数是 ${req.allowed.join(" 或 ")}。`,
    });

  // 2. per-row basics
  const valid = [];
  const seenIp = {};
  const seenHost = {};
  filled.forEach((r) => {
    const res = results[r.i];
    const isRouter = !!R[r.device];
    const isHost = !!lanOfHost[r.device];
    res.device = !r.device ? { ok: "bad", msg: "选一个设备" } : isRouter || isHost ? { ok: "ok" } : { ok: "bad", msg: "图里没有这个设备" };
    if (isHost) {
      if (seenHost[r.device]) res.device = { ok: "bad", msg: `${r.device} 只有一个网卡，写一行就够` };
      seenHost[r.device] = true;
    }
    res.iface = (r.iface ?? "").trim() ? { ok: "ok" } : { ok: "warn", msg: isHost ? "主机写 NIC 就行" : "写上接口名（E0、S0、Gig0/0…）" };
    const p = parseMask(r.mask);
    res.mask = p == null ? { ok: "bad", msg: "掩码没填或不合法" } : p === prefix ? (borrowOk ? { ok: "ok" } : { ok: "bad", msg: "见上面关于掩码的说明" }) : { ok: "bad", msg: `所有子网用同一个掩码（这张表大多数行用的是 /${prefix}）` };
    const v = (r.ip ?? "").trim();
    const loc = plan && v ? plan.locate(v) : null;
    if (!v) res.ip = { ok: "bad", msg: "没填 IP" };
    else if (parseIp(v) == null) res.ip = { ok: "bad", msg: "不是合法的 IPv4 地址" };
    else if (!plan) res.ip = { ok: "bad", msg: "先把掩码写对，才能判断它在哪个子网" };
    else if (!loc) res.ip = { ok: "bad", msg: `不在题目给的网络 ${topo.base} 里` };
    else if (loc.role === "network") res.ip = { ok: "bad", msg: `${v} 是子网 ${loc.network}/${prefix} 的 network address（host 全 0），不能给接口` };
    else if (loc.role === "broadcast") res.ip = { ok: "bad", msg: `${v} 是子网 ${loc.network}/${prefix} 的 broadcast address（host 全 1），不能给接口` };
    else if (seenIp[v]) res.ip = { ok: "bad", msg: `和 ${seenIp[v]} 重复了` };
    else res.ip = { ok: "ok" };
    if (v && parseIp(v)) seenIp[v] = seenIp[v] ?? (R[r.device]?.name ?? r.device ?? "上一行");
    if (res.ip.ok === "ok" && (isRouter || (isHost && res.device.ok === "ok"))) valid.push({ ...r, idx: loc.i, isRouter, isHost });
  });

  // 3. which network does each valid row belong to? hosts are fixed; routers are searched.
  const netIdx = {};
  const idxNet = {};
  valid
    .filter((r) => r.isHost)
    .forEach((r) => {
      const n = lanOfHost[r.device];
      const res = results[r.i];
      if (netIdx[n.id] == null && idxNet[r.idx] == null) {
        netIdx[n.id] = r.idx;
        idxNet[r.idx] = n.id;
        res.net = n.id;
      } else if (netIdx[n.id] === r.idx) res.net = n.id;
      else if (netIdx[n.id] != null) res.ip = { ok: "bad", msg: `同一个 LAN 里的地址要在同一个子网：${n.label} 已经用了 ${plan.subnet(netIdx[n.id]).network}/${prefix}` };
      else res.ip = { ok: "bad", msg: `子网 ${plan.subnet(r.idx).network}/${prefix} 已经给了 ${netLabel(topo.nets.find((x) => x.id === idxNet[r.idx]))}，每个网络要用不同的子网` };
    });
  const routerRows = valid.filter((r) => r.isRouter);
  let best = { score: -1, assign: {}, netIdx: {}, idxNet: {} };
  let budget = 50000;
  const dfs = (k, assign, nI, iN, taken, score) => {
    if (--budget < 0) return;
    if (score + (routerRows.length - k) <= best.score) return;
    if (k === routerRows.length) {
      best = { score, assign: { ...assign }, netIdx: { ...nI }, idxNet: { ...iN } };
      return;
    }
    const r = routerRows[k];
    const cands = netsOfRouter(topo, r.device).filter((n) => !taken[`${r.device}|${n.id}`] && (nI[n.id] === r.idx || (nI[n.id] == null && iN[r.idx] == null)));
    cands.sort((a, b) => (nI[b.id] === r.idx) - (nI[a.id] === r.idx));
    for (const n of cands) {
      const fresh = nI[n.id] == null;
      if (fresh) {
        nI[n.id] = r.idx;
        iN[r.idx] = n.id;
      }
      taken[`${r.device}|${n.id}`] = true;
      assign[r.i] = n.id;
      dfs(k + 1, assign, nI, iN, taken, score + 1);
      delete assign[r.i];
      delete taken[`${r.device}|${n.id}`];
      if (fresh) {
        delete nI[n.id];
        delete iN[r.idx];
      }
    }
    dfs(k + 1, assign, nI, iN, taken, score); // leave this row unmatched
  };
  dfs(0, {}, { ...netIdx }, { ...idxNet }, {}, 0);
  Object.assign(netIdx, best.netIdx);
  Object.assign(idxNet, best.idxNet);

  const covered = {}; // `${router}|${net}` → row
  routerRows.forEach((r) => {
    const res = results[r.i];
    const nid = best.assign[r.i];
    if (!nid) {
      const owner = idxNet[r.idx] && topo.nets.find((x) => x.id === idxNet[r.idx]);
      res.ip = owner
        ? { ok: "bad", msg: `子网 ${plan.subnet(r.idx).network}/${prefix} 属于 ${netLabel(owner)}，${R[r.device].name} 没接到那个网络（或那一端已经有地址了）` }
        : { ok: "bad", msg: `${R[r.device].name} 连着的网络都已经有自己的子网了，这一行对不上任何接口` };
      return;
    }
    res.net = nid;
    covered[`${r.device}|${nid}`] = r;
    const n = topo.nets.find((x) => x.id === nid);
    const first = plan.subnet(netIdx[nid]).first;
    if (n.kind === "lan" && r.ip.trim() !== first) res.ip = { ok: "warn", msg: `地址合法，但路由器 LAN 接口按惯例给第一个可用地址 ${first}（题目不会写这条规则）` };
  });

  // 4. gateways
  filled.forEach((r) => {
    const res = results[r.i];
    const g = (r.gateway ?? "").trim();
    if (R[r.device]) {
      res.gateway = NA.test(g) ? { ok: "ok" } : { ok: "bad", msg: "路由器接口的 Default Gateway 写 N/A" };
      return;
    }
    const n = lanOfHost[r.device];
    if (!n) return;
    const rr = covered[`${n.router}|${n.id}`];
    const want = rr ? rr.ip.trim() : netIdx[n.id] != null ? plan.subnet(netIdx[n.id]).first : null;
    if (!g) res.gateway = { ok: "bad", msg: "主机一定要填默认网关" };
    else if (want && g === want) res.gateway = { ok: "ok" };
    else if (want) res.gateway = { ok: "bad", msg: `默认网关 = 同一个 LAN 上 ${R[n.router].name} 那个接口的 IP（${want}）` };
    else res.gateway = { ok: "warn", msg: `默认网关要和主机在同一个子网，是 ${R[n.router].name} 接 ${n.label} 的接口地址` };
  });

  // 5. what is missing
  const missing = [];
  topo.nets.forEach((n) => {
    attached(n).forEach((rid) => {
      if (covered[`${rid}|${n.id}`]) return;
      missing.push(
        n.kind === "lan"
          ? `${R[rid].name} 接 ${n.label} 的接口（路由器的 LAN / 以太网接口，也就是这个 LAN 的默认网关）`
          : `${R[rid].name} 在 ${n.label} 链路这一端的接口（路由器之间的线也是一个网络，两端各要一个地址）`,
      );
    });
    if (n.kind === "lan") n.hosts.forEach((h) => !valid.some((r) => r.device === h.name && results[r.i].net === n.id) && missing.push(`${h.name}`));
  });
  const netsWithSubnet = topo.nets.filter((n) => netIdx[n.id] != null).length;
  const cells = results.flatMap((r, i) => (filled.some((f) => f.i === i) ? [r.device, r.ip, r.mask, r.gateway] : [])).filter(Boolean);
  const bad = cells.filter((c) => c.ok === "bad").length;
  const warn = cells.filter((c) => c.ok === "warn").length;
  const expectedRows = topo.nets.reduce((s, n) => s + attached(n).length + (n.kind === "lan" ? n.hosts.length : 0), 0);
  return {
    results,
    general,
    missing,
    prefix: plan ? prefix : null,
    borrow: plan ? borrow : null,
    borrowOk: !!borrowOk,
    netsWithSubnet,
    expectedRows,
    filledRows: filled.length,
    bad,
    warn,
    perfect: borrowOk && bad === 0 && missing.length === 0 && filled.length === expectedRows,
  };
}

// ---------- drawing ----------

const FONT = `system-ui,-apple-system,'PingFang SC','Hiragino Sans GB',sans-serif`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const textW = (s) => String(s).length * 6.3;

/** Host part of an address, the way the board writes it (N.H): Class C → ".33", Class B → ".3.1". */
export function shortIp(ip, cls) {
  const o = String(ip).split(".");
  const keep = { A: 3, B: 2, C: 1 }[cls] ?? 1;
  return `.${o.slice(4 - keep).join(".")}`;
}

function zigzag(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const px = -uy * 9;
  const py = ux * 9;
  const f = (n) => n.toFixed(1);
  return `M${x1},${y1} L${f(mx - ux * 7 + px)},${f(my - uy * 7 + py)} L${f(mx + ux * 7 - px)},${f(my + uy * 7 - py)} L${x2},${y2}`;
}

// Unit normal of direction (ux, uy) on the requested side: horizontal-ish lines → 1 = above;
// vertical-ish lines → 1 = right.
function normal(ux, uy, side) {
  let nx = -uy;
  let ny = ux;
  const horizontal = Math.abs(ux) >= Math.abs(uy);
  if ((horizontal && ny > 0) || (!horizontal && nx < 0)) {
    nx = -nx;
    ny = -ny;
  }
  return [nx * side, ny * side];
}

// Place a text at point (x, y) pushed `off` px along normal (nx, ny); choose anchor / baseline from the normal.
function placed(x, y, nx, ny, off, content, cls) {
  const qx = x + nx * off;
  const qy = y + ny * off;
  const anchor = nx > 0.5 ? "start" : nx < -0.5 ? "end" : "middle";
  const base = ny < -0.5 ? qy : ny > 0.5 ? qy + 9 : qy + 4;
  return `<text x="${qx.toFixed(1)}" y="${base.toFixed(1)}" text-anchor="${anchor}" class="${cls}">${content}</text>`;
}

// Interface label a little way along the line from the router toward `to`.
function endLabel(r, to, name, short, side, dOverride) {
  const len = Math.hypot(to[0] - r.x, to[1] - r.y) || 1;
  const ux = (to[0] - r.x) / len;
  const uy = (to[1] - r.y) / len;
  const [nx, ny] = normal(ux, uy, side);
  const content = `<tspan class="tp-if">${esc(name)}</tspan>${short ? `<tspan class="tp-ip"> ${esc(short)}</tspan>` : ""}`;
  // centred labels must clear the router circle; side labels only need a little distance
  const centred = Math.abs(nx) <= 0.5;
  const d = dOverride ?? Math.min(len * 0.45, centred ? Math.max(34, 21 + textW(`${name} ${short ?? ""}`) / 2) : 32);
  return placed(r.x + ux * d, r.y + uy * d, nx, ny, 10, content, "");
}

/**
 * SVG drawing of a topology. With `ap` (an addressPlan) and `showAddr`, interfaces and hosts carry
 * their host part (N.H style) and every network its subnet. `showIfaces` hides interface names
 * (test mode); `highlight` = net ids on a packet's path.
 * @param {any} topo
 * @param {any} ap
 * @param {{ showAddr?: boolean, showIfaces?: boolean, highlight?: string[] }} [opts]
 */
export function topologySvg(topo, ap, { showAddr = true, showIfaces = true, highlight = [] } = {}) {
  const [W, H] = topo.view;
  const R = Object.fromEntries(topo.routers.map((r) => [r.id, r]));
  const cls = classOf(parseIp(topo.base));
  const addr = !!(ap && showAddr);
  const ipOf = (key) => (addr ? ap.rows.find((r) => r.key === key)?.ip : null);
  const short = (key) => {
    const ip = ipOf(key);
    return ip ? shortIp(ip, cls) : null;
  };
  const subnetOf = (id) => (addr ? ap.subnets.find((s) => s.net.id === id) : null);
  const hl = new Set(highlight);
  const wires = [];
  const boxes = [];
  const labels = [];
  topo.nets.forEach((n) => {
    const c = hl.has(n.id) ? "tp-wire tp-hl" : "tp-wire";
    const s = subnetOf(n.id);
    if (n.kind === "lan") {
      const r = R[n.router];
      const [x1, y1, x2, y2] = n.bus;
      const vertical = x1 === x2;
      const ax = vertical ? x1 : Math.min(Math.max(r.x, x1), x2);
      const ay = vertical ? Math.min(Math.max(r.y, y1), y2) : y1;
      wires.push(`<line x1="${r.x}" y1="${r.y}" x2="${ax}" y2="${ay}" class="${c}"/>`);
      wires.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c} tp-bus"/>`);
      n.hosts.forEach((h) => {
        const bx = vertical ? x1 : h.x;
        const by = vertical ? h.y : y1;
        wires.push(`<line x1="${bx}" y1="${by}" x2="${h.x}" y2="${h.y}" class="${c}"/>`);
        const w = Math.max(46, textW(h.name) + 14);
        boxes.push(`<rect x="${h.x - w / 2}" y="${h.y - 11}" width="${w}" height="22" rx="5" class="tp-host"/><text x="${h.x}" y="${h.y + 4}" text-anchor="middle" class="tp-t">${esc(h.name)}</text>`);
        const sh = short(`host|${h.name}`);
        if (sh) labels.push(n.hostIp === "right" ? `<text x="${h.x + w / 2 + 5}" y="${h.y + 4}" class="tp-ip">${esc(sh)}</text>` : `<text x="${h.x}" y="${h.y + 24}" text-anchor="middle" class="tp-ip">${esc(sh)}</text>`);
      });
      if (showIfaces || addr) labels.push(endLabel(r, [ax, ay], showIfaces ? n.iface : "", short(`${n.router}|${n.iface}`), n.side ?? 1));
      const text = s ? `${s.network}/${ap.prefix}` : n.label;
      labels.push(
        vertical
          ? `<text x="${x1 - 8}" y="${y1 + 4}" text-anchor="end" class="tp-net">${esc(text)}</text>`
          : !n.labelBelow && ax - x1 < text.length * 6.8 + 8
            ? `<text x="${x2}" y="${n.labelBelow ? y1 + 16 : y1 - 7}" text-anchor="end" class="tp-net">${esc(text)}</text>`
            : `<text x="${x1}" y="${n.labelBelow ? y1 + 16 : y1 - 7}" class="tp-net">${esc(text)}</text>`,
      );
    } else {
      const [a, b] = n.ends.map((e) => R[e.router]);
      wires.push(n.kind === "serial" ? `<path d="${zigzag(a.x, a.y, b.x, b.y)}" class="${c}"/>` : `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${c}"/>`);
      const side = n.side ?? 1;
      if (showIfaces || addr) {
        labels.push(endLabel(a, [b.x, b.y], showIfaces ? n.ends[0].iface : "", short(`${a.id}|${n.ends[0].iface}`), side, n.ends[0].d));
        labels.push(endLabel(b, [a.x, a.y], showIfaces ? n.ends[1].iface : "", short(`${b.id}|${n.ends[1].iface}`), side, n.ends[1].d));
      }
      if (s) {
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const [nx, ny] = normal((b.x - a.x) / len, (b.y - a.y) / len, n.netSide ?? -side);
        const t = n.netAt ?? 0.5;
        labels.push(placed(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, nx, ny, n.kind === "serial" ? 14 : 8, esc(`${s.network}/${ap.prefix}`), "tp-net"));
      }
    }
  });
  topo.routers.forEach((r) => {
    boxes.push(`<circle cx="${r.x}" cy="${r.y}" r="17" class="tp-router"/><text x="${r.x}" y="${r.y + 4.5}" text-anchor="middle" class="tp-rt">${esc(r.id)}</text>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(topo.label)}">
<style>
.tp-wire{stroke:var(--fg-3,#8b8b93);stroke-width:1.6;fill:none}
.tp-bus{stroke-width:2.4}
.tp-hl{stroke:var(--c-tip,#067647);stroke-width:3}
.tp-router{fill:var(--accent-wash,#e8eef7);stroke:var(--accent,#1f4e8c);stroke-width:1.6}
.tp-rt{font:600 13px ${FONT};fill:var(--accent,#1f4e8c)}
.tp-host{fill:var(--surface,#ffffff);stroke:var(--line-strong,#cfccc4);stroke-width:1.2}
.tp-t{font:500 11.5px ${FONT};fill:var(--fg,#1b1b1f)}
.tp-if{font:600 11px ${FONT};fill:var(--fg-2,#56565e)}
.tp-ip{font:600 11px ui-monospace,Menlo,monospace;fill:var(--c-board,#5b4bc4)}
.tp-net{font:600 11px ui-monospace,Menlo,monospace;fill:var(--c-warn,#b54708)}
</style>
${wires.join("\n")}
${boxes.join("\n")}
${labels.join("\n")}
</svg>`;
}

export const toStaticSvg = (svg) => svg.replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g, "$1");
