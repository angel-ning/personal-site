"use client";

import { useState } from "react";
import { computeTimeline, fmtH, TIMELINE_PRESETS } from "./bia-logic.mjs";

type Input = { rpoTarget: number; backupInterval: number; rto: number; wrt: number; mtd: number };

// Recovery timeline from Lesson 6 p.12: last backup → incident → systems recovered → resume operations.
export function BiaTimeLab() {
  const [preset, setPreset] = useState(TIMELINE_PRESETS[0].id);
  const [input, setInput] = useState<Input>(TIMELINE_PRESETS[0]);
  const r = computeTimeline(input) as ReturnType<typeof computeTimeline>;

  const pick = (id: string) => {
    const p = TIMELINE_PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setInput(p);
  };

  const field = (label: string, key: keyof Input, hint: string) => (
    <label className="flex items-center gap-1.5 text-[13px]" title={hint}>
      {label}
      <input
        type="number"
        step={0.25}
        min={0}
        value={input[key]}
        onChange={(e) => {
          setPreset("custom");
          setInput({ ...input, [key]: Math.max(0, Number(e.target.value)) });
        }}
        className="lab-select w-[5em] px-2 py-1 text-[13px]"
      />
      <span className="text-fg-3">h</span>
    </label>
  );

  // Bar scale: before-incident part (worst-case data loss) + after-incident part (max of MTD and RTO+WRT).
  const after = Math.max(input.mtd, r.downtime) || 1;
  const total = r.worstDataLoss + after || 1;
  const pct = (h: number) => `${(h / total) * 100}%`;

  const seg = (w: number, color: string, label: string) =>
    w > 0 ? (
      <div
        className="min-w-0 truncate px-1 text-center text-[11px] font-semibold leading-8"
        style={{ width: pct(w), background: `color-mix(in oklab, ${color} 28%, transparent)`, borderRight: "1px solid var(--line-strong)" }}
        title={`${label} = ${fmtH(w)}`}
      >
        {label}
      </div>
    ) : null;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · BIA 时间线 RPO / RTO / WRT / MTD</span>
        <span className="text-[12px] text-fg-3">要求：RTO + WRT ≤ MTD，备份间隔 ≤ RPO</span>
      </div>

      <div className="lab-controls">
        {TIMELINE_PRESETS.map((p) => (
          <button key={p.id} type="button" className={`lab-btn ${preset === p.id ? "lab-btn-on" : ""}`} onClick={() => pick(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        {field("备份间隔", "backupInterval", "多久做一次备份；事故最坏发生在下一次备份前一刻")}
        {field("RPO 目标", "rpoTarget", "业务最多能容忍丢多少时间的数据")}
        {field("RTO", "rto", "把系统本身恢复起来要多久")}
        {field("WRT", "wrt", "系统恢复后，补数据 + 测试验证要多久")}
        {field("MTD", "mtd", "业务最多能停多久")}
      </div>

      <div className="mt-4 text-[11px] text-fg-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {[
            ["var(--c-board)", "数据丢失窗口（上次备份 → 事故）"],
            ["var(--c-exam)", "RTO 系统恢复"],
            ["var(--c-warn)", "WRT 补数据 + 验证"],
            ["var(--c-tip)", "距 MTD 的余量"],
          ].map(([c, t]) => (
            <span key={t} className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: `color-mix(in oklab, ${c} 45%, transparent)` }} />
              {t}
            </span>
          ))}
        </div>
        <div className="mt-1 flex h-8 overflow-hidden rounded-md border border-[var(--line-strong)]">
          {seg(r.worstDataLoss, "var(--c-board)", "丢失")}
          {seg(input.rto, "var(--c-exam)", "RTO")}
          {seg(input.wrt, "var(--c-warn)", "WRT")}
          {r.slack > 0 && seg(r.slack, "var(--c-tip)", "余量")}
        </div>
        <div className="mt-1 flex">
          <span style={{ width: pct(r.worstDataLoss) }} />
          <div
            className="border-t-2 pt-0.5 text-center"
            style={{ width: pct(input.mtd), borderColor: r.mtdOk ? "var(--c-tip)" : "var(--c-exam)" }}
          >
            MTD = {fmtH(input.mtd)}
          </div>
        </div>
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>停机总时长 = RTO + WRT</th>
            <td className="font-mono">
              {fmtH(input.rto)} + {fmtH(input.wrt)} = <b>{fmtH(r.downtime)}</b>（MTD {fmtH(input.mtd)}）
            </td>
          </tr>
          <tr>
            <th>最坏情况会丢多少数据</th>
            <td className="font-mono">
              = 备份间隔 <b>{fmtH(r.worstDataLoss)}</b>（RPO 目标 {fmtH(input.rpoTarget)}）
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${r.mtdOk ? "lab-forward" : "lab-flood"}`}>
        <b>{r.mtdOk ? `停机时间达标：还剩 ${fmtH(r.slack)} 余量` : `超出 MTD ${fmtH(-r.slack)}：业务撑不住`}</b>
        <span>
          {r.mtdOk
            ? "系统恢复（RTO）加上补数据、测试验证（WRT）都在业务能容忍的最长停机时间以内。"
            : "只看 RTO 会误以为「系统两小时就起来了」，但业务真正恢复要等 WRT 结束。要么缩短 RTO / WRT（热备、自动化验证），要么这个系统需要更高等级的灾备方案。"}
        </span>
      </p>
      <p className={`lab-decision ${r.rpoOk ? "lab-forward" : "lab-flood"}`}>
        <b>{r.rpoOk ? "数据丢失达标" : "RPO 不达标：备份不够频繁"}</b>
        <span>
          {r.rpoOk
            ? `备份间隔 ${fmtH(input.backupInterval)} ≤ RPO ${fmtH(input.rpoTarget)}，最坏也只丢这么多数据。`
            : `事故如果刚好发生在下一次备份之前，会丢掉 ${fmtH(r.worstDataLoss)} 的数据，超过业务能接受的 ${fmtH(input.rpoTarget)}。RPO 决定备份频率，不决定恢复速度。`}
        </span>
      </p>
    </div>
  );
}
