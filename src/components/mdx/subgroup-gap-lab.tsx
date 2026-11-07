"use client";

import { useState } from "react";
import { SUBGROUP_PRESETS, pct, subgroupCheck } from "./subgroup-logic.mjs";

type Group = (typeof SUBGROUP_PRESETS)[number]["groups"][number];

// Per-language accuracy vs the combined figure: Slide 40 synthetic trial and Harbor L2-A4.
export function SubgroupGapLab() {
  const [pi, setPi] = useState(1);
  const [groups, setGroups] = useState<Group[]>(SUBGROUP_PRESETS[1].groups.map((g) => ({ ...g })));
  const [target, setTarget] = useState(90);
  const preset = SUBGROUP_PRESETS[pi];
  const s = subgroupCheck({ target: target / 100, groups });

  const load = (i: number) => {
    setPi(i);
    setGroups(SUBGROUP_PRESETS[i].groups.map((g) => ({ ...g })));
    setTarget(Math.round(SUBGROUP_PRESETS[i].target * 100));
  };
  const edit = (i: number, key: "n" | "ok", v: number) => setGroups((gs) => gs.map((g, k) => (k === i ? { ...g, [key]: Math.max(key === "n" ? 1 : 0, v || 0) } : g)));
  const bar = (r: { rate: number; ci: { lo: number; hi: number }; meets: boolean }) => (
    <div className="relative mt-1 h-2.5 rounded-full" style={{ background: "var(--subtle)" }}>
      <div className="absolute h-2.5 rounded-full" style={{ left: `${r.ci.lo * 100}%`, width: `${(r.ci.hi - r.ci.lo) * 100}%`, background: "color-mix(in oklab, var(--accent) 30%, transparent)" }} />
      <div className="absolute -top-0.5 h-3.5 w-1 rounded" style={{ left: `${r.rate * 100}%`, background: r.meets ? "var(--c-tip)" : "var(--c-warn)" }} />
      <div className="absolute -top-1 w-px" style={{ left: `${target}%`, height: 18, background: "var(--fg)" }} />
    </div>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 平均数能藏住什么</span>
        <span className="text-[12px] text-fg-3">竖线 = 标准，色块 = 95% 区间</span>
      </div>

      <div className="lab-controls">
        {SUBGROUP_PRESETS.map((p, i) => (
          <button key={p.id} type="button" className={`lab-btn ${i === pi ? "lab-btn-on" : ""}`} onClick={() => load(i)}>
            {p.label}
          </button>
        ))}
        <span className="text-[12px] text-fg-2">每组标准 ≥</span>
        <input type="number" min={50} max={100} value={target} onChange={(e) => setTarget(Math.min(100, Math.max(50, Number(e.target.value) || 90)))} className="lab-select w-16" />
        <span className="text-[12px] text-fg-2">%</span>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>组</th>
            <th>对 / 测</th>
            <th>准确率 · 95% 区间</th>
          </tr>
        </thead>
        <tbody>
          {s.rows.map((r, i) => (
            <tr key={r.id}>
              <td>
                <b>{r.label}</b>
                {r.escalation ? <span className="block text-[12px] text-fg-3">升级渠道：{r.escalation}</span> : null}
              </td>
              <td className="whitespace-nowrap font-mono text-[12px]">
                <input type="number" min={0} value={groups[i].ok} onChange={(e) => edit(i, "ok", Number(e.target.value))} className="lab-select w-16" /> /{" "}
                <input type="number" min={1} value={groups[i].n} onChange={(e) => edit(i, "n", Number(e.target.value))} className="lab-select w-16" />
              </td>
              <td className="min-w-[9em] font-mono text-[12px]">
                {pct(r.rate)} {r.meets ? "✓" : "✗"} · {pct(r.ci.lo)}–{pct(r.ci.hi)}
                {bar(r)}
              </td>
            </tr>
          ))}
          <tr>
            <th>合计</th>
            <td className="font-mono text-[12px]">
              {s.combined.ok} / {s.combined.n}
            </td>
            <td className="font-mono text-[12px]">
              {pct(s.combined.rate)} {s.combined.meets ? "✓" : "✗"} · {pct(s.combined.ci.lo)}–{pct(s.combined.ci.hi)}
              {bar(s.combined)}
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${s.failing.length ? "lab-flood" : "lab-forward"}`}>
        <b>每组都达标了吗</b>
        <span>
          {s.verdict} 组间差距 {pct(s.gap)}。{s.escalationGaps.length ? "准确率之外，标准还要求两种语言都有可用的升级渠道——这一条现在没有证据。" : ""}
        </span>
      </p>
      <p className="mt-2 text-[12px] text-fg-3">{preset.note} 达标不等于公平：还要查错误样例、抽样覆盖和对用户的影响（Slide 41）。</p>
    </div>
  );
}
