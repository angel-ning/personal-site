"use client";

import { useState } from "react";
import { CONTROL_MODES, SUPPLIERS, VERDICT_LABEL, assessTraining, gateDecision, memoryWalk } from "./grc-talk-logic.mjs";

const Check = ({ on, set, children }: { on: boolean; set: (v: boolean) => void; children: React.ReactNode }) => (
  <label className="flex items-start gap-1.5 text-[13px]">
    <input className="mt-1" type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
    <span>{children}</span>
  </label>
);

// Slides 9–10: which documents the AI read decides whether its conclusion stays inside the evidence.
export function TrainingEvidenceLab() {
  const [supplierId, setSupplierId] = useState("first");
  const [read, setRead] = useState<string[]>(["q"]);
  const [copyExample, setCopyExample] = useState(false);
  const supplier = SUPPLIERS.find((s) => s.id === supplierId)!;
  const r = assessTraining({ supplierId, read, copyExample });
  const toggle = (id: string, on: boolean) => setRead((xs) => (on ? [...xs, id] : xs.filter((x) => x !== id)));
  const tone = r.outcome === "miss" || r.outcome === "unnecessary" ? "lab-flood" : r.outcome === "correct" ? "lab-forward" : "lab-filter";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 结论有没有超出证据</span>
        <span className="text-[12px] text-fg-3">规则：训练用途 possible 或 unclear → 专家复核</span>
      </div>
      <div className="lab-controls">
        <select className="lab-select" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setRead(["q"]); }}>
          {SUPPLIERS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <table className="lab-table">
        <thead>
          <tr><th>让 AI 读</th><th>文件写了什么</th></tr>
        </thead>
        <tbody>
          {supplier.docs.map((d) => (
            <tr key={d.id}>
              <td className="whitespace-nowrap"><Check on={read.includes(d.id)} set={(v) => toggle(d.id, v)}>{d.label}</Check></td>
              <td>{d.says}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lab-controls">
        <Check on={copyExample} set={setCopyExample}>prompt 里有一道例题，模型只会照抄例题答案</Check>
      </div>
      <p className={`lab-decision ${tone}`}>
        <b>{VERDICT_LABEL[r.says as keyof typeof VERDICT_LABEL]}</b>
        <span>{r.why} {r.outcomeText}</span>
      </p>
    </div>
  );
}

// Slide 20: the same request under a prompt-only rule and under a deterministic check.
export function ServiceGateLab() {
  const [accepted, setAccepted] = useState(true);
  const [validated, setValidated] = useState(false);
  const [aiSkips, setAiSkips] = useState(true);
  const [aiForges, setAiForges] = useState(false);
  const [mode, setMode] = useState("skill");
  const r = gateDecision({ accepted, validated, aiSkips, aiForges, mode });

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · AI proposes, the service checks</span>
        <span className="text-[12px] text-fg-3">AI 请求：Approve supplier</span>
      </div>
      <div className="lab-controls">
        {CONTROL_MODES.map((m) => (
          <button key={m.id} type="button" className={`lab-btn ${mode === m.id ? "lab-btn-on" : ""}`} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>
      <p className="text-[12px] text-fg-3">{CONTROL_MODES.find((m) => m.id === mode)?.zh}</p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <Check on={accepted} set={setAccepted}>人工复核人已接受整改方案（Accepted plan）</Check>
        <Check on={validated} set={setValidated}>有权的复核人已确认修复（Validated fix）</Check>
        <Check on={aiSkips} set={setAiSkips}>AI 跳过「检查验证记录」这一步</Check>
        <Check on={aiForges} set={setAiForges}>AI 试图自己把验证字段改成 Yes</Check>
      </div>
      <table className="lab-table">
        <tbody>
          <tr><th className="whitespace-nowrap">应该的结果</th><td>{r.shouldApprove ? "Approved" : "未批准"}</td></tr>
          <tr><th className="whitespace-nowrap">实际的结果</th><td><b>{r.status}</b></td></tr>
        </tbody>
      </table>
      <p className={`lab-decision ${r.correct ? "lab-forward" : "lab-flood"}`}>
        <b>{r.correct ? "结果正确" : "错误批准"}</b>
        <span>{r.why}</span>
      </p>
    </div>
  );
}

const STATE_TONE: Record<string, string> = { ok: "lab-forward", blocked: "lab-filter", bad: "lab-flood" };

// Slides 26–28: follow one sentence from a supplier attachment into memory and later use.
export function MemoryGovernanceLab() {
  const [poisoned, setPoisoned] = useState(true);
  const [provenance, setProvenance] = useState(false);
  const [writeApproval, setWriteApproval] = useState(false);
  const [revalidate, setRevalidate] = useState(false);
  const [serviceGate, setServiceGate] = useState(true);
  const r = memoryWalk({ poisoned, provenance, writeApproval, revalidate, serviceGate });

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 跟踪一条记忆</span>
        <span className="text-[12px] text-fg-3">{r.harm ? "假记忆影响了后续决定" : "这条路径没有造成误导"}</span>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <Check on={poisoned} set={setPoisoned}>附件里藏了指令（取消勾选 = 正常进度）</Check>
        <Check on={provenance} set={setProvenance}>Data provenance：保留原始来源</Check>
        <Check on={writeApproval} set={setWriteApproval}>Least privilege + HITL：有权的人批准写入</Check>
        <Check on={revalidate} set={setRevalidate}>Revalidation：复用前核对当前证据</Check>
        <Check on={serviceGate} set={setServiceGate}>Service gate：挡住未验证的状态更新</Check>
      </div>
      {r.rows.map((row) => (
        <p key={row.stage} className={`lab-decision ${STATE_TONE[row.state]}`}>
          <b>{row.stage}</b>
          <span>{row.text}</span>
        </p>
      ))}
      <p className="text-[13px] text-fg-2">{r.audit}</p>
    </div>
  );
}
