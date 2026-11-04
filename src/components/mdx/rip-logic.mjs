// RIP configuration (ISOM 5190 week 2): which interfaces a classful `network` command enables (slides 5–10,
// board p.2), what each router's table converges to with equal-cost paths (slide 11, board p.1),
// and picking between route sources by administrative distance (slides 12–14).
// Pure functions shared by rip-lab.tsx and the README export in scripts/lib/mdx-core.mjs.

import { ipToInt, maskBits, inNet } from "./routing-logic.mjs";

const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");

// ---------- classful networks (slide 7) ----------
export function classOf(ip) {
  const n = ipToInt(ip);
  if (n === null) return null;
  const a = n >>> 24;
  if (a < 128) return { cls: "A", prefix: 8 };
  if (a < 192) return { cls: "B", prefix: 16 };
  if (a < 224) return { cls: "C", prefix: 24 };
  return { cls: a < 240 ? "D" : "E", prefix: null };
}

export function classfulNet(ip) {
  const c = classOf(ip);
  if (!c || c.prefix === null) return null;
  return intToIp((ipToInt(ip) & maskBits(c.prefix)) >>> 0);
}

export const subnetOf = (ip, prefix) => intToIp((ipToInt(ip) & maskBits(prefix)) >>> 0);

// What IOS does with `network <x>`: only a classful number is accepted; a subnet or interface
// address is rewritten to its class A/B/C network ("RIP can't enter subnet", board p.2).
export function parseNetworkCmd(input) {
  const s = String(input).trim();
  const c = classOf(s);
  if (!c) return { ok: false, error: "不是合法的 IPv4 地址" };
  if (c.prefix === null) return { ok: false, error: `Class ${c.cls} 地址不能用在 network 命令里` };
  const net = classfulNet(s);
  return net === s
    ? { ok: true, net, cls: c.cls, note: `Class ${c.cls} 网络号，直接接受` }
    : { ok: true, net, cls: c.cls, note: `${s} 不是 classful 网络号——IOS 会把它改成 Class ${c.cls} 的 ${net}（network 命令不能写子网或接口地址）` };
}

