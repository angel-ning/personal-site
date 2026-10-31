"use client";

import { useState } from "react";
import { PILOT_ROWS, PILOT_UNTESTED, pct, pilotSummary, wilson, zeroErrorBound } from "./pilot-logic.mjs";

// L1-A3 pilot: aggregate vs per-category accuracy, how wide the uncertainty is at n = 40, and what was never tested.
export function PilotEvidenceLab() {
  const [included, setIncluded] = useState<string[]>(PILOT_ROWS.map((r) => r.id));
  const [n, setN] = useState(40);
  const [k, setK] = useState(38);
  const s = pilotSummary(included);
  const own = wilson(Math.min(k, n), n);

  const toggle = (id: string) => setIncluded((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const bar = (lo: number, hi: number, p: number) => (
    <div className="relative mt-1 h-2 rounded-full" style={{ background: "var(--subtle)" }}>
      <div className="absolute h-2 rounded-full" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%`, background: "color-mix(in oklab, var(--accent) 35%, transparent)" }} />
      <div className="absolute -top-0.5 h-3 w-0.5" style={{ left: `${p * 100}%`, background: "var(--accent)" }} />
    </div>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 38 / 40 支持什么结论？</span>
        <span className="text-[12px] text-fg-3">勾掉某一类，看总数怎么变</span>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>类别（L1-A3）· 勾选 = 计入合计</th>
            <th>对 / 测 · 准确率 · 95% 区间</th>
          </tr>
        </thead>
        <tbody>
          {s.rows.map((r) => (
            <tr key={r.id} style={r.on ? undefined : { opacity: 0.45 }}>
              <td>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={r.on} onChange={() => toggle(r.id)} />
                  <span>
                    {r.label}
                    <br />
                    <span className="text-[12px] text-fg-3">
                      {r.zh}
                      {r.note ? ` · ${r.note}` : ""}
                    </span>
                  </span>
                </label>
              </td>
              <td className="min-w-[8.5em] font-mono text-[12px]">
                {r.ok} / {r.n} · {pct(r.rate)}
                <br />
                {pct(r.ci.lo)}–{pct(r.ci.hi)}
                {bar(r.ci.lo, r.ci.hi, r.rate)}
              </td>
            </tr>
          ))}
          <tr>
            <th>合计（勾选的）</th>
            <td className="font-mono text-[12px]">
              {s.n ? (
                <>
                  {s.ok} / {s.n} · {pct(s.rate)}
                  <br />
                  {pct(s.ci.lo)}–{pct(s.ci.hi)}
                  {bar(s.ci.lo, s.ci.hi, s.rate)}
                </>
              ) : (
                "—"
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="lab-decision lab-flood">
        <b>一个总数会盖住什么</b>
        <span>
          {s.n === 0
            ? "什么都没勾。"
            : s.worst && s.worst.rate < s.rate
              ? `合计 ${pct(s.rate)}，但「${s.worst.zh}」只有 ${pct(s.worst.rate)}——恰好是跟期限有关、最容易让顾客错过申请的那一类。`
              : `合计 ${pct(s.rate)}：勾掉的类别里藏着错误时，总数就看起来完美。准确率永远要问「在哪些请求上」。`}{" "}
          24 / 24 全对也只能说明错误率上限大约是 {pct(zeroErrorBound(24))}（95% 区间）。
        </span>
      </p>

      <table className="lab-table">
        <tbody>
          <tr>
            <th className="whitespace-nowrap">完全没测</th>
            <td>
              <div className="flex flex-wrap gap-1.5">
                {PILOT_UNTESTED.map((u) => (
                  <span key={u.id} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-fg-2">
                    {u.zh}
                  </span>
                ))}
              </div>
              <span className="text-[12px] text-fg-3">这些用途的准确率是「未知」，不是 95%。</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="lab-controls">
        <span className="text-[12px] text-fg-2">自己试：测了</span>
        <input type="number" min={1} max={10000} value={n} onChange={(e) => setN(Math.max(1, Number(e.target.value) || 1))} className="lab-select w-20" />
        <span className="text-[12px] text-fg-2">个，对了</span>
        <input type="number" min={0} max={n} value={k} onChange={(e) => setK(Math.max(0, Number(e.target.value) || 0))} className="lab-select w-20" />
        <span className="font-mono text-[12px]">
          → {pct(Math.min(k, n) / n)}，95% 区间 {pct(own.lo)}–{pct(own.hi)}
        </span>
      </div>
    </div>
  );
}
