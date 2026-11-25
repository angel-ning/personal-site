"use client";

import { useState } from "react";
import { NAT_MODES, NAT_PRESETS, capacity, entryGlobal, entryLocal, expire, inbound, initTable, outbound, presetById, replyTo } from "./nat-logic.mjs";

type Pair = [string | number, string | number];
type Pkt = { ip: Pair; port: Pair };
type Entry = { type: string; local: string; global: string; lport?: number; gport?: number; host: string };
type Host = { id: string; ip: string; port: number };
type Server = { id: string; ip: string; port: number };
type Preset = { id: string; label: string; source: string; mode: string; hosts: Host[]; servers: Server[]; pool: string[] };
type Out = { ok: boolean; before: Pkt; after: Pkt | null; table: Entry[]; entry: Entry | null; notes: string[]; host: Host; server: Server };
type Res = { kind: "out" | "in"; label: string; ok: boolean; before: Pkt; after: Pkt | null; notes: string[]; entry: Entry | null };

const TYPE_LABEL: Record<string, string> = { static: "静态", dynamic: "动态", pat: "PAT" };
const CAPS = [
  { v: Infinity, label: "不限（真实情况）" },
  { v: 2, label: "每个公网 IP 只给 2 个端口（示意）" },
];

function changed(a: Pair, b: Pair, i: number) {
  return String(a[i]) !== String(b[i]);
}

function PairCell({ before, after, side }: { before: Pair; after: Pair | null; side: "b" | "a" }) {
  const p = side === "b" ? before : after;
  if (!p) return <td className="text-fg-3">— 丢弃</td>;
  return (
    <td className="font-mono whitespace-nowrap">
      (
      {[0, 1].map((i) => (
        <span key={i}>
          {i === 1 && ", "}
          <span className={side === "a" && changed(before, p, i) ? "font-bold text-accent underline" : ""}>{p[i]}</span>
        </span>
      ))}
      )
    </td>
  );
}