// ---------- topologies ----------
// Each router: interfaces (name, ip, prefix, what's on the other side) and the network commands it starts with.
// `nonRip` routers (an ISP) have interfaces but run no RIP.
export const RIP_TOPOS = {
  slide9: {
    label: "Slide 9–10：R1 — R2（R2 漏了一条 network）",
    note: "Slide 9 的拓扑和配置原样照搬：R2 只写了 network 172.16.0.0。",
    routers: {
      R1: {
        ifaces: [
          { name: "Fa0/0", ip: "10.1.1.251", prefix: 24, peer: "LAN 10.0.0.0" },
          { name: "S0/0", ip: "172.16.4.251", prefix: 24, peer: "R2" },
        ],
        cmds: ["10.0.0.0", "172.16.0.0"],
      },
      R2: {
        ifaces: [
          { name: "S0/0", ip: "172.16.4.252", prefix: 24, peer: "R1" },
          { name: "Fa0/0", ip: "172.22.3.252", prefix: 24, peer: "LAN 172.22.0.0" },
        ],
        cmds: ["172.16.0.0"],
      },
    },
  },
  slide5: {
    label: "Slide 5：BHM — GAD — BOAZ",
    note: "Slide 5 的地址和配置原样照搬（两边以太网按 classful 掩码 /8、/16 算）。",
    routers: {
      BHM: {
        ifaces: [
          { name: "Fa0/0", ip: "10.0.0.254", prefix: 8, peer: "Ethernet" },
          { name: "S0/0", ip: "192.168.13.1", prefix: 24, peer: "GAD" },
        ],
        cmds: ["10.0.0.0", "192.168.13.0"],
      },
      GAD: {
        ifaces: [
          { name: "S0/1", ip: "192.168.13.2", prefix: 24, peer: "BHM" },
          { name: "S0/0", ip: "192.168.14.1", prefix: 24, peer: "BOAZ" },
        ],
        cmds: ["192.168.14.0", "192.168.13.0"],
      },
      BOAZ: {
        ifaces: [
          { name: "S0/0", ip: "192.168.14.2", prefix: 24, peer: "GAD" },
          { name: "Fa0/0", ip: "172.31.31.1", prefix: 16, peer: "Ethernet" },
        ],
        cmds: ["192.168.14.0", "172.31.0.0"],
      },
    },
  },
  board2a: {
    label: "板书 p.2 左：180.3.x.0 三个子网",
    note: "PC1–PC3 的三个子网来自板书；A–B 链路 180.3.4.0 和各接口地址 .1 / .2 是我设的。",
    routers: {
      A: {
        ifaces: [
          { name: "Fa0", ip: "180.3.1.1", prefix: 24, peer: "PC1" },
          { name: "Fa1", ip: "180.3.2.1", prefix: 24, peer: "PC2" },
          { name: "Fa2", ip: "180.3.3.1", prefix: 24, peer: "PC3" },
          { name: "S0", ip: "180.3.4.1", prefix: 24, peer: "B" },
        ],
        cmds: ["180.3.0.0"],
      },
      B: {
        ifaces: [
          { name: "S0", ip: "180.3.4.2", prefix: 24, peer: "A" },
          { name: "S1", ip: "200.1.1.2", prefix: 24, peer: "ISP" },
        ],
        cmds: ["180.3.0.0"],
      },
    },
  },
  board2b: {
    label: "板书 p.2 右：A 只写了 1.0、3.0、4.0",
    note: "网段和接口名来自板书；接口地址 .1 / .2 和 B 的三条 network 命令是我设的。C–G 当作挂在接口下面的网络。",
    routers: {
      A: {
        ifaces: [
          { name: "S0", ip: "192.168.1.1", prefix: 24, peer: "C" },
          { name: "S1", ip: "192.168.2.1", prefix: 24, peer: "D" },
          { name: "S2", ip: "192.168.3.1", prefix: 24, peer: "E" },
          { name: "S3", ip: "192.168.4.1", prefix: 24, peer: "B" },
        ],
        cmds: ["192.168.1.0", "192.168.3.0", "192.168.4.0"],
      },
      B: {
        ifaces: [
          { name: "S0", ip: "192.168.4.2", prefix: 24, peer: "A" },
          { name: "S1", ip: "192.168.5.1", prefix: 24, peer: "F" },
          { name: "S2", ip: "192.168.6.1", prefix: 24, peer: "G" },
        ],
        cmds: ["192.168.4.0", "192.168.5.0", "192.168.6.0"],
      },
    },
  },
  board1: {
    label: "板书 p.1：A 经 B / D / E / F 到 C（equal cost）",
    note: "拓扑来自板书；全部地址是我设的：10.0.1.0 = 板书的 1.0（PC2），A–X 链路 10.0.1X.0，X–C 链路 10.0.2X.0。ISP 不跑 RIP。",
    routers: {
      A: {
        ifaces: [
          { name: "Fa0", ip: "10.0.10.1", prefix: 24, peer: "PC1" },
          { name: "S0", ip: "10.0.11.1", prefix: 24, peer: "B" },
          { name: "S1", ip: "10.0.12.1", prefix: 24, peer: "D" },
          { name: "S2", ip: "10.0.13.1", prefix: 24, peer: "E" },
          { name: "S3", ip: "10.0.14.1", prefix: 24, peer: "F" },
        ],
        cmds: ["10.0.0.0"],
      },
      B: { ifaces: [{ name: "S0", ip: "10.0.11.2", prefix: 24, peer: "A" }, { name: "S1", ip: "10.0.21.1", prefix: 24, peer: "C" }], cmds: ["10.0.0.0"] },
      D: { ifaces: [{ name: "S0", ip: "10.0.12.2", prefix: 24, peer: "A" }, { name: "S1", ip: "10.0.22.1", prefix: 24, peer: "C" }], cmds: ["10.0.0.0"] },
      E: { ifaces: [{ name: "S0", ip: "10.0.13.2", prefix: 24, peer: "A" }, { name: "S1", ip: "10.0.23.1", prefix: 24, peer: "C" }], cmds: ["10.0.0.0"] },
      F: { ifaces: [{ name: "S0", ip: "10.0.14.2", prefix: 24, peer: "A" }, { name: "S1", ip: "10.0.24.1", prefix: 24, peer: "C" }], cmds: ["10.0.0.0"] },
      C: {
        ifaces: [
          { name: "S0", ip: "10.0.21.2", prefix: 24, peer: "B" },
          { name: "S1", ip: "10.0.22.2", prefix: 24, peer: "D" },
          { name: "S2", ip: "10.0.23.2", prefix: 24, peer: "E" },
          { name: "S3", ip: "10.0.24.2", prefix: 24, peer: "F" },
          { name: "Fa0", ip: "10.0.1.1", prefix: 24, peer: "PC2" },
          { name: "S4", ip: "200.1.1.1", prefix: 24, peer: "ISP" },
        ],
        cmds: ["10.0.0.0"],
      },
    },
  },
};

