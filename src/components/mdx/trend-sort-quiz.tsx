"use client";

import { useState } from "react";
import quiz from "./data/ai-trend-quiz.json";

type SetId = keyof typeof quiz;

// "Which one is this?" click-to-classify drill for ISOM 5180 Module 6 (ML types, SDN / NFV, ZTNA, IoT layers).
export function TrendSortQuiz({ set = "ml" }: { set?: SetId }) {
  const data = quiz[set] ?? quiz.ml;
  const [picks, setPicks] = useState<Record<number, string>>({});
  const answered = Object.keys(picks).length;
  const right = data.items.filter((it, i) => picks[i] === it.a).length;
  const label = (id: string) => data.options.find((o) => o.id === id)?.label ?? id;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · {data.title}
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          {right} / {answered} 对 · 共 {data.items.length} 题
        </span>
      </div>
      <ol className="csq-list">
        {data.items.map((it, i) => {
          const p = picks[i];
          return (
            <li key={i} className="csq-item">
              <span>{it.q}</span>
              <div className="csq-opts">
                {data.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    disabled={!!p}
                    className={`lab-btn ${p && o.id === it.a ? "csq-right" : p === o.id ? "csq-wrong" : ""}`}
                    onClick={() => setPicks({ ...picks, [i]: o.id })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {p && (
                <p className={`csq-why ${p === it.a ? "csq-ok" : "csq-no"}`}>
                  <b>{p === it.a ? "✓" : `✗ 是 ${label(it.a)}`}</b> {it.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {answered > 0 && (
        <button type="button" className="mcq-retry" onClick={() => setPicks({})}>
          重新做
        </button>
      )}
    </div>
  );
}
