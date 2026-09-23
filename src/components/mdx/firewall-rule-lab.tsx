"use client";

import { useState } from "react";
import rules from "./data/firewall-rules.json";
import { evaluate, PRESETS } from "./firewall-logic.mjs";

export function FirewallRuleLab() {
  const [srcIp, setSrcIp] = useState(PRESETS[0].srcIp);
  const [dstIp, setDstIp] = useState(PRESETS[0].dstIp);
  const [dstPort, setDstPort] = useState(PRESETS[0].dstPort);

  const result = evaluate(rules, { srcIp, dstIp, dstPort });

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setSrcIp(p.srcIp);
    setDstIp(p.dstIp);
    setDstPort(p.dstPort);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 逐条走一遍防火墙规则表</span>
      </div>

      <div className="lab-controls">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="lab-btn" onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          Source IP
          <input value={srcIp} onChange={(e) => setSrcIp(e.target.value)} spellCheck={false} className="lab-select w-[9em] px-2 py-1 text-[13px] font-mono" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          Dest IP
          <input value={dstIp} onChange={(e) => setDstIp(e.target.value)} spellCheck={false} className="lab-select w-[9em] px-2 py-1 text-[13px] font-mono" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          Dest Port
          <input
            type="number"
            value={dstPort}
            onChange={(e) => setDstPort(Number(e.target.value))}
            className="lab-select w-[6em] px-2 py-1 text-[13px] font-mono"
          />
        </label>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Src</th>
            <th>Dst</th>
            <th>Dst Port</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r, i) => (
            <tr key={i} className={result?.index === i ? "lab-hot" : ""}>
              <td className="font-mono">{i + 1}</td>
              <td className="font-mono">{r.src}</td>
              <td className="font-mono">{r.dst}</td>
              <td className="font-mono">{r.dstPort}</td>
              <td className="font-mono">{r.action === "allow" ? "Allow" : "Deny"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {result && (
        <p className={`lab-decision ${result.rule.action === "allow" ? "lab-forward" : "lab-flood"}`}>
          <b>
            匹配第 {result.index + 1} 条 → {result.rule.action === "allow" ? "✅ Allow" : "⛔ Deny"}
          </b>
          <span>{result.rule.note}</span>
        </p>
      )}
    </div>
  );
}
