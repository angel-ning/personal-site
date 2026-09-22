"use client";

import { useState } from "react";

// The professor's toy FCS (M1 Supplementary p.9): weight each bit by its position and add up.
// Real Ethernet uses CRC-32, but the idea is the same — sender and receiver compute the
// same function, and a mismatch means the frame was damaged on the wire.
const fcs = (bits: number[]) => bits.reduce((sum, b, i) => sum + b * (i + 1), 0);

export function FcsDemo() {
  const [sent, setSent] = useState([1, 1, 0, 1]);
  const [noise, setNoise] = useState<number | null>(2);
  const received = sent.map((b, i) => (i === noise ? 1 - b : b));
  const a = fcs(sent);
  const b = fcs(received);
  const ok = a === b;

  const bit = (key: number, v: number, onClick?: () => void, flipped?: boolean) => (
    <button key={key} type="button" onClick={onClick} disabled={!onClick} className={`fcs-bit ${flipped ? "fcs-flip" : ""}`}>
      {v}
    </button>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · FCS 差错检测</span>
        <span className="text-[12px] text-fg-3">点比特可以改；点「线路干扰」选哪一位被打翻</span>
      </div>
      <div className="fcs-grid">
        <span className="fcs-label">发送方 bits</span>
        <span className="flex gap-1.5">{sent.map((v, i) => bit(i, v, () => setSent(sent.map((x, j) => (j === i ? 1 - x : x)))))}</span>
        <span className="fcs-calc">
          FCS = {sent.map((v, i) => `${v}×${i + 1}`).join(" + ")} = <b>{a}</b>
        </span>

        <span className="fcs-label">线路干扰</span>
        <span className="flex flex-wrap gap-1.5">
          {[null, 0, 1, 2, 3].map((i) => (
            <button
              key={String(i)}
              type="button"
              onClick={() => setNoise(i)}
              className={`rounded-full border px-2.5 py-0.5 text-[12px] ${noise === i ? "border-accent text-accent" : "border-line text-fg-2"}`}
            >
              {i === null ? "无" : `第 ${i + 1} 位`}
            </button>
          ))}
        </span>
        <span />

        <span className="fcs-label">接收方 bits</span>
        <span className="flex gap-1.5">{received.map((v, i) => bit(i, v, undefined, i === noise))}</span>
        <span className="fcs-calc">
          重算 = {received.map((v, i) => `${v}×${i + 1}`).join(" + ")} = <b>{b}</b>
        </span>
      </div>
      <p className={`lab-decision ${ok ? "lab-forward" : "lab-flood"}`}>
        <b>{ok ? `${b} = ${a} ✓ 接收，交给上一层` : `${b} ≠ ${a} ✗ Discard 丢弃这一帧`}</b>
        <span>
          {ok
            ? "帧尾的 FCS 和自己算出来的一致，说明传输中没有被改动。"
            : "数据链路层只负责「发现错误」(error detection)，直接丢弃；要不要重发由上层（如 TCP）决定。"}
        </span>
      </p>
    </div>
  );
}
