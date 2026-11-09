"use client";

import { useState } from "react";
import {
  CAPACITY_DEFAULT,
  CAPACITY_PRESETS,
  LAYER_PRESETS,
  OPTION_SETS,
  PROVIDERS,
  capacityMix,
  capacitySweep,
  capacityVerdict,
  flips,
  fmtEur,
  layerCase,
  layerVerdict,
  quoteRow,
  weightedScores,
} from "./sourcing-logic.mjs";

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;
type Option = { id: string; label: string; total: number };
type Scored = { totals: Option[]; top: number; winners: Option[]; tie: boolean };

// Method and Cohere: change the weights or the 1–5 scores and see which option wins and what would flip it.
export function WeightedOptionLab({ set = "method" }: { set?: "method" | "cohere" }) {
  const data = OPTION_SETS[set];
  const [presetId, setPresetId] = useState(data.presets[0].id);
  const [weights, setWeights] = useState<number[]>(data.presets[0].weights);
  const [scores, setScores] = useState<number[][]>(data.criteria.map((c) => c.scores));
  const r = weightedScores(data, weights, scores) as Scored;
  const flipList = flips(data, weights, scores) as { criterion: string; from: number; to: number; winner: string }[];
  const preset = data.presets.find((p) => p.id === presetId);
  const max = Math.max(1, ...r.totals.map((o) => o.total));

  const setScore = (c: number, o: number, v: number) => setScores((s) => s.map((row, i) => (i === c ? row.map((x, k) => (k === o ? v : x)) : row)));
  const setWeight = (c: number, v: number) => {
    setPresetId("custom");
    setWeights((w) => w.map((x, i) => (i === c ? v : x)));
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · {data.title}（{data.source}）
        </span>
      </div>
      <div className="lab-controls">
        {data.presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={chip(presetId === p.id)}
            onClick={() => {
              setPresetId(p.id);
              setWeights(p.weights);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}

      <div className="overflow-x-auto">
        <table className="lab-table" style={{ minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 120 }}>标准</th>
              <th>权重 0–5</th>
              {data.options.map((o) => (
                <th key={o.id}>{o.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.criteria.map((c, ci) => (
              <tr key={c.id}>
                <td>{c.label}</td>
                <td>
                  <label className="flex items-center gap-1">
                    <input aria-label={`${c.label} 的权重`} type="range" min={0} max={5} value={weights[ci]} onChange={(e) => setWeight(ci, +e.target.value)} style={{ width: 64, accentColor: "var(--accent)" }} />
                    <b>{weights[ci]}</b>
                  </label>
                </td>
                {data.options.map((o, oi) => (
                  <td key={o.id}>
                    <select aria-label={`${o.label} 在 ${c.label} 的得分`} value={scores[ci][oi]} onChange={(e) => setScore(ci, oi, +e.target.value)} style={{ background: "transparent", color: "inherit" }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid gap-1">
        {r.totals.map((o) => (
          <div key={o.id} className="flex items-center gap-2 text-[13px]">
            <span style={{ width: 120, flexShrink: 0 }}>{o.label}</span>
            <span style={{ flex: 1, background: "var(--line)", height: 10, borderRadius: 5, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${(o.total / max) * 100}%`, background: o.total === r.top ? "var(--accent)" : "var(--fg-3)" }} />
            </span>
            <b style={{ width: 32, textAlign: "right" }}>{o.total}</b>
          </div>
        ))}
      </div>

      <p className="lab-decision lab-forward">
        <b>{r.tie ? `并列第一：${r.winners.map((o) => o.label).join("、")}` : `得分最高：${r.winners[0].label}`}</b>
        <span>
          {r.tie
            ? "这些权重分不出高下，需要补充信息或改变方案。"
            : flipList.length
              ? `什么会改变结论：${flipList.map((f) => `「${f.criterion}」权重从 ${f.from} 变成 ${f.to} → ${f.winner}`).join("；")}。`
              : "在 0–5 范围内只改一个权重，结论都不变。"}
        </span>
      </p>
      <p className="mt-1 text-[11.5px] text-fg-3">默认分数是我的判断，案例没有给分。这个练习的价值是把分歧摆到桌面上：争论的是哪个标准更重要，还是对事实的判断不同。</p>
    </div>
  );
}

type LayerInputs = (typeof LAYER_PRESETS)[number]["x"];

const LAYER_FIELDS: { key: keyof LayerInputs; label: string; min: number; max: number; step: number; money?: boolean }[] = [
  { key: "customers", label: "现有客户数", min: 5, max: 100, step: 5 },
  { key: "perYear", label: "每年新客户", min: 0, max: 40, step: 1 },
  { key: "vonzuCost", label: "经 VONZU 集成一个客户", min: 500, max: 8000, step: 250, money: true },
  { key: "layerCost", label: "用中间层映射一个客户", min: 0, max: 2000, step: 100, money: true },
  { key: "moveCost", label: "把一个现有客户迁到门户", min: 0, max: 2000, step: 100, money: true },
  { key: "runPct", label: "每年运行维护（占开发费 %）", min: 0, max: 40, step: 5 },
  { key: "kept", label: "每年多留住的客户", min: 0, max: 5, step: 1 },
  { key: "margin", label: "每个客户的年贡献", min: 0, max: 60000, step: 5000, money: true },
  { key: "connectorPct", label: "换 SaaS 时重写连接器（占开发费 %）", min: 5, max: 50, step: 5 },
];

// Exhibit 5, redrawn: every customer wired to the SaaS versus one portal in between.
function LayerDiagram() {
  const ys = [22, 52, 82];
  const box = { fill: "var(--accent-wash, #e8eef7)", stroke: "var(--accent, #1f4e8c)" };
  const text = { fontSize: 11, textAnchor: "middle" as const, fill: "var(--fg, #1c1c1f)" };
  const line = { stroke: "var(--fg-3, #8b8b93)", strokeWidth: 1.2 };
  return (
    <svg viewBox="0 0 640 110" className="my-2 w-full" style={{ minWidth: 520 }} role="img" aria-label="直接集成与中间层的结构对比">
      <text x={4} y={11} fontSize={11} fill="var(--fg-3, #8b8b93)">
        现在：每个客户各做一次，由 VONZU 团队完成
      </text>
      {ys.map((y, i) => (
        <g key={i}>
          <rect x={4} y={y - 11} width={70} height={22} rx={4} {...box} />
          <text x={39} y={y + 4} {...text}>
            客户 {i + 1}
          </text>
          <line x1={74} y1={y} x2={220} y2={52} {...line} />
        </g>
      ))}
      <rect x={220} y={35} width={80} height={34} rx={4} {...box} />
      <text x={260} y={56} {...text}>
        VONZU
      </text>

      <text x={340} y={11} fontSize={11} fill="var(--fg-3, #8b8b93)">
        中间层：客户对接 Method，VONZU 只有一条 API
      </text>
      {ys.map((y, i) => (
        <g key={i}>
          <rect x={340} y={y - 11} width={62} height={22} rx={4} {...box} />
          <text x={371} y={y + 4} {...text}>
            客户 {i + 1}
          </text>
          <line x1={402} y1={y} x2={450} y2={52} {...line} />
        </g>
      ))}
      <rect x={450} y={35} width={84} height={34} rx={4} fill="var(--accent, #1f4e8c)" />
      <text x={492} y={56} fontSize={11} textAnchor="middle" fill="#fff">
        Method 门户
      </text>
      <line x1={534} y1={52} x2={568} y2={52} stroke="var(--accent, #1f4e8c)" strokeWidth={2.5} />
      <rect x={568} y={35} width={68} height={34} rx={4} {...box} />
      <text x={602} y={56} {...text}>
        任一 SaaS
      </text>
    </svg>
  );
}

// Exhibit 6: compare the three quotes, then test whether the layer pays back and what it does to switching cost.
export function IntegrationLayerLab() {
  const [presetId, setPresetId] = useState(LAYER_PRESETS[1].id);
  const [x, setX] = useState<LayerInputs>(LAYER_PRESETS[1].x);
  const [providerId, setProviderId] = useState("A");
  const preset = LAYER_PRESETS.find((p) => p.id === presetId);
  const rows = PROVIDERS.map((p) => ({ q: quoteRow(p), r: layerCase(x, p) }));
  const current = rows.find((o) => o.q.id === providerId) ?? rows[0];
  const set = (k: keyof LayerInputs, v: number) => {
    setPresetId("custom");
    setX((s) => ({ ...s, [k]: v }));
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 中间层值不值得做？（Exhibit 5、6）
        </span>
      </div>
      <div className="overflow-x-auto">
        <LayerDiagram />
      </div>
      <div className="lab-controls">
        {LAYER_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={chip(presetId === p.id)}
            onClick={() => {
              setPresetId(p.id);
              setX(p.x);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}

      <div className="otis-inputs">
        {LAYER_FIELDS.map((f) => (
          <label key={f.key}>
            {f.label}：<b>{f.money ? fmtEur(x[f.key]) : x[f.key]}</b>
            <input type="range" min={f.min} max={f.max} step={f.step} value={x[f.key]} onChange={(e) => set(f.key, +e.target.value)} />
          </label>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="lab-table" style={{ minWidth: 500 }}>
          <thead>
            <tr>
              <th>供应商</th>
              <th>报价</th>
              <th>人 × 周</th>
              <th>每人周</th>
              <th>前期合计</th>
              <th>回本（年）</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ q, r }) => (
              <tr key={q.id} onClick={() => setProviderId(q.id)} style={{ cursor: "pointer", fontWeight: q.id === providerId ? 600 : 400 }}>
                <td>{q.id}</td>
                <td>{fmtEur(q.cost)}</td>
                <td>
                  {q.people} × {q.weeks} = {q.personWeeks}
                </td>
                <td>{fmtEur(q.perPersonWeek)}</td>
                <td>{fmtEur(r.upfront)}</td>
                <td>{r.payback === null ? "回不了本" : r.payback.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="lab-decision lab-forward">
        <b>
          供应商 {current.q.id}：每年净收益 {fmtEur(current.r.benefit)}
        </b>
        <span>{layerVerdict(current.r)}</span>
      </p>
      <p className="lab-decision lab-flood">
        <b>
          以后要换 SaaS：直接集成 {fmtEur(current.r.reintegrate)}，中间层 {fmtEur(current.r.connector)}
        </b>
        <span>直接集成要把每个客户重做一遍；有了中间层，客户那一侧不动，只重写连接 SaaS 的一条接口。这个差额就是退出选择权的价值。</span>
      </p>
      <p className="mt-1 text-[11.5px] text-fg-3">只有三家报价和团队来自 Exhibit 6。集成费、客户数和留存都是假设，案例没有给。每人周假设所有人全程全职，报价没有写明。点表格的一行可以切换供应商。</p>
    </div>
  );
}

const SW = 620;
const SH = 130;

// Cohere: how much capacity to place with the neocloud, tested against five scenarios.
export function CapacityMixLab() {
  const [split, setSplit] = useState(40);
  const [portable, setPortable] = useState(true);
  const r = capacityMix(split, portable);
  const sweep = capacitySweep(portable) as { split: number; unit: number; worstDelay: number }[];
  const px = (s: number) => 34 + (s / 100) * (SW - 50);
  const maxDelay = Math.max(1, ...sweep.map((p) => p.worstDelay));
  const yDelay = (v: number) => SH - (v / maxDelay) * (SH - 24);
  const yUnit = (v: number) => SH - ((v - 0.5) / 0.6) * (SH - 24);
  const path = (f: (p: (typeof sweep)[number]) => number) => sweep.map((p) => `${px(p.split).toFixed(1)},${f(p).toFixed(1)}`).join(" ");

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 算力放多少在 CoreWeave？（Cohere）
        </span>
      </div>
      <div className="lab-controls">
        {CAPACITY_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={chip(split === p.split && portable === p.portable)}
            onClick={() => {
              setSplit(p.split);
              setPortable(p.portable);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="otis-inputs">
        <label>
          放在 CoreWeave 的比例：<b>{split}%</b>
          <input type="range" min={0} max={100} step={10} value={split} onChange={(e) => setSplit(+e.target.value)} />
        </label>
        <label className="otis-check">
          <input type="checkbox" checked={portable} onChange={(e) => setPortable(e.target.checked)} />
          技术栈可迁移（缺口可以转到另一家已有合作的空余容量）
        </label>
      </div>

      <svg viewBox={`0 0 ${SW} ${SH + 18}`} className="my-2 w-full" role="img" aria-label="不同比例下的最坏延误和单位成本">
        <line x1={34} x2={SW - 16} y1={SH} y2={SH} stroke="var(--line-strong, #cfccc4)" />
        <line x1={px(split)} x2={px(split)} y1={18} y2={SH} stroke="var(--fg-3, #8b8b93)" strokeDasharray="3 3" />
        <polyline points={path((p) => yDelay(p.worstDelay))} fill="none" stroke="var(--c-warn, #b54708)" strokeWidth={2.5} />
        <polyline points={path((p) => yUnit(p.unit))} fill="none" stroke="var(--accent, #1f4e8c)" strokeWidth={2.5} strokeDasharray="6 4" />
        {[0, 50, 100].map((s) => (
          <text key={s} x={px(s)} y={SH + 13} fontSize={10} textAnchor="middle" fill="var(--fg-3, #8b8b93)">
            {s}% CoreWeave
          </text>
        ))}
        <text x={38} y={11} fontSize={11} fill="var(--c-warn, #b54708)">
          ━ 五种情景里最坏的延误
        </text>
        <text x={240} y={11} fontSize={11} fill="var(--accent, #1f4e8c)">
          ╍ 基准情况的单位成本
        </text>
      </svg>

      <div className="overflow-x-auto">
        <table className="lab-table" style={{ minWidth: 500 }}>
          <thead>
            <tr>
              <th>情景</th>
              <th>需要</th>
              <th>拿到</th>
              <th>发布延误</th>
              <th>总成本</th>
              <th>用不完的承诺</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((row) => (
              <tr key={row.scenario.id}>
                <td title={row.scenario.note}>{row.scenario.label}</td>
                <td>{row.need}</td>
                <td>{Math.round(row.served)}</td>
                <td>{row.delay > 0 ? `${row.delay.toFixed(0)} 周` : "无"}</td>
                <td>{row.cost.toFixed(0)}</td>
                <td>{row.stranded > 0 ? row.stranded.toFixed(0) : "无"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`lab-decision ${r.worstDelay <= 8 ? "lab-forward" : "lab-flood"}`}>
        <b>
          {split}% CoreWeave · {portable ? "可迁移" : "不可迁移"}
        </b>
        <span>{capacityVerdict(split, portable, r)}</span>
      </p>
      <p className="mt-1 text-[11.5px] text-fg-3">
        所有数字都是示意指数，案例没有给出容量或价格：总需求 100，Hyperscaler 单价 1，CoreWeave {CAPACITY_DEFAULT.neoPrice}（第 2 周 Slide 26 的 30–60% 区间内），Hyperscaler 按时可供 {CAPACITY_DEFAULT.hyperSupply}，管两套环境的额外成本 {CAPACITY_DEFAULT.dualCost}。
      </p>
    </div>
  );
}
