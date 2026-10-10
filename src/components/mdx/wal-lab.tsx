"use client";

import { useState } from "react";
import { PHASE_LABEL, WAL_ACTION_LABEL, WAL_DEMOS, WAL_OPS, fmtLsn, recLine, walAct, walInit } from "./recovery-logic.mjs";

type Rec = { lsn: number; t: string };
type Page = { lsn: number | null; vals: Record<string, number> };
type Msg = { kind: "ok" | "block" | "info"; text: string } | null;
type Step = { phase: string; title: string };
type State = {
  pos: number;
  log: Rec[];
  flushedLsn: number;
  mem: Page;
  disk: Page;
  acked: boolean;
  msg: Msg;
  crashed: null | { verdict: string; final: Record<string, number>; result: { steps: Step[] } };
};
type Action = keyof typeof WAL_ACTION_LABEL;

const MSG_CLASS = { ok: "lab-forward", block: "lab-flood", info: "lab-filter" } as const;

function PageBox({ page, dirty }: { page: Page; dirty?: boolean }) {
  return (
    <div className={`rc-page ${dirty ? "rc-dirty" : ""}`}>
      <span className="rc-cell rc-lsn">
        <small>pageLSN</small>
        <b>{fmtLsn(page.lsn)}</b>
      </span>
      {Object.entries(page.vals).map(([k, v]) => (
        <span key={k} className="rc-cell">
          <small>{k}</small>
          <b>{v}</b>
        </span>
      ))}
    </div>
  );
}

// Normal operation under write-ahead logging (slides 19–23): the user decides when to flush the log,
// flush the data page, acknowledge the commit, or crash — and sees which WAL rule each move obeys or breaks.
export function WalLab() {
  const [s, setS] = useState<State>(walInit() as State);
  const [trail, setTrail] = useState<{ action: Action; msg: Msg }[]>([]);

  const act = (a: Action) => {
    const n = walAct(s, a) as State;
    setS(n);
    setTrail([...trail, { action: a, msg: n.msg }]);
  };
  const demo = (actions: Action[]) => {
    let st = walInit() as State;
    const t: { action: Action; msg: Msg }[] = [];
    for (const a of actions) {
      st = walAct(st, a) as State;
      t.push({ action: a, msg: st.msg });
    }
    setS(st);
    setTrail(t);
  };
  const reset = () => {
    setS(walInit() as State);
    setTrail([]);
  };

  const inBuffer = s.log.filter((r) => r.lsn > s.flushedLsn);
  const onDisk = s.log.filter((r) => r.lsn <= s.flushedLsn);
  const next = WAL_OPS[s.pos];
  const dirty = s.mem.lsn != null && s.mem.lsn !== s.disk.lsn;
  const off = !!s.crashed;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · WAL：先写日志，再写数据（Slide 19–23）
        </span>
        <span className="font-mono text-[12px] text-fg-3">磁盘日志到 {fmtLsn(s.flushedLsn)}</span>
      </div>

      <div className="lab-controls">
        {WAL_DEMOS.map((d) => (
          <button key={d.id} type="button" className="lab-btn" onClick={() => demo(d.actions as Action[])}>
            {d.label}
          </button>
        ))}
      </div>

      <div className={`wal-grid ${off ? "wal-off" : ""}`}>
        <p className="wal-zone">内存（volatile，崩溃即丢失）</p>
        <div>
          <p className="ra-cap">WAL buffer（还没上盘的日志）</p>
          <ol className="rc-log">
            {inBuffer.length ? inBuffer.map((r) => <li key={r.lsn} className="rc-rec rc-new">{recLine(r)}</li>) : <li className="rc-rec text-fg-3">（空）</li>}
          </ol>
        </div>
        <div>
          <p className="ra-cap">Buffer pool 里的页面{dirty ? " · dirty" : ""}</p>
          <PageBox page={s.mem} dirty={dirty} />
        </div>
        <p className="wal-zone">磁盘（non-volatile）</p>
        <div>
          <p className="ra-cap">Log file（已上盘的日志）</p>
          <ol className="rc-log">
            {onDisk.map((r) => (
              <li key={r.lsn} className="rc-rec">
                {recLine(r)}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="ra-cap">Database file 里的页面</p>
          <PageBox page={s.disk} />
        </div>
      </div>

      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={off || !next} onClick={() => act("next")}>
          {next ? `▶ T1：${next.label}` : "T1 已做完"}
        </button>
        <button type="button" className="lab-btn" disabled={off} onClick={() => act("flushLog")}>
          Flush 日志
        </button>
        <button type="button" className="lab-btn" disabled={off} onClick={() => act("flushPage")}>
          Flush 数据页
        </button>
        <button type="button" className="lab-btn" disabled={off || s.acked} onClick={() => act("ack")}>
          {s.acked ? "已回复用户" : "回复用户：提交成功"}
        </button>
        <button type="button" className="lab-btn" disabled={off} onClick={() => act("crash")}>
          💥 崩溃
        </button>
        <button type="button" className="lab-btn" onClick={reset}>
          重置
        </button>
      </div>

      {s.msg && (
        <div className={`lab-decision ${MSG_CLASS[s.msg.kind]}`}>
          <span>{s.msg.text}</span>
        </div>
      )}

      {s.crashed && (
        <div className="rc-ask">
          <p>
            <b>重启后恢复：</b>
            {s.crashed.verdict}
          </p>
          <ol className="rc-steps">
            {s.crashed.result.steps.map((st, i) => (
              <li key={i}>
                <span className={`rc-tag rc-${st.phase}`}>{PHASE_LABEL[st.phase as keyof typeof PHASE_LABEL]}</span>
                {st.title}
              </li>
            ))}
          </ol>
        </div>
      )}

      {trail.length > 0 && (
        <details className="wal-trail">
          <summary>操作记录（{trail.length} 步）</summary>
          <ol className="rc-steps">
            {trail.map((t, i) => (
              <li key={i}>
                <span className="bp-layer">{WAL_ACTION_LABEL[t.action]}</span>
                {t.msg?.text}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
