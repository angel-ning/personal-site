"use client";

import { useState } from "react";
import { OVERFIT_MAX_DEGREE, OVERFIT_TEST, OVERFIT_TRAIN, fitDegree, overfitTable, overfitTruth, polyEval } from "./overfit-logic.mjs";

const W = 420;
const H = 240;
const YMIN = -2.4;
const YMAX = 2.4;
const sx = (x: number) => ((x + 1.05) / 2.1) * W;
const sy = (y: number) => H - ((Math.max(YMIN - 1, Math.min(YMAX + 1, y)) - YMIN) / (YMAX - YMIN)) * H;
const curve = (f: (x: number) => number) =>
  Array.from({ length: 211 }, (_, i) => -1.05 + i * 0.01)
    .map((x) => `${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`)
    .join(" ");
const ALL = overfitTable();
const MAXERR = 0.6;
const barH = (e: number) => `${(Math.min(1, e / MAXERR) * 100).toFixed(1)}%`;

// Slide 25: fit polynomials of growing degree to 10 noisy points; watch training error fall while test error turns back up.
export function OverfitLab() {
  const [d, setD] = useState(3);
  const f = fitDegree(d);
  const cls = f.id === "over" ? "lab-flood" : f.id === "good" ? "lab-forward" : "lab-filter";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 模型越复杂越好吗？
        </span>
        <span className="font-mono text-[12px] text-fg-3">多项式次数 = 模型复杂度</span>
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          degree
          <input type="range" min={0} max={OVERFIT_MAX_DEGREE} value={d} onChange={(e) => setD(Number(e.target.value))} />
          <span className="font-mono">{d}</span>
        </label>
        {[1, 3, 9].map((p) => (
          <button key={p} type="button" className={`lab-btn ${d === p ? "lab-btn-on" : ""}`} onClick={() => setD(p)}>
            {p === 1 ? "1 · 太简单" : p === 3 ? "3 · 刚好" : "9 · 背答案"}
          </button>
        ))}
      </div>
      <div className="ovf-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="ovf-svg" role="img" aria-label={`degree ${d} 的拟合曲线`}>
          <defs>
            <clipPath id="ovf-clip">
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>
          <line x1="0" x2={W} y1={sy(0)} y2={sy(0)} stroke="var(--line, #ddd)" />
          <polyline points={curve(overfitTruth)} fill="none" stroke="var(--fg-3, #999)" strokeDasharray="4 4" strokeWidth="1.2" />
          <polyline points={curve((x) => polyEval(f.coef, x))} fill="none" stroke="var(--accent, #2563eb)" strokeWidth="2.2" clipPath="url(#ovf-clip)" />
          {OVERFIT_TRAIN.map((p, i) => (
            <circle key={`a${i}`} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill="var(--fg, #222)" />
          ))}
          {OVERFIT_TEST.map((p, i) => (
            <circle key={`b${i}`} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill="var(--bg, #fff)" stroke="var(--c-warn, #d97706)" strokeWidth="2" />
          ))}
        </svg>
        <p className="mt-1 text-[12px] text-fg-3">● 训练数据（模型看得到） ○ 测试数据（没见过） ┄ 真实规律 ━ 模型</p>
      </div>
      <div className="ovf-bars">
        {ALL.map((r) => (
          <button key={r.degree} type="button" className={`ovf-col ${r.degree === d ? "ovf-on" : ""}`} onClick={() => setD(r.degree)} aria-label={`degree ${r.degree}`}>
            <span className="ovf-pair">
              <i className="ovf-train" style={{ height: barH(r.train) }} />
              <i className="ovf-test" style={{ height: barH(r.test) }} />
            </span>
            <small>{r.degree}</small>
          </button>
        ))}
      </div>
      <p className="mt-1 text-[12px] text-fg-3">
        <i className="ovf-key ovf-train" /> 训练误差 <i className="ovf-key ovf-test" /> 测试误差（MSE，按 degree 排列，可点）
      </p>
      <p className={`lab-decision ${cls}`}>
        <b>
          {f.label} · 训练误差 {f.train.toFixed(3)} · 测试误差 {f.test.toFixed(3)}
        </b>
        <span>{f.text}</span>
      </p>
    </div>
  );
}
