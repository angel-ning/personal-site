"use client";

import { useState } from "react";
import { WALK_SCENARIOS, normalizeSteps, redundancy } from "./normalize-steps.mjs";

type Cell = string | number | (string | number)[];
type Tbl = { name: string; cols: string[]; pk: string[]; fk: { col: string; ref: string }[]; rows: Cell[][] };
type Fd = { det: string[]; dep: string[]; kind?: "full" | "partial" | "transitive" };
type Step = { id: string; title: string; rule: string; tables: Tbl[]; fds?: Fd[]; notes: string[]; redundant: number; cells: number };
type Scenario = { id: string; label: string; fds: Fd[] };

const KIND = {
  full: { label: "Full", cls: "nw-full", why: "决定因素 = 整个主键，正常，留在原表" },
  partial: { label: "Partial", cls: "nw-partial", why: "决定因素 = 主键的一部分 → 2NF 要拆" },
  transitive: { label: "Transitive", cls: "nw-trans", why: "决定因素不是主键 → 3NF 要拆" },
};

function TableView({ t, fds, showDup }: { t: Tbl; fds: Fd[]; showDup: boolean }) {
  const dup = showDup && t.pk.length ? (redundancy(t, fds) as { cells: Set<string> }).cells : new Set<string>();
  const fkCols = t.fk.map((f) => f.col);
  return (
    <div className="nw-table">
      <p className="nw-name">{t.name}</p>
      <div className="ra-scroll">
        <table className="lab-table ra-table">
          <thead>
            <tr>
              {t.cols.map((c) => (
                <th key={c}>
                  <span className={t.pk.includes(c) ? "nw-pk" : fkCols.includes(c) ? "nw-fk" : ""}>{c}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className={dup.has(`${i}:${j}`) ? "nw-dup" : Array.isArray(v) && v.length > 1 ? "nw-multi" : ""}>
                    {Array.isArray(v) ? v.join(", ") : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t.fk.length > 0 && <p className="nw-fkline">↳ {t.fk.map((f) => `${f.col} → ${f.ref}`).join("；")}</p>}
    </div>
  );
}

// Raw table → 1NF → 2NF → 3NF on sample data; highlighted cells are values stored again only because of a bad dependency.
export function NormalizeWalkthrough() {
  const [sid, setSid] = useState(WALK_SCENARIOS[0].id);
  const [at, setAt] = useState(0);
  const scenario = WALK_SCENARIOS.find((s) => s.id === sid) as unknown as Scenario;
  const steps = normalizeSteps(scenario) as unknown as Step[];
  const st = steps[at];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>INTERACTIVE · 原始表 → 1NF → 2NF → 3NF</span>
        {st.id !== "raw" && (
          <span className="font-mono text-[12px] text-fg-3">
            {st.tables.length} 张表 · {st.cells} 格 · 重复存储 {st.redundant} 格
          </span>
        )}
      </div>

      <div className="lab-controls">
        {WALK_SCENARIOS.map((s) => (
          <button key={s.id} type="button" className={`lab-btn ${sid === s.id ? "lab-btn-on" : ""}`} onClick={() => { setSid(s.id); setAt(0); }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="sp-flow">
        {steps.map((s, i) => (
          <span key={s.id} className="sp-flow-item">
            {i > 0 && <span className="sp-arrow">→</span>}
            <button type="button" className={`sp-step ${i === at ? "sp-step-on" : ""}`} onClick={() => setAt(i)}>
              <b>{i}</b> {s.title.split("：")[0]}
            </button>
          </span>
        ))}
      </div>

      <p className="lab-decision lab-filter">
        <b>{st.title}</b>
        <span>{st.rule}</span>
      </p>

      {st.fds && (
        <div className="nw-fds">
          {st.fds.map((fd, i) => {
            const k = KIND[fd.kind!];
            return (
              <p key={i} className={`nw-fd ${k.cls}`}>
                <code>{fd.det.join(", ")} → {fd.dep.join(", ")}</code>
                <b>{k.label}</b>
                <span>{k.why}</span>
              </p>
            );
          })}
        </div>
      )}

      <div className="nw-tables">
        {st.tables.map((t) => (
          <TableView key={t.name} t={t} fds={scenario.fds} showDup={st.id !== "raw"} />
        ))}
      </div>

      {st.notes.length > 0 && (
        <ul className="nw-notes">
          {st.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={at === 0} onClick={() => setAt(at - 1)}>← 上一步</button>
        <button type="button" className="lab-btn" disabled={at === steps.length - 1} onClick={() => setAt(at + 1)}>下一步 →</button>
        <span className="sp-hint" style={{ marginTop: 0 }}>
          <span className="nw-pk">实线</span> = 主键，<span className="nw-fk">虚线</span> = 外键，<span className="nw-dup nw-legend">黄底</span> = 因为坏依赖而重复存的值
        </span>
      </div>
    </div>
  );
}
