"use client";

import { Fragment, useState } from "react";
import { computeRisk, DEFAULT_INPUT, heatLabelFor, IMPACT_LABELS, LIKELIHOOD_LABELS } from "./risk-logic.mjs";

const HEAT_COLOR: Record<string, string> = {
  Low: "var(--c-tip)",
  Medium: "var(--c-warn)",
  High: "var(--c-exam)",
  Critical: "var(--c-board)",
};

export function RiskAssessmentLab() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const r = computeRisk(input) as ReturnType<typeof computeRisk>;

  const field = (label: string, key: keyof typeof input, step: number, suffix: string) => (
    <label className="flex items-center gap-1.5 text-[13px]">
      {label}
      <input
        type="number"
        step={step}
        min={0}
        value={input[key]}
        onChange={(e) => setInput({ ...input, [key]: Number(e.target.value) })}
        className="lab-select w-[5.5em] px-2 py-1 text-[13px]"
      />
      <span className="text-fg-3">{suffix}</span>
    </label>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 定量风险评估 &amp; Heat Map</span>
        <span className="text-[12px] text-fg-3">Risk = Loss Frequency × Loss Magnitude</span>
      </div>

      <div className="lab-controls">
        {field("Asset Value", "assetValue", 10, "US$")}
        {field("Attack Likelihood", "attackLikelihoodPct", 5, "%")}
        {field("Attack Success Prob.", "successProbPct", 5, "%")}
      </div>
      <div className="lab-controls">
        {field("Probable Loss", "probableLossPct", 5, "%")}
        {field("Uncertainty", "uncertaintyPct", 5, "%")}
        {field("Risk Appetite", "riskAppetite", 1, "US$")}
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>Loss Frequency = Likelihood × Success Prob.</th>
            <td className="font-mono">
              {input.attackLikelihoodPct}% × {input.successProbPct}% = <b>{r.lossFrequencyPct.toFixed(1)}%</b>
            </td>
          </tr>
          <tr>
            <th>Loss Magnitude = Asset Value × Probable Loss</th>
            <td className="font-mono">
              {input.assetValue} × {input.probableLossPct}% = <b>{r.lossMagnitude.toFixed(1)}</b>
            </td>
          </tr>
          <tr>
            <th>Calculated Risk（± Uncertainty）</th>
            <td className="font-mono">
              {r.lossFrequencyPct.toFixed(1)}% × {r.lossMagnitude.toFixed(1)} = {r.calculatedRisk.toFixed(1)} ± {input.uncertaintyPct}% → <b>{r.rangeLow.toFixed(1)} ~ {r.rangeHigh.toFixed(1)}</b>
            </td>
          </tr>
          <tr>
            <th>Heat Map 定位</th>
            <td>
              Likelihood <b>{r.likelihoodLabel}</b>（{r.likelihoodBand}）× Impact <b>{r.impactLabel}</b>（{r.impactBand}）→{" "}
              <b style={{ color: HEAT_COLOR[r.heatLabel] }}>{r.heatLabel}</b>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="lab-ports" style={{ gridTemplateColumns: "auto repeat(5, 1fr)" }}>
        <div />
        {LIKELIHOOD_LABELS.map((likLabel) => (
          <div key={likLabel} className="text-center text-[11px] text-fg-3">
            {likLabel}
          </div>
        ))}
        {IMPACT_LABELS.slice()
          .reverse()
          .map((impactLabel, ri) => {
            const impactBand = 5 - ri;
            return (
              <Fragment key={`row-${impactBand}`}>
                <div className="whitespace-nowrap text-[11px] text-fg-3">{impactLabel}</div>
                {LIKELIHOOD_LABELS.map((_, ci) => {
                  const likBand = ci + 1;
                  const isCurrent = impactBand === r.impactBand && likBand === r.likelihoodBand;
                  const cellHeat = heatLabelFor(impactBand, likBand);
                  return (
                    <div
                      key={`${impactBand}-${likBand}`}
                      className="lab-port items-center justify-center"
                      style={{
                        background: `color-mix(in oklab, ${HEAT_COLOR[cellHeat]} ${isCurrent ? 55 : 22}%, transparent)`,
                        borderColor: isCurrent ? "var(--line-strong)" : undefined,
                        boxShadow: isCurrent ? "0 0 0 2px var(--accent, #6366f1) inset" : undefined,
                      }}
                      title={`${impactLabel} × ${LIKELIHOOD_LABELS[ci]} = ${cellHeat}`}
                    />
                  );
                })}
              </Fragment>
            );
          })}
      </div>

      <p className={`lab-decision ${r.acceptable ? "lab-forward" : "lab-flood"}`}>
        <b>{r.acceptable ? "在风险胃口内：Accept" : "超出风险胃口：需要 Treat"}</b>
        <span>
          {r.acceptable
            ? `计算出的风险区间上限 ${r.rangeHigh.toFixed(1)} 没有超过 Risk Appetite ${input.riskAppetite}，可以按当前控制水平接受这个风险。`
            : `计算出的风险区间上限 ${r.rangeHigh.toFixed(1)} 超过了 Risk Appetite ${input.riskAppetite}，需要在 Mitigation / Transference / Acceptance / Avoidance 四种策略里选一个来处理，不能放着不管。`}
        </span>
      </p>
    </div>
  );
}
