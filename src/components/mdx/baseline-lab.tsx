"use client";

import { useState } from "react";
import { DAYS, fmtHour, HOURS, SCENARIOS, simulate } from "./baseline-logic.mjs";

type Pt = {
  t: number;
  value: number;
  expected: number;
  band: number;
  attack: string | null;
  benignChange: boolean;
  staticAlert: boolean;
  aiAlert: boolean;
  staticHit: boolean;
  aiHit: boolean;
};
type Tally = { alerts: number; fp: number; events: { id: string; caught: boolean }[] };

const W = 672;
const H = 210;
const TOP = 14;
const BOTTOM = 22;
const MAX = 120;
const x = (t: number) => (t / HOURS) * W + 2;
const y = (v: number) => TOP + (1 - Math.min(v, MAX) / MAX) * (H - TOP - BOTTOM);

// A week of hourly traffic: a static "> threshold" rule vs. an AI baseline that knows the weekly pattern.
export function BaselineLab() {
  const [threshold, setThreshold] = useState(80);
  const [on, setOn] = useState<string[]>(["night"]);
  const { points, summary } = simulate(on, threshold) as unknown as { points: Pt[]; summary: { static: Tally; ai: Tally } };

  const toggle = (id: string) => setOn(on.includes(id) ? on.filter((v) => v !== id) : [...on, id]);
  const line = points.map((p) => `${x(p.t).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const bandTop = points.map((p) => `${x(p.t).toFixed(1)},${y(p.expected + p.band).toFixed(1)}`);
  const bandBot = points.map((p) => `${x(p.t).toFixed(1)},${y(Math.max(0, p.expected - p.band)).toFixed(1)}`).reverse();
  const name = (id: string) => SCENARIOS.find((s) => s.id === id)?.label ?? id;

  const row = (label: string, s: Tally) => (
    <tr>
      <td>
        <b>{label}</b>
      </td>
      <td className="font-mono">{s.alerts}</td>
      <td className="font-mono">{s.fp}</td>
      <td>
        {s.events.length === 0
          ? "—（没有开攻击场景）"
          : s.events.map((e) => (
              <div key={e.id}>
                {e.caught ? "✅ 抓到" : "❌ 漏掉"}：{name(e.id)}
              </div>
            ))}
      </td>
    </tr>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 规则阈值 vs AI 基线（一周的流量）</span>
      </div>
      <div className="lab-controls">
        {SCENARIOS.map((s) => (
          <label key={s.id} className="flex items-center gap-1.5 text-[13px]">
            <input type="checkbox" checked={on.includes(s.id)} onChange={() => toggle(s.id)} />
            {s.label}
          </label>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-2 text-[13px]">
          规则：流量 &gt;
          <input type="range" min={30} max={110} step={5} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} aria-label="threshold" />
          <b className="font-mono">{threshold}</b> 就报警
        </label>
      </div>

      <svg viewBox={`0 0 ${W + 4} ${H}`} className="bl-chart" role="img" aria-label="一周流量、规则阈值和 AI 基线">
        {DAYS.map((d, i) => (
          <g key={d}>
            <line x1={x(i * 24)} x2={x(i * 24)} y1={TOP} y2={H - BOTTOM} stroke="var(--line, #e5e5e5)" />
            <text x={x(i * 24 + 12)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--fg-3, #888)">
              {d}
            </text>
          </g>
        ))}
        <polygon points={[...bandTop, ...bandBot].join(" ")} fill="var(--c-tip, #2f855a)" opacity="0.15" />
        <line x1={x(0)} x2={x(HOURS)} y1={y(threshold)} y2={y(threshold)} stroke="var(--c-warn, #c05621)" strokeDasharray="5 4" strokeWidth="1.5" />
        <text x={x(HOURS) - 2} y={y(threshold) - 4} textAnchor="end" fontSize="10.5" fill="var(--c-warn, #c05621)">
          规则阈值 {threshold}
        </text>
        <polyline points={line} fill="none" stroke="var(--fg-2, #444)" strokeWidth="1.3" />
        {points.filter((p) => p.staticAlert).map((p) => (
          <rect key={`s${p.t}`} x={x(p.t) - 2.5} y={TOP - 10} width="5" height="7" fill="var(--c-warn, #c05621)" />
        ))}
        {points.filter((p) => p.aiAlert).map((p) => (
          <circle key={`a${p.t}`} cx={x(p.t)} cy={y(p.value)} r="4" fill="none" stroke="var(--c-exam, #c53030)" strokeWidth="1.8" />
        ))}
      </svg>
      <p className="bl-legend">
        <span><i className="bl-k bl-k-line" />实际流量</span>
        <span><i className="bl-k bl-k-band" />AI 学到的「正常范围」(baseline)</span>
        <span><i className="bl-k bl-k-rule" />规则报警</span>
        <span><i className="bl-k bl-k-ai" />AI 报警</span>
      </p>

      <table className="lab-table">
        <thead>
          <tr>
            <th>方法</th>
            <th>报警数</th>
            <th>误报 (FP)</th>
            <th>攻击抓到没有</th>
          </tr>
        </thead>
        <tbody>
          {row("规则阈值", summary.static)}
          {row("AI 基线", summary.ai)}
        </tbody>
      </table>
      <p className="lab-decision lab-filter">
        <b>看点</b>
        <span>
          ① 周一 09–10 点的高峰每周都有：规则当成异常（误报），AI 知道这是 seasonality。② 凌晨那次量不大，规则要把阈值压到 55 左右才抓得到，代价是每个工作日白天都在报警。③ 开了轮班：AI 前 6 小时报警，之后自动把夜里的新常态学进 baseline（continuous autonomous baselining）。④ trickle 外传两种方法都看不出来——光看流量大小不够，要看目的地、协议、时间（Slide 9 的 NTA）。
        </span>
      </p>
      {points.some((p) => p.aiAlert) && (
        <p className="text-fg-3 text-[12.5px] mt-2">
          AI 报警时刻：{points.filter((p) => p.aiAlert).map((p) => fmtHour(p.t)).join("、")}
        </p>
      )}
    </div>
  );
}
