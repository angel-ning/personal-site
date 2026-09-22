"use client";

import { useState } from "react";
import { analyzeIp, fmtCount, IP_PRESETS as PRESETS } from "./ip-logic.mjs";

type Analysis = {
  octets: number[];
  binary: string[];
  cls: string;
  lead: string;
  netOctets: number;
  note: string;
  scope: "private" | "public" | "loopback" | "special";
  privateRange?: string;
  pattern?: string;
  network?: string;
  broadcast?: string;
  firstHost?: string;
  lastHost?: string;
  hostBits?: number;
  hosts?: number;
  role?: "host" | "network" | "broadcast";
};

const ROLE: Record<string, string> = {
  host: "普通主机地址，可以分配给接口",
  network: "这就是 network address 本身（host 全 0），不能分配给主机",
  broadcast: "这就是 broadcast address（host 全 1），不能分配给主机",
};

// Type an IPv4 address and see its binary form, class, N/H split, and the reserved addresses of its network.
export function IpAnalyzer({ initial = "130.6.8.9" }: { initial?: string }) {
  const [text, setText] = useState(initial);
  const r = analyzeIp(text) as unknown as Analysis | null;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · IPv4 地址分析（classful）</span>
      </div>
      <div className="lab-controls">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          inputMode="decimal"
          aria-label="IPv4 address"
          className="lab-select w-[11em] px-2 py-1 text-[14px]"
        />
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setText(p)}
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[12px] ${text === p ? "border-accent text-accent" : "border-line text-fg-2 hover:border-line-strong"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {!r ? (
        <p className="lab-decision lab-flood">
          <b>不是合法的 IPv4 地址</b>
          <span>要写成 4 个用点隔开的十进制数，每个在 0–255 之间，例如 10.1.5.66。</span>
        </p>
      ) : (
        <>
          <div className="ip-octets">
            {r.octets.map((v, i) => {
              const part = r.netOctets ? (i < r.netOctets ? "net" : "host") : "none";
              return (
                <div key={i} className={`ip-octet ip-${part}`}>
                  <span className="ip-dec">{v}</span>
                  <span className="ip-bin">
                    {i === 0 ? (
                      <>
                        <b className="ip-lead">{r.binary[0].slice(0, r.lead.length)}</b>
                        {r.binary[0].slice(r.lead.length)}
                      </>
                    ) : (
                      r.binary[i]
                    )}
                  </span>
                  <small>{part === "net" ? "Network" : part === "host" ? "Host" : "—"}</small>
                </div>
              );
            })}
          </div>

          <table className="lab-table">
            <tbody>
              <tr>
                <th>Class</th>
                <td>
                  <b>Class {r.cls}</b>：第一个 octet 开头是 <code>{r.lead}</code>
                  {r.pattern && <>，格式 {r.pattern}</>}
                  {r.note && <div className="text-fg-3">{r.note}</div>}
                </td>
              </tr>
              {r.network && (
                <>
                  <tr>
                    <th>Network address</th>
                    <td className="font-mono">{r.network}（host 全 0）</td>
                  </tr>
                  <tr>
                    <th>Broadcast address</th>
                    <td className="font-mono">{r.broadcast}（host 全 1）</td>
                  </tr>
                  <tr>
                    <th>可用主机范围</th>
                    <td className="font-mono">
                      {r.firstHost} – {r.lastHost}
                      <div className="font-sans text-fg-3">
                        2^{r.hostBits} − 2 = {fmtCount(r.hosts ?? 0)} 个（减掉 network 和 broadcast）
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>这个地址是</th>
                    <td>{ROLE[r.role as string]}</td>
                  </tr>
                </>
              )}
              <tr>
                <th>Public / Private</th>
                <td>
                  {r.scope === "private"
                    ? `Private（${r.privateRange}）：Internet 路由器会直接丢弃，出网要靠 NAT`
                    : r.scope === "public"
                      ? "Public：全球唯一，可以在 Internet 上路由"
                      : r.scope === "loopback"
                        ? "Loopback：只在本机内部使用"
                        : "特殊用途地址"}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
