"use client";

import { useState } from "react";
import { computeInsurance, INSURANCE_PRESETS as PRESETS, fmtM } from "./insurance-logic.mjs";

// Retention, limit and exclusions decide how much of a loss the policy actually absorbs —
// the arithmetic behind Week 4 p.10's "insurance is a financial layer, not a substitute for risk analysis".
export function InsuranceCalculator() {
  const [presetId, setPresetId] = useState("ransomware");
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [grossCovered, setGrossCovered] = useState(preset.grossCovered);
  const [retention, setRetention] = useState(preset.retention);
  const [limit, setLimit] = useState(preset.limit);
  const [uncovered, setUncovered] = useState(preset.uncovered);
  const [premium, setPremium] = useState(preset.premium);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    setPresetId(id);
    setGrossCovered(p.grossCovered);
    setRetention(p.retention);
    setLimit(p.limit);
    setUncovered(p.uncovered);
    setPremium(p.premium);
  };

  const { recovery, netRetained } = computeInsurance({ grossCovered, retention, limit, uncovered, premium });

  const field = (label: string, value: number, onChange: (v: number) => void) => (
    <label className="flex items-center gap-1.5 text-[13px]">
      {label}
      <input
        type="number"
        step={0.1}
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lab-select w-[5.5em] px-2 py-1 text-[13px]"
      />
      <span className="text-fg-3">US$M</span>
    </label>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 保险净留存损失计算器</span>
        <span className="text-[12px] text-fg-3">Recovery = min(max(Loss − Retention, 0), Limit)</span>
      </div>

      <div className="lab-controls">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className={`rounded-full border px-2.5 py-0.5 text-[12px] ${presetId === p.id ? "border-accent text-accent" : "border-line text-fg-2 hover:border-line-strong"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="lab-controls">
        {field("Gross covered loss", grossCovered, setGrossCovered)}
        {field("Retention", retention, setRetention)}
        {field("Policy limit", limit, setLimit)}
        {field("Uncovered loss", uncovered, setUncovered)}
        {field("Premium", premium, setPremium)}
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>Insurance Recovery</th>
            <td className="font-mono">
              min(max({fmtM(grossCovered)} − {fmtM(retention)}, 0), {fmtM(limit)}) = <b>{fmtM(recovery)}</b>
            </td>
          </tr>
          <tr>
            <th>Net Retained Loss</th>
            <td className="font-mono">
              {fmtM(grossCovered)} − {fmtM(recovery)} + {fmtM(uncovered)} + {fmtM(premium)} = <b>{fmtM(netRetained)}</b>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="lab-decision lab-forward">
        <b>公司实际扛下来的钱 = Net Retained Loss，不是 Gross Covered Loss。</b>
        <span>保单永远盖不住 Uncovered Loss（除外责任）和 Premium（保费本身），Limit 以上的部分也要自己扛。</span>
      </p>
    </div>
  );
}
