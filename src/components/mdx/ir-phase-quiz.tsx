"use client";

import { useState } from "react";
import nist from "./data/ir-phase-items.json";
import picerl from "./data/ir-picerl-items.json";

// "Which incident response phase is this?"
// set="nist" (default): NIST 4 phases — Colonial Pipeline actions plus NIST checklist steps (ISOM 5280 Lesson 6).
// set="picerl": the six conventional stages — ransomware timeline and checklist (ISOM 5070 Week 6 p.5, p.8, p.11).
const SETS = { nist, picerl };

export function IrPhaseQuiz({ set = "nist" }: { set?: keyof typeof SETS }) {
  const data = SETS[set] ?? nist;
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const item = data.items[pos];
  const submitted = picked !== null;
  const correct = picked === item.phase;
  const phaseName = (id: string) => data.phases.find((p) => p.id === id)!.en;

  const choose = (id: string) => {
    if (submitted) return;
    setPicked(id);
    setAnswered((a) => a + 1);
    if (id === item.phase) setScore((s) => s + 1);
  };
  const next = () => {
    setPos((p) => (p + 1) % data.items.length);
    setPicked(null);
  };
  const reset = () => {
    setPos(0);
    setPicked(null);
    setScore(0);
    setAnswered(0);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 这一步属于 IR 哪个阶段？</span>
        <span className="font-mono text-[12px] text-fg-3">
          第 {pos + 1}/{data.items.length} 题 · 答对 {score}/{answered}
        </span>
      </div>

      <p className="lq-item">{item.text}</p>
      <div className="lq-stack">
        {data.phases.map((p, i) => {
          const state = !submitted ? "" : p.id === item.phase ? "lq-right" : p.id === picked ? "lq-wrong" : "";
          return (
            <button key={p.id} type="button" onClick={() => choose(p.id)} disabled={submitted} className={`lq-layer ${state}`}>
              <span className="lq-zh">{i + 1}</span>
              <span>
                {p.en}
                <small>{p.zh}</small>
              </span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <p className={`lab-decision ${correct ? "lab-forward" : "lab-flood"}`}>
          <b>{correct ? "✓ 正确" : `✗ 应该是 ${phaseName(item.phase)}`}</b>
          <span>{item.why}</span>
        </p>
      )}

      <div className="lab-controls">
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
