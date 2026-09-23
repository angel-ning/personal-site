"use client";

import { useState } from "react";
import { computeFair, FAIR_PRESETS as PRESETS, fmtM } from "./fair-logic.mjs";

// Drag TEF / Vulnerability / Primary / Secondary and watch LEF, LM and annualized Risk update —
// the same arithmetic as the Week 3 ransomware case (pp.30-32), just editable.
export function FairCalculator({ initial = "ransomware" }: { initial?: string }) {
  const [presetId, setPresetId] = useState(initial);
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [tef, setTef] = useState(preset.tef);
  const [vuln, setVuln] = useState(preset.vuln);
  const [primary, setPrimary] = useState(preset.primary);
  const [secondary, setSecondary] = useState(preset.secondary);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    setPresetId(id);
    setTef(p.tef);
    setVuln(p.vuln);
    setPrimary(p.primary);
    setSecondary(p.secondary);
  };

  const { lef, lm, risk } = computeFair({ tef, vuln, primary, secondary });
  const currency = preset.currency ?? "US$";

  const field = (label: string, value: number, onChange: (v: number) => void, step: number, suffix: string) => (
    <label className="flex items-center gap-1.5 text-[13px]">
      {label}
      <input
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lab-select w-[5.5em] px-2 py-1 text-[13px]"
      />
      <span className="text-fg-3">{suffix}</span>
    </label>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · FAIR 定量风险计算器</span>
        <span className="text-[12px] text-fg-3">Risk = LEF × LM，LEF = TEF × Vulnerability</span>
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
        {field("TEF", tef, setTef, 0.1, "次/年")}
        {field("Vulnerability", vuln, setVuln, 1, "%")}
        {field("Primary loss", primary, setPrimary, 0.1, `${currency}M`)}
        {field("Secondary loss", secondary, setSecondary, 0.1, `${currency}M`)}
      </div>

      {preset.tefRange && (
        <p className="text-[12px] text-fg-3">
          Slide 给的 low / most-likely / high：TEF {preset.tefRange.join(" / ")}，Vulnerability {preset.vulnRange?.join("% / ")}%
        </p>
      )}

      <table className="lab-table">
        <tbody>
          <tr>
            <th>LEF = TEF × Vulnerability</th>
            <td className="font-mono">
              {tef} × {vuln}% = <b>{lef.toFixed(3)}</b> 次/年
            </td>
          </tr>
          <tr>
            <th>LM = Primary + Secondary</th>
            <td className="font-mono">
              {fmtM(primary, currency)} + {fmtM(secondary, currency)} = <b>{fmtM(lm, currency)}</b>
            </td>
          </tr>
          <tr>
            <th>Risk（年化预期损失）</th>
            <td className="font-mono">
              {lef.toFixed(3)} × {fmtM(lm, currency)} = <b>{fmtM(risk, currency)}</b>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
