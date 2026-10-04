"use client";

import { Fragment, useEffect, useState } from "react";
import data from "./data/sql-practice.json";
import { CopyButton } from "../copy-button";
import { findExercise, cellText, parseInline, levelDots, expectSummary, PREVIEW_ROWS } from "./sql-practice-logic.mjs";

type Rows = (string | number | null)[][];
type Expect =
  | { kind: "rows"; cols: string[]; rows: Rows; note?: string }
  | { kind: "count"; n: number; cols: string[] }
  | { kind: "error"; code: string; msg: string }
  | { kind: "msg"; text: string }
  | { kind: "free"; text: string }
  | { kind: "contains"; cols: string[]; rows: Rows; text: string };
type Step = { sql: string; expect: Expect };
type Exercise = { id: string; section: string; title: string; q: string; hint?: string; why: string; data: string; level: number; steps: Step[] };
type Col = { name: string; type: string; key: string | null };
type Table = { name: string; desc: string; cols: Col[]; rows: Rows };
type Dataset = { label: string; file: string; script: string; tables: Table[] };

const sections = data.sections as Record<string, string>;
const datasets = data.datasets as Record<string, Dataset>;
const allIds = (data.exercises as Exercise[]).map((e) => e.id);

// ---------- progress (per viewer, browser only) ----------
const KEY = "sqlx-done";
const CHANGE = "sqlx-change";
function loadDone(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}
function saveDone(s: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {}
  window.dispatchEvent(new CustomEvent(CHANGE));
}
function useDone() {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sync = () => setDone(loadDone());
    sync();
    window.addEventListener(CHANGE, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return done;
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((p: { t: string; v: string }, i: number) =>
        p.t === "code" ? <code key={i}>{p.v}</code> : p.t === "b" ? <b key={i}>{p.v}</b> : <Fragment key={i}>{p.v}</Fragment>,
      )}
    </>
  );
}

