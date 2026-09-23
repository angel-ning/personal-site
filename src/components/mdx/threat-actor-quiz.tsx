"use client";

import { useState } from "react";
import data from "./data/threat-actor-items.json";

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

// "Which threat actor is this?" — supports picking 2 (like the Snowden question the course itself asks).
export function ThreatActorQuiz() {
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const item = data.items[pos];
  const correct = submitted && sameSet(selected, item.answers);

  const toggle = (id: string) => {
    if (submitted) return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const submit = () => {
    if (submitted || selected.length === 0) return;
    setSubmitted(true);
    setAnswered((a) => a + 1);
    if (sameSet(selected, item.answers)) setScore((s) => s + 1);
  };
  const next = () => {
    setPos((p) => (p + 1) % data.items.length);
    setSelected([]);
    setSubmitted(false);
  };
  const reset = () => {
    setPos(0);
    setSelected([]);
    setSubmitted(false);
    setScore(0);
    setAnswered(0);
  };

  const typeName = (id: string) => data.types.find((t) => t.id === id)!;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 这是哪种 Threat Actor？</span>
        <span className="font-mono text-[12px] text-fg-3">
          {answered}/{data.items.length} · 答对 {score}
        </span>
      </div>

      <p className="lq-item">{item.scenario}</p>
      <div className="lq-stack">
        {data.types.map((t) => {
          const isSelected = selected.includes(t.id);
          const state = !submitted ? "" : item.answers.includes(t.id) ? "lq-right" : isSelected ? "lq-wrong" : "";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              disabled={submitted}
              className={`lq-layer ${isSelected && !submitted ? "lab-btn-on" : ""} ${state}`}
            >
              <span className="lq-zh">{t.zh}</span>
              <span>{t.en}</span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <p className={`lab-decision ${correct ? "lab-forward" : "lab-flood"}`}>
          <b>{correct ? "✓ 正确" : `✗ 正确答案是 ${item.answers.map((a) => typeName(a).en).join(" + ")}`}</b>
          <span>{item.why}</span>
        </p>
      )}

      <div className="lab-controls">
        {!submitted && (
          <button type="button" className="lab-btn" disabled={selected.length === 0} onClick={submit}>
            提交答案
          </button>
        )}
        {submitted && (
          <button type="button" className="lab-btn" onClick={next}>
            下一题 →
          </button>
        )}
        {answered > 0 && (
          <button type="button" className="lab-btn" onClick={reset}>
            重置
          </button>
        )}
      </div>
    </div>
  );
}
