"use client";

import { useState } from "react";
import { TLS_STEPS } from "./tls-logic.mjs";

// Step through the HTTPS handshake (slide 17 / PKI p.23): which crypto tool each step uses and why.
export function TlsLab() {
  const [i, setI] = useState(0);
  const s = TLS_STEPS[i];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 一步步走 HTTPS 握手
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          {i + 1} / {TLS_STEPS.length}
        </span>
      </div>
      <div className="lab-controls">
        {TLS_STEPS.map((x, j) => (
          <button key={x.id} type="button" className={`lab-btn ${i === j ? "lab-btn-on" : ""}`} onClick={() => setI(j)}>
            {x.title.slice(0, 1)}
          </button>
        ))}
        <button type="button" className="lab-btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          上一步
        </button>
        <button type="button" className="lab-btn" disabled={i === TLS_STEPS.length - 1} onClick={() => setI(i + 1)}>
          下一步
        </button>
      </div>
      <table className="lab-table">
        <tbody>
          <tr>
            <th>步骤</th>
            <td>
              <b>{s.title}</b>（{s.who}）
            </td>
          </tr>
          <tr className="lab-hot">
            <th>用了什么</th>
            <td>{s.tool}</td>
          </tr>
          <tr>
            <th>发生了什么</th>
            <td>{s.what}</td>
          </tr>
          <tr>
            <th>解决了什么</th>
            <td>{s.solves}</td>
          </tr>
          <tr>
            <th>窃听者看到</th>
            <td>{s.sees}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
