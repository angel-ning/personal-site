"use client";

import { useState } from "react";
import { WEIGHTS, toBits, toHex, readOctet, decompose, classOfFirst, maskOctetInfo, andTable, BINARY_PRESETS, AND_PRESETS } from "./binary-logic.mjs";

type And = { ip: number[]; mask: number[]; prefix: number; net: number[]; bc: number[]; focus: number };

// Open-book binary helper: one octet decimal ↔ binary (with the bit weights), and address AND mask.
export function BinaryLab() {
  const [oct, setOct] = useState("200");
  const [ip, setIp] = useState("192.168.10.65");
  const [mask, setMask] = useState("255.255.255.224");

  const n = readOctet(oct);
  const bits = n == null ? null : toBits(n);
  const cls = n == null ? null : classOfFirst(n);
  const mi = n == null ? null : maskOctetInfo(n);
  const t = andTable(ip, mask) as And | null;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 二进制速算 Binary helper</span>
      </div>

      <p className="addr-q">
        <b>① 一个 octet：十进制 ↔ 二进制</b>（输入 200、11001000 或 0xC8 都可以）
      </p>
      <div className="lab-controls">
        <input className="lab-select w-[9em] px-2 py-0.5" value={oct} onChange={(e) => setOct(e.target.value)} aria-label="octet" />
        {BINARY_PRESETS.map((p) => (
          <button key={p} type="button" className={`lab-btn ${p === oct ? "lab-btn-on" : ""}`} onClick={() => setOct(p)}>
            {p}
          </button>
        ))}
      </div>
      {bits ? (
        <>
          <div className="bin-row">
            {WEIGHTS.map((w, i) => (
              <div key={w} className={`bin-bit ${bits[i] === "1" ? "bin-on" : ""}`}>
                <small>{w}</small>
                <b>{bits[i]}</b>
              </div>
            ))}
          </div>
          <table className="lab-table">
            <tbody>
              <tr>
                <th>Decimal 十进制</th>
                <td>
                  <b>{n}</b> = {decompose(n!).length ? decompose(n!).join(" + ") : "0"}
                </td>
              </tr>
              <tr>
                <th>Binary 二进制</th>
                <td>
                  <code>{bits.slice(0, 4)} {bits.slice(4)}</code>
                </td>
              </tr>
              <tr>
                <th>Hex 十六进制</th>
                <td>
                  <code>{toHex(n!)}</code>（每 4 位 = 1 个 hex 数字：{bits.slice(0, 4)} = {toHex(n!)[0]}，{bits.slice(4)} = {toHex(n!)[1]}；MAC 地址就是这样写的）
                </td>
              </tr>
              <tr>
                <th>当第一个 octet</th>
                <td>
                  开头 <code>{cls!.lead}</code> → <b>Class {cls!.cls}</b>
                  {n === 127 ? "（127 = loopback）" : n === 0 ? "（0 保留）" : ""}
                </td>
              </tr>
              <tr>
                <th>当掩码的一段</th>
                <td>{mi ? <>✓ 合法掩码值：{mi.ones} 个 1 → 间隔（block size）= 256 − {n} = <b>{mi.block}</b></> : "✗ 不是掩码值（掩码必须是连续的 1 再接连续的 0）"}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <p className="addr-note">输入 0–255 的十进制、8 位二进制，或 0x 开头的十六进制。</p>
      )}

      <p className="addr-q">
        <b>② 地址 AND 掩码 → 子网地址（Subnetwork address）</b>
      </p>
      <div className="lab-controls">
        <input className="lab-select w-[10em] px-2 py-0.5" value={ip} onChange={(e) => setIp(e.target.value)} aria-label="IP address" />
        <input className="lab-select w-[10em] px-2 py-0.5" value={mask} onChange={(e) => setMask(e.target.value)} aria-label="subnet mask" />
      </div>
      <div className="lab-controls">
        {AND_PRESETS.map((p) => (
          <button
            key={p.ip}
            type="button"
            className={`lab-btn ${p.ip === ip && p.mask === mask ? "lab-btn-on" : ""}`}
            onClick={() => {
              setIp(p.ip);
              setMask(p.mask);
            }}
          >
            {p.ip} {p.mask.startsWith("/") ? p.mask : `/ ${p.mask}`}（{p.note}）
          </button>
        ))}
      </div>
      {t ? (
        <div className="table-wrap">
          <table className="lab-table bin-and">
            <thead>
              <tr>
                <th />
                {[1, 2, 3, 4].map((k) => (
                  <th key={k} className={k - 1 === t.focus ? "bin-focus" : ""}>
                    第 {k} 段
                  </th>
                ))}
                <th>十进制</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Address 地址", t.ip],
                ["Mask 掩码", t.mask],
                ["AND → Subnet 子网", t.net],
                ["Broadcast 广播", t.bc],
              ].map(([label, row], r) => (
                <tr key={r} className={r === 2 ? "lab-hot" : ""}>
                  <th>{label as string}</th>
                  {(row as number[]).map((o, k) => (
                    <td key={k} className={k === t.focus ? "bin-focus" : ""}>
                      <code>{toBits(o)}</code>
                    </td>
                  ))}
                  <td>
                    <b>{(row as number[]).join(".")}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="addr-note">
            /{t.prefix}：AND 规则 1 AND 1 = 1，其余都是 0 —— 掩码是 1 的位照抄，是 0 的位清零。Broadcast = 子网地址的 host 位全部变成 1。可用范围：
            {t.prefix <= 30 ? ` ${[...t.net.slice(0, 3), t.net[3] + 1].join(".")} – ${[...t.bc.slice(0, 3), t.bc[3] - 1].join(".")}` : " 无"}。只看高亮的那一段就够了，其他段要么照抄（掩码 255）要么是 0（掩码 0）。
          </p>
        </div>
      ) : (
        <p className="addr-note">地址写成 a.b.c.d；掩码写成 255.255.255.224 或 /27。</p>
      )}
    </div>
  );
}
