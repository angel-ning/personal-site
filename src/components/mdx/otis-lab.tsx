"use client";

import { useState } from "react";
import { ATTITUDE, FLOW_PRESETS, flowSvg, STAKEHOLDERS, whoKnows } from "./otis-logic.mjs";

type Scenario = { m30: number; d90: number; critical: boolean; requested: boolean; hide: boolean };
type Row = { id: string; label: string; knows: boolean; how: string; fooled?: boolean; late?: boolean };

const chip = (on: boolean) => `lab-btn ${on ? "lab-btn-on" : ""}`;

// Pre vs post OTISLINE: one elevator's callbacks → which level of the organisation finds out, and how.
export function OtisFlowLab() {
  const [mode, setMode] = useState<"pre" | "post">("pre");
  const [presetId, setPresetId] = useState("cover");
  const [s, setS] = useState<Scenario>(FLOW_PRESETS[2].s);
  const rows = whoKnows(mode, s) as Row[];
  const other = whoKnows(mode === "pre" ? "post" : "pre", s) as Row[];
  const lit = new Set(rows.filter((r) => r.knows).map((r) => r.id));

  const set = (patch: Partial<Scenario>) => {
    setPresetId("custom");
    setS((x) => {
      const n = { ...x, ...patch };
      return { ...n, d90: Math.max(n.d90, n.m30) };
    });
  };
  const applyPreset = (id: string) => {
    setPresetId(id);
    setS(FLOW_PRESETS.find((p) => p.id === id)!.s);
  };

  const upper = rows.filter((r) => ["district", "rvp", "president"].includes(r.id));
  const fooled = rows.some((r) => r.fooled);
  const late = rows.some((r) => r.late);
  const verdict =
    mode === "pre"
      ? fooled
        ? "上级收到了报告，但报告是 branch 自己写的：坏 mechanic + 坏 branch manager 一起掩盖，不在现场的 mid-level 没有办法核实。"
        : late
        ? "问题已经很严重，但没人来要数据，上级就不知道，往往要等到客户投诉或取消合同。"
        : upper.some((r) => r.knows)
        ? "上级知道了，但这是因为有人来要数据、branch 又如实汇报，而且是手工汇总，已经滞后。"
        : "信息停在 branch 这一层：上面看不到。"
      : upper.some((r) => r.knows)
      ? "数据来自客户打给中心的电话，不经过 branch，掩盖也没用；达到阈值就自动推送给对应的上级。"
      : "还没到阈值，不会打扰上级；但数据已经在系统里，任何一级都可以随时查。";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · OTISLINE 前后：谁知道这部电梯一直在坏？
        </span>
      </div>

      <div className="lab-controls">
        <button type="button" className={chip(mode === "pre")} onClick={() => setMode("pre")}>
          Pre-OTISLINE
        </button>
        <button type="button" className={chip(mode === "post")} onClick={() => setMode("post")}>
          Post-OTISLINE
        </button>
        <span className="text-[12px] text-fg-3">场景：</span>
        {FLOW_PRESETS.map((p) => (
          <button key={p.id} type="button" className={chip(presetId === p.id)} onClick={() => applyPreset(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="otis-svg" dangerouslySetInnerHTML={{ __html: flowSvg(mode, lit) }} />

      <div className="otis-inputs">
        <label>
          近 30 天 callback：<b>{s.m30}</b>
          <input type="range" min={0} max={8} value={s.m30} onChange={(e) => set({ m30: +e.target.value })} />
        </label>
        <label>
          近 90 天 callback：<b>{s.d90}</b>
          <input type="range" min={0} max={12} value={s.d90} onChange={(e) => set({ d90: +e.target.value })} />
        </label>
        <label className="otis-check">
          <input type="checkbox" checked={s.critical} onChange={(e) => set({ critical: e.target.checked })} />
          危急情况（critical）
        </label>
        <label className="otis-check">
          <input type="checkbox" checked={s.hide} onChange={(e) => set({ hide: e.target.checked })} />
          branch manager 在报告里掩盖
        </label>
        <label className={`otis-check ${mode === "post" ? "opacity-50" : ""}`}>
          <input type="checkbox" checked={s.requested} onChange={(e) => set({ requested: e.target.checked })} />
          上级来要数据了（只影响 Pre）
        </label>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>层级</th>
            <th>{mode === "pre" ? "Pre" : "Post"}：知道吗？</th>
            <th>怎么知道 / 为什么不知道</th>
            <th>{mode === "pre" ? "Post" : "Pre"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <th className="whitespace-nowrap">{r.label}</th>
              <td>{r.knows ? "✓ 知道" : r.fooled ? "✗ 被蒙在鼓里" : "✗ 不知道"}</td>
              <td>{r.how}</td>
              <td className="text-fg-3">{other[i].knows ? "✓" : "✗"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className={`lab-decision ${mode === "pre" ? "lab-flood" : "lab-forward"}`}>
        <b>{mode === "pre" ? "不透明：信息要靠下面一层层往上送" : "透明：信息由中心掌握，往下分发"}</b>
        <span>{verdict}</span>
      </p>
    </div>
  );
}

// Click a role → before / after / why they like or dislike OTISLINE, and what management can do about it.
export function OtisStakeholderLab() {
  const [id, setId] = useState("mid");
  const r = STAKEHOLDERS.find((x) => x.id === id)!;
  const att = ATTITUDE[r.attitude as keyof typeof ATTITUDE];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 谁会不喜欢 OTISLINE？
        </span>
        <span className="text-[12px] text-fg-3">先猜，再点开</span>
      </div>
      <div className="lab-controls">
        {STAKEHOLDERS.map((x) => (
          <button key={x.id} type="button" className={chip(id === x.id)} onClick={() => setId(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <table className="lab-table">
        <tbody>
          <tr>
            <th className="whitespace-nowrap">以前</th>
            <td>{r.before}</td>
          </tr>
          <tr>
            <th>以后</th>
            <td>{r.after}</td>
          </tr>
          <tr>
            <th>归到哪一类</th>
            <td>{r.cat}</td>
          </tr>
          <tr>
            <th>管理层怎么应对</th>
            <td>{r.fix}</td>
          </tr>
        </tbody>
      </table>
      <p className={`lab-decision ${att.cls}`}>
        <b>{att.label}</b>
        <span>{r.why}</span>
      </p>
    </div>
  );
}
