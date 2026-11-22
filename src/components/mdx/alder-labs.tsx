"use client";

import { useState } from "react";
import {
  ACTIONS,
  CALLERS,
  DESIGNS,
  RELEASE_CHECKS,
  RESTART_ITEMS,
  SCORE_PRESETS,
  TIMELINE,
  evaluateCall,
  evaluateRestart,
  evaluateScores,
} from "./alder-logic.mjs";

const pick = <T extends { id: string; label: string }>(xs: T[], v: string, set: (x: string) => void) => (
  <select className="lab-select" value={v} onChange={(e) => set(e.target.value)}>
    {xs.map((x) => (
      <option key={x.id} value={x.id}>
        {x.label}
      </option>
    ))}
  </select>
);

// ISOM 6200 L4 · Alder: who may call which tool, where the check sits, what an injected note can and cannot do.
export function AlderGateLab() {
  const [caller, setCaller] = useState("ai");
  const [action, setAction] = useState("pay");
  const [approval, setApproval] = useState(false);
  const [note, setNote] = useState(true);
  const [design, setDesign] = useState("gate");
  const r = evaluateCall({ caller, action, approval, note, design });
  const tone = r.outcome === "deny" ? "lab-filter" : r.outcome === "allow" && !/没有|错了|自己付/.test(r.effect) ? "lab-forward" : "lab-flood";
  const head = r.outcome === "deny" ? "Gate 拒绝" : r.outcome === "allow" ? "执行" : "取决于模型（不可测试的控制）";
  const lamp = (on: boolean, t: string) => (
    <span className={`lab-btn ${on ? "lab-btn-on" : ""}`} style={on ? { borderColor: "var(--c-warn)", color: "var(--c-warn)" } : undefined}>
      {on ? "●" : "○"} {t}
    </span>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Alder 的工具调用过 gate 吗</span>
        <span className="text-[12px] text-fg-3">虚构案例 · Slides 4、11、25–28、43–52</span>
      </div>
      <table className="lab-table">
        <tbody>
          <tr>
            <th className="whitespace-nowrap">调用者</th>
            <td>{pick(CALLERS, caller, setCaller)}</td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">请求的动作</th>
            <td>{pick(ACTIONS, action, setAction)}</td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">控制设计</th>
            <td>
              {pick(DESIGNS, design, setDesign)}
              <span className="block text-[12px] text-fg-3">{DESIGNS.find((d) => d.id === design)?.zh}</span>
            </td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">条件</th>
            <td className="flex flex-wrap gap-3 text-[13px]">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={approval} onChange={(e) => setApproval(e.target.checked)} />
                这笔申请有有效的 Finance 批准
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={note} onChange={(e) => setNote(e.target.checked)} />
                context 里有被注入的 note
              </label>
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${tone}`}>
        <b>
          {head} · {r.effect}
        </b>
        <span>
          {r.why} {r.noteText}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-fg-3">Lethal trifecta：</span>
        {lamp(r.trifecta.untrusted, "Untrusted input")}
        {lamp(r.trifecta.broad, "Broad permissions")}
        {lamp(r.trifecta.autonomous, "Autonomous execution")}
        <span className={r.trifecta.all ? "font-semibold text-[color:var(--c-warn)]" : "text-fg-3"}>
          {r.trifecta.all ? "三个条件都在：被操纵的提议可以直接变成业务后果" : "至少断了一环"}
        </span>
      </div>
      <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
        <div>
          <div className="mb-1 font-semibold">要留下的记录</div>
          <ul className="list-disc pl-5">
            {r.records.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 font-semibold">应该响的告警</div>
          {r.alerts.length ? (
            <ul className="list-disc pl-5">
              {r.alerts.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            <span className="text-fg-3">无（正常路径）</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Slides 20 / 22: score by group, sample size, and what the evidence supports for release scope.
export function GroupScoreLab() {
  const [preset, setPreset] = useState(SCORE_PRESETS[0].id);
  const p = SCORE_PRESETS.find((x) => x.id === preset)!;
  const [groups, setGroups] = useState(p.groups.map((g) => ({ ...g })));
  const [threshold, setThreshold] = useState(90);
  const [unauth, setUnauth] = useState(0);
  const [checks, setChecks] = useState<string[]>([]);
  const r = evaluateScores({ groups, threshold: threshold / 100, unauthorised: unauth, checks });
  const choose = (id: string) => {
    const q = SCORE_PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setGroups(q.groups.map((g) => ({ ...g })));
  };
  const setG = (i: number, key: "k" | "n", v: number) => setGroups(groups.map((g, j) => (j === i ? { ...g, [key]: v } : g)));
  const num = (v: number, on: (x: number) => void) => (
    <input type="number" min={0} className="lab-select w-[5.5em]" value={v} onChange={(e) => on(Number(e.target.value))} />
  );
  const tone = r.decision === "Hold" ? "lab-flood" : r.decision === "Limited pilot" ? "lab-filter" : "lab-forward";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 分组看分数，再决定发布范围</span>
        <span className="text-[12px] text-fg-3">95% Wilson 区间</span>
      </div>
      <div className="lab-controls flex flex-wrap gap-2">
        {SCORE_PRESETS.map((x) => (
          <button key={x.id} className={`lab-btn ${preset === x.id ? "lab-btn-on" : ""}`} onClick={() => choose(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[12px] text-fg-3">{p.note}</p>
      <table className="lab-table">
        <thead>
          <tr>
            <th>组</th>
            <th>通过 / 测试数</th>
            <th>比例</th>
            <th>95% 区间</th>
            <th>≥ 标准？</th>
          </tr>
        </thead>
        <tbody>
          {r.rows.map((g, i) => (
            <tr key={g.name}>
              <td>{g.name}</td>
              <td className="whitespace-nowrap">
                {num(groups[i].k, (v) => setG(i, "k", v))} / {num(groups[i].n, (v) => setG(i, "n", v))}
              </td>
              <td>{(g.p * 100).toFixed(1)}%</td>
              <td className="whitespace-nowrap">
                {(g.ci.lo * 100).toFixed(1)}–{(g.ci.hi * 100).toFixed(1)}%
              </td>
              <td>{g.pass ? "✓" : "✗"}</td>
            </tr>
          ))}
          <tr>
            <td>
              <b>合计</b>
            </td>
            <td>
              {r.K} / {r.N}
            </td>
            <td>{(r.overall * 100).toFixed(1)}%</td>
            <td colSpan={2} className="text-[12px] text-fg-3">
              合计只作参考，不替代分组标准
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px]">
        <label className="flex items-center gap-1.5">
          每组标准 ≥ {num(threshold, setThreshold)} %
        </label>
        <label className="flex items-center gap-1.5">
          测试中未授权执行次数 {num(unauth, setUnauth)}
        </label>
      </div>
      <div className="mt-3 text-[13px]">
        <div className="mb-1 font-semibold">已经记录在案的检查</div>
        {RELEASE_CHECKS.map((c) => (
          <label key={c.id} className="flex items-start gap-1.5">
            <input
              type="checkbox"
              className="mt-1"
              checked={checks.includes(c.id)}
              onChange={(e) => setChecks(e.target.checked ? [...checks, c.id] : checks.filter((x) => x !== c.id))}
            />
            <span>
              {c.label} <span className="text-fg-3">（{c.need === "pilot" ? "pilot 前必需" : "全面发布前"}）</span>
            </span>
          </label>
        ))}
      </div>
      {r.warnings.map((w) => (
        <p key={w} className="lab-decision lab-filter">
          <b>注意</b>
          <span>{w}</span>
        </p>
      ))}
      <p className={`lab-decision ${tone}`}>
        <b>建议：{r.decision}</b>
        <span>{r.why}</span>
      </p>
    </div>
  );
}

// Slides 47–56 + Quiz Q5: what must be true before the paused service restarts.
export function RestartCheckLab() {
  const [checked, setChecked] = useState<string[]>(["trap_label", "trap_canary"]);
  const r = evaluateRestart(checked);
  const toggle = (id: string, on: boolean) => setChecked(on ? [...checked, id] : checked.filter((x) => x !== id));
  const groups = [...new Set(RESTART_ITEMS.map((i) => i.group))];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Alder 什么时候可以重启</span>
        <span className="text-[12px] text-fg-3">Slides 49–56 · Quiz Q5</span>
      </div>
      <table className="lab-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>发生了什么</th>
            <th>记录</th>
          </tr>
        </thead>
        <tbody>
          {TIMELINE.map((t) => (
            <tr key={t.what} className={t.fact === "unknown" ? "text-fg-3" : undefined}>
              <td className="whitespace-nowrap font-mono">{t.t}</td>
              <td>{t.what}</td>
              <td>{t.rec}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[12px] text-fg-3">时间顺序本身不能证明因果：note 在付款前被检索到，不等于 note 触发了付款（Slide 49、52）。</p>
      <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g}>
            <div className="mb-1 font-semibold">{g}</div>
            {RESTART_ITEMS.filter((i) => i.group === g).map((i) => (
              <label key={i.id} className="flex items-start gap-1.5">
                <input type="checkbox" className="mt-1" checked={checked.includes(i.id)} onChange={(e) => toggle(i.id, e.target.checked)} />
                <span>{i.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
      {r.traps.map((t) => (
        <p key={t.id} className="lab-decision lab-flood">
          <b>陷阱：{t.label}</b>
          <span>{t.trap}</span>
        </p>
      ))}
      <p className={`lab-decision ${r.ready ? "lab-forward" : "lab-flood"}`}>
        <b>{r.ready ? "可以申请重启" : "不能重启"}</b>
        <span>
          {r.verdict}
          {!r.ready && r.missing.length > 0 && ` 缺：${r.missing.map((m) => m.label.split("：")[0].split("（")[0]).join("；")}。`}
        </span>
      </p>
    </div>
  );
}
