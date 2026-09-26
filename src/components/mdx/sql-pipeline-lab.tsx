"use client";

import { useState } from "react";
import { runSql, condSql, orderSql, show, SQL_PRESETS, SELECT_ITEMS, WHERE_OPTIONS, GROUP_OPTIONS, HAVING_OPTIONS, ORDER_OPTIONS } from "./sql-logic.mjs";

type Table = "Customer_T" | "Product_T";
type Q = { table: Table; select: string[]; distinct?: boolean; where: number; groupBy: number; having: number; orderBy: number };
type Step = { clause: string; sql: string; cols: string[]; rows: unknown[][]; marks: (string | null)[]; groups?: number[]; note: string };
type Run = { sql: string; steps: Step[]; error: { clause: string; code: string; msg: string } | null };
type Having = [{ agg: string; col: string }, string, number] | null;

const CLAUSES = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY"];
const havingText = (h: Having) => (h ? `${h[0].agg}(${h[0].col}) ${h[1]} ${h[2]}` : "（无）");

// Run a SELECT clause by clause in logical order and look at the table after each step.
export function SqlPipelineLab() {
  const [q, setQ] = useState<Q>(SQL_PRESETS[0].q as Q);
  const [at, setAt] = useState<number | null>(null);
  const run = runSql(q) as unknown as Run;
  const last = run.steps.length - 1;
  const cur = run.steps[Math.min(at ?? last, last)];
  const present = new Set(run.steps.map((s) => s.clause));

  const update = (patch: Partial<Q>) => {
    setQ((old) => ({ ...old, ...patch }));
    setAt(null);
  };
  const setTable = (table: Table) => update({ table, select: table === "Customer_T" ? ["CustomerName", "CustomerState"] : ["ProductDescription", "ProductStandardPrice"], where: 0, groupBy: 0, having: 0, orderBy: 0, distinct: false });
  const toggle = (id: string) => update({ select: q.select.includes(id) ? q.select.filter((x) => x !== id) : [...q.select, id] });

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>INTERACTIVE · SELECT 的逻辑执行顺序</span>
      </div>

      <div className="lab-controls">
        {SQL_PRESETS.map((p) => (
          <button key={p.label} type="button" className={`lab-btn ${JSON.stringify(p.q) === JSON.stringify(q) ? "lab-btn-on" : ""}`} onClick={() => { setQ(p.q as Q); setAt(null); }}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="lab-controls">
        <label className="ra-ctl">
          <span>FROM</span>
          <select className="lab-select" value={q.table} onChange={(e) => setTable(e.target.value as Table)}>
            <option value="Customer_T">Customer_T</option>
            <option value="Product_T">Product_T</option>
          </select>
        </label>
        <label className="ra-ctl">
          <span>WHERE</span>
          <select className="lab-select sp-wide" value={q.where} onChange={(e) => update({ where: +e.target.value })}>
            {WHERE_OPTIONS[q.table].map((w, i) => (
              <option key={i} value={i}>{w ? condSql(w) : "（无）"}</option>
            ))}
          </select>
        </label>
        <label className="ra-ctl">
          <span>GROUP BY</span>
          <select className="lab-select" value={q.groupBy} onChange={(e) => update({ groupBy: +e.target.value })}>
            {GROUP_OPTIONS[q.table].map((g, i) => (
              <option key={i} value={i}>{g.length ? g.join(", ") : "（无）"}</option>
            ))}
          </select>
        </label>
        <label className="ra-ctl">
          <span>HAVING</span>
          <select className="lab-select" value={q.having} onChange={(e) => update({ having: +e.target.value })}>
            {(HAVING_OPTIONS[q.table] as Having[]).map((h, i) => (
              <option key={i} value={i}>{havingText(h)}</option>
            ))}
          </select>
        </label>
        <label className="ra-ctl">
          <span>ORDER BY</span>
          <select className="lab-select" value={q.orderBy} onChange={(e) => update({ orderBy: +e.target.value })}>
            {(ORDER_OPTIONS[q.table] as [string, string?][][]).map((o, i) => (
              <option key={i} value={i}>{o.length ? orderSql(o) : "（无）"}</option>
            ))}
          </select>
        </label>
        <label className="ra-ctl">
          <input type="checkbox" checked={!!q.distinct} onChange={(e) => update({ distinct: e.target.checked })} />
          <span>DISTINCT</span>
        </label>
      </div>

      <div className="ra-cols">
        <span>SELECT</span>
        {SELECT_ITEMS[q.table].map((s) => (
          <button key={s.id} type="button" onClick={() => toggle(s.id)} className={`ra-col ${q.select.includes(s.id) ? "ra-on" : ""}`}>
            {s.id}
          </button>
        ))}
        <small>（按点击顺序排列；都不选 = *）</small>
      </div>

      <pre className="sp-sql">{run.sql}</pre>

      <div className="sp-flow" role="tablist" aria-label="logical processing order">
        {CLAUSES.map((c, i) => {
          const idx = run.steps.findIndex((s) => s.clause === c);
          const failed = run.error?.clause === c;
          return (
            <span key={c} className="sp-flow-item">
              {i > 0 && <span className="sp-arrow">→</span>}
              <button
                type="button"
                role="tab"
                aria-selected={cur?.clause === c}
                disabled={idx < 0 && !failed}
                onClick={() => idx >= 0 && setAt(idx)}
                className={`sp-step ${cur?.clause === c && !(failed && at === null) ? "sp-step-on" : ""} ${failed ? "sp-step-err" : ""} ${!present.has(c) && !failed ? "sp-step-off" : ""}`}
              >
                <b>{i + 1}</b> {c}
              </button>
            </span>
          );
        })}
      </div>

      {cur && (
        <>
          <p className="ra-cap">
            第 {run.steps.indexOf(cur) + 1} 步 · <code>{cur.sql}</code> · 当前 {cur.rows.length} 行
          </p>
          <div className="ra-scroll">
            <table className="lab-table ra-table">
              <thead>
                <tr>
                  {cur.cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cur.rows.length === 0 ? (
                  <tr>
                    <td colSpan={cur.cols.length} className="text-fg-3">（没有行）</td>
                  </tr>
                ) : (
                  cur.rows.map((r, i) => (
                    <tr key={i} className={`${cur.marks[i] === "keep" ? "ra-keep" : cur.marks[i] === "drop" ? "ra-drop" : ""} ${cur.groups ? `sp-g${cur.groups[i] % 2}` : ""} ${cur.groups && i > 0 && cur.groups[i] !== cur.groups[i - 1] ? "sp-gstart" : ""}`}>
                      {r.map((v, j) => (
                        <td key={j} className={v === null ? "sp-null" : ""}>{show(v)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="lab-decision lab-filter">
            <b>{cur.clause}</b>
            <span>{cur.note}</span>
          </p>
        </>
      )}

      {run.error && (at === null || run.steps.indexOf(cur) === last) && (
        <p className="lab-decision lab-flood">
          <b>{run.error.code} · 在 {run.error.clause} 这一步报错</b>
          <span>{run.error.msg}</span>
        </p>
      )}

      <p className="sp-hint">写的顺序：SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY；执行的顺序：上面的 1 → 6。点任意一步看那一刻的中间表。</p>
    </div>
  );
}
