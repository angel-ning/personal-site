"use client";

import { useState, type ReactNode } from "react";
import {
  BRANCH_PRESETS,
  FORMAT_PRESETS,
  NESTED_PRESETS,
  RANGE_PRESETS,
  SLICE_ITEMS,
  SLICE_PRESETS,
  TEMP_PROMPT,
  evalSubscript,
  fl,
  formatValue,
  nextTokenProbs,
  parseValue,
  pathCode,
  pyRange,
  pyRepr,
  pyType,
  runBranches,
  shortRepr,
  walkPath,
} from "./py-lab-logic.mjs";

type Kind = "float" | "int" | "str";
type Val = number | boolean | string;
type VarDef = { name: string; kind: string; min?: number; max?: number; step?: number; options?: string[]; value: Val };
type BranchPreset = {
  id: string;
  title: string;
  vars: VarDef[];
  branches: { code: string; test: ((v: Record<string, Val>) => boolean) | null; out: (v: Record<string, Val>) => string }[];
};
const KIND_DEFAULT: Record<Kind, string> = { float: "368.0", int: "7", str: "TST" };

// Unit 3: f"{x:SPEC}" — type a value, pick a format spec, see exactly what Python prints (or the error).
export function FStringLab() {
  const [kind, setKind] = useState<Kind>("float");
  const [raw, setRaw] = useState(KIND_DEFAULT.float);
  const [spec, setSpec] = useState(".2f");
  const value = parseValue(kind, raw);
  const r = value === null ? { ok: false, error: "（这不是一个数字）" } : formatValue(value, spec);
  const preset = FORMAT_PRESETS.find((p) => p.spec === spec);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · f-string 格式 {"{x:格式}"}
        </span>
      </div>
      <div className="pyl-row">
        <span className="text-fg-3">x 的类型</span>
        {(["float", "int", "str"] as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`lab-btn font-mono ${kind === k ? "lab-btn-on" : ""}`}
            onClick={() => {
              setKind(k);
              setRaw(KIND_DEFAULT[k]);
            }}
          >
            {k}
          </button>
        ))}
        <label>
          <span className="font-mono">x =</span>
          <input type="text" value={raw} onChange={(e) => setRaw(e.target.value)} />
        </label>
        <label>
          <span className="font-mono">格式</span>
          <input type="text" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="（空）" />
        </label>
      </div>
      <div className="lab-controls">
        {FORMAT_PRESETS.map((p) => (
          <button key={p.spec || "none"} type="button" className={`lab-btn font-mono ${spec === p.spec ? "lab-btn-on" : ""}`} onClick={() => setSpec(p.spec)}>
            {p.spec === "" ? "（空）" : `:${p.spec}`}
          </button>
        ))}
      </div>
      <pre className="pyl-code">
        <span className="pyl-dim">{">>> "}</span>x = {value === null ? raw : pyRepr(kind === "str" ? raw : value)}
        {"\n"}
        <span className="pyl-dim">{">>> "}</span>print(f&quot;|{"{"}x{spec ? `:${spec}` : ""}{"}"}|&quot;)
        {"\n"}
        {r.ok ? <span className="pyl-ok">|{"text" in r ? r.text : ""}|</span> : <span className="pyl-bad">{"error" in r ? r.error : ""}</span>}
      </pre>
      <p className={`lab-decision ${r.ok ? "lab-forward" : "lab-flood"}`}>
        <b>{r.ok ? preset?.desc ?? "自定义格式" : "报错"}</b>
        <span>
          两边的 <code>|</code> 只是为了让你看清前后补了几个空格。{kind === "float" && value !== null ? ` x 的类型是 ${pyType(value)}。` : ""}
          {!r.ok && " d 只给 int 用；f / % 给数字用；str 只能对齐和截断。"}
        </span>
      </p>
    </div>
  );
}

