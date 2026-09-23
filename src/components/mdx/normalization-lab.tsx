"use client";

import { useState } from "react";
import scenarios from "./data/normalization-scenarios.json";
import { classifyFd, fdText, KIND_LABEL } from "./normalization-logic.mjs";

type Kind = "full" | "partial" | "transitive";

const KIND_BTN: { id: Kind; label: string }[] = [
  { id: "full", label: "Full" },
  { id: "partial", label: "Partial" },
  { id: "transitive", label: "Transitive" },
];

function Grid({ cols, pk }: { cols: string[]; pk: string[] }) {
  return (
    <table className="lab-table">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c}>{pk.includes(c) ? <u>{c}</u> : c}</th>
          ))}
        </tr>
      </thead>
    </table>
  );
}

export function NormalizationLab() {
  const [scenarioId, setScenarioId] = useState<string>(scenarios[0].id);
  const scenario = scenarios.find((s) => s.id === scenarioId)!;
  const [picks, setPicks] = useState<Record<number, Kind>>({});
  const [showDecomposition, setShowDecomposition] = useState(false);

  const pick = (i: number, kind: Kind) => {
    if (picks[i]) return;
    setPicks((p) => ({ ...p, [i]: kind }));
  };
  const switchScenario = (id: string) => {
    setScenarioId(id);
    setPicks({});
    setShowDecomposition(false);
  };

  const allAnswered = scenario.fds.every((_, i) => picks[i]);
  const score = scenario.fds.filter((fd, i) => picks[i] === classifyFd(scenario.pk, fd.det)).length;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Functional Dependency → 1NF/2NF/3NF</span>
        <span className="font-mono text-[12px] text-fg-3">
          {Object.keys(picks).length}/{scenario.fds.length} · 答对 {score}
        </span>
      </div>

      <div className="lab-controls">
        {scenarios.map((s) => (
          <button key={s.id} type="button" onClick={() => switchScenario(s.id)} className={`lab-btn ${scenarioId === s.id ? "lab-btn-on" : ""}`}>
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-fg-3">
        {scenario.table}，主键 = <u>{scenario.pk.join(" + ")}</u>（下划线）
      </p>
      <Grid cols={scenario.cols} pk={scenario.pk} />

      {scenario.fds.map((fd, i) => {
        const picked = picks[i];
        const correctKind = classifyFd(scenario.pk, fd.det);
        return (
          <div key={i} className="mt-3">
            <p className="lq-item">{fdText(fd)}</p>
            <div className="lab-controls">
              {KIND_BTN.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  disabled={!!picked}
                  onClick={() => pick(i, k.id)}
                  className={`lab-btn ${picked === k.id ? "lab-btn-on" : ""} ${picked && picked !== k.id ? "opacity-40" : ""}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
            {picked && (
              <p className={`lab-decision ${picked === correctKind ? "lab-forward" : "lab-flood"}`}>
                <b>{picked === correctKind ? "✓ 正确" : `✗ 应该是 ${correctKind}`}</b>
                <span>{KIND_LABEL[correctKind]}</span>
              </p>
            )}
          </div>
        );
      })}

      {allAnswered && (
        <div className="lab-controls">
          <button type="button" className="lab-btn" onClick={() => setShowDecomposition((v) => !v)}>
            {showDecomposition ? "收起分解结果" : "查看分解到 3NF 的结果 →"}
          </button>
        </div>
      )}

      {allAnswered && showDecomposition && (
        <div className="flex flex-col gap-3">
          {scenario.decomposition.map((t) => (
            <div key={t.name}>
              <p className="text-[13px] font-semibold">{t.name}</p>
              <Grid cols={t.cols} pk={t.pk} />
              {t.fk.length > 0 && (
                <p className="text-[12px] text-fg-3">↳ {t.fk.map((f) => `${f.col} → ${f.ref}`).join("；")}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
