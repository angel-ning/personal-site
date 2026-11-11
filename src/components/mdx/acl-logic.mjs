// Cisco IP ACLs (ISOM 5190 week 4): wildcard masks, parsing real `access-list` commands,
// first-match evaluation with the implicit deny, and a packet's walk through one or more
// routers (board p.2: de-encapsulate → inbound ACL → routing table → outbound ACL).
// Pure functions shared by acl-lab.tsx / wildcard-lab.tsx and the README export in scripts/lib/mdx-core.mjs.

// ---------- addresses and wildcard masks ----------

export function ipToInt(s) {
  const p = String(s).trim().split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const x of p) {
    if (!/^\d{1,3}$/.test(x) || Number(x) > 255) return null;
    n = n * 256 + Number(x);
  }
  return n;
}
export const intToIp = (n) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
export const octetBin = (n) => Number(n).toString(2).padStart(8, "0");
export const ipBin = (n) => intToIp(n).split(".").map(octetBin).join(" ");
const ALL = 2 ** 32 - 1;
// Bitwise helpers that stay unsigned (JS bit ops are signed 32-bit).
const and = (a, b) => (a & b) >>> 0;
const or = (a, b) => (a | b) >>> 0;
const not = (a) => ~a >>> 0;

export const prefixToMask = (p) => (p === 0 ? 0 : (ALL - (2 ** (32 - p) - 1)) >>> 0);
export const maskToWildcard = (mask) => ALL - mask;
export function maskToPrefix(mask) {
  for (let p = 0; p <= 32; p++) if (prefixToMask(p) === mask) return p;
  return null;
}

/** Does `ip` match `addr` + wildcard `wc`? (0 bit = must match, 1 bit = ignore) */
export const wcMatch = (addr, wc, ip) => and(ip, not(wc)) === and(addr, not(wc));

/** Bit-by-bit view (Slides 22–23): which bits are checked, and the first one that differs. */
export function wcCompare(addr, wc, ip) {
  const bits = [];
  let firstDiff = null;
  for (let i = 31; i >= 0; i--) {
    const w = Math.floor(wc / 2 ** i) % 2;
    const a = Math.floor(addr / 2 ** i) % 2;
    const b = Math.floor(ip / 2 ** i) % 2;
    const diff = w === 0 && a !== b;
    if (diff && firstDiff === null) firstDiff = 31 - i;
    bits.push({ w, a, b, check: w === 0, diff });
  }
  return { bits, match: firstDiff === null, firstDiff };
}

/** What an address/wildcard pair covers: count, whether it is one contiguous block, first / last. */
export function wcSummary(addr, wc) {
  let ones = 0;
  for (let i = 0; i < 32; i++) if (Math.floor(wc / 2 ** i) % 2) ones++;
  const contiguous = wc + 1 === 2 ** ones;
  const base = and(addr, not(wc));
  return { ones, count: 2 ** ones, contiguous, base, first: base, last: or(base, wc), normalized: base !== addr };
}

/** Smallest aligned block that holds first..last (board p.5 / Slide 24): address + wildcard, and whether it is exact. */
export function rangeToWildcard(first, last) {
  const lo = Math.min(first, last);
  const hi = Math.max(first, last);
  let ones = 0;
  while (ones < 32 && Math.floor(lo / 2 ** ones) !== Math.floor(hi / 2 ** ones)) ones++;
  const wc = 2 ** ones - 1;
  const base = and(lo, not(wc));
  return { addr: base, wc, exact: base === lo && or(base, wc) === hi, last: or(base, wc) };
}

// ---------- parsing access-list commands ----------

export const PORT_NAMES = { "ftp-data": 20, ftp: 21, ssh: 22, telnet: 23, smtp: 25, domain: 53, tftp: 69, www: 80, http: 80, pop3: 110, snmp: 161, rip: 520, https: 443 };
const portNo = (t) => (t in PORT_NAMES ? PORT_NAMES[t] : /^\d+$/.test(t) ? Number(t) : null);

