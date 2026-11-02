"use client";

import { useState } from "react";
import {
  ELASTIC_PRESETS,
  KITCHEN,
  MODELS,
  PATTERNS,
  PRICE_DEFAULT,
  TCO_PRESETS,
  elasticity,
  elasticityVerdict,
  fmtUsd,
  stackRows,
  tco,
} from "./cloud-logic.mjs";

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;
const mineStyle = { borderColor: "var(--accent)", background: "var(--accent-wash)", color: "var(--accent)" };
const theirsStyle = { borderColor: "var(--line)", background: "transparent", color: "var(--fg-3)" };

// Slides 17–19: who manages each layer under On-prem / IaaS / PaaS / SaaS, with the catering analogy.
export function ServiceModelLab() {
  const [id, setId] = useState("iaas");
  const m = MODELS.find((x) => x.id === id) ?? MODELS[0];
  const rows = stackRows(id) as { layer: string; who: string }[];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 每一层谁来管？（Slides 17–19）
        </span>
        <span className="text-[12px] text-fg-3">蓝色 = 你自己管</span>
      </div>
      <div className="lab-controls">
        {MODELS.map((x) => (
          <button key={x.id} type="button" className={chip(id === x.id)} onClick={() => setId(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[12px] text-fg-3">IT stack（Slide 19）</p>
          <div className="flex flex-col gap-1">
            {rows.map((r) => (
              <div key={r.layer} className="rounded border px-2 py-1 text-center text-[12.5px]" style={r.who === "you" ? mineStyle : theirsStyle}>
                {r.layer}
                <span className="ml-2 text-[11px]">{r.who === "you" ? "你" : "供应商"}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[12px] text-fg-3">请一大群人吃饭（Slide 17）</p>
          <div className="flex flex-col gap-1">
            {KITCHEN.map((k, i) => (
              <div key={k} className="rounded border px-2 py-2 text-center text-[12.5px]" style={m.kitchen[i] === "you" ? mineStyle : theirsStyle}>
                {k}
                <span className="ml-2 text-[11px]">{m.kitchen[i] === "you" ? "你" : "供应商"}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12.5px]">{m.food}</p>
        </div>
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>例子</th>
            <td>{m.example}</td>
          </tr>
          <tr>
            <th>控制权</th>
            <td>{m.control}</td>
          </tr>
          <tr>
            <th>上线速度</th>
            <td>{m.speed}</td>
          </tr>
          <tr>
            <th>需要的能力</th>
            <td>{m.skills}</td>
          </tr>
          <tr>
            <th>成本结构</th>
            <td>{m.cost}</td>
          </tr>
          <tr>
            <th>适合</th>
            <td>{m.fit}</td>
          </tr>
        </tbody>
      </table>
      <p className="lab-decision lab-forward">
        <b>你自己管 {m.mine} / 9 层</b>
        <span>往 SaaS 走，管得越少、上线越快，但能改的也越少（Slide 19）。这就是 Slide 17 问的 compromise：用控制权换速度和省心。</span>
      </p>
    </div>
  );
}

type ElasticInputs = { pattern: string; ownPct: number; reservePct: number; reserved: number; own: number };

const CW = 440;
const CH = 170;

// Slides 9, 30, 35: one workload's demand curve against three ways of buying capacity.
export function ElasticityLab() {
  const [presetId, setPresetId] = useState("stable");
  const [x, setX] = useState<ElasticInputs>(ELASTIC_PRESETS[0].x);
  const r = elasticity(x) as ReturnType<typeof elasticity>;
  const set = (patch: Partial<ElasticInputs>) => {
    setPresetId("custom");
    setX((s) => ({ ...s, ...patch }));
  };

  const d = r.pattern.demand;
  const top = Math.max(r.peak, r.cap) * 1.1;
  const bw = CW / d.length;
  const y = (v: number) => CH - (v / top) * CH;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 这个 workload 该买、订还是租？（Slides 9、30、35）
        </span>
      </div>
      <div className="lab-controls">
        {ELASTIC_PRESETS.map((p) => (
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
      <div className="lab-controls">
        <span className="text-[12px] text-fg-3">需求曲线：</span>
        {PATTERNS.map((p) => (
          <button key={p.id} type="button" className={chip(x.pattern === p.id)} onClick={() => set({ pattern: p.id })}>
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[12.5px] text-fg-3">{r.pattern.note}</p>

      <svg viewBox={`0 0 ${CW} ${CH + 18}`} className="my-2 w-full" role="img" aria-label="需求和容量">
        <rect x={0} y={y(r.base)} width={CW} height={CH - y(r.base)} fill="var(--c-tip, #067647)" opacity={0.12} />
        {d.map((v, i) => (
          <rect key={i} x={i * bw + 3} y={y(v)} width={bw - 6} height={CH - y(v)} fill={v > r.cap ? "var(--c-exam, #b42318)" : "var(--accent, #1f4e8c)"} opacity={0.75} />
        ))}
        <line x1={0} x2={CW} y1={y(r.cap)} y2={y(r.cap)} stroke="var(--fg, #1a1a1a)" strokeDasharray="5 4" strokeWidth={1.5} />
        <text x={4} y={Math.max(10, y(r.cap) - 4)} fontSize={10} fill="var(--fg-2, #55555c)">
          自己买的容量
        </text>
        {r.base > 0 && (
          <text x={CW - 4} y={Math.min(CH - 4, y(r.base) + 12)} fontSize={10} textAnchor="end" fill="var(--c-tip, #067647)">
            预留基线
          </text>
        )}
        {d.map((_, i) => (
          <text key={i} x={i * bw + bw / 2} y={CH + 13} fontSize={9} textAnchor="middle" fill="var(--fg-3, #8b8b93)">
            {i + 1}
          </text>
        ))}
      </svg>
      <p className="text-[11.5px] text-fg-3">
        柱子 = 每{r.pattern.unit}实际需求（红色 = 超出自己买的容量）；虚线 = 自己买的容量；绿色区 = 预留的基线。
      </p>

      <div className="otis-inputs">
        <label>
          自己买多少容量（占实际峰值）：<b>{x.ownPct}%</b>
          <input type="range" min={10} max={150} step={5} value={x.ownPct} onChange={(e) => set({ ownPct: +e.target.value })} />
        </label>
        <label>
          预留多少基线（占峰值）：<b>{x.reservePct}%</b>
          <input type="range" min={0} max={100} step={5} value={x.reservePct} onChange={(e) => set({ reservePct: +e.target.value })} />
        </label>
        <label>
          预留价（按需 = 1）：<b>{x.reserved.toFixed(2)}</b>
          <input type="range" min={0.25} max={0.9} step={0.05} value={x.reserved} onChange={(e) => set({ reserved: +e.target.value })} />
        </label>
        <label>
          自有硬件每单位成本（按需 = 1，假设）：<b>{x.own.toFixed(2)}</b>
          <input type="range" min={0.2} max={1} step={0.05} value={x.own} onChange={(e) => set({ own: +e.target.value })} />
        </label>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>买法</th>
            <th>总成本（按需 = 1 / 单位）</th>
            <th>闲置容量</th>
            <th>没服务到的需求</th>
          </tr>
        </thead>
        <tbody>
          {r.options.map((o) => (
            <tr key={o.id}>
              <td>
                {o.id === r.best.id ? <b>{o.label} ✓</b> : o.label}
              </td>
              <td>{Math.round(o.cost)}</td>
              <td>{Math.round(o.idle)}</td>
              <td className={o.unmet > 0 ? "text-[var(--c-exam)]" : ""}>{Math.round(o.unmet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`lab-decision ${r.options[0].unmet > 0 ? "lab-flood" : "lab-forward"}`}>
        <b>最便宜且能服务全部需求：{r.best.label}</b>
        <span>{elasticityVerdict(r)}</span>
      </p>
      <p className="mt-1 text-[11.5px] text-fg-3">
        默认价格：预留价 {PRICE_DEFAULT.reserved}（Slide 31 约比按需低 40%）；自有硬件 {PRICE_DEFAULT.own} 是假设，含折旧、机房和人手，按容量付钱，不管用不用。Spot（Slide 30，便宜 70–90% 但随时被收回）只适合可以中断的批处理，这里没列。
      </p>
    </div>
  );
}

type TcoInputs = { years: number; cloudAnnual: number; hardware: number; life: number; ownAnnual: number; migration: number };

const TCO_FIELDS: { key: keyof TcoInputs; label: string; min: number; max: number; step: number; money?: boolean }[] = [
  { key: "years", label: "比较几年", min: 1, max: 7, step: 1 },
  { key: "cloudAnnual", label: "留在云上：每年总成本", min: 50000, max: 5000000, step: 50000, money: true },
  { key: "hardware", label: "出云：一次买硬件（含余量）", min: 0, max: 3000000, step: 50000, money: true },
  { key: "life", label: "硬件几年更新一次", min: 2, max: 7, step: 1 },
  { key: "ownAnnual", label: "出云后：每年运营成本（机房、人手、剩下的云）", min: 0, max: 4000000, step: 50000, money: true },
  { key: "migration", label: "一次性迁移成本", min: 0, max: 1500000, step: 50000, money: true },
];

// Slide 2 and slide 31: cumulative cost of staying in the cloud vs owning the hardware.
export function CloudExitLab({ start = "dhh" }: { start?: string }) {
  const first = TCO_PRESETS.find((p) => p.id === start) ?? TCO_PRESETS[0];
  const [presetId, setPresetId] = useState(first.id);
  const [x, setX] = useState<TcoInputs>(first.x);
  const r = tco(x) as ReturnType<typeof tco>;
  const preset = TCO_PRESETS.find((p) => p.id === presetId);
  const set = (k: keyof TcoInputs, v: number) => {
    setPresetId("custom");
    setX((s) => ({ ...s, [k]: v }));
  };

  const max = Math.max(...r.rows.map((row) => Math.max(row.cloud, row.own))) * 1.08 || 1;
  const px = (yr: number) => 30 + (yr / x.years) * (CW - 40);
  const py = (v: number) => CH - (v / max) * (CH - 10);
  const line = (k: "cloud" | "own") => r.rows.map((row) => `${px(row.year).toFixed(1)},${py(row[k]).toFixed(1)}`).join(" ");

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 留在云上，还是买自己的服务器？（Slide 2、Slide 31）
        </span>
      </div>
      <div className="lab-controls">
        {TCO_PRESETS.map((p) => (
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
        {TCO_FIELDS.map((f) => (
          <label key={f.key}>
            {f.label}：<b>{f.money ? fmtUsd(x[f.key]) : `${x[f.key]} 年`}</b>
            <input type="range" min={f.min} max={f.max} step={f.step} value={x[f.key]} onChange={(e) => set(f.key, +e.target.value)} />
          </label>
        ))}
      </div>

      <svg viewBox={`0 0 ${CW} ${CH + 18}`} className="my-2 w-full" role="img" aria-label="累计成本">
        <line x1={30} x2={CW - 10} y1={CH} y2={CH} stroke="var(--line-strong, #cfccc4)" />
        <polyline points={line("cloud")} fill="none" stroke="var(--accent, #1f4e8c)" strokeWidth={2.5} />
        <polyline points={line("own")} fill="none" stroke="var(--c-warn, #b54708)" strokeWidth={2.5} strokeDasharray="6 4" />
        {r.rows.map((row) => (
          <text key={row.year} x={px(row.year)} y={CH + 13} fontSize={10} textAnchor="middle" fill="var(--fg-3, #8b8b93)">
            {row.year === 0 ? "起点" : `第 ${row.year} 年`}
          </text>
        ))}
        <text x={34} y={14} fontSize={11} fill="var(--accent, #1f4e8c)">
          ━ 留在云上（累计）
        </text>
        <text x={34} y={28} fontSize={11} fill="var(--c-warn, #b54708)">
          ╍ 买自己的服务器（累计）
        </text>
      </svg>

      <table className="lab-table">
        <thead>
          <tr>
            <th></th>
            {r.rows.map((row) => (
              <th key={row.year}>{row.year === 0 ? "起点" : `Y${row.year}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>云：累计</td>
            {r.rows.map((row) => (
              <td key={row.year}>{fmtUsd(row.cloud)}</td>
            ))}
          </tr>
          <tr>
            <td>自有：累计</td>
            {r.rows.map((row) => (
              <td key={row.year}>{fmtUsd(row.own)}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${r.saving > 0 ? "lab-forward" : "lab-flood"}`}>
        <b>
          {r.saving > 0
            ? `${x.years} 年省 ${fmtUsd(r.saving)}${r.payback ? `，第 ${r.payback} 年回本` : ""}`
            : `${x.years} 年多花 ${fmtUsd(-r.saving)}：留在云上更便宜`}
        </b>
        <span>
          每年云账单要高于约 {fmtUsd(r.breakEven)}，买硬件才划算。出云要在起点先付 {fmtUsd(r.upfront)}（capex），云是按月付的 opex：
          {r.saving > 0 ? "省钱是真的，但前提是需求稳定、不需要大量加人；HEY 上线那种突发流量要另外留余量。" : "需求小或不稳定时，买下来的机器大部分时间闲着，还要有人维护。"}
        </span>
      </p>
    </div>
  );
}
