"use client";

import { useState } from "react";
import { TRUNK_PRESETS, TRUNK_MODES, TRUNK_PCS, VLAN_IDS, interSwitchLinks, sendTrunk } from "./vlan-logic.mjs";

type Vlans = Record<string, number>;
type Field = { k: string; v: string; tag?: boolean };
type Seg = { from: string; to: string; kind: string; link?: string; frame: Field[]; note: string };
type Res = { segs: Seg[]; reached: string[]; notes: string[]; links: { id: string; label: string; vlans: number[] }[]; vlan: number; ok: boolean };

export function FrameBox({ frame }: { frame: Field[] }) {
  return (
    <span className="vlan-frame">
      {frame.map((f, i) => (
        <span key={i} className={f.tag ? "vlan-tag" : ""}>
          {f.k}
          {f.v && <small className="ml-1 text-fg-3">{f.v}</small>}
        </span>
      ))}
    </span>
  );
}

// Board p.2 + Slides 11–17: two switches with PCs in several VLANs; connect them with one link per VLAN
// or a single trunk, and see the frame on each segment (untagged on access links, tagged on the trunk).
export function TrunkLab() {
  const [vlans, setVlans] = useState<Vlans>({ ...TRUNK_PRESETS[0].vlans });
  const [mode, setMode] = useState("access");
  const [src, setSrc] = useState("PC1");
  const [dst, setDst] = useState("PC5");
  const links = interSwitchLinks(vlans, mode) as Res["links"];
  const res = sendTrunk(vlans, mode, src, dst) as Res;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 两台交换机：每个 VLAN 一根线 vs 一根 trunk 打标签
        </span>
      </div>
      <div className="lab-controls">
        {TRUNK_MODES.map((m) => (
          <button key={m.id} type="button" className={`lab-btn ${mode === m.id ? "lab-btn-on" : ""}`} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        {TRUNK_PRESETS.map((p) => (
          <button key={p.id} type="button" className="lab-btn" onClick={() => setVlans({ ...p.vlans })}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="trunk-grid">
        {(["SW2", "links", "SW1"] as const).map((sw) =>
          sw === "links" ? (
            <div key={sw} className="text-center text-[12px]">
              {links.length ? (
                links.map((l) => (
                  <div key={l.id} className={`my-1 rounded px-2 py-1 font-mono ${l.id === "trunk" ? "vlan-tag" : `vlan-v${l.vlans[0]}`}`}>
                    ═ {l.label} ═
                  </div>
                ))
              ) : (
                <div className="text-fg-3">（不需要连线）</div>
              )}
              <div className="text-fg-3">{links.length} 根线</div>
            </div>
          ) : (
            <div key={sw} className="lab-port">
              <b>交换机 {sw === "SW2" ? "②" : "①"}</b>
              {TRUNK_PCS.filter((p) => p.sw === sw).map((p) => (
                <div key={p.id} className={`mt-1 flex items-center justify-between gap-1 rounded px-1 vlan-v${vlans[p.id]}`} style={{ outline: res.reached.includes(p.id) || p.id === src ? "2px solid var(--c-tip)" : "none", whiteSpace: "nowrap" }}>
                  <span className="text-[12px]">
                    {p.port} {p.id} <small className="font-mono text-fg-3">{p.mac}</small>
                  </span>
                  <select className="lab-select" value={vlans[p.id]} onChange={(e) => setVlans({ ...vlans, [p.id]: Number(e.target.value) })} aria-label={`${p.id} 的 VLAN`}>
                    {VLAN_IDS.map((v) => (
                      <option key={v} value={v}>
                        V{v}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ),
        )}
      </div>

      <div className="lab-controls">
        <label>
          从
          <select className="lab-select ml-1" value={src} onChange={(e) => setSrc(e.target.value)}>
            {TRUNK_PCS.map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
          </select>
        </label>
        <label>
          发给
          <select className="lab-select ml-1" value={dst} onChange={(e) => setDst(e.target.value)}>
            {TRUNK_PCS.filter((p) => p.id !== src).map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
            <option value="broadcast">广播</option>
          </select>
        </label>
      </div>

      <div className={`lab-decision ${res.ok ? "lab-forward" : "lab-flood"}`}>
        <b>{res.ok ? `VLAN ${res.vlan} 的帧送到：${res.reached.join("、") || "—"}` : "送不到"}</b>
        {res.notes.map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="lab-table" style={{ minWidth: "42em" }}>
          <thead>
            <tr>
              <th>一段</th>
              <th>线上的帧</th>
              <th>发生了什么</th>
            </tr>
          </thead>
          <tbody>
            {res.segs.map((s, i) => (
              <tr key={i} className={s.kind === "trunk" ? "lab-hot" : ""}>
                <td className="text-[12px]">
                  {s.from} → {s.to}
                  {s.link && <div className="text-fg-3">{s.link}</div>}
                </td>
                <td>
                  <FrameBox frame={s.frame} />
                </td>
                <td className="text-[12px]">{s.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-fg-3">
        每个 VLAN 一根线：VLAN 越多线越多、每台交换机占的端口越多。Trunk 只要一根线，但线上的帧必须带标签，对面的交换机才知道它属于哪个 VLAN（Slide 15）；出了 backbone 最后一台交换机把标签去掉（Slide 16），PC 收到的永远是普通帧。
      </p>
    </div>
  );
}
