// VLANs and trunking (ISOM 5190 week 5). Board p.1: one switch, PCs split into VLANs, a router on two
// switch ports; the switch keeps one MAC table per VLAN (Slide 6), broadcasts stay inside a VLAN (Slide 9),
// and traffic between VLANs goes through the router (Slide 7). Board p.2: two switches, either one link per
// VLAN or one trunk that tags each frame (Slides 12–17).
// Pure functions shared by vlan-lab.tsx / trunk-lab.tsx and the README export in scripts/lib/mdx-core.mjs.

export const BCAST = "FFFF.FFFF.FFFF";
export const VLAN_IDS = [1, 2, 3];
// One subnet per VLAN (Slide 7); VLAN 3 deliberately has no router interface.
export const VLAN_NET = { 1: "192.168.1", 2: "192.168.2", 3: "192.168.3" };

// ---------- board p.1: one switch + router ----------

export const SWITCH_PCS = [
  { id: "PC1", port: "E0", mac: "MAC-1", n: 11 },
  { id: "PC2", port: "E1", mac: "MAC-2", n: 12 },
  { id: "PC3", port: "E2", mac: "MAC-3", n: 13 },
  { id: "PC4", port: "E3", mac: "MAC-4", n: 14 },
];
// Router R is cabled to E4 (its interface Fa0/0, MAC-5) and E5 (Fa0/1, MAC-6); each port sits in one VLAN.
export const ROUTER_PORTS = [
  { port: "E4", iface: "Fa0/0", mac: "MAC-5", vlan: 1 },
  { port: "E5", iface: "Fa0/1", mac: "MAC-6", vlan: 2 },
];
export const VLAN_PRESETS = [
  { id: "flat", label: "传统 LAN：全部 VLAN 1", vlans: { PC1: 1, PC2: 1, PC3: 1, PC4: 1 } },
  { id: "board", label: "板书 p.1：PC1、PC2 = VLAN 1；PC3、PC4 = VLAN 2", vlans: { PC1: 1, PC2: 1, PC3: 2, PC4: 2 } },
  { id: "v3", label: "PC4 放进 VLAN 3（没有路由器接口）", vlans: { PC1: 1, PC2: 1, PC3: 2, PC4: 3 } },
];

export const pcIp = (pc, vlan) => `${VLAN_NET[vlan]}.${pc.n}`;
export const gatewayIp = (vlan) => `${VLAN_NET[vlan]}.1`;

/** Every switch port with its VLAN and what is plugged in. */
export function switchPorts(vlans) {
  return [
    ...SWITCH_PCS.map((pc) => ({ port: pc.port, vlan: vlans[pc.id], who: pc.id, mac: pc.mac, ip: pcIp(pc, vlans[pc.id]) })),
    ...ROUTER_PORTS.map((r) => ({ port: r.port, vlan: r.vlan, who: `R ${r.iface}`, mac: r.mac, ip: gatewayIp(r.vlan) })),
  ];
}

export function routerTable() {
  return ROUTER_PORTS.map((r) => ({ net: `${VLAN_NET[r.vlan]}.0/24`, iface: r.iface, vlan: r.vlan }));
}

export const emptyState = () => ({ tables: { 1: [], 2: [], 3: [] }, arp: {} });

// The switch handles one frame: learn the source in this VLAN's table, then flood / forward / filter within the VLAN only.
function switchFrame(state, ports, f) {
  const vlan = ports.find((p) => p.port === f.inPort).vlan;
  const table = state.tables[vlan];
  const known = table.find((e) => e.mac === f.srcMac);
  const learned = known ? (known.port === f.inPort ? "refresh" : "move") : "new";
  state.tables[vlan] = known ? table.map((e) => (e.mac === f.srcMac ? { ...e, port: f.inPort } : e)) : [...table, { mac: f.srcMac, port: f.inPort }];
  const same = ports.filter((p) => p.vlan === vlan && p.port !== f.inPort);
  const others = ports.filter((p) => p.vlan !== vlan).map((p) => p.port);
  if (f.dstMac === BCAST) return { ...f, vlan, learned, decision: "flood", out: same.map((p) => p.port), notHeard: others };
  const hit = state.tables[vlan].find((e) => e.mac === f.dstMac);
  if (hit) return { ...f, vlan, learned, decision: hit.port === f.inPort ? "filter" : "forward", out: hit.port === f.inPort ? [] : [hit.port], notHeard: others };
  return { ...f, vlan, learned, decision: "flood", out: same.map((p) => p.port), notHeard: others };
}

