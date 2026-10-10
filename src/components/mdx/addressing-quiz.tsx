"use client";

import { useState, useSyncExternalStore } from "react";
import { TOPOLOGIES, topologyById, requirements, addressPlan, checkFreeRows, deviceOptions, topologySvg } from "./addressing-logic.mjs";

type Topo = (typeof TOPOLOGIES)[number];
type Ans = { device: string; iface: string; ip: string; mask: string; gateway: string };
type Cell = { ok: "ok" | "warn" | "bad"; msg?: string } | null;
type Res = { device: Cell; iface: Cell; ip: Cell; mask: Cell; gateway: Cell };
type Check = {
  results: Res[];
  general: { ok: string; msg: string }[];
  missing: string[];
  prefix: number | null;
  borrow: number | null;
  borrowOk: boolean;
  netsWithSubnet: number;
  expectedRows: number;
  filledRows: number;
  bad: number;
  warn: number;
  perfect: boolean;
};
type Plan = { rows: { key: string; device: string; iface: string; ip: string; mask: string; gateway: string; role: string }[]; mask: string; prefix: number };

const blank = (): Ans => ({ device: "", iface: "", ip: "", mask: "", gateway: "" });
type Saved = { rows: Ans[]; count: string; min: string; max: string };
const EMPTY: Saved = { rows: [blank()], count: "", min: "", max: "" };
const KEY = (id: string) => `addrquiz:${id}`;

// Answers per topology live in an in-memory map mirrored to localStorage (when available), read through
// useSyncExternalStore so the server render and the first client render agree (empty), then fill in.
const mem = new Map<string, Saved>();
const listeners = new Set<() => void>();
function get(id: string): Saved {
  if (!mem.has(id)) {
    let v = EMPTY;
    try {
      const raw = window.localStorage.getItem(KEY(id));
      if (raw) v = { ...EMPTY, ...JSON.parse(raw) };
    } catch {
      /* storage blocked: start empty */
    }
    mem.set(id, v);
  }
  return mem.get(id)!;
}
function put(id: string, v: Saved) {
  mem.set(id, v);
  try {
    window.localStorage.setItem(KEY(id), JSON.stringify(v));
  } catch {
    /* private mode: keep it in memory only */
  }
  listeners.forEach((f) => f());
}
const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};

