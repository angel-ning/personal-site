"use client";

import { useState } from "react";
import { KEY_STRENGTH_PRESETS, keyStrength } from "./cipher-logic.mjs";

// Slide 36 / Table 10-5: each extra key bit doubles the brute-force work.
export function KeyStrengthLab() {
  const [bits, setBits] = useState(56);
  const r = keyStrength(bits);
  const next = keyStrength(bits + 1);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 密钥多长，暴力破解要多久（Table 10-5）
        </span>
      </div>
      <div className="lab-controls">
        {KEY_STRENGTH_PRESETS.map((b) => (
          <button key={b} type="button" className={`lab-btn ${bits === b ? "lab-btn-on" : ""}`} onClick={() => setBits(b)}>
            {b} 位
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-[13px]">
          自己填
          <input type="number" min={1} max={1024} value={bits} onChange={(e) => setBits(Number(e.target.value))} className="lab-select w-[5em] px-2 py-1 text-[13px]" />
        </label>
      </div>
      <table className="lab-table">
        <tbody>
          <tr>
            <th>最多要猜</th>
            <td className="font-mono">2^{r.k} = {r.guessesText} 次</td>
          </tr>
          <tr>
            <th>最长时间</th>
            <td className="font-mono">{r.max}</td>
          </tr>
          <tr className="lab-hot">
            <th>平均时间</th>
            <td className="font-mono">{r.avg}（平均猜到一半就中）</td>
          </tr>
        </tbody>
      </table>
      <p className="lab-decision lab-forward">
        <b>多 1 位，工作量翻一倍：{r.k + 1} 位平均要 {next.avg}</b>
        <span>按课件表的假设：一台 2020 年的桌面 CPU，每秒约 5,850 亿次猜测。56 位（老的 DES）不到一天就能破，128 位（AES 最短）要上亿亿年——所以密钥长度比「算法有多复杂」更决定强度。</span>
      </p>
    </div>
  );
}