/**
 * PC `srcId` sends to PC `dstId` (or "broadcast"). Returns the frames the switch sees, in order,
 * with ARP where the sender's cache is empty, plus the new state (MAC tables per VLAN, ARP caches).
 */
export function sendVlan(vlans, prev, srcId, dstId) {
  const state = { tables: { ...prev.tables }, arp: JSON.parse(JSON.stringify(prev.arp)) };
  const ports = switchPorts(vlans);
  const src = SWITCH_PCS.find((p) => p.id === srcId);
  const sv = vlans[src.id];
  const sIp = pcIp(src, sv);
  const frames = [];
  const push = (f) => frames.push(switchFrame(state, ports, f));
  const notes = [];

  if (dstId === "broadcast") {
    push({ label: `${src.id} 发广播`, inPort: src.port, srcMac: src.mac, dstMac: BCAST, ipS: sIp, ipD: `${VLAN_NET[sv]}.255` });
    return { frames, state, notes, result: "broadcast", vlan: sv };
  }
  const dst = SWITCH_PCS.find((p) => p.id === dstId);
  const dv = vlans[dst.id];
  const dIp = pcIp(dst, dv);
  const arpFor = (who, whoMac, whoPort, myIp, targetIp, target) => {
    state.arp[who] = state.arp[who] ?? {};
    if (state.arp[who][targetIp]) return;
    push({ label: `${who} ARP 请求：谁是 ${targetIp}？`, inPort: whoPort, srcMac: whoMac, dstMac: BCAST, ipS: myIp, ipD: targetIp, arp: true });
    push({ label: `${target.name} ARP 回复：${targetIp} 是 ${target.mac}`, inPort: target.port, srcMac: target.mac, dstMac: whoMac, ipS: targetIp, ipD: myIp, arp: true });
    state.arp[who][targetIp] = target.mac;
    state.arp[target.name] = { ...(state.arp[target.name] ?? {}), [myIp]: whoMac };
  };

  if (sv === dv) {
    notes.push(`${dIp} 和自己 ${sIp} 在同一个网段（同一个 VLAN ${sv}）→ 直接发给对方，不经过路由器。`);
    arpFor(src.id, src.mac, src.port, sIp, dIp, { name: dst.id, mac: dst.mac, port: dst.port });
    push({ label: `${src.id} → ${dst.id} 数据`, inPort: src.port, srcMac: src.mac, dstMac: dst.mac, ipS: sIp, ipD: dIp });
    return { frames, state, notes, result: "switched", vlan: sv };
  }

  const gw = ROUTER_PORTS.find((r) => r.vlan === sv);
  notes.push(`${dIp} 不在自己的网段 ${VLAN_NET[sv]}.0/24 → 要先交给默认网关（路由器）。`);
  if (!gw) {
    notes.push(`VLAN ${sv} 在路由器上没有接口，没有网关 → 这个包出不了 VLAN ${sv}。VLAN 之间只能靠路由器（Slide 5、7）。`);
    return { frames, state, notes, result: "isolated", vlan: sv };
  }
  arpFor(src.id, src.mac, src.port, sIp, gatewayIp(sv), { name: `R ${gw.iface}`, mac: gw.mac, port: gw.port });
  push({ label: `${src.id} → 网关 R ${gw.iface}（第 1 段）`, inPort: src.port, srcMac: src.mac, dstMac: gw.mac, ipS: sIp, ipD: dIp });
  const out = ROUTER_PORTS.find((r) => r.vlan === dv);
  if (!out) {
    notes.push(`路由器查路由表：${VLAN_NET[dv]}.0/24 没有对应的接口（VLAN ${dv} 没接到路由器）→ 丢弃。`);
    return { frames, state, notes, result: "noroute", vlan: sv };
  }
  notes.push(`路由器拆掉帧头，查路由表：${VLAN_NET[dv]}.0/24 → ${out.iface}（交换机 ${out.port}，VLAN ${dv}）。重新封装：MAC 换成 ${out.mac} → ${dst.mac}，IP 不变。`);
  arpFor(`R ${out.iface}`, out.mac, out.port, gatewayIp(dv), dIp, { name: dst.id, mac: dst.mac, port: dst.port });
  push({ label: `R ${out.iface} → ${dst.id}（第 2 段）`, inPort: out.port, srcMac: out.mac, dstMac: dst.mac, ipS: sIp, ipD: dIp });
  return { frames, state, notes, result: "routed", vlan: sv };
}

