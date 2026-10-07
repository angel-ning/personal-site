"use client";

import { useState } from "react";
import { checkMix, fmtK, fmtPct1, MIX_PRESETS, rangeText } from "./invest-logic.mjs";

type Item = { name: string; k: number; owner: string; outcome: string };
type Row = {
  id: string; name: string; zh: string; min: number | null; max: number | null; funds: string; page: string; items: Item[];
  pct: number; k: number; status: "in" | "below" | "above" | "na"; note: string; scale: number;
};

// p.19 recommended ranges vs a budget mix (default: the p.29 case), with each category's p.30–35 line items scaled to the new amount.
export function BudgetMixLab() {
  const [preset, setPreset] = useState("p29");
  const [total, setTotal] = useState(1200);
  const [shares, setShares] = useState<Record<string, number>>(MIX_PRESETS[0].shares);
  const [lowMaturity, setLowMaturity] = useState(false);
  const [open, setOpen] = useState("cloud");
  const r = checkMix(shares, total, lowMaturity) as { rows: Row[]; sum: number; foundation: number; flags: number };
  const AXIS = 40; // bar scale: 0–40 %

  const pick = (id: string) => {
    const p = MIX_PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setShares(p.shares);
    setTotal(p.total);
  };
  const statusText = { in: "区间内", below: "低于区间", above: "高于区间", na: "—" };
  const statusColor = { in: "var(--c-tip)", below: "var(--c-warn)", above: "var(--c-exam)", na: "var(--fg-3)" };
  const sumOk = Math.abs(r.sum - 100) < 0.05;
  const cur = r.rows.find((x) => x.id === open)!;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 预算配比 vs p.19 区间</span>
        <span className="text-[12px] text-fg-3">拖动每一类的占比，看落不落在建议区间里</span>
      </div>

      <div className="lab-controls">
        {MIX_PRESETS.map((p) => (
          <button key={p.id} type="button" className={`lab-btn ${preset === p.id ? "lab-btn-on" : ""}`} onClick={() => pick(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          年度增量预算
          <input
            type="number"
            step={100}
            min={0}
            value={total}
            onChange={(e) => setTotal(Math.max(0, Number(e.target.value)))}
            className="lab-select w-[6em] px-2 py-1 text-[13px]"
          />
          <span className="text-fg-3">US$k</span>
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" checked={lowMaturity} onChange={(e) => setLowMaturity(e.target.checked)} />
          恢复能力还不可靠（p.19）
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {r.rows.map((c) => (
          <div key={c.id} className={`rounded-md border px-2 py-1.5 ${open === c.id ? "border-accent" : "border-line"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-[13px]">
              <button type="button" className="text-left font-semibold hover:text-accent" onClick={() => setOpen(c.id)}>
                {c.zh}
                <span className="ml-1 font-normal text-fg-3">{c.page}</span>
              </button>
              <span className="font-mono text-[12px]">
                {fmtPct1(c.pct)} · {fmtK(c.k)} ·{" "}
                <b style={{ color: statusColor[c.status] }}>
                  {statusText[c.status]}
                  {c.min !== null && `（${rangeText(c)}）`}
                </b>
              </span>
            </div>
            <div className="relative mt-1 h-5">
              {c.min !== null && (
                <div
                  className="absolute inset-y-0 rounded-sm"
                  style={{
                    left: `${(c.min / AXIS) * 100}%`,
                    width: `${(((c.max as number) - c.min) / AXIS) * 100}%`,
                    background: "color-mix(in oklab, var(--c-tip) 22%, transparent)",
                  }}
                  title={`p.19 建议 ${rangeText(c)}`}
                />
              )}
              <input
                type="range"
                min={0}
                max={AXIS}
                step={0.5}
                value={c.pct}
                aria-label={`${c.zh} 占比`}
                onChange={(e) => {
                  setPreset("custom");
                  setShares((s) => ({ ...s, [c.id]: Number(e.target.value) }));
                }}
                className="relative w-full"
                style={{ accentColor: statusColor[c.status] }}
              />
            </div>
            {c.note && <p className="mt-0.5 text-[12px] text-[var(--c-warn)]">{c.note}</p>}
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-fg-3">绿色底色 = p.19 建议区间；横轴 0–40%。</p>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>合计</th>
            <td className="font-mono">
              <b style={{ color: sumOk ? "var(--c-tip)" : "var(--c-exam)" }}>{fmtPct1(r.sum)}</b>
              {!sumOk && <span className="text-fg-3">（应为 100%）</span>}
            </td>
          </tr>
          <tr>
            <th>身份 + 恢复 + 检测</th>
            <td className="font-mono">{fmtPct1(r.foundation)}（p.19 合计区间 55–70%）</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3 text-[13px]">
        <b>{cur.name}</b>
        <span className="text-fg-3"> — {cur.funds}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="lab-table min-w-[520px]">
          <thead>
            <tr>
              <th>{cur.page} 的举措</th>
              <th className="text-right">按新预算</th>
              <th>Owner</th>
              <th>目标结果</th>
            </tr>
          </thead>
          <tbody>
            {cur.items.map((it) => (
              <tr key={it.name}>
                <td>{it.name}</td>
                <td className="whitespace-nowrap text-right font-mono">
                  {fmtK(it.k * cur.scale)}
                  {Math.abs(cur.scale - 1) > 0.005 && <small className="block text-fg-3">原 {fmtK(it.k)}</small>}
                </td>
                <td className="text-[12px]">{it.owner}</td>
                <td className="text-[12px] text-fg-2">{it.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`lab-decision ${r.flags === 0 && sumOk ? "lab-forward" : "lab-flood"}`}>
        <b>{!sumOk ? "先让合计等于 100%" : r.flags === 0 ? "所有类别都在 p.19 区间内" : `${r.flags} 个类别需要说明理由`}</b>
        <span>
          {preset === "p29"
            ? "p.29 案例里身份、恢复、检测都在区间内；漏洞 / 云 / 应用（12.9%）和数据（7.5%）偏低，另有约 4%（US$50k，课件凑整写作 4.1%）是 p.19 没有的应急储备。p.29 只算增量投资、已有端点 / 防火墙 / 云的基础支出，这是偏离区间的合理解释——区间是起点，不是硬规定。"
            : preset === "tools"
            ? "典型的「买工具」预算：检测和 AI 平台占了一半，身份、恢复、第三方治理却不够——正是 p.24 说的 go-slow 反例，也违反 p.19「先身份、恢复、事件准备，再上高级分析和 AI 工具」。"
            : "p.19 的区间只是「不知道预算和成熟度时」的起点；成熟度越低，越要把钱放在身份、恢复和事件准备上。"}
        </span>
      </p>
    </div>
  );
}
