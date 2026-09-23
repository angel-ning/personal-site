"use client";

import { useState } from "react";
import items from "./data/cardinality-items.json";
import { symbolFor, symbolName } from "./cardinality-logic.mjs";

type Min = "mandatory" | "optional";
type Max = "one" | "many";

// The note's own "只问两个问题" method, made clickable: answer Q1 then Q2, get the symbol.
export function CardinalityLab() {
  const [pos, setPos] = useState(0);
  const [min, setMin] = useState<Min | null>(null);
  const [max, setMax] = useState<Max | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const item = items[pos];
  const done = min !== null && max !== null;
  const correct = done && min === item.min && max === item.max;

  const pickMin = (v: Min) => {
    if (min !== null) return;
    setMin(v);
    if (max !== null) grade(v, max);
  };
  const pickMax = (v: Max) => {
    if (max !== null) return;
    setMax(v);
    if (min !== null) grade(min, v);
  };
  const grade = (m: Min, x: Max) => {
    setAnswered((a) => a + 1);
    if (m === item.min && x === item.max) setScore((s) => s + 1);
  };
  const next = () => {
    setPos((p) => (p + 1) % items.length);
    setMin(null);
    setMax(null);
  };
  const reset = () => {
    setPos(0);
    setMin(null);
    setMax(null);
    setScore(0);
    setAnswered(0);
  };

  const btn = (active: boolean, disabled: boolean) =>
    `lab-btn ${active ? "lab-btn-on" : ""} ${disabled && !active ? "opacity-40" : ""}`;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 两个问题定基数</span>
        <span className="font-mono text-[12px] text-fg-3">
          {answered}/{items.length} 轮 · 答对 {score}
        </span>
      </div>

      <p className="lq-item">{item.rule}</p>
      <p className="text-[13px] text-fg-3">
        答案画在 <b>{item.to}</b> 这一端——{item.from} → {item.to}
      </p>

      <div className="lab-controls">
        <span className="text-[13px]">① 一个 {item.from}，可以没有 {item.to} 吗？</span>
        <button type="button" className={btn(min === "optional", min !== null)} disabled={min !== null} onClick={() => pickMin("optional")}>
          可以 → optional
        </button>
        <button type="button" className={btn(min === "mandatory", min !== null)} disabled={min !== null} onClick={() => pickMin("mandatory")}>
          不可以 → mandatory
        </button>
      </div>
      <div className="lab-controls">
        <span className="text-[13px]">② 一个 {item.from}，可以有多于一个 {item.to} 吗？</span>
        <button type="button" className={btn(max === "many", max !== null)} disabled={max !== null} onClick={() => pickMax("many")}>
          可以 → many
        </button>
        <button type="button" className={btn(max === "one", max !== null)} disabled={max !== null} onClick={() => pickMax("one")}>
          不可以 → one
        </button>
      </div>

      {done && (
        <p className={`lab-decision ${correct ? "lab-forward" : "lab-flood"}`}>
          <b>
            你的答案：{symbolFor(min!, max!)}（{symbolName(min!, max!)}）
            {correct ? " ✓ 正确" : ` ✗ 正确答案是 ${symbolFor(item.min as Min, item.max as Max)}（${symbolName(item.min as Min, item.max as Max)}）`}
          </b>
          <span>{item.why}</span>
        </p>
      )}

      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={!done} onClick={next}>
          下一题 →
        </button>
        {answered > 0 && (
          <button type="button" className="lab-btn" onClick={reset}>
            重置
          </button>
        )}
      </div>
    </div>
  );
}
