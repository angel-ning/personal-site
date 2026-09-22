"use client";

import { useState } from "react";
import { CAPACITY, HALFOPEN_TIMEOUT, connectNormal, initialState, launchSpoofedSyn, waitTicks } from "./syn-flood-logic.mjs";

type Entry = { id: number; kind: "normal" | "attack"; status: "established" | "half-open"; createdAt: number };
type Log = { type: "established" | "half-open" | "refused" | "queue-full" | "timeout"; id?: number; freedCount?: number } | null;
type State = { backlog: Entry[]; nextId: number; tick: number; log: Log };

const MESSAGE: Record<string, { text: (s: State) => string; cls: string }> = {
  established: { text: () => "SYN → SYN-ACK → ACK 三次握手完成，连接建立，占用一个队列位置。", cls: "lab-forward" },
  "half-open": { text: () => "服务器已回 SYN-ACK，但源 IP 是伪造的，永远等不到 ACK —— 半开连接占着位置不放。", cls: "lab-filter" },
  refused: { text: () => "队列（backlog）已满，新连接被拒绝或超时 —— 这就是 SYN Flood 造成的拒绝服务。", cls: "lab-flood" },
  "queue-full": { text: () => "队列已满，这次伪造 SYN 发不进去了。", cls: "lab-flood" },
  timeout: {
    text: (s) => `等待 ${HALFOPEN_TIMEOUT} 个 tick：半开连接超时，服务器回收了 ${s.log?.freedCount ?? 0} 个位置。`,
    cls: "lab-forward",
  },
};

export function SynFloodLab() {
  const [state, setState] = useState<State>(initialState() as State);
  const { backlog, tick, log } = state;
  const full = backlog.length >= CAPACITY;
  const btn = "lab-btn";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · TCP 三次握手 &amp; SYN Flood</span>
        <span className="font-mono text-[12px] text-fg-3">
          队列 {backlog.length}/{CAPACITY} · tick {tick}
        </span>
      </div>

      <div className="lab-controls">
        <button type="button" className={btn} onClick={() => setState(connectNormal(state) as State)}>
          👤 员工电脑正常连接
        </button>
        <button type="button" className={btn} onClick={() => setState(launchSpoofedSyn(state) as State)}>
          🕵️ 攻击者发送伪造 SYN
        </button>
        <button type="button" className={btn} onClick={() => setState(waitTicks(state) as State)} title={`半开连接等待 ${HALFOPEN_TIMEOUT} 个 tick 没收到 ACK 就超时`}>
          ⏩ 等 {HALFOPEN_TIMEOUT} 个 tick（半开连接超时）
        </button>
        <button type="button" className={btn} onClick={() => setState(initialState() as State)}>
          重置
        </button>
      </div>

      {log && (
        <p className={`lab-decision ${MESSAGE[log.type].cls}`}>
          <b>{full && (log.type === "established" || log.type === "half-open") ? "队列已满" : log.type === "refused" ? "连接被拒绝" : log.type === "queue-full" ? "无法再塞入" : log.type === "timeout" ? "超时回收" : "握手成功"}</b>
          <span>{MESSAGE[log.type].text(state)}</span>
        </p>
      )}

      <table className="lab-table">
        <thead>
          <tr>
            <th>队列位置</th>
            <th>来源</th>
            <th>状态</th>
            <th>已等待</th>
          </tr>
        </thead>
        <tbody>
          {backlog.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-fg-3">
                空队列（服务器 backlog 里还没有任何半开 / 已建立的连接）
              </td>
            </tr>
          ) : (
            backlog.map((e, i) => (
              <tr key={e.id}>
                <td className="font-mono">#{i + 1}</td>
                <td>{e.kind === "normal" ? "员工电脑" : `伪造 IP #${e.id}`}</td>
                <td>{e.status === "established" ? "✅ 已建立 (ESTABLISHED)" : "⏳ 半开 (SYN_RECEIVED)"}</td>
                <td className="font-mono">{tick - e.createdAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
