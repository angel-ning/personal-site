"use client";

import { useState } from "react";
import { KEY_COUNT_PRESETS, keyCount } from "./cipher-logic.mjs";

// Slide 15: keys needed for n parties to talk pairwise — symmetric n(n−1)/2 vs asymmetric one pair each.
export function KeyCountLab() {
  const [n, setN] = useState(10);
  const k = keyCount(n);
  const fmt = (x: number) => x.toLocaleString("en-US");

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · n 个人两两保密通信，要几把钥匙？
        </span>
      </div>
      <div className="lab-controls">
        {KEY_COUNT_PRESETS.map((p) => (
          <button key={p} type="button" className={`lab-btn ${n === p ? "lab-btn-on" : ""}`} onClick={() => setN(p)}>
            {p} 人
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-[13px]">
          自己填
          <input type="number" min={2} value={n} onChange={(e) => setN(Number(e.target.value))} className="lab-select w-[6em] px-2 py-1 text-[13px]" />
        </label>
      </div>
      <table className="lab-table">
        <thead>
          <tr>
            <th></th>
            <th>公式</th>
            <th>{fmt(k.n)} 人需要</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>对称（每两人共用一把）</td>
            <td className="font-mono">n(n−1)/2</td>
            <td className="font-mono">
              <b>{fmt(k.symmetric)}</b> 把，每把都要安全地送到两个人手上
            </td>
          </tr>
          <tr>
            <td>非对称（每人一对）</td>
            <td className="font-mono">2n</td>
            <td className="font-mono">
              <b>{fmt(k.asymmetric)}</b> 把（{fmt(k.pairs)} 对），公钥直接公开，不用送
            </td>
          </tr>
        </tbody>
      </table>
      <p className="lab-decision lab-flood">
        <b>对称的两个问题叠在一起</b>
        <span>数量随 n² 爆炸（not scalable），而且每一把都要事先找安全渠道交给对方（key distribution）。</span>
      </p>
    </div>
  );
}
