"use client";

import { useState } from "react";
import {
  DELPHI_ESTIMATORS,
  DELPHI_PRESETS,
  FPA_ELEMENTS,
  FPA_PRESETS,
  HRBPS_FACTS,
  HRBPS_PRESETS,
  ICCP_LANES,
  LEVELS,
  RANSOM_DEFAULT,
  RANSOM_PRESETS,
  RFC_CASES,
  delphi,
  fmtM,
  fmtUsd,
  fpa,
  hrbpsWhatIf,
  iccpPath,
  ransomCompare,
} from "./project-logic.mjs";

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;
const r1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString("en-US");

function Head({ children }: { children: React.ReactNode }) {
  return (
    <div className="lab-head">
      <span className="lab-kicker" style={{ textTransform: "none" }}>
        INTERACTIVE · {children}
      </span>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, show }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; show?: string }) {
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span style={{ width: 132, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} style={{ flex: 1, minWidth: 60, accentColor: "var(--accent)" }} />
      <b style={{ width: 64, textAlign: "right" }}>{show ?? value}</b>
    </label>
  );
}

// ---------- Function point analysis ----------

type FpaInputs = (typeof FPA_PRESETS)[number]["x"];

export function FunctionPointLab() {
  const [presetId, setPresetId] = useState(FPA_PRESETS[0].id);
  const [x, setX] = useState<FpaInputs>(FPA_PRESETS[0].x);
  const r = fpa(x);
  const preset = FPA_PRESETS.find((p) => p.id === presetId);
  const set = (patch: Partial<FpaInputs>) => {
    setPresetId("custom");
    setX((s) => ({ ...s, ...patch }));
  };
  const setAt = (key: "counts" | "levels", i: number, v: number) => set({ [key]: x[key].map((a, k) => (k === i ? v : a)) } as Partial<FpaInputs>);

  return (
    <div className="lab not-prose">
      <Head>Function Point Analysis：数功能 → 加权 → 人月 → 工期和成本（Slides 11–13）</Head>
      <div className="lab-controls">
        {FPA_PRESETS.map((p) => (
          <button key={p.id} type="button" className={chip(presetId === p.id)} onClick={() => { setPresetId(p.id); setX(p.x); }}>
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}
      <div className="overflow-x-auto">
        <table className="lab-table" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>Element</th>
              <th>数量</th>
              <th>复杂度（权重）</th>
              <th style={{ textAlign: "right" }}>Function points</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((row, i) => (
              <tr key={row.id}>
                <td>{row.label}</td>
                <td>
                  <input aria-label={`${row.label} 数量`} type="number" min={0} max={999} value={x.counts[i]} onChange={(e) => setAt("counts", i, Math.max(0, +e.target.value || 0))} className="lab-select" style={{ width: 64 }} />
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {LEVELS.map((lv, k) => (
                      <button key={lv} type="button" className={chip(x.levels[i] === k)} onClick={() => setAt("levels", i, k)}>
                        {lv} ×{FPA_ELEMENTS[i].weights[k]}
                      </button>
                    ))}
                  </div>
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                  {row.count} × {row.weight} = <b>{row.points}</b>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}><b>Total function points（系统规模）</b></td>
              <td style={{ textAlign: "right" }}><b>{r.total}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Slider label="每人月完成 FP" value={x.rate} min={2} max={15} onChange={(v) => set({ rate: v })} />
        <Slider label="程序员人数" value={x.team} min={1} max={40} onChange={(v) => set({ team: v })} />
        <Slider label="月薪 / 人（示意）" value={x.wage} min={2000} max={20000} step={500} onChange={(v) => set({ wage: v })} show={fmtUsd(x.wage)} />
      </div>
      <p className="lab-decision lab-forward">
        <b>
          {r.total} FP ÷ {x.rate} = {r1(r.personMonths)} 人月 → {x.team} 人约 {r1(r.months)} 个月 → 人工成本约 {fmtUsd(r.cost)}
        </b>
        <span>人月（person-month）= 一个人工作一个月的工作量。公式假设人和月可以互换，所以「加人就能缩短工期」只在纸面上成立。</span>
      </p>
    </div>
  );
}

// ---------- Delphi ----------

export function DelphiLab() {
  const [presetId, setPresetId] = useState(DELPHI_PRESETS[0].id);
  const [initial, setInitial] = useState<number[]>(DELPHI_PRESETS[0].initial);
  const [anonymous, setAnonymous] = useState(DELPHI_PRESETS[0].anonymous);
  const [pull, setPull] = useState(50);
  const rows = delphi(initial, { rounds: 3, pull: pull / 100, anonymous }) as { round: number; values: number[]; median: number; min: number; max: number; spread: number }[];
  const preset = DELPHI_PRESETS.find((p) => p.id === presetId);
  const top = Math.max(...initial, 1) * 1.05;
  const last = rows[rows.length - 1];

  return (
    <div className="lab not-prose">
      <Head>Delphi：匿名估算、汇总、再估（Slide 9）</Head>
      <div className="lab-controls">
        {DELPHI_PRESETS.map((p) => (
          <button key={p.id} type="button" className={chip(presetId === p.id)} onClick={() => { setPresetId(p.id); setInitial(p.initial); setAnonymous(p.anonymous); }}>
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {DELPHI_ESTIMATORS.map((name, i) => (
          <Slider key={name} label={`第 0 轮 · ${name}`} value={initial[i]} min={4} max={80} onChange={(v) => { setPresetId("custom"); setInitial((s) => s.map((a, k) => (k === i ? v : a))); }} show={`${initial[i]} 人月`} />
        ))}
        <Slider label="每轮向锚点靠拢" value={pull} min={10} max={90} step={10} onChange={setPull} show={`${pull}%`} />
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={anonymous} onChange={(e) => { setPresetId("custom"); setAnonymous(e.target.checked); }} />
          匿名（只看到汇总，不知道谁说的）
        </label>
      </div>
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <div key={row.round} className="text-[12.5px]">
            <div className="flex justify-between text-fg-3">
              <span>第 {row.round} 轮</span>
              <span>中位数 {row.median} · 范围 {r1(row.min)}–{r1(row.max)}（差 {row.spread}）</span>
            </div>
            <div style={{ position: "relative", height: 18, background: "var(--subtle)", borderRadius: 4 }}>
              <span style={{ position: "absolute", left: `${(row.min / top) * 100}%`, width: `${((row.max - row.min) / top) * 100}%`, top: 8, height: 2, background: "var(--line-strong)" }} />
              {row.values.map((v, i) => (
                <span key={i} title={`${DELPHI_ESTIMATORS[i]}：${v}`} style={{ position: "absolute", left: `calc(${(v / top) * 100}% - 5px)`, top: 4, width: 10, height: 10, borderRadius: 5, background: i === 0 ? "#c0392b" : "var(--accent)", opacity: 0.85 }} />
              ))}
              <span style={{ position: "absolute", left: `${(row.median / top) * 100}%`, top: 0, bottom: 0, width: 2, background: "var(--fg-2)" }} />
            </div>
          </div>
        ))}
      </div>
      <p className="lab-decision lab-forward">
        <b>
          三轮后：{anonymous ? `收敛到约 ${last.median} 人月` : `大家靠向资深经理的 ${initial[0]} 人月`}，分歧从 {rows[0].spread} 缩到 {last.spread}
        </b>
        <span>红点是资深经理。{anonymous ? "匿名时没有人知道哪个数字是老板的，锚点是全体的中位数。" : "名字公开时，其他人向老板的数字靠拢：收敛了，但收敛到的是权力，不是信息。"}收敛不等于准确：如果所有人共享同一个盲点，Delphi 只会让这个盲点更自信。</span>
      </p>
    </div>
  );
}

// ---------- Integrative change control ----------

type Answers = { complete: boolean; authority: boolean; approved: boolean };
type Step = { id: string; lane: string; label: string; answer?: boolean; ask?: string };

export function ChangeControlLab() {
  const [caseId, setCaseId] = useState(RFC_CASES[0].id);
  const rfc = RFC_CASES.find((c) => c.id === caseId) ?? RFC_CASES[0];
  const [answers, setAnswers] = useState<Answers>(rfc.answers);
  const res = iccpPath(answers) as { path: Step[]; end: string; loops: number };
  const pick = (id: string) => {
    const c = RFC_CASES.find((k) => k.id === id) ?? RFC_CASES[0];
    setCaseId(id);
    setAnswers(c.answers);
  };
  const toggle = (k: keyof Answers) => setAnswers((a) => ({ ...a, [k]: !a[k] }));
  const laneColor: Record<string, string> = { Initiator: "var(--c-board, #2f6fde)", Screener: "var(--c-tip, #1a8f5a)", CAB: "var(--c-warn, #c0392b)", Owner: "var(--c-extra, #8e44ad)" };

  return (
    <div className="lab not-prose">
      <Head>Integrative Change Control：一个 RFC 走完泳道图（Slides 17–18）</Head>
      <div className="lab-controls">
        {RFC_CASES.map((c) => (
          <button key={c.id} type="button" className={chip(caseId === c.id)} onClick={() => pick(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <table className="lab-table">
        <tbody>
          <tr><th>提交人</th><td>{rfc.who}</td></tr>
          <tr><th>变更内容</th><td>{rfc.desc}</td></tr>
          <tr><th>优先级 / 类别</th><td>{rfc.priority} · {rfc.category}</td></tr>
          <tr><th>影响的方面</th><td>{rfc.impact}</td></tr>
        </tbody>
      </table>
      <div className="lab-controls">
        <span className="text-[13px] text-fg-3">三个判断点（可以自己改）：</span>
        <button type="button" className={chip(answers.complete)} onClick={() => toggle("complete")}>RFC 齐全：{answers.complete ? "Yes" : "No"}</button>
        <button type="button" className={chip(answers.authority)} onClick={() => toggle("authority")}>CAB 有权限：{answers.authority ? "Yes" : "No"}</button>
        <button type="button" className={chip(answers.approved)} onClick={() => toggle("approved")}>批准：{answers.approved ? "Yes" : "No"}</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11.5px]">
        {ICCP_LANES.map((l) => (
          <span key={l} className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: laneColor[l] }} />{l}</span>
        ))}
      </div>
      <ol className="mt-2 grid gap-1 text-[13px]" style={{ listStyle: "none", padding: 0 }}>
        {res.path.map((s, i) => (
          <li key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${laneColor[s.lane]}`, paddingLeft: 8 }}>
            <span style={{ width: 18, color: "var(--fg-3)", flexShrink: 0 }}>{i + 1}</span>
            <span style={{ width: 70, flexShrink: 0, color: laneColor[s.lane], fontWeight: 600 }}>{s.lane}</span>
            <span>
              {s.label}
              {s.ask && <b style={{ marginLeft: 6 }}>→ {s.answer ? "Yes" : "No"}</b>}
            </span>
          </li>
        ))}
      </ol>
      <p className={`lab-decision ${res.end === "done" ? "lab-forward" : "lab-flood"}`}>
        <b>
          {res.end === "done" ? "已批准并执行" : "已驳回，记入变更日志"}（{res.path.length} 步{res.loops ? `，退回补充信息 ${res.loops} 次` : ""}）
        </b>
        <span>{rfc.why}</span>
      </p>
      <p className="mt-1 text-[11.5px] text-fg-3">Slide 17 原图里，CAB 有权限时直接走到「批准吗？」；没有权限先 Escalate（上报给发起人或指导委员会）再决定。四个 RFC 中只有 RFC-042 是课件原有的例子，其余是我按案例编的情景。</p>
    </div>
  );
}

// ---------- HRBPS scope creep ----------

export function HrbpsScopeLab() {
  const [presetId, setPresetId] = useState(HRBPS_PRESETS[0].id);
  const [minor, setMinor] = useState(0);
  const [model, setModel] = useState(0);
  const [minorWeeks, setMinorWeeks] = useState(1.5);
  const [modelWeeks, setModelWeeks] = useState(8);
  const r = hrbpsWhatIf({ minor, model, minorWeeks, modelWeeks });
  const preset = HRBPS_PRESETS.find((p) => p.id === presetId);
  const custom = () => setPresetId("custom");
  const bar = (label: string, months: number, color: string) => (
    <div className="flex items-center gap-2 text-[13px]">
      <span style={{ width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, background: "var(--line)", height: 10, borderRadius: 5, overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${Math.min(100, (months / 40) * 100)}%`, background: color }} />
      </span>
      <b style={{ width: 72, textAlign: "right" }}>{r1(months)} 个月</b>
    </div>
  );

  return (
    <div className="lab not-prose">
      <Head>HRBPS：范围蔓延的账（短案例；增强的工作量是示意假设）</Head>
      <div className="lab-controls">
        {HRBPS_PRESETS.map((p) => (
          <button key={p.id} type="button" className={chip(presetId === p.id)} onClick={() => { setPresetId(p.id); setMinor(p.x.minor); setModel(p.x.model); }}>
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        <Slider label="接受的小增强" value={minor} min={0} max={HRBPS_FACTS.enhancements - HRBPS_FACTS.modelChanges} onChange={(v) => { custom(); setMinor(v); }} show={`${minor} / 20`} />
        <Slider label="接受的数据模型改动" value={model} min={0} max={HRBPS_FACTS.modelChanges} onChange={(v) => { custom(); setModel(v); }} show={`${model} / 2`} />
        <Slider label="每个小增强（周）" value={minorWeeks} min={0.5} max={4} step={0.5} onChange={(v) => { custom(); setMinorWeeks(v); }} />
        <Slider label="每个模型改动（周）" value={modelWeeks} min={2} max={16} onChange={(v) => { custom(); setModelWeeks(v); }} />
      </div>
      <div className="mt-3 grid gap-1">
        {bar("原计划（倒推）", r.original, "var(--fg-3)")}
        {bar("已批准范围", r.original + HRBPS_FACTS.extraMonths, "#c58a00")}
        {bar("加上增强", r.months, "#c0392b")}
      </div>
      <p className="lab-decision lab-flood">
        <b>
          工期 +{Math.round(r.schedulePct)}%（案例：+45%），预算约 +{Math.round(r.budgetPct)}%（案例：+62%）
        </b>
        <span>
          倒推：7 个月是原计划的 45%，所以原计划 ≈ 7 ÷ 0.45 ≈ {r1(r.original)} 个月；已经过去的时间只做出 40% 的功能。增强每多接受一个，延期就在这个基础上继续叠加；预算按「每月花费不变」外推。
        </span>
      </p>
    </div>
  );
}

// ---------- Norsk Hydro: pay or refuse ----------

type RansomInputs = typeof RANSOM_DEFAULT;

export function RansomLab() {
  const [presetId, setPresetId] = useState(RANSOM_PRESETS[0].id);
  const [x, setX] = useState<RansomInputs>(RANSOM_DEFAULT);
  const r = ransomCompare(x);
  const preset = RANSOM_PRESETS.find((p) => p.id === presetId);
  const set = <K extends keyof RansomInputs>(k: K, v: RansomInputs[K]) => {
    setPresetId("custom");
    setX((s) => ({ ...s, [k]: v }));
  };
  const max = Math.max(r.pay.total, r.refuse.total, 1);
  const seg = (v: number, color: string, label: string) => (v > 0 ? <span title={`${label} ${fmtM(v)}`} style={{ display: "block", height: "100%", width: `${(v / max) * 100}%`, background: color }} /> : null);

  return (
    <div className="lab not-prose">
      <Head>Norsk Hydro：付赎金还是拒付？只算钱的那一半（除「拒付约 $50M」外都是假设）</Head>
      <div className="lab-controls">
        {RANSOM_PRESETS.map((p) => (
          <button key={p.id} type="button" className={chip(presetId === p.id)} onClick={() => { setPresetId(p.id); setX(p.x); }}>
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        <Slider label="赎金" value={x.ransom} min={0} max={60} onChange={(v) => set("ransom", v)} show={fmtM(x.ransom)} />
        <Slider label="密钥真能解密的概率" value={x.keyWorks} min={0} max={100} step={5} onChange={(v) => set("keyWorks", v)} show={`${x.keyWorks}%`} />
        <Slider label="有密钥：停产天数" value={x.daysWithKey} min={1} max={30} onChange={(v) => set("daysWithKey", v)} />
        <Slider label="没密钥：停产天数" value={x.daysWithoutKey} min={1} max={60} onChange={(v) => set("daysWithoutKey", v)} />
        <Slider label="每天停产损失" value={x.dailyLoss} min={1} max={15} onChange={(v) => set("dailyLoss", v)} show={fmtM(x.dailyLoss)} />
        <Slider label="清理和重建系统" value={x.rebuild} min={0} max={40} onChange={(v) => set("rebuild", v)} show={fmtM(x.rebuild)} />
        <Slider label="付钱后再被攻击的概率" value={x.repeat} min={0} max={80} step={5} onChange={(v) => set("repeat", v)} show={`${x.repeat}%`} />
        <Slider label="再被攻击一次的损失" value={x.repeatCost} min={0} max={100} step={5} onChange={(v) => set("repeatCost", v)} show={fmtM(x.repeatCost)} />
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={x.rebuildAnyway} onChange={(e) => set("rebuildAnyway", e.target.checked)} />
          付了钱也要重建（攻击者有管理员权限，系统已不可信）
        </label>
      </div>
      <div className="mt-3 grid gap-2 text-[13px]">
        <div className="flex items-center gap-2">
          <span style={{ width: 70 }}>付赎金</span>
          <span className="flex" style={{ flex: 1, height: 14, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
            {seg(r.pay.ransom, "#c0392b", "赎金")}
            {seg(r.pay.downtime, "#c58a00", "停产")}
            {seg(r.pay.rebuild, "var(--fg-3)", "重建")}
            {seg(r.pay.repeat, "#8e44ad", "再被攻击（期望）")}
          </span>
          <b style={{ width: 70, textAlign: "right" }}>{fmtM(r.pay.total)}</b>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ width: 70 }}>拒付</span>
          <span className="flex" style={{ flex: 1, height: 14, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
            {seg(r.refuse.downtime, "#c58a00", "停产")}
            {seg(r.refuse.rebuild, "var(--fg-3)", "重建")}
          </span>
          <b style={{ width: 70, textAlign: "right" }}>{fmtM(r.refuse.total)}</b>
        </div>
        <p className="text-[11.5px] text-fg-3">颜色：红 = 赎金 · 黄 = 停产 · 灰 = 重建 · 紫 = 再被攻击的期望损失</p>
      </div>
      <p className={`lab-decision ${r.cheaper === "refuse" ? "lab-forward" : "lab-flood"}`}>
        <b>{r.cheaper === "refuse" ? `拒付在账面上便宜约 ${fmtM(r.gap)}` : `付钱在账面上便宜约 ${fmtM(r.gap)}`}</b>
        <span>
          这个账没算进去的：付钱可能违反制裁规定、资助犯罪团伙、让公司被标记为「会付钱」；拒付并公开带来的信任和股价反应。{r.cheaper === "pay" ? "账面上付钱更便宜时，能不能说不取决于事前准备：离线备份、手工流程、事件响应团队。" : ""}
        </span>
      </p>
    </div>
  );
}
