"use client";

import { useState } from "react";
import { COPIES, RECEIPT_PRESETS, traceCopies } from "./copy-trace-logic.mjs";

// Harbor data journey: which copies the expansion creates, what masking changes, and what a deletion receipt proves.
export function CopyTraceLab() {
  const [expanded, setExpanded] = useState(true);
  const [masked, setMasked] = useState(false);
  const [covers, setCovers] = useState<string[]>(RECEIPT_PRESETS[0].covers);
  const t = traceCopies({ expanded, masked, covers });

  const toggle = (id: string) => setCovers((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 数据走到哪，副本留在哪</span>
        <span className="text-[12px] text-fg-3">Harbor L2-A2 / A3 / A5</span>
      </div>

      <div className="lab-controls">
        <button type="button" className={`lab-btn ${expanded ? "" : "lab-btn-on"}`} onClick={() => setExpanded(false)}>
          已批准试点（FAQ）
        </button>
        <button type="button" className={`lab-btn ${expanded ? "lab-btn-on" : ""}`} onClick={() => setExpanded(true)}>
          提议的扩展（+ 工单）
        </button>
        <label className="flex items-center gap-1.5 text-[12px] text-fg-2">
          <input type="checkbox" checked={masked} onChange={(e) => setMasked(e.target.checked)} />
          发送前遮蔽姓名 / ID（Slide 20）
        </label>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>副本 · 在哪 · 谁持有</th>
            <th>里面有什么</th>
            <th>到期 / 要的证据</th>
            <th>回执覆盖？</th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r) => (
            <tr key={r.id} style={r.exists ? undefined : { opacity: 0.4 }}>
              <td>
                <b>{r.zh}</b>
                <br />
                <span className="text-[12px] text-fg-3">
                  {r.where} · {r.holder}
                  {r.outside && r.exists ? " · 出了 Harbor" : ""}
                </span>
              </td>
              <td className="text-[13px]">
                {r.personal}
                {masked && r.masked && expanded ? <span className="block text-[12px] text-fg-3">{r.masked}</span> : null}
              </td>
              <td className="text-[13px]">
                {r.expiry}
                <span className="block text-[12px] text-fg-3">证据：{r.evidence}</span>
              </td>
              <td className="text-center">
                <input type="checkbox" disabled={!r.exists} checked={r.covered} onChange={() => toggle(r.id)} aria-label={`回执覆盖 ${r.zh}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="lab-controls">
        <span className="text-[12px] text-fg-2">删除回执：</span>
        {RECEIPT_PRESETS.map((p) => (
          <button key={p.id} type="button" className="lab-btn" onClick={() => setCovers(p.covers)}>
            {p.label}
          </button>
        ))}
      </div>

      <p className={`lab-decision ${t.remaining.length && expanded ? "lab-flood" : "lab-filter"}`}>
        <b>这张回执能证明什么</b>
        <span>
          {expanded ? t.claim : "试点只检索已批准的 FAQ，不产生含工单数据的副本——扩展才会多出这些副本。"}
          {expanded && (
            <>
              {" "}
              含个人数据的副本 {t.withPersonal.length} 份，其中 {t.outside.length} 份在 Harbor 之外
              {masked ? "（遮蔽后供应商只看到 token，但遮蔽≠匿名：lookup 还在，自由文本还在）" : ""}；到期没被证实的 {t.unverified.length} 份。
            </>
          )}
        </span>
      </p>
      <p className="mt-2 text-[12px] text-fg-3">共 {COPIES.length} 类副本，来源：L2-A2 数据流、L2-A3 供应商条款、L2-A5 删除测试。到期一栏是「要问的问题」，不是案例事实。</p>
    </div>
  );
}
