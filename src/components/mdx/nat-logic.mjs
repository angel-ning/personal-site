// Pure NAT / PAT logic for <NatLab /> (ISOM 5190 week 6, Module 6 Address Hiding and Perimeter Protection Using NAT and PAT).
// Static NAT (Slides 19–20), dynamic NAT with a pool (Slides 17–18) and PAT / overloading (Slides 21–24).
// The router keeps a translation table; outbound packets get their SOURCE rewritten (Slide 14),
// inbound packets get their DESTINATION rewritten back, and anything with no table entry is dropped.

export const NAT_MODES = [
  { id: "static", label: "Static NAT（一对一，固定）" },
  { id: "dynamic", label: "Dynamic NAT（地址池，先到先得）" },
  { id: "pat", label: "PAT / Overload（IP + 端口）" },
];

const range = (prefix, from, to) => Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);

/**
 * Presets. `statics` maps inside local → inside global for static NAT; when absent the i-th host maps to pool[i].
 * Board p.1 addresses are my assumption: the six networks are numbered 192.168.1.0 … 192.168.6.0 in order
 * (PC1/PC2 LAN, PC3/PC4 LAN, PC5/PC6 LAN, PC7/PC8 LAN, A–B, B–C), the router's LAN interface takes .1,
 * and router C's public side uses 200.1.1.1 (pool 200.1.1.1 – 200.1.1.3).
 */
export const NAT_PRESETS = [
  {
    id: "board",
    label: "板书 p.1：PC1–PC8 → PC100",
    source: "5190M06 supp p.1（地址是我的假设）",
    mode: "pat",
    hosts: [
      { id: "PC1", ip: "192.168.1.2", port: 49152 },
      { id: "PC2", ip: "192.168.1.3", port: 49152 },
      { id: "PC3", ip: "192.168.2.2", port: 49152 },
      { id: "PC4", ip: "192.168.2.3", port: 49153 },
      { id: "PC5", ip: "192.168.3.2", port: 49152 },
      { id: "PC6", ip: "192.168.3.3", port: 49152 },
      { id: "PC7", ip: "192.168.4.2", port: 49152 },
      { id: "PC8", ip: "192.168.4.3", port: 49152 },
    ],
    servers: [{ id: "PC100", ip: "200.3.4.6", port: 80 }],
    pool: ["200.1.1.1", "200.1.1.2", "200.1.1.3"],
  },
  {
    id: "s18",
    label: "Slide 18：Dynamic NAT",
    source: "Slide 18",
    mode: "dynamic",
    hosts: [
      { id: "10.1.1.1", ip: "10.1.1.1", port: 1024 },
      { id: "10.1.1.2", ip: "10.1.1.2", port: 1024 },
    ],
    servers: [{ id: "Server", ip: "170.1.1.1", port: 80 }],
    pool: range("200.1.1.", 1, 5),
  },
  {
    id: "s20",
    label: "Slide 20：Static NAT",
    source: "Slide 20（外部服务器地址是我补的）",
    mode: "static",
    hosts: [
      { id: "10.20.20.2", ip: "10.20.20.2", port: 1024 },
      { id: "10.20.20.3", ip: "10.20.20.3", port: 1024 },
      { id: "10.20.20.4", ip: "10.20.20.4", port: 1024 },
    ],
    servers: [{ id: "Server", ip: "170.1.1.1", port: 80 }],
    pool: ["209.165.200.227", "209.165.200.228", "209.165.200.229"],
  },
  {
    id: "s15",
    label: "Slide 15：内部 web server 对外",
    source: "Slide 15",
    mode: "static",
    hosts: [
      { id: "10.0.0.2", ip: "10.0.0.2", port: 1024 },
      { id: "10.0.0.10（web）", ip: "10.0.0.10", port: 80 },
    ],
    servers: [{ id: "外部用户", ip: "150.1.1.1", port: 49152 }],
    pool: ["179.9.8.80", "179.9.8.10"],
  },
  {
    id: "s22",
    label: "Slide 22：PAT 三台共用 200.1.1.2",
    source: "Slide 22",
    mode: "pat",
    hosts: [
      { id: "10.1.1.1", ip: "10.1.1.1", port: 1024 },
      { id: "10.1.1.2", ip: "10.1.1.2", port: 1024 },
      { id: "10.1.1.3", ip: "10.1.1.3", port: 1033 },
    ],
    servers: [{ id: "Server", ip: "170.1.1.1", port: 80 }],
    pool: ["200.1.1.2"],
  },
];

