"use client";

import { useState } from "react";
import { RIP_TOPOS, RIP_PRESETS, ripRun, showLine, parseNetworkCmd, AD_TABLE, AD_PRESETS, chooseRoute, srcLabel } from "./rip-logic.mjs";

type TopoId = keyof typeof RIP_TOPOS;
type Iface = { name: string; ip: string; prefix: number; peer: string; subnet: string; classful: string; on: boolean };
type Entry = { src: string; net: string; prefix: number; metric: number; hops: { ip: string; router: string; out: string }[]; out?: string };
type Run = { ifs: Record<string, Iface[]>; tables: Record<string, Entry[]>; missing: { routers: string[]; net: string; why: string }[] };

const startCmds = (t: TopoId) => Object.fromEntries(Object.entries(RIP_TOPOS[t].routers).map(([r, x]) => [r, [...x.cmds]]));

// Slides 5–11 + board p.1–2: tick `network` commands per router, see which interfaces run RIP
// (send / listen / advertise) and what each routing table converges to, equal-cost paths included.
export function RipNetworkLab() {
  const [topoId, setTopoId] = useState<TopoId>("slide9");
  const [cmds, setCmds] = useState<Record<string, string[]>>(startCmds("slide9"));
  const [maxPaths, setMaxPaths] = useState(4);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const topo = RIP_TOPOS[topoId];
  const names = Object.keys(topo.routers);
  const run = ripRun(topoId, cmds, maxPaths) as Run;

  const load = (t: TopoId, override: Record<string, string[]> | null, mp = 4) => {
    setTopoId(t);
    setCmds({ ...startCmds(t), ...(override ?? {}) });
    setMaxPaths(mp);
    setTyped({});
    setMsg({});
  };
  const toggle = (r: string, net: string) =>
    setCmds({ ...cmds, [r]: cmds[r].includes(net) ? cmds[r].filter((x) => x !== net) : [...cmds[r], net] });
  const addTyped = (r: string) => {
    const p = parseNetworkCmd(typed[r] ?? "") as { ok: boolean; error?: string; net?: string; note?: string };
    if (!p.ok) return setMsg({ ...msg, [r]: `✕ ${p.error}` });
    setMsg({ ...msg, [r]: p.note ?? "" });
    if (!cmds[r].includes(p.net!)) setCmds({ ...cmds, [r]: [...cmds[r], p.net!] });
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · RIP 的 network 命令 → 哪些接口跑 RIP → 收敛后的路由表
        </span>
      </div>
      <div className="lab-controls">
        {RIP_PRESETS.map((p, i) => (
          <button key={i} type="button" className="lab-btn" onClick={() => load(p.topo as TopoId, p.cmds, p.maxPaths ?? 4)}>
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-fg-2">
        <b>{topo.label}</b>。{topo.note}
      </p>
      <div className="lab-controls">
        <label className="text-[13px]">
          等价路径上限 (maximum-paths){" "}
          <select className="lab-select" value={maxPaths} onChange={(e) => setMaxPaths(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
                {n === 4 ? "（默认）" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {names.map((r) => {
          const candidates = [...new Set([...run.ifs[r].map((i) => i.classful), ...cmds[r]])];
          return (
            <div key={r} style={{ minWidth: 0 }}>
              <b>{r}(config)#router rip</b>
              <div className="lab-controls" style={{ marginTop: ".3em" }}>
                {candidates.map((n) => (
                  <button key={n} type="button" className={`lab-btn ${cmds[r].includes(n) ? "lab-btn-on" : ""}`} onClick={() => toggle(r, n)}>
                    <code>network {n}</code>
                  </button>
                ))}
              </div>
              <div className="lab-controls" style={{ marginTop: ".2em" }}>
                <input
                  className="lab-select"
                  style={{ width: "9.5em" }}
                  placeholder="自己输入，如 180.3.1.0"
                  value={typed[r] ?? ""}
                  onChange={(e) => setTyped({ ...typed, [r]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addTyped(r)}
                />
                <button type="button" className="lab-btn" onClick={() => addTyped(r)}>
                  network
                </button>
              </div>
              {msg[r] && <p className="text-[12px] text-fg-3">{msg[r]}</p>}
              <div style={{ overflowX: "auto" }}>
                <table className="lab-table" style={{ marginTop: ".3em", whiteSpace: "nowrap" }}>
                  <thead>
                    <tr>
                      <th>接口</th>
                      <th>IP</th>
                      <th>Classful</th>
                      <th>RIP?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.ifs[r].map((i) => (
                      <tr key={i.name}>
                        <td className="font-mono">
                          {i.name} <span className="text-fg-3">→ {i.peer}</span>
                        </td>
                        <td className="font-mono">{i.ip}</td>
                        <td className="font-mono">{i.classful}</td>
                        <td>{i.on ? "✓ 发 · 听 · 通告" : "✕"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <pre className="mt-2 overflow-x-auto text-[12px] leading-snug" style={{ whiteSpace: "pre" }}>
                {`${r}#show ip route\n` + run.tables[r].map((e) => showLine(e)).join("\n")}
              </pre>
            </div>
          );
        })}
      </div>

      {run.missing.length ? (
        run.missing.map((m) => (
          <p key={m.net} className="lab-decision lab-flood">
            <b>
              {m.routers.join("、")} 没有 {m.net}
            </b>
            <span>{m.why}</span>
          </p>
        ))
      ) : (
        <p className="lab-decision lab-forward">
          <b>全部收敛</b>
          <span>每台路由器都学到了拓扑里的所有网段。</span>
        </p>
      )}
      <p className="mt-2 text-[12px] text-fg-3">
        R 行的 [120/n] = [Administrative distance / metric]：RIP 的 AD 是 120，metric 是跳数，每经过一台路由器 +1；via 后面是发更新那台路由器的接口 IP（Slide 11）。
      </p>
    </div>
  );
}

type Cand = { id: string; src: string; net: string; prefix: number; metric: number; via: string; ad?: number; up: boolean };
type Choice = { ok: boolean; error?: string; rows?: (Cand & { ad: number; match: boolean })[]; steps?: string[]; winners?: string[] };

// Slides 12–14: several sources offer a route; longest prefix, then lowest AD, then metric.
export function AdLab() {
  const [dest, setDest] = useState(AD_PRESETS[0].dest);
  const [cands, setCands] = useState<Cand[]>(AD_PRESETS[0].cands);
  const res = chooseRoute(cands, dest) as Choice;
  const edit = (id: string, patch: Partial<Cand>) => setCands(cands.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 多个来源都有路由：最长前缀 → AD → metric
        </span>
      </div>
      <div className="lab-controls">
        {AD_PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            className="lab-btn"
            onClick={() => {
              setDest(p.dest);
              setCands(p.cands);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label>
          目的 IP{" "}
          <input className="lab-select" style={{ width: "9em" }} value={dest} onChange={(e) => setDest(e.target.value)} />
        </label>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="lab-table" style={{ minWidth: "36em", whiteSpace: "nowrap" }}>
          <thead>
            <tr>
              <th>来源</th>
              <th>网段</th>
              <th>AD</th>
              <th>Metric</th>
              <th>经过</th>
              <th>链路</th>
            </tr>
          </thead>
          <tbody>
            {(res.rows ?? cands).map((c) => (
              <tr key={c.id} className={res.winners?.includes(c.id) ? "lab-hot" : ""}>
                <td>
                  <select className="lab-select" style={{ maxWidth: "11em" }} value={c.src} onChange={(e) => edit(c.id, { src: e.target.value, ad: undefined })}>
                    {AD_TABLE.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="font-mono">
                  {c.net}/{c.prefix}
                </td>
                <td>
                  {c.src === "static" ? (
                    <select className="lab-select" value={c.ad ?? 1} onChange={(e) => edit(c.id, { ad: Number(e.target.value) === 1 ? undefined : Number(e.target.value) })}>
                      {[1, 130, 200].map((n) => (
                        <option key={n} value={n}>
                          {n}
                          {n === 1 ? "" : "（浮动）"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-mono">{c.ad ?? AD_TABLE.find((a) => a.id === c.src)?.ad}</span>
                  )}
                </td>
                <td>
                  <input className="lab-select" style={{ width: "5em" }} type="number" min={0} value={c.metric} onChange={(e) => edit(c.id, { metric: Number(e.target.value) })} />
                </td>
                <td>{c.via}</td>
                <td>
                  <button type="button" className={`lab-btn ${c.up ? "" : "lab-btn-on"}`} onClick={() => edit(c.id, { up: !c.up })}>
                    {c.up ? "up" : "down ✕"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {res.ok ? (
        <div className={`lab-decision ${res.winners?.length ? "lab-forward" : "lab-flood"}`}>
          <b>{res.winners?.length ? `选 ${res.winners.map((w) => srcLabel(cands.find((c) => c.id === w)!.src)).join(" + ")}` : "丢弃"}</b>
          <ol className="mt-1 list-decimal pl-5 text-[13px]">
            {res.steps?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="lab-decision lab-flood">
          <b>输入有误</b>
          <span>{res.error}</span>
        </p>
      )}
      <p className="mt-2 text-[12px] text-fg-3">静态路由可以把 AD 手工调大（如 130）：平时输给 RIP，RIP 那条断了才顶上——这叫 floating static route。</p>
    </div>
  );
}
