"use client";

import { useState } from "react";
import { classifySeverity, DIMENSIONS, LEVELS, SEVERITY_PRESETS } from "./severity-logic.mjs";

type Picks = Record<string, number>;
type Level = { n: number; en: string; zh: string; lead: string; response: string };

// Pick what you know about an incident → which of the four p.16 levels it is, who leads, what must happen.
export function SeverityLadder() {
  const [presetId, setPresetId] = useState(SEVERITY_PRESETS[2].id);
  const [picks, setPicks] = useState<Picks>(SEVERITY_PRESETS[2].picks);
  const r = classifySeverity(picks) as {
    level: Level;
    drivers: { id: string; label: string; opt: { label: string } }[];
    crisis: boolean;
    executive: boolean;
  };

  const applyPreset = (id: string) => {
    const p = SEVERITY_PRESETS.find((x) => x.id === id)!;
    setPresetId(id);
    setPicks(p.picks);
  };
  const pick = (dim: string, i: number) => {
    setPresetId("custom");
    setPicks((s) => ({ ...s, [dim]: i }));
  };

  const chip = (on: boolean) =>
    `rounded-full border px-2.5 py-0.5 text-left text-[12px] ${on ? "border-accent text-accent" : "border-line text-fg-2 hover:border-line-strong"}`;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 事件分级 Level 1–4</span>
        <span className="text-[12px] text-fg-3">哪一维最严重，就按哪一级处理</span>
      </div>

      <div className="lab-controls">
        {SEVERITY_PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => applyPreset(p.id)} className={chip(presetId === p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <table className="lab-table">
        <tbody>
          {DIMENSIONS.map((d) => (
            <tr key={d.id}>
              <th className="whitespace-nowrap">{d.label}</th>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {d.options.map((o, i) => (
                    <button key={o.label} type="button" onClick={() => pick(d.id, i)} className={chip((picks[d.id] ?? 0) === i)}>
                      {o.label}
                      {o.level > 1 && <span className="ml-1 font-mono text-fg-3">L{o.level}</span>}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">
        {(LEVELS.slice(1) as Level[]).map((lv) => (
          <div
            key={lv.n}
            className="rounded-md border px-1 py-1.5"
            style={
              lv.n === r.level.n
                ? { borderColor: "var(--accent)", background: "color-mix(in oklab, var(--accent) 14%, transparent)", fontWeight: 600 }
                : { borderColor: "var(--line)", color: "var(--fg-3)" }
            }
          >
            L{lv.n}
            <br />
            {lv.en}
          </div>
        ))}
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>谁来领导</th>
            <td>{r.level.lead}</td>
          </tr>
          <tr>
            <th>必须做什么</th>
            <td>{r.level.response}</td>
          </tr>
          <tr>
            <th>由哪一维决定</th>
            <td>{r.drivers.length ? r.drivers.map((h) => `${h.label}：${h.opt.label}`).join("；") : "所有维度都停在最低一档"}</td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${r.executive ? "lab-flood" : "lab-forward"}`}>
        <b>
          Level {r.level.n} · {r.level.en}（{r.level.zh}）
        </b>
        <span>
          {r.crisis
            ? "进入危机管理框架的 Activate 阶段：由 crisis director 正式宣布危机、上报董事会，技术团队的 IR 继续进行，但战略决策（优先保什么、通知谁）交给高管危机小组。"
            : r.executive
            ? "已经超出 SOC 能自己处理的范围：要有高管监督，法务、合规、BCP、公关同时动员。如果继续恶化（确认泄露、交易 / 支付受影响、媒体曝光），就升级为 Level 4 危机。"
            : r.level.n === 2
            ? "由 incident commander 按 IR 六阶段处理，通知内部负责人即可，不必惊动高管——但要持续评估是否需要升级（p.18：在事态明显失控之前就上报）。"
            : "日常安全运营：调查、记录，然后关闭或升级。「Not every alert qualifies as an incident」。"}
        </span>
      </p>
    </div>
  );
}