export const presetById = (id) => NAT_PRESETS.find((p) => p.id === id) ?? NAT_PRESETS[0];

/** Starting table: static NAT is configured in advance (Slide 19 "static map created"); dynamic / PAT start empty (Slide 18 "before first packet"). */
export function initTable(preset, mode) {
  if (mode !== "static") return [];
  return preset.hosts.slice(0, preset.pool.length).map((h, i) => ({ type: "static", local: h.ip, global: preset.pool[i], host: h.id }));
}

const PORT_FLOOR = 1024;

/**
 * PAT port choice on one public IP (Slide 24): keep the source port if nobody uses it on this IP;
 * otherwise take the first free port from 1024 upward. `cap` = how many translations one public IP
 * may hold (an illustrative limit so the "move to the second IP" and "drop" rules can be seen).
 */
function patPort(table, gip, sport, cap) {
  const used = new Set(table.filter((e) => e.type === "pat" && e.global === gip).map((e) => e.gport));
  if (used.size >= cap) return null;
  if (!used.has(sport)) return { port: sport, kept: true };
  for (let p = PORT_FLOOR; p <= 65535; p++) if (!used.has(p)) return { port: p, kept: false };
  return null;
}

/**
 * An inside host sends to an outside server. Returns the packet on the inside wire (`before`),
 * on the outside wire (`after`, or null when dropped), the new table, and plain-language notes.
 */
export function outbound(preset, mode, table, { hostId, sport, serverId, cap = Infinity }) {
  const h = preset.hosts.find((x) => x.id === hostId) ?? preset.hosts[0];
  const sv = preset.servers.find((x) => x.id === serverId) ?? preset.servers[0];
  const sp = Number(sport) || h.port;
  const before = { ip: [h.ip, sv.ip], port: [sp, sv.port] };
  const notes = [];
  let t = table;
  let entry = null;
  let reason = null;

  if (mode === "static") {
    entry = t.find((e) => e.type === "static" && e.local === h.ip) ?? null;
    if (entry) notes.push(`静态表里早就有 ${h.ip} ↔ ${entry.global}，直接换源地址（Slide 19：static map created）。`);
    else reason = `静态 NAT 只翻译配置过的地址，${h.ip} 没有映射 → 私有源地址原样出去，Internet 路由器会直接丢掉（Slide 3）。`;
  } else if (mode === "dynamic") {
    entry = t.find((e) => e.type === "dynamic" && e.local === h.ip) ?? null;
    if (entry) notes.push(`${h.ip} 已经有动态条目 ↔ ${entry.global}，沿用，直到超时（默认 24 小时没用）。`);
    else {
      const taken = new Set(t.filter((e) => e.type === "dynamic").map((e) => e.global));
      const free = preset.pool.find((g) => !taken.has(g));
      if (free) {
        entry = { type: "dynamic", local: h.ip, global: free, host: h.id };
        t = [...t, entry];
        notes.push(`${h.ip} 符合翻译条件、表里没有它 → 从地址池拿第一个空闲的 ${free}，写进 NAT 表（Slide 18 ②③）。`);
      } else reason = `地址池 ${preset.pool.length} 个公网地址都被占了 → 路由器直接丢包，用户只能等某个条目超时再试（Slide 17）。`;
    }
  } else {
    entry = t.find((e) => e.type === "pat" && e.local === h.ip && e.lport === sp) ?? null;
    if (entry) notes.push(`${h.ip}:${sp} 已经有条目 ↔ ${entry.global}:${entry.gport}，沿用。`);
    else {
      for (const [i, g] of preset.pool.entries()) {
        const pick = patPort(t, g, sp, cap);
        if (!pick) {
          notes.push(`${g} 上已经没有可用端口${i < preset.pool.length - 1 ? " → 换池子里的下一个 IP" : ""}（Slide 24）。`);
          continue;
        }
        entry = { type: "pat", local: h.ip, lport: sp, global: g, gport: pick.port, host: h.id };
        t = [...t, entry];
        notes.push(pick.kept ? `${g} 上端口 ${sp} 没人用 → 保留原来的源端口（Slide 24：PAT tries to preserve the source port）。` : `${g} 上端口 ${sp} 已被别的内部主机占用 → 找第一个空闲端口 ${pick.port}（Slide 24）。`);
        break;
      }
      if (!entry) reason = "所有公网 IP 的端口都用完了 → 丢包（Slide 24：If all IP addresses / ports used packet is dropped）。";
    }
  }

  if (!entry) return { ok: false, before, after: null, table: t, entry: null, notes: [...notes, reason], host: h, server: sv };
  const after = { ip: [entry.global, sv.ip], port: [entry.type === "pat" ? entry.gport : sp, sv.port] };
  notes.push(entry.type === "pat" ? "出去时改的是源 IP 和源端口；目的地址、目的端口不动。" : "出去时只改源 IP（Slide 14：NAT changes the source IP）；端口不动。");
  return { ok: true, before, after, table: t, entry, notes, host: h, server: sv };
}

