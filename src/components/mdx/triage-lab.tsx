"use client";

import { useState } from "react";
import { TRIAGE_LABEL, TRIAGE_MODELS, TRIAGE_RULE_WORDS, classify, evaluate } from "./triage-logic.mjs";

const METHODS = [
  { id: "rules", label: "固定规则" },
  { id: "pretrained", label: "Pretrained" },
  { id: "finetuned", label: "Finetuned" },
] as const;
type Method = (typeof METHODS)[number]["id"];

// Slides 21, 27, 28: text in → label out. Rules vs pretrained vs finetuned on the same messages, plus a "person decides" band.
export function TriageLab() {
  const [method, setMethod] = useState<Method>("rules");
  const [threshold, setThreshold] = useState(0.5);
  const [own, setOwn] = useState("Dear user, your mailbox is full. Click here to log in and keep your emails");
  const e = evaluate(method, threshold);
  const mine = classify(own, method, threshold);
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · Text in → Label out（示意模型）
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          {e.correct} / {e.total} 判对
        </span>
      </div>
      <div className="lab-controls">
        {METHODS.map((m) => (
          <button key={m.id} type="button" className={`lab-btn ${method === m.id ? "lab-btn-on" : ""}`} onClick={() => setMethod(m.id)}>
            {m.label}
          </button>
        ))}
        {method !== "rules" && (
          <label className="flex items-center gap-1.5 text-[13px]">
            阈值 threshold
            <input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={(ev) => setThreshold(Number(ev.target.value))} />
            <span className="font-mono">{threshold.toFixed(2)}</span>
          </label>
        )}
      </div>
      <p className="mt-2 text-[13px] text-fg-2">
        {method === "rules"
          ? `规则：只要出现 ${TRIAGE_RULE_WORDS.join(" / ")} 任何一个词就判 Threat。没有分数，也说不出「有多确定」。`
          : `${TRIAGE_MODELS[method].label}：按特征打出 0–1 的分数，≥ 阈值判 Threat；离阈值 0.2 以内的标「人工复核」。`}
      </p>

      <div className="tri-grid">
        <div className="tri-stat"><b>{e.tp}</b><span>TP 抓到威胁</span></div>
        <div className="tri-stat tri-bad"><b>{e.fn}</b><span>FN 漏掉威胁</span></div>
        <div className="tri-stat tri-bad"><b>{e.fp}</b><span>FP 误报</span></div>
        <div className="tri-stat"><b>{e.tn}</b><span>TN 正常放行</span></div>
        {method !== "rules" && <div className="tri-stat tri-rev"><b>{e.review}</b><span>交给人看</span></div>}
      </div>

      <div className="table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>Text in</th>
              <th>真实</th>
              <th>{method === "rules" ? "规则" : "分数"}</th>
              <th>Label out</th>
            </tr>
          </thead>
          <tbody>
            {e.rows.map((r, i) => {
              const ok = r.label === r.y;
              return (
                <tr key={i} className={ok ? "" : "lab-hot"}>
                  <td>
                    <code className="tri-text">{r.text}</code>
                    <small className="block text-fg-3">{r.kind} · {r.why}</small>
                  </td>
                  <td>{TRIAGE_LABEL[r.y as "threat"]}</td>
                  <td className="font-mono">{r.score === null ? "—" : pct(r.score)}</td>
                  <td>
                    <b className={ok ? "tri-ok" : "tri-no"}>{ok ? "✓" : "✗"} {TRIAGE_LABEL[r.label as "threat"]}</b>
                    {r.review && <small className="block tri-revtxt">人工复核</small>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <label className="mt-4 flex flex-col gap-1 text-[13px]">
        <span className="text-fg-3">自己输入一段文字（邮件、网址、攻击字符串都行）</span>
        <input value={own} onChange={(ev) => setOwn(ev.target.value)} className="lab-select w-full px-2 py-1 text-[13px]" />
      </label>
      <p className={`lab-decision ${mine.label === "threat" ? "lab-flood" : "lab-forward"}`}>
        <b>
          {TRIAGE_LABEL[mine.label as "threat"]}
          {mine.score !== null && ` · ${pct(mine.score)}`}
          {mine.review && " · 人工复核"}
        </b>
        <span>{mine.why}</span>
      </p>
    </div>
  );
}
