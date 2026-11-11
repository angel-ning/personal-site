"use client";

import { useState } from "react";
import { WILDCARD_PRESETS, ipToInt, intToIp, octetBin, wcCompare, wcSummary, prefixToMask, maskToWildcard, rangeToWildcard } from "./acl-logic.mjs";

type Mode = "match" | "mask" | "range";
type Bit = { w: number; a: number; b: number; check: boolean; diff: boolean };

// One 32-bit row split into octets; bits the wildcard ignores are faded, the first differing checked bit is red.
function BitRow({ label, value, bits, pick }: { label: string; value: string; bits: Bit[]; pick: (b: Bit) => number }) {
  return (
    <tr>
      <th>{label}</th>
      <td className="font-mono" style={{ whiteSpace: "nowrap" }}>
        {value}
      </td>
      <td className="wc-bits">
        {[0, 1, 2, 3].map((o) => (
          <span key={o} className="wc-octet">
            {bits.slice(o * 8, o * 8 + 8).map((b, i) => (
              <span key={i} className={`wc-bit ${b.check ? "" : "wc-ignore"} ${b.diff ? "wc-diff" : ""}`}>
                {pick(b)}
              </span>
            ))}
          </span>
        ))}
      </td>
    </tr>
  );
}

// Slides 19–26 + board p.4–5: address + wildcard → which bits are compared and which addresses match;
// subnet mask → wildcard (255.255.255.255 − mask); a range of addresses → the wildcard that covers it.
export function WildcardLab({ start = "match" }: { start?: Mode }) {
  const [mode, setMode] = useState<Mode>(start);
  const [m, setM] = useState(WILDCARD_PRESETS.match[0]);
  const [k, setK] = useState(WILDCARD_PRESETS.mask[1]);
  const [r, setR] = useState(WILDCARD_PRESETS.range[0]);

  const addr = ipToInt(m.addr);
  const wc = ipToInt(m.wc);
  const ip = ipToInt(m.ip);
  const ok = addr !== null && wc !== null && ip !== null;
  const cmp = ok ? wcCompare(addr, wc, ip) : null;
  const sum = ok ? wcSummary(addr, wc) : null;

  const mask = prefixToMask(k.prefix);
  const kwc = maskToWildcard(mask);
  const knet = ipToInt(k.net);

  const rf = ipToInt(r.first);
  const rl = ipToInt(r.last);
  const rw = rf !== null && rl !== null ? rangeToWildcard(rf, rl) : null;
  // The octet where the two ends first differ is the one the board works out in binary.
  const oi = rf !== null && rl !== null ? Math.max(0, intToIp(rf).split(".").findIndex((o, i) => o !== intToIp(rl).split(".")[i])) : 2;
  const oct = (n: number) => Number(intToIp(n).split(".")[oi]);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · Wildcard mask：0 = 必须一样，1 = 不管
        </span>
      </div>
      <div className="lab-controls">
        {(
          [
            ["match", "① 地址 + 通配符 → 匹配谁"],
            ["mask", "② 子网 → 通配符"],
            ["range", "③ 一段范围 → 通配符"],
          ] as [Mode, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" className={`lab-btn ${mode === id ? "lab-btn-on" : ""}`} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "match" && (
        <>
          <div className="lab-controls">
            {WILDCARD_PRESETS.match.map((p) => (
              <button key={p.label} type="button" className={`lab-btn ${p.label === m.label ? "lab-btn-on" : ""}`} onClick={() => setM(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="lab-controls">
            <label>
              ACL 里的地址 <input className="lab-select" style={{ width: "9em" }} value={m.addr} onChange={(e) => setM({ ...m, label: "", addr: e.target.value })} />
            </label>
            <label>
              通配符 <input className="lab-select" style={{ width: "9em" }} value={m.wc} onChange={(e) => setM({ ...m, label: "", wc: e.target.value })} />
            </label>
            <label>
              包的源地址 <input className="lab-select" style={{ width: "9em" }} value={m.ip} onChange={(e) => setM({ ...m, label: "", ip: e.target.value })} />
            </label>
          </div>
          {ok && cmp && sum ? (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="lab-table" style={{ minWidth: "40em" }}>
                  <tbody>
                    <BitRow label="包的源地址" value={m.ip} bits={cmp.bits} pick={(b) => b.b} />
                    <BitRow label="ACL 里的地址" value={m.addr} bits={cmp.bits} pick={(b) => b.a} />
                    <BitRow label="通配符" value={m.wc} bits={cmp.bits} pick={(b) => b.w} />
                  </tbody>
                </table>
              </div>
              <div className={`lab-decision ${cmp.match ? "lab-forward" : "lab-flood"}`}>
                <b>{cmp.match ? "匹配：所有要检查的位都一样" : `不匹配：第 ${cmp.firstDiff! + 1} 位要检查，但两边不一样（红色）`}</b>
                <span>
                  通配符有 {32 - sum.ones} 个 0（要比）和 {sum.ones} 个 1（不管），能匹配 2^{sum.ones} = <b>{sum.count.toLocaleString()}</b> 个地址
                  {sum.contiguous ? (
                    <>
                      ：<b className="font-mono">{intToIp(sum.first)}</b> 到 <b className="font-mono">{intToIp(sum.last)}</b>
                    </>
                  ) : "（1 不连续，匹配的地址不是一整段）"}
                  。
                  {sum.normalized && ` ACL 里的地址在「不管」的位上不是 0，IOS 会自动改写成 ${intToIp(sum.base)}。`}
                  {m.wc.trim() === "0.0.0.0" && " 0.0.0.0 = 每一位都要一样 = 只有这一台主机，可以写成 host。"}
                  {m.wc.trim() === "255.255.255.255" && " 255.255.255.255 = 一位都不比 = 任何地址，可以写成 any。"}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-fg-3">三个格子都要填 IPv4 点分十进制。</p>
          )}
        </>
      )}

      {mode === "mask" && (
        <>
          <div className="lab-controls">
            {WILDCARD_PRESETS.mask.map((p) => (
              <button key={p.label} type="button" className={`lab-btn ${p.label === k.label ? "lab-btn-on" : ""}`} onClick={() => setK(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="lab-controls">
            <label>
              子网 <input className="lab-select" style={{ width: "9em" }} value={k.net} onChange={(e) => setK({ ...k, label: "", net: e.target.value })} />
            </label>
            <label>
              / <input className="lab-select" style={{ width: "4em" }} type="number" min={0} max={32} value={k.prefix} onChange={(e) => setK({ ...k, label: "", prefix: Math.min(32, Math.max(0, Number(e.target.value))) })} />
            </label>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="lab-table" style={{ minWidth: "34em" }}>
              <tbody>
                <tr>
                  <th>Step 1 前缀 → 掩码</th>
                  <td className="font-mono">/{k.prefix} = {intToIp(mask)}</td>
                  <td className="font-mono text-fg-3">{intToIp(mask).split(".").map((o) => octetBin(Number(o))).join(" ")}</td>
                </tr>
                <tr>
                  <th>Step 2 用 255.255.255.255 减</th>
                  <td className="font-mono">
                    255.255.255.255 − {intToIp(mask)} = <b>{intToIp(kwc)}</b>
                  </td>
                  <td className="font-mono text-fg-3">{intToIp(kwc).split(".").map((o) => octetBin(Number(o))).join(" ")}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {knet !== null && (
            <div className="lab-decision lab-forward">
              <b className="font-mono">access-list 6 permit {intToIp(wcSummary(knet, kwc).base)} {intToIp(kwc)}</b>
              <span>
                匹配 {intToIp(wcSummary(knet, kwc).first)} – {intToIp(wcSummary(knet, kwc).last)}，共 {wcSummary(knet, kwc).count.toLocaleString()} 个地址。子网掩码的 1 = 网络位，通配符把它翻过来：0 = 网络位要一样，1 = 主机位不管。
              </span>
            </div>
          )}
        </>
      )}

      {mode === "range" && (
        <>
          <div className="lab-controls">
            {WILDCARD_PRESETS.range.map((p) => (
              <button key={p.label} type="button" className={`lab-btn ${p.label === r.label ? "lab-btn-on" : ""}`} onClick={() => setR(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="lab-controls">
            <label>
              从 <input className="lab-select" style={{ width: "9em" }} value={r.first} onChange={(e) => setR({ ...r, label: "", first: e.target.value })} />
            </label>
            <label>
              到 <input className="lab-select" style={{ width: "9em" }} value={r.last} onChange={(e) => setR({ ...r, label: "", last: e.target.value })} />
            </label>
          </div>
          {rw && rf !== null && rl !== null && (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="lab-table" style={{ minWidth: "30em" }}>
                  <thead>
                    <tr>
                      <th>第 {oi + 1} 段</th>
                      <th>二进制（128 64 32 16 8 4 2 1）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[rf, rl].map((x, i) => (
                      <tr key={i}>
                        <td className="font-mono">{oct(x)}</td>
                        <td className="font-mono">{octetBin(oct(x))}</td>
                      </tr>
                    ))}
                    <tr className="lab-hot">
                      <td>通配符第 {oi + 1} 段</td>
                      <td className="font-mono">
                        {octetBin(oct(rw.wc))} = {oct(rw.wc)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={`lab-decision ${rw.exact ? "lab-forward" : "lab-flood"}`}>
                <b className="font-mono">
                  {intToIp(rw.addr)} {intToIp(rw.wc)}
                </b>
                <span>
                  {rw.exact
                    ? `两端只在最后 ${Math.log2(rw.wc + 1)} 位不一样，前面的位全都相同 → 这些位设 1（不管），其余设 0。正好盖住 ${r.first} – ${r.last}。`
                    : `这段范围没有对齐到 2 的幂：能盖住它的最小一块是 ${intToIp(rw.addr)} – ${intToIp(rw.last)}，会多匹配别的地址。要精确匹配就得拆成好几行 ACL。`}
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