/**
 * A packet arrives from outside addressed to `toIp:dport` (an inside global address).
 * The router looks it up in the table; a hit rewrites the DESTINATION back to the inside local address.
 */
export function inbound(preset, mode, table, { serverId, toIp, dport, sport = undefined }) {
  const sv = preset.servers.find((x) => x.id === serverId) ?? preset.servers[0];
  const sp = Number(sport) || sv.port;
  const dp = Number(dport);
  const before = { ip: [sv.ip, toIp], port: [sp, dp] };
  const hit = table.find((e) => e.global === toIp && (e.type !== "pat" || e.gport === dp)) ?? null;
  if (!hit) {
    const why =
      mode === "pat"
        ? `NAT 表里没有 ${toIp}:${dp} 这一项 → 路由器不知道该交给内部哪台主机，丢弃。外面的人不能主动连进来——这就是「地址隐藏」。`
        : `NAT 表里没有 ${toIp} 这一项 → 丢弃。动态 NAT 只有内部先发过包才有条目，外面不能主动连进来。`;
    return { ok: false, before, after: null, entry: null, notes: [why] };
  }
  const after = { ip: [sv.ip, hit.local], port: [sp, hit.type === "pat" ? hit.lport : dp] };
  const notes = [
    hit.type === "pat"
      ? `查表：${toIp}:${dp} ↔ ${hit.local}:${hit.lport} → 把目的 IP 和目的端口换回去。`
      : `查表：${toIp} ↔ ${hit.local} → 把目的 IP 换回内部地址，源地址不动。`,
  ];
  if (hit.type === "static") notes.push("静态映射永远在表里，所以外面可以主动访问这台内部主机（Slide 19：适合要从 Internet 访问的服务器）。");
  return { ok: true, before, after, entry: hit, notes };
}

/** The reply to a successful outbound packet: swap every (S, D) pair of the outside-wire packet. */
export function replyTo(preset, mode, table, out) {
  return inbound(preset, mode, table, { serverId: out.server.id, toIp: out.after.ip[0], dport: out.after.port[0], sport: out.after.port[1] });
}

/** Dynamic and PAT entries time out after a period of no use (Slide 17: default 24 hours); static entries stay. */
export const expire = (table) => table.filter((e) => e.type === "static");

/** How many inside hosts can be online at the same time (Slide 23 last bullet). */
export function capacity(preset, mode) {
  if (mode === "static") return { n: Math.min(preset.pool.length, preset.hosts.length), why: "一对一：每个公网地址固定给一台内部主机，不省地址（Slide 19：No conservation of IP addresses）" };
  if (mode === "dynamic") return { n: preset.pool.length, why: "同时上网的主机数 = 地址池里公网地址的个数（Slide 23：without PAT, NAT can concurrently support only the number of hosts defined in the NAT pool）" };
  return { n: Infinity, why: "每个公网 IP 用端口区分，理论上一个 IP 可以有几万个会话（板书：one public → 4,000 private）" };
}

