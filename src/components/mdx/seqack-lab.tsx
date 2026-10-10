"use client";

import { useState } from "react";
import { SEQACK_PRESETS, seqAckLadder, ladderSvg, arrowLabel } from "./seqack-logic.mjs";

type Ev = { from: string; to: string; flags: string; seq: number; ack: number | null; lost?: boolean; retx?: boolean; note: string };
type Preset = (typeof SEQACK_PRESETS)[number];

const int = (v: string, lo: number, hi: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};

// Draw the SEQ / ACK ladder from two ISNs and a window size (handshake → window of segments → ACK → …).
export function SeqAckLab({ preset = 0, hide: hideAtStart = false }: { preset?: number; hide?: boolean }) {
  const p0 = SEQACK_PRESETS[preset] ?? SEQACK_PRESETS[0];
  const [names, setNames] = useState<[string, string]>([p0.a, p0.b]);
  const [aIsn, setAIsn] = useState(String(p0.aIsn));
  const [bIsn, setBIsn] = useState(String(p0.bIsn));
  const [win, setWin] = useState(String(p0.window));
  const [total, setTotal] = useState(String(p0.total));
  const [unit, setUnit] = useState<"segment" | "byte">(p0.unit as "segment" | "byte");
  const [size, setSize] = useState(String(p0.size));
  const [lost, setLost] = useState(p0.lost.length ? String(p0.lost[0]) : "");
  const [hide, setHide] = useState(hideAtStart);

  const load = (p: Preset) => {
    setNames([p.a, p.b]);
    setAIsn(String(p.aIsn));
    setBIsn(String(p.bIsn));
    setWin(String(p.window));
    setTotal(String(p.total));
    setUnit(p.unit as "segment" | "byte");
    setSize(String(p.size));
    setLost(p.lost.length ? String(p.lost[0]) : "");
  };

  const A = int(aIsn, 0, 4e9);
  const B = int(bIsn, 0, 4e9);
  const W = int(win, 1, 8);
  const N = int(total, 1, 10);
  const S = unit === "byte" ? int(size, 1, 1e5) : 1;
  const L = lost.trim() === "" ? null : int(lost, 1, N ?? 10);
  const ok = A != null && B != null && W != null && N != null && S != null && (lost.trim() === "" || L != null);
  const ladder = ok ? seqAckLadder({ aIsn: A, bIsn: B, window: W, total: N, unit, size: S, lost: L ? [L] : [], a: names[0], b: names[1] }) : null;
  const svg = ladder ? ladderSvg(ladder, { a: names[0], b: names[1], hide }) : "";
  const current = SEQACK_PRESETS.findIndex(
    (p) => p.aIsn === A && p.bIsn === B && p.window === W && p.total === N && p.unit === unit && (unit === "segment" || p.size === S) && (p.lost[0] ?? null) === L,
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 画 SEQ / ACK 时序图（ISN + window size）</span>
      </div>
      <div className="lab-controls">
        {SEQACK_PRESETS.map((p, i) => (
          <button key={p.label} type="button" className={`lab-btn ${i === current ? "lab-btn-on" : ""}`} onClick={() => load(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          {names[0]} 的 ISN
          <input className="lab-select w-[6.5em] px-2 py-0.5" value={aIsn} inputMode="numeric" onChange={(e) => setAIsn(e.target.value)} aria-label="sender ISN" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          {names[1]} 的 ISN
          <input className="lab-select w-[6.5em] px-2 py-0.5" value={bIsn} inputMode="numeric" onChange={(e) => setBIsn(e.target.value)} aria-label="receiver ISN" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          Window（段）
          <input className="lab-select w-[3.5em] px-2 py-0.5" value={win} inputMode="numeric" onChange={(e) => setWin(e.target.value)} aria-label="window size" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          共几段
          <input className="lab-select w-[3.5em] px-2 py-0.5" value={total} inputMode="numeric" onChange={(e) => setTotal(e.target.value)} aria-label="segments" />
        </label>
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          编号方式
          <select className="lab-select" value={unit} onChange={(e) => setUnit(e.target.value as "segment" | "byte")} aria-label="numbering">
            <option value="segment">按段编号（Slide 23：#10 → ACK 11）</option>
            <option value="byte">按字节编号（真实 TCP）</option>
          </select>
        </label>
        {unit === "byte" && (
          <label className="flex items-center gap-1.5 text-[13px]">
            每段 bytes
            <input className="lab-select w-[5em] px-2 py-0.5" value={size} inputMode="numeric" onChange={(e) => setSize(e.target.value)} aria-label="segment size" />
          </label>
        )}
        <label className="flex items-center gap-1.5 text-[13px]">
          丢第几段
          <input className="lab-select w-[3.5em] px-2 py-0.5" value={lost} placeholder="无" inputMode="numeric" onChange={(e) => setLost(e.target.value)} aria-label="lost segment" />
        </label>
        <label className="addr-toggle">
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /> 隐藏数字（先自己画）
        </label>
      </div>

      {ladder ? (
        <>
          {unit === "byte" && W != null && S != null && (
            <p className="addr-note">
              窗口 {W} 段 × {S} bytes = {W * S} bytes 未确认数据；第一段数据 SEQ = ISN + 1 = {ladder.firstData}（SYN 占掉一个号）。
            </p>
          )}
          <div className="addr-svg sq-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>方向</th>
                  <th>段</th>
                  <th>为什么</th>
                </tr>
              </thead>
              <tbody>
                {(ladder.events as Ev[]).map((e, i) => (
                  <tr key={i} className={e.lost ? "lab-hot" : ""}>
                    <td>{i + 1}</td>
                    <td>
                      {e.from} → {e.to}
                    </td>
                    <td>
                      <code>{arrowLabel(e, hide)}</code>
                    </td>
                    <td className="addr-why">{hide ? "—" : e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="addr-note">规则：ACK = 下一个想要的号（期望型确认）；一个窗口发完才等一个 ACK，ACK 到了窗口往前滑；{names[1]} 不发数据，所以它的 SEQ 一直是 ISN + 1。</p>
        </>
      ) : (
        <p className="addr-note">请填整数：ISN ≥ 0，窗口 1–8 段，共 1–10 段；丢失的段号要在 1 到总段数之间。</p>
      )}
    </div>
  );
}
