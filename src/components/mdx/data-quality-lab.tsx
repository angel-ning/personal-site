"use client";

import { useState } from "react";
import { CRITERIA, DIMENSIONS, NEEDS_LABEL, checkRows, dimLabel, fmtAmount, gradeRow } from "./data-quality-logic.mjs";

const ROWS = checkRows();

// Slide 11: tick which of the six data-quality dimensions each record fails, then check against the exercise criteria.
export function DataQualityLab() {
  const [sel, setSel] = useState(0);
  const [picks, setPicks] = useState<Record<number, string[]>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [all, setAll] = useState(false);
  const row = ROWS[sel];
  const mine = picks[sel] ?? [];
  const shown = all || checked[sel];
  const g = gradeRow(row, mine);

  const toggle = (d: string) => {
    setPicks({ ...picks, [sel]: mine.includes(d) ? mine.filter((x) => x !== d) : [...mine, d] });
    setChecked({ ...checked, [sel]: false });
  };
  const score = ROWS.filter((r, i) => checked[i] && gradeRow(r, picks[i] ?? []).ok).length;
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 每一行违反了哪一项数据质量检查？</span>
        <span className="font-mono text-[12px] text-fg-3">
          {score} / {done} 对 · 共 {ROWS.length} 行
        </span>
      </div>
      <details className="mt-1 text-[12.5px] text-fg-2">
        <summary className="cursor-pointer">练习准则（Slide 11，截至 2026-10-12）</summary>
        <ul className="mt-1 list-disc pl-5">
          {CRITERIA.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </details>

      <div className="mt-2 overflow-x-auto">
        <table className="lab-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ticket</th>
              <th>Customer</th>
              <th>Region</th>
              <th>Sale date</th>
              <th>Amount</th>
              <th>Cur.</th>
              <th>Loaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => {
              const st = checked[i] ? (gradeRow(r, picks[i] ?? []).ok ? "✓" : "✗") : all ? (r.issues.length ? "!" : "·") : "";
              return (
                <tr key={i} onClick={() => setSel(i)} style={{ cursor: "pointer", background: i === sel ? "var(--accent-wash)" : undefined }}>
                  <td className="font-mono text-[12px]">{r.row}</td>
                  <td className="font-mono">{r.ticket}</td>
                  <td className="font-mono">{r.customer}</td>
                  <td>{r.region || "—"}</td>
                  <td className="font-mono">{r.sale}</td>
                  <td className="font-mono">{fmtAmount(r.amount)}</td>
                  <td className="font-mono">{r.currency}</td>
                  <td className="font-mono">{r.loaded}</td>
                  <td className="font-mono">{st}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[13px]">
        第 <b>{row.row}</b> 行 <b className="font-mono">{row.ticket}</b> 违反了哪些？（可多选；都没有就不勾）
      </p>
      <div className="lab-controls">
        {DIMENSIONS.map((d) => (
          <button key={d.id} type="button" title={d.def} className={`lab-btn ${mine.includes(d.id) ? "lab-btn-on" : ""}`} onClick={() => toggle(d.id)}>
            {d.label} · {d.zh}
          </button>
        ))}
        <button type="button" className="lab-btn" onClick={() => setChecked({ ...checked, [sel]: true })}>
          检查
        </button>
        <button type="button" className="lab-btn" onClick={() => setSel((sel + 1) % ROWS.length)}>
          下一行 →
        </button>
        <label className="text-[12px] text-fg-2">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> 显示全部答案
        </label>
      </div>

      {shown && (
        <div className={`lab-decision ${row.issues.length ? "lab-flood" : "lab-forward"}`}>
          {checked[sel] && !all && (
            <b>
              {g.ok ? "✓ 判断正确" : `✗ ${g.missed.length ? `漏了 ${g.missed.map(dimLabel).join("、")}` : ""}${g.missed.length && g.extra.length ? "；" : ""}${g.extra.length ? `多勾了 ${g.extra.map(dimLabel).join("、")}` : ""}`}
            </b>
          )}
          {row.issues.length ? (
            row.issues.map((x, k) => (
              <span key={k}>
                <b style={{ color: "inherit" }}>{dimLabel(x.dim)}</b>：{x.why} → {x.fix}（{NEEDS_LABEL[x.needs as keyof typeof NEEDS_LABEL]}）
              </span>
            ))
          ) : (
            <span>按准则没有问题。{row.trap}</span>
          )}
        </div>
      )}
      <p className="mt-2 text-[12px] text-fg-3">
        规则是按 Slide 11 的准则算出来的（我的解答，课后对照老师答案）。「要回源找证据」和「要业务决定」的行，在训练前不能由工程师自己改掉。
      </p>
    </div>
  );
}
