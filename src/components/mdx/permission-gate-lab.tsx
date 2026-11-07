"use client";

import { useState } from "react";
import { GATES, PATHS, RECORDS, USERS, evaluateGate } from "./permission-gate-logic.mjs";

// Payroll assistant (Slide 34) + injected document (Slide 23): where the check sits decides what can leak, and which cases the two traces cover.
export function PermissionGateLab() {
  const [user, setUser] = useState("alex");
  const [record, setRecord] = useState("sam");
  const [path, setPath] = useState("ask");
  const [gate, setGate] = useState("before");
  const [outbound, setOutbound] = useState(false);
  const r = evaluateGate({ user, record, path, gate, outbound });

  const pick = <T extends { id: string; label: string }>(xs: T[], v: string, set: (x: string) => void) => (
    <select className="lab-select" value={v} onChange={(e) => set(e.target.value)}>
      {xs.map((x) => (
        <option key={x.id} value={x.id}>
          {x.label}
        </option>
      ))}
    </select>
  );
  const tone = r.risk === "high" ? "lab-flood" : r.risk === "blocked" ? "lab-filter" : "lab-forward";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Permission gate 放在哪</span>
        <span className="text-[12px] text-fg-3">虚构工资助手 · 合成数据</span>
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th className="whitespace-nowrap">登录身份</th>
            <td>{pick(USERS, user, setUser)}</td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">请求的记录</th>
            <td>{pick(RECORDS, record, setRecord)}</td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">访问路径</th>
            <td>
              {pick(PATHS, path, setPath)}
              <span className="block text-[12px] text-fg-3">{PATHS.find((p) => p.id === path)?.zh}</span>
            </td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">检查在哪</th>
            <td>
              {pick(GATES, gate, setGate)}
              <span className="block text-[12px] text-fg-3">{GATES.find((g) => g.id === gate)?.zh}</span>
            </td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">对外发送</th>
            <td>
              <label className="flex items-center gap-1.5 text-[13px]">
                <input type="checkbox" checked={outbound} onChange={(e) => setOutbound(e.target.checked)} />
                助手有能发到任意地址的工具
              </label>
            </td>
          </tr>
        </tbody>
      </table>

      <p className={`lab-decision ${tone}`}>
        <b>{r.enters === "no" ? "记录没进模型" : r.risk === "high" ? "可能泄露" : "允许"}</b>
        <span>
          {r.why} {r.sendNote}
        </span>
      </p>
      <p className={`lab-decision ${r.tested ? "lab-forward" : "lab-flood"}`}>
        <b>Claim limit</b>
        <span>{r.claim}</span>
      </p>
    </div>
  );
}
