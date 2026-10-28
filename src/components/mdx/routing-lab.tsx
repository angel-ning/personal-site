"use client";

import { useState } from "react";
import {
  LOOKUP_ROUTERS,
  LOOKUP_PRESETS,
  buildTable,
  lookup,
  staticCommand,
  prefixToMask,
  DV_TOPOLOGIES,
  dvRun,
  LS_ROUTERS,
  LS_LINKS,
  LS_PRESETS,
  linkCost,
  spf,
  lsSvg,
} from "./routing-logic.mjs";

type RouterId = keyof typeof LOOKUP_ROUTERS;
type Row = { src: string; net: string; prefix: number; out: string; hop: string | null; note: string; id?: string };
type Static = { id: string; net: string; prefix: number; out: string; hop: string | null; note: string };

// Slides 11–16: pick a router, switch static / default routes on, take an interface down,
// then send a packet to any destination and see which row of the routing table matches.
export function RouteLookupLab() {
  const [router, setRouter] = useState<RouterId>("hoboken");
  const [on, setOn] = useState<string[]>([]);
  const [down, setDown] = useState<string[]>([]);
  const [dest, setDest] = useState("172.16.5.10");
  const R = LOOKUP_ROUTERS[router];
  const { rows, skipped } = buildTable(router, on, down) as { rows: Row[]; skipped: Static[] };
  const res = lookup(rows, dest) as { ok: boolean; error?: string; index?: number; action?: string; why?: string; matches?: { i: number; hit: boolean }[] };
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 路由表查表：直连 / 静态 / 默认路由
        </span>
      </div>
      <p className="mt-2 text-[13px] text-fg-2">
        拓扑是 Slide 11 的 Sterling (172.16.1.0) — Hoboken (172.16.3.0) — Waycross (172.16.5.0)，中间两条串行链路是 172.16.2.0 和 172.16.4.0，全部 /24。
      </p>
      <div className="lab-controls">
        {LOOKUP_PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            className="lab-btn"
            onClick={() => {
              setRouter(p.router as RouterId);
              setOn(p.on);
              setDown(p.down);
              setDest(p.dest);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label>
          路由器{" "}
          <select
            className="lab-select"
            value={router}
            onChange={(e) => {
              setRouter(e.target.value as RouterId);
              setOn([]);
              setDown([]);
            }}
          >
            {(Object.keys(LOOKUP_ROUTERS) as RouterId[]).map((id) => (
              <option key={id} value={id}>
                {LOOKUP_ROUTERS[id].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          目的 IP{" "}
          <input className="lab-select" style={{ width: "10em" }} value={dest} onChange={(e) => setDest(e.target.value)} />
        </label>
      </div>
      <div className="lab-controls">
        <span className="text-[13px] text-fg-2">配置：</span>
        {(R.statics as Static[]).map((s) => (
          <button key={s.id} type="button" className={`lab-btn ${on.includes(s.id) ? "lab-btn-on" : ""}`} onClick={() => toggle(on, setOn, s.id)} title={s.note}>
            <code>{staticCommand(s)}</code>
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <span className="text-[13px] text-fg-2">接口状态（点一下 = 断开）：</span>
        {R.ifaces.map((i) => (
          <button key={i.name} type="button" className={`lab-btn ${down.includes(i.name) ? "lab-btn-on" : ""}`} onClick={() => toggle(down, setDown, i.name)}>
            {i.name} {down.includes(i.name) ? "down ✕" : "up"}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="lab-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Subnet</th>
              <th>Mask</th>
              <th>Out Int.</th>
              <th>Next-Hop</th>
              <th>匹配？</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={res.ok && res.index === i ? "lab-hot" : ""}>
                <td className="font-mono">{r.src}</td>
                <td className="font-mono">{r.net}</td>
                <td className="font-mono">{prefixToMask(r.prefix)}</td>
                <td className="font-mono">{r.out}</td>
                <td className="font-mono">{r.hop ?? "N/A"}</td>
                <td>{res.ok ? (res.matches?.[i]?.hit ? (res.index === i ? "✅ 选这条" : "✓ 也匹配") : "—") : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {skipped.length > 0 && (
        <p className="lab-decision lab-filter">
          <b>有静态路由没装进路由表</b>
          <span>
            {skipped.map((s) => staticCommand(s)).join("、")}：出接口 {skipped.map((s) => s.out).join("、")} 是 down 的（Slide 10：路由器到不了这个出接口，路由就不会被装进去）。
          </span>
        </p>
      )}
      {res.ok ? (
        <p className={`lab-decision ${res.action === "forward" ? "lab-forward" : "lab-flood"}`}>
          <b>{res.action === "forward" ? "转发 (forward)" : "丢弃 (discard)"}</b>
          <span>{res.why}</span>
        </p>
      ) : (
        <p className="lab-decision lab-flood">
          <b>输入有误</b>
          <span>{res.error}</span>
        </p>
      )}
    </div>
  );
}

type DvEntry = { metric: number; hop: string | null; src: string };
type DvRound = { label: string; tables: Record<string, Record<string, DvEntry>>; phase: string };

// Slide 21 / board p.5: every 30 s each router sends its whole table to its neighbours and adds 1 hop.
export function DistanceVectorLab() {
  const [topoId, setTopoId] = useState<keyof typeof DV_TOPOLOGIES>("slide21");
  const [failNet, setFailNet] = useState<string>("");
  const [split, setSplit] = useState(true);
  const [step, setStep] = useState(0);
  const run = dvRun(topoId, { failNet: failNet || null, splitHorizon: split }) as {
    topo: { routers: string[]; nets: { id: string; routers: string[] }[] };
    rounds: DvRound[];
    failAt: number | null;
  };
  const last = run.rounds.length - 1;
  const cur = Math.min(step, last);
  const round = run.rounds[cur];
  const prev = cur > 0 ? run.rounds[cur - 1] : null;
  const reset = () => setStep(0);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 距离矢量：一轮一轮交换路由表
        </span>
      </div>
      <div className="lab-controls">
        {(Object.keys(DV_TOPOLOGIES) as (keyof typeof DV_TOPOLOGIES)[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`lab-btn ${topoId === id ? "lab-btn-on" : ""}`}
            onClick={() => {
              setTopoId(id);
              setFailNet("");
              reset();
            }}
          >
            {DV_TOPOLOGIES[id].label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label>
          收敛后断开网络{" "}
          <select
            className="lab-select"
            value={failNet}
            onChange={(e) => {
              setFailNet(e.target.value);
              reset();
            }}
          >
            <option value="">不断开</option>
            {run.topo.nets.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[13px]">
          <input
            type="checkbox"
            checked={split}
            onChange={(e) => {
              setSplit(e.target.checked);
              reset();
            }}
          />{" "}
          Split horizon（不把路由发回给告诉我的那台）
        </label>
      </div>
      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={cur === 0} onClick={() => setStep(cur - 1)}>
          ← 上一轮
        </button>
        <button type="button" className="lab-btn" disabled={cur === last} onClick={() => setStep(cur + 1)}>
          下一轮 →
        </button>
        <button type="button" className="lab-btn" onClick={() => setStep(last)}>
          跳到收敛
        </button>
        <span className="font-mono text-[13px]">
          {cur} / {last} · {round.label}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {run.topo.routers.map((r) => (
          <div key={r} style={{ overflowX: "auto" }}>
            <b>{r} 的路由表</b>
            <table className="lab-table" style={{ marginTop: ".3em" }}>
              <thead>
                <tr>
                  <th>Src</th>
                  <th>Network</th>
                  <th>Next hop</th>
                  <th>Metric</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(round.tables[r]).map(([net, e]) => {
                  const old = prev?.tables[r]?.[net];
                  const changed = prev && (!old || old.metric !== e.metric || old.hop !== e.hop);
                  return (
                    <tr key={net} className={changed ? "lab-hot" : ""}>
                      <td className="font-mono">{e.src}</td>
                      <td className="font-mono">{net}</td>
                      <td className="font-mono">{e.hop ?? "直连"}</td>
                      <td className="font-mono">{e.metric}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {cur === last && (
        <p className={`lab-decision ${run.failAt !== null && !split ? "lab-flood" : "lab-forward"}`}>
          <b>{run.failAt === null ? `第 ${last} 轮后收敛` : `断开后又过了 ${last - run.failAt} 轮才重新收敛`}</b>
          <span>
            {run.failAt === null
              ? "再交换一轮路由表也不会变：每台路由器都知道每个网络「往哪个方向、多远」，但不知道整张拓扑。"
              : split
                ? "收不到邻居对这条路由的更新，路由就被删掉（Slide 22 最后一条），坏消息一跳一跳往外传——这就是 slow convergence。"
                : "没有 split horizon：邻居把旧路由又发回来，大家互相以为对方能到，metric 一轮 +1 一直数到 16（RIP 的「无穷大」）才删掉——count to infinity。"}
          </span>
        </p>
      )}
      <p className="mt-2 text-[12px] text-fg-3">高亮 = 这一轮新增或改变的条目。Metric = hop count（RIP），每次 30 秒更新。</p>
    </div>
  );
}

type Lsa = { router: string; links: { id: string; neighbor: string; net: string; cost: number }[]; stubs: { net: string; label: string; cost: number }[] };
type SpfResult = {
  db: Lsa[];
  steps: { pick: string; cost: number; relaxed: string[]; tentative: Record<string, number> }[];
  table: { net: string; label: string; cost: number; hop: string | null; via: string }[];
  unreachable: string[];
};

// Board p.7: every router floods its LSA, builds the same topological database, then runs SPF with itself as root.
export function LinkStateLab() {
  const [root, setRoot] = useState("A");
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [down, setDown] = useState<string[]>([]);
  const r = spf(root, costs, down) as SpfResult;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 链路状态：LSA → 拓扑数据库 → SPF 树 → 路由表
        </span>
      </div>
      <div className="lab-controls">
        {LS_PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            className="lab-btn"
            onClick={() => {
              setRoot(p.root);
              setCosts(p.costs as Record<string, number>);
              setDown(p.down);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <span className="text-[13px] text-fg-2">站在哪台路由器（SPF 树的根）：</span>
        {LS_ROUTERS.map((x) => (
          <button key={x} type="button" className={`lab-btn ${root === x ? "lab-btn-on" : ""}`} onClick={() => setRoot(x)}>
            {x}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        {LS_LINKS.map((l) => (
          <span key={l.id} className="text-[13px]">
            {l.a}–{l.b}{" "}
            <select className="lab-select" value={down.includes(l.id) ? "down" : String(linkCost(l, costs))} onChange={(e) => {
              const v = e.target.value;
              if (v === "down") setDown([...down.filter((x) => x !== l.id), l.id]);
              else {
                setDown(down.filter((x) => x !== l.id));
                setCosts({ ...costs, [l.id]: Number(v) });
              }
            }}>
              {[1, 2, 3, 5, 10].map((c) => (
                <option key={c} value={c}>
                  cost {c}
                </option>
              ))}
              <option value="down">断开</option>
            </select>
          </span>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div dangerouslySetInnerHTML={{ __html: lsSvg(root, costs, down) }} />
        <div style={{ overflowX: "auto" }}>
          <b>① 每台路由器的 LSA（只说自己的链路）</b>
          <table className="lab-table" style={{ marginTop: ".3em" }}>
            <tbody>
              {r.db.map((l) => (
                <tr key={l.router}>
                  <th>LSA-{l.router}</th>
                  <td className="font-mono text-[12px]">
                    {l.links.map((x) => `${x.net}→${x.neighbor} (${x.cost})`).join(" · ")}
                    {l.stubs.map((s) => ` · ${s.net} stub`).join("")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[12px] text-fg-3">② 泛洪 (flooding) 后，5 台路由器的拓扑数据库都是这同一张表。</p>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <b className="mt-3 block">③ SPF (Dijkstra) 从 {root} 出发，每步选当前最近的一台</b>
        <table className="lab-table">
          <thead>
            <tr>
              <th>步</th>
              <th>确定</th>
              {LS_ROUTERS.map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.steps.map((s, i) => (
              <tr key={i}>
                <td className="font-mono">{i + 1}</td>
                <td className="font-mono">
                  <b>{s.pick}</b> = {s.cost}
                </td>
                {LS_ROUTERS.map((x) => (
                  <td key={x} className="font-mono">
                    {r.steps.slice(0, i).some((p) => p.pick === x) ? "✓" : s.tentative[x] === Infinity ? "∞" : s.tentative[x]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ overflowX: "auto" }}>
        <b className="mt-3 block">④ {root} 的路由表（只放最优路径）</b>
        <table className="lab-table">
          <thead>
            <tr>
              <th>Network</th>
              <th>是什么</th>
              <th>Cost</th>
              <th>Next hop</th>
            </tr>
          </thead>
          <tbody>
            {r.table.map((t) => (
              <tr key={t.net}>
                <td className="font-mono">{t.net}/24</td>
                <td>{t.label}</td>
                <td className="font-mono">{t.cost}</td>
                <td className="font-mono">{t.hop ?? "直连"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {down.length > 0 && (
        <p className="lab-decision lab-filter">
          <b>链路断开 = 拓扑变化</b>
          <span>两端的路由器立刻发出新的 LSA（event-triggered，不用等 30 秒），每台路由器更新数据库、重跑 SPF。蓝色粗线是新的 SPF 树。</span>
        </p>
      )}
      {r.unreachable.length > 0 && (
        <p className="lab-decision lab-flood">
          <b>到不了：{r.unreachable.join("、")}</b>
          <span>拓扑被切成两半，SPF 树里没有这些路由器。</span>
        </p>
      )}
    </div>
  );
}
