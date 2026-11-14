"use client";

import { useState } from "react";
import { ACC_PRESETS, METHODS, confusion, pct, representation } from "./accuracy-trap-logic.mjs";

type P = { legit: number; fraud: number; caught: number; falseAlarm: number };

// Slide 12–13: overall accuracy vs fraud recall / precision on an imbalanced test set, and examples per fraud method.
export function AccuracyTrapLab() {
  const [pi, setPi] = useState(0);
  const [p, setP] = useState<P>({ ...ACC_PRESETS[0] });
  const [methods, setMethods] = useState(METHODS.map((m) => ({ ...m })));
  const r = confusion(p);
  const rep = representation(methods);
  const load = (i: number) => {
    setPi(i);
    setP({ ...ACC_PRESETS[i] });
  };
  const num = (k: keyof P, v: string) => setP({ ...p, [k]: Math.max(0, Math.round(Number(v) || 0)) });
  const inp = (k: keyof P, max?: number) => (
    <input type="number" min={0} max={max} value={p[k]} onChange={(e) => num(k, e.target.value)} className="lab-select w-20" />
  );
  const metric = (label: string, v: number | null, hint: string, warn = false) => (
    <div className="rounded-lg border p-2" style={{ borderColor: warn ? "var(--c-warn)" : "var(--line)" }}>
      <div className="text-[12px] text-fg-3">{label}</div>
      <div className="font-mono text-[18px]" style={{ color: warn ? "var(--c-warn)" : undefined }}>
        {pct(v)}
      </div>
      <div className="text-[11.5px] text-fg-3">{hint}</div>
    </div>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 总准确率能藏住什么</span>
        <span className="text-[12px] text-fg-3">Example A（Slide 12）+ Example B（Slide 13）</span>
      </div>
      <div className="lab-controls">
        {ACC_PRESETS.map((x, i) => (
          <button key={x.id} type="button" className={`lab-btn ${i === pi ? "lab-btn-on" : ""}`} onClick={() => load(i)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <span>合法 {inp("legit")}</span>
        <span>欺诈 {inp("fraud")}</span>
        <span>模型抓到的欺诈 {inp("caught", p.fraud)}</span>
        <span>误报（合法被判欺诈）{inp("falseAlarm", p.legit)}</span>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="lab-table">
          <thead>
            <tr>
              <th>真实 \ 模型判为</th>
              <th>欺诈</th>
              <th>合法</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>欺诈 {p.fraud}</th>
              <td className="font-mono">TP {r.tp}</td>
              <td className="font-mono" style={{ color: r.fn ? "var(--c-warn)" : undefined }}>
                FN {r.fn}（漏掉）
              </td>
            </tr>
            <tr>
              <th>合法 {p.legit}</th>
              <td className="font-mono">FP {r.fp}（误报）</td>
              <td className="font-mono">TN {r.tn}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metric("总准确率 (TP+TN)/N", r.accuracy, "课件写的 99% 就是它")}
        {metric("「永远判合法」基线", r.baseline, "什么都不做也能拿到")}
        {metric("欺诈召回率 TP/(TP+FN)", r.recall, "真欺诈里抓到几成", r.recall === 0)}
        {metric("精确率 TP/(TP+FP)", r.precision, "告警里几成是真的")}
      </div>
      <p className={`lab-decision ${r.recall === 0 ? "lab-flood" : "lab-filter"}`}>
        <b>结论</b>
        <span>
          {r.verdict} {ACC_PRESETS[pi].note}
        </span>
      </p>

      <p className="mt-3 text-[13px] font-semibold">Example B · 训练集里每种欺诈手法有多少例</p>
      <table className="lab-table">
        <tbody>
          {rep.map((m, i) => (
            <tr key={m.id}>
              <td>
                {m.label} · {m.zh}
              </td>
              <td className="font-mono">
                <input
                  type="number"
                  min={0}
                  value={methods[i].n}
                  onChange={(e) => setMethods(methods.map((x, k) => (k === i ? { ...x, n: Math.max(0, Math.round(Number(e.target.value) || 0)) } : x)))}
                  className="lab-select w-20"
                />
              </td>
              <td className="min-w-[8em] font-mono text-[12px]">
                {pct(m.share)} {m.thin ? "⚠ 样本太少" : ""}
                <div className="mt-1 h-2 rounded-full" style={{ background: "var(--subtle)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${m.share * 100}%`, background: m.thin ? "var(--c-warn)" : "var(--accent)" }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[12px] text-fg-3">
        「样本太少」按占比 &lt; 10% 粗略标注（示意阈值，不是课件的标准）。补救要先问业务：这种手法在要服务的场景里有多常见、漏掉的代价多大，再决定补收集真实案例、按手法分层评估、还是限制用途。
      </p>
    </div>
  );
}