export const fmtPair = (p) => `(${p[0]}, ${p[1]})`;
export const entryLocal = (e) => (e.type === "pat" ? `${e.local}:${e.lport}` : e.local);
export const entryGlobal = (e) => (e.type === "pat" ? `${e.global}:${e.gport}` : e.global);

/** Scripted runs used for the printable version (and the lab's "播放" buttons). Each step is out / reply / in / expire. */
export const NAT_SCRIPTS = [
  {
    preset: "board",
    mode: "static",
    title: "板书 p.1 用 Static NAT：PC1 → PC100，再 PC100 → PC1",
    steps: [
      { op: "out", hostId: "PC1", serverId: "PC100" },
      { op: "reply" },
    ],
  },
  {
    preset: "board",
    mode: "dynamic",
    title: "板书 p.1 用 Dynamic NAT（池子 3 个地址）：四台 PC 同时上网",
    steps: [
      { op: "out", hostId: "PC1", serverId: "PC100" },
      { op: "out", hostId: "PC3", serverId: "PC100" },
      { op: "out", hostId: "PC5", serverId: "PC100" },
      { op: "out", hostId: "PC7", serverId: "PC100" },
    ],
  },
  {
    preset: "board",
    mode: "pat",
    title: "板书 p.1 用 PAT（一个公网 IP 200.1.1.1）：同样四台 PC 都能上网",
    pool: ["200.1.1.1"],
    steps: [
      { op: "out", hostId: "PC1", serverId: "PC100" },
      { op: "out", hostId: "PC3", serverId: "PC100" },
      { op: "out", hostId: "PC5", serverId: "PC100" },
      { op: "out", hostId: "PC7", serverId: "PC100" },
      { op: "reply" },
      { op: "in", toIp: "200.1.1.1", dport: 3389 },
    ],
  },
  {
    preset: "s22",
    mode: "pat",
    title: "Slide 22：三台主机共用 200.1.1.2",
    steps: [
      { op: "out", hostId: "10.1.1.1", serverId: "Server" },
      { op: "out", hostId: "10.1.1.2", serverId: "Server" },
      { op: "out", hostId: "10.1.1.3", serverId: "Server" },
    ],
  },
  {
    preset: "s15",
    mode: "static",
    title: "Slide 15：外部用户访问 http://179.9.8.10",
    steps: [{ op: "in", serverId: "外部用户", toIp: "179.9.8.10", dport: 80 }],
  },
];

/** Run a script from scratch; returns one row per step for tables. */
export function runScript(script, cap = Infinity) {
  const base = presetById(script.preset);
  const preset = script.pool ? { ...base, pool: script.pool } : base;
  let table = initTable(preset, script.mode);
  let lastOut = null;
  const rows = [];
  for (const s of script.steps) {
    if (s.op === "expire") {
      table = expire(table);
      rows.push({ label: "超时", ok: true, before: null, after: null, notes: ["动态条目超时被清掉"] });
      continue;
    }
    if (s.op === "out") {
      const h = preset.hosts.find((x) => x.id === s.hostId);
      const r = outbound(preset, script.mode, table, { hostId: s.hostId, sport: s.sport ?? h.port, serverId: s.serverId, cap });
      table = r.table;
      if (r.ok) lastOut = r;
      rows.push({ label: `${r.host.id} → ${r.server.id}`, ...r });
      continue;
    }
    const r = s.op === "reply" && lastOut ? replyTo(preset, script.mode, table, lastOut) : inbound(preset, script.mode, table, { serverId: s.serverId ?? preset.servers[0].id, toIp: s.toIp, dport: s.dport });
    const who = s.op === "reply" && lastOut ? `${lastOut.server.id} → ${lastOut.host.id}（回包）` : `${s.serverId ?? preset.servers[0].id} 主动连 ${s.toIp}:${s.dport}`;
    rows.push({ label: who, ...r });
  }
  return { preset, rows, table };
}
