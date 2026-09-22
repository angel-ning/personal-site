"use client";

import { useState } from "react";
import { DISK_PAGES, POOL_FRAMES, POOL_SCRIPT, emptyPool, poolStep } from "./db-logic.mjs";

type Frame = { page: number; dirty: boolean; used: number };
type Pool = { frames: Frame[]; clock: number; reads: number; writes: number };
type Step = { layer: string; text: string };
type Req = { op: "get" | "update" | "flush"; page?: number };

const LAYER = { exec: "Operator Execution", buffer: "Buffer Mgmt", disk: "Disk Mgmt" } as Record<string, string>;
const label = (r: Req) => (r.op === "flush" ? "Flush（写回全部 dirty）" : `${r.op === "update" ? "Update" : "Get"} Page #${r.page}`);

// The execution engine asks for pages; the buffer manager serves them from memory or goes to disk.
export function BufferPoolLab() {
  const [pool, setPool] = useState<Pool>(emptyPool() as Pool);
  const [steps, setSteps] = useState<Step[]>([]);
  const [lastPage, setLastPage] = useState<number | null>(null);
  const [scriptPos, setScriptPos] = useState(0);
  const [page, setPage] = useState(3);

  const run = (req: Req) => {
    const out = poolStep(pool, req) as { state: Pool; steps: Step[] };
    setPool(out.state);
    setSteps(out.steps);
    setLastPage(req.page ?? null);
  };
  const reset = () => {
    setPool(emptyPool() as Pool);
    setSteps([]);
    setLastPage(null);
    setScriptPos(0);
  };
  const next = POOL_SCRIPT[scriptPos] as Req | undefined;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Buffer pool（{POOL_FRAMES} 个 frame）</span>
        <span className="font-mono text-[12px] text-fg-3">
          读盘 {pool.reads} · 写盘 {pool.writes}
        </span>
      </div>

      <div className="bp-grid">
        <div>
          <p className="ra-cap">内存 · Buffer pool</p>
          <div className="bp-frames">
            {Array.from({ length: POOL_FRAMES }, (_, i) => pool.frames[i]).map((f, i) => (
              <div key={i} className={`bp-frame ${f ? "bp-full" : ""} ${f?.dirty ? "bp-dirty" : ""} ${f && f.page === lastPage ? "bp-hot" : ""}`}>
                <small>frame {i}</small>
                {f ? (
                  <>
                    <b>page {f.page}</b>
                    <small>{f.dirty ? "dirty（已改，未写回）" : "clean"}</small>
                  </>
                ) : (
                  <small>空</small>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="ra-cap">磁盘 · Database file</p>
          <div className="bp-disk">
            {DISK_PAGES.map((p: number) => (
              <span key={p} className={`bp-page ${pool.frames.some((f) => f.page === p) ? "bp-cached" : ""}`}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={!next} onClick={() => { if (next) { run(next); setScriptPos(scriptPos + 1); } }}>
          {next ? `▶ 示例第 ${scriptPos + 1} 步：${label(next)}` : "示例已走完"}
        </button>
        <span className="flex items-center gap-1.5 text-[13px]">
          自己试：
          <select className="lab-select" value={page} onChange={(e) => setPage(Number(e.target.value))} aria-label="page">
            {DISK_PAGES.map((p: number) => (
              <option key={p} value={p}>
                Page #{p}
              </option>
            ))}
          </select>
          <button type="button" className="lab-btn" onClick={() => run({ op: "get", page })}>
            Get
          </button>
          <button type="button" className="lab-btn" onClick={() => run({ op: "update", page })}>
            Update
          </button>
          <button type="button" className="lab-btn" onClick={() => run({ op: "flush" })}>
            Flush
          </button>
        </span>
        <button type="button" className="lab-btn" onClick={reset}>
          重置
        </button>
      </div>

      {steps.length > 0 && (
        <ol className="bp-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className={`bp-layer bp-l-${s.layer}`}>{LAYER[s.layer]}</span>
              {s.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
