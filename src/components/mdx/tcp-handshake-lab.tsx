"use client";

import { useState } from "react";
import { HANDSHAKE_PRESETS, tcpConversation } from "./tcp-logic.mjs";

type Row = { from: "client" | "server"; flags: string; seq: number; ack: number | null; len: number; sport: number; dport: number; why: string };

const parseSizes = (s: string) =>
  s
    .split(/[,，\s]+/)
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 6);

// Pick the two ISNs (and optional data sizes) and step through SYN → SYN-ACK → ACK → data / ACK.
export function TcpHandshakeLab() {
  const [cIsn, setCIsn] = useState("200");
  const [sIsn, setSIsn] = useState("1450");
  const [sizes, setSizes] = useState("");
  const [shown, setShown] = useState(1);

  const valid = /^\d{1,9}$/.test(cIsn) && /^\d{1,9}$/.test(sIsn);
  const rows = valid ? (tcpConversation({ clientIsn: Number(cIsn), serverIsn: Number(sIsn), dataSizes: parseSizes(sizes) }) as Row[]) : [];
  const visible = rows.slice(0, shown);
  const last = visible[visible.length - 1];

  const load = (p: (typeof HANDSHAKE_PRESETS)[number]) => {
    setCIsn(String(p.clientIsn));
    setSIsn(String(p.serverIsn));
    setSizes(p.dataSizes.join(", "));
    setShown(1);
  };
  const edit = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setShown(1);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · TCP 三次握手与 SEQ / ACK</span>
        <span className="font-mono text-[12px] text-fg-3">
          {Math.min(shown, rows.length)}/{rows.length}
        </span>
      </div>

      <div className="lab-controls">
        {HANDSHAKE_PRESETS.map((p) => (
          <button key={p.label} type="button" className="lab-btn" onClick={() => load(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          Client ISN
          <input value={cIsn} onChange={edit(setCIsn)} inputMode="numeric" className="lab-select w-[6.5em] px-2 py-0.5" aria-label="client ISN" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          Server ISN
          <input value={sIsn} onChange={edit(setSIsn)} inputMode="numeric" className="lab-select w-[6.5em] px-2 py-0.5" aria-label="server ISN" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          之后发数据 (bytes)
          <input value={sizes} onChange={edit(setSizes)} placeholder="如 100, 50" className="lab-select w-[8em] px-2 py-0.5" aria-label="data sizes" />
        </label>
      </div>
      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={shown >= rows.length} onClick={() => setShown(shown + 1)}>
          ▶ 下一个 segment
        </button>
        <button type="button" className="lab-btn" disabled={shown >= rows.length} onClick={() => setShown(rows.length)}>
          全部显示
        </button>
        <button type="button" className="lab-btn" onClick={() => setShown(1)}>
          重来
        </button>
      </div>

      {!valid ? (
        <p className="lab-decision lab-flood">
          <b>ISN 要填非负整数</b>
          <span>真实的 ISN 是一个很大的随机数（Slide 9），这里填小一点方便算。</span>
        </p>
      ) : (
        <>
          {last && (
            <p className="lab-decision lab-forward">
              <b>
                {last.from === "client" ? "Client → Server" : "Server → Client"}：{last.flags}
              </b>
              <span>{last.why}</span>
            </p>
          )}
          <div className="table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>方向</th>
                  <th>Flags</th>
                  <th>SEQ</th>
                  <th>ACK</th>
                  <th>Len</th>
                  <th>SPORT → DPORT</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={i} className={i === visible.length - 1 ? "lab-hot" : ""}>
                    <td className="font-mono">{i + 1}</td>
                    <td className="whitespace-nowrap">{r.from === "client" ? "Client ──▶" : "◀── Server"}</td>
                    <td className="font-mono whitespace-nowrap">{r.flags}</td>
                    <td className="font-mono">{r.seq}</td>
                    <td className="font-mono">{r.ack ?? "—"}</td>
                    <td className="font-mono">{r.len}</td>
                    <td className="font-mono whitespace-nowrap">
                      {r.sport} → {r.dport}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
