"use client";

import { useState } from "react";
import { fmtEur, networkTradeoff, OS, SCOPES, UPGRADE_PRESETS, upgradeCost } from "./zara-logic.mjs";

type Inputs = { stores: number; terminals: number; os: keyof typeof OS; scope: string; wireless: boolean; perTerminal: boolean; support: number };

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;

// Slide 8 / Exhibit 13: one-time and annual cost of upgrading Zara's store IT, plus the slide 12 network trade-off.
export function ZaraCostLab() {
  const [presetId, setPresetId] = useState("slide");
  const [x, setX] = useState<Inputs>(UPGRADE_PRESETS[0].x as Inputs);
  const [net, setNet] = useState({ minutes: 15, wage: 10, support: 2000 });
  const r = upgradeCost(x) as ReturnType<typeof upgradeCost>;
  const n = networkTradeoff({ stores: x.stores, ...net });
  const preset = UPGRADE_PRESETS.find((p) => p.id === presetId);

  const set = (patch: Partial<Inputs>) => {
    setPresetId("custom");
    setX((s) => ({ ...s, ...patch }));
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · Zara 升级门店 IT 要花多少钱？（Slide 8、Exhibit 13）
        </span>
      </div>
      <div className="lab-controls">
        {UPGRADE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={chip(presetId === p.id)}
            onClick={() => {
              setPresetId(p.id);
              setX(p.x as Inputs);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset && <p className="mt-1 text-[12.5px] text-fg-3">{preset.note}</p>}

      <div className="otis-inputs">
        <label>
          门店数：<b>{x.stores}</b>
          <input type="range" min={550} max={1300} step={50} value={x.stores} onChange={(e) => set({ stores: +e.target.value })} />
        </label>
        <label>
          IT 支持 / 店 / 年（自己假设）：<b>€{x.support.toLocaleString()}</b>
          <input type="range" min={0} max={10000} step={500} value={x.support} onChange={(e) => set({ support: +e.target.value })} />
        </label>
      </div>
      <div className="lab-controls">
        <span className="text-[12px] text-fg-3">新 OS：</span>
        {(Object.keys(OS) as (keyof typeof OS)[]).map((k) => (
          <button key={k} type="button" className={chip(x.os === k)} onClick={() => set({ os: k })}>
            {OS[k].label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <span className="text-[12px] text-fg-3">范围：</span>
        {SCOPES.map((s) => (
          <button key={s.id} type="button" className={chip(x.scope === s.id)} onClick={() => set({ scope: s.id })}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="otis-check text-[13px]">
          <input type="checkbox" checked={x.wireless} onChange={(e) => set({ wireless: e.target.checked })} />
          店内无线网络 + 宽带
        </label>
        <label className="otis-check text-[13px]">
          <input type="checkbox" checked={x.perTerminal} onChange={(e) => set({ perTerminal: e.target.checked })} />
          €5,000 终端和 €50 网卡按每台终端算
        </label>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>项目</th>
            <th>怎么算</th>
            <th>一次性</th>
            <th>每年</th>
          </tr>
        </thead>
        <tbody>
          {r.lines.map((l) => (
            <tr key={l.label}>
              <td>{l.label}</td>
              <td className="font-mono text-[12px]">{l.calc}</td>
              <td>{l.once ? fmtEur(l.once) : "—"}</td>
              <td>{l.annual ? fmtEur(l.annual) : "—"}</td>
            </tr>
          ))}
          <tr>
            <th colSpan={2}>合计</th>
            <th>{fmtEur(r.once)}</th>
            <th>{fmtEur(r.annual)}</th>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${x.support > 0 ? "lab-flood" : "lab-forward"}`}>
        <b>
          一次性约 {fmtEur(r.once)}，之后每年 {fmtEur(r.annual)}
        </b>
        <span>
          {x.support > 0
            ? "持续 IT 支持按门店数线性增长，Zara 每天开一家新店，这笔钱每年都在变大。这就是课件说的 swing factor。"
            : "还没算持续 IT 支持：课件提醒，这个没量化的数字才是决定性的（swing factor）。把左上的滑块拉起来试试。"}
        </span>
      </p>

      <div className="lab-head mt-4">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          店内网络：省下的时间 vs 要付的 IT 支持（Slide 12）
        </span>
      </div>
      <div className="otis-inputs">
        <label>
          每店每天省下：<b>{net.minutes} 分钟</b>
          <input type="range" min={5} max={60} step={5} value={net.minutes} onChange={(e) => setNet({ ...net, minutes: +e.target.value })} />
        </label>
        <label>
          时薪（假设）：<b>€{net.wage}</b>
          <input type="range" min={5} max={25} step={1} value={net.wage} onChange={(e) => setNet({ ...net, wage: +e.target.value })} />
        </label>
        <label>
          网络的 IT 支持 / 店 / 年（假设）：<b>€{net.support.toLocaleString()}</b>
          <input type="range" min={0} max={5000} step={250} value={net.support} onChange={(e) => setNet({ ...net, support: +e.target.value })} />
        </label>
      </div>
      <table className="lab-table">
        <tbody>
          <tr>
            <th>省下的工时价值 / 年</th>
            <td>
              {x.stores} 店 × {net.minutes} 分钟 × €{net.wage} × 360 天 = {fmtEur(n.benefit)}
            </td>
          </tr>
          <tr>
            <th>IT 支持 / 年</th>
            <td>
              {x.stores} 店 × €{net.support.toLocaleString()} = {fmtEur(n.cost)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className={`lab-decision ${n.net > 0 ? "lab-forward" : "lab-flood"}`}>
        <b>{n.net > 0 ? `每年净省 ${fmtEur(n.net)}` : `每年净亏 ${fmtEur(-n.net)}`}</b>
        <span>
          {n.net > 0
            ? "只算工时是划算的。但还要加上安装无线网络的一次性成本，以及开新店时要有 IT 人员到场，这会削弱 Zara「店长自己插两张软盘就能开店」的灵活性。"
            : "省下的时间抵不上 IT 支持：这就是课件的结论，需要 IT 支持的话，收益太小，不值得改。"}
        </span>
      </p>
    </div>
  );
}
