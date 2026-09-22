"use client";

import { useState } from "react";
import { runQuery } from "./db-logic.mjs";

type Rel = { name: string; cols: string[]; rows: (string | number)[][] };
type Query = { expr: string; result: Rel; source: Rel; keptRows: number[]; keptCols: string[] };

const WHERE_ARTIST = ["", "Year=1990", "Year=1992", "ArtistName=GZA"];
const WHERE_JOIN = ["", "ReleaseYear=1994", "ReleaseYear=1993", "Year=1990", "AlbumID=22"];

// σ picks rows, Π picks columns, ⋈ glues tables — watch which cells survive.
export function RelAlgebraLab() {
  const [joinAlbums, setJoin] = useState(false);
  const [where, setWhere] = useState("Year=1990");
  const [cols, setCols] = useState<string[]>(["Year", "ArtistName"]);
  const q = runQuery({ joinAlbums, where, cols }) as unknown as Query;
  const wheres = joinAlbums ? WHERE_JOIN : WHERE_ARTIST;

  const toggleCol = (c: string) => setCols((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const setJoinMode = (v: boolean) => {
    setJoin(v);
    setWhere(v ? "ReleaseYear=1994" : "Year=1990");
    setCols(v ? ["ArtistName"] : ["Year", "ArtistName"]);
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>INTERACTIVE · σ 选行 · Π 选列 · ⋈ 连接</span>
      </div>

      <div className="lab-controls">
        <label className="ra-ctl">
          <span>输入</span>
          <select className="lab-select" value={joinAlbums ? "join" : "artist"} onChange={(e) => setJoinMode(e.target.value === "join")}>
            <option value="artist">Artist</option>
            <option value="join">Artist ⋈ ArtistAlbum ⋈ Album</option>
          </select>
        </label>
        <label className="ra-ctl">
          <span>σ</span>
          <select className="lab-select" value={where} onChange={(e) => setWhere(e.target.value)}>
            {wheres.map((w) => (
              <option key={w} value={w}>
                {w || "（不筛选）"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ra-cols">
        <span>Π</span>
        {q.source.cols.map((c) => (
          <button key={c} type="button" onClick={() => toggleCol(c)} className={`ra-col ${cols.includes(c) ? "ra-on" : ""}`}>
            {c}
          </button>
        ))}
        <small>（按点击顺序排列 = Π 可以调整列的顺序；都不选 = 不投影）</small>
      </div>

      <p className="ra-expr">{q.expr}</p>

      <div className="ra-grid">
        <div>
          <p className="ra-cap">输入：{q.source.name}</p>
          <div className="ra-scroll">
            <table className="lab-table ra-table">
              <thead>
                <tr>
                  {q.source.cols.map((c) => (
                    <th key={c} className={q.keptCols.includes(c) ? "" : "ra-out"}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.source.rows.map((r, i) => (
                  <tr key={i} className={q.keptRows.includes(i) ? "ra-keep" : "ra-drop"}>
                    {r.map((v, j) => (
                      <td key={j} className={q.keptCols.includes(q.source.cols[j]) ? "" : "ra-out"}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p className="ra-cap">
            输出：{q.result.rows.length} 行 × {q.result.cols.length} 列
          </p>
          <div className="ra-scroll">
            <table className="lab-table ra-table">
              <thead>
                <tr>
                  {q.result.cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.result.rows.length === 0 ? (
                  <tr>
                    <td colSpan={q.result.cols.length} className="text-fg-3">
                      （空关系：没有行满足条件）
                    </td>
                  </tr>
                ) : (
                  q.result.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td key={j}>{v}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="lab-decision lab-filter">
        <b>看输入表：划掉的行 = σ 筛掉的，灰掉的列 = Π 去掉的</b>
        <span>σ 横着切（选记录），Π 竖着切（选字段），⋈ 把 ArtistID / AlbumID 相同的记录拼成一行。输出还是一张表，所以可以一层套一层。</span>
      </p>
    </div>
  );
}