// ---------- board p.2: two switches, one link per VLAN vs a trunk ----------

export const TRUNK_PCS = [
  { id: "PC1", sw: "SW2", port: "F1", mac: "MAC-1" },
  { id: "PC2", sw: "SW2", port: "F2", mac: "MAC-2" },
  { id: "PC3", sw: "SW2", port: "F3", mac: "MAC-3" },
  { id: "PC4", sw: "SW2", port: "F4", mac: "MAC-4" },
  { id: "PC5", sw: "SW1", port: "F1", mac: "MAC-5" },
  { id: "PC6", sw: "SW1", port: "F2", mac: "MAC-6" },
  { id: "PC7", sw: "SW1", port: "F3", mac: "MAC-7" },
  { id: "PC8", sw: "SW1", port: "F4", mac: "MAC-8" },
];
export const TRUNK_PRESETS = [
  { id: "board", label: "两个 VLAN（每台交换机各一半）", vlans: { PC1: 1, PC2: 1, PC3: 2, PC4: 2, PC5: 1, PC6: 1, PC7: 2, PC8: 2 } },
  { id: "three", label: "三个 VLAN", vlans: { PC1: 1, PC2: 2, PC3: 3, PC4: 3, PC5: 1, PC6: 2, PC7: 2, PC8: 3 } },
];
export const TRUNK_MODES = [
  { id: "access", label: "每个 VLAN 一根线（板书 p.2 左）" },
  { id: "dot1q", label: "Trunk：802.1Q（板书 p.2 右）" },
  { id: "isl", label: "Trunk：ISL" },
];

/** Links needed between the two switches: one per VLAN that has members on both sides, or a single trunk. */
export function interSwitchLinks(vlans, mode) {
  const on = (sw) => new Set(TRUNK_PCS.filter((p) => p.sw === sw).map((p) => vlans[p.id]));
  const a = on("SW1");
  const b = on("SW2");
  const both = VLAN_IDS.filter((v) => a.has(v) && b.has(v));
  if (mode === "access") return both.map((v) => ({ id: `v${v}`, label: `VLAN ${v} 专线`, vlans: [v] }));
  return both.length ? [{ id: "trunk", label: mode === "isl" ? "Trunk（ISL）" : "Trunk（802.1Q）", vlans: both }] : [];
}

// The frame as it appears on one segment: untagged on access links, tagged on a trunk (Slides 15–17).
export function frameOn(segment, mode, vlan, srcMac, dstMac) {
  const base = [
    { k: "DA", v: dstMac },
    { k: "SA", v: srcMac },
  ];
  if (segment !== "trunk" || mode === "access") return [...base, { k: "Type", v: "0x0800" }, { k: "Data", v: "…" }, { k: "FCS", v: "" }];
  if (mode === "dot1q") return [...base, { k: "802.1Q", v: `VID ${vlan}`, tag: true }, { k: "Type", v: "0x0800" }, { k: "Data", v: "…" }, { k: "FCS*", v: "重算" }];
  return [{ k: "ISL 头", v: `26 B · VLAN ${vlan}`, tag: true }, ...base, { k: "Type", v: "0x0800" }, { k: "Data", v: "…" }, { k: "FCS", v: "" }, { k: "ISL CRC", v: "4 B", tag: true }];
}

