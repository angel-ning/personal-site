"use client";

import { useState } from "react";
import { analyzeIpv6, IPV6_PRESETS } from "./ipv6-logic.mjs";

type Info = { en: string; zh: string; range: string; like: string; note: string };
type Run = { start: number; len: number };
type Analysis = {
  error?: string;
  hextets: number[];
  prefix: number | null;
  preferred: string;
  omitted: string;
  compressed: string;
  options: string[];
  runs: Run[];
  type: string;
  info: Info;
  binaryFirst: string;
  solicited?: string;
  parts?: { routing: string; subnet: string; iid: string };
};

// Type an IPv6 address: preferred → Rule 1 → Rule 2, its type, and (for a GUA) prefix / subnet ID / interface ID.
export function Ipv6Lab({ initial = "2001:0DB8:0000:0000:ABCD:0000:0000:0100" }: { initial?: string }) {
  const [text, setText] = useState(initial);
  const r = analyzeIpv6(text) as unknown as Analysis;
  const longest = r.error ? null : r.runs.reduce<Run | null>((a, x) => (!a || x.len > a.len ? x : a), null);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · IPv6 地址压缩与类型</span>
      </div>
      <div className="lab-controls">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label="IPv6 address"
          className="lab-select w-full max-w-[30em] px-2 py-1 text-[13px]"
        />
      </div>
      <div className="lab-controls">
        {IPV6_PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => setText(p)} className={`lab-btn font-mono text-[11.5px] ${text === p ? "lab-btn-on" : ""}`}>
            {p.length > 26 ? p.slice(0, 24) + "…" : p}
          </button>
        ))}
      </div>

      {r.error ? (
        <p className="lab-decision lab-flood">
          <b>不是合法的 IPv6 地址</b>
          <span>{r.error}</span>
        </p>
      ) : (
        <>
          <div className="v6-hextets">
            {r.hextets.map((n, i) => {
              const zero = longest && i >= longest.start && i < longest.start + longest.len;
              return (
                <div key={i} className={`v6-hx ${zero ? "v6-zero" : ""} ${r.parts ? (i < 3 ? "v6-grp" : i === 3 ? "v6-sub" : "v6-iid") : ""}`}>
                  <span className="font-mono">{n.toString(16).toUpperCase().padStart(4, "0")}</span>
                  <small>hextet {i + 1}</small>
                </div>
              );
            })}
          </div>
          <table className="lab-table">
            <tbody>
              <tr>
                <th>Preferred（完整）</th>
                <td className="font-mono break-all">{r.preferred}</td>
              </tr>
              <tr>
                <th>Rule 1 去前导 0</th>
                <td className="font-mono break-all">{r.omitted}</td>
              </tr>
              <tr>
                <th>Rule 2 用一次 ::</th>
                <td>
                  <b className="font-mono break-all">{r.compressed}</b>
                  {r.options.length > 1 && (
                    <div className="text-fg-3 text-[12.5px]">
                      也合法：{r.options.slice(1).map((o) => <code key={o} className="mr-1">{o}</code>)}——但「::」只能用一次（压缩最长的那段最短）
                    </div>
                  )}
                  {r.runs.length === 0 && <div className="text-fg-3 text-[12.5px]">没有全 0 的 hextet，不能用「::」</div>}
                </td>
              </tr>
              <tr>
                <th>类型</th>
                <td>
                  <b>{r.info.en}</b> · {r.info.zh} <code>{r.info.range}</code>
                  <div className="text-fg-3 text-[12.5px]">
                    {r.info.note}
                    {r.info.like !== "—" && <>；相当于 {r.info.like}</>}
                  </div>
                  <div className="text-fg-3 text-[12.5px]">
                    第一个 hextet 的二进制：<code>{r.binaryFirst.slice(0, 4)} {r.binaryFirst.slice(4, 8)} {r.binaryFirst.slice(8, 12)} {r.binaryFirst.slice(12)}</code>
                  </div>
                </td>
              </tr>
              {r.parts && (
                <tr>
                  <th>GUA 三部分</th>
                  <td>
                    <span className="v6-tag v6-grp">Global Routing Prefix {r.parts.routing}</span>{" "}
                    <span className="v6-tag v6-sub">Subnet ID {r.parts.subnet}</span>{" "}
                    <span className="v6-tag v6-iid">Interface ID {r.parts.iid}</span>
                    <div className="text-fg-3 text-[12.5px]">按课件的 /48 + 16 位 Subnet ID = /64 + 64 位 Interface ID 来拆（Slide 19–20）</div>
                  </td>
                </tr>
              )}
              {r.solicited && (
                <tr>
                  <th>Solicited-node</th>
                  <td>
                    <code>{r.solicited}</code>
                    <div className="text-fg-3 text-[12.5px]">FF02::1:FF00:0/104 + 这个地址最右边 24 位（Slide 40–41）</div>
                  </td>
                </tr>
              )}
              {r.prefix != null && (
                <tr>
                  <th>/{r.prefix}</th>
                  <td>前 {r.prefix} 位是网络部分（prefix），后 {128 - r.prefix} 位是 Interface ID</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
