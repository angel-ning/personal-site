"use client";

import { useState } from "react";
import { computeVendorTier, FACTORS, VENDOR_TIER_PRESETS as PRESETS } from "./vendor-tier-logic.mjs";

type Scores = Record<string, number>;

// Score each of the 6 weighted factors (1/3/5) and watch the inherent cyber-risk rating —
// and whether it crosses the Tier 1 threshold (rating > 3.5) — update live (Week 5 p.6).
export function VendorTierCalculator() {
  const [presetId, setPresetId] = useState("saas-travel");
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [scores, setScores] = useState<Scores>(preset.scores);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    setPresetId(id);
    setScores(p.scores);
  };

  const setScore = (id: string, score: number) => {
    setPresetId("custom");
    setScores((s) => ({ ...s, [id]: score }));
  };

  const { rating, isTier1 } = computeVendorTier(scores);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Vendor 固有风险分级计算器</span>
        <span className="text-[12px] text-fg-3">Rating = 0.25D + 0.25A + 0.20C + 0.15B + 0.10F + 0.05R</span>
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

      <table className="lab-table">
        <tbody>
          {FACTORS.map((f) => (
            <tr key={f.id}>
              <th className="whitespace-nowrap">
                {f.label.toUpperCase()[0]} · {f.label}
                <div className="font-normal text-fg-3">权重 {f.weight}</div>
              </th>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {f.levels.map((lv) => (
                    <button
                      key={lv.score}
                      type="button"
                      onClick={() => setScore(f.id, lv.score)}
                      className={`rounded-full border px-2.5 py-0.5 text-left text-[12px] ${scores[f.id] === lv.score ? "border-accent text-accent" : "border-line text-fg-2 hover:border-line-strong"}`}
                    >
                      {lv.score} · {lv.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <th>Rating</th>
            <td className="font-mono">
              {FACTORS.map((f) => `${f.weight}×${scores[f.id] ?? 1}`).join(" + ")} = <b>{rating.toFixed(2)}</b>
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${isTier1 ? "lab-flood" : "lab-forward"}`}>
        <b>{isTier1 ? `Rating ${rating.toFixed(2)} > 3.5 → Tier 1` : `Rating ${rating.toFixed(2)} ≤ 3.5 → 不是 Tier 1`}</b>
        <span>
          {isTier1
            ? "需要完整评估路径：证据审查，必要时还要做架构、隐私、财务韧性、第四方审查。"
            : "可以走较轻的尽职调查路径（basic screening），但仍要按 baseline controls 要求。"}
        </span>
      </p>
    </div>
  );
}
