"use client";

import { useState } from "react";
import {
  ASSUMED_ERROR,
  CLAIM_LEVELS,
  CLAIM_PRESETS,
  METHODS,
  OUTCOMES,
  OUTSIDE_LIST,
  ROUTE_CASES,
  SAMPLE_CHECKS,
  checkResult,
  drawSample,
  evaluateClaim,
  pct,
  routeOutcome,
  routeSummary,
} from "./audit-logic.mjs";

const SIZES = [30, 60, 120, 300];

// ISOM 6200 L5 · Slides 18–20: Harbourleaf's 1,000 events; random vs stratified vs judgmental, and what each can estimate.
export function SampleDesignLab() {
  const [method, setMethod] = useState("stratified");
  const [size, setSize] = useState(60);
  const [seed, setSeed] = useState(1);
  const r = drawSample({ method, size, seed });
  const tone = method === "judgmental" ? "lab-flood" : r.missing.length ? "lab-flood" : "lab-forward";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 三种抽样，从同一份 1,000 条事件清单里抽</span>
        <span className="text-[12px] text-fg-3">Slides 18–20 · 各组错误率是假设</span>
      </div>
      <div className="lab-controls">
        {METHODS.map((m) => (
          <button key={m.id} className={`lab-btn ${method === m.id ? "lab-btn-on" : ""}`} onClick={() => setMethod(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-fg-2">{METHODS.find((m) => m.id === method)?.zh}</p>
      <div className="lab-controls">
        <span className="text-[13px]">样本量</span>
        {SIZES.map((s) => (
          <button key={s} className={`lab-btn ${size === s ? "lab-btn-on" : ""}`} onClick={() => setSize(s)}>
            {s}
          </button>
        ))}
        <button className="lab-btn" onClick={() => setSeed(seed + 1)} disabled={method === "judgmental"}>
          重新抽（第 {seed} 次）
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="lab-table">
          <thead>
            <tr>
              <th>组（层）</th>
              <th>总体</th>
              <th>抽中</th>
              <th>被抽中的机会</th>
              <th>权重</th>
              <th>样本里的错误</th>
              <th>真实错误率（假设）</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((x) => (
              <tr key={x.id} className={x.k === 0 ? "lab-hot" : undefined}>
                <td>{x.zh}</td>
                <td>{x.n}</td>
                <td>{x.k}</td>
                <td>{x.chance === null ? "未知（故意挑的）" : pct(x.chance)}</td>
                <td>{x.weight === null || method === "judgmental" ? "—" : x.weight.toFixed(1)}</td>
                <td>{x.k ? `${x.errs} / ${x.k}` : "—"}</td>
                <td>{pct(ASSUMED_ERROR[x.id as keyof typeof ASSUMED_ERROR])}</td>
              </tr>
            ))}
            <tr>
              <td>
                <b>合计</b>
              </td>
              <td>1,000</td>
              <td>{r.n}</td>
              <td colSpan={2}>—</td>
              <td>{`${r.errs} / ${r.n}`}</td>
              <td>{pct(r.trueOverall)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
        <div>
          直接合起来算：<b>{pct(r.unweighted)}</b>
        </div>
        <div>
          按组加权：<b>{r.weighted === null ? "算不了（有组没抽到）" : pct(r.weighted)}</b>
        </div>
        <div>
          真实整体（假设）：<b>{pct(r.trueOverall)}</b>
        </div>
      </div>
      <p className={`lab-decision ${tone}`}>
        <b>
          {method === "judgmental" ? "不能估计整体比例" : method === "stratified" ? "可以比较各组，整体要加权" : r.missing.length ? "整体可估，但有组没覆盖" : "可以估计整体"}
        </b>
        <span>{r.verdict}</span>
      </p>
      <p className="mt-2 text-[12px] text-fg-3">
        事件清单之外：{OUTSIDE_LIST.map((o) => o.zh).join("；")}。抽样结论只覆盖这 1,000 条记录。
      </p>
    </div>
  );
}

// Slide 18 "View sampling examples": agree the check before testing; targeted checks do not estimate rates.
export function SampleCheckLab() {
  const [vals, setVals] = useState(SAMPLE_CHECKS.map((c) => ({ ...c })));
  const set = (i: number, k: number) => setVals(vals.map((v, j) => (j === i ? { ...v, k: Math.max(0, Math.min(v.n, k)) } : v)));
  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 先约定标准，再看结果</span>
        <span className="text-[12px] text-fg-3">Slide 18 弹窗的两个例子</span>
      </div>
      <table className="lab-table">
        <thead>
          <tr>
            <th>例子</th>
            <th>抽样设计</th>
            <th>约定标准</th>
            <th>通过数</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          {vals.map((c, i) => {
            const r = checkResult(c);
            return (
              <tr key={c.id}>
                <td>{c.label}</td>
                <td>{c.design}</td>
                <td>{c.rule}</td>
                <td className="whitespace-nowrap">
                  <input type="number" className="lab-select w-[4.5em]" min={0} max={c.n} value={c.k} onChange={(e) => set(i, Number(e.target.value))} /> / {c.n}
                </td>
                <td>
                  <b style={{ color: r.met ? "var(--c-tip)" : "var(--c-warn)" }}>{r.met ? "Met" : "Not met"}</b>
                  <span className="block text-[12px] text-fg-3">
                    95% 区间 {pct(r.ci.lo)}–{pct(r.ci.hi)}
                    {c.every ? "（定向挑选，不能当整体比例用）" : ""}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {vals.map((c) => (
        <p key={c.id} className={`lab-decision ${checkResult(c).met ? "lab-forward" : "lab-flood"}`}>
          <b>{c.label}</b>
          <span>{checkResult(c).text}</span>
        </p>
      ))}
    </div>
  );
}

// Slides 21 & 23: required route (qualified reviewer) vs observed route → TP / FP / TN / FN.
export function RouteOutcomeLab() {
  const [seen, setSeen] = useState<Record<string, string>>(Object.fromEntries(ROUTE_CASES.map((c) => [c.id, c.seen])));
  const [guess, setGuess] = useState<Record<string, string>>({});
  const cases = ROUTE_CASES.map((c) => ({ ...c, seen: seen[c.id] }));
  const s = routeSummary(cases);
  const flip = (id: string) => setSeen({ ...seen, [id]: seen[id] === "agent" ? "advice" : "agent" });

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 该转人工的转了吗（TP / FP / TN / FN）</span>
        <span className="text-[12px] text-fg-3">Positive = 送到 Human Agent · Slides 21、23</span>
      </div>
      <p className="mt-2 text-[13px] text-fg-2">先自己判断每一行属于哪一格，再看答案。点「实际路由」可以改，看结果怎么变。</p>
      <div className="overflow-x-auto">
        <table className="lab-table">
          <thead>
            <tr>
              <th>测试请求</th>
              <th>应该（复核人判定）</th>
              <th>实际路由</th>
              <th>你的判断</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const ans = routeOutcome(c.need, c.seen);
              const g = guess[c.id];
              return (
                <tr key={c.id} className={g && ans === "FN" ? "lab-hot" : undefined}>
                  <td>
                    {c.label}
                    <span className="block text-[11px] text-fg-3">{c.src}</span>
                  </td>
                  <td>{c.need === "agent" ? "Human Agent" : "AI 建议"}</td>
                  <td>
                    <button className="lab-btn" onClick={() => flip(c.id)}>
                      {c.seen === "agent" ? "Human Agent queue" : "AI Assistant advice"}
                    </button>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {OUTCOMES.map((o) => (
                        <button
                          key={o.id}
                          className={`lab-btn ${g === o.id ? "lab-btn-on" : ""}`}
                          style={g === o.id ? { borderColor: g === ans ? "var(--c-tip)" : "var(--c-warn)", color: g === ans ? "var(--c-tip)" : "var(--c-warn)" } : undefined}
                          onClick={() => setGuess({ ...guess, [c.id]: o.id })}
                        >
                          {o.id}
                        </button>
                      ))}
                    </div>
                    {g ? (
                      <span className="mt-1 block text-[12px]">
                        {g === ans ? "✓ " : `✗ 应为 ${ans}。`}
                        {OUTCOMES.find((o) => o.id === ans)?.zh}；{c.harm}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {Object.keys(guess).length < cases.length ? (
        <p className="mt-3 text-[13px] text-fg-3">
          还有 {cases.length - Object.keys(guess).length} 行没判断；全部判断完后显示统计和结论。
          <button className="lab-btn ml-2" onClick={() => setGuess(Object.fromEntries(cases.map((c) => [c.id, routeOutcome(c.need, c.seen)])))}>
            直接看答案
          </button>
        </p>
      ) : (
        <>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] sm:max-w-[26em]">
        {OUTCOMES.map((o) => (
          <div key={o.id} className="rounded-lg border border-line px-3 py-2">
            <b>
              {o.id} = {s.counts[o.id as keyof typeof s.counts]}
            </b>
            <span className="block text-[12px] text-fg-3">{o.zh}</span>
          </div>
        ))}
      </div>
      <p className={`lab-decision ${s.policyMet ? "lab-forward" : "lab-flood"}`}>
        <b>{s.policyMet ? "这批案例没有漏转" : "必需的转交失败 → 政策要求没达到"}</b>
        <span>{s.verdict}</span>
      </p>
        </>
      )}
    </div>
  );
}

// Slides 12, 14, 15: design / implementation / operation, access rights, and the ISO 42001 result category.
export function ClaimEvidenceLab({ preset = "ico" }: { preset?: string }) {
  const [pid, setPid] = useState(preset);
  const [have, setHave] = useState<string[]>([]);
  const [failure, setFailure] = useState(false);
  const [approved, setApproved] = useState(false);
  const r = evaluateClaim(pid, have, failure, approved);
  const p = r.preset;
  const choose = (id: string) => {
    setPid(id);
    setHave([]);
    setFailure(false);
    setApproved(false);
  };
  const toggle = (id: string) => setHave(have.includes(id) ? have.filter((x) => x !== id) : [...have, id]);
  const accessTag = (a: string) => (a === "in" ? "授权内" : a === "approval" ? "要另行批准" : "超出授权");
  const tone = r.result.startsWith("Met") ? "lab-forward" : r.result === "Not met" ? "lab-flood" : "lab-filter";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 这份证据支持的是哪一层说法</span>
        <span className="text-[12px] text-fg-3">Design · Implementation · Operation</span>
      </div>
      <div className="lab-controls">
        {CLAIM_PRESETS.map((x) => (
          <button key={x.id} className={`lab-btn ${pid === x.id ? "lab-btn-on" : ""}`} onClick={() => choose(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px]">
        <b>要检验的说法：</b>
        {p.zh}
        <span className="block text-[12px] text-fg-3">{p.claim}</span>
      </p>
      <table className="lab-table">
        <thead>
          <tr>
            <th>拿到的证据（勾选）</th>
            <th>访问</th>
          </tr>
        </thead>
        <tbody>
          {p.evidence.map((e) => (
            <tr key={e.id}>
              <td>
                <label className="flex items-start gap-1.5">
                  <input type="checkbox" className="mt-1" checked={have.includes(e.id)} onChange={() => toggle(e.id)} />
                  <span>{e.label}</span>
                </label>
              </td>
              <td className="whitespace-nowrap text-[12px]" style={{ color: e.access === "out" ? "var(--c-warn)" : e.access === "approval" ? "var(--c-extra)" : undefined }}>
                {accessTag(e.access)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lab-controls text-[13px]">
        {p.evidence.some((e) => e.access === "approval") ? (
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
            已取得额外访问批准
          </label>
        ) : null}
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={failure} onChange={(e) => setFailure(e.target.checked)} />
          {p.failure.label}
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
        {CLAIM_LEVELS.map((l) => (
          <span key={l.id} className={`lab-btn ${r.levels[l.id as keyof typeof r.levels] ? "lab-btn-on" : ""}`}>
            {r.levels[l.id as keyof typeof r.levels] ? "✓" : "○"} {l.label} · {l.zh}
          </span>
        ))}
      </div>
      <p className={`lab-decision ${tone}`}>
        <b>ISO 42001 检查结果：{r.result}</b>
        <span>{r.why}</span>
      </p>
      {r.blocked.length ? (
        <p className="lab-decision lab-flood">
          <b>这些证据现在不能用</b>
          <span>{r.blocked.join("；")}——不在现有访问授权内（要另行批准，或根本超出授权）。先申请批准；拿不到就在报告里写明没检查。</span>
        </p>
      ) : null}
      {r.notes.length ? (
        <ul className="mt-2 list-disc pl-5 text-[13px] text-fg-2">
          {r.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
