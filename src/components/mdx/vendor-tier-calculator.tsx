"use client";

import { useState } from "react";
import { computeVendorTier, DEFAULT_THRESHOLD, DEFAULT_WEIGHTS, FACTORS, VENDOR_TIER_PRESETS as PRESETS } from "./vendor-tier-logic.mjs";

type Scores = Record<string, number>;
type Weights = Record<string, number>;

// Score each of the 6 factors (1/3/5) and watch the inherent cyber-risk rating update live.
// Weights and the Tier 1 threshold are also editable — the slide's 0.25/0.25/0.20/0.15/0.10/0.05
// and ">3.5" are one organization's calibration, not a universal rule (Week 5 p.6).
export function VendorTierCalculator() {
  const [presetId, setPresetId] = useState("saas-travel");
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [scores, setScores] = useState<Scores>(preset.scores);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    setPresetId(id);
    setScores(p.scores);
  };

  const setScore = (id: string, score: number) => {
    setPresetId("custom");
    setScores((s) => ({ ...s, [id]: score }));
  };

  const setWeight = (id: string, w: number) => setWeights((s) => ({ ...s, [id]: w }));
  const resetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    setThreshold(DEFAULT_THRESHOLD);
  };

  const { rating, isTier1 } = computeVendorTier(scores, weights, threshold);
  const weightSum = FACTORS.reduce((sum, f) => sum + (weights[f.id] ?? f.weight), 0);
  const weightsChanged = FACTORS.some((f) => weights[f.id] !== DEFAULT_WEIGHTS[f.id]) || threshold !== DEFAULT_THRESHOLD;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Vendor 固有风险分级计算器</span>
        <span className="text-[12px] text-fg-3">Rating = ΣWeight×Score，权重和 Tier 1 门槛都可以自己调</span>
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
                {f.id.toUpperCase()} · {f.label}
                <div className="mt-1 flex items-center gap-1 font-normal text-fg-3">
                  权重
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    max={1}
                    value={weights[f.id] ?? f.weight}
                    onChange={(e) => setWeight(f.id, Number(e.target.value))}
                    className="lab-select w-[4em] px-1.5 py-0.5 text-[12px]"
                  />
                </div>
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
              {FACTORS.map((f) => `${(weights[f.id] ?? f.weight).toFixed(2)}×${scores[f.id] ?? 1}`).join(" + ")} = <b>{rating.toFixed(2)}</b>
            </td>
          </tr>
          <tr>
            <th>Tier 1 门槛</th>
            <td>
              <div className="flex flex-wrap items-center gap-2">
                <span>Rating &gt;</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="lab-select w-[4.5em] px-1.5 py-0.5 text-[13px]"
                />
                <span>→ Tier 1</span>
                {weightsChanged && (
                  <button type="button" onClick={resetWeights} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-fg-2 hover:border-line-strong">
                    恢复 slide 默认值
                  </button>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {Math.abs(weightSum - 1) > 0.01 && (
        <p className="text-[12px] text-fg-3">
          提示：六个权重加起来是 {weightSum.toFixed(2)}，不等于 1——rating 仍然算得出来，但就不再是「1~5 分的加权平均」，和门槛 {threshold} 的对比意义会变。slide 原始权重之和 = 1。
        </p>
      )}

      <p className={`lab-decision ${isTier1 ? "lab-flood" : "lab-forward"}`}>
        <b>{isTier1 ? `Rating ${rating.toFixed(2)} > ${threshold} → Tier 1` : `Rating ${rating.toFixed(2)} ≤ ${threshold} → 不是 Tier 1`}</b>
        <span>
          {isTier1
            ? "需要完整评估路径：证据审查，必要时还要做架构、隐私、财务韧性、第四方审查。"
            : "可以走较轻的尽职调查路径（basic screening），但仍要按 baseline controls 要求。"}
        </span>
      </p>
    </div>
  );
}
