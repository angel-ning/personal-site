"use client";

import { useState } from "react";
import lab from "./data/switch-lab.json";
import { age, fmtMin, switchFrame, toMin } from "./switch-logic.mjs";

type Entry = { mac: string; port: string; time: number };
type Result = { src: string; dst: string; now: number; learned: string; decision: string; outPorts: string[]; inPort: string };

const DECISION = {
  flood: { zh: "Flood 泛洪", why: "目的 MAC 不在表里 → 除了进来的端口，其他端口全发一遍" },
  forward: { zh: "Forward 转发", why: "目的 MAC 在表里、且在另一个端口 → 只从那一个端口发出去" },
  filter: { zh: "Filter 过滤", why: "目的 MAC 和源在同一个端口 → 对方已经收到了，交换机不转发" },
} as const;

// Walk through the professor's whiteboard example (M1 Supplementary p.4), or send any frame.
export function SwitchLab() {
  const [table, setTable] = useState<Entry[]>([]);
  const [step, setStep] = useState(0);
  const [now, setNow] = useState(toMin(lab.script[0].time) - 1);
  const [log, setLog] = useState<Result[]>([]);
  const [src, setSrc] = useState("F");
  const [dst, setDst] = useState("Q");

  // Aging only happens on "wait" so the scripted walk-through matches the board,
  // where MAC-F is refreshed (4:41 → 4:50) rather than expired.
  const send = (s: string, d: string, t: number) => {
    const r = switchFrame(lab, table, s, d, t);
    setTable(r.table as Entry[]);
    setNow(t);
    setLog((l) => [{ src: s, dst: d, now: t, learned: r.learned, decision: r.decision, outPorts: r.outPorts, inPort: r.inPort }, ...l]);
  };
  const nextScripted = () => {
    const f = lab.script[step];
    send(f.src, f.dst, toMin(f.time));
    setStep(step + 1);
  };
  const reset = () => {
    setTable([]);
    setStep(0);
    setNow(toMin(lab.script[0].time) - 1);
    setLog([]);
  };
  const wait = () => {
    const t = now + lab.agingMinutes;
    setNow(t);
    setTable(age(table, t, lab.agingMinutes) as Entry[]);
  };

  const last = log[0];
  const btn = "rounded-full border border-line px-3 py-1 text-[13px] transition-colors hover:border-line-strong hover:bg-subtle disabled:opacity-40";
  const hostsOn = (p: string) => lab.hosts.filter((h) => h.port === p).map((h) => h.id);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 交换机自学习</span>
        <span className="font-mono text-[12px] text-fg-3">now {fmtMin(now)}</span>
      </div>

      <div className="lab-ports">
        {lab.ports.map((p) => {
          const active = last && (last.inPort === p ? "in" : last.outPorts.includes(p) ? "out" : "");
          return (
            <div key={p} className={`lab-port ${active ? `lab-port-${active}` : ""}`}>
              <span className="font-mono">{p}</span>
              <small>{hostsOn(p).join(" · ") || "—"}</small>
            </div>
          );
        })}
      </div>

      <div className="lab-controls">
        <button className={btn} onClick={nextScripted} disabled={step >= lab.script.length}>
          {step < lab.script.length
            ? `▶ 板书第 ${step + 1} 帧：${lab.script[step].src} → ${lab.script[step].dst}（${lab.script[step].time}）`
            : "板书 5 帧已走完"}
        </button>
        <span className="flex items-center gap-1.5 text-[13px]">
          自己发：
          <select value={src} onChange={(e) => setSrc(e.target.value)} className="lab-select" aria-label="source">
            {lab.hosts.map((h) => (
              <option key={h.id}>{h.id}</option>
            ))}
          </select>
          →
          <select value={dst} onChange={(e) => setDst(e.target.value)} className="lab-select" aria-label="destination">
            {lab.hosts.map((h) => (
              <option key={h.id}>{h.id}</option>
            ))}
          </select>
          <button className={btn} disabled={src === dst} onClick={() => send(src, dst, now + 1)}>
            发送
          </button>
        </span>
        <button className={btn} onClick={wait} title={`MAC 表条目 ${lab.agingMinutes} 分钟没刷新就会被删除`}>
          ⏩ 过 {lab.agingMinutes} 分钟
        </button>
        <button className={btn} onClick={reset}>
          重置
        </button>
      </div>

      {last && (
        <p className={`lab-decision lab-${last.decision}`}>
          <b>
            {last.src} → {last.dst}：{DECISION[last.decision as keyof typeof DECISION].zh}
          </b>
          <span>
            学习：MAC-{last.src} @ {last.inPort}（{last.learned === "new" ? "新增" : "刷新时间戳"}）。
            {DECISION[last.decision as keyof typeof DECISION].why}
            {last.outPorts.length > 0 && `（发往 ${last.outPorts.join(", ")}）`}
          </span>
        </p>
      )}

      <table className="lab-table">
        <thead>
          <tr>
            <th>MAC address</th>
            <th>Port</th>
            <th>Time stamp</th>
          </tr>
        </thead>
        <tbody>
          {table.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-fg-3">
                空表（交换机刚开机，什么都不知道）
              </td>
            </tr>
          ) : (
            table.map((e) => (
              <tr key={e.mac} className={last && `MAC-${last.src}` === e.mac && last.now === e.time ? "lab-hot" : ""}>
                <td className="font-mono">{e.mac}</td>
                <td className="font-mono">{e.port}</td>
                <td className="font-mono">{fmtMin(e.time)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
