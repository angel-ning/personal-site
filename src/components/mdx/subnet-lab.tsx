"use client";

import { useState } from "react";
import { MAX_BORROW, parseIp, SUBNET_PRESETS, subnetPlan } from "./subnet-logic.mjs";

type Row = { i: number; subnetBits: string; network: string; first: string; last: string; broadcast: string };
type Located = Row & { role: "network" | "broadcast" | "host"; ipBinary: string[]; netBinary: string[] };
type Plan = {
  cls: "A" | "B" | "C";
  classNetwork: string;
  netBits: number;
  borrow: number;
  prefix: number;
  hostBits: number;
  mask: { dotted: string; binary: string[] };
  defaultMask: { dotted: string };
  subnets: number;
  hostsPerSubnet: number;
  step: { octet: number; value: number } | null;
  subnet: (i: number) => Row;
  locate: (ip: string) => Located | null;
};

const fmt = (n: number) => n.toLocaleString("en-US");
const ROLE = { network: "它是这个子网的 network address（host 全 0），不能给主机", broadcast: "它是这个子网的 broadcast address（host 全 1），不能给主机", host: "普通主机地址，可以分配" };

// 32 bits coloured by role: N = class network bits, S = borrowed subnet bits, H = remaining host bits.
function Bits({ bits, netBits, prefix }: { bits: string[]; netBits: number; prefix: number }) {
  return (
    <span className="sub-bits">
      {bits.map((oct, o) => (
        <span key={o} className="sub-oct">
          {oct.split("").map((b, k) => {
            const i = o * 8 + k;
            return (
              <span key={k} className={i < netBits ? "sb-n" : i < prefix ? "sb-s" : "sb-h"}>
                {b}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

// Borrow n bits from a classful network: mask, subnet table, and which subnet an address falls in (ANDing).
export function SubnetLab() {
  const [addr, setAddr] = useState("192.168.10.0");
  const [borrow, setBorrow] = useState(3);
  const [probe, setProbe] = useState("192.168.10.195");
  const [limit, setLimit] = useState(8);

  const o = parseIp(addr);
  const cls = o && (o[0] >= 1 && o[0] <= 126 ? "A" : o[0] >= 128 && o[0] <= 191 ? "B" : o[0] >= 192 && o[0] <= 223 ? "C" : null);
  const max = cls ? MAX_BORROW[cls as "A" | "B" | "C"] : 0;
  const b = Math.min(borrow, max);
  const p = (cls ? subnetPlan(addr, b) : null) as Plan | null;
  const hit = p ? p.locate(probe) : null;
  const shown = p ? Math.min(limit, p.subnets) : 0;

  const load = (x: (typeof SUBNET_PRESETS)[number]) => {
    setAddr(x.address);
    setBorrow(x.borrow);
    setProbe(x.probe);
    setLimit(8);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 子网划分计算器</span>
      </div>

      <div className="lab-controls">
        {SUBNET_PRESETS.map((x) => (
          <button key={x.label} type="button" className={`lab-btn ${addr === x.address && b === x.borrow ? "lab-btn-on" : ""}`} onClick={() => load(x)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          网络
          <input value={addr} onChange={(e) => setAddr(e.target.value)} spellCheck={false} inputMode="decimal" aria-label="network" className="lab-select w-[10em] px-2 py-0.5" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          借
          <select value={b} onChange={(e) => { setBorrow(Number(e.target.value)); setLimit(8); }} className="lab-select" aria-label="borrowed bits" disabled={!cls}>
            {Array.from({ length: max + 1 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          位
        </label>
      </div>

      {!p ? (
        <p className="lab-decision lab-flood">
          <b>请输入 Class A / B / C 的地址</b>
          <span>例如 192.168.10.0、130.12.0.0、28.0.0.0。Class D / E 和 127.x 不能划分子网。</span>
        </p>
      ) : (
        <>
          <table className="lab-table">
            <tbody>
              <tr>
                <th>Class / 原网络</th>
                <td>
                  <b>Class {p.cls}</b>：{p.classNetwork}，默认掩码 {p.defaultMask.dotted}（/{p.netBits}）
                </td>
              </tr>
              <tr>
                <th>N · S · H</th>
                <td>
                  <div className="font-mono text-[12px]">
                    <Bits
                      bits={[0, 1, 2, 3].map((o) => Array.from({ length: 8 }, (_, k) => (o * 8 + k < p.netBits ? "N" : o * 8 + k < p.prefix ? "S" : "h")).join(""))}
                      netBits={p.netBits}
                      prefix={p.prefix}
                    />
                  </div>
                  <span className="sub-legend">
                    <span className="sb-n">N</span> {p.netBits} 位 + <span className="sb-s">S</span> 借 {p.borrow} 位 + <span className="sb-h">H</span> 剩 {p.hostBits} 位 = 32
                  </span>
                </td>
              </tr>
              <tr>
                <th>Subnet mask</th>
                <td>
                  <b className="font-mono">{p.mask.dotted}</b> = <b className="font-mono">/{p.prefix}</b>
                  <div className="font-mono text-[12px]">
                    <Bits bits={p.mask.binary} netBits={p.netBits} prefix={p.prefix} />
                  </div>
                </td>
              </tr>
              <tr>
                <th>子网数</th>
                <td>
                  2^{p.borrow} = <b>{fmt(p.subnets)}</b>
                </td>
              </tr>
              <tr>
                <th>每个子网主机数</th>
                <td>
                  2^{p.hostBits} − 2 = <b>{fmt(p.hostsPerSubnet)}</b>
                </td>
              </tr>
              {p.step && p.borrow > 0 && (
                <tr>
                  <th>子网间隔</th>
                  <td>
                    第 {p.step.octet} 个 octet 每次 + <b>{p.step.value}</b>（= 256 − 掩码在这一段的值）
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>S.N #</th>
                  <th>子网位</th>
                  <th>Network address</th>
                  <th>Host range</th>
                  <th>Broadcast</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: shown }, (_, i) => p.subnet(i)).map((r) => (
                  <tr key={r.i} className={hit?.i === r.i ? "lab-hot" : ""}>
                    <td className="font-mono">{r.i}</td>
                    <td className="font-mono sb-s">{r.subnetBits || "—"}</td>
                    <td className="font-mono whitespace-nowrap">{r.network}</td>
                    <td className="font-mono whitespace-nowrap">
                      {r.first} – {r.last}
                    </td>
                    <td className="font-mono whitespace-nowrap">{r.broadcast}</td>
                  </tr>
                ))}
                {shown < p.subnets && (
                  <tr>
                    <td colSpan={5} className="text-fg-3">
                      … 共 {fmt(p.subnets)} 个子网，最后一个是 {p.subnet(p.subnets - 1).network} – {p.subnet(p.subnets - 1).broadcast}
                      {hit && hit.i >= shown && `；你查的地址在第 ${hit.i} 个`}
                      <button type="button" className="lab-btn ml-2" onClick={() => setLimit(limit + 8)}>
                        再显示 8 行
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="lab-controls">
            <label className="flex items-center gap-1.5 text-[13px]">
              这个地址在哪个子网？
              <input value={probe} onChange={(e) => setProbe(e.target.value)} spellCheck={false} inputMode="decimal" aria-label="address to locate" className="lab-select w-[10em] px-2 py-0.5" />
            </label>
          </div>
          {hit ? (
            <>
              <div className="table-wrap">
                <table className="lab-table sub-and">
                  <tbody>
                    <tr>
                      <th>IP address</th>
                      <td className="font-mono whitespace-nowrap">{probe.trim()}</td>
                      <td className="font-mono">
                        <Bits bits={hit.ipBinary} netBits={p.netBits} prefix={p.prefix} />
                      </td>
                    </tr>
                    <tr>
                      <th>AND mask</th>
                      <td className="font-mono whitespace-nowrap">{p.mask.dotted}</td>
                      <td className="font-mono">
                        <Bits bits={p.mask.binary} netBits={p.netBits} prefix={p.prefix} />
                      </td>
                    </tr>
                    <tr>
                      <th>= Subnet</th>
                      <td className="font-mono whitespace-nowrap">
                        <b>{hit.network}</b>
                      </td>
                      <td className="font-mono">
                        <Bits bits={hit.netBinary} netBits={p.netBits} prefix={p.prefix} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="lab-decision lab-forward">
                <b>
                  {probe.trim()} 在第 {hit.i} 个子网（子网位 {hit.subnetBits || "—"}）：{hit.network}/{p.prefix}
                </b>
                <span>
                  Host range {hit.first} – {hit.last}，broadcast {hit.broadcast}。{ROLE[hit.role]}。1 AND 1 = 1，其余都是 0：掩码为 1 的位原样保留，为 0 的位（host）全部清零。
                </span>
              </p>
            </>
          ) : (
            <p className="lab-decision lab-flood">
              <b>这个地址不在 {p.classNetwork} 这个网络里</b>
              <span>要输入同一个 class 网络里的地址（前 {p.netBits / 8} 个 octet 相同）。</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
