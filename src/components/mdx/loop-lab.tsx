"use client";

import { useState } from "react";
import { decideLoop, LOOP_FACTORS, LOOP_MODES, LOOP_PRESETS } from "./loop-logic.mjs";

type Picks = Record<string, number>;

// Slide 21: pick the conditions of a task → HITL / HOTL / HOOTL, what drives it, and what must be true first.
export function LoopLab() {
  const [presetId, setPresetId] = useState(LOOP_PRESETS[1].id);
  const [picks, setPicks] = useState<Picks>(LOOP_PRESETS[1].picks);
  const r = decideLoop(picks);

  const applyPreset = (id: string) => {
    const p = LOOP_PRESETS.find((x) => x.id === id)!;
    setPresetId(id);
    setPicks(p.picks);
  };
  const pick = (f: string, i: number) => {
    setPresetId("custom");
    setPicks((s) => ({ ...s, [f]: i }));
  };

  const chip = (on: boolean) =>
    `rounded-full border px-2.5 py-0.5 text-left text-[12px] ${on ? "border-accent text-accent" : "border-line text-fg-2 hover:border-line-strong"}`;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · In / On / Out of the loop</span>
        <span className="text-[12px] text-fg-3">最严格的那一项决定模式</span>
      </div>

      <div className="lab-controls">
        {LOOP_PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => applyPreset(p.id)} className={chip(presetId === p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <table className="lab-table">
        <tbody>
          {LOOP_FACTORS.map((f) => (
            <tr key={f.id}>
              <th className="whitespace-nowrap">{f.label}</th>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {f.options.map((o, i) => (
                    <button key={o} type="button" onClick={() => pick(f.id, i)} className={chip((picks[f.id] ?? 0) === i)}>
                      {o}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[11px]">
        {Object.values(LOOP_MODES).map((m) => (
          <div
            key={m.id}
            className="rounded-md border px-1 py-1.5"
            style={
              m.id === r.mode.id
                ? { borderColor: "var(--accent)", background: "color-mix(in oklab, var(--accent) 14%, transparent)", fontWeight: 600 }
                : { borderColor: "var(--line)", color: "var(--fg-3)" }
            }
          >
            {m.id.toUpperCase()}
            <br />
            {m.zh}
          </div>
        ))}
      </div>

      <p className={`lab-decision ${r.mode.id === "hitl" ? "lab-flood" : r.mode.id === "hotl" ? "lab-filter" : "lab-forward"}`}>
        <b>
          {r.mode.en} · {r.mode.zh}
        </b>
        <span>{r.mode.gist}</span>
        <span>
          由哪一项决定：
          {r.drivers.length ? r.drivers.filter((d) => d.level === Math.max(...r.drivers.map((x) => x.level))).map((d) => `${d.label}「${d.text}」`).join("；") : "每一项都在最低一档"}
        </span>
      </p>

      <table className="lab-table">
        <tbody>
          <tr>
            <th className="whitespace-nowrap">这个模式要成立</th>
            <td>
              <ul className="list-disc pl-4">
                {r.conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </td>
          </tr>
          {r.blockers.length > 0 && (
            <tr>
              <th className="whitespace-nowrap">上线前先解决</th>
              <td>
                <ul className="list-disc pl-4">
                  {r.blockers.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
