"use client";

import { useState } from "react";
import { BAND_LABEL, CAP, PAYWORKS_ADDONS, TCO_DEFAULT, TCO_PRESETS, fmtCad, tcoRows } from "./hcm-tco-logic.mjs";

type Inputs = typeof TCO_DEFAULT;
type Row = {
  id: string;
  label: string;
  acq: [string, number][];
  yearly: [string, number][];
  gaps: string[];
  acquisition: number;
  annual: number;
  total: number;
  perYear: number;
  band: "easy" | "ok" | "over";
  acqOk: boolean;
};

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;
const BAND_COLOR = { easy: "var(--accent)", ok: "#c58a00", over: "#c0392b" };

// CO7: three-year TCO of the four HCM options against Pouliot's limits (case p.7).
export function HcmTcoLab() {
  const [presetId, setPresetId] = useState(TCO_PRESETS[0].id);
  const [x, setX] = useState<Inputs>(TCO_DEFAULT);
  const [open, setOpen] = useState<string | null>("payworks");
  const rows = tcoRows(x) as Row[];
  const preset = TCO_PRESETS.find((p) => p.id === presetId);
  const max = Math.max(CAP.tcoMax * 1.25, ...rows.map((r) => r.perYear));
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => {
    setPresetId("custom");
    setX((s) => ({ ...s, [k]: v }));
  };
  const toggleAddon = (id: string) => set("addons", x.addons.includes(id) ? x.addons.filter((a) => a !== id) : [...x.addons, id]);
  const fits = rows.filter((r) => r.band !== "over" && r.acqOk).map((r) => r.label);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · CO7 四个 HCM 方案的三年 TCO（案例 p.7–9，Exhibits 4、6）
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

      <div className="mt-2 grid gap-2 text-[13px] sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span style={{ width: 120 }}>Odoo 用户数</span>
          <input type="range" min={5} max={80} step={5} value={x.users} onChange={(e) => set("users", +e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
          <b style={{ width: 28, textAlign: "right" }}>{x.users}</b>
        </label>
        <label className="flex items-center gap-2">
          <span style={{ width: 120 }}>顾问时薪</span>
          <input type="range" min={100} max={250} step={10} value={x.rate} onChange={(e) => set("rate", +e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
          <b style={{ width: 44, textAlign: "right" }}>${x.rate}</b>
        </label>
        <label className="flex items-center gap-2">
          <span style={{ width: 120 }}>④ 开发费</span>
          <input type="range" min={15000} max={45000} step={2500} value={x.buildCost} onChange={(e) => set("buildCost", +e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
          <b style={{ width: 64, textAlign: "right" }}>{fmtCad(x.buildCost)}</b>
        </label>
        <label className="flex items-center gap-2">
          <span style={{ width: 120 }}>④ 大版本预留</span>
          <input type="range" min={0} max={60} step={5} value={x.buildMajor} onChange={(e) => set("buildMajor", +e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
          <b style={{ width: 44, textAlign: "right" }}>{x.buildMajor} h</b>
        </label>
      </div>

      <div className="mt-2 text-[13px]">
        <span className="text-fg-3">③ Payworks 加哪些模块（每期价格）：</span>
        <div className="lab-controls">
          {PAYWORKS_ADDONS.map((a) => (
            <button key={a.id} type="button" className={chip(x.addons.includes(a.id))} onClick={() => toggleAddon(a.id)} title={a.why}>
              {a.label} ${a.price.toFixed(2)}
            </button>
          ))}
        </div>
        <label className="mt-1 flex items-center gap-2">
          <input type="checkbox" checked={x.customNeedsPlan} onChange={(e) => set("customNeedsPlan", e.target.checked)} />
          <span>④ 定制代码不能放在 Odoo Online，要升级到 Custom plan（算差价）</span>
        </label>
      </div>

      <div className="mt-3 grid gap-1">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-[13px]">
            <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} style={{ width: "clamp(96px, 32%, 190px)", flexShrink: 0, textAlign: "left", lineHeight: 1.25 }} className={open === r.id ? "font-semibold" : ""}>
              {r.label}
            </button>
            <span style={{ flex: 1, position: "relative", background: "var(--line)", height: 12, borderRadius: 6, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${(r.perYear / max) * 100}%`, background: BAND_COLOR[r.band] }} />
              <span style={{ position: "absolute", top: 0, bottom: 0, left: `${(CAP.tcoEasy / max) * 100}%`, borderLeft: "1px dashed var(--fg-3)" }} />
              <span style={{ position: "absolute", top: 0, bottom: 0, left: `${(CAP.tcoMax / max) * 100}%`, borderLeft: "2px solid var(--fg-3)" }} />
            </span>
            <b style={{ width: 70, textAlign: "right" }}>{fmtCad(r.perYear)}</b>
          </div>
        ))}
        <p className="text-[11.5px] text-fg-3">每年平均 TCO = (一次性费用 + 3 × 每年费用) ÷ 3。虚线 $15,000，实线 $17,500。点方案名看明细。</p>
      </div>

      <div className="overflow-x-auto">
        <table className="lab-table" style={{ minWidth: 560 }}>
          <thead>
            <tr>
              <th>方案</th>
              <th>一次性</th>
              <th>每年</th>
              <th>三年合计</th>
              <th>每年平均</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.label}</td>
                <td style={{ color: r.acqOk ? undefined : BAND_COLOR.over }}>{fmtCad(r.acquisition)}</td>
                <td>{fmtCad(r.annual)}</td>
                <td>{fmtCad(r.total)}</td>
                <td style={{ color: BAND_COLOR[r.band] }}>
                  <b>{fmtCad(r.perYear)}</b>
                  <div className="text-[11px]">{BAND_LABEL[r.band]}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open &&
        (() => {
          const r = rows.find((y) => y.id === open)!;
          return (
            <div className="mt-2 text-[13px]">
              <b>{r.label} 的明细</b>
              <ul className="ml-4 list-disc">
                {r.acq.map(([k, v]) => (
                  <li key={k}>
                    一次性 · {k}：{fmtCad(v)}
                  </li>
                ))}
                {r.yearly.map(([k, v]) => (
                  <li key={k}>
                    每年 · {k}：{fmtCad(v)}
                  </li>
                ))}
              </ul>
              <b>钱之外的缺口</b>
              <ul className="ml-4 list-disc">
                {r.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          );
        })()}

      <p className="lab-decision lab-forward">
        <b>{fits.length ? `在预算内：${fits.join("、")}` : "没有方案在预算内"}</b>
        <span>今天的 Payworks 工资（$340 × 26 ≈ $8,840）四个方案都要继续付，没有算进去。① ② 的 Odoo 订阅会取代现在每年约 $13,560 的合同，所以它们的「新增」开支其实比表里低；④ 只算了 Custom 和 Standard 的差价。</span>
      </p>
      <p className="mt-1 text-[11.5px] text-fg-3">价格来自案例；标「假设」的是我加的。钱只是一个维度：② 和 ④ 的风险在「缺口」里。</p>
    </div>
  );
}