// Exam-style addressing practice: the table starts empty and nothing says which interfaces need an
// address — add your own rows (device, interface, IP, mask, gateway), then check. Saved in this browser.
export function AddressingQuiz({ start = "q1" }: { start?: string }) {
  const [id, setId] = useState(start);
  const topo = topologyById(id) as Topo;
  const req = requirements(topo);
  const devices = deviceOptions(topo) as { value: string; label: string }[];
  const saved = useSyncExternalStore(subscribe, () => get(id), () => EMPTY);
  const { rows, count, min, max } = saved;
  const [checked, setChecked] = useState<{ id: string; c: Check } | null>(null);
  const [refFor, setRefFor] = useState<string | null>(null);
  const [showIfaces, setShowIfaces] = useState(false);
  const check = checked?.id === id ? checked.c : null;
  const showRef = refFor === id;

  const update = (next: Partial<Saved>) => {
    put(id, { ...saved, ...next });
    setChecked(null);
  };
  const setRow = (i: number, k: keyof Ans, v: string) => update({ rows: rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  const addRow = () => put(id, { ...saved, rows: [...rows, blank()] });
  const delRow = (i: number) => {
    const next = rows.filter((_, j) => j !== i);
    update({ rows: next.length ? next : [blank()] });
  };
  const clearAll = () => {
    update({ rows: [blank()], count: "", min: "", max: "" });
    setRefFor(null);
  };

  const svg = topologySvg(topo, null, { showAddr: false, showIfaces });
  const refBorrow = check?.borrowOk && check.borrow != null ? check.borrow : req.pick;
  const ref = showRef ? (addressPlan(topo, refBorrow) as Plan | null) : null;
  const cls = (c: Cell | undefined) => (check && c ? `addr-${c.ok}` : "");
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const stepOk = {
    count: num(count) === req.subnetsDrawn,
    min: num(min) === req.minBorrow,
    max: num(max) === req.maxBorrow,
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Practice · 自己编址（不提示哪些接口要地址）</span>
      </div>
      <div className="lab-controls">
        {TOPOLOGIES.map((t) => (
          <button key={t.id} type="button" className={`lab-btn ${t.id === id ? "lab-btn-on" : ""}`} onClick={() => setId(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="addr-q">
        <b>{topo.source}：</b>
        {topo.question} 网络：<code>{topo.base}</code>。把图里<b>所有需要 IP 地址的地方</b>写进下表（自己加行）。
      </p>
      <div className="addr-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      <label className="addr-toggle">
        <input type="checkbox" checked={showIfaces} onChange={(e) => setShowIfaces(e.target.checked)} /> 图上显示接口名（考试的图有时标、有时不标）
      </label>

      <div className="addr-steps">
        <label>
          图里一共几个网络（= 需要几个子网）
          <input className={`lab-select addr-in addr-num ${check ? (stepOk.count ? "addr-ok" : "addr-bad") : ""}`} value={count} inputMode="numeric" onChange={(e) => update({ count: e.target.value })} />
        </label>
        <label>
          最少借几位
          <input className={`lab-select addr-in addr-num ${check ? (stepOk.min ? "addr-ok" : "addr-bad") : ""}`} value={min} inputMode="numeric" onChange={(e) => update({ min: e.target.value })} />
        </label>
        <label>
          最多借几位
          <input className={`lab-select addr-in addr-num ${check ? (stepOk.max ? "addr-ok" : "addr-bad") : ""}`} value={max} inputMode="numeric" onChange={(e) => update({ max: e.target.value })} />
        </label>
      </div>

      <div className="table-wrap">
        <table className="lab-table addr-form">
          <thead>
            <tr>
              <th>Device</th>
              <th>Interface</th>
              <th>IP Address</th>
              <th>Subnet Mask</th>
              <th>Default Gateway</th>
              <th aria-label="删除" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const res = check?.results[i];
              const msgs = res ? (["device", "iface", "ip", "mask", "gateway"] as const).map((k) => res[k]).filter((c): c is NonNullable<Cell> => !!c && c.ok !== "ok" && !!c.msg) : [];
              return [
                <tr key={`r${i}`}>
                  <td>
                    <select className={`lab-select addr-in ${cls(res?.device)}`} value={r.device} onChange={(e) => setRow(i, "device", e.target.value)} aria-label="device">
                      <option value="">— 设备 —</option>
                      {devices.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className={`lab-select addr-in addr-if ${cls(res?.iface)}`} value={r.iface} placeholder="E0 / S0 / NIC" onChange={(e) => setRow(i, "iface", e.target.value)} aria-label="interface" />
                  </td>
                  <td>
                    <input className={`lab-select addr-in ${cls(res?.ip)}`} value={r.ip} placeholder="IP" inputMode="decimal" onChange={(e) => setRow(i, "ip", e.target.value)} aria-label="IP address" />
                  </td>
                  <td>
                    <input className={`lab-select addr-in ${cls(res?.mask)}`} value={r.mask} placeholder="255.255.255.x" inputMode="decimal" onChange={(e) => setRow(i, "mask", e.target.value)} aria-label="subnet mask" />
                  </td>
                  <td>
                    <input className={`lab-select addr-in ${cls(res?.gateway)}`} value={r.gateway} placeholder="IP 或 N/A" onChange={(e) => setRow(i, "gateway", e.target.value)} aria-label="default gateway" />
                  </td>
                  <td>
                    <button type="button" className="addr-del" onClick={() => delRow(i)} aria-label="删除这一行">
                      ✕
                    </button>
                  </td>
                </tr>,
                msgs.length ? (
                  <tr key={`m${i}`} className="addr-msgrow">
                    <td colSpan={6}>
                      {msgs.map((m, k) => (
                        <span key={k} className={`addr-msg addr-${m.ok}`}>
                          {m.msg}
                        </span>
                      ))}
                    </td>
                  </tr>
                ) : null,
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="lab-controls">
        <button type="button" className="lab-btn" onClick={addRow}>
          + 加一行
        </button>
        <button type="button" className="lab-btn lab-btn-on" onClick={() => setChecked({ id, c: checkFreeRows(topo, rows) as Check })}>
          检查
        </button>
        <button type="button" className="lab-btn" onClick={() => setRefFor(showRef ? null : id)}>
          {showRef ? "收起参考答案" : "看参考答案"}
        </button>
        <button type="button" className="lab-btn" onClick={clearAll}>
          清空重做
        </button>
      </div>

      {check && (
        <div className={`lab-decision ${check.perfect ? "lab-forward" : "lab-flood"}`}>
          <b>
            {check.perfect
              ? `✓ 全对：${check.filledRows} 行，掩码 /${check.prefix}`
              : `写了 ${check.filledRows} 行（这张图一共要 ${check.expectedRows} 行）· ${check.bad} 处错误 · ${check.warn} 处提醒`}
          </b>
          {!(stepOk.count && stepOk.min && stepOk.max) && (
            <span>
              上面三个数：{stepOk.count ? "网络数 ✓" : `网络数 ✗（${req.lans} 个 LAN + ${req.links} 条路由器之间的线）`} · {stepOk.min ? "最少借位 ✓" : "最少借位 ✗（2^s ≥ 需要的子网数）"} ·{" "}
              {stepOk.max ? "最多借位 ✓" : "最多借位 ✗（留够 h 位：2^h − 2 ≥ 每个子网要的地址数，别忘了路由器接口也占一个）"}
            </span>
          )}
          {check.general.map((g, k) => (
            <span key={k}>✗ {g.msg}</span>
          ))}
          {check.missing.length > 0 && (
            <>
              <span>还缺这些地址：</span>
              <ul className="addr-missing">
                {check.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {ref && (
        <div className="table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th colSpan={5}>
                  参考答案（借 {refBorrow} 位，掩码 {ref.mask}；LAN 先、路由器之间的线后，按顺序用子网）
                </th>
              </tr>
              <tr>
                <th>Device</th>
                <th>Interface</th>
                <th>IP Address</th>
                <th>Subnet Mask</th>
                <th>Default Gateway</th>
              </tr>
            </thead>
            <tbody>
              {ref.rows.map((r) => (
                <tr key={r.key} className={r.role === "router-lan" ? "lab-hot" : ""}>
                  <td>{r.device}</td>
                  <td>{r.iface}</td>
                  <td>
                    <code>{r.ip}</code>
                  </td>
                  <td>{r.mask}</td>
                  <td>{r.gateway}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="addr-note">子网的顺序、主机拿第几个地址可以和参考答案不同，检查器按规则判断：同一个网络同一个子网、不用 network / broadcast 地址、不重复、路由器 LAN 接口用第一个可用地址、主机网关 = 那个接口。</p>
        </div>
      )}
    </div>
  );
}
