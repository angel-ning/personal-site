"use client";

import { useState } from "react";
import { HEATMAP_ROWS, HEAT_LEVELS, IMPACT_LABELS, LIKELIHOOD_LABELS, aboveAppetite } from "./risk-logic.mjs";

const COLOR: Record<string, string> = { Low: "#2e8b3a", Medium: "#e3c21a", High: "#e0362c", Critical: "#9b4fb8" };

// Slide 37 heat map: click a cell; move the risk-appetite line and see which cells must be treated.
export function HeatMapLab() {
  const [cell, setCell] = useState<[number, number]>([4, 3]);
  const [appetite, setAppetite] = useState("Medium");
  const [imp, lik] = cell;
  const label = HEATMAP_ROWS[5 - imp][lik - 1];
  const treat = aboveAppetite(label, appetite);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · Heat map + 风险胃口这条线
        </span>
      </div>
      <div className="lab-controls">
        <span className="text-[13px]">风险胃口（最高能接受到）：</span>
        {HEAT_LEVELS.slice(0, 3).map((l) => (
          <button key={l} type="button" className={`lab-btn ${appetite === l ? "lab-btn-on" : ""}`} onClick={() => setAppetite(l)}>
            {l}
          </button>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="text-center text-[12px]" style={{ borderCollapse: "separate", borderSpacing: 3 }}>
          <tbody>
            {[5, 4, 3, 2, 1].map((i) => (
              <tr key={i}>
                <th className="pr-2 text-right font-normal">
                  {IMPACT_LABELS[i - 1]} ({i})
                </th>
                {[1, 2, 3, 4, 5].map((l) => {
                  const lab = HEATMAP_ROWS[5 - i][l - 1];
                  const over = aboveAppetite(lab, appetite);
                  const sel = imp === i && lik === l;
                  return (
                    <td key={l}>
                      <button
                        type="button"
                        onClick={() => setCell([i, l])}
                        className="h-9 w-[4.6em] rounded text-white"
                        style={{
                          background: COLOR[lab],
                          opacity: over ? 1 : 0.45,
                          outline: sel ? "3px solid var(--fg)" : "none",
                          outlineOffset: 1,
                        }}
                      >
                        {lab}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td></td>
              {LIKELIHOOD_LABELS.map((l, k) => (
                <td key={l} className="pt-1">
                  {l} ({k + 1})
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className={`lab-decision ${treat ? "lab-flood" : "lab-forward"}`}>
        <b>
          {IMPACT_LABELS[imp - 1]}（{imp}）× {LIKELIHOOD_LABELS[lik - 1]}（{lik}）= {imp * lik} → {label}：{treat ? "超出风险胃口，必须 Treat" : "在风险胃口以内，可以 Accept（要有记录）"}
        </b>
        <span>颜色深的格子是超出胃口、要进入 Risk Treatment 的风险；调低胃口，要处理的格子就变多。注意 Severe × Rare 也只是 Low——影响再大，几乎不会发生，排位也靠后。</span>
      </p>
    </div>
  );
}
