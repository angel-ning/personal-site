"use client";

import { useState } from "react";
import { ALE_PRESETS, computeAle, fmtUsd } from "./bia-logic.mjs";

type Input = { av: number; efPct: number; aro: number; efAfterPct: number; aroAfter: number; acs: number };

// Lesson 6 p.13 dollar impact analysis, extended with the textbook cost-benefit formula.
export function AleCalculator() {
  const [preset, setPreset] = useState(ALE_PRESETS[0].id);
  const [input, setInput] = useState<Input>(ALE_PRESETS[0]);
  const r = computeAle(input) as ReturnType<typeof computeAle>;

  const pick = (id: string) => {
    const p = ALE_PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setInput(p);
  };

  const field = (label: string, key: keyof Input, step: number, suffix: string) => (
    <label className="flex items-center gap-1.5 text-[13px]">
      {label}
      <input
        type="number"
        step={step}
        min={0}
        value={input[key]}
        onChange={(e) => {
          setPreset("");
          setInput({ ...input, [key]: Math.max(0, Number(e.target.value)) });
        }}
        className="lab-select w-[7em] px-2 py-1 text-[13px]"
      />
      <span className="text-fg-3">{suffix}</span>
    </label>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · SLE / ALE / Cost-Benefit</span>
        <span className="text-[12px] text-fg-3">SLE = AV × EF · ALE = SLE × ARO</span>
      </div>

      <div className="lab-controls">
        {ALE_PRESETS.map((p) => (
          <button key={p.id} type="button" className={`lab-btn ${preset === p.id ? "lab-btn-on" : ""}`} onClick={() => pick(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <span className="text-[12px] font-semibold text-fg-3">控制前</span>
        {field("AV", "av", 10000, "US$")}
        {field("EF", "efPct", 5, "%")}
        {field("ARO", "aro", 0.05, "次/年")}
      </div>
      <div className="lab-controls">
        <span className="text-[12px] font-semibold text-fg-3">加控制后</span>
        {field("EF", "efAfterPct", 5, "%")}
        {field("ARO", "aroAfter", 0.05, "次/年")}
        {field("ACS", "acs", 10000, "US$/年")}
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>SLE = AV × EF</th>
            <td className="font-mono">
              {fmtUsd(input.av)} × {input.efPct}% = <b>{fmtUsd(r.sle)}</b>
            </td>
          </tr>
          <tr>
            <th>ALE（控制前）= SLE × ARO</th>
            <td className="font-mono">
              {fmtUsd(r.sle)} × {input.aro} = <b>{fmtUsd(r.ale)}</b>
            </td>
          </tr>
          <tr>
            <th>ALE（控制后）</th>
            <td className="font-mono">
              {fmtUsd(input.av)} × {input.efAfterPct}% × {input.aroAfter} = <b>{fmtUsd(r.aleAfter)}</b>
            </td>
          </tr>
          <tr>
            <th>CBA = ALE前 − ALE后 − ACS</th>
            <td className="font-mono">
              {fmtUsd(r.ale)} − {fmtUsd(r.aleAfter)} − {fmtUsd(input.acs)} = <b>{fmtUsd(r.cba)}</b>
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${r.worth ? "lab-forward" : "lab-flood"}`}>
        <b>{r.worth ? "CBA > 0：这笔控制在经济上划算" : "CBA ≤ 0：单看钱不划算"}</b>
        <span>
          {r.worth
            ? `每年少亏 ${fmtUsd(r.ale - r.aleAfter)}，比控制本身每年 ${fmtUsd(input.acs)} 的成本多出 ${fmtUsd(r.cba)}。`
            : `控制每年省下的预期损失（${fmtUsd(r.ale - r.aleAfter)}）不够付它的成本（${fmtUsd(input.acs)}）。但 ALE 只算「平均每年」：低频高损的事件（ARO 很小、SLE 很大）一旦发生可能超过 MTD、直接危及公司，这时要结合 BIA 和监管要求判断，不能只看这个数字。`}
        </span>
      </p>
    </div>
  );
}