/** Where a frame from `srcId` goes (unicast to `dstId` or "broadcast"), segment by segment. */
export function sendTrunk(vlans, mode, srcId, dstId) {
  const src = TRUNK_PCS.find((p) => p.id === srcId);
  const v = vlans[src.id];
  const other = src.sw === "SW1" ? "SW2" : "SW1";
  const links = interSwitchLinks(vlans, mode);
  const link = links.find((l) => l.vlans.includes(v));
  const dstMac = dstId === "broadcast" ? BCAST : TRUNK_PCS.find((p) => p.id === dstId).mac;
  const segs = [{ from: src.id, to: `${src.sw} ${src.port}`, kind: "access", frame: frameOn("access", mode, v, src.mac, dstMac), note: `${src.sw} 看进来的端口 ${src.port} → 这是 VLAN ${v} 的帧` }];
  const sameVlan = (sw) => TRUNK_PCS.filter((p) => p.sw === sw && p.id !== src.id && vlans[p.id] === v);
  const reached = [];
  const notes = [];

  if (dstId !== "broadcast") {
    const dst = TRUNK_PCS.find((p) => p.id === dstId);
    if (vlans[dst.id] !== v) {
      notes.push(`${dst.id} 在 VLAN ${vlans[dst.id]}，${src.id} 在 VLAN ${v}：不同 VLAN 在二层不通，交换机不会把帧送过去，要经过路由器（Slide 7）。这张图里没有路由器。`);
      return { segs, reached, notes, links, vlan: v, ok: false };
    }
    if (dst.sw === src.sw) {
      segs.push({ from: `${src.sw} ${dst.port}`, to: dst.id, kind: "access", frame: frameOn("access", mode, v, src.mac, dstMac), note: "同一台交换机、同一个 VLAN：直接转发，不经过交换机之间的链路" });
      return { segs, reached: [dst.id], notes, links, vlan: v, ok: true };
    }
  }
  if (dstId === "broadcast")
    for (const t of sameVlan(src.sw)) {
      segs.push({ from: `${src.sw} ${t.port}`, to: t.id, kind: "access", frame: frameOn("access", mode, v, src.mac, dstMac), note: `同一台交换机上 VLAN ${v} 的端口也收到广播` });
      reached.push(t.id);
    }
  const crossTargets = dstId === "broadcast" ? sameVlan(other) : TRUNK_PCS.filter((p) => p.id === dstId);
  if (crossTargets.length) {
    if (!link) {
      notes.push(`两台交换机之间没有能带 VLAN ${v} 的链路。`);
      return { segs, reached, notes, links, vlan: v, ok: reached.length > 0 };
    }
    const tagged = mode !== "access";
    segs.push({
      from: src.sw,
      to: other,
      kind: tagged ? "trunk" : "access",
      link: link.label,
      frame: frameOn(tagged ? "trunk" : "access", mode, v, src.mac, dstMac),
      note: tagged
        ? mode === "dot1q"
          ? `${src.sw} 在源 MAC 后面插入 4 字节的 802.1Q 标签（VLAN ID = ${v}），重算 FCS`
          : `${src.sw} 把整个帧包进 ISL：前面加 26 字节的 ISL 头（含 VLAN ${v}），后面加 4 字节 CRC`
        : `走 VLAN ${v} 专用的那根线；帧不用改，因为这根线只属于 VLAN ${v}`,
    });
    for (const t of crossTargets) {
      segs.push({
        from: `${other} ${t.port}`,
        to: t.id,
        kind: "access",
        frame: frameOn("access", mode, v, src.mac, dstMac),
        note: tagged ? `${other} 读标签 → VLAN ${v}，去掉标签，只送到 VLAN ${v} 的端口` : `${other} 从 VLAN ${v} 的端口收进来，送到 VLAN ${v} 的端口`,
      });
      reached.push(t.id);
    }
  }
  return { segs, reached, notes, links, vlan: v, ok: true };
}
