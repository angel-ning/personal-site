"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { PyTrace } from "./code-trace";

// Inline `code` and **bold** in the line notes.
export function richText(s: string): ReactNode[] {
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : part.startsWith("**") && part.endsWith("**") && part.length > 3 ? (
      <b key={i}>{part.slice(2, -2)}</b>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

// Step through a notebook cell one statement at a time: highlighted line, its plain-language note,
// what the if / while / for decided, the variables after the line ran, and what it printed.
export function CodeTraceView({ trace }: { trace: PyTrace }) {
  const n = trace.steps.length;
  const [i, setI] = useState(0); // 0 = nothing has run yet; k = steps[k - 1] just ran
  const [picked, setPicked] = useState<number | null>(null);
  const step = i > 0 ? trace.steps[i - 1] : null;
  const prev = i > 1 ? trace.steps[i - 2] : null;
  const from = step?.line ?? 0;
  const to = step?.end ?? from;
  const noteLine = picked ?? (step ? step.line : trace.notes.findIndex((t) => t) + 1);
  const noteText = trace.notes[noteLine - 1];
  const output = trace.steps.slice(0, i).map((s) => s.out).join("");
  const lastOut = step?.out ?? "";
  const prevVars = new Map((prev?.vars ?? []).map(([k, , v]) => [k, v]));
  const go = (k: number) => {
    setI(Math.max(0, Math.min(n, k)));
    setPicked(null);
  };

  let decision: { cls: string; head: string; body: string } | null = null;
  if (step?.error) decision = { cls: "lab-flood", head: "报错，程序停在这一行", body: step.error };
  else if (step?.cond === true) decision = { cls: "lab-forward", head: "条件 = True", body: "成立 → 进入下面缩进的代码。" };
  else if (step?.cond === false) decision = { cls: "lab-filter", head: "条件 = False", body: "不成立 → 跳过它下面缩进的代码，去看下一个 elif / else（或循环结束）。" };
  else if (step?.loop === "next") decision = { cls: "lab-forward", head: "for：取出下一个元素", body: "还有元素 → 放进循环变量，执行一遍缩进的代码。" };
  else if (step?.loop === "done") decision = { cls: "lab-filter", head: "for：没有下一个了", body: "序列走完 → 循环结束，跳到循环后面的代码。" };
  else if (i === n && n > 0) decision = { cls: "lab-forward", head: "运行结束", body: "整格代码跑完了。可以点「重来」再走一遍，或者点任意一行看讲解。" };

  return (
    <div className="lab not-prose ct">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          逐行运行 · {trace.title}
        </span>
        <span className="ct-tags">
          {trace.mine && <span className="ct-tag ct-tag-mine">我的解答 / 补充</span>}
          {trace.mock && <span className="ct-tag ct-tag-mock">模型输出为示意</span>}
          {trace.source && <span className="font-mono text-[11.5px] text-fg-3">{trace.source}</span>}
        </span>
      </div>
      {trace.setupNote && <p className="ct-setup">{trace.setupNote}</p>}

      <div className="ct-code" role="list">
        {trace.code.map((line, k) => {
          const ln = k + 1;
          const on = step && ln >= from && ln <= to;
          return (
            <button
              key={k}
              type="button"
              role="listitem"
              className={`ct-line ${on ? (step?.error ? "ct-err" : "ct-on") : ""} ${picked === ln ? "ct-picked" : ""} ${trace.notes[k] ? "" : "ct-plain"}`}
              onClick={() => setPicked(trace.notes[k] ? ln : null)}
              title={trace.notes[k] ? "点一下看这一行在做什么" : undefined}
            >
              <span className="ct-ln">{ln}</span>
              <span className="ct-src">{line || " "}</span>
            </button>
          );
        })}
      </div>

      <div className="lab-controls">
        <button type="button" className="lab-btn" onClick={() => go(0)} disabled={i === 0}>
          ⟲ 重来
        </button>
        <button type="button" className="lab-btn" onClick={() => go(i - 1)} disabled={i === 0}>
          ← 上一步
        </button>
        <button type="button" className="lab-btn lab-btn-on" onClick={() => go(i + 1)} disabled={i === n}>
          {i === 0 ? "▶ 开始运行" : "下一步 →"}
        </button>
        <button type="button" className="lab-btn" onClick={() => go(n)} disabled={i === n}>
          跑到底 ⏭
        </button>
        <span className="font-mono text-[12px] text-fg-3">
          第 {i} / {n} 步
        </span>
      </div>

      {noteText && (
        <p className="ct-note">
          <b className="font-mono">第 {noteLine} 行{picked ? "（你点的）" : step ? "（刚执行）" : ""}</b>
          <span>{richText(noteText)}</span>
        </p>
      )}
      {decision && (
        <p className={`lab-decision ${decision.cls}`}>
          <b>{decision.head}</b>
          <span className={step?.error ? "font-mono" : ""}>{decision.body}</span>
        </p>
      )}

      <div className="ct-panels">
        <div>
          <div className="ct-panel-head">变量（这一步执行完之后）</div>
          {step && step.vars.length ? (
            <table className="lab-table ct-vars">
              <thead>
                <tr>
                  <th>名字</th>
                  <th>类型</th>
                  <th>值</th>
                </tr>
              </thead>
              <tbody>
                {step.vars.map(([k, type, v]) => (
                  <tr key={k} className={prevVars.get(k) !== v ? "lab-hot" : ""}>
                    <td className="font-mono">{k}</td>
                    <td className="font-mono text-fg-3">{type}</td>
                    <td className="font-mono ct-val">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="ct-empty">{i === 0 ? "还没开始运行。" : "还没有变量。"}</p>
          )}
        </div>
        <div>
          <div className="ct-panel-head">输出（print 显示的内容）</div>
          <pre className="ct-out">
            {output.slice(0, output.length - lastOut.length)}
            <span className="ct-out-new">{lastOut}</span>
            {step?.error && <span className="ct-out-err">{`Traceback (most recent call last):\n  ...\n${step.error}\n`}</span>}
            {!output && !step?.error && <span className="text-fg-3">（空）</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}