/** ACL number → type (Slides 15, 18, 36). */
export function aclType(n) {
  if ((n >= 1 && n <= 99) || (n >= 1300 && n <= 1999)) return "standard";
  if ((n >= 100 && n <= 199) || (n >= 2000 && n <= 2699)) return "extended";
  if (n >= 600 && n <= 699) return "appletalk";
  if (n >= 800 && n <= 899) return "ipx";
  if (n >= 900 && n <= 999) return "extended-ipx";
  if (n >= 1000 && n <= 1099) return "ipx-sap";
  return null;
}
export const ACL_TYPE_LABEL = { standard: "Standard IP", extended: "Extended IP", appletalk: "AppleTalk", ipx: "IPX", "extended-ipx": "Extended IPX", "ipx-sap": "IPX SAP" };

// Address spec: any | host A | A [W]; for standard ACLs the wildcard may be omitted (→ 0.0.0.0, Slide 37).
function takeAddr(tok, i, optionalWc) {
  const t = tok[i];
  if (t === "any") return { spec: { addr: 0, wc: ALL, text: "any" }, next: i + 1 };
  if (t === "host") {
    const a = ipToInt(tok[i + 1]);
    if (a === null) return { error: `host 后面要跟一个 IP 地址` };
    return { spec: { addr: a, wc: 0, text: `host ${tok[i + 1]}` }, next: i + 2 };
  }
  const a = ipToInt(t);
  if (a === null) return { error: `「${t ?? "（空）"}」不是 IP 地址，也不是 any / host` };
  const w = ipToInt(tok[i + 1]);
  if (w !== null) return { spec: { addr: a, wc: w, text: `${t} ${tok[i + 1]}` }, next: i + 2 };
  if (!optionalWc) return { error: `Extended ACL 的地址后面要写通配符（或者用 host / any）` };
  return { spec: { addr: a, wc: 0, text: t }, next: i + 1, defaulted: true };
}

function takePort(tok, i) {
  const op = tok[i];
  if (!["eq", "neq", "gt", "lt", "range"].includes(op)) return { next: i };
  const a = portNo(tok[i + 1]);
  if (a === null) return { error: `${op} 后面要跟端口号或关键字（www、telnet、ftp…）` };
  if (op === "range") {
    const b = portNo(tok[i + 2]);
    if (b === null) return { error: `range 要两个端口号` };
    return { port: { op, a, b, text: `range ${tok[i + 1]} ${tok[i + 2]}` }, next: i + 3 };
  }
  return { port: { op, a, text: `${op} ${tok[i + 1]}` }, next: i + 2 };
}

