"use client";

import { useMemo, useState } from "react";
import data from "./data/dbms-layers.json";

type Answer = { item: number; picked: string };

// "Which layer does this belong to?" — the lecture's favourite MC question, as a drill.
export function LayerQuiz() {
  const order = useMemo(() => data.items.map((_, i) => i), []);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showAll, setShowAll] = useState(false);

  const current = data.items[order[pos]];
  const answered = answers.find((a) => a.item === order[pos]);
  const score = answers.filter((a) => data.items[a.item].layer === a.picked).length;
  const finished = answers.length === data.items.length;
  const layerName = (id: string) => data.layers.find((l) => l.id === id)!.en;

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
        <span className="lab-kicker">Interactive · 这属于哪一层？</span>
        <span className="font-mono text-[12px] text-fg-3">
          {answers.length}/{data.items.length} · 答对 {score}
        </span>
      </div>

      {!showAll && (
        <>
          <p className="lq-item">{current.text}</p>
          <div className="lq-stack">
            {data.layers.map((l) => {
              const state = !answered ? "" : l.id === current.layer ? "lq-right" : l.id === answered.picked ? "lq-wrong" : "";
              return (
                <button key={l.id} type="button" onClick={() => pick(l.id)} className={`lq-layer ${l.id === "cross" ? "lq-cross" : ""} ${state}`}>
                  <span className="lq-zh">{l.zh}</span>
                  <span>
                    {l.en}
                    {l.alt && <small>{l.alt}</small>}
                  </span>
                </button>
              );
            })}
          </div>
          {answered && (
            <p className={`lab-decision ${answered.picked === current.layer ? "lab-forward" : "lab-flood"}`}>
              <b>{answered.picked === current.layer ? "✓ 正确" : `✗ 应该是 ${layerName(current.layer)}`}</b>
              <span>{current.why}</span>
            </p>
          )}
        </>
      )}

      {showAll && (
        <table className="lab-table">
          <thead>
            <tr>
              <th>功能 / 概念</th>
              <th>属于</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.text}>
                <td>{it.text}</td>
                <td className="whitespace-nowrap">{layerName(it.layer)}</td>
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
