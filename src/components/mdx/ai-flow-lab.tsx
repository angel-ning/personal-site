"use client";

import { useState } from "react";
import { FLOW_STAGES } from "./ai-flow-logic.mjs";

type Stage = (typeof FLOW_STAGES)[number];

// Slide 8 flow: click a stage → the audit question, and what the opening case records do / do not show there.
export function AiFlowLab() {
  const [i, setI] = useState(0);
  const s: Stage = FLOW_STAGES[i];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · AI flow 每一站问什么</span>
        <span className="text-[12px] text-fg-3">点一站，看审计问题和开场案例的记录</span>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[12px]">
        {FLOW_STAGES.map((x, k) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setI(k)}
            className="rounded-md border px-1 py-1.5"
            style={
              k === i
                ? { borderColor: "var(--accent)", background: "color-mix(in oklab, var(--accent) 14%, transparent)", fontWeight: 600 }
                : { borderColor: "var(--line)", color: "var(--fg-2)" }
            }
          >
            <span className="font-mono text-[10px] text-fg-3">0{k + 1}</span>
            <br />
            {x.name}
          </button>
        ))}
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th className="whitespace-nowrap">审计问题</th>
            <td>
              <b>{s.q}</b> <span className="text-fg-3">{s.focus}</span>
              <br />
              {s.zh}
            </td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">案例记录说了</th>
            <td>{s.known}</td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">还缺什么</th>
            <td>{s.gap}</td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">该要的记录</th>
            <td>{s.record}</td>
          </tr>
        </tbody>
      </table>

      <p className="lab-decision lab-filter">
        <b>串起来才算可追溯</b>
        <span>要解释「某一条回复为什么会到这个人手上」，每一站的记录都要能用同一个 advice ID 连起来——这正是 Slide 16、41 问的「record links」。</span>
      </p>
    </div>
  );
}
