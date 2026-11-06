// ISOM 5160 Python notebook: pure functions behind the small Python labs (f-string formats,
// if / elif chains, indexing / slicing / range, nested access paths, sampling temperature).
// Shared by the page components and the README export in scripts/lib/mdx-core.mjs.

// ---------- Python values in JS ----------
// JS has one number type; mark Python floats so 40.0 prints as 40.0, not 40.
export const fl = (v) => ({ __float: v });
const isFloat = (v) => v !== null && typeof v === "object" && "__float" in v;
const num = (v) => (isFloat(v) ? v.__float : v);

export function pyType(v) {
  if (isFloat(v)) return "float";
  if (typeof v === "number") return "int";
  if (typeof v === "string") return "str";
  if (typeof v === "boolean") return "bool";
  if (v === null) return "NoneType";
  if (Array.isArray(v)) return "list";
  return "dict";
}

export function pyRepr(v) {
  if (isFloat(v)) return Number.isInteger(v.__float) ? `${v.__float}.0` : String(v.__float);
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "True" : "False";
  if (v === null) return "None";
  if (typeof v === "string") {
    const q = v.includes("'") && !v.includes('"') ? '"' : "'";
    return q + v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n") + q;
  }
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(", ")}]`;
  return `{${Object.entries(v).map(([k, x]) => `${pyRepr(k)}: ${pyRepr(x)}`).join(", ")}}`;
}

const pyStr = (v) => (typeof v === "string" ? v : pyRepr(v));

// ---------- f-string format spec: [[fill]align][sign][,][0][width][.precision][type] ----------
export const FORMAT_PRESETS = [
  { spec: "", desc: "不写格式：和 print(x) 一样" },
  { spec: ".2f", desc: "保留 2 位小数（钱最常用）" },
  { spec: ".0f", desc: "不要小数（四舍五入）" },
  { spec: ",.2f", desc: "千分位逗号 + 2 位小数" },
  { spec: "03d", desc: "整数，至少 3 位，前面补 0" },
  { spec: ">10", desc: "宽 10，靠右（前面补空格）" },
  { spec: "<10", desc: "宽 10，靠左" },
  { spec: "^10", desc: "宽 10，居中" },
  { spec: ".1%", desc: "乘 100 显示成百分比，1 位小数" },
  { spec: ".4f", desc: "4 位小数（模型 score 常用）" },
  { spec: "d", desc: "按整数显示（float 会报错）" },
];

// Python rounds exact halves to even (format(12850.5, ".0f") == "12850"); toFixed rounds them up.
function toFixedPy(x, p) {
  const scaled = x * 10 ** p;
  if (Number.isInteger(scaled * 2) && !Number.isInteger(scaled)) {
    const lo = Math.floor(scaled);
    return ((lo % 2 === 0 ? lo : lo + 1) / 10 ** p).toFixed(p);
  }
  return x.toFixed(p);
}

const SPEC_RE = /^(?:(.)?([<>^=]))?([+\- ])?(,)?(0)?(\d+)?(?:\.(\d+))?([sdf%eE])?$/;

export function formatValue(value, spec) {
  if (spec === "") return { ok: true, text: pyStr(value) };
  const m = SPEC_RE.exec(spec);
  if (!m) return { ok: false, error: `ValueError: Invalid format specifier '${spec}'` };
  let [, fill, align, sign, comma, zero, width, prec, type] = m;
  const t = pyType(value);
  const n = num(value);
  if (zero && !align) { fill = "0"; align = "="; }
  fill = fill ?? " ";
  let body;
  if (t === "str") {
    if (type && type !== "s") return { ok: false, error: `ValueError: Unknown format code '${type}' for object of type 'str'` };
    if (sign || comma) return { ok: false, error: "ValueError: Sign not allowed in string format specifier" };
    body = prec !== undefined ? value.slice(0, Number(prec)) : value;
    align = align ?? "<";
  } else {
    if (type === "s") return { ok: false, error: `ValueError: Unknown format code 's' for object of type '${t}'` };
    if (type === "d" && t === "float") return { ok: false, error: "ValueError: Unknown format code 'd' for object of type 'float'" };
    if (type === "d" && prec !== undefined) return { ok: false, error: "ValueError: Precision not allowed in integer format specifier" };
    if (t === "int" && !type && prec !== undefined) return { ok: false, error: "ValueError: Precision not allowed in integer format specifier" };
    let digits;
    const abs = Math.abs(n);
    if (type === "f") digits = toFixedPy(abs, prec === undefined ? 6 : Number(prec));
    else if (type === "%") digits = toFixedPy(abs * 100, prec === undefined ? 6 : Number(prec)) + "%";
    else if (type === "e" || type === "E") {
      digits = abs.toExponential(prec === undefined ? 6 : Number(prec)).replace(/e([+-])(\d)$/, "e$10$2");
      if (type === "E") digits = digits.toUpperCase();
    } else if (t === "float" && prec !== undefined) digits = String(Number(abs.toPrecision(Number(prec))));
    else digits = t === "float" ? pyRepr(fl(abs)) : String(abs);
    if (comma) {
      const [int, ...rest] = digits.split(".");
      digits = [int.replace(/\B(?=(\d{3})+(?!\d))/g, ","), ...rest].join(".");
    }
    const s = n < 0 ? "-" : sign === "+" ? "+" : sign === " " ? " " : "";
    body = s + digits;
    align = align ?? ">";
    if (align === "=") {
      const pad = Math.max(0, Number(width ?? 0) - body.length);
      return { ok: true, text: s + fill.repeat(pad) + digits };
    }
  }
  const w = Number(width ?? 0);
  const pad = Math.max(0, w - body.length);
  if (align === "<") body = body + fill.repeat(pad);
  else if (align === ">") body = fill.repeat(pad) + body;
  else if (align === "^") body = fill.repeat(Math.floor(pad / 2)) + body + fill.repeat(Math.ceil(pad / 2));
  return { ok: true, text: body };
}

export function parseValue(kind, raw) {
  if (kind === "str") return raw;
  const n = Number(raw);
  if (raw.trim() === "" || Number.isNaN(n)) return null;
  return kind === "float" ? fl(n) : Math.trunc(n);
}

// ---------- if / elif / else chains ----------
// Each branch: the header line, a test (null for else) and what that branch prints.
export const BRANCH_PRESETS = [
  {
    id: "shipping", title: "运费规则（Day 1 cell 21）",
    vars: [{ name: "basket", kind: "float", min: 0, max: 600, step: 5, value: 275 }],
    branches: [
      { code: "if basket >= 300:", test: (v) => v.basket >= 300, out: () => "Free shipping applied" },
      { code: "else:", test: null, out: () => "Shipping fee: HKD 25.00" },
    ],
    after: (v) => `Payable total: HKD ${(v.basket + (v.basket >= 300 ? 0 : 25)).toFixed(2)}`,
    samples: [{ basket: 275 }, { basket: 300 }, { basket: 420 }],
  },
  {
    id: "tier", title: "会员等级（Day 1 cell 23）",
    vars: [{ name: "points", kind: "int", min: 0, max: 1500, step: 10, value: 820 }],
    branches: [
      { code: "if points >= 1000:", test: (v) => v.points >= 1000, out: () => 'tier = "Gold"' },
      { code: "elif points >= 500:", test: (v) => v.points >= 500, out: () => 'tier = "Silver"' },
      { code: "elif points >= 100:", test: (v) => v.points >= 100, out: () => 'tier = "Bronze"' },
      { code: "else:", test: null, out: () => 'tier = "Guest"' },
    ],
    samples: [{ points: 1000 }, { points: 820 }, { points: 500 }, { points: 99 }],
  },
  {
    id: "promo", title: "组合条件 and / not（Day 1 cell 25）",
    vars: [
      { name: "is_member", kind: "bool", value: true },
      { name: "basket", kind: "float", min: 0, max: 800, step: 10, value: 420 },
    ],
    branches: [
      { code: "if is_member and basket >= 400:", test: (v) => v.is_member && v.basket >= 400, out: () => "Member promo unlocked" },
      { code: "elif not is_member and basket >= 600:", test: (v) => !v.is_member && v.basket >= 600, out: () => "Guest high-spend promo unlocked" },
      { code: "else:", test: null, out: () => "No promo this visit" },
    ],
    samples: [{ is_member: true, basket: 420 }, { is_member: true, basket: 380 }, { is_member: false, basket: 650 }, { is_member: false, basket: 420 }],
  },
  {
    id: "status", title: "订单状态（Day 1 Practice P3）",
    vars: [{ name: "status", kind: "select", options: ["paid", "pending", "cancelled", "refund", "Paid"], value: "pending" }],
    branches: [
      { code: 'if status == "paid":', test: (v) => v.status === "paid", out: () => "Ready to ship" },
      { code: 'elif status == "pending":', test: (v) => v.status === "pending", out: () => "Awaiting payment" },
      { code: 'elif status == "cancelled":', test: (v) => v.status === "cancelled", out: () => "Do not ship" },
      { code: "else:", test: null, out: () => "Unknown status - check with supervisor" },
    ],
    samples: [{ status: "paid" }, { status: "pending" }, { status: "cancelled" }, { status: "Paid" }],
  },
  {
    id: "alert", title: "告警分级（Day 2 cell 30）",
    vars: [{ name: "score", kind: "int", min: 0, max: 100, step: 1, value: 78 }],
    branches: [
      { code: "if score >= 90:", test: (v) => v.score >= 90, out: () => 'flag = "CRITICAL"' },
      { code: "elif score >= 70:", test: (v) => v.score >= 70, out: () => 'flag = "REVIEW"' },
      { code: "else:", test: null, out: () => 'flag = "MONITOR"' },
    ],
    samples: [{ score: 92 }, { score: 78 }, { score: 70 }, { score: 55 }],
  },
  {
    id: "stock", title: "补货标记（Day 2 cell 37）",
    vars: [
      { name: "stock", kind: "int", min: 0, max: 50, step: 1, value: 8 },
      { name: "level", kind: "int", min: 0, max: 50, step: 1, value: 10 },
    ],
    branches: [
      { code: "if stock < level:", test: (v) => v.stock < v.level, out: () => 'flag = "REORDER NOW"' },
      { code: "elif stock == level:", test: (v) => v.stock === v.level, out: () => 'flag = "AT LIMIT"' },
      { code: "else:", test: null, out: () => 'flag = "OK"' },
    ],
    samples: [{ stock: 25, level: 20 }, { stock: 8, level: 10 }, { stock: 10, level: 10 }],
  },
];

// Walk the chain like Python: test each header in order until one is True; the rest are never looked at.
export function runBranches(preset, values) {
  let hit = -1;
  const rows = preset.branches.map((b, i) => {
    if (hit >= 0) return { ...b, state: "skip" };
    const ok = b.test === null ? true : Boolean(b.test(values));
    if (ok) hit = i;
    return { ...b, state: ok ? "hit" : "false" };
  });
  const out = [rows[hit].out(values)];
  if (preset.after) out.push(preset.after(values));
  return { rows, hit, out };
}

export const branchValueText = (preset, values) =>
  preset.vars.map((d) => `${d.name} = ${d.kind === "bool" ? (values[d.name] ? "True" : "False") : d.kind === "select" ? pyRepr(values[d.name]) : d.kind === "float" ? pyRepr(fl(values[d.name])) : values[d.name]}`).join(", ");

// ---------- indexing, slicing, range ----------
export const SLICE_ITEMS = ["P100", "P200", "P300", "P400", "P500"];

export const SLICE_PRESETS = [
  { expr: "[0]", note: "第一个" },
  { expr: "[-1]", note: "最后一个" },
  { expr: "[1:4]", note: "位置 1、2、3（4 不含）" },
  { expr: "[:2]", note: "从头取 2 个" },
  { expr: "[2:]", note: "从位置 2 到最后" },
  { expr: "[-2:]", note: "最后 2 个" },
  { expr: "[::2]", note: "每隔一个取一个" },
  { expr: "[::-1]", note: "倒过来" },
  { expr: "[5]", note: "越界：报错" },
  { expr: "[1:99]", note: "切片越界不报错" },
];

const toIntOrNull = (s) => {
  if (s === undefined || s.trim() === "") return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : NaN;
};

// Python's slice.indices(): clamp start / stop for a sequence of length len.
function sliceIndices(len, start, stop, step) {
  const norm = (x, dflt, lo, hi) => {
    if (x === null) return dflt;
    if (x < 0) x += len;
    return Math.min(Math.max(x, lo), hi);
  };
  return step > 0 ? [norm(start, 0, 0, len), norm(stop, len, 0, len)] : [norm(start, len - 1, -1, len - 1), norm(stop, -1, -1, len - 1)];
}

// expr like "[1:4]", "[-1]", "[::2]". Returns picked positions in order, or an error.
export function evalSubscript(items, expr) {
  const m = /^\[\s*([^\]]*)\s*\]$/.exec(expr.trim());
  if (!m) return { ok: false, error: "SyntaxError: 要写成 [i] 或 [a:b] 或 [a:b:c]" };
  const parts = m[1].split(":");
  if (parts.length === 1) {
    const i = toIntOrNull(parts[0]);
    if (i === null || Number.isNaN(i)) return { ok: false, error: "TypeError: list indices must be integers or slices" };
    const j = i < 0 ? i + items.length : i;
    if (j < 0 || j >= items.length) return { ok: false, error: "IndexError: list index out of range" };
    return { ok: true, kind: "index", positions: [j], value: items[j] };
  }
  if (parts.length > 3) return { ok: false, error: "SyntaxError: invalid syntax" };
  const [a, b, c] = [toIntOrNull(parts[0]), toIntOrNull(parts[1]), toIntOrNull(parts[2])];
  if ([a, b, c].some((x) => Number.isNaN(x))) return { ok: false, error: "TypeError: slice indices must be integers or None" };
  const step = c === null ? 1 : c;
  if (step === 0) return { ok: false, error: "ValueError: slice step cannot be zero" };
  const [s, e] = sliceIndices(items.length, a, b, step);
  const positions = [];
  for (let k = s; step > 0 ? k < e : k > e; k += step) positions.push(k);
  return { ok: true, kind: "slice", positions, value: positions.map((k) => items[k]) };
}

export const RANGE_PRESETS = [
  { args: "5", note: "0 到 4" },
  { args: "1, 6", note: "Day 1 cell 32：1 到 5" },
  { args: "0, 10, 2", note: "步长 2" },
  { args: "10, 0, -3", note: "倒数" },
  { args: "3, 3", note: "空的" },
];

export function pyRange(args) {
  const xs = args.split(",").map((s) => s.trim()).filter((s) => s !== "").map(Number);
  if (xs.length < 1 || xs.length > 3 || xs.some((x) => !Number.isInteger(x))) return { ok: false, error: "TypeError: range() 需要 1–3 个整数参数" };
  const [start, stop, step] = xs.length === 1 ? [0, xs[0], 1] : [xs[0], xs[1], xs[2] ?? 1];
  if (step === 0) return { ok: false, error: "ValueError: range() arg 3 must not be zero" };
  const out = [];
  for (let k = start; step > 0 ? k < stop : k > stop; k += step) {
    out.push(k);
    if (out.length > 200) break;
  }
  return { ok: true, start, stop, step, values: out };
}

// ---------- nested data: build the access path one bracket at a time ----------
export const NESTED_PRESETS = [
  {
    id: "alerts", name: "alerts", title: "list of dicts：告警（Day 2 cell 30）",
    data: [
      { alert_id: "AL-2001", subject: "Urgent wire transfer request", score: 92, channel: "email" },
      { alert_id: "AL-2002", subject: "Password reset notice", score: 55, channel: "email" },
      { alert_id: "AL-2003", subject: "Unusual VPN login", score: 78, channel: "vpn" },
    ],
    start: [2, "score"],
  },
  {
    id: "inventory", name: "inventory", title: "dict of dicts：库存（Day 2 cell 37）",
    data: {
      "Smart Badge": { stock: 25, reorder_level: 20, unit_cost: fl(40) },
      "VPN Token": { stock: 8, reorder_level: 10, unit_cost: fl(60) },
      "USB-C Cable": { stock: 40, reorder_level: 15, unit_cost: fl(25) },
    },
    start: ["VPN Token", "unit_cost"],
  },
  {
    id: "staff", name: "staff", title: "dict of dicts：员工（Day 2 Practice P4）",
    data: {
      E100: { name: "Ada Chen", team: "network", years: 6 },
      E101: { name: "Ben Li", team: "endpoint", years: 3 },
      E102: { name: "Cara Ng", team: "identity", years: 1 },
    },
    start: ["E101", "team"],
  },
  {
    id: "sentiment", name: "out", title: "情感分析，一句话 → 还是 list（SampleCode cell 9）",
    data: [{ label: "POSITIVE", score: fl(0.9998743534088135) }],
    start: [0, "label"],
  },
  {
    id: "batch", name: "out", title: "情感分析，传 list → 一条一个 dict（SampleCode cell 11）",
    data: [{ label: "POSITIVE", score: fl(0.9998743534088135) }, { label: "NEGATIVE", score: fl(0.9997480511665344) }],
    start: [1, "score"],
  },
  {
    id: "generation", name: "generated_story", title: "文本生成（Tutorial cell 8）",
    data: [{ generated_text: "Once upon a time in a land far, far away, the most important thing is …" }],
    start: [0, "generated_text"],
  },
  {
    id: "qa", name: "result", title: "问答 → 一个 dict，没有 [0]（Tutorial cell 24）",
    data: { score: fl(0.6824), start: 89, end: 112, answer: "Artificial Intelligence" },
    start: ["answer"],
  },
  {
    id: "zeroshot", name: "classification", title: "零样本分类 → dict 里两个平行 list（UsefulFunctions cell 24）",
    data: { sequence: "Employees received emails requesting urgent password resets …", labels: ["phishing", "malware", "data backup", "physical security"], scores: [fl(0.9132), fl(0.0511), fl(0.0219), fl(0.0138)] },
    start: ["labels", 0],
  },
  {
    id: "ner", name: "entities", title: "NER（aggregation_strategy=\"simple\"）（UsefulFunctions cell 12）",
    data: [
      { entity_group: "PER", score: fl(0.9991), word: "Alice Chen", start: 0, end: 10 },
      { entity_group: "ORG", score: fl(0.9987), word: "Microsoft", start: 16, end: 25 },
      { entity_group: "LOC", score: fl(0.9995), word: "Paris", start: 34, end: 39 },
    ],
    start: [1, "word"],
  },
  {
    id: "tts", name: "speech_output", title: "语音合成 → dict（Tutorial cell 30）",
    data: { audio: "<array, shape (1, 87296)>", sampling_rate: 16000 },
    start: ["sampling_rate"],
  },
];

export const pathCode = (name, path) => name + path.map((k) => (typeof k === "number" ? `[${k}]` : `["${k}"]`)).join("");

const describe = (v) => {
  const t = pyType(v);
  if (t === "list") return `list，${v.length} 个元素 → 下一步用 [位置] 取`;
  if (t === "dict") return `dict，键：${Object.keys(v).join(" / ")} → 下一步用 ["键"] 取`;
  return `${t}：最终的值`;
};

// Each prefix of the path: the code so far, what you hold, and what it is.
export function walkPath(preset, path) {
  const steps = [{ code: preset.name, value: preset.data, what: describe(preset.data) }];
  let cur = preset.data;
  for (let i = 0; i < path.length; i++) {
    cur = cur[path[i]];
    steps.push({ code: pathCode(preset.name, path.slice(0, i + 1)), value: cur, what: describe(cur) });
  }
  return steps;
}

export const shortRepr = (v, max = 70) => {
  const r = pyRepr(v);
  return r.length > max ? r.slice(0, max - 1) + "…" : r;
};

// ---------- sampling temperature (text generation) ----------
export const TEMP_PROMPT = "A well-designed security policy should";
// Illustrative next-token scores (logits); a real model has ~50k candidates.
export const TEMP_CANDIDATES = [
  { token: " be", logit: 4.2 },
  { token: " include", logit: 3.4 },
  { token: " protect", logit: 3.0 },
  { token: " always", logit: 2.3 },
  { token: " never", logit: 1.6 },
  { token: " banana", logit: -0.5 },
];

export function nextTokenProbs(temperature) {
  const t = Math.max(temperature, 0.05);
  const z = TEMP_CANDIDATES.map((c) => c.logit / t);
  const mx = Math.max(...z);
  const e = z.map((x) => Math.exp(x - mx));
  const sum = e.reduce((a, b) => a + b, 0);
  return TEMP_CANDIDATES.map((c, i) => ({ ...c, p: e[i] / sum }));
}