export const RIP_PRESETS = [
  { topo: "slide9", cmds: null, label: "Slide 9：R2 漏了 network 172.22.0.0" },
  { topo: "slide9", cmds: { R2: ["172.16.0.0", "172.22.0.0"] }, label: "Slide 9：R2 补上 172.22.0.0" },
  { topo: "slide5", cmds: null, label: "Slide 5：三台都配好" },
  { topo: "board2a", cmds: null, label: "板书 p.2 左：一条 180.3.0.0 全包" },
  { topo: "board2b", cmds: null, label: "板书 p.2 右：RT of B" },
  { topo: "board1", cmds: null, maxPaths: 4, label: "板书 p.1：A 的 equal cost" },
];

export const RIP_AD = 120;

// Interfaces of one router with whether RIP runs on them (slide 8: the network command
// matches the interface's classful network → send, listen, advertise).
export function ripInterfaces(topo, r, cmds) {
  return topo.routers[r].ifaces.map((i) => {
    const cf = classfulNet(i.ip);
    const on = !topo.routers[r].nonRip && (cmds[r] ?? []).includes(cf);
    return { ...i, subnet: subnetOf(i.ip, i.prefix), classful: cf, on };
  });
}

// Synchronous RIP rounds until nothing changes. Updates cross a link only when the interfaces
// at both ends run RIP (one sends, the other listens). Split horizon; metric = hops (+1 per hop);
// equal-cost next hops kept up to maxPaths (slide 3: default 4, up to 6).
/** @param {string} topoId @param {Record<string, string[]> | null} [cmdsOverride] @param {number} [maxPaths] */
export function ripRun(topoId, cmdsOverride = null, maxPaths = 4) {
  const topo = RIP_TOPOS[topoId];
  const names = Object.keys(topo.routers);
  const cmds = Object.fromEntries(names.map((r) => [r, cmdsOverride?.[r] ?? topo.routers[r].cmds]));
  const ifs = Object.fromEntries(names.map((r) => [r, ripInterfaces(topo, r, cmds)]));
  // neighbours: same subnet on another router
  const nbrs = Object.fromEntries(
    names.map((r) => [
      r,
      ifs[r].flatMap((i) =>
        names.filter((o) => o !== r).flatMap((o) => ifs[o].filter((j) => j.subnet === i.subnet).map((j) => ({ me: i, router: o, them: j }))),
      ),
    ]),
  );
  const connectedOf = (r) =>
    Object.fromEntries(ifs[r].map((i) => [i.subnet, { src: "C", net: i.subnet, prefix: i.prefix, metric: 0, hops: [], out: i.name, adv: i.on }]));
  let tables = Object.fromEntries(names.map((r) => [r, connectedOf(r)]));
  let rounds = 0;
  for (; rounds < 30; rounds++) {
    const next = {};
    for (const r of names) {
      const t = connectedOf(r);
      for (const { me, router: nb, them } of nbrs[r]) {
        if (!me.on || !them.on) continue;
        for (const e of Object.values(tables[nb])) {
          if (e.src === "C" && !e.adv) continue; // slide 8 action 3: only subnets on RIP interfaces are advertised
          if (e.src === "R" && e.hops.some((h) => h.out === them.name)) continue; // split horizon
          const metric = e.metric + 1;
          if (metric >= 16) continue;
          const hop = { ip: them.ip, router: nb, out: me.name };
          const cur = t[e.net];
          if (!cur || metric < cur.metric) t[e.net] = { src: "R", net: e.net, prefix: e.prefix, metric, hops: [hop], adv: true };
          else if (cur.src === "R" && metric === cur.metric && cur.hops.length < maxPaths && !cur.hops.some((h) => h.ip === hop.ip))
            cur.hops = [...cur.hops, hop];
        }
      }
      next[r] = t;
    }
    if (JSON.stringify(next) === JSON.stringify(tables)) break;
    tables = next;
  }
  const allNets = [...new Set(names.flatMap((r) => ifs[r].map((i) => i.subnet)))];
  const sorted = Object.fromEntries(
    names.map((r) => [r, Object.values(tables[r]).sort((a, b) => (a.src === b.src ? ipToInt(a.net) - ipToInt(b.net) : a.src === "C" ? -1 : 1))]),
  );
  // Which routers are missing a subnet that exists somewhere in the topology, and why.
  const missing = allNets
    .map((n) => {
      const routers = names.filter((r) => !tables[r][n]);
      if (!routers.length) return null;
      const why = names
        .filter((o) => ifs[o].some((i) => i.subnet === n))
        .map((o) => {
          const i = ifs[o].find((x) => x.subnet === n);
          return i.on
            ? `${o} 的 ${i.name} 跑着 RIP，但更新传不过来（路上有一段链路两端没同时启用 RIP）`
            : `${o} 的 ${i.name}（${i.ip}）不在 ${o} 的任何 network 命令里（需要 network ${i.classful}），${o} 不通告它`;
        })
        .join("；");
      return { routers, net: n, why };
    })
    .filter(Boolean);
  return { topo, cmds, ifs, tables: sorted, missing };
}