// Unit 4: an if / elif / else chain evaluated top to bottom; the first True wins, the rest are never checked.
export function BranchLab({ preset = "tier" }: { preset?: string }) {
  const presets = BRANCH_PRESETS as unknown as BranchPreset[];
  const p = presets.find((x) => x.id === preset) ?? presets[0];
  const [values, setValues] = useState<Record<string, Val>>(() => Object.fromEntries(p.vars.map((v) => [v.name, v.value])));
  const r = runBranches(p, values) as { rows: (BranchPreset["branches"][number] & { state: "hit" | "false" | "skip" })[]; out: string[] };
  const set = (k: string, v: Val) => setValues({ ...values, [k]: v });

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · if / elif / else · {p.title}
        </span>
      </div>
      <div className="pyl-row">
        {p.vars.map((d) => (
          <label key={d.name}>
            <span className="font-mono">{d.name} =</span>
            {d.kind === "bool" ? (
              <>
                {[true, false].map((b) => (
                  <button key={String(b)} type="button" className={`lab-btn font-mono ${values[d.name] === b ? "lab-btn-on" : ""}`} onClick={() => set(d.name, b)}>
                    {b ? "True" : "False"}
                  </button>
                ))}
              </>
            ) : d.kind === "select" ? (
              <select className="lab-select" value={String(values[d.name])} onChange={(e) => set(d.name, e.target.value)}>
                {d.options!.map((o) => (
                  <option key={o} value={o}>
                    &quot;{o}&quot;
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input type="range" min={d.min} max={d.max} step={d.step} value={Number(values[d.name])} onChange={(e) => set(d.name, Number(e.target.value))} />
                <input type="number" min={d.min} max={d.max} step={d.step} value={Number(values[d.name])} onChange={(e) => set(d.name, Number(e.target.value))} style={{ width: "5.5em" }} />
                {d.kind === "float" && <span className="pyl-dim font-mono">{pyRepr(fl(Number(values[d.name])))}</span>}
              </>
            )}
          </label>
        ))}
      </div>
      <div className="pyl-branch">
        {r.rows.map((b, i) => (
          <div key={i} className={b.state === "hit" ? "pyl-hit" : b.state === "skip" ? "pyl-skip" : ""}>
            <span>{b.code}</span>
            <span className={b.state === "hit" ? "pyl-ok" : "pyl-dim"}>
              {b.state === "hit" ? (b.test === null ? "前面都 False → 走 else" : "True → 执行这一支") : b.state === "false" ? "False → 看下一个" : "不检查"}
            </span>
          </div>
        ))}
      </div>
      <pre className="pyl-code">{r.out.join("\n")}</pre>
      <p className="lab-decision lab-forward">
        <b>只会走一支</b>
        <span>从上往下一个一个问，第一个 True 就进去，后面的 elif / else 连看都不看。改一下数字，特别是刚好等于门槛的值（边界值）。</span>
      </p>
    </div>
  );
}

// Units 5 and 7: positions of a list, [i] / [a:b] / [a:b:c], and range(start, stop, step).
export function SliceLab({ mode = "slice" }: { mode?: "slice" | "range" }) {
  const [expr, setExpr] = useState("[1:4]");
  const [args, setArgs] = useState("1, 6");
  if (mode === "range") {
    const r = pyRange(args);
    return (
      <div className="lab not-prose">
        <div className="lab-head">
          <span className="lab-kicker" style={{ textTransform: "none" }}>
            INTERACTIVE · range(start, stop, step)
          </span>
        </div>
        <div className="pyl-row">
          <label>
            <span className="font-mono">range(</span>
            <input type="text" value={args} onChange={(e) => setArgs(e.target.value)} />
            <span className="font-mono">)</span>
          </label>
        </div>
        <div className="lab-controls">
          {RANGE_PRESETS.map((p) => (
            <button key={p.args} type="button" className={`lab-btn font-mono ${args === p.args ? "lab-btn-on" : ""}`} onClick={() => setArgs(p.args)} title={p.note}>
              range({p.args})
            </button>
          ))}
        </div>
        {r.ok ? (
          <>
            <div className="pyl-cells">
              {r.values!.length ? r.values!.map((v, i) => (
                <span key={i} className={`pyl-cell ${i === 0 ? "pyl-cell-first" : "pyl-cell-on"}`}>
                  {v}
                  <small>第 {i + 1} 次</small>
                </span>
              )) : <span className="pyl-dim text-[13px]">（一个都没有：for 循环体一次也不执行）</span>}
            </div>
            <p className="lab-decision lab-forward">
              <b>
                start = {r.start}，stop = {r.stop}（不含），step = {r.step}
              </b>
              <span>
                list(range({args})) = {pyRepr(r.values!)}。只写一个数 n 时等于 range(0, n, 1)：从 0 开始，正好 n 个。
              </span>
            </p>
          </>
        ) : (
          <p className="lab-decision lab-flood">
            <b>报错</b>
            <span className="font-mono">{r.error}</span>
          </p>
        )}
      </div>
    );
  }

  const r = evalSubscript(SLICE_ITEMS, expr);
  const order: number[] = r.ok ? (r.positions ?? []) : [];
  const picked = new Set(order);
  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 索引 [i] 与切片 [a:b:c]
        </span>
      </div>
      <div className="pyl-cells">
        {SLICE_ITEMS.map((v, i) => (
          <span key={v} className={`pyl-cell ${picked.has(i) ? (order[0] === i ? "pyl-cell-first" : "pyl-cell-on") : ""}`}>
            <small>{i}</small>
            {v}
            <small>{i - SLICE_ITEMS.length}</small>
          </span>
        ))}
      </div>
      <p className="mt-1 text-[12px] text-fg-3">每格上面是正数位置（从 0 开始），下面是负数位置（从 -1 倒数）。绿色是第一个被取到的。</p>
      <div className="pyl-row">
        <label>
          <span className="font-mono">skus</span>
          <input type="text" value={expr} onChange={(e) => setExpr(e.target.value)} />
        </label>
      </div>
      <div className="lab-controls">
        {SLICE_PRESETS.map((p) => (
          <button key={p.expr} type="button" className={`lab-btn font-mono ${expr === p.expr ? "lab-btn-on" : ""}`} onClick={() => setExpr(p.expr)} title={p.note}>
            {p.expr}
          </button>
        ))}
      </div>
      {r.ok ? (
        <p className="lab-decision lab-forward">
          <b className="font-mono">
            skus{expr} → {pyRepr(r.value)}
          </b>
          <span>
            {r.kind === "index"
              ? "单个索引：拿到的是元素本身（这里是 str）。"
              : `切片：拿到一个新的 list（位置 ${r.positions!.join(", ") || "无"}），原来的 skus 不变。终点不含；越界不报错，只是取到头为止。`}
          </span>
        </p>
      ) : (
        <p className="lab-decision lab-flood">
          <b>报错</b>
          <span className="font-mono">{r.error}</span>
        </p>
      )}
    </div>
  );
}

// Units 9, 10, 13: click any value in nested data and read its access path bracket by bracket.
export function NestedPathLab({ presets = "alerts,inventory" }: { presets?: string }) {
  const ids = presets.split(",").map((s) => s.trim());
  const list = NESTED_PRESETS.filter((p) => ids.includes(p.id));
  const [pid, setPid] = useState(list[0].id);
  const p = list.find((x) => x.id === pid) ?? list[0];
  const [path, setPath] = useState<(string | number)[]>(p.start);
  const choose = (id: string) => {
    setPid(id);
    setPath(NESTED_PRESETS.find((x) => x.id === id)!.start);
  };
  const steps = walkPath(p, path);
  const same = (a: (string | number)[]) => a.length === path.length && a.every((k, i) => k === path[i]);

  const render = (v: unknown, at: (string | number)[], depth: number): ReactNode => {
    const pad = "    ".repeat(depth);
    const t = pyType(v);
    const btn = (label: string) => (
      <button type="button" className={same(at) ? "pyl-sel" : ""} onClick={() => setPath(at)}>
        {label}
      </button>
    );
    if (t === "list" && (v as unknown[]).some((x) => typeof x === "object" && x !== null && !("__float" in (x as object)))) {
      const arr = v as unknown[];
      return (
        <>
          {btn("[")}
          {"\n"}
          {arr.map((x, i) => (
            <span key={i}>
              {pad}    <span className="pyl-dim">{`# [${i}]`}</span>
              {"\n"}
              {pad}    {render(x, [...at, i], depth + 1)}
              {",\n"}
            </span>
          ))}
          {pad}]
        </>
      );
    }
    if (t === "list") {
      const arr = v as unknown[];
      return (
        <>
          {btn("[")}
          {arr.map((x, i) => (
            <span key={i}>
              {i > 0 && ", "}
              {render(x, [...at, i], depth + 1)}
            </span>
          ))}
          ]
        </>
      );
    }
    if (t === "dict") {
      const entries = Object.entries(v as Record<string, unknown>);
      return (
        <>
          {btn("{")}
          {"\n"}
          {entries.map(([k, x]) => (
            <span key={k}>
              {pad}    {pyRepr(k)}: {render(x, [...at, k], depth + 1)}
              {",\n"}
            </span>
          ))}
          {pad}
          {"}"}
        </>
      );
    }
    return btn(shortRepr(v, 60));
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 点任意一个值，看怎么一层层取到它
        </span>
      </div>
      {list.length > 1 && (
        <div className="lab-controls">
          {list.map((x) => (
            <button key={x.id} type="button" className={`lab-btn ${pid === x.id ? "lab-btn-on" : ""}`} onClick={() => choose(x.id)}>
              {x.title}
            </button>
          ))}
        </div>
      )}
      <pre className="pyl-tree">
        <span className="font-mono">{p.name} = </span>
        {render(p.data, [], 0)}
      </pre>
      <div className="pyl-path">
        {steps.map((s, i) => (
          <div key={i}>
            <code className="font-mono">{s.code}</code>
            <span className="pyl-dim"> → </span>
            <span>{s.what}</span>
            {i === steps.length - 1 && i > 0 && (
              <>
                <span className="pyl-dim"> · </span>
                <code className="font-mono pyl-ok">{shortRepr(s.value, 60)}</code>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="lab-decision lab-forward">
        <b className="font-mono">{pathCode(p.name, path)}</b>
        <span>从左往右读：每个方括号都作用在「前一步拿到的东西」上。手里是 list 就用 [位置]，是 dict 就用 [&quot;键&quot;]。</span>
      </p>
    </div>
  );
}

// Unit 12: how temperature reshapes the next-token probabilities; do_sample=False always takes the top one.
export function TemperatureLab() {
  const [t, setT] = useState(1);
  const [sample, setSample] = useState(true);
  const probs = nextTokenProbs(t);
  const top = probs.reduce((a, b) => (b.p > a.p ? b : a));
  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 下一个词怎么选：do_sample 与 temperature
        </span>
      </div>
      <p className="mt-2 font-mono text-[13px]">
        prompt = &quot;{TEMP_PROMPT}&quot; → 下一个 token？
      </p>
      <div className="pyl-row">
        {[true, false].map((b) => (
          <button key={String(b)} type="button" className={`lab-btn font-mono ${sample === b ? "lab-btn-on" : ""}`} onClick={() => setSample(b)}>
            do_sample={b ? "True" : "False"}
          </button>
        ))}
        <label style={{ opacity: sample ? 1 : 0.4 }}>
          <span className="font-mono">temperature = {t.toFixed(1)}</span>
          <input type="range" min={0.1} max={2} step={0.1} value={t} disabled={!sample} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <div className="pyl-bars">
        {(sample ? probs : nextTokenProbs(1)).map((c) => (
          <div key={c.token} className={`pyl-bar ${!sample && c.token === top.token ? "pyl-pick" : ""}`}>
            <span>&quot;{c.token}&quot;</span>
            <span style={{ width: `${Math.max(1, (sample ? c.p : c.token === top.token ? 1 : 0) * 100)}%`, opacity: !sample && c.token !== top.token ? 0.15 : 1 }} />
            <span>{sample ? `${(c.p * 100).toFixed(1)}%` : c.token === top.token ? "100%" : "0%"}</span>
          </div>
        ))}
      </div>
      <p className="lab-decision lab-forward">
        <b>{!sample ? "贪心：永远选第一名" : t < 0.7 ? "温度低：几乎只选高概率词" : t > 1.3 ? "温度高：冷门词也有机会" : "温度 ≈ 1：按模型原本的概率抽"}</b>
        <span>
          {!sample
            ? "do_sample=False 时 temperature 不起作用，每次结果都一样（摘要、翻译常用）。"
            : "每生成一个 token 都要这样抽一次。分数是示意值；真实模型有约 5 万个候选词。"}
        </span>
      </p>
    </div>
  );
}
