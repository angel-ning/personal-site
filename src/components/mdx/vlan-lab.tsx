"use client";

import { useState } from "react";
import { VLAN_PRESETS, VLAN_IDS, SWITCH_PCS, BCAST, switchPorts, routerTable, emptyState, sendVlan } from "./vlan-logic.mjs";

type Vlans = Record<string, number>;
type Frame = { label: string; vlan: number; inPort: string; srcMac: string; dstMac: string; ipS: string; ipD: string; arp?: boolean; learned: string; decision: string; out: string[]; notHeard: string[] };
type State = { tables: Record<number, { mac: string; port: string }[]>; arp: Record<string, Record<string, string>> };
type Res = { frames: Frame[]; state: State; notes: string[]; result: string; vlan: number };

const RESULT: Record<string, string> = {
  broadcast: "广播只在本 VLAN 里泛洪",
  switched: "同一个 VLAN：交换机直接转发",
  routed: "不同 VLAN：经过路由器转发（inter-VLAN routing）",
  isolated: "出不去：这个 VLAN 没有网关",
  noroute: "路由器没有通往目的 VLAN 的接口",
};
const DECISION: Record<string, string> = { flood: "泛洪（只在本 VLAN）", forward: "转发", filter: "过滤" };

// Board p.1 + Slides 3–9: assign switch ports to VLANs, send frames, and watch one MAC table per VLAN,
// broadcasts that never leave their VLAN, and traffic between VLANs taking two trips through the router.
export function VlanLab({ preset = "board" }: { preset?: string }) {
  const start = VLAN_PRESETS.find((p) => p.id === preset) ?? VLAN_PRESETS[1];
  const [vlans, setVlans] = useState<Vlans>({ ...start.vlans });
  const [state, setState] = useState<State>(emptyState());
  const [src, setSrc] = useState("PC1");
  const [dst, setDst] = useState("PC3");
  const [last, setLast] = useState<Res | null>(null);

  const reset = (v: Vlans) => {
    setVlans(v);
    setState(emptyState());
    setLast(null);
  };
  const send = () => {
    const r = sendVlan(vlans, state, src, dst) as Res;
    setState(r.state);
    setLast(r);
  };
  const ports = switchPorts(vlans) as { port: string; vlan: number; who: string; mac: string; ip: string }[];
  const hit = new Set(last?.frames.flatMap((f) => [f.inPort, ...f.out]) ?? []);
  const used = VLAN_IDS.filter((v) => ports.some((p) => p.vlan === v));

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 一台交换机分成几个 VLAN：每个 VLAN 一张 MAC 表，跨 VLAN 走路由器
        </span>
      </div>
      <div className="lab-controls">
        {VLAN_PRESETS.map((p) => (
          <button key={p.id} type="button" className="lab-btn" onClick={() => reset({ ...p.vlans })}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="lab-ports" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {ports.map((p) => {
          const pc = SWITCH_PCS.find((x) => x.port === p.port);
          return (
            <div key={p.port} className={`lab-port vlan-v${p.vlan} ${hit.has(p.port) ? "lab-port-out" : ""}`}>
              <span>
                <b>{p.port}</b> · {p.who}
              </span>
              <small className="font-mono">
                {p.mac} · {p.ip}
              </small>
              {pc ? (
                <select className="lab-select mt-1" value={p.vlan} onChange={(e) => reset({ ...vlans, [pc.id]: Number(e.target.value) })} aria-label={`${p.port} 的 VLAN`}>
                  {VLAN_IDS.map((v) => (
                    <option key={v} value={v}>
                      VLAN {v}
                    </option>
                  ))}
                </select>
              ) : (
                <small>VLAN {p.vlan}（接路由器，固定）</small>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[12px] text-fg-3">改端口的 VLAN 会清空 MAC 表和 ARP 缓存；PC 的 IP 跟着 VLAN 走（每个 VLAN 一个网段，Slide 7）。</p>

      <div className="lab-controls">
        <label>
          从
          <select className="lab-select ml-1" value={src} onChange={(e) => setSrc(e.target.value)}>
            {SWITCH_PCS.map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
          </select>
        </label>
        <label>
          发给
          <select className="lab-select ml-1" value={dst} onChange={(e) => setDst(e.target.value)}>
            {SWITCH_PCS.filter((p) => p.id !== src).map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
            <option value="broadcast">广播（{BCAST}）</option>
          </select>
        </label>
        <button type="button" className="lab-btn lab-btn-on" onClick={send} disabled={dst === src}>
          发送
        </button>
        <button type="button" className="lab-btn" onClick={() => reset(vlans)}>
          清空 MAC 表
        </button>
      </div>

      {last && (
        <>
          <div className={`lab-decision ${last.result === "isolated" || last.result === "noroute" ? "lab-flood" : "lab-forward"}`}>
            <b>{RESULT[last.result]}</b>
            {last.notes.map((n, i) => (
              <span key={i}>{n}</span>
            ))}
          </div>
          {last.frames.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table className="lab-table" style={{ minWidth: "46em" }}>
                <thead>
                  <tr style={{ whiteSpace: "nowrap" }}>
                    <th>#</th>
                    <th>帧</th>
                    <th>VLAN</th>
                    <th>进口</th>
                    <th>MAC (S → D)</th>
                    <th>IP (S → D)</th>
                    <th>交换机</th>
                    <th>听不到的端口</th>
                  </tr>
                </thead>
                <tbody>
                  {last.frames.map((f, i) => (
                    <tr key={i} className={f.arp ? "" : "lab-hot"}>
                      <td>{i + 1}</td>
                      <td className="text-[12px]">{f.label}</td>
                      <td>{f.vlan}</td>
                      <td className="font-mono">{f.inPort}</td>
                      <td className="font-mono text-[12px]">
                        {f.srcMac} → {f.dstMac === BCAST ? "广播" : f.dstMac}
                      </td>
                      <td className="font-mono text-[12px]">
                        {f.ipS} → {f.ipD}
                      </td>
                      <td className="text-[12px]">
                        {DECISION[f.decision]} → {f.out.join("、") || "—"}
                      </td>
                      <td className="font-mono text-[12px]">{f.notHeard.join("、")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(11em, 1fr))" }}>
        {used.map((v) => (
          <div key={v}>
            <table className="lab-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th colSpan={2} className={`vlan-v${v}`}>
                    S.T. VLAN {v}
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.tables[v].length ? (
                  state.tables[v].map((e) => (
                    <tr key={e.mac}>
                      <td className="font-mono">{e.mac}</td>
                      <td className="font-mono">{e.port}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-fg-3">
                      （空）
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
        <div>
          <table className="lab-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>R.T. 网段</th>
                <th>接口</th>
              </tr>
            </thead>
            <tbody>
              {routerTable().map((r: { net: string; iface: string; vlan: number }) => (
                <tr key={r.iface}>
                  <td className="font-mono">{r.net}</td>
                  <td className="font-mono">
                    {r.iface}（VLAN {r.vlan}）
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-fg-3">
        S.T. = Switching Table（MAC 表），按板书的写法。交换机给每个 VLAN 单独一张表，学习和查找只在这个 VLAN 的表里做（Slide 6）。跨 VLAN 时 IP 地址从头到尾不变，MAC 地址每一段都换。
      </p>
    </div>
  );
}