/** Parse one `access-list …` line (the leading "access-list" and "Router(config)#" are optional). */
export function parseAclLine(raw) {
  const line = raw.replace(/^\s*\S*\(config\)#\s*/i, "").trim();
  if (!line) return null;
  const tok = line.toLowerCase().split(/\s+/);
  let i = tok[0] === "access-list" ? 1 : 0;
  const num = Number(tok[i]);
  if (!Number.isInteger(num)) return { raw, error: "缺 ACL 编号" };
  const type = aclType(num);
  i++;
  if (tok[i] === "remark") return { raw, num, type, remark: line.replace(/^.*?\bremark\s*/i, "") };
  const action = tok[i];
  if (action !== "permit" && action !== "deny") return { raw, num, type, error: "动作只能是 permit 或 deny" };
  i++;
  if (type === "standard") {
    const s = takeAddr(tok, i, true);
    if (s.error) return { raw, num, type, action, error: s.error };
    const rest = tok.slice(s.next).filter((t) => t !== "log");
    if (rest.length) return { raw, num, type, action, error: `Standard ACL 只能看源地址，多出来「${rest.join(" ")}」` };
    return { raw, num, type, action, proto: "ip", src: s.spec, dst: null, wcDefaulted: !!s.defaulted, log: tok.includes("log") };
  }
  if (type === "extended") {
    const proto = tok[i];
    if (!["ip", "tcp", "udp", "icmp"].includes(proto)) return { raw, num, type, action, error: "Extended ACL 要先写协议：ip / tcp / udp / icmp" };
    i++;
    const s = takeAddr(tok, i, false);
    if (s.error) return { raw, num, type, action, error: "源地址：" + s.error };
    const sp = takePort(tok, s.next);
    if (sp.error) return { raw, num, type, action, error: sp.error };
    const d = takeAddr(tok, sp.next, false);
    if (d.error) return { raw, num, type, action, error: "目的地址：" + d.error };
    const dp = takePort(tok, d.next);
    if (dp.error) return { raw, num, type, action, error: dp.error };
    if ((sp.port || dp.port) && proto !== "tcp" && proto !== "udp") return { raw, num, type, action, error: "只有 tcp / udp 有端口号（Slide 47）" };
    const rest = tok.slice(dp.next).filter((t) => t !== "log");
    if (rest.length) return { raw, num, type, action, error: `看不懂「${rest.join(" ")}」` };
    return { raw, num, type, action, proto, src: s.spec, sport: sp.port ?? null, dst: d.spec, dport: dp.port ?? null, log: tok.includes("log") };
  }
  return { raw, num, type, error: type ? `${ACL_TYPE_LABEL[type]} ACL，不是 IP ACL` : `${num} 不在任何 IP ACL 的编号范围` };
}

export function parseAcl(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("!") && !/^\(/.test(l))
    .map(parseAclLine)
    .filter(Boolean);
}

// ---------- evaluation ----------

const portOk = (p, n) => {
  if (!p) return true;
  if (n === null || n === undefined) return false;
  if (p.op === "eq") return n === p.a;
  if (p.op === "neq") return n !== p.a;
  if (p.op === "gt") return n > p.a;
  if (p.op === "lt") return n < p.a;
  return n >= p.a && n <= p.b;
};
const addrText = (spec, ip) => (spec.text === "any" ? "any ✓" : `${intToIp(ip)} vs ${spec.text}`);

/** Check one parsed line against a packet {src, dst, proto, sport, dport} (addresses as ints). */
export function checkLine(rule, pkt) {
  const checks = [];
  if (rule.proto !== "ip") checks.push({ what: "协议", ok: pkt.proto === rule.proto, detail: `${pkt.proto.toUpperCase()} vs ${rule.proto.toUpperCase()}` });
  checks.push({ what: "源 IP", ok: wcMatch(rule.src.addr, rule.src.wc, pkt.src), detail: addrText(rule.src, pkt.src) });
  if (rule.sport) checks.push({ what: "源端口", ok: portOk(rule.sport, pkt.sport), detail: `${pkt.sport ?? "—"} ${rule.sport.text}` });
  if (rule.dst) checks.push({ what: "目的 IP", ok: wcMatch(rule.dst.addr, rule.dst.wc, pkt.dst), detail: addrText(rule.dst, pkt.dst) });
  if (rule.dport) checks.push({ what: "目的端口", ok: portOk(rule.dport, pkt.dport), detail: `${pkt.dport ?? "—"} ${rule.dport.text}` });
  // Only the first failing check matters for the explanation; all must be true to match (Slide 41).
  return { checks, match: checks.every((c) => c.ok) };
}

/** First match wins; no match → implicit deny (Slides 16–17, 29, 34). */
export function evaluateAcl(rules, pkt) {
  const lines = rules.filter((r) => !r.error && !r.remark);
  const trace = [];
  for (let i = 0; i < lines.length; i++) {
    const c = checkLine(lines[i], pkt);
    trace.push({ rule: lines[i], ...c });
    if (c.match) return { action: lines[i].action, matched: i, trace, implicit: false };
  }
  return { action: "deny", matched: null, trace, implicit: true };
}

// ---------- packets through routers ----------

const inNet = (iface, ip) => iface.net && wcMatch(ipToInt(iface.net), maskToWildcard(prefixToMask(iface.prefix)), ip);

// Routing table of one router: its connected networks, plus a default toward the iface with `peer`/`cloud`.
export function routingTable(router) {
  const rows = router.ifaces.filter((f) => f.net).map((f) => ({ net: `${f.net}/${f.prefix}`, iface: f.name, how: "connected" }));
  const def = router.ifaces.find((f) => f.peer || f.cloud);
  if (def) rows.push({ net: "其他（默认）", iface: def.name, how: def.peer ? `经 ${def.peer}` : "去外部网络" });
  return rows;
}
const lookup = (router, ip) => router.ifaces.find((f) => inNet(f, ip)) ?? router.ifaces.find((f) => f.peer || f.cloud);
const ingressOf = (topo, ip) => {
  for (const r of topo.routers) {
    const f = r.ifaces.find((x) => inNet(x, ip));
    if (f) return { router: r, iface: f };
  }
  const r = topo.routers.find((x) => x.ifaces.some((f) => f.cloud));
  return r ? { router: r, iface: r.ifaces.find((f) => f.cloud) } : null;
};

/**
 * Walk a packet through the topology. `apply` = [{ router, iface, dir: "in"|"out" }] for the ACL `rules`.
 * Returns hops; each hop lists the board p.2 steps and the ACL result where one is applied.
 */
export function walkPacket(topo, rules, apply, pkt) {
  const start = ingressOf(topo, pkt.src);
  if (!start) return { verdict: "drop", hops: [], why: "源地址不在任何网段" };
  const hops = [];
  let cur = start.router;
  let inIf = start.iface;
  for (let guard = 0; guard < 6; guard++) {
    const hop = { router: cur.name, inIf: inIf.name, steps: [] };
    hops.push(hop);
    hop.steps.push({ step: 1, label: "De-encapsulation", text: `从 ${inIf.name} 收到帧，拆掉二层头，看 IP 头` });
    const inApp = apply.find((a) => a.router === cur.name && a.iface === inIf.name && a.dir === "in");
    if (inApp) {
      const r = evaluateAcl(rules, pkt);
      hop.steps.push({ step: 2, label: `Inbound ACL（${inIf.name} in）`, acl: r });
      if (r.action === "deny") return { verdict: "deny", where: `${cur.name} ${inIf.name} in`, hops, acl: r };
    } else hop.steps.push({ step: 2, label: "Inbound ACL", text: `${inIf.name} 没有入站 ACL → 放行` });
    const out = lookup(cur, pkt.dst);
    hop.outIf = out.name;
    hop.steps.push({ step: 3, label: "查路由表", text: `${intToIp(pkt.dst)} → ${out.net ? `${out.net}/${out.prefix} 直连` : out.peer ? `默认路由，经 ${out.peer}` : "外部网络"}，从 ${out.name} 出去` });
    if (out === inIf) return { verdict: "drop", hops, why: "出口和入口是同一个接口，这个包不需要经过路由器" };
    const outApp = apply.find((a) => a.router === cur.name && a.iface === out.name && a.dir === "out");
    if (outApp) {
      const r = evaluateAcl(rules, pkt);
      hop.steps.push({ step: 4, label: `Outbound ACL（${out.name} out）`, acl: r });
      if (r.action === "deny") return { verdict: "deny", where: `${cur.name} ${out.name} out`, hops, acl: r };
    } else hop.steps.push({ step: 4, label: "Outbound ACL", text: `${out.name} 没有出站 ACL → 放行` });
    if (!out.peer) return { verdict: "permit", hops, checked: hops.some((h) => h.steps.some((s) => s.acl)) };
    const next = topo.routers.find((r) => r.name === out.peer);
    cur = next;
    inIf = next.ifaces.find((f) => f.peer === hop.router);
  }
  return { verdict: "drop", hops, why: "环路" };
}

export function makePacket(p) {
  return { src: ipToInt(p.src), dst: ipToInt(p.dst), proto: p.proto ?? "ip", sport: p.sport ?? null, dport: p.dport ?? null };
}
export const packetText = (p) => `${p.src} → ${p.dst}${p.proto && p.proto !== "ip" ? ` ${p.proto.toUpperCase()}` : ""}${p.dport ? ` eq ${p.dport}` : ""}`;

// ---------- presets ----------

const SLIDE_TOPO = {
  label: "Slides 38–53 的路由器",
  routers: [
    {
      name: "R",
      ifaces: [
        { name: "E0", net: "172.16.3.0", prefix: 24 },
        { name: "E1", net: "172.16.4.0", prefix: 24 },
        { name: "S0", cloud: true, label: "Non-172.16.0.0" },
      ],
    },
  ],
};

// Board p.1: Percy (PC1) and Student (PC2) on router A; exam and email servers on router B.
// IP-1 … IP-4 are not given on the board; the addresses below are mine.
const BOARD_TOPO = {
  label: "板书 p.1（IP-1 到 IP-4 是我设的地址）",
  routers: [
    {
      name: "A",
      ifaces: [
        { name: "E0", net: "10.1.1.0", prefix: 24 },
        { name: "E1", net: "10.1.2.0", prefix: 24 },
        { name: "S0", peer: "B" },
      ],
    },
    {
      name: "B",
      ifaces: [
        { name: "E0", net: "10.1.3.0", prefix: 24 },
        { name: "E1", net: "10.1.4.0", prefix: 24 },
        { name: "S0", peer: "A" },
      ],
    },
  ],
};
const BOARD_HOSTS = { "10.1.1.10": "Percy PC1（IP-1）", "10.1.2.20": "Student PC2（IP-2）", "10.1.3.30": "Exam Server（IP-3）", "10.1.4.40": "Email Server（IP-4）" };
const BOARD_PACKETS = [
  { src: "10.1.2.20", dst: "10.1.3.30", label: "Student → Exam Server" },
  { src: "10.1.2.20", dst: "10.1.4.40", label: "Student → Email Server" },
  { src: "10.1.1.10", dst: "10.1.3.30", label: "Percy → Exam Server" },
  { src: "10.1.1.10", dst: "10.1.4.40", label: "Percy → Email Server" },
];

const BOARD6_PACKETS = [
  { src: "200.3.4.6", dst: "172.16.4.6", proto: "tcp", sport: 1050, dport: 21, label: "① 200.3.4.6 → 172.16.4.6 eq 21" },
  { src: "172.16.4.1", dst: "172.16.3.6", proto: "tcp", sport: 1051, dport: 22, label: "② 172.16.4.1 → 172.16.3.6 eq 22" },
  { src: "172.16.4.1", dst: "172.16.3.6", proto: "tcp", sport: 1052, dport: 21, label: "③ 172.16.4.1 → 172.16.3.6 eq 21" },
  { src: "200.3.4.6", dst: "172.16.3.6", proto: "tcp", sport: 1053, dport: 21, label: "④ 200.3.4.6 → 172.16.3.6 eq 21" },
  { src: "172.16.4.1", dst: "172.16.3.6", proto: "tcp", sport: 1054, dport: 23, label: "⑤ 172.16.4.1 → 172.16.3.6 eq 23" },
];
const BOARD3_PACKETS = [
  { src: "192.168.1.10", dst: "192.168.5.20", label: "① 192.168.1.10" },
  { src: "192.168.1.15", dst: "192.168.5.20", label: "② 192.168.1.15" },
  { src: "192.168.2.3", dst: "192.168.5.20", label: "③ 192.168.2.3" },
];
const SLIDE38_PACKETS = [
  { src: "172.16.4.13", dst: "172.16.3.20", label: "172.16.4.13（服务器）→ 172.16.3.0" },
  { src: "172.16.3.20", dst: "172.16.4.13", label: "172.16.3.20 → 服务器 172.16.4.13" },
  { src: "8.8.8.8", dst: "172.16.3.20", label: "外部 8.8.8.8 → 172.16.3.0" },
  { src: "8.8.8.8", dst: "172.16.4.13", label: "外部 8.8.8.8 → 服务器" },
];

export const ACL_PRESETS = [
  {
    id: "board3a",
    label: "板书 p.3 ⓐ：先 permit 主机",
    note: "板书只写了地址；按 Slide 13 的写法，192.168.1.0 这一行配 0.0.0.255（整个网段）。只看列表，不管接口。",
    acl: "access-list 50 permit 192.168.1.10\naccess-list 50 deny 192.168.1.0 0.0.0.255",
    topo: null,
    packets: BOARD3_PACKETS,
  },
  {
    id: "board3b",
    label: "板书 p.3 ⓑ：先 deny 网段",
    note: "同样两行，顺序反过来。对比 ⓐ：192.168.1.10 的结果变了。",
    acl: "access-list 50 deny 192.168.1.0 0.0.0.255\naccess-list 50 permit 192.168.1.10",
    topo: null,
    packets: BOARD3_PACKETS,
  },
  {
    id: "slide13",
    label: "Slide 13",
    note: "Slide 13 的三行（加了 permit any）。",
    acl: "access-list 50 permit 192.168.1.10\naccess-list 50 deny 192.168.1.0 0.0.0.255\naccess-list 50 permit any",
    topo: null,
    packets: BOARD3_PACKETS,
  },
  {
    id: "slide38",
    label: "Slide 38：只放 172.16 互通",
    note: "同一个 ACL 1 同时挂在 E0 out 和 E1 out。",
    acl: "access-list 1 permit 172.16.0.0 0.0.255.255",
    topo: SLIDE_TOPO,
    apply: [
      { router: "R", iface: "E0", dir: "out" },
      { router: "R", iface: "E1", dir: "out" },
    ],
    packets: SLIDE38_PACKETS,
  },
  {
    id: "slide39",
    label: "Slide 39：挡主机 A",
    note: "A = 172.16.4.13，Network X = 172.16.3.0（E0）。",
    acl: "access-list 1 deny 172.16.4.13 0.0.0.0\naccess-list 1 permit 0.0.0.0 255.255.255.255",
    topo: SLIDE_TOPO,
    apply: [{ router: "R", iface: "E0", dir: "out" }],
    packets: SLIDE38_PACKETS,
  },
  {
    id: "slide40",
    label: "Slide 40：挡整个 172.16.4.0",
    note: "",
    acl: "access-list 1 deny 172.16.4.0 0.0.0.255\naccess-list 1 permit any",
    topo: SLIDE_TOPO,
    apply: [{ router: "R", iface: "E0", dir: "out" }],
    packets: SLIDE38_PACKETS,
  },
  {
    id: "slide52",
    label: "Slide 52 + 板书 p.6 e.g.1",
    note: "挡 172.16.4.0 到 172.16.3.0 的 FTP（eq 21），4.0 的其他流量放行，其余全部隐式拒绝。",
    acl: "access-list 101 deny tcp 172.16.4.0 0.0.0.255 172.16.3.0 0.0.0.255 eq 21\naccess-list 101 permit ip 172.16.4.0 0.0.0.255 0.0.0.0 255.255.255.255",
    topo: SLIDE_TOPO,
    apply: [{ router: "R", iface: "E0", dir: "out" }],
    packets: BOARD6_PACKETS,
  },
  {
    id: "slide53",
    label: "Slide 53 + 板书 p.6 e.g.2",
    note: "只挡 172.16.4.0 出去的 Telnet（eq 23），其他全部放行。",
    acl: "access-list 101 deny tcp 172.16.4.0 0.0.0.255 any eq 23\naccess-list 101 permit ip any any",
    topo: SLIDE_TOPO,
    apply: [{ router: "R", iface: "E0", dir: "out" }],
    packets: BOARD6_PACKETS,
  },
  {
    id: "board1std",
    label: "板书 p.1：Standard，放 B E0 out",
    note: "目标：Student 不能访问 Exam Server，其他都可以。Standard 只能看源地址 → 放在离目的地最近的地方（Slide 55）。",
    acl: "access-list 10 deny host 10.1.2.20\naccess-list 10 permit any",
    topo: BOARD_TOPO,
    hosts: BOARD_HOSTS,
    apply: [{ router: "B", iface: "E0", dir: "out" }],
    packets: BOARD_PACKETS,
  },
  {
    id: "board1bad",
    label: "板书 p.1：Standard 放错 A E1 in",
    note: "同一个 standard ACL 放在离源最近的地方：Student 连 Email 也去不了（和 Slide 9 的问题一样）。",
    acl: "access-list 10 deny host 10.1.2.20\naccess-list 10 permit any",
    topo: BOARD_TOPO,
    hosts: BOARD_HOSTS,
    apply: [{ router: "A", iface: "E1", dir: "in" }],
    packets: BOARD_PACKETS,
  },
  {
    id: "board1ext",
    label: "板书 p.1：Extended，放 A E1 in",
    note: "Extended 能同时看源和目的 → 放在离源最近的地方，被拒的包一进 A 就丢，不占 serial 链路。",
    acl: "access-list 110 deny ip host 10.1.2.20 host 10.1.3.30\naccess-list 110 permit ip any any",
    topo: BOARD_TOPO,
    hosts: BOARD_HOSTS,
    apply: [{ router: "A", iface: "E1", dir: "in" }],
    packets: BOARD_PACKETS,
  },
];

/** Outcome of every preset packet (used by the lab's summary table and the README export). */
export function runPreset(preset, aclText = preset.acl, apply = preset.apply ?? []) {
  const rules = parseAcl(aclText);
  return preset.packets.map((p) => {
    const pkt = makePacket(p);
    if (!preset.topo) {
      const r = evaluateAcl(rules, pkt);
      return { p, verdict: r.action, line: r.matched, implicit: r.implicit, acl: r };
    }
    const w = walkPacket(preset.topo, rules, apply, pkt);
    const acl = w.acl ?? w.hops.flatMap((h) => h.steps).find((s) => s.acl)?.acl ?? null;
    return { p, verdict: w.verdict, where: w.where, checked: !!acl, line: acl?.matched ?? null, implicit: acl?.implicit ?? false, walk: w, acl };
  });
}

export const WILDCARD_PRESETS = {
  match: [
    { label: "Slide 22", addr: "172.16.2.0", wc: "0.0.0.255", ip: "172.16.1.1" },
    { label: "Slide 23", addr: "172.16.0.0", wc: "0.0.255.255", ip: "172.16.1.1" },
    { label: "Slide 24", addr: "172.30.16.0", wc: "0.0.15.255", ip: "172.30.27.9" },
    { label: "板书 p.4 ①", addr: "192.168.12.6", wc: "0.0.0.0", ip: "192.168.12.6" },
    { label: "板书 p.4 ②", addr: "192.168.12.0", wc: "0.0.0.255", ip: "192.168.12.77" },
    { label: "板书 p.4 ③", addr: "172.30.0.0", wc: "0.0.255.255", ip: "172.30.200.1" },
  ],
  mask: [
    { label: "Slide 25：/24", prefix: 24, net: "172.16.2.0" },
    { label: "Slide 26：/20", prefix: 20, net: "172.16.32.0" },
    { label: "板书 p.4 ③：/16", prefix: 16, net: "172.30.0.0" },
    { label: "/30 串口", prefix: 30, net: "10.1.0.0" },
  ],
  range: [
    { label: "Slide 24 + 板书 p.5", first: "172.30.16.0", last: "172.30.31.255" },
    { label: "Slide 26", first: "172.16.32.0", last: "172.16.47.255" },
    { label: "不对齐的范围", first: "172.30.10.0", last: "172.30.20.255" },
  ],
};
