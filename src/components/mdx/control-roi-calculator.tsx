"use client";

import { useState } from "react";
import { computeControlRoi, ROI_PRESETS as PRESETS, fmtM, fmtPct } from "./control-roi-logic.mjs";

// Baseline vs residual expected loss, plus control cost → Expected Benefit / Net Benefit / ROI.
// This is the calculation behind "should we fund this control" (Week 4 p.9, p.13).
export function ControlRoiCalculator() {
  const [presetId, setPresetId] = useState("mfa-pam");
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [baseline, setBaseline] = useState(preset.baseline);
  const [residual, setResidual] = useState(preset.residual);
  const [cost, setCost] = useState(preset.cost);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    setPresetId(id);
    setBaseline(p.baseline);
    setResidual(p.residual);
    setCost(p.cost);
  };

  const { benefit, net, roi } = computeControlRoi({ baseline, residual, cost });
  const worthIt = net > 0;

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
        <span className="lab-kicker">Interactive · 控制措施的财务价值计算器</span>
        <span className="text-[12px] text-fg-3">Net Benefit = (Baseline − Residual) − Cost</span>
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
        {field("Baseline expected loss", baseline, setBaseline)}
        {field("Residual expected loss", residual, setResidual)}
        {field("Control lifecycle cost", cost, setCost)}
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>Expected Benefit</th>
            <td className="font-mono">
              {fmtM(baseline)} − {fmtM(residual)} = <b>{fmtM(benefit)}</b>
            </td>
          </tr>
          <tr>
            <th>Net Benefit</th>
            <td className="font-mono">
              {fmtM(benefit)} − {fmtM(cost)} = <b>{fmtM(net)}</b>
            </td>
          </tr>
          <tr>
            <th>ROI</th>
            <td className="font-mono">
              ({fmtM(benefit)} − {fmtM(cost)}) / {fmtM(cost)} = <b>{fmtPct(roi)}</b>
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${worthIt ? "lab-forward" : "lab-flood"}`}>
        <b>{worthIt ? "Net Benefit > 0 → 经济上值得投资" : "Net Benefit ≤ 0 → 这笔钱换来的风险降低不够多"}</b>
        <span>Cost-benefit 只是决策的一个输入，还要看实施可行性、监管要求、控制之间的依赖关系。</span>
      </p>
    </div>
  );
}
