"use client";

import { useState } from "react";
import { classifyPort, demux, openConnections, PORT_PRESETS, SERVERS } from "./tcp-logic.mjs";

type Pair = [string | number, string | number];
type Conn = { n: number; server: (typeof SERVERS)[number]; cport: number; request: { ip: Pair; mac: Pair; port: Pair }; reply: { ip: Pair; mac: Pair; port: Pair } };
type PortInfo = { port: number; range: string; label: string; who: string; known: { proto: string; app: string } | null };

const pair = (p: Pair) => `(${p[0]}, ${p[1]})`;

// Classify a port number, then open browser windows to the board's two web servers and watch
// how source ports keep the conversations apart (multiplexing / demultiplexing).
export function PortLab() {
  const [text, setText] = useState("80");
  const [opened, setOpened] = useState<string[]>(["UST", "FB"]);
  const [dport, setDport] = useState("49153");

  const info = classifyPort(text.trim() === "" ? NaN : text) as PortInfo | null;
  const conns = openConnections(opened) as Conn[];
  const target = demux(conns, dport) as Conn | null;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 端口号与多路复用</span>
      </div>

      <div className="lab-controls">
        <input value={text} onChange={(e) => setText(e.target.value)} inputMode="numeric" aria-label="port" className="lab-select w-[7em] px-2 py-1 text-[14px]" />
        {PORT_PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => setText(String(p))} className={`lab-btn font-mono ${text === String(p) ? "lab-btn-on" : ""}`}>
            {p}
          </button>
        ))}
      </div>
      {info ? (
        <p className={`lab-decision ${info.range === "well-known" ? "lab-forward" : info.range === "registered" ? "lab-filter" : "lab-flood"}`}>
          <b>
            {info.port}：{info.label}
            {info.known && ` · ${info.known.proto} ${info.known.app}`}
          </b>
          <span>{info.who}</span>
        </p>
      ) : (
        <p className="lab-decision lab-flood">
          <b>端口号是 16 位：0 – 65535 的整数</b>
        </p>
      )}

      <p className="mt-4 text-[13px] font-semibold">板书 p.5：Client (IP-1 / MAC-1) 同时打开几个浏览器窗口</p>
      <div className="lab-controls">
        {SERVERS.map((s) => (
          <button key={s.id} type="button" className="lab-btn" disabled={opened.length >= 6} onClick={() => setOpened([...opened, s.id])}>
            ＋ 新窗口访问 {s.id}（{s.ip}:{s.port}）
          </button>
        ))}
        <button type="button" className="lab-btn" onClick={() => setOpened([])}>
          全部关闭
        </button>
      </div>

      <div className="table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>窗口</th>
              <th>方向</th>
              <th>IP (S, D)</th>
              <th>MAC (S, D)</th>
              <th>Port (S, D)</th>
            </tr>
          </thead>
          <tbody>
            {conns.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-fg-3">
                  还没有连接：点上面的按钮打开一个窗口
                </td>
              </tr>
            ) : (
              conns.flatMap((c) => [
                <tr key={`${c.n}q`} className={target?.n === c.n ? "lab-hot" : ""}>
                  <td rowSpan={2} className="whitespace-nowrap">
                    #{c.n} → {c.server.id}
                  </td>
                  <td className="whitespace-nowrap">PC → {c.server.id}</td>
                  <td className="font-mono whitespace-nowrap">{pair(c.request.ip)}</td>
                  <td className="font-mono whitespace-nowrap">{pair(c.request.mac)}</td>
                  <td className="font-mono whitespace-nowrap">{pair(c.request.port)}</td>
                </tr>,
                <tr key={`${c.n}r`} className={target?.n === c.n ? "lab-hot" : ""}>
                  <td className="whitespace-nowrap">{c.server.id} → PC</td>
                  <td className="font-mono whitespace-nowrap">{pair(c.reply.ip)}</td>
                  <td className="font-mono whitespace-nowrap">{pair(c.reply.mac)}</td>
                  <td className="font-mono whitespace-nowrap">{pair(c.reply.port)}</td>
                </tr>,
              ])
            )}
          </tbody>
        </table>
      </div>

      <div className="lab-controls">
        <span className="text-[13px]">PC 收到一个段，Dest. Port =</span>
        <input value={dport} onChange={(e) => setDport(e.target.value)} inputMode="numeric" aria-label="destination port" className="lab-select w-[6.5em] px-2 py-0.5" />
      </div>
      <p className={`lab-decision ${target ? "lab-forward" : "lab-flood"}`}>
        <b>{target ? `交给窗口 #${target.n}（访问 ${target.server.id} 的那个）` : "没有应用在用这个端口 → 丢弃"}</b>
        <span>
          {target
            ? `IP 层只负责把包送到 IP-1 这台电脑；传输层看目的端口 ${target.cport}，才知道该交给哪个窗口（Slide 17：Hey TCP, destination port is … give the data to Browser2!）。`
            : "两个 web server 都用 80，区分不同对话靠的是客户端这边各不相同的源端口。"}
        </span>
      </p>
    </div>
  );
}
