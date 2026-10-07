"use client";

import { useState } from "react";
import { decide, DELIVERY_RISK, fmtScore, FORMULAS, INITIATIVES } from "./invest-logic.mjs";

type Prereq = { label: string; met: boolean; whenMissing: string };
type Item = {
  id: string; name: string; scenario: string; costNote: string;
  alr: number; tail: number; comp: number; cost: number; time: number; risk: number; conf: number; rel: number;
  foundational?: boolean; prereq?: Prereq; slideDecision: string;
};
type Row = Item & { score: number; rank: number; verdict: string; kind: "fund" | "slow" | "defer"; why: string };

// Score the p.21 initiatives with the p.7 or p.20 formula, then apply the funding rules (p.18 ④, p.21, p.24).
export function PriorityScoreLab() {
  const [formula, setFormula] = useState<"simple" | "full">("full");
  const [items, setItems] = useState<Item[]>(INITIATIVES as Item[]);
  const [sel, setSel] = useState("mdr");
  const [fundTop, setFundTop] = useState(1);
  const rows = decide(items, formula, fundTop) as Row[];
  const cur = items.find((x) => x.id === sel)!;
  const f = FORMULAS[formula];

  const set = (patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === sel ? { ...x, ...patch } : x)));
  const num = (label: string, key: keyof Item, step: number, unit: string, max?: number) => (
    <label className="flex items-center gap-1.5 text-[13px]">
      {label}
      <input
        type="number"
        step={step}
        min={0}
        max={max}
        value={cur[key] as number}
        onChange={(e) => set({ [key]: Math.max(0, Math.min(max ?? Infinity, Number(e.target.value))) } as Partial<Item>)}
        className="lab-select w-[5.5em] px-2 py-1 text-[13px]"
      />
      <span className="text-fg-3">{unit}</span>
    </label>
  );
  const kindClass = { fund: "text-[var(--c-tip)]", slow: "text-[var(--c-warn)]", defer: "text-fg-3" };
  const r = rows.find((x) => x.id === sel)!;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 投资优先级打分</span>
        <span className="text-[12px] text-fg-3">分数排序 → 再过「基础控制」和「前提条件」两道关</span>
      </div>

      <div className="lab-controls">
        {(["full", "simple"] as const).map((id) => (
          <button key={id} type="button" className={`lab-btn ${formula === id ? "lab-btn-on" : ""}`} onClick={() => setFormula(id)}>
            {FORMULAS[id].label}
          </button>
        ))}
        <button type="button" className="lab-btn" onClick={() => setItems(INITIATIVES as Item[])}>
          重置数值
        </button>
      </div>

      <div className="mt-3 overflow-x-auto rounded-md border border-line px-3 py-2 text-center font-mono text-[12px] leading-relaxed">
        <div>{f.num}</div>
        <div className="my-0.5 border-t border-line-strong" />
        <div>{f.den}</div>
      </div>

      <div className="lab-controls">
        <span className="text-[13px] text-fg-3">编辑：</span>
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="lab-select max-w-full px-2 py-1 text-[13px]">
          {items.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </div>
      <div className="lab-controls">
        {num(formula === "full" ? "年损失降低" : "预期损失降低", "alr", 50, "k")}
        {formula === "full" ? (
          <>
            {num("尾部风险降低", "tail", 50, "k")}
            {num("合规 / 韧性价值", "comp", 50, "k")}
          </>
        ) : (
          <>
            {num("控制有效把握", "conf", 0.1, "0–1", 1)}
            {num("战略相关度", "rel", 1, "1–5", 5)}
          </>
        )}
        {num(formula === "full" ? "TCO" : "Cost", "cost", 10, "k")}
        {num("见效时间", "time", 0.25, "年")}
        {formula === "full" && (
          <label className="flex items-center gap-1.5 text-[13px]">
            交付风险
            <select value={cur.risk} onChange={(e) => set({ risk: Number(e.target.value) })} className="lab-select px-2 py-1 text-[13px]">
              {DELIVERY_RISK.map((d) => (
                <option key={d.v} value={d.v}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="lab-controls text-[12px] text-fg-3">
        <span>成本来源：{cur.costNote}</span>
        {cur.prereq && (
          <label className="flex items-center gap-1.5 text-[13px] text-fg">
            <input type="checkbox" checked={cur.prereq.met} onChange={(e) => set({ prereq: { ...cur.prereq!, met: e.target.checked } })} />
            前提：{cur.prereq.label}
          </label>
        )}
        {cur.foundational && <span className="text-fg">基础性控制（p.18 ④）</span>}
      </div>

      <div className="lab-controls">
        <span className="text-[13px]">前提满足的项目里，今年还能再投</span>
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" className={`lab-btn ${fundTop === n ? "lab-btn-on" : ""}`} onClick={() => setFundTop(n)}>
            {n} 项
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="lab-table min-w-[560px]">
          <thead>
            <tr>
              <th>#</th>
              <th>Initiative</th>
              <th className="whitespace-nowrap text-right">Score</th>
              <th>决定</th>
              <th>p.21 / p.24 原文</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} className={x.id === sel ? "lab-hot" : ""} onClick={() => setSel(x.id)} style={{ cursor: "pointer" }}>
                <td className="font-mono">{x.rank}</td>
                <td>
                  {x.name}
                  <br />
                  <small className="text-fg-3">{x.scenario}</small>
                </td>
                <td className="text-right font-mono">{fmtScore(x.score)}</td>
                <td className={`font-semibold ${kindClass[x.kind]}`}>{x.verdict}</td>
                <td className="text-[12px] text-fg-2">{x.slideDecision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`lab-decision ${r.kind === "fund" ? "lab-forward" : r.kind === "slow" ? "lab-flood" : "lab-filter"}`}>
        <b>
          {r.name}：{r.verdict}（分数排第 {r.rank}）
        </b>
        <span>{r.why}。</span>
        <span>
          公式只回答「每块钱降多少风险」，前提条件回答「现在投得进去吗」——两道关都过才投。分数只能在同一个公式里横向比，两个公式的单位不同，不能互相比。
        </span>
      </p>
    </div>
  );
}
