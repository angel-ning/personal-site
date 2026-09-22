"use client";

import { useState, type ReactNode } from "react";

const KEYS = ["a", "b", "c", "d", "e"] as const;

// Multiple-choice question: pick an option to see whether it's right, then the explanation.
// <MCQ q="…" a="…" b="…" c="…" d="…" answer="B">explanation (Markdown)</MCQ>
export function MCQ({
  q,
  answer,
  children,
  ...opts
}: { q: string; answer: string; children?: ReactNode } & Partial<Record<(typeof KEYS)[number], string>>) {
  const [picked, setPicked] = useState<string | null>(null);
  const correct = answer.trim().toUpperCase();
  const options = KEYS.filter((k) => opts[k]).map((k) => ({ key: k.toUpperCase(), text: opts[k]! }));
  const done = picked !== null;

  return (
    <div className="mcq not-prose">
      <p className="mcq-q">{q}</p>
      <div className="mcq-opts">
        {options.map((o) => {
          const state = !done ? "" : o.key === correct ? "mcq-right" : o.key === picked ? "mcq-wrong" : "mcq-dim";
          return (
            <button key={o.key} type="button" disabled={done} onClick={() => setPicked(o.key)} className={`mcq-opt ${state}`}>
              <b>{o.key}</b>
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      {done ? (
        <div className={`mcq-why ${picked === correct || picked === "?" ? "lab-forward" : "lab-flood"}`}>
          <b>{picked === "?" ? `答案：${correct}` : picked === correct ? `✓ 正确：${correct}` : `✗ 你选了 ${picked}，正确答案是 ${correct}`}</b>
          {children && <div className="mcq-body">{children}</div>}
          <button type="button" className="mcq-retry" onClick={() => setPicked(null)}>
            再做一次
          </button>
        </div>
      ) : (
        <button type="button" className="mcq-retry" onClick={() => setPicked("?")}>
          直接看答案
        </button>
      )}
    </div>
  );
}
