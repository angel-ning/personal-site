"use client";

import { useState } from "react";
import { EIGRP_PRESETS, failover, ROLE_LABEL } from "./eigrp-logic.mjs";

type Path = { id: string; via: string; link: number; rd: number; up?: boolean };
type Row = Path & { total: number; role: keyof typeof ROLE_LABEL };
type State = { fd: number | null; successors: string[]; rows: Row[] };
type Result = { kind: string; before: State; after: State; steps: string[] };

const fresh = (i: number) => EIGRP_PRESETS[i].paths.map((p) => ({ ...p, up: true })) as Path[];

// Slides 9–15 + board p.2: each neighbor's RD + link cost → FD, successor, feasible successor;
// take links down to see an FS promoted at once, or the route go Active and query.
export function EigrpDualLab() {
  const [pi, setPi] = useState(0);
  const [paths, setPaths] = useState<Path[]>(fresh(0));
  const preset = EIGRP_PRESETS[pi];
  const res = failover(paths) as Result;
  const anyDown = paths.some((p) => p.up === false);
  const shown = anyDown ? res.after : res.before;
  const edit = (id: string, patch: Partial<Path>) => setPaths(paths.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const load = (i: number) => {
    setPi(i);
    setPaths(fresh(i));
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · EIGRP DUAL：FD / RD → Successor / Feasible Successor → 断线以后
        </span>
      </div>
      <div className="lab-controls">
        {EIGRP_PRESETS.map((p, i) => (
          <button key={p.id} type="button" className={`lab-btn ${i === pi ? "lab-btn-on" : ""}`} onClick={() => load(i)}>
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-fg-2">
        <b>
          {preset.router} 去 {preset.dest}
        </b>
        。{preset.note}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="lab-table" style={{ minWidth: "38em", whiteSpace: "nowrap" }}>
          <thead>
            <tr>
              <th>经过邻居</th>
              <th>到邻居的链路 cost</th>
              <th>RD（邻居报的）</th>
              <th>总距离</th>
              <th>角色</th>
              <th>链路</th>
            </tr>
          </thead>
          <tbody>
            {shown.rows.map((r) => (
              <tr key={r.id} className={r.role === "successor" ? "lab-hot" : ""}>
                <td>{r.via}</td>
                <td>
                  <input className="lab-select" style={{ width: "7em" }} type="number" min={1} value={r.link} onChange={(e) => edit(r.id, { link: Math.max(1, Number(e.target.value)) })} />
                </td>
                <td>
                  <input className="lab-select" style={{ width: "7em" }} type="number" min={0} value={r.rd} onChange={(e) => edit(r.id, { rd: Math.max(0, Number(e.target.value)) })} />
                </td>
                <td className="font-mono">
                  {r.link} + {r.rd} = <b>{r.total}</b>
                </td>
                <td>{ROLE_LABEL[r.role]}</td>
                <td>
                  <button type="button" className={`lab-btn ${r.up === false ? "lab-btn-on" : ""}`} onClick={() => edit(r.id, { up: r.up === false })}>
                    {r.up === false ? "down ✕" : "up"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lab-decision lab-forward">
        <b>
          全部 up 时：FD = {res.before.fd}，successor = {res.before.successors.map((id) => paths.find((p) => p.id === id)!.via).join("、")}
        </b>
        <span>
          Feasible successor 的条件：<b>RD &lt; FD（{res.before.fd}）</b>。
          {res.before.rows
            .filter((r) => r.role !== "successor")
            .map((r) => `${r.via}：RD ${r.rd} ${r.rd < (res.before.fd ?? 0) ? "<" : "≥"} ${res.before.fd} → ${r.rd < (res.before.fd ?? 0) ? "是 FS" : "不是 FS"}`)
            .join("；") || "没有其他邻居。"}
        </span>
      </div>

      {anyDown ? (
        <div className={`lab-decision ${res.kind === "active" || res.kind === "lost" ? "lab-flood" : "lab-forward"}`}>
          <b>
            {res.kind === "promote" ? "FS 直接升级，路由保持 Passive" : res.kind === "active" ? "没有 FS → 路由变成 Active，发 Query" : res.kind === "lost" ? "目的地不可达" : "路由表不受影响"}
          </b>
          <ol className="mt-1 list-decimal pl-5 text-[13px]">
            {res.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-fg-3">点某一行的 up 把那条链路断掉，看 DUAL 怎么处理。也可以改 cost 和 RD，看谁变成 successor / FS。</p>
      )}
      <p className="mt-2 text-[12px] text-fg-3">
        总距离 = 到邻居的链路 cost + 邻居报的 RD；最小的总距离就是 FD。一样小的可以同时当 successor（最多 4 条，Slide 14）。只有 successor 进路由表，FS 只留在 topology table（Slide 15）。
      </p>
    </div>
  );
}