// `show ip route` style line.
export function showLine(e) {
  if (e.src === "C") return `C    ${e.net}/${e.prefix} is directly connected, ${e.out}`;
  return e.hops.map((h, k) => `${k === 0 ? `R    ${e.net}/${e.prefix}` : " ".repeat(5 + e.net.length + 1 + String(e.prefix).length)} [${RIP_AD}/${e.metric}] via ${h.ip}, ${h.out}`).join("\n");
}

// ---------- administrative distance (slides 12–14) ----------
export const AD_TABLE = [
  { id: "connected", label: "Connected interface", ad: 0, code: "C" },
  { id: "static", label: "Static route", ad: 1, code: "S" },
  { id: "eigrp-sum", label: "Enhanced IGRP summary route", ad: 5, code: "D" },
  { id: "ebgp", label: "External BGP", ad: 20, code: "B" },
  { id: "eigrp", label: "Internal Enhanced IGRP", ad: 90, code: "D" },
  { id: "igrp", label: "IGRP", ad: 100, code: "I" },
  { id: "ospf", label: "OSPF", ad: 110, code: "O" },
  { id: "isis", label: "IS-IS", ad: 115, code: "i" },
  { id: "rip", label: "RIP", ad: 120, code: "R" },
  { id: "eigrp-ext", label: "EIGRP external route", ad: 170, code: "D EX" },
  { id: "ibgp", label: "Internal BGP", ad: 200, code: "B" },
  { id: "unknown", label: "Unknown", ad: 255, code: "?" },
];
export const adOf = (src) => AD_TABLE.find((x) => x.id === src)?.ad ?? 255;
export const srcLabel = (src) => AD_TABLE.find((x) => x.id === src)?.label ?? src;

