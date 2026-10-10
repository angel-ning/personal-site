"use client";

import { useState, type ReactNode } from "react";

const KEYS = ["a", "b", "c", "d", "e", "f"] as const;

// Multiple-choice question: pick an option to see whether it's right, then the explanation.
// <MCQ q="…" a="…" b="…" c="…" d="…" answer="B">explanation (Markdown)</MCQ>
// Several letters in `answer` (answer="CE") make it a "Choose two / three" question: tick that many, then submit.
export function MCQ({
  q,
  answer,
  children,
  ...opts
}: { q: string; answer: string; children?: ReactNode } & Partial<Record<(typeof KEYS)[number], string>>) {
  const correct = answer.toUpperCase().replace(/[^A-F]/g, "").split("");
  const multi = correct.length > 1;
  const [picked, setPicked] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [peek, setPeek] = useState(false);
  const options = KEYS.filter((k) => opts[k]).map((k) => ({ key: k.toUpperCase(), text: opts[k]! }));
  const shown = done || peek;
  const right = done && !peek && picked.length === correct.length && picked.every((k) => correct.includes(k));
  const list = (ks: string[]) => [...ks].sort().join("、");

  const choose = (key: string) => {
    if (!multi) {
      setPicked([key]);
      setDone(true);
      return;
    }
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  };
  const reset = () => {
    setPicked([]);
    setDone(false);
    setPeek(false);
  };

  return (
    <div className="mcq not-prose">
      <p className="mcq-q">{q}</p>
      {multi && !shown && <p className="mcq-hint">多选：选 {correct.length} 项，再点「提交」</p>}
      <div className="mcq-opts">
        {options.map((o) => {
          const isRight = correct.includes(o.key);
          const isPicked = picked.includes(o.key);
          const state = !shown
            ? isPicked
              ? "mcq-on"
              : ""
            : isRight
              ? isPicked || peek
                ? "mcq-right"
                : "mcq-missed"
              : isPicked
                ? "mcq-wrong"
                : "mcq-dim";
          return (
            <button key={o.key} type="button" disabled={shown} aria-pressed={multi ? isPicked : undefined} onClick={() => choose(o.key)} className={`mcq-opt ${state}`}>
              <b>
                {multi ? (isPicked ? "☑ " : "☐ ") : ""}
                {o.key}
              </b>
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      {shown ? (
        <div className={`mcq-why ${right || peek ? "lab-forward" : "lab-flood"}`}>
          <b>{peek ? `答案：${list(correct)}` : right ? `✓ 正确：${list(correct)}` : `✗ 你选了 ${list(picked)}，正确答案是 ${list(correct)}`}</b>
          {children && <div className="mcq-body">{children}</div>}
          <button type="button" className="mcq-retry" onClick={reset}>
            再做一次
          </button>
        </div>
      ) : (
        <div className="mcq-bar">
          {multi && (
            <button type="button" className="lab-btn" disabled={picked.length === 0} onClick={() => setDone(true)}>
              提交（已选 {picked.length} / {correct.length}）
            </button>
          )}
          <button type="button" className="mcq-retry" onClick={() => setPeek(true)}>
            直接看答案
          </button>
        </div>
      )}
    </div>
  );
}
