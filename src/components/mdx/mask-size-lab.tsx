"use client";

import { useState } from "react";
import { prefixRows, fitRequirements, fieldSplit, NEED_PRESETS, SPLIT_PRESETS, CLASS_BITS } from "./mask-logic.mjs";

type Cls = "A" | "B" | "C";
type Row = { prefix: number; mask: string; borrow: number; subnets: number; hostBits: number; hosts: number; octet: number; block: number };
type Fit = { total: number; minBorrow: number; minHostBits: number; maxBorrow: number; feasible: boolean; minPrefix: number; maxPrefix: number };
type Split = {
  error?: string;
  cls: Cls;
  base: number;
  prefix: number;
  borrow: number;
  hostBits: number;
  subnets: number;
  hosts: number;
  mask: string;
  defaultMask: string;
  block: { octet: number; value: number };
  bits: string;
  roles: ("N" | "S" | "H")[];
  subnetBits: string;
  subnetNumber: number;
  network: string;
  broadcast: string;
  first: string;
  last: string;
  role: string;
};

const fmt = (n: number) => n.toLocaleString("en-US");
const ORD = ["", "1st", "2nd", "3rd", "4th"];

// Determining subnet mask size: requirements → which masks work, or address + mask → N | S | H (Slide 25).
export function MaskSizeLab({ mode: startMode = "need" }: { mode?: "need" | "split" }) {
  const [mode, setMode] = useState<"need" | "split">(startMode);
  const [cls, setCls] = useState<Cls>("B");
  const [subnets, setSubnets] = useState("100");
  const [hosts, setHosts] = useState("200");
  const [ip, setIp] = useState("197.15.22.131");
  const [mask, setMask] = useState("255.255.255.224");

  const fit = fitRequirements(cls, Number(subnets), Number(hosts)) as Fit;
  const sp = mode === "split" ? (fieldSplit(ip, mask) as Split | null) : null;
  const tableCls: Cls = mode === "split" && sp && !sp.error ? sp.cls : cls;
  const rows = prefixRows(tableCls) as Row[];
  const s = Number(subnets) || 1;
  const h = Number(hosts) || 1;

  const rowState = (r: Row) => {
    if (mode === "split") return sp && !sp.error && r.prefix === sp.prefix ? "lab-hot" : "";
    const okS = r.subnets >= s;
    const okH = r.hosts >= h;
    return okS && okH ? "mask-ok" : "mask-no";
  };
  const rowNote = (r: Row) => {
    if (mode === "split") return sp && !sp.error && r.prefix === sp.prefix ? "← 这个地址用的掩码" : "";
    const okS = r.subnets >= s;
    const okH = r.hosts >= h;
    if (okS && okH) return r.prefix === fit.minPrefix && r.prefix === fit.maxPrefix ? "✓ 唯一可行 only choice" : r.prefix === fit.minPrefix ? "✓ 主机最多 max hosts" : r.prefix === fit.maxPrefix ? "✓ 子网最多 max subnets" : "✓";
    return !okS ? "子网不够 too few subnets" : "主机不够 too few hosts";
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Determining Subnet Mask Size 子网掩码怎么定</span>
      </div>
      <div className="lab-controls">
        <button type="button" className={`lab-btn ${mode === "need" ? "lab-btn-on" : ""}`} onClick={() => setMode("need")}>
          ① 按需求定掩码 Requirements → mask
        </button>
        <button type="button" className={`lab-btn ${mode === "split" ? "lab-btn-on" : ""}`} onClick={() => setMode("split")}>
          ② 看掩码拆字段 Mask → Network | Subnet | Host
        </button>
      </div>

      {mode === "need" ? (
        <>
          <div className="lab-controls">
            {NEED_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`lab-btn ${p.cls === cls && p.subnets === s && p.hosts === h ? "lab-btn-on" : ""}`}
                onClick={() => {
                  setCls(p.cls as Cls);
                  setSubnets(String(p.subnets));
                  setHosts(String(p.hosts));
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="lab-controls">
            <label className="flex items-center gap-1.5 text-[13px]">
              Class
              <select className="lab-select" value={cls} onChange={(e) => setCls(e.target.value as Cls)} aria-label="class">
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[13px]">
              需要子网 subnets
              <input className="lab-select w-[5.5em] px-2 py-0.5" value={subnets} inputMode="numeric" onChange={(e) => setSubnets(e.target.value)} aria-label="subnets needed" />
            </label>
            <label className="flex items-center gap-1.5 text-[13px]">
              每子网地址 hosts
              <input className="lab-select w-[5.5em] px-2 py-0.5" value={hosts} inputMode="numeric" onChange={(e) => setHosts(e.target.value)} aria-label="hosts needed" />
            </label>
          </div>
          <table className="lab-table">
            <tbody>
              <tr>
                <th>
                  Host bits 可借的位
                </th>
                <td>
                  Class {cls} 默认 /{CLASS_BITS[cls]}，host 部分 <b>{fit.total}</b> 位
                </td>
              </tr>
              <tr>
                <th>Min bits 最少借</th>
                <td>
                  子网够：2^s ≥ {fmt(s)} → s ≥ <b>{fit.minBorrow}</b>（2^{fit.minBorrow} = {fmt(2 ** fit.minBorrow)}）
                </td>
              </tr>
              <tr>
                <th>Max bits 最多借</th>
                <td>
                  主机够：2^h − 2 ≥ {fmt(h)} → h ≥ {fit.minHostBits}（2^{fit.minHostBits} − 2 = {fmt(2 ** fit.minHostBits - 2)}）→ s ≤ {fit.total} − {fit.minHostBits} = <b>{fit.maxBorrow}</b>
                </td>
              </tr>
            </tbody>
          </table>
          <div className={`lab-decision ${fit.feasible ? "lab-forward" : "lab-flood"}`}>
            <b>
              {fit.feasible
                ? fit.minPrefix === fit.maxPrefix
                  ? `只能借 ${fit.minBorrow} 位：/${fit.minPrefix}`
                  : `借 ${fit.minBorrow}–${fit.maxBorrow} 位都可以：/${fit.minPrefix} – /${fit.maxPrefix}`
                : `做不到：最少要借 ${fit.minBorrow} 位，但最多只能借 ${fit.maxBorrow} 位（min > max）`}
            </b>
            <span>
              {fit.feasible
                ? "题目说「maximize hosts per subnet」→ 选最少的借位（表里「主机最多」那一行）；说「maximize subnets」→ 选最多的借位；没说 → 区间里都对。拓扑题的「地址数」记得把路由器接口算进去。"
                : "同一个掩码（FLSM）下这个网络装不下：要换更大的网络（例如 Class B），或者用 VLSM（课外）。"}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="lab-controls">
            {SPLIT_PRESETS.map((p) => (
              <button
                key={p.ip}
                type="button"
                className={`lab-btn ${p.ip === ip && p.mask === mask ? "lab-btn-on" : ""}`}
                onClick={() => {
                  setIp(p.ip);
                  setMask(p.mask);
                }}
              >
                {p.ip}（{p.note}）
              </button>
            ))}
          </div>
          <div className="lab-controls">
            <label className="flex items-center gap-1.5 text-[13px]">
              Address 地址
              <input className="lab-select w-[10em] px-2 py-0.5" value={ip} onChange={(e) => setIp(e.target.value)} aria-label="IP address" />
            </label>
            <label className="flex items-center gap-1.5 text-[13px]">
              Mask 掩码
              <input className="lab-select w-[10em] px-2 py-0.5" value={mask} onChange={(e) => setMask(e.target.value)} aria-label="subnet mask" />
            </label>
          </div>
          {sp && !sp.error ? (
            <>
              <div className="mask-bits" aria-label="32 bits split into network, subnet and host fields">
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} className="mask-oct">
                    {[...sp.bits.slice(k * 8, k * 8 + 8)].map((b, i) => (
                      <span key={i} className={`mask-b mask-${sp.roles[k * 8 + i]}`}>
                        {b}
                      </span>
                    ))}
                    <small>{ip.split(".")[k]}</small>
                  </div>
                ))}
              </div>
              <div className="mask-legend">
                <span>
                  <i className="mask-N" /> Network field 网络位 · {sp.base} 位（Class {sp.cls}）
                </span>
                <span>
                  <i className="mask-S" /> Subnet field 子网位 (SN) · 借的 {sp.borrow} 位
                </span>
                <span>
                  <i className="mask-H" /> Host field 主机位 · {sp.hostBits} 位
                </span>
              </div>
              <table className="lab-table">
                <tbody>
                  <tr>
                    <th>Mask 掩码</th>
                    <td>
                      {sp.mask}（/{sp.prefix}）＝ 默认 {sp.defaultMask}（/{sp.base}）+ 借 <b>{sp.borrow}</b> 位
                    </td>
                  </tr>
                  <tr>
                    <th>Subnets 子网数</th>
                    <td>
                      2^{sp.borrow} = <b>{fmt(sp.subnets)}</b>
                    </td>
                  </tr>
                  <tr>
                    <th>Hosts 每子网主机</th>
                    <td>
                      2^{sp.hostBits} − 2 = <b>{fmt(sp.hosts)}</b>
                    </td>
                  </tr>
                  <tr>
                    <th>Block size 间隔</th>
                    <td>
                      第 {sp.block.octet} 段（{ORD[sp.block.octet]} octet），每个子网 + <b>{sp.block.value}</b>
                    </td>
                  </tr>
                  <tr>
                    <th>SN bits 子网号</th>
                    <td>
                      <code>{sp.subnetBits}</code> = 第 <b>{sp.subnetNumber}</b> 个子网（从 0 数）
                    </td>
                  </tr>
                  <tr className="lab-hot">
                    <th>Subnet 子网地址</th>
                    <td>
                      <b>{sp.network}</b>（host 位全 0）
                    </td>
                  </tr>
                  <tr>
                    <th>Broadcast 广播</th>
                    <td>{sp.broadcast}（host 位全 1）</td>
                  </tr>
                  <tr>
                    <th>Usable 可用范围</th>
                    <td>
                      {sp.first} – {sp.last}
                      {sp.role !== "host" ? `　⚠️ ${ip} 本身是这个子网的 ${sp.role === "network" ? "network" : "broadcast"} address，不能给主机` : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <p className="addr-note">{sp?.error ?? "地址写成 a.b.c.d（Class A–C），掩码写成 255.255.255.224 或 /27。"}</p>
          )}
        </>
      )}

      <div className="table-wrap">
        <table className="lab-table mask-table">
          <thead>
            <tr>
              <th colSpan={7}>Class {tableCls} 的全部掩码（默认 /{CLASS_BITS[tableCls]}）</th>
            </tr>
            <tr>
              <th>Prefix 前缀</th>
              <th>Subnet mask 掩码</th>
              <th>Borrowed 借位 s</th>
              <th>Subnets 2^s</th>
              <th>Hosts 2^h − 2</th>
              <th>Block 间隔</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.prefix} className={rowState(r)}>
                <td>/{r.prefix}</td>
                <td>
                  <code>{r.mask}</code>
                </td>
                <td>{r.borrow}</td>
                <td>{fmt(r.subnets)}</td>
                <td>{fmt(r.hosts)}</td>
                <td>
                  {r.block}（第 {r.octet} 段）
                </td>
                <td className="addr-why">{rowNote(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
