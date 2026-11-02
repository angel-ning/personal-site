"use client";

import { useState } from "react";
import { businessCase, CASE_FACTS, CASE_PRESETS, fmtUsdK } from "./crm-case-logic.mjs";

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;

type Inputs = { eligible: number; repeatPts: number; ticketCut: number; accounts: number; corpMargin: number; advisor: number; ongoing: number };

const FIELDS: { key: keyof Inputs; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { key: "eligible", label: "合格的独立个人学员（eligible unique learners）", min: 20000, max: 128000, step: 2000, fmt: (v) => v.toLocaleString() },
  { key: "repeatPts", label: "repeat enrollment 提升（百分点）", min: 0, max: 5, step: 0.5, fmt: (v) => `+${v} pts` },
  { key: "ticketCut", label: "routine 工单减少", min: 0, max: 20, step: 1, fmt: (v) => `${v}%` },
  { key: "accounts", label: "保住的中型企业客户（个）", min: 0, max: 5, step: 1, fmt: (v) => `${v}` },
  { key: "corpMargin", label: "企业合同贡献率（案例没给，自己假设）", min: 20, max: 70, step: 1, fmt: (v) => `${v}%` },
  { key: "advisor", label: "advisor 效率的折算价值 / 年（自己假设）", min: 0, max: 300000, step: 10000, fmt: (v) => fmtUsdK(v) },
  { key: "ongoing", label: "每年持续成本（案例：50–65 万）", min: 500000, max: 650000, step: 25000, fmt: (v) => fmtUsdK(v) },
];

// Assignment 1: does EduConnect 360 pay back? Benefits from 2028, first-year cost in 2027.
export function CrmCaseLab() {
  const [presetId, setPresetId] = useState("mid");
  const [x, setX] = useState<Inputs>(CASE_PRESETS[1].x);
  const r = businessCase(x) as ReturnType<typeof businessCase>;
  const preset = CASE_PRESETS.find((p) => p.id === presetId);

  const set = (k: keyof Inputs, v: number) => {
    setPresetId("custom");
    setX((s) => ({ ...s, [k]: v }));
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · EduConnect 360 能不能收回成本？
        </span>
        <span className="text-[12px] text-fg-3">2027 实施，2028 起才算收益</span>
      </div>
      <div className="lab-controls">
        {CASE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={chip(presetId === p.id)}
            onClick={() => {
              setPresetId(p.id);
              setX(p.x);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}

      <div className="otis-inputs">
        {FIELDS.map((f) => (
          <label key={f.key}>
            {f.label}：<b>{f.fmt(x[f.key])}</b>
            <input type="range" min={f.min} max={f.max} step={f.step} value={x[f.key]} onChange={(e) => set(f.key, +e.target.value)} />
          </label>
        ))}
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>收益来源（每年，2028 起）</th>
            <th>怎么算</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Repeat enrollment</td>
            <td>
              {x.eligible.toLocaleString()} × {x.repeatPts}% = {r.extraRepeats.toLocaleString()} 次 × US${CASE_FACTS.contribPerRepeat}
            </td>
            <td>{fmtUsdK(r.repeat)}</td>
          </tr>
          <tr>
            <td>Support tickets</td>
            <td>
              {CASE_FACTS.tickets.toLocaleString()} × {x.ticketCut}% × US${CASE_FACTS.costPerTicket}
            </td>
            <td>{fmtUsdK(r.tickets)}</td>
          </tr>
          <tr>
            <td>Corporate retention</td>
            <td>
              {x.accounts} × US$92K × {x.corpMargin}%（按贡献算，不按收入）
            </td>
            <td>{fmtUsdK(r.corporate)}</td>
          </tr>
          <tr>
            <td>Advisor productivity</td>
            <td>自己假设</td>
            <td>{fmtUsdK(x.advisor)}</td>
          </tr>
          <tr>
            <th>总收益 − 持续成本</th>
            <td>
              {fmtUsdK(r.benefit)} − {fmtUsdK(x.ongoing)}
            </td>
            <th>{fmtUsdK(r.net)} / 年</th>
          </tr>
        </tbody>
      </table>

      <table className="lab-table">
        <thead>
          <tr>
            {r.years.map((y) => (
              <th key={y.year}>{y.year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {r.years.map((y) => (
              <td key={y.year}>{fmtUsdK(y.flow)}</td>
            ))}
          </tr>
          <tr>
            {r.years.map((y) => (
              <td key={y.year} className={y.cum < 0 ? "text-[var(--c-exam)]" : "text-[var(--c-tip)]"}>
                累计 {fmtUsdK(y.cum)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${r.net > 0 && r.payback && r.payback <= 2030 ? "lab-forward" : "lab-flood"}`}>
        <b>
          {r.net <= 0
            ? "每年的收益连持续成本都抵不上"
            : r.payback && r.payback > 2032
            ? `要到 ${r.payback} 年才收回第一年的 US$1.05M`
            : `大约 ${r.payback} 年收回第一年的 US$1.05M`}
        </b>
        <span>
          {r.net <= 0 || (r.payback && r.payback > 2032)
            ? "全面上线在财务上说不通：要么缩小范围、降低持续成本，要么先证明收益（试点）再扩大。"
            : "结果对「合格学员人数」和 repeat 提升幅度非常敏感：先核实这两个数字，再决定范围。注意公司现金只剩约 US$3.2M，自由现金流是负的。"}
        </span>
      </p>
    </div>
  );
}