// Each candidate: { id, src, net, prefix, metric, via, ad? (override = floating static), up }
export const AD_PRESETS = [
  {
    label: "Slide 12：IGRP 经 B vs RIP 经 C",
    dest: "10.5.0.9",
    cands: [
      { id: "b", src: "igrp", net: "10.5.0.0", prefix: 16, metric: 8576, via: "Router B", up: true },
      { id: "c", src: "rip", net: "10.5.0.0", prefix: 16, metric: 2, via: "Router C", up: true },
    ],
  },
  {
    label: "OSPF cost 30 vs RIP 1 跳",
    dest: "10.5.0.9",
    cands: [
      { id: "o", src: "ospf", net: "10.5.0.0", prefix: 16, metric: 30, via: "Router B", up: true },
      { id: "r", src: "rip", net: "10.5.0.0", prefix: 16, metric: 1, via: "Router C", up: true },
    ],
  },
  {
    label: "静态路由 vs OSPF",
    dest: "10.5.0.9",
    cands: [
      { id: "s", src: "static", net: "10.5.0.0", prefix: 16, metric: 0, via: "Router C", up: true },
      { id: "o", src: "ospf", net: "10.5.0.0", prefix: 16, metric: 20, via: "Router B", up: true },
    ],
  },
  {
    label: "浮动静态路由当备份（AD 130）",
    dest: "10.5.0.9",
    cands: [
      { id: "r", src: "rip", net: "10.5.0.0", prefix: 16, metric: 2, via: "Router C", up: true },
      { id: "s", src: "static", net: "10.5.0.0", prefix: 16, metric: 0, via: "Router B", ad: 130, up: true },
    ],
  },
  {
    label: "备份接管：RIP 那条断了",
    dest: "10.5.0.9",
    cands: [
      { id: "r", src: "rip", net: "10.5.0.0", prefix: 16, metric: 2, via: "Router C", up: false },
      { id: "s", src: "static", net: "10.5.0.0", prefix: 16, metric: 0, via: "Router B", ad: 130, up: true },
    ],
  },
  {
    label: "最长前缀先于 AD",
    dest: "10.5.1.9",
    cands: [
      { id: "s", src: "static", net: "10.0.0.0", prefix: 8, metric: 0, via: "Router B", up: true },
      { id: "r", src: "rip", net: "10.5.1.0", prefix: 24, metric: 3, via: "Router C", up: true },
    ],
  },
];

// Pick the route for dest: drop unavailable / non-matching candidates, then longest prefix,
// then lowest AD (different sources' metrics can't be compared), then lowest metric; ties load-share.
export function chooseRoute(cands, dest) {
  if (ipToInt(dest) === null) return { ok: false, error: "不是合法的 IPv4 地址" };
  const rows = cands.map((c) => ({ ...c, ad: c.ad ?? adOf(c.src), match: inNet(dest, c.net, c.prefix) }));
  const steps = [];
  let pool = rows.filter((c) => c.up && c.match);
  const out = rows.filter((c) => !c.up || !c.match);
  if (out.length)
    steps.push(`先排除 ${out.map((c) => `${srcLabel(c.src)}（${c.via}）${!c.up ? "：链路断了，路由不在表里" : `：${c.net}/${c.prefix} 不包含 ${dest}`}`).join("；")}`);
  if (!pool.length) return { ok: true, rows, steps: [...steps, "没有任何可用的路由 → 丢弃"], winners: [] };
  const maxP = Math.max(...pool.map((c) => c.prefix));
  if (pool.some((c) => c.prefix !== maxP)) {
    steps.push(`① 最长前缀：/${maxP} 比 ${[...new Set(pool.filter((c) => c.prefix !== maxP).map((c) => `/${c.prefix}`))].join("、")} 更具体，先胜出（AD 只在同一个网段的几条路由之间比）`);
    pool = pool.filter((c) => c.prefix === maxP);
  }
  const minAd = Math.min(...pool.map((c) => c.ad));
  if (pool.some((c) => c.ad !== minAd)) {
    steps.push(`② Administrative distance：${pool.map((c) => `${srcLabel(c.src)} = ${c.ad}`).join("，")} → 选最小的 ${minAd}（越小越可信）；不同协议的 metric 不能直接比`);
    pool = pool.filter((c) => c.ad === minAd);
  }
  const minM = Math.min(...pool.map((c) => c.metric));
  if (pool.some((c) => c.metric !== minM)) {
    steps.push(`③ 同一来源再比 metric：选 ${minM}`);
    pool = pool.filter((c) => c.metric === minM);
  }
  steps.push(pool.length > 1 ? `剩下 ${pool.length} 条完全相同 → 等价负载分担 (equal-cost load sharing)` : `进路由表：${srcLabel(pool[0].src)} 经 ${pool[0].via}，[${pool[0].ad}/${pool[0].metric}]`);
  return { ok: true, rows, steps, winners: pool.map((c) => c.id) };
}
