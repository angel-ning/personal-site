"use client";

import { useState } from "react";
import { CASES, CHANGES, CHANGE_PRESETS, STATUS, assessChange } from "./change-impact-logic.mjs";

type CaseId = keyof typeof CASES;

const tone = (s: string) =>
  s === "ok" ? "var(--c-tip)" : s === "partial" ? "var(--c-extra)" : s === "na" ? "var(--fg-3)" : "var(--c-warn)";

// 2C change control: tick what a change alters → affected parts, required tests and what the supplied records show.
export function ChangeImpactLab({ start = "s36" }: { start?: string }) {
  const first = CHANGE_PRESETS.find((p) => p.id === start) ?? CHANGE_PRESETS[0];
  const [pid, setPid] = useState(first.id);
  const [caseId, setCaseId] = useState<CaseId>(first.caseId as CaseId);
  const [changes, setChanges] = useState<string[]>(first.changes);
  const a = assessChange({ caseId, changes });

  const load = (id: string) => {
    const p = CHANGE_PRESETS.find((x) => x.id === id)!;
    setPid(id);
    setCaseId(p.caseId as CaseId);
    setChanges(p.changes);
  };
  const toggle = (id: string) => {
    setPid("");
    setChanges(changes.includes(id) ? changes.filter((x) => x !== id) : [...changes, id]);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 这次变更动了什么、要测什么、证据在哪</span>
        <span className="text-[12px] text-fg-3">{a.caseLabel}</span>
      </div>
      <div className="lab-controls">
        {CHANGE_PRESETS.map((p) => (
          <button key={p.id} type="button" className={`lab-btn ${p.id === pid ? "lab-btn-on" : ""}`} onClick={() => load(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <span className="text-[12px] text-fg-2">变更请求包括：</span>
        {CHANGES.map((c) => (
          <button key={c.id} type="button" className={`lab-btn ${changes.includes(c.id) ? "lab-btn-on" : ""}`} onClick={() => toggle(c.id)}>
            {changes.includes(c.id) ? "✓ " : ""}
            {c.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[13px] font-semibold">① 基线 vs 提议（Slide 36 的四块）</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        {a.parts.map((p) => (
          <div key={p.id} className="rounded-lg border p-2 text-[12.5px]" style={{ borderColor: p.changed.length ? "var(--c-warn)" : "var(--line)" }}>
            <div className="font-semibold">
              {p.label} · {p.zh}
            </div>
            <div className="text-fg-3">基线：{p.baseline}</div>
            <div style={{ color: p.changed.length ? "var(--c-warn)" : "var(--fg-3)" }}>{p.changed.length ? `变更：${p.changed.join("；")}` : "不变"}</div>
          </div>
        ))}
      </div>

      {a.changed && (
        <>
          <p className="mt-3 text-[13px] font-semibold">② 可能影响的行为</p>
          <ul className="list-disc pl-5 text-[13px]">
            {a.perChange.flatMap((c) => c.affects.map((x, k) => <li key={c.id + k}>{x}</li>))}
          </ul>

          <p className="mt-3 text-[13px] font-semibold">③ 必须覆盖的测试 · 现有记录显示什么</p>
          <div className="overflow-x-auto">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>测试</th>
                  <th>怎么查</th>
                  <th>记录里有什么</th>
                </tr>
              </thead>
              <tbody>
                {a.tests.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.label}</b>
                      <span className="block text-[11.5px] text-fg-3">
                        {t.src} · 因为：{t.why.join("、")}
                      </span>
                    </td>
                    <td className="text-[12.5px]">{t.how}</td>
                    <td className="text-[12.5px]">
                      <b style={{ color: tone(t.ev.status) }}>{STATUS[t.ev.status as keyof typeof STATUS].label}</b> {t.ev.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[13px] font-semibold">④ 变更批准记录的五个字段（Slide 38）</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {a.fields.map((f) => (
              <div key={f.id} className="rounded-lg border p-2 text-[12px]" style={{ borderColor: f.have ? "var(--c-tip)" : "var(--c-warn)" }}>
                <div className="font-semibold">
                  {f.label} · {f.zh}
                </div>
                <div className="text-fg-2">
                  {f.have ? "✓ " : "✗ "}
                  {f.text}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className={`lab-decision ${a.changed ? "lab-flood" : "lab-forward"}`}>
        <b>能批准发布吗</b>
        <span>{a.verdict}</span>
        <span className="text-[12px]">{a.approval}</span>
      </p>
      <p className="mt-2 text-[12px] text-fg-3">
        状态只引用课前讲义里给的记录（「没有证据」≠「测试失败」）。Pine Orchard 的影响和测试是我按 Slide 42 推的，课后对照小测答案。
      </p>
    </div>
  );
}
