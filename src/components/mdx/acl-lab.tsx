"use client";

import { useMemo, useState } from "react";
import { ACL_PRESETS, ACL_TYPE_LABEL, parseAcl, evaluateAcl, walkPacket, makePacket, runPreset, routingTable } from "./acl-logic.mjs";

type Pkt = { src: string; dst: string; proto?: string; sport?: number; dport?: number; label?: string };
type Apply = { router: string; iface: string; dir: "in" | "out" };
type Check = { what: string; ok: boolean; detail: string };
type Rule = { raw: string; num?: number; type?: string; action?: string; error?: string; remark?: string; wcDefaulted?: boolean };
type AclResult = { action: string; matched: number | null; implicit: boolean; trace: { rule: Rule; checks: Check[]; match: boolean }[] };
type Step = { step: number; label: string; text?: string; acl?: AclResult };
type Hop = { router: string; inIf: string; outIf?: string; steps: Step[] };
type Walk = { verdict: string; where?: string; why?: string; hops: Hop[] };
type Iface = { name: string; net?: string; prefix?: number; peer?: string; cloud?: boolean; label?: string };
type Topo = { label: string; routers: { name: string; ifaces: Iface[] }[] };
type Preset = (typeof ACL_PRESETS)[number] & { topo: Topo | null; apply?: Apply[]; hosts?: Record<string, string> };

const PRESETS = ACL_PRESETS as Preset[];
const CIRCLED = ["①", "②", "③", "④"];

