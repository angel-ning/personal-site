"use client";

import { useState } from "react";
import { CALLERS, ROUTE_STEPS, routeFor, routeNote } from "./crm-logic.mjs";

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;

// Slide 14: pick a caller and walk the customer-service process map.
export function CrmRouteLab() {
  const [id, setId] = useState("vip");
  const caller = CALLERS.find((c) => c.id === id)!;
  const path = routeFor(caller) as { step: keyof typeof ROUTE_STEPS; answer?: string }[];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 客服流程图：这通电话怎么走？（Slide 14）
        </span>
      </div>
      <div className="lab-controls">
        {CALLERS.map((c) => (
          <button key={c.id} type="button" className={chip(id === c.id)} onClick={() => setId(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <ol className="crm-path">
        {path.map((p, i) => (
          <li key={i} className={p.answer ? "crm-q" : ""}>
            {ROUTE_STEPS[p.step]}
            {p.answer && <b className={p.answer === "Yes" ? "crm-yes" : "crm-no"}> → {p.answer}</b>}
          </li>
        ))}
      </ol>
      <p className={`lab-decision ${caller.high ? "lab-forward" : "lab-flood"}`}>
        <b>{caller.high ? "优先待遇" : caller.known ? "正常处理" : "先建档"}</b>
        <span>{routeNote(caller)}</span>
      </p>
    </div>
  );
}
