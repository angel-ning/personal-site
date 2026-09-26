"use client";

import { useState } from "react";
import { PLAN_PRESETS, planOptions } from "./subnet-logic.mjs";

type Opt = { borrow: number; subnets: number; hostBits: number; hosts: number; prefix: number; okSubnets: boolean; okHosts: boolean };
type Result = { total: number; minBorrow: number; minHostBits: number; maxBorrow: number; feasible: boolean; rows: Opt[] };

const fmt = (n: number) => n.toLocaleString("en-US");

// Given "how many subnets" and "how many hosts per subnet", find how many bits can be borrowed.
export function SubnetPlanner() {
  const [cls, setCls] = useState<"A" | "B" | "C">("B");
  const [subnets, setSubnets] = useState("100");
  const [hosts, setHosts] = useState("200");

  const r = planOptions(cls, Number(subnets), Number(hosts)) as Result;
  const s = Number(subnets) || 1;
  const h = Number(hosts) || 1;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 按需求规划：借几位？</span>
      </div>
      <div className="lab-controls">
        {PLAN_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`lab-btn ${cls === p.cls && s === p.subnets && h === p.hosts ? "lab-btn-on" : ""}`}
            onClick={() => {
              setCls(p.cls as "A" | "B" | "C");
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
          <select value={cls} onChange={(e) => setCls(e.target.value as "A" | "B" | "C")} className="lab-select" aria-label="class">
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          需要子网
          <input value={subnets} onChange={(e) => setSubnets(e.target.value)} inputMode="numeric" className="lab-select w-[6em] px-2 py-0.5" aria-label="subnets needed" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          每个子网主机
          <input value={hosts} onChange={(e) => setHosts(e.target.value)} inputMode="numeric" className="lab-select w-[6em] px-2 py-0.5" aria-label="hosts needed" />
        </label>
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>可借的 host 位</th>
            <td>Class {cls} 有 {r.total} 个 host 位</td>
          </tr>
          <tr>
            <th>最少借几位</th>
            <td>
              2^n ≥ {fmt(s)} → n = <b>{r.minBorrow}</b>（2^{r.minBorrow} = {fmt(2 ** r.minBorrow)}）
            </td>
          </tr>
          <tr>
            <th>最少留几位 host</th>
            <td>
              2^h − 2 ≥ {fmt(h)} → h = <b>{r.minHostBits}</b>（2^{r.minHostBits} − 2 = {fmt(2 ** r.minHostBits - 2)}）→ 最多借 {r.total} − {r.minHostBits} = <b>{r.maxBorrow}</b> 位
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${r.feasible ? "lab-forward" : "lab-flood"}`}>
        <b>
          {r.feasible
            ? r.minBorrow === r.maxBorrow
              ? `只有一种方案：借 ${r.minBorrow} 位（/${(32 - r.total) + r.minBorrow}）`
              : `借 ${r.minBorrow} – ${r.maxBorrow} 位都可以（/${32 - r.total + r.minBorrow} – /${32 - r.total + r.maxBorrow}）`
            : `做不到：至少要借 ${r.minBorrow} 位，但最多只能借 ${r.maxBorrow} 位`}
        </b>
        <span>
          {r.feasible
            ? `借得少 → 每个子网主机多（要"maximize hosts per subnet"就借 ${r.minBorrow} 位）；借得多 → 子网多（给以后加部门留余地）。Slide 22：按最大的子网来设计，并为增长留空间。`
            : "换一个更大的 class（例如从 C 换到 B），或者减少需求。"}
        </span>
      </p>

      <div className="table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>借 n 位</th>
              <th>子网数 2^n</th>
              <th>剩 h 位</th>
              <th>每子网主机 2^h − 2</th>
              <th>掩码</th>
              <th>可行？</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((o) => (
              <tr key={o.borrow} className={o.okSubnets && o.okHosts ? "lab-hot" : ""}>
                <td className="font-mono">{o.borrow}</td>
                <td className="font-mono">
                  {fmt(o.subnets)} {o.okSubnets ? "✓" : "✗"}
                </td>
                <td className="font-mono">{o.hostBits}</td>
                <td className="font-mono">
                  {fmt(o.hosts)} {o.okHosts ? "✓" : "✗"}
                </td>
                <td className="font-mono">/{o.prefix}</td>
                <td>{o.okSubnets && o.okHosts ? "✓ 可以" : !o.okSubnets ? "子网不够" : "主机不够"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
