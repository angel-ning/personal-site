"use client";

import { useState } from "react";
import { COMMAND_FAMILIES, COMMAND_ITEMS } from "./sql-commands.mjs";

// "Which family is this statement?" — click a family for each statement, see right / wrong and why.
export function CommandSortQuiz() {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const answered = Object.keys(picks).length;
  const right = COMMAND_ITEMS.filter((it, i) => picks[i] === it.a).length;
  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 这条语句属于哪一类？
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          {right} / {answered} 对 · 共 {COMMAND_ITEMS.length} 题
        </span>
      </div>
      <ol className="csq-list">
        {COMMAND_ITEMS.map((it, i) => {
          const p = picks[i];
          return (
            <li key={i} className="csq-item">
              <code>{it.sql}</code>
              <div className="csq-opts">
                {COMMAND_FAMILIES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    disabled={!!p}
                    className={`lab-btn ${p && f.id === it.a ? "csq-right" : p === f.id ? "csq-wrong" : ""}`}
                    onClick={() => setPicks({ ...picks, [i]: f.id })}
                  >
                    {f.id}
                  </button>
                ))}
              </div>
              {p && (
                <p className={`csq-why ${p === it.a ? "csq-ok" : "csq-no"}`}>
                  <b>{p === it.a ? "✓" : `✗ 是 ${it.a}`}</b> {it.why}
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
