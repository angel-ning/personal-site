"use client";

import { useState } from "react";
import { DEMO, PACKETS, STATELESS_RULES, runStateful } from "./stateful-logic.mjs";

type PacketId = keyof typeof PACKETS;
type Verdict = { allow: boolean; why: string };
type Step = { pkt: { label: string; src: string; dst: string; flag: string }; stateless: Verdict; stateful: Verdict; table: string[] };

// Send packets one by one and watch a stateless filter and a stateful firewall judge them side by side.
export function StatefulLab() {
  const [seq, setSeq] = useState<PacketId[]>(["req"]);
  const steps: Step[] = runStateful(seq);
  const last = steps[steps.length - 1];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 同一批包：Stateless vs Stateful
        </span>
      </div>

      <p className="mt-2 text-[13px] text-fg-2">点按钮发一个包（可以任意顺序），看两种防火墙各自怎么判。Amy 是内网的 10.0.0.5。</p>
      <div className="lab-controls">
        {(Object.keys(PACKETS) as PacketId[]).map((id) => (
          <button key={id} type="button" className="lab-btn" onClick={() => setSeq([...seq, id])}>
            {PACKETS[id].label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <button type="button" className="lab-btn" onClick={() => setSeq([...DEMO] as PacketId[])}>
          笔记里的演示顺序
        </button>
        <button type="button" className="lab-btn" onClick={() => setSeq([])}>
          清空
        </button>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>#</th>
            <th>包</th>
            <th>Stateless</th>
            <th>Stateful</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={i} className={i === steps.length - 1 ? "lab-hot" : ""}>
              <td className="font-mono">{i + 1}</td>
              <td>
                {s.pkt.label}
                <br />
                <code>
                  {s.pkt.src} → {s.pkt.dst} {s.pkt.flag}
                </code>
              </td>
              <td>{s.stateless.allow ? "✅ 放行" : "⛔ 丢弃"}</td>
              <td>{s.stateful.allow ? "✅ 放行" : "⛔ 丢弃"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {last && (
        <>
          <p className={`lab-decision ${last.stateless.allow ? "lab-forward" : "lab-flood"}`}>
            <b>Stateless：{last.stateless.allow ? "放行" : "丢弃"}</b>
            <span>{last.stateless.why}</span>
          </p>
          <p className={`lab-decision ${last.stateful.allow ? "lab-forward" : "lab-flood"}`}>
            <b>Stateful：{last.stateful.allow ? "放行" : "丢弃"}</b>
            <span>{last.stateful.why}</span>
          </p>
          {last.stateless.allow && !last.stateful.allow && (
            <p className="lab-decision lab-filter">
              <b>两者判断不同</b>
              <span>这就是 stateless 的漏洞：它的第 2 条规则永久开着一大片高位端口，任何「看起来像回包」的包都能进来。</span>
            </p>
          )}
        </>
      )}

      <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
        <div>
          <b>Stateless 的规则表（固定不变）</b>
          <ol className="mt-1 list-decimal pl-5">
            {STATELESS_RULES.map((r) => (
              <li key={r.id}>{r.text}</li>
            ))}
          </ol>
        </div>
        <div>
          <b>Stateful 的 state table（防火墙自己写）</b>
          {last && last.table.length > 0 ? (
            <ul className="mt-1 list-disc pl-5 font-mono">
              {last.table.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-fg-3">（空）只有内网主动发起连接时才会登记</p>
          )}
        </div>
      </div>
    </div>
  );
}
