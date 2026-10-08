"use client";

import { useState } from "react";
import { KINDS, makeQuestion, checkNum, fmtAnswer } from "./calc-drill-logic.mjs";

type Answer = { key: string; label: string; type: "num" | "bool"; value: number | boolean; unit?: string; yes?: string; no?: string };
type Question = { kind: string; prompt: string; answers: Answer[]; steps: string[] };

// Random calculation questions for the ISOM 5280 final (ALE / CBA / MTD-RPO / Lesson 5 risk chain).
export function CalcDrill() {
  const [kind, setKind] = useState("all");
  const [seed, setSeed] = useState(1);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [score, setScore] = useState({ right: 0, done: 0 });

  const q = makeQuestion(kind, seed) as Question;

  const verdict = (a: Answer): boolean | null => {
    const v = inputs[a.key];
    if (a.type === "bool") return v === undefined ? null : (v === "yes") === a.value;
    return checkNum(v ?? "", a.value as number);
  };

  const fresh = (nextKind: string, nextSeed: number) => {
    setKind(nextKind);
    setSeed(nextSeed);
    setInputs({});
    setChecked(false);
    setShowSteps(false);
  };

  const check = () => {
    if (!checked) {
      const allRight = q.answers.every((a) => verdict(a) === true);
      setScore((s) => ({ right: s.right + (allRight ? 1 : 0), done: s.done + 1 }));
    }
    setChecked(true);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 期末计算题随机练习</span>
        <span className="font-mono text-[12px] text-fg-3">
          全对 {score.right}/{score.done}
        </span>
      </div>

      <div className="lab-controls">
        {[{ id: "all", label: "混合" }, ...KINDS].map((k) => (
          <button key={k.id} type="button" className={`lab-btn ${kind === k.id ? "lab-btn-on" : ""}`} onClick={() => fresh(k.id, seed + 1)}>
            {k.label}
          </button>
        ))}
      </div>

      <p className="lq-item">{q.prompt}</p>

      <table className="lab-table">
        <tbody>
          {q.answers.map((a) => {
            const v = verdict(a);
            return (
              <tr key={a.key}>
                <th className="w-[42%]">{a.label}</th>
                <td>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.type === "num" ? (
                      <input
                        inputMode="decimal"
                        value={inputs[a.key] ?? ""}
                        onChange={(e) => setInputs({ ...inputs, [a.key]: e.target.value })}
                        className="lab-select w-[9em] px-2 py-1 text-[13px]"
                        placeholder={a.unit}
                      />
                    ) : (
                      (["yes", "no"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`lab-btn ${inputs[a.key] === opt ? "lab-btn-on" : ""}`}
                          onClick={() => setInputs({ ...inputs, [a.key]: opt })}
                        >
                          {opt === "yes" ? a.yes : a.no}
                        </button>
                      ))
                    )}
                    {checked && (
                      <span className={`text-[13px] ${v ? "text-[var(--c-tip)]" : "text-[var(--c-warn)]"}`}>
                        {v ? "✓" : `✗ 应为 ${fmtAnswer(a)}`}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showSteps && (
        <ol className="lab-decision lab-filter list-decimal pl-8">
          {q.steps.map((s) => (
            <li key={s} className="font-mono text-[13px]">
              {s}
            </li>
          ))}
        </ol>
      )}

      <div className="lab-controls">
        <button type="button" className="lab-btn" onClick={check}>
          检查答案
        </button>
        <button type="button" className="lab-btn" onClick={() => setShowSteps(!showSteps)}>
          {showSteps ? "收起步骤" : "看步骤"}
        </button>
        <button type="button" className="lab-btn" onClick={() => fresh(kind, seed + 1)}>
          换一题 →
        </button>
      </div>
    </div>
  );
}
