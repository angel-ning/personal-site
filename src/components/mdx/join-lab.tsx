"use client";

import { useState } from "react";
import { runJoin, show, JOIN_TYPES } from "./sql-logic.mjs";

type Row = { v: unknown[]; kind: "match" | "left" | "right" };
type Res = { sql: string; cols: string[]; rows: Row[]; splitAt: number; counts: { match: number; left: number; right: number }; leftName: string; rightName: string };

// Two circles; the shaded part is what the chosen join keeps.
function Venn({ type }: { type: string }) {
  const l = type === "LEFT" || type === "FULL";
  const r = type === "RIGHT" || type === "FULL";
  const on = "var(--accent, #c2410c)";
  return (
    <svg viewBox="0 0 120 64" className="jl-venn" aria-hidden>
      <defs>
        <clipPath id="jl-cl"><circle cx="45" cy="32" r="26" /></clipPath>
      </defs>
      <g opacity=".4" fill={on}>
        {l && <circle cx="45" cy="32" r="26" />}
        {r && <circle cx="75" cy="32" r="26" />}
        <circle cx="75" cy="32" r="26" clipPath="url(#jl-cl)" />
      </g>
      <circle cx="45" cy="32" r="26" fill="none" stroke="var(--fg-2, #444)" />
      <circle cx="75" cy="32" r="26" fill="none" stroke="var(--fg-2, #444)" />
    </svg>
  );
}

export function JoinLab() {
  const [data, setData] = useState<"order" | "self">("order");
  const [type, setType] = useState("INNER");
  const [extraOrder, setExtra] = useState(false);
  const [onlyUnmatched, setOnly] = useState(false);
  const res = runJoin({ data, type, extraOrder, onlyUnmatched }) as unknown as Res;
  const outer = type !== "INNER";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>INTERACTIVE · INNER / LEFT / RIGHT / FULL JOIN</span>
        <span className="font-mono text-[12px] text-fg-3">
          匹配 {res.counts.match} · 左边独有 {res.counts.left} · 右边独有 {res.counts.right}
        </span>
      </div>

      <div className="lab-controls">
        <label className="ra-ctl">
          <span>表</span>
          <select className="lab-select" value={data} onChange={(e) => { setData(e.target.value as "order" | "self"); setExtra(false); }}>
            <option value="order">Customer_T ⋈ Order_T</option>
            <option value="self">Self-join：Employee_T E ⋈ Employee_T M</option>
          </select>
        </label>
        {JOIN_TYPES.map((t) => (
          <button key={t} type="button" className={`lab-btn ${type === t ? "lab-btn-on" : ""}`} onClick={() => { setType(t); if (t === "INNER") setOnly(false); }}>
            {t}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        {data === "order" && (
          <label className="ra-ctl">
            <input type="checkbox" checked={extraOrder} onChange={(e) => setExtra(e.target.checked)} />
            <span>加一张 CustomerID = NULL 的订单 1011</span>
          </label>
        )}
        <label className="ra-ctl">
          <input type="checkbox" checked={onlyUnmatched} disabled={type === "INNER" || type === "RIGHT"} onChange={(e) => setOnly(e.target.checked)} />
          <span>只看右边为 NULL 的行（{data === "order" ? "没下过单的客户" : "没有上司的员工"}）</span>
        </label>
      </div>

      <div className="jl-top">
        <Venn type={type} />
        <pre className="sp-sql">{res.sql}</pre>
      </div>

      <div className="ra-scroll">
        <table className="lab-table ra-table">
          <thead>
            <tr>
              {res.cols.map((c, i) => (
                <th key={c} className={i === res.splitAt ? "jl-split" : ""}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {res.rows.map((r, i) => (
              <tr key={i} className={`jl-${r.kind}`}>
                {r.v.map((v, j) => (
                  <td key={j} className={`${v === null ? "sp-null" : ""} ${j === res.splitAt ? "jl-split" : ""}`}>{show(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`lab-decision ${outer ? "lab-filter" : "lab-forward"}`}>
        <b>{res.rows.length} 行 · {type === "INNER" ? "只留两边都配得上的行" : type === "LEFT" ? `${res.leftName} 全部保留，配不上的右边补 NULL` : type === "RIGHT" ? `${res.rightName} 全部保留，配不上的左边补 NULL` : "两边都全部保留，谁配不上就给谁补 NULL"}</b>
        <span>
          {data === "order"
            ? type === "INNER"
              ? "6 个没下单的客户（6、7、9、10、13、14）消失了——inner join 看不见「没有」的东西。"
              : !extraOrder && (type === "RIGHT" || type === "FULL")
                ? "右边的订单都有客户，所以 RIGHT 和 INNER 结果一样。勾上「CustomerID = NULL 的订单」再看。"
                : "橙色 = 左边独有，蓝色 = 右边独有。NULL 表示「这一边没有配上的行」，不是数据本身为空。"
            : "E 和 M 是同一张表的两个别名：E 当「员工」，M 当「上司」。ON E.EmployeeSupervisor = M.EmployeeID 把员工和对应的上司拼成一行。"}
        </span>
      </p>
    </div>
  );
}