// Slides 14–24 + board p.1: an inside network behind a NAT router. Pick static / dynamic / PAT, send packets out,
// let the server reply, or try to connect in from outside, and watch the translation table and what gets rewritten.
export function NatLab({ preset: start = "board" }: { preset?: string }) {
  const [pid, setPid] = useState(start);
  const p = presetById(pid) as Preset;
  const [mode, setMode] = useState(p.mode);
  const [cap, setCap] = useState(Infinity);
  const [table, setTable] = useState<Entry[]>(() => initTable(p, p.mode) as Entry[]);
  const [hostId, setHostId] = useState(p.hosts[0].id);
  const [sport, setSport] = useState(String(p.hosts[0].port));
  const [serverId, setServerId] = useState(p.servers[0].id);
  const [inIp, setInIp] = useState(p.pool[0]);
  const [inPort, setInPort] = useState("80");
  const [last, setLast] = useState<Out | null>(null);
  const [res, setRes] = useState<Res | null>(null);

  const reset = (np: Preset, nm: string) => {
    setTable(initTable(np, nm) as Entry[]);
    setLast(null);
    setRes(null);
  };
  const choosePreset = (id: string) => {
    const np = presetById(id) as Preset;
    setPid(id);
    setMode(np.mode);
    setHostId(np.hosts[0].id);
    setSport(String(np.hosts[0].port));
    setServerId(np.servers[0].id);
    setInIp(np.pool[0]);
    reset(np, np.mode);
  };
  const chooseMode = (m: string) => {
    setMode(m);
    reset(p, m);
  };
  const chooseHost = (id: string) => {
    setHostId(id);
    const h = p.hosts.find((x) => x.id === id);
    if (h) setSport(String(h.port));
  };

  const send = () => {
    const r = outbound(p, mode, table, { hostId, sport, serverId, cap }) as Out;
    setTable(r.table);
    if (r.ok) setLast(r);
    setRes({ kind: "out", label: `${r.host.id} → ${r.server.id}`, ok: r.ok, before: r.before, after: r.after, notes: r.notes, entry: r.entry });
  };
  const reply = () => {
    if (!last) return;
    const r = replyTo(p, mode, table, last) as Omit<Res, "kind" | "label">;
    setRes({ kind: "in", label: `${last.server.id} → ${last.host.id}（回包）`, ...r });
  };
  const knock = () => {
    const r = inbound(p, mode, table, { serverId: p.servers[0].id, toIp: inIp, dport: inPort }) as Omit<Res, "kind" | "label">;
    setRes({ kind: "in", label: `${p.servers[0].id} 主动连 ${inIp}:${inPort}`, ...r });
  };

  const c = capacity(p, mode) as { n: number; why: string };
  const showPorts = mode === "pat";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · NAT 路由器：Static / Dynamic / PAT
        </span>
      </div>

      <div className="lab-controls">
        {NAT_PRESETS.map((x) => (
          <button key={x.id} type="button" className={`lab-btn ${pid === x.id ? "lab-btn-on" : ""}`} onClick={() => choosePreset(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        {NAT_MODES.map((m) => (
          <button key={m.id} type="button" className={`lab-btn ${mode === m.id ? "lab-btn-on" : ""}`} onClick={() => chooseMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-[12.5px] text-fg-3">
        来源：{p.source}。公网地址{mode === "pat" ? "池" : mode === "dynamic" ? "池" : ""}：<span className="font-mono">{p.pool.join("、")}</span>。同时能上网：
        <b>{c.n === Infinity ? "几乎不受限" : `${c.n} 台`}</b>——{c.why}
      </p>

      <p className="mt-3 text-[13px] font-semibold">① 内部主机往外发（Inside → Outside）</p>
      <div className="lab-controls">
        <select className="lab-select" value={hostId} onChange={(e) => chooseHost(e.target.value)} aria-label="inside host">
          {p.hosts.map((h) => (
            <option key={h.id} value={h.id}>
              {h.id === h.ip ? h.ip : `${h.id}（${h.ip}）`}
            </option>
          ))}
        </select>
        <span className="text-[13px]">源端口</span>
        <input value={sport} onChange={(e) => setSport(e.target.value)} inputMode="numeric" aria-label="source port" className="lab-select w-[6.5em] px-2 py-0.5" />
        <span className="text-[13px]">→</span>
        <select className="lab-select" value={serverId} onChange={(e) => setServerId(e.target.value)} aria-label="server">
          {p.servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id}（{s.ip}:{s.port}）
            </option>
          ))}
        </select>
        <button type="button" className="lab-btn lab-btn-on" onClick={send}>
          发送
        </button>
        <button type="button" className="lab-btn" disabled={!last} onClick={reply}>
          对方回包
        </button>
      </div>
      {mode === "pat" && (
        <div className="lab-controls">
          {CAPS.map((x) => (
            <button key={x.label} type="button" className={`lab-btn ${cap === x.v ? "lab-btn-on" : ""}`} onClick={() => setCap(x.v)}>
              {x.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-[13px] font-semibold">② 外面的人主动连进来（Outside → Inside）</p>
      <div className="lab-controls">
        <span className="text-[13px]">{p.servers[0].id} → </span>
        <select className="lab-select" value={inIp} onChange={(e) => setInIp(e.target.value)} aria-label="inside global address">
          {p.pool.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <span className="text-[13px]">目的端口</span>
        <input value={inPort} onChange={(e) => setInPort(e.target.value)} inputMode="numeric" aria-label="destination port" className="lab-select w-[6.5em] px-2 py-0.5" />
        <button type="button" className="lab-btn" onClick={knock}>
          连进来
        </button>
      </div>

      {res && (
        <>
          <div className="table-wrap mt-3">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>{res.label}</th>
                  <th>IP (S, D)</th>
                  <th>Port (S, D)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="whitespace-nowrap">{res.kind === "out" ? "内部这一段（翻译前）" : "外部这一段（翻译前）"}</td>
                  <PairCell before={res.before.ip} after={res.after?.ip ?? null} side="b" />
                  <PairCell before={res.before.port} after={res.after?.port ?? null} side="b" />
                </tr>
                <tr className={res.ok ? "lab-hot" : ""}>
                  <td className="whitespace-nowrap">{res.kind === "out" ? "外部这一段（翻译后）" : "内部这一段（翻译后）"}</td>
                  <PairCell before={res.before.ip} after={res.after?.ip ?? null} side="a" />
                  <PairCell before={res.before.port} after={res.after?.port ?? null} side="a" />
                </tr>
              </tbody>
            </table>
          </div>
          <p className={`lab-decision ${res.ok ? "lab-forward" : "lab-flood"}`}>
            <b>{res.ok ? (res.kind === "out" ? "翻译后送上 Internet" : "翻译后送给内部主机") : "丢弃"}</b>
            <span>{res.notes.join(" ")}</span>
          </p>
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-semibold">NAT Table（路由器 RAM 里）</p>
        <button type="button" className="lab-btn" onClick={() => setTable(expire(table) as Entry[])}>
          时间过去：动态条目超时
        </button>
        <button type="button" className="lab-btn" onClick={() => reset(p, mode)}>
          重置
        </button>
      </div>
      <div className="table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>Inside Local{showPorts && " : Port"}</th>
              <th>Inside Global{showPorts && " : Port"}</th>
              <th>类型</th>
            </tr>
          </thead>
          <tbody>
            {table.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-fg-3">
                  空的（Slide 18：NAT Table Before First Packet）——内部主机先发包才会有条目
                </td>
              </tr>
            ) : (
              table.map((e) => (
                <tr key={entryLocal(e) + e.type} className={res?.ok && res.entry && entryLocal(res.entry) === entryLocal(e) ? "lab-hot" : ""}>
                  <td className="font-mono whitespace-nowrap">
                    {entryLocal(e)} <small className="text-fg-3">{e.host !== e.local && !e.host.startsWith(e.local) ? e.host : ""}</small>
                  </td>
                  <td className="font-mono whitespace-nowrap">{entryGlobal(e)}</td>
                  <td>{TYPE_LABEL[e.type]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-fg-3">
        加粗下划线 = 被 NAT 改掉的字段。往外：改<b>源</b>；往里：改<b>目的</b>。IP 和 Port 都按 (S, D) 写。
      </p>
    </div>
  );
}
