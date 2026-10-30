// ISOM 5160 Day 1 slide 18: object.property vs object.method() on a Python str.
// Pure functions that mimic what the Python REPL prints, so the page and the README export agree.

export const PY_DEFAULT_TEXT = "  URGENT: Verify your password at http://bit.ly/x  ";

// Python's repr() for the values these demos can produce.
export function pyRepr(v) {
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(", ")}]`;
  if (typeof v === "string") {
    const q = v.includes("'") && !v.includes('"') ? '"' : "'";
    const body = v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
    return q + (q === "'" ? body.replace(/'/g, "\\'") : body) + q;
  }
  return String(v);
}

const pySplit = (s, sep) => (sep === undefined ? s.split(/\s+/).filter(Boolean) : s.split(sep));
const pyStrip = (s) => s.replace(/^\s+|\s+$/g, "");
const pyTitle = (s) => s.toLowerCase().replace(/(^|[^a-zA-Z])([a-z])/g, (_m, p, c) => p + c.toUpperCase());

// kind: "func" = built-in function, "method" = called on the object with ().
export const PY_OPS = [
  { id: "len", kind: "func", code: "len(s)", run: (s) => [...s].length, note: "str 的「长度」是它的状态，但 Python 用内置函数 len() 取，不是 s.length" },
  { id: "upper", kind: "method", code: "s.upper()", run: (s) => s.toUpperCase(), note: "全部大写，返回新字符串" },
  { id: "lower", kind: "method", code: "s.lower()", run: (s) => s.toLowerCase(), note: "全部小写：比较关键词前常先 lower()，大小写就不影响匹配" },
  { id: "strip", kind: "method", code: "s.strip()", run: (s) => pyStrip(s), note: "去掉两头的空白（中间的不动），清洗用户输入的第一步" },
  { id: "split", kind: "method", code: "s.split()", run: (s) => pySplit(s), note: "不给参数：按任意空白切开，返回 list" },
  { id: "split-colon", kind: "method", code: "s.split(\":\")", run: (s) => pySplit(s, ":"), note: "给了分隔符：严格按它切，两头的空白会留着" },
  { id: "replace", kind: "method", code: "s.replace(\"http\", \"hxxp\")", run: (s) => s.split("http").join("hxxp"), note: "替换全部出现的位置；安全报告里把链接改成 hxxp 让它不能点（defang）" },
  { id: "count", kind: "method", code: "s.lower().count(\"password\")", run: (s) => s.toLowerCase().split("password").length - 1, note: "方法可以串起来：先 lower() 得到新字符串，再在新字符串上 count()" },
  { id: "startswith", kind: "method", code: "s.strip().startswith(\"URGENT\")", run: (s) => pyStrip(s).startsWith("URGENT"), note: "返回 True / False，可以直接放进 if" },
  { id: "find", kind: "method", code: "s.find(\"http\")", run: (s) => s.indexOf("http"), note: "第一次出现的位置（从 0 数）；找不到返回 -1" },
  { id: "title", kind: "method", code: "s.title()", run: (s) => pyTitle(s), note: "每个单词首字母大写" },
  { id: "noparen", kind: "bug", code: "s.upper", run: () => "<built-in method upper of str object at 0x10a3f2b70>", raw: true, note: "忘了括号：拿到的是「方法本身」，没有执行。代码不报错，但结果不是你要的——AI 生成的代码里也会有这种错" },
];

export function runPyOp(s, id) {
  const op = PY_OPS.find((o) => o.id === id) ?? PY_OPS[0];
  const value = op.run(s);
  const type = op.raw ? "builtin_function_or_method" : Array.isArray(value) ? "list" : typeof value === "boolean" ? "bool" : typeof value === "number" ? "int" : "str";
  return { op, value, out: op.raw ? value : pyRepr(value), type, unchanged: pyRepr(s) };
}
