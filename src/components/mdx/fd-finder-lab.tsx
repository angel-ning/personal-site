"use client";

import { useState } from "react";
import { FD_SCENARIOS, flatRows, checkFd, sweepNonKey } from "./fd-finder-logic.mjs";

type Scenario = { id: string; label: string; table: string; cols: string[]; pk: string[]; rows: unknown[][] };
type Found = { col: string; real: boolean; why: string };

const SCENARIOS = FD_SCENARIOS as unknown as Scenario[];

// Pick determinant columns → see which other columns the sample data allows them to determine,
// with the first counterexample pair highlighted; then the full non-key sweep with verdicts.
export function FdFinderLab() {
  const [sid, setSid] = useState(SCENARIOS[0].id);
  const s = SCENARIOS.find((x) => x.id === sid)!;
  const rows = flatRows(s) as (string | number)[][];
  const [det, setDet] = useState<string[]>(["Contact_Person"]);
  const [focus, setFocus] = useState<string | null>(null);

  const switchTo = (id: string) => {
    const next = SCENARIOS.find((x) => x.id === id)!;
    setSid(id);
    setDet([next.cols.find((c) => !next.pk.includes(c))!]);
    setFocus(null);
  };
  const toggle = (c: string) => {
    setDet((d) => (d.includes(c) ? d.filter((x) => x !== c) : [...d, c]));
    setFocus(null);
  };

  const results = det.length
    ? s.cols.filter((c) => !det.includes(c)).map((c) => ({ col: c, ...(checkFd(s.cols, rows, det, c) as { holds: boolean; pair: [number, number] | null }) }))
    : [];
  const focused = results.find((r) => r.col === focus);
  const hot = new Set(focused?.pair ?? []);
  const sweep = sweepNonKey(s) as { det: string; found: Found[] }[];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>INTERACTIVE · 找 FD：用数据找反例</span>
        <span className="font-mono text-[12px] text-fg-3">主键 = {s.pk.join(" + ")}</span>
      </div>

      <div className="lab-controls">
        {SCENARIOS.map((x) => (
          <button key={x.id} type="button" className={`lab-btn ${sid === x.id ? "lab-btn-on" : ""}`} onClick={() => switchTo(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      <p className="sp-hint">① 选箭头左边的列（可以多选，组成复合决定因素）：</p>
      <div className="lab-controls" style={{ marginTop: ".2em" }}>
        {s.cols.map((c) => (
          <button key={c} type="button" className={`lab-btn ${det.includes(c) ? "lab-btn-on" : ""}`} onClick={() => toggle(c)}>
            {s.pk.includes(c) ? <u>{c}</u> : c}
          </button>
        ))}
      </div>

      {det.length > 0 && (
        <>
          <p className="sp-hint">② {det.join(", ")} → ？ 点一个 ❌ 看是哪两行打架：</p>
          <div className="fd-results">
            {results.map((r) => (
              <button
                key={r.col}
                type="button"
                className={`fd-res ${r.holds ? "fd-ok" : "fd-no"} ${focus === r.col ? "fd-on" : ""}`}
                onClick={() => setFocus(r.holds ? null : r.col)}
              >
                {r.holds ? "✅" : "❌"} {r.col}
              </button>
            ))}
          </div>
          {focused?.pair && (
            <p className="lab-decision lab-filter">
              <b>反例</b>
              <span>
                第 {focused.pair[0] + 1} 行和第 {focused.pair[1] + 1} 行的 {det.join(", ")} 相同，{focused.col} 却不同 → {det.join(", ")} ↛ {focused.col}。
              </span>
            </p>
          )}
        </>
      )}

      <div className="ra-scroll" style={{ marginTop: ".6em" }}>
        <table className="lab-table ra-table">
          <thead>
            <tr>
              <th>#</th>
              {s.cols.map((c) => (
                <th key={c} className={det.includes(c) ? "fd-det" : c === focus ? "fd-dep" : ""}>
                  {s.pk.includes(c) ? <u>{c}</u> : c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={hot.has(i) ? "lab-hot" : ""}>
                <td>{i + 1}</td>
                {r.map((v, j) => (
                  <td key={j}>{String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="sp-hint" style={{ marginTop: "1em" }}>
        ③ 第三层扫描：把<b>每个非键列</b>单独放到箭头左边，数据里没有反例的候选如下。数据只能推翻、不能证明，每个候选还要按业务含义判断：
      </p>
      <div className="nw-fds">
        {sweep.map((row) =>
          row.found.length ? (
            row.found.map((f) => (
              <p key={row.det + f.col} className={`nw-fd ${f.real ? "nw-trans" : ""}`}>
                <code>{row.det} → {f.col}</code>
                <b>{f.real ? "真 FD" : "假候选"}</b>
                <span>{f.why}</span>
              </p>
            ))
          ) : (
            <p key={row.det} className="nw-fd">
              <code>{row.det} → ∅</code>
              <span>数据里就有反例，什么都决定不了</span>
            </p>
          ),
        )}
      </div>
    </div>
  );
}
