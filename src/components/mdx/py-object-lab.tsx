"use client";

import { useState } from "react";
import { PY_DEFAULT_TEXT, PY_OPS, pyRepr, runPyOp } from "./py-object-logic.mjs";

const KIND = { func: "内置函数", method: "method()", bug: "忘了括号" } as Record<string, string>;

// Slide 18: call methods on a str object and see what the Python REPL would print; s itself never changes.
export function PyObjectLab() {
  const [s, setS] = useState(PY_DEFAULT_TEXT);
  const [id, setId] = useState("upper");
  const r = runPyOp(s, id);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 对一个 str 对象调用方法
        </span>
        <button type="button" className="lab-btn" onClick={() => setS(PY_DEFAULT_TEXT)}>
          恢复默认文字
        </button>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-[13px]">
        <span className="font-mono text-fg-3">s = （自己改）</span>
        <input value={s} onChange={(e) => setS(e.target.value)} className="lab-select w-full px-2 py-1 text-[13px]" style={{ whiteSpace: "pre" }} />
      </label>
      <div className="lab-controls">
        {PY_OPS.map((o) => (
          <button key={o.id} type="button" className={`lab-btn font-mono ${id === o.id ? "lab-btn-on" : ""}`} onClick={() => setId(o.id)}>
            {o.code}
          </button>
        ))}
      </div>
      <pre className="pyo-repl">
        <span className="pyo-prompt">{">>> "}</span>
        {r.op.code}
        {"\n"}
        <span className={r.op.kind === "bug" ? "pyo-bug" : "pyo-out"}>{r.out}</span>
        {"\n"}
        <span className="pyo-prompt">{">>> "}</span>
        {"s\n"}
        <span className="pyo-out">{pyRepr(s)}</span>
      </pre>
      <table className="lab-table">
        <tbody>
          <tr>
            <th>写法</th>
            <td>{KIND[r.op.kind]}</td>
          </tr>
          <tr>
            <th>返回类型</th>
            <td className="font-mono">{r.type}</td>
          </tr>
          <tr>
            <th>说明</th>
            <td>{r.op.note}</td>
          </tr>
        </tbody>
      </table>
      <p className={`lab-decision ${r.op.kind === "bug" ? "lab-flood" : "lab-forward"}`}>
        <b>{r.op.kind === "bug" ? "没有 () = 没有执行" : "s 本身没变"}</b>
        <span>
          {r.op.kind === "bug"
            ? "object.method 只是「指向这个动作」，加上 () 才是「去做」。"
            : "str 是 immutable（不可变）的：方法返回一个新值，要保留结果得写 s2 = s.upper() 或 s = s.upper()。"}
        </span>
      </p>
    </div>
  );
}
