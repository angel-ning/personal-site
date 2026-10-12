"use client";

import { useState } from "react";
import { COST_PRESETS, costBalance, fmtK } from "./cost-balance-logic.mjs";

type Row = { id: string; label: string; yearlyCost: number; downtimeH: number; disruption: number; total: number; meetsMtd: boolean };

// Lesson 6 p.14: pick the recovery option with the lowest total cost, as long as it still meets the MTD.
export function CostBalanceLab() {
  const [input, setInput] = useState(COST_PRESETS[0]);
  const r = costBalance(input);
  const rows = r.rows as Row[];
  const set = (k: "lossPerHour" | "aro" | "mtd", v: number) => setInput({ ...input, label: "自己填", [k]: v });

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 找 Cost Balance Point（p.14）
        </span>
      </div>
      <div className="lab-controls">
        {COST_PRESETS.map((p) => (
          <button key={p.label} type="button" className={`lab-btn ${input.label === p.label ? "lab-btn-on" : ""}`} onClick={() => setInput(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          每停 1 小时损失 $
          <input type="number" value={input.lossPerHour} onChange={(e) => set("lossPerHour", Number(e.target.value))} className="lab-select w-[7em] px-2 py-1 text-[13px]" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          每年出事次数（ARO）
          <input type="number" step={0.1} value={input.aro} onChange={(e) => set("aro", Number(e.target.value))} className="lab-select w-[5em] px-2 py-1 text-[13px]" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          MTD（小时）
          <input type="number" value={input.mtd} onChange={(e) => set("mtd", Number(e.target.value))} className="lab-select w-[5em] px-2 py-1 text-[13px]" />
        </label>
      </div>
      <div className="mt-2 overflow-x-auto">
        <table className="lab-table">
          <thead>
            <tr>
              <th>恢复方案</th>
              <th>停机</th>
              <th>恢复成本 / 年</th>
              <th>预期中断成本 / 年</th>
              <th>总成本</th>
              <th>满足 MTD？</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} className={x.id === r.bestId ? "lab-hot" : ""}>
                <td className="text-[12px]">{x.label}</td>
                <td className="font-mono">{x.downtimeH} h</td>
                <td className="font-mono">{fmtK(x.yearlyCost)}</td>
                <td className="font-mono">{fmtK(x.disruption)}</td>
                <td className="font-mono">
                  <b>{fmtK(x.total)}</b>
                  {x.id === r.cheapestId ? " ← 最低" : ""}
                </td>
                <td>{x.meetsMtd ? "✓" : "✗"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`lab-decision ${r.mtdForcesUpgrade ? "lab-flood" : "lab-forward"}`}>
        <b>{r.bestId ? `选：${rows.find((x) => x.id === r.bestId)!.label.split("（")[0]}` : "没有方案满足 MTD，要重新设计"}</b>
        <span>
          {r.mtdForcesUpgrade
            ? "总成本最低的方案停得太久、超过 MTD，只能多花钱选更快的——这就是「MTD 是硬上限」。"
            : "总成本最低的方案也满足 MTD，它就是平衡点。"}
          预期中断成本 = ARO × 停机小时 × 每小时损失。各方案的成本和停机时间是示意数字，不是课件给的。
        </span>
      </p>
    </div>
  );
}