function ResultGrid({ cols, rows, full }: { cols: string[]; rows: Rows; full?: boolean }) {
  const [all, setAll] = useState(false);
  const shown = full || all ? rows : rows.slice(0, PREVIEW_ROWS);
  return (
    <>
      <div className="ra-scroll">
        <table className="lab-table ra-table sqx-grid">
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className={v === null ? "sp-null" : typeof v === "number" ? "sqx-num" : ""}>
                    {cellText(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!full && rows.length > PREVIEW_ROWS && (
        <button type="button" className="mcq-retry" onClick={() => setAll(!all)}>
          {all ? "收起" : `展开全部 ${rows.length} 行`}
        </button>
      )}
    </>
  );
}

function ExpectView({ x }: { x: Expect }) {
  switch (x.kind) {
    case "rows":
      return (
        <div className="sqx-expect">
          <p className="sqx-label">预期结果 · {expectSummary(x)}</p>
          <ResultGrid cols={x.cols} rows={x.rows} />
          {x.note && (
            <p className="sp-hint">
              <Inline text={x.note} />
            </p>
          )}
        </div>
      );
    case "count":
      return (
        <div className="sqx-expect">
          <p className="sqx-label">预期结果</p>
          <p className="sqx-out">
            {x.n} 行（列：{x.cols.join(", ")}）。SQL Developer 默认先取 50 行，滚到底后结果窗口上方会显示「All Rows Fetched: {x.n}」。
          </p>
        </div>
      );
    case "error":
      return (
        <div className="sqx-expect">
          <p className="sqx-label">预期报错</p>
          <p className="sqx-out sqx-err">
            <b>{x.code}</b>: {x.msg}
          </p>
        </div>
      );
    case "msg":
      return (
        <div className="sqx-expect">
          <p className="sqx-label">Script Output 里显示</p>
          <p className="sqx-out sqx-ok">{x.text}</p>
        </div>
      );
    case "contains":
      return (
        <div className="sqx-expect">
          <p className="sqx-label">预期结果</p>
          <ResultGrid cols={x.cols} rows={x.rows} full />
          <p className="sp-hint">
            <Inline text={x.text} />
          </p>
        </div>
      );
    default:
      return (
        <div className="sqx-expect">
          <p className="sqx-label">预期结果</p>
          <p className="sqx-free">
            <Inline text={x.text} />
          </p>
        </div>
      );
  }
}

export function SqlExercise({ id }: { id: string }) {
  const ex = findExercise(data, id) as Exercise;
  const [hint, setHint] = useState(false);
  const [open, setOpen] = useState(false);
  const done = useDone();
  const isDone = done.has(id);
  const toggleDone = () => {
    const s = loadDone();
    if (s.has(id)) s.delete(id);
    else s.add(id);
    saveDone(s);
  };

  return (
    <div className={`lab not-prose sqx ${isDone ? "sqx-done" : ""}`} id={`sqlx-${id}`}>
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          {id} · {sections[ex.section]}
        </span>
        <span className="font-mono text-[12px] text-fg-3" title="难度">
          {ex.data === "lab6" ? "SCHOOL 数据 · " : ""}
          {levelDots(ex.level)}
        </span>
      </div>
      <p className="sqx-title">
        {isDone && <span className="sqx-check">✓ </span>}
        {ex.title}
      </p>
      <p className="sqx-q">
        <Inline text={ex.q} />
      </p>

      <div className="sqx-actions">
        {ex.hint && (
          <button type="button" className={`lab-btn ${hint ? "lab-btn-on" : ""}`} onClick={() => setHint(!hint)}>
            提示
          </button>
        )}
        <button type="button" className={`lab-btn ${open ? "lab-btn-on" : ""}`} onClick={() => setOpen(!open)}>
          {open ? "收起答案" : "看答案和预期结果"}
        </button>
        <button type="button" className={`lab-btn ${isDone ? "lab-btn-on" : ""}`} onClick={toggleDone}>
          {isDone ? "✓ 已在 SQL Developer 里对过" : "我跑过了，结果一致"}
        </button>
      </div>

      {hint && ex.hint && (
        <p className="sqx-hint">
          <Inline text={ex.hint} />
        </p>
      )}

      {open && (
        <div className="sqx-answer">
          {ex.steps.map((s, i) => (
            <div key={i} className="sqx-step">
              {ex.steps.length > 1 && <p className="sqx-label">第 {i + 1} 步</p>}
              <div className="sqx-code">
                <pre className="sp-sql">{s.sql}</pre>
                <CopyButton value={s.sql} copiedLabel="已复制" className="sqx-copy" title="复制 SQL">
                  复制
                </CopyButton>
              </div>
              <ExpectView x={s.expect} />
            </div>
          ))}
          {ex.why && (
            <div className="lab-decision lab-forward">
              <b>为什么</b>
              <span>
                <Inline text={ex.why} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SqlProgress() {
  const done = useDone();
  const n = allIds.filter((id) => done.has(id)).length;
  const bySection = Object.entries(sections).map(([key, label]) => {
    const ids = (data.exercises as Exercise[]).filter((e) => e.section === key).map((e) => e.id);
    return { key, label, total: ids.length, done: ids.filter((id) => done.has(id)).length };
  });
  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          进度 · 只保存在这个浏览器里
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          {n} / {allIds.length}
        </span>
      </div>
      <div className="sqx-bar" aria-hidden>
        <span style={{ width: `${(n / allIds.length) * 100}%` }} />
      </div>
      <div className="sqx-sections">
        {bySection.map((s) => (
          <span key={s.key} className={s.done === s.total ? "sqx-sec-full" : ""}>
            {s.label} <b>{s.done}/{s.total}</b>
          </span>
        ))}
      </div>
      {n > 0 && (
        <button type="button" className="mcq-retry" onClick={() => saveDone(new Set())}>
          清空进度
        </button>
      )}
    </div>
  );
}

export function SqlTables({ set }: { set: string }) {
  const ds = datasets[set];
  const [cur, setCur] = useState(0);
  const t = ds.tables[cur];
  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          {ds.label}
        </span>
        <span className="font-mono text-[12px] text-fg-3">{t.rows.length} 行</span>
      </div>
      <div className="lab-controls">
        {ds.tables.map((x, i) => (
          <button key={x.name} type="button" className={`lab-btn ${i === cur ? "lab-btn-on" : ""}`} onClick={() => setCur(i)}>
            {x.name}
          </button>
        ))}
      </div>
      <p className="sqx-q">{t.desc}</p>
      <div className="ra-cols">
        <span>列</span>
        {t.cols.map((c) => (
          <span key={c.name} className={`ra-col ${c.key?.includes("PK") ? "ra-on" : ""}`} title={c.key ?? ""}>
            {c.name} <small>{c.type}{c.key ? ` · ${c.key}` : ""}</small>
          </span>
        ))}
      </div>
      <div className="sqx-tablebox">
        <ResultGrid cols={t.cols.map((c) => c.name)} rows={t.rows} full />
      </div>
    </div>
  );
}

export function SqlScript({ set }: { set: string }) {
  const ds = datasets[set];
  const lines = ds.script.split("\n").length;
  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          {ds.file}
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          {lines} 行 · {ds.tables.map((t) => t.name).join(", ")}
        </span>
      </div>
      <div className="sqx-actions">
        <CopyButton value={ds.script} copiedLabel="已复制，去 SQL Developer 粘贴后按 F5" className="lab-btn sqx-copy-wide" title="复制整个脚本">
          复制整个脚本{" "}
        </CopyButton>
      </div>
      <details className="sqx-details">
        <summary>展开看脚本内容</summary>
        <pre className="sp-sql sqx-script">{ds.script}</pre>
      </details>
    </div>
  );
}
