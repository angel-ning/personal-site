"use client";

import { useState } from "react";
import { RECOVERY_PRESETS, FATE_LABEL, PHASE_LABEL, flushOptions, fmtLsn, presetStart, recLine, recover } from "./recovery-logic.mjs";

type Rec = { lsn: number; t: string; txn?: string };
type Page = { lsn: number | null; vals: Record<string, number> };
type Ask = { q: string; options: string[]; answer: string };
type Step = { phase: string; lsn?: number; newLsn?: number; txn?: string; changed?: string | null; title: string; detail: string; ask?: Ask; page: Page; logLen: number };
type Preset = (typeof RECOVERY_PRESETS)[number];

// Crash recovery step by step (slides 24–31): analysis → REDO forward → UNDO backward with CLRs.
// presets="redo" / "undo,recrash,abort" / "ckpt" picks which slide scenarios this copy offers.
export function RecoveryLab({ presets }: { presets?: string }) {
  const ids = presets ? presets.split(",").map((s) => s.trim()) : RECOVERY_PRESETS.map((p) => p.id);
  const list = RECOVERY_PRESETS.filter((p) => ids.includes(p.id));
  const [pid, setPid] = useState(list[0].id);
  const p = (list.find((x) => x.id === pid) ?? list[0]) as Preset & { flushed?: number; abortTxn?: string };
  const [flushed, setFlushed] = useState<number | null>(p.flushed ?? null);
  const [quiz, setQuiz] = useState(true);
  const [pos, setPos] = useState(0);
  const [pick, setPick] = useState<string | null>(null);

  const start = presetStart(p, flushed) as Page;
  const run = recover({ init: p.init, log: p.log, page: start, crash: p.crash, abortTxn: p.abortTxn }) as {
    steps: Step[];
    log: Rec[];
    fates: { txn: string; fate: keyof typeof FATE_LABEL }[];
  };
  const steps = run.steps;
  const options = p.crash ? (flushOptions(p.init, p.log) as { lsn: number | null; page: Page }[]) : [];

  const choose = (id: string) => {
    const np = (list.find((x) => x.id === id) ?? list[0]) as Preset & { flushed?: number };
    setPid(id);
    setFlushed(np.flushed ?? null);
    setPos(0);
    setPick(null);
  };
  const reset = () => {
    setPos(0);
    setPick(null);
  };
  const advance = () => {
    setPos(Math.min(pos + 1, steps.length));
    setPick(null);
  };

  const shown = pos === 0 ? null : steps[pos - 1];
  const page = shown ? shown.page : start;
  const logLen = shown ? shown.logLen : p.log.length;
  const log = run.log.slice(0, logLen);
  const upcoming = steps[pos] as Step | undefined;
  const asking = quiz && upcoming?.ask;
  const fateOf = (txn: string) => {
    const i = steps.findIndex((s) => s.phase === "analysis" && s.txn === txn);
    return i >= 0 && i < pos ? run.fates.find((f) => f.txn === txn)?.fate : undefined;
  };
  const keys = Object.keys(p.init);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · {p.crash ? "崩溃恢复：分析 → REDO → UNDO" : "正常运行中的 ABORT"}（{p.source}）
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          第 {pos} / {steps.length} 步
        </span>
      </div>

      {list.length > 1 && (
        <div className="lab-controls">
          {list.map((x) => (
            <button key={x.id} type="button" className={`lab-btn ${x.id === pid ? "lab-btn-on" : ""}`} onClick={() => choose(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      )}
      <p className="rc-intro">{p.intro}</p>

      <div className="lab-controls">
        {p.crash ? (
          <label className="flex items-center gap-1.5 text-[13px]">
            崩溃时磁盘页面最后一次写回是在
            <select
              className="lab-select"
              value={flushed ?? ""}
              onChange={(e) => {
                setFlushed(e.target.value === "" ? null : Number(e.target.value));
                reset();
              }}
              aria-label="磁盘页面写到哪条日志"
            >
              {options.map((o) => (
                <option key={o.lsn ?? "none"} value={o.lsn ?? ""}>
                  {o.lsn == null ? "从没写回" : `${fmtLsn(o.lsn)} 之后`}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="text-[13px] text-fg-3">没有崩溃，页面就是内存里的当前页面</span>
        )}
        <label className="flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" checked={quiz} onChange={(e) => setQuiz(e.target.checked)} />
          每一步先自己判断
        </label>
      </div>

      <div className="rc-grid">
        <div>
          <p className="ra-cap">日志（WAL，已在磁盘上）</p>
          <ol className="rc-log">
            {log.map((r, i) => {
              const crashAfter = p.crash && i === p.log.length - 1;
              const cur = shown && (shown.lsn === r.lsn || shown.newLsn === r.lsn);
              const added = i >= p.log.length;
              return (
                <li key={r.lsn} className={`rc-rec ${cur ? "rc-cur" : ""} ${added ? "rc-new" : ""} ${crashAfter ? "rc-crash" : ""}`}>
                  {recLine(r)}
                </li>
              );
            })}
          </ol>
        </div>
        <div>
          <p className="ra-cap">{p.crash ? "磁盘上的数据页面" : "Buffer pool 里的页面"}</p>
          <div className="rc-page">
            <span className="rc-cell rc-lsn">
              <small>pageLSN</small>
              <b>{fmtLsn(page.lsn)}</b>
            </span>
            {keys.map((k) => (
              <span key={k} className={`rc-cell ${shown?.changed === k ? "rc-changed" : ""}`}>
                <small>{k}</small>
                <b>{page.vals[k]}</b>
              </span>
            ))}
          </div>
          {p.crash ? (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>事务</th>
                  <th>恢复时</th>
                </tr>
              </thead>
              <tbody>
                {run.fates.map((f) => {
                  const fate = fateOf(f.txn);
                  return (
                    <tr key={f.txn}>
                      <td className="font-mono">{f.txn}</td>
                      <td>{fate ? <span className={`rc-tag rc-${fate}`}>{FATE_LABEL[fate]}</span> : <span className="text-fg-3">?</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>

      {upcoming ? (
        asking ? (
          <div className="rc-ask">
            <p>
              <span className={`rc-tag rc-${upcoming.phase}`}>{PHASE_LABEL[upcoming.phase as keyof typeof PHASE_LABEL]}</span>
              {upcoming.ask!.q}
            </p>
            <div className="csq-opts">
              {upcoming.ask!.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  disabled={!!pick}
                  className={`lab-btn ${pick && o === upcoming.ask!.answer ? "csq-right" : pick === o ? "csq-wrong" : ""}`}
                  onClick={() => setPick(o)}
                >
                  {o}
                </button>
              ))}
            </div>
            {pick && (
              <p className={`csq-why ${pick === upcoming.ask!.answer ? "csq-ok" : "csq-no"}`}>
                <b>{pick === upcoming.ask!.answer ? "✓" : `✗ 答案是 ${upcoming.ask!.answer}`}</b>
              </p>
            )}
          </div>
        ) : null
      ) : null}

      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={!upcoming || (!!asking && !pick)} onClick={advance}>
          {upcoming ? (asking && !pick ? "先选一个答案" : "▶ 下一步") : "已经走完"}
        </button>
        <button type="button" className="lab-btn" disabled={!upcoming} onClick={() => { setPos(steps.length); setPick(null); }}>
          全部走完
        </button>
        <button type="button" className="lab-btn" onClick={reset}>
          重置
        </button>
      </div>

      {pos > 0 && (
        <ol className="rc-steps">
          {steps.slice(0, pos).map((s, i) => (
            <li key={i} className={i === pos - 1 ? "rc-last" : ""}>
              <span className={`rc-tag rc-${s.phase}`}>{PHASE_LABEL[s.phase as keyof typeof PHASE_LABEL]}</span>
              {s.title}
              {i === pos - 1 && <small>{s.detail}</small>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
