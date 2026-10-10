"use client";

import { useState } from "react";
import { TOPOLOGIES, topologyById, requirements, addressPlan, routingTables, walkPacket, hostNames, topologySvg } from "./addressing-logic.mjs";

type Topo = (typeof TOPOLOGIES)[number];
type Subnet = { i: number; subnetBits: string; network: string; first: string; last: string; broadcast: string; usage: string; net: { id: string } };
type Row = { key: string; device: string; iface: string; ip: string; mask: string; gateway: string; role: string; rule: string };
type Plan = { subnets: Subnet[]; rows: Row[]; unused: number; mask: string; prefix: number; plan: { subnets: number; hostsPerSubnet: number; subnet: (i: number) => Subnet } };
type Rt = { router: string; name: string; rows: { src: string; network: string; prefix: number; iface: string; nextHop: string; hops: number }[] };
type Seg = { from: string; to: string; l2: [string, string] | null; arp: string; kind: string };
type Walk = { sIp: string; dIp: string; same: boolean; segs: Seg[]; path: string[] };

const TABS = [
  { id: "subnets", label: "② 子网表" },
  { id: "table", label: "③ 编址表" },
  { id: "rt", label: "④ 路由表" },
  { id: "walk", label: "⑤ 走一个包" },
] as const;

// Topology addressing walkthrough: count networks → borrowed bits → subnet table → device table
// (router LAN interface = first usable) → routing tables → IP / MAC on every hop.
export function AddressingLab({ start = "a2" }: { start?: string }) {
  const [id, setId] = useState(start);
  const topo = topologyById(id) as Topo;
  const req = requirements(topo);
  const [borrow, setBorrow] = useState<number>(req.pick);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("table");
  const [showAddr, setShowAddr] = useState(true);
  const names = hostNames(topo) as string[];
  const [src, setSrc] = useState(topo.walk[0]);
  const [dst, setDst] = useState(topo.walk[1]);

  const b = req.options.includes(borrow) || req.allowed.includes(borrow) ? borrow : req.pick;
  const ap = addressPlan(topo, b) as Plan | null;
  const walk = ap && tab === "walk" ? (walkPacket(topo, ap, src, dst) as Walk | null) : null;
  const svg = topologySvg(topo, ap, { showAddr, highlight: walk?.path ?? [] });

  const load = (t: Topo) => {
    setId(t.id);
    setBorrow(requirements(t).pick);
    setSrc(t.walk[0]);
    setDst(t.walk[1]);
  };
  const netBits = req.netBits;
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 给拓扑编址（数网络 → 借位 → 子网表 → 编址表 → 路由表）</span>
      </div>
      <div className="lab-controls">
        {TOPOLOGIES.map((t) => (
          <button key={t.id} type="button" className={`lab-btn ${t.id === id ? "lab-btn-on" : ""}`} onClick={() => load(t)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="addr-q">
        <b>{topo.source}：</b>
        {topo.question}
      </p>

      <div className="addr-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      <label className="addr-toggle">
        <input type="checkbox" checked={showAddr} onChange={(e) => setShowAddr(e.target.checked)} /> 图上标地址（接口和主机旁写 host 部分，例如 .1；每个网络旁写它的子网）
      </label>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>① 数网络</th>
            <td>
              {req.lans} 个 LAN + {req.links} 条路由器之间的线 = <b>{req.subnetsDrawn}</b> 个网络
              {topo.needSubnets ? (
                <>
                  ；题目说最多要 <b>{topo.needSubnets}</b> 个子网 → 按 {req.subnetsNeeded} 算
                </>
              ) : null}
            </td>
          </tr>
          <tr>
            <th>每个子网要几个地址</th>
            <td>
              {topo.needHosts ? (
                <>
                  题目：每个子网最多要 <b>{topo.needHosts}</b> 个地址{topo.needNote ?? ""}
                </>
              ) : (
                <>
                  图里最大的 LAN：{req.hostsDrawn - 1} 台主机 + <b>1 个路由器接口</b> = <b>{req.hostsDrawn}</b> 个地址
                </>
              )}
            </td>
          </tr>
          <tr>
            <th>最少借几位</th>
            <td>
              Class {req.cls}（默认 /{netBits}，host {req.total} 位）：2^s ≥ {fmt(req.subnetsNeeded)} → s = <b>{req.minBorrow}</b>
            </td>
          </tr>
          <tr>
            <th>最多借几位</th>
            <td>
              2^h − 2 ≥ {fmt(req.hostsNeeded)} → h ≥ {req.minHostBits} → s ≤ {req.total} − {req.minHostBits} = <b>{req.maxBorrow}</b>
            </td>
          </tr>
          <tr>
            <th>选哪个</th>
            <td>
              {topo.mode === "given"
                ? `题目直接给了掩码 → 借 ${topo.givenBorrow} 位`
                : topo.mode === "max"
                  ? `题目要「每个子网主机最多」→ 借最少的 ${req.minBorrow} 位`
                  : `${req.minBorrow} – ${req.maxBorrow} 位都可以，下面点一个看结果`}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="lab-controls">
        {(req.allowed.length === 1 && topo.mode === "given" ? req.allowed : req.options).map((s: number) => {
          const ok = topo.mode !== "max" || s === req.minBorrow;
          return (
            <button key={s} type="button" disabled={!ok} className={`lab-btn ${s === b ? "lab-btn-on" : ""}`} onClick={() => setBorrow(s)}>
              借 {s} 位 · /{netBits + s} · {2 ** s} 个子网 × {fmt(2 ** (req.total - s) - 2)} 台
            </button>
          );
        })}
      </div>

      {ap && (
        <>
          <div className="lab-decision lab-forward">
            <b>
              掩码 {ap.mask}（/{ap.prefix}）：{fmt(ap.plan.subnets)} 个子网，每个 {fmt(ap.plan.hostsPerSubnet)} 个可用地址；用 {topo.nets.length} 个，剩 {fmt(ap.unused)} 个留作增长
            </b>
          </div>
          <div className="lab-controls">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={`lab-btn ${tab === t.id ? "lab-btn-on" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "subnets" && (
            <div className="table-wrap">
              <table className="lab-table">
                <thead>
                  <tr>
                    <th>Subnet #</th>
                    <th>Network address</th>
                    <th>Usable host range</th>
                    <th>Broadcast</th>
                    <th>Assigned usage</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ap.subnets, ...Array.from({ length: Math.min(ap.unused, Math.max(0, 8 - ap.subnets.length)) }, (_, k) => ({ ...ap.plan.subnet(ap.subnets.length + k), usage: "Reserved（未使用）" }))].map((s) => (
                    <tr key={s.i}>
                      <td>{s.i}</td>
                      <td>
                        <code>{s.network}</code>
                      </td>
                      <td>
                        {s.first} – {s.last}
                      </td>
                      <td>{s.broadcast}</td>
                      <td>{s.usage}</td>
                    </tr>
                  ))}
                  {ap.unused > Math.max(0, 8 - ap.subnets.length) && (
                    <tr>
                      <td colSpan={5}>… 还有 {fmt(ap.unused - Math.max(0, 8 - ap.subnets.length))} 个子网没用</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "table" && (
            <div className="table-wrap">
              <table className="lab-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Interface</th>
                    <th>IP Address</th>
                    <th>Subnet Mask</th>
                    <th>Default Gateway</th>
                    <th>为什么</th>
                  </tr>
                </thead>
                <tbody>
                  {ap.rows.map((r) => (
                    <tr key={r.key} className={r.role === "router-lan" ? "lab-hot" : ""}>
                      <td>{r.device}</td>
                      <td>{r.iface}</td>
                      <td>
                        <code>{r.ip}</code>
                      </td>
                      <td>{r.mask}</td>
                      <td>{r.gateway}</td>
                      <td className="addr-why">{r.rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="addr-note">黄色行 = 路由器的 LAN（以太网）接口：题目不会写「把第一个可用地址给路由器」，但这一行必须填，而且同一个 LAN 里主机的 Default Gateway 就是它。</p>
            </div>
          )}

          {tab === "rt" && (
            <div className="addr-rts">
              {(routingTables(topo, ap) as Rt[]).map((rt) => (
                <div key={rt.router} className="table-wrap">
                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th colSpan={5}>{rt.name} 的路由表</th>
                      </tr>
                      <tr>
                        <th>来源</th>
                        <th>Network</th>
                        <th>Interface</th>
                        <th>Next hop</th>
                        <th>Hop</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rt.rows.map((x) => (
                        <tr key={x.network}>
                          <td>{x.src === "C" ? "C 直连" : "R 学到"}</td>
                          <td>
                            <code>
                              {x.network}/{x.prefix}
                            </code>
                          </td>
                          <td>{x.iface}</td>
                          <td>{x.nextHop}</td>
                          <td>{x.hops}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <p className="addr-note">C 行 = Initial routing table（开机就有，只有直连网络）；R 行要靠 static route 或路由协议（RIP 数 hop）学来，Interface 写本路由器朝那个方向的出口，Next hop 写对面路由器在同一条线上的地址。</p>
            </div>
          )}

          {tab === "walk" && (
            <>
              <div className="lab-controls">
                <label className="flex items-center gap-1.5 text-[13px]">
                  从
                  <select className="lab-select" value={src} onChange={(e) => setSrc(e.target.value)} aria-label="source host">
                    {names.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-[13px]">
                  发给
                  <select className="lab-select" value={dst} onChange={(e) => setDst(e.target.value)} aria-label="destination host">
                    {names.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
              {walk ? (
                <div className="table-wrap">
                  <table className="lab-table">
                    <thead>
                      <tr>
                        <th>段</th>
                        <th>IP (S, D)</th>
                        <th>MAC (S, D)</th>
                        <th>发之前 ARP 谁</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walk.segs.map((s, i) => (
                        <tr key={i}>
                          <td>
                            {s.from} → {s.to}
                          </td>
                          <td>
                            <code>
                              ({walk.sIp}, {walk.dIp})
                            </code>
                          </td>
                          <td>{s.l2 ? <code>({s.l2.join(", ")})</code> : <span className="addr-why">串行线：PPP / HDLC 帧头，没有 MAC</span>}</td>
                          <td className="addr-why">{s.arp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="addr-note">IP (S, D) 一路不变；MAC (S, D) 每一跳都换成「这一段两端的接口」。主机发给别的网络时，目的 MAC 是默认网关的 MAC。</p>
                </div>
              ) : (
                <p className="addr-note">选两台不同的主机。</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
