"use client";

import { useState } from "react";
import { simulateWindow, WINDOW_PRESETS } from "./tcp-logic.mjs";

type Sent = { n: number; retx: boolean; arrived: boolean };
type Round = { winStart: number; window: number; sent: Sent[]; ack: number; timeout: boolean; nextWindow: number };

// Sliding window with expectational ACKs; click a segment to lose it the first time it is sent.
export function WindowLab() {
  const [total, setTotal] = useState(8);
  const [win, setWin] = useState(3);
  const [lost, setLost] = useState<number[]>([4]);
  const [adaptive, setAdaptive] = useState(false);
  const [shown, setShown] = useState(1);

  const rounds = simulateWindow({ total, window: win, lost, adaptive }) as Round[];
  const upto = rounds.slice(0, shown);
  const cur = upto[upto.length - 1];
  const acked = cur ? cur.ack - 1 : 0;
  const everLost = new Set(upto.flatMap((r) => r.sent.filter((s) => !s.arrived).map((s) => s.n)));
  const inFlight = new Set(cur ? cur.sent.map((s) => s.n) : []);

  const reset = (fn: () => void) => {
    fn();
    setShown(1);
  };
  const toggleLost = (n: number) => reset(() => setLost((l) => (l.includes(n) ? l.filter((x) => x !== n) : [...l, n])));

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 滑动窗口与超时重传</span>
        <span className="font-mono text-[12px] text-fg-3">
          第 {Math.min(shown, rounds.length)}/{rounds.length} 轮
        </span>
      </div>

      <div className="lab-controls">
        {WINDOW_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="lab-btn"
            onClick={() =>
              reset(() => {
                setTotal(p.total);
                setWin(p.window);
                setLost(p.lost);
                setAdaptive(false);
              })
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          段数
          <select value={total} onChange={(e) => reset(() => { const t = Number(e.target.value); setTotal(t); setLost((l) => l.filter((x) => x <= t)); })} className="lab-select" aria-label="segments">
            {[4, 6, 8, 10, 12].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          Window size
          <select value={win} onChange={(e) => reset(() => setWin(Number(e.target.value)))} className="lab-select" aria-label="window">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" checked={adaptive} onChange={(e) => reset(() => setAdaptive(e.target.checked))} />
          窗口随网络状况伸缩（超时减半，顺利 +1）
        </label>
      </div>

      <p className="mt-3 text-[13px] text-fg-3">点下面的格子设定「第一次发送时丢失」的段：</p>
      <div className="win-strip" role="group" aria-label="segments">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const state = n <= acked ? "win-acked" : inFlight.has(n) ? "win-flight" : "";
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggleLost(n)}
              className={`win-seg ${state} ${lost.includes(n) ? "win-lost" : ""} ${everLost.has(n) && n > acked ? "win-dropped" : ""}`}
              title={lost.includes(n) ? "会丢一次（再点取消）" : "点一下：让这一段第一次发送时丢失"}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[12px] text-fg-3">绿色 = 已确认 · 蓝色 = 本轮发出 · 红框 = 设定会丢</p>

      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={shown >= rounds.length} onClick={() => setShown(shown + 1)}>
          ▶ 下一轮
        </button>
        <button type="button" className="lab-btn" disabled={shown >= rounds.length} onClick={() => setShown(rounds.length)}>
          全部显示
        </button>
        <button type="button" className="lab-btn" onClick={() => setShown(1)}>
          重来
        </button>
      </div>

      {cur && (
        <p className={`lab-decision ${cur.timeout ? "lab-flood" : "lab-forward"}`}>
          <b>
            {cur.timeout
              ? `⏰ 段 ${cur.ack} 没到 → 接收方一直回 ACK ${cur.ack} → 计时器到 0，下一轮重传段 ${cur.ack}`
              : cur.ack > total
                ? `✓ 全部 ${total} 段送达（ACK ${cur.ack}）`
                : `✓ 收到 ACK ${cur.ack}：窗口滑到 ${cur.ack} – ${Math.min(total, cur.ack + cur.nextWindow - 1)}`}
          </b>
          <span>
            ACK {cur.ack} 是<strong>期望型确认</strong>：「{cur.ack - 1} 及之前都收到了，下一个请发 {cur.ack}」。
            {cur.timeout && "后面已经到的段先放在接收方的缓冲区里，补上缺的那段后一次性确认。"}
            {adaptive && cur.nextWindow !== cur.window && ` 窗口 ${cur.window} → ${cur.nextWindow}。`}
          </span>
        </p>
      )}

      <div className="table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>轮</th>
              <th>窗口</th>
              <th>发送方发出</th>
              <th>接收方回</th>
            </tr>
          </thead>
          <tbody>
            {upto.map((r, i) => (
              <tr key={i} className={i === upto.length - 1 ? "lab-hot" : ""}>
                <td className="font-mono">{i + 1}</td>
                <td className="font-mono whitespace-nowrap">
                  {r.winStart}–{Math.min(total, r.winStart + r.window - 1)}（{r.window}）
                </td>
                <td className="font-mono">
                  {r.sent.map((s) => `${s.retx ? "↻" : ""}${s.n}${s.arrived ? "" : "✗"}`).join("  ")}
                </td>
                <td className="font-mono">
                  ACK {r.ack}
                  {r.timeout ? " ⏰" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-fg-3">↻ = 重传 · ✗ = 路上丢了 · ⏰ = 重传计时器超时</p>
    </div>
  );
}
