"use client";

import { useState } from "react";
import { PREFIX_SETS, longestMatch } from "./prefix-logic.mjs";

type SetId = keyof typeof PREFIX_SETS;
type Route = { id: string; net: string; prefix: number; out?: string };
type Row = Route & { hit: boolean; mismatch: number | null; netBin: string };
type Res = { ok: boolean; error?: string; destBin?: string; rows?: Row[]; winner?: string | null };

// Colour the first `prefix` bits (dots don't count); mark the first mismatching bit red.
function Bits({ bin, prefix, mismatch }: { bin: string; prefix: number; mismatch: number | null }) {
  let k = 0;
  return (
    <span className="font-mono">
      {bin.split("").map((ch, i) => {
        if (ch === ".") return <span key={i}>.</span>;
        const idx = k++;
        const style = idx === mismatch ? { color: "var(--c-warn)", fontWeight: 700 } : idx < prefix ? { color: "var(--accent)", fontWeight: 600 } : { opacity: 0.55 };
        return (
          <span key={i} style={style}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

// Lab 2 pp.15–22: longest prefix match, bit by bit, plus the p.22 exercise as a quiz.
export function PrefixMatchLab({ set = "lab" }: { set?: SetId }) {
  const [sid, setSid] = useState<SetId>(set);
  const S = PREFIX_SETS[sid];
  const [routes, setRoutes] = useState<Route[]>(S.routes);
  const [dest, setDest] = useState(S.dests[0]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const res = longestMatch(routes, dest) as Res;
  const load = (id: SetId) => {
    setSid(id);
    setRoutes(PREFIX_SETS[id].routes);
    setDest(PREFIX_SETS[id].dests[0]);
    setPicks({});
    setChecked(false);
  };
  const edit = (id: string, patch: Partial<Route>) => setRoutes(routes.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const answer = (d: string) => (longestMatch(routes, d) as Res).winner ?? "丢弃";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 最长前缀匹配：逐位比较，匹配位数最多的那条赢
        </span>
      </div>
      <div className="lab-controls">
        {(Object.keys(PREFIX_SETS) as SetId[]).map((id) => (
          <button key={id} type="button" className={`lab-btn ${id === sid ? "lab-btn-on" : ""}`} onClick={() => load(id)}>
            {PREFIX_SETS[id].label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label>
          目的 IP{" "}
          <input className="lab-select" style={{ width: "9.5em" }} value={dest} onChange={(e) => setDest(e.target.value)} />
        </label>
        {S.dests.length > 1 &&
          S.dests.map((d) => (
            <button key={d} type="button" className={`lab-btn ${d === dest ? "lab-btn-on" : ""}`} onClick={() => setDest(d)}>
              {d}
            </button>
          ))}
      </div>

      {res.ok ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="lab-table" style={{ minWidth: "40em", whiteSpace: "nowrap" }}>
              <thead>
                <tr>
                  <th>路由</th>
                  <th>网段 / 前缀</th>
                  <th>二进制（前缀内的位上色，第一个不一样的位标红）</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>目的地</td>
                  <td className="font-mono">{dest}</td>
                  <td>
                    <span className="font-mono">{res.destBin}</span>
                  </td>
                  <td />
                </tr>
                {res.rows!.map((r) => (
                  <tr key={r.id} className={r.id === res.winner ? "lab-hot" : ""}>
                    <td>
                      {r.id}
                      {r.out ? <span className="text-fg-3"> · {r.out}</span> : null}
                    </td>
                    <td>
                      <input className="lab-select" style={{ width: "8.5em" }} value={r.net} onChange={(e) => edit(r.id, { net: e.target.value })} /> /{" "}
                      <input className="lab-select" style={{ width: "3.6em" }} type="number" min={0} max={32} value={r.prefix} onChange={(e) => edit(r.id, { prefix: Number(e.target.value) })} />
                    </td>
                    <td>
                      <Bits bin={r.netBin} prefix={r.prefix} mismatch={r.mismatch} />
                    </td>
                    <td>{r.hit ? <b>{r.id === res.winner ? `✓ 匹配 ${r.prefix} 位 ← 选它` : `✓ 匹配 ${r.prefix} 位`}</b> : <span>✕ 第 {r.mismatch! + 1} 位不同</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`lab-decision ${res.winner ? "lab-forward" : "lab-flood"}`}>
            <b>{res.winner ? `走 ${res.winner}` : "没有匹配，丢弃"}</b>
            <span>{res.winner ? `所有匹配的路由里，${res.winner} 的前缀最长（最具体）。/0 的默认路由只看 0 位，永远匹配，但也永远最短，只有别的都不匹配时才轮到它。` : "没有默认路由，路由器丢包并回 ICMP unreachable。"}</span>
          </p>
        </>
      ) : (
        <p className="lab-decision lab-flood">
          <b>输入有误</b>
          <span>{res.error}</span>
        </p>
      )}

      {S.dests.length > 1 && (
        <div className="mt-3">
          <p className="text-[13px]">
            <b>先自己做 p.22 的方框：</b>每个地址选一条路由，再点「检查」。
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="lab-table" style={{ whiteSpace: "nowrap" }}>
              <tbody>
                {S.dests.map((d) => (
                  <tr key={d}>
                    <td className="font-mono">{d}</td>
                    <td>
                      {routes.map((r) => (
                        <button key={r.id} type="button" className={`lab-btn ${picks[d] === r.id ? "lab-btn-on" : ""}`} onClick={() => setPicks((p) => ({ ...p, [d]: r.id }))}>
                          {r.id}
                        </button>
                      ))}
                    </td>
                    <td>{checked ? (picks[d] === answer(d) ? "✓" : `✕ 应该是 ${answer(d)}`) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lab-controls">
            <button type="button" className="lab-btn" onClick={() => setChecked(true)}>
              检查
            </button>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                setPicks({});
                setChecked(false);
              }}
            >
              重来
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