function AclTrace({ r }: { r: AclResult }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="lab-table" style={{ minWidth: "36em" }}>
        <thead>
          <tr>
            <th>#</th>
            <th>语句</th>
            <th>逐项比较</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          {r.trace.map((t, i) => (
            <tr key={i} className={t.match ? "lab-hot" : ""}>
              <td>{i + 1}</td>
              <td className="font-mono text-[12px]">{t.rule.raw.replace(/^access-list\s+/i, "")}</td>
              <td className="text-[12px]">
                {t.checks.map((c, j) => (
                  <div key={j} style={{ opacity: t.checks.findIndex((x) => !x.ok) >= 0 && j > t.checks.findIndex((x) => !x.ok) ? 0.45 : 1 }}>
                    {c.ok ? "✓" : "✗"} {c.what}：<span className="font-mono">{c.detail}</span>
                  </div>
                ))}
              </td>
              <td>{t.match ? <b>{t.rule.action === "permit" ? "匹配 → permit，停止" : "匹配 → deny，停止"}</b> : "不匹配 → 下一行"}</td>
            </tr>
          ))}
          {r.implicit && (
            <tr className="lab-hot">
              <td>—</td>
              <td className="font-mono text-[12px]">（implicit deny any）</td>
              <td className="text-[12px]">上面每一行都不匹配</td>
              <td>
                <b>隐式拒绝</b>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Slides 13–17, 29–57 + board p.1–3, p.6: type real access-list commands, choose where the ACL is applied,
// and follow each packet through the router(s): de-encapsulate → inbound ACL → routing table → outbound ACL.
export function AclLab({ preset = "board3a", presets }: { preset?: string; presets?: string }) {
  // `presets="a,b"` limits the buttons to those (the first one opens); otherwise every preset is offered.
  const only = presets?.split(",").map((x) => x.trim());
  const startIdx = Math.max(0, PRESETS.findIndex((p) => p.id === (only?.[0] ?? preset)));
  const [pi, setPi] = useState(startIdx);
  const P = PRESETS[pi];
  const [text, setText] = useState(P.acl);
  const [apply, setApply] = useState<Apply[]>(P.apply ?? []);
  const [sel, setSel] = useState(0);
  const [custom, setCustom] = useState<Pkt>({ src: P.packets[0].src, dst: P.packets[0].dst, proto: "tcp", dport: 80 });

  const load = (i: number) => {
    setPi(i);
    setText(PRESETS[i].acl);
    setApply(PRESETS[i].apply ?? []);
    setSel(0);
    setCustom({ src: PRESETS[i].packets[0].src, dst: PRESETS[i].packets[0].dst, proto: "tcp", dport: 80 });
  };

  const rules = useMemo(() => parseAcl(text) as Rule[], [text]);
  const summary = runPreset(P, text, apply) as { p: Pkt; verdict: string; where?: string; checked?: boolean; line: number | null; implicit: boolean }[];
  const pkts: Pkt[] = [...(P.packets as Pkt[]), { ...custom, label: "自己设的包" }];
  const cur = pkts[sel] ?? pkts[0];
  const curPkt = makePacket({ ...cur, proto: cur.proto ?? "ip", sport: cur.sport ?? (cur.proto === "tcp" || cur.proto === "udp" ? 1050 : undefined) });
  const valid = curPkt.src !== null && curPkt.dst !== null;
  const host = (ip: string) => P.hosts?.[ip] ?? ip;

  const walk = valid && P.topo ? (walkPacket(P.topo, rules, apply, curPkt) as Walk) : null;
  const flat = valid && !P.topo ? (evaluateAcl(rules, curPkt) as AclResult) : null;

  const toggle = (a: Apply) =>
    setApply(apply.some((x) => x.router === a.router && x.iface === a.iface && x.dir === a.dir) ? apply.filter((x) => !(x.router === a.router && x.iface === a.iface && x.dir === a.dir)) : [...apply, a]);
  const errors = rules.filter((r) => r.error);
  const types = [...new Set(rules.filter((r) => !r.error && r.type).map((r) => `${r.num}：${ACL_TYPE_LABEL[r.type as keyof typeof ACL_TYPE_LABEL]}`))];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · ACL：逐行比对、first match、implicit deny、放在哪个接口哪个方向
        </span>
      </div>
      <div className="lab-controls">
        {PRESETS.map((p, i) => (only && !only.includes(p.id) ? null : (
          <button key={p.id} type="button" className={`lab-btn ${i === pi ? "lab-btn-on" : ""}`} onClick={() => load(i)}>
            {p.label}
          </button>
        )))}
      </div>
      {P.note && <p className="mt-2 text-[13px] text-fg-2">{P.note}</p>}

      <label className="mt-2 block text-[12px] text-fg-3">ACL（可以直接改，一行一条 access-list）</label>
      <textarea
        className="lab-select acl-text"
        rows={Math.max(2, text.split("\n").length)}
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="text-[12px] text-fg-3">
        {types.join("；") || "还没有有效的语句"}。最后一行后面永远藏着一句 <code>deny any</code>。
        {rules.some((r) => r.wcDefaulted) && " 没写通配符的 standard 语句按 0.0.0.0（只匹配这一个地址，Slide 37）。"}
      </p>
      {errors.map((e, i) => (
        <p key={i} className="text-[12px]" style={{ color: "var(--c-warn)" }}>
          ✗ <span className="font-mono">{e.raw}</span>：{e.error}（这一行会被忽略）
        </p>
      ))}

      {P.topo && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="lab-table" style={{ minWidth: "34em" }}>
              <thead>
                <tr>
                  <th>路由器</th>
                  <th>接口 → 网段（= 路由表）</th>
                  <th>把 ACL 挂在哪（可多选）</th>
                </tr>
              </thead>
              <tbody>
                {P.topo.routers.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <b>{r.name}</b>
                    </td>
                    <td className="text-[12px]">
                      {routingTable(r).map((x: { net: string; iface: string; how: string }) => (
                        <div key={x.iface + x.net}>
                          <span className="font-mono">{x.iface}</span> → {x.net}
                          {x.how !== "connected" && `（${x.how}）`}
                        </div>
                      ))}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {r.ifaces.flatMap((f) =>
                          (["in", "out"] as const).map((d) => {
                            const on = apply.some((x) => x.router === r.name && x.iface === f.name && x.dir === d);
                            return (
                              <button key={f.name + d} type="button" className={`lab-btn ${on ? "lab-btn-on" : ""}`} onClick={() => toggle({ router: r.name, iface: f.name, dir: d })}>
                                {f.name} {d}
                              </button>
                            );
                          }),
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-fg-3">in / out 都是站在路由器中间看的（Slide 14）：in = 刚从这个接口进来，out = 要从这个接口出去。</p>
        </>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="lab-table" style={{ minWidth: "34em" }}>
          <thead>
            <tr>
              <th>包（点一行看过程）</th>
              <th>结果</th>
              <th>在哪里被判</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s, i) => (
              <tr key={i} className={i === sel ? "lab-hot" : ""} style={{ cursor: "pointer" }} onClick={() => setSel(i)}>
                <td className="text-[13px]">{s.p.label}</td>
                <td>
                  <b style={{ color: s.verdict === "permit" ? "var(--c-tip)" : "var(--c-warn)" }}>{s.verdict === "permit" ? "✅ 通过" : "⛔ 丢弃"}</b>
                </td>
                <td className="text-[12px]">
                  {P.topo && s.checked === false ? "路径上没有 ACL" : s.implicit ? `implicit deny${s.where ? `（${s.where}）` : ""}` : `第 ${(s.line ?? 0) + 1} 行${s.where ? `（${s.where}）` : ""}`}
                </td>
              </tr>
            ))}
            <tr className={sel === P.packets.length ? "lab-hot" : ""} onClick={() => setSel(P.packets.length)} style={{ cursor: "pointer" }}>
              <td colSpan={3} className="text-[13px]">
                <div className="flex flex-wrap items-center gap-1">
                  自己设：
                  <input className="lab-select" style={{ width: "8.5em" }} value={custom.src} onChange={(e) => setCustom({ ...custom, src: e.target.value })} aria-label="源 IP" />→
                  <input className="lab-select" style={{ width: "8.5em" }} value={custom.dst} onChange={(e) => setCustom({ ...custom, dst: e.target.value })} aria-label="目的 IP" />
                  <select className="lab-select" value={custom.proto} onChange={(e) => setCustom({ ...custom, proto: e.target.value })} aria-label="协议">
                    {["tcp", "udp", "icmp"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  {custom.proto !== "icmp" && (
                    <>
                      目的端口
                      <input className="lab-select" style={{ width: "4.5em" }} type="number" value={custom.dport ?? ""} onChange={(e) => setCustom({ ...custom, dport: Number(e.target.value) })} aria-label="目的端口" />
                    </>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {!valid && <p className="mt-2 text-[13px] text-fg-3">源 / 目的地址要是合法的 IPv4。</p>}

      {flat && (
        <div className={`lab-decision ${flat.action === "permit" ? "lab-forward" : "lab-flood"}`}>
          <b>
            {cur.label}：{flat.action === "permit" ? "permit" : "deny"}
            {flat.implicit ? "（没有任何一行匹配 → implicit deny）" : `（第 ${(flat.matched ?? 0) + 1} 行匹配，后面的行不再看）`}
          </b>
          <AclTrace r={flat} />
        </div>
      )}

      {walk && (
        <div className={`lab-decision ${walk.verdict === "permit" ? "lab-forward" : "lab-flood"}`}>
          <b>
            {host(cur.src)} → {host(cur.dst)}：{walk.verdict === "permit" ? "送达" : walk.verdict === "deny" ? `在 ${walk.where} 被 ACL 丢弃` : walk.why}
          </b>
          {walk.hops.map((h, i) => (
            <div key={i} className="mt-1">
              <span className="text-[13px]">
                <b>路由器 {h.router}</b>（从 {h.inIf} 进来{h.outIf ? `，从 ${h.outIf} 出去` : ""}）
              </span>
              <ol className="mt-1 pl-1 text-[13px]" style={{ listStyle: "none" }}>
                {h.steps.map((s) => (
                  <li key={s.step}>
                    {CIRCLED[s.step - 1]} <b style={{ color: "inherit" }}>{s.label}</b>
                    {s.text && `：${s.text}`}
                    {s.acl && (
                      <>
                        ：{s.acl.action === "permit" ? "permit → 继续" : "deny → 丢进 bit bucket（并回一个 ICMP unreachable，Slide 58）"}
                        <AclTrace r={s.acl} />
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-[12px] text-fg-3">
        端口关键字：ftp-data 20、ftp 21、telnet 23、smtp 25、domain 53、tftp 69、www 80、pop3 110、snmp 161。自己设的包源端口固定为 1050。{P.topo ? ` 拓扑：${P.topo.label}；不在任何网段的地址都算从外部来 / 往外部去。` : ""}
      </p>
    </div>
  );
}
