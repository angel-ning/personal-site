"use client";

import { useMemo, useState } from "react";
import data from "./data/pmr-items.json";

type Answer = { item: number; picked: string };

// Prevention vs Mitigation vs Remediation — the note's own "most easily confused" triple, as a drill.
export function PmrQuiz() {
  const order = useMemo(() => data.items.map((_, i) => i), []);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showAll, setShowAll] = useState(false);

  const current = data.items[order[pos]];
  const answered = answers.find((a) => a.item === order[pos]);
  const score = answers.filter((a) => data.items[a.item].cat === a.picked).length;
  const finished = answers.length === data.items.length;
  const catName = (id: string) => data.categories.find((c) => c.id === id)!.en;

  const pick = (id: string) => {
    if (answered) return;
    setAnswers((a) => [...a, { item: order[pos], picked: id }]);
  };
  const reset = () => {
    setPos(0);
    setAnswers([]);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Prevention / Mitigation / Remediation</span>
        <span className="font-mono text-[12px] text-fg-3">
          {answers.length}/{data.items.length} · 答对 {score}
        </span>
      </div>

      {!showAll && (
        <>
          <p className="lq-item">{current.text}</p>
          <div className="lq-stack">
            {data.categories.map((c) => {
              const state = !answered ? "" : c.id === current.cat ? "lq-right" : c.id === answered.picked ? "lq-wrong" : "";
              return (
                <button key={c.id} type="button" onClick={() => pick(c.id)} className={`lq-layer ${state}`}>
                  <span className="lq-zh">{c.zh}</span>
                  <span>
                    {c.en}
                    <small>{c.timing}</small>
                  </span>
                </button>
              );
            })}
          </div>
          {answered && (
            <p className={`lab-decision ${answered.picked === current.cat ? "lab-forward" : "lab-flood"}`}>
              <b>{answered.picked === current.cat ? "✓ 正确" : `✗ 应该是 ${catName(current.cat)}`}</b>
              <span>{current.why}</span>
            </p>
          )}
        </>
      )}

      {showAll && (
        <table className="lab-table">
          <thead>
            <tr>
              <th>动作</th>
              <th>属于</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.text}>
                <td>{it.text}</td>
                <td className="whitespace-nowrap">{catName(it.cat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="lab-controls">
        {!showAll && (
          <button
            type="button"
            className="lab-btn"
            disabled={!answered}
            onClick={() => (pos < data.items.length - 1 ? setPos(pos + 1) : reset())}
          >
            {pos < data.items.length - 1 ? "下一题 →" : finished ? `再来一轮（上轮 ${score}/${data.items.length}）` : "下一题 →"}
          </button>
        )}
        <button type="button" className="lab-btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "回到练习" : "看全部对照表"}
        </button>
        {!showAll && answers.length > 0 && (
          <button type="button" className="lab-btn" onClick={reset}>
            重置
          </button>
        )}
      </div>
    </div>
  );
}
