"use client";

import { useState } from "react";
import { fmtBig, ipv6SubnetPlan, SUBNET6_PRESETS } from "./ipv6-logic.mjs";

type Row = { i: bigint; id: string; network: string; preferred: string };
type Plan = {
  error?: string;
  block: string;
  base: number;
  newPrefix: number;
  bits: number;
  count: bigint;
  iidBits: number;
  nibble: boolean;
  subnet: (i: number | bigint) => Row;
  last: Row;
  locate: (t: string) => { outside: boolean; i?: bigint; network?: string } | null;
};

const PREFIXES = [52, 56, 60, 62, 64, 68, 72, 80];

// Split an IPv6 block (usually a /48) into subnets by extending the prefix — the IPv6 version of week 4's SubnetLab.
export function Ipv6SubnetLab() {
  const [block, setBlock] = useState(SUBNET6_PRESETS[0].block);
  const [prefix, setPrefix] = useState(SUBNET6_PRESETS[0].prefix);
  const [probe, setProbe] = useState(SUBNET6_PRESETS[0].probe);
  const [limit, setLimit] = useState(6);
  const p = ipv6SubnetPlan(block, prefix) as unknown as Plan;
  const hit = p.error ? null : p.locate(probe);
  const shown = p.error ? 0 : Number(p.count < BigInt(limit) ? p.count : BigInt(limit));

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · IPv6 子网划分</span>
      </div>
      <div className="lab-controls">
        {SUBNET6_PRESETS.map((x) => (
          <button
            key={x.label}
            type="button"
            className={`lab-btn ${block === x.block && prefix === x.prefix ? "lab-btn-on" : ""}`}
            onClick={() => { setBlock(x.block); setPrefix(x.prefix); setProbe(x.probe); setLimit(6); }}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          地址块
          <input value={block} onChange={(e) => setBlock(e.target.value)} spellCheck={false} aria-label="block" className="lab-select w-[13em] px-2 py-0.5" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          切成
          <select value={prefix} onChange={(e) => { setPrefix(Number(e.target.value)); setLimit(6); }} className="lab-select" aria-label="new prefix">
            {PREFIXES.map((n) => (
              <option key={n} value={n}>
                /{n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {p.error ? (
        <p className="lab-decision lab-flood">
          <b>没法划分</b>
          <span>{p.error}（地址块写成 2001:DB8:ACAD::/48 这样的格式）</span>
        </p>
      ) : (
        <>
          <table className="lab-table">
            <tbody>
              <tr>
                <th>借了几位</th>
                <td>
                  /{p.base} → /{p.newPrefix}：借 <b>{p.bits}</b> 位 → 2<sup>{p.bits}</sup> = <b>{fmtBig(p.count)}</b> 个子网
                  {p.newPrefix > 64 && <span className="text-[var(--c-warn)]">（已经借进 Interface ID 了，Slide 45）</span>}
                </td>
              </tr>
              <tr>
                <th>每个子网</th>
                <td>
                  Interface ID 剩 <b>{p.iidBits}</b> 位 = 2<sup>{p.iidBits}</sup> 个地址
                  <div className="text-fg-3 text-[12.5px]">
                    {p.nibble ? "借的位数是 4 的倍数（nibble boundary）：每个子网正好换一个十六进制位，最好读" : "借的位数不是 4 的倍数，子网号会跨在一个十六进制位中间，读起来麻烦——实际都按 nibble 划分"}
                    。IPv6 不用减 2：没有 broadcast 地址
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <table className="lab-table">
            <thead>
              <tr>
                <th>#</th>
                <th>子网（压缩写法）</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: shown }, (_, i) => p.subnet(i)).map((s) => (
                <tr key={s.network} className={hit && !hit.outside && hit.i === s.i ? "lab-hot" : ""}>
                  <td className="font-mono">{s.id}</td>
                  <td className="font-mono">{s.network}</td>
                </tr>
              ))}
              {p.count > BigInt(shown) && (
                <>
                  <tr>
                    <td colSpan={2} className="text-fg-3">
                      …（中间 {fmtBig(p.count - BigInt(shown) - BigInt(1))} 个）
                      {shown < 64 && (
                        <button type="button" className="mcq-retry ml-2" onClick={() => setLimit(limit * 2)}>
                          多看几个
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-mono">{p.last.id}</td>
                    <td className="font-mono">{p.last.network}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          <div className="lab-controls">
            <label className="flex items-center gap-1.5 text-[13px]">
              这个地址在哪个子网？
              <input value={probe} onChange={(e) => setProbe(e.target.value)} spellCheck={false} aria-label="address" className="lab-select w-[16em] px-2 py-0.5" />
            </label>
          </div>
          {hit && (
            <p className={`lab-decision ${hit.outside ? "lab-flood" : "lab-forward"}`}>
              {hit.outside ? (
                <b>不在 {p.block} 这个地址块里</b>
              ) : (
                <>
                  <b>
                    第 {fmtBig(hit.i as bigint)} 号子网（十六进制 {(hit.i as bigint).toString(16).toUpperCase()}）：{hit.network}
                  </b>
                  <span>和 IPv4 一样：保留前 /{p.newPrefix} 位，后面全部清零（AND）。</span>
                </>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}
