"use client";

import { createContext, useContext, useId, useState, useSyncExternalStore, type ReactNode } from "react";

// Exam-style written question (short / long answer): type an answer, then reveal the model answer and
// self-mark against the scoring points.
// <WriteQA id="l1-sa1" kind="SA" marks="10" limit="每点 12 词" q="…">
//   <Pt m="2">scoring point</Pt> …   then the model answer (Markdown)
// </WriteQA>
// The typed answer is kept in this browser's localStorage under `id`, so a refresh does not lose it.

type Ctx = { shown: boolean; checked: Record<string, number>; toggle: (key: string, m: number) => void };
const ScoreCtx = createContext<Ctx | null>(null);

// Answers live in an in-memory map mirrored to localStorage (when available), read through
// useSyncExternalStore so the server render and first client render agree (empty), then fill in.
const STORE = "write-qa:";
const mem = new Map<string, string>();
const listeners = new Set<() => void>();
const load = (id: string) => {
  if (!mem.has(id)) {
    try {
      mem.set(id, localStorage.getItem(STORE + id) ?? "");
    } catch {
      mem.set(id, "");
    }
  }
  return mem.get(id)!;
};
const save = (id: string, v: string) => {
  mem.set(id, v);
  try {
    if (v) localStorage.setItem(STORE + id, v);
    else localStorage.removeItem(STORE + id);
  } catch {}
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

// English words plus CJK characters, so both kinds of answers get a sensible count.
const countWords = (s: string) => (s.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g)?.length ?? 0) + (s.match(/[一-鿿]/g)?.length ?? 0);

export function WriteQA({
  id,
  kind = "SA",
  marks,
  limit,
  q,
  children,
}: {
  id: string;
  kind?: "SA" | "LA";
  marks?: string;
  limit?: string;
  q: string;
  children: ReactNode;
}) {
  const text = useSyncExternalStore(subscribe, () => load(id), () => "");
  const [shown, setShown] = useState(false);
  const [checked, setChecked] = useState<Record<string, number>>({});

  const update = (v: string) => save(id, v);
  const toggle = (key: string, m: number) =>
    setChecked((c) => {
      const next = { ...c };
      if (key in next) delete next[key];
      else next[key] = m;
      return next;
    });
  const score = Object.values(checked).reduce((a, b) => a + b, 0);
  const words = countWords(text);

  return (
    <ScoreCtx.Provider value={{ shown, checked, toggle }}>
      <div className="wqa not-prose">
        <div className="wqa-head">
          <span className={`wqa-kind wqa-${kind.toLowerCase()}`}>{kind === "LA" ? "Long Question" : "Short Question"}</span>
          {marks && <span>{marks} marks</span>}
          {limit && <span>· {limit}</span>}
          {shown && marks && (
            <span className="wqa-score">
              自评 {score} / {marks}
            </span>
          )}
        </div>
        <p className="wqa-q">{q}</p>
        <textarea
          className="wqa-input"
          rows={kind === "LA" ? 12 : 6}
          value={text}
          onChange={(e) => update(e.target.value)}
          placeholder="Write your answer here (in English, as in the exam)…"
        />
        <div className="wqa-bar">
          <span className="text-fg-3">约 {words} 词</span>
          <button type="button" className="lab-btn" onClick={() => setShown((s) => !s)}>
            {shown ? "收起参考答案" : "查看参考答案"}
          </button>
          {text && (
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                if (confirm("清空这道题写的答案？")) update("");
              }}
            >
              清空
            </button>
          )}
        </div>
        <div className="wqa-answer" hidden={!shown}>
          {children}
        </div>
      </div>
    </ScoreCtx.Provider>
  );
}

// One scoring point inside <WriteQA>: a checkbox worth `m` marks for self-marking.
export function Pt({ m = "1", children }: { m?: string; children: ReactNode }) {
  const ctx = useContext(ScoreCtx);
  const key = useId();
  const marks = Number(m) || 0;
  const on = ctx ? key in ctx.checked : false;
  return (
    <label className={`wqa-pt ${on ? "wqa-pt-on" : ""}`}>
      <input type="checkbox" checked={on} disabled={!ctx?.shown} onChange={() => ctx?.toggle(key, marks)} />
      <div className="wqa-pt-text">{children}</div>
      <span className="wqa-pt-m">{marks} 分</span>
    </label>
  );
}
