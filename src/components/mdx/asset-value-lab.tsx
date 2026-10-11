"use client";

import { useState } from "react";
import { VALUE_ASSETS, VALUE_CRITERIA, weightedValue } from "./risk-logic.mjs";

// Slide 33: score each asset 1–5 on three weighted criteria; the weighted sum ranks the assets.
export function AssetValueLab() {
  const [weights, setWeights] = useState(VALUE_CRITERIA.map((c) => c.weight));
  const [rows, setRows] = useState(VALUE_ASSETS.map((a) => [...a.scores]));
  const sum = Math.round(weights.reduce((a, b) => a + b, 0) * 100) / 100;
  const results = rows.map((s) => weightedValue(s, weights));
  const order = results.map((r, i) => i).sort((a, b) => results[b].total - results[a].total);

  const setScore = (r: number, c: number, v: number) => setRows(rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 给资产打分：加权平均（p.33）
        </span>
        <button type="button" className="lab-btn" onClick={() => (setWeights(VALUE_CRITERIA.map((c) => c.weight)), setRows(VALUE_ASSETS.map((a) => [...a.scores])))}>
          恢复课件数字
        </button>
      </div>
      <div className="mt-2 overflow-x-auto">
        <table className="lab-table">
          <thead>
            <tr>
              <th>Information asset</th>
              {VALUE_CRITERIA.map((c, j) => (
                <th key={c.id}>
                  {c.label}
                  <br />
                  权重{" "}
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={1}
                    value={weights[j]}
                    onChange={(e) => setWeights(weights.map((w, k) => (k === j ? Number(e.target.value) : w)))}
                    className="lab-select w-[4em] px-1 text-[12px]"
                  />
                </th>
              ))}
              <th>Total</th>
              <th>Importance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={order[0] === r ? "lab-hot" : ""}>
                <td className="text-[12px]">{VALUE_ASSETS[r].name}</td>
                {row.map((v, c) => (
                  <td key={c}>
                    <select value={v} onChange={(e) => setScore(r, c, Number(e.target.value))} className="lab-select px-1 text-[13px]">
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td className="font-mono">{results[r].total}</td>
                <td>{results[r].band}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`lab-decision ${sum === 1 ? "lab-forward" : "lab-flood"}`}>
        <b>{sum === 1 ? "权重加起来 = 1.0" : `权重加起来 = ${sum}，应该等于 1.0`}</b>
        <span>
          Total = 每项分数 × 权重再相加。例如 EDI 1：5×0.3 + 5×0.4 + 3×0.3 = 4.4。排在最前的资产最先进入后面的风险分析。改一下权重（比如更看重声誉），排名就会变——权重反映的是管理层看重什么。
        </span>
      </p>
    </div>
  );
}
