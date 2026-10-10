"use client";

import { useState } from "react";
import { RA_FIELDS, RA_OPTIONS } from "./ra-logic.mjs";

type Opt = (typeof RA_OPTIONS)[number];

// Pick the RA option (1 SLAAC only · 2 SLAAC + stateless DHCPv6 · 3 stateful DHCPv6) and see the message
// sequence and where each piece of addressing information comes from.
export function RaOptionLab() {
  const [id, setId] = useState(1);
  const o = RA_OPTIONS.find((x) => x.id === id) as Opt;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · RA 的三个选项</span>
      </div>
      <div className="lab-controls">
        {RA_OPTIONS.map((x) => (
          <button key={x.id} type="button" className={`lab-btn ${id === x.id ? "lab-btn-on" : ""}`} onClick={() => setId(x.id)}>
            Option {x.id} · {x.name}
          </button>
        ))}
      </div>
      <p className="lab-decision lab-forward">
        <b>
          Option {o.id}：{o.zh} — {o.stateful}
        </b>
        <span>RA 原话：“{o.says}”</span>
      </p>
      <ol className="ra-steps">
        {o.steps.map((s) => (
          <li key={s.msg}>
            <b>{s.msg}</b>
            <span className="text-fg-3 text-[12.5px]">
              {s.from} → {s.to}
            </span>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      <table className="lab-table">
        <thead>
          <tr>
            <th>信息</th>
            <th>从哪里来</th>
          </tr>
        </thead>
        <tbody>
          {RA_FIELDS.map((f) => (
            <tr key={f.key}>
              <td>{f.label}</td>
              <td>
                <b>{o.source[f.key as keyof Opt["source"]]}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
