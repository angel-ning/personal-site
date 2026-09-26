// ISOM 5260 week 5: a tiny SQL engine over the lecture's Pine Valley tables.
// Shared by <SqlPipelineLab />, <JoinLab />, <GrantLab /> and scripts/lib/mdx-core.mjs (Markdown export).

// ---------- data (slides p.11, p.44, p.47, p.50) ----------
export const CUSTOMER = {
  name: "Customer_T",
  cols: ["CustomerID", "CustomerName", "CustomerCity", "CustomerState"],
  rows: [
    [1, "Contemporary Casuals", "Gainesville", "FL"],
    [2, "Value Furniture", "Plano", "TX"],
    [3, "Home Furnishings", "Albany", "NY"],
    [4, "Eastern Furniture", "Carteret", "NJ"],
    [5, "Impressions", "Sacramento", "CA"],
    [6, "Furniture Gallery", "Boulder", "CO"],
    [7, "Period Furniture", "Seattle", "WA"],
    [8, "California Classics", "Santa Clara", "CA"],
    [9, "M & H Casual Furniture", "Clearwater", "FL"],
    [10, "Seminole Interiors", "Seminole", "FL"],
    [11, "American Euro Lifestyles", "Prospect Park", "NJ"],
    [12, "Battle Creek Furniture", "Battle Creek", "MI"],
    [13, "Heritage Furnishings", "Carlisle", "PA"],
    [14, "Kaneohe Homes", "Kaneohe", "HI"],
    [15, "Mountain Scenes", "Ogden", "UT"],
  ],
};

export const PRODUCT = {
  name: "Product_T",
  cols: ["ProductID", "ProductDescription", "ProductFinish", "ProductStandardPrice", "ProductLineID"],
  rows: [
    [1, "End Table", "Cherry", 175, 1],
    [2, "Coffee Table", "Natural Ash", 200, 2],
    [3, "Computer Desk", "Natural Ash", 375, 2],
    [4, "Entertainment Center", "Natural Maple", 650, 3],
    [5, "Writers Desk", "Cherry", 325, 1],
    [6, "8-Drawer Desk", "White Ash", 750, 2],
    [7, "Dining Table", "Natural Ash", 800, 2],
    [8, "Computer Desk", "Walnut", 250, 3],
  ],
};

// Order → customer mapping as in the LEFT OUTER JOIN result on p.47.
export const ORDER = {
  name: "Order_T",
  cols: ["OrderID", "CustomerID"],
  rows: [
    [1001, 1], [1002, 8], [1003, 15], [1004, 5], [1005, 3],
    [1006, 2], [1007, 11], [1008, 12], [1009, 4], [1010, 1],
  ],
};

export const EMPLOYEE = {
  name: "Employee_T",
  cols: ["EmployeeID", "EmployeeName", "EmployeeSupervisor"],
  rows: [
    ["098-23-456", "Sue Miller", null],
    ["107-55-789", "Stan Getz", null],
    ["123-44-347", "Jim Jason", "678-44-546"],
    ["547-33-243", "Bill Blass", null],
    ["678-44-546", "Robert Lewis", null],
  ],
};

export const TABLES = { Customer_T: CUSTOMER, Product_T: PRODUCT };

const toObjs = (rel) => rel.rows.map((r) => Object.fromEntries(rel.cols.map((c, i) => [c, r[i]])));
export const show = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" && !Number.isInteger(v) ? String(Math.round(v * 1000) / 1000) : String(v));

// ---------- conditions ----------
// A condition is ["AND"|"OR", a, b] | ["NOT", a] | [col, op, value]. op: = <> < > <= >= IN LIKE BETWEEN
const lit = (v) => (typeof v === "number" ? String(v) : `'${v}'`);
export function condSql(c) {
  if (c[0] === "NOT") return `NOT ${condSql(c[1])}`;
  if (c[0] === "AND" || c[0] === "OR") {
    const s = `${condSql(c[1])} ${c[0]} ${condSql(c[2])}`;
    return c.paren ? `(${s})` : s;
  }
  const [col, op, v] = c;
  if (op === "IN") return `${col} IN (${v.map(lit).join(", ")})`;
  if (op === "BETWEEN") return `${col} BETWEEN ${v[0]} AND ${v[1]}`;
  return `${col} ${op} ${lit(v)}`;
}

function likeToRegex(p) {
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${esc}$`);
}

export function evalCond(c, row) {
  if (c[0] === "NOT") return !evalCond(c[1], row);
  if (c[0] === "AND") return evalCond(c[1], row) && evalCond(c[2], row);
  if (c[0] === "OR") return evalCond(c[1], row) || evalCond(c[2], row);
  const [col, op, v] = c;
  const x = row[col];
  if (x === null || x === undefined) return false; // comparisons with NULL are never true
  switch (op) {
    case "=": return x === v;
    case "<>": return x !== v;
    case "<": return x < v;
    case ">": return x > v;
    case "<=": return x <= v;
    case ">=": return x >= v;
    case "IN": return v.includes(x);
    case "BETWEEN": return x >= v[0] && x <= v[1];
    case "LIKE": return likeToRegex(v).test(String(x));
    default: return false;
  }
}

// Build a condition with explicit parentheses (the "paren" flag only affects how it is printed).
const paren = (c) => Object.assign(c, { paren: true });

// ---------- lab options ----------
// SELECT items: { id, col } | { id, agg, col, alias? } | { id, expr: [col, factor], alias? }
export const SELECT_ITEMS = {
  Customer_T: [
    { id: "CustomerID", col: "CustomerID" },
    { id: "CustomerName", col: "CustomerName" },
    { id: "CustomerCity", col: "CustomerCity" },
    { id: "CustomerState", col: "CustomerState" },
    { id: "COUNT(*)", agg: "COUNT", col: "*" },
    { id: "COUNT(DISTINCT CustomerCity)", agg: "COUNT", col: "CustomerCity", distinct: true },
  ],
  Product_T: [
    { id: "ProductID", col: "ProductID" },
    { id: "ProductDescription", col: "ProductDescription" },
    { id: "ProductFinish", col: "ProductFinish" },
    { id: "ProductStandardPrice", col: "ProductStandardPrice" },
    { id: "ProductLineID", col: "ProductLineID" },
    { id: "ProductStandardPrice * 1.1 AS Plus10Percent", expr: ["ProductStandardPrice", 1.1], alias: "Plus10Percent" },
    { id: "COUNT(*)", agg: "COUNT", col: "*" },
    { id: "AVG(ProductStandardPrice) AS AvgPrice", agg: "AVG", col: "ProductStandardPrice", alias: "AvgPrice" },
    { id: "MIN(ProductStandardPrice)", agg: "MIN", col: "ProductStandardPrice" },
    { id: "MAX(ProductStandardPrice)", agg: "MAX", col: "ProductStandardPrice" },
  ],
};

export const WHERE_OPTIONS = {
  Customer_T: [
    null,
    ["CustomerState", "IN", ["FL", "TX"]],
    ["CustomerState", "=", "CA"],
    ["CustomerState", "<>", "FL"],
    ["CustomerName", "LIKE", "%Furniture%"],
    ["CustomerID", "BETWEEN", [5, 10]],
  ],
  Product_T: [
    null,
    ["ProductStandardPrice", "<", 275],
    ["ProductStandardPrice", "BETWEEN", [200, 300]],
    ["ProductFinish", "<>", "Cherry"],
    ["ProductDescription", "LIKE", "%Desk"],
    ["ProductFinish", "IN", ["Cherry", "Walnut"]],
    // p.31: AND binds tighter than OR …
    ["OR", ["ProductDescription", "LIKE", "%Desk"], ["AND", ["ProductDescription", "LIKE", "%Table"], ["ProductStandardPrice", ">", 300]]],
    // … unless parentheses say otherwise.
    ["AND", paren(["OR", ["ProductDescription", "LIKE", "%Desk"], ["ProductDescription", "LIKE", "%Table"]]), ["ProductStandardPrice", ">", 300]],
  ],
};

export const GROUP_OPTIONS = {
  Customer_T: [[], ["CustomerState"], ["CustomerState", "CustomerCity"]],
  Product_T: [[], ["ProductLineID"], ["ProductFinish"]],
};

// HAVING: [aggItem, op, value]
export const HAVING_OPTIONS = {
  Customer_T: [null, [{ agg: "COUNT", col: "*" }, ">", 1]],
  Product_T: [null, [{ agg: "COUNT", col: "*" }, ">", 1], [{ agg: "AVG", col: "ProductStandardPrice" }, ">", 300]],
};

export const ORDER_OPTIONS = {
  Customer_T: [[], [["CustomerState"], ["CustomerName", "DESC"]], [["CustomerName"]], [["COUNT(*)", "DESC"]]],
  Product_T: [[], [["ProductStandardPrice", "DESC"]], [["ProductDescription"], ["ProductStandardPrice"]], [["AvgPrice", "DESC"]], [["Plus10Percent"]]],
};

export const orderSql = (o) => o.map(([k, d]) => (d ? `${k} ${d}` : k)).join(", ");
const aggText = (a) => `${a.agg}(${a.distinct ? "DISTINCT " : ""}${a.col})`;
const header = (it) => it.alias ?? (it.agg ? aggText(it) : it.expr ? `${it.expr[0]} * ${it.expr[1]}` : it.col);

// Presets = the lecture's own examples plus the two classic errors.
export const SQL_PRESETS = [
  { label: "p.40 WHERE IN + ORDER BY", q: { table: "Customer_T", select: ["CustomerName", "CustomerState"], where: 1, groupBy: 0, having: 0, orderBy: 1 } },
  { label: "p.42 GROUP BY + HAVING", q: { table: "Customer_T", select: ["CustomerState", "COUNT(*)"], where: 0, groupBy: 1, having: 1, orderBy: 0 } },
  { label: "p.37 聚合（无 GROUP BY）", q: { table: "Product_T", select: ["COUNT(*)", "AVG(ProductStandardPrice) AS AvgPrice"], where: 1, groupBy: 0, having: 0, orderBy: 0 } },
  { label: "p.31 没括号", q: { table: "Product_T", select: ["ProductDescription", "ProductStandardPrice"], where: 6, groupBy: 0, having: 0, orderBy: 0 } },
  { label: "p.31 有括号", q: { table: "Product_T", select: ["ProductDescription", "ProductStandardPrice"], where: 7, groupBy: 0, having: 0, orderBy: 0 } },
  { label: "别名用在 ORDER BY", q: { table: "Product_T", select: ["ProductLineID", "COUNT(*)", "AVG(ProductStandardPrice) AS AvgPrice"], where: 0, groupBy: 1, having: 2, orderBy: 3 } },
  { label: "✗ p.41 非分组列", q: { table: "Customer_T", select: ["CustomerState", "CustomerName", "COUNT(*)"], where: 0, groupBy: 1, having: 0, orderBy: 0 } },
  { label: "✗ p.37 聚合混普通列", q: { table: "Product_T", select: ["ProductID", "COUNT(*)"], where: 0, groupBy: 0, having: 0, orderBy: 0 } },
  { label: "DISTINCT", q: { table: "Customer_T", select: ["CustomerState"], distinct: true, where: 0, groupBy: 0, having: 0, orderBy: 0 } },
];

/** The query text in syntactic order. q uses option indexes (see SQL_PRESETS). */
export function sqlText(q) {
  const items = q.select.map((id) => SELECT_ITEMS[q.table].find((s) => s.id === id)).filter(Boolean);
  const where = WHERE_OPTIONS[q.table][q.where ?? 0];
  const group = GROUP_OPTIONS[q.table][q.groupBy ?? 0];
  const having = HAVING_OPTIONS[q.table][q.having ?? 0];
  const order = ORDER_OPTIONS[q.table][q.orderBy ?? 0];
  const lines = [`SELECT ${q.distinct ? "DISTINCT " : ""}${items.length ? items.map((i) => i.id).join(", ") : "*"}`, `  FROM ${q.table}`];
  if (where) lines.push(` WHERE ${condSql(where)}`);
  if (group.length) lines.push(` GROUP BY ${group.join(", ")}`);
  if (having) lines.push(`HAVING ${aggText(having[0])} ${having[1]} ${having[2]}`);
  if (order.length) lines.push(` ORDER BY ${orderSql(order)}`);
  return lines.join("\n") + ";";
}

function aggregate(a, rows) {
  if (a.agg === "COUNT" && a.col === "*") return rows.length;
  let vals = rows.map((r) => r[a.col]).filter((v) => v !== null && v !== undefined); // aggregates skip NULLs
  if (a.distinct) vals = [...new Set(vals)];
  if (a.agg === "COUNT") return vals.length;
  if (!vals.length) return null;
  if (a.agg === "SUM") return vals.reduce((s, v) => s + v, 0);
  if (a.agg === "AVG") return vals.reduce((s, v) => s + v, 0) / vals.length;
  if (a.agg === "MIN") return vals.reduce((m, v) => (v < m ? v : m));
  if (a.agg === "MAX") return vals.reduce((m, v) => (v > m ? v : m));
  return null;
}

const cmp = (x, y) => (x === y ? 0 : x === null ? 1 : y === null ? -1 : x < y ? -1 : 1); // NULLs last (Oracle ASC)

/**
 * Run a query in logical processing order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.
 * Returns { sql, steps: [{ clause, sql, cols, rows, marks, groups, note }], error?, result }.
 * marks[i] is "keep" | "drop" | null; groups[i] is a group index for colouring.
 */
export function runSql(q) {
  const t = TABLES[q.table];
  const items = q.select.map((id) => SELECT_ITEMS[q.table].find((s) => s.id === id)).filter(Boolean);
  const where = WHERE_OPTIONS[q.table][q.where ?? 0];
  const groupBy = GROUP_OPTIONS[q.table][q.groupBy ?? 0];
  const having = HAVING_OPTIONS[q.table][q.having ?? 0];
  const order = ORDER_OPTIONS[q.table][q.orderBy ?? 0];
  const sql = sqlText(q);
  const steps = [];
  const asRows = (objs, cols) => objs.map((o) => cols.map((c) => o[c]));

  // FROM
  const all = toObjs(t);
  steps.push({ clause: "FROM", sql: `FROM ${q.table}`, cols: t.cols, rows: asRows(all, t.cols), marks: all.map(() => null), note: `取出整张表：${all.length} 行。` });

  // WHERE
  let rows = all;
  if (where) {
    const keep = all.map((r) => evalCond(where, r));
    rows = all.filter((_, i) => keep[i]);
    steps.push({ clause: "WHERE", sql: `WHERE ${condSql(where)}`, cols: t.cols, rows: asRows(all, t.cols), marks: keep.map((k) => (k ? "keep" : "drop")), note: `逐行检查条件：留下 ${rows.length} 行，筛掉 ${all.length - rows.length} 行。` });
  }

  const grouped = groupBy.length > 0 || items.some((i) => i.agg) || !!having;
  const fail = (clause, code, msg) => ({ sql, steps, error: { clause, code, msg }, result: null });

  // GROUP BY
  let groups = null;
  if (grouped) {
    const bad = items.filter((i) => !i.agg && !(i.col && groupBy.includes(i.col)));
    if (bad.length) {
      return groupBy.length
        ? fail("SELECT", "ORA-00979", `not a GROUP BY expression —— ${bad.map(header).join(", ")} 既不是分组键也不是聚合值。一个组里有好几行，它该显示哪一行的值？`)
        : fail("SELECT", "ORA-00937", `not a single-group group function —— 有聚合函数就只剩一行汇总，${bad.map(header).join(", ")} 却有 ${rows.length} 个值，没法放进同一行。`);
    }
    const map = new Map();
    for (const r of rows) {
      const k = JSON.stringify(groupBy.map((c) => r[c]));
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    groups = [...map.values()];
    if (!groupBy.length && !groups.length) groups = [[]]; // aggregates over zero rows still return one row
    if (groupBy.length) {
      groups.sort((a, b) => { for (const c of groupBy) { const d = cmp(a[0][c], b[0][c]); if (d) return d; } return 0; });
      const flat = groups.flat();
      steps.push({ clause: "GROUP BY", sql: `GROUP BY ${groupBy.join(", ")}`, cols: t.cols, rows: asRows(flat, t.cols), marks: flat.map(() => null), groups: groups.flatMap((g, gi) => g.map(() => gi)), note: `按 ${groupBy.join(" + ")} 的每种不同取值分成 ${groups.length} 组（同色 = 同一组）。` });
    } else {
      steps.push({ clause: "GROUP BY", sql: "（没有 GROUP BY：整张表算一组）", cols: t.cols, rows: asRows(rows, t.cols), marks: rows.map(() => null), groups: rows.map(() => 0), note: "有聚合函数但没有 GROUP BY → 所有剩下的行当成一个组，最后只出一行。" });
    }
  }

  // HAVING
  if (having) {
    const [a, op, v] = having;
    const cols = [...groupBy, aggText(a)];
    const vals = groups.map((g) => aggregate(a, g));
    const keep = vals.map((x) => evalCond(["x", op, v], { x }));
    steps.push({ clause: "HAVING", sql: `HAVING ${aggText(a)} ${op} ${v}`, cols, rows: groups.map((g, i) => [...groupBy.map((c) => g[0][c]), vals[i]]), marks: keep.map((k) => (k ? "keep" : "drop")), note: `对每个组算 ${aggText(a)}，留下 ${keep.filter(Boolean).length} 组。HAVING 筛的是「组」，WHERE 筛的是「行」。` });
    groups = groups.filter((_, i) => keep[i]);
  }

  // SELECT
  const outItems = items.length ? items : t.cols.map((c) => ({ id: c, col: c }));
  const cols = outItems.map(header);
  const valueOf = (it, src) => (it.agg ? aggregate(it, src.group) : it.expr ? Math.round(src.row[it.expr[0]] * it.expr[1] * 100) / 100 : src.row[it.col]);
  let out = (grouped ? groups.map((g) => ({ row: g[0] ?? {}, group: g })) : rows.map((r) => ({ row: r, group: [r] }))).map((src) => ({ src, vals: outItems.map((it) => valueOf(it, src)) }));
  let note = `只保留 SELECT 列表里的 ${cols.length} 列${grouped ? "，每组变成一行" : ""}；别名在这一步才产生，所以 WHERE 里用不了别名。`;
  if (q.distinct) {
    const seen = new Set();
    const before = out.length;
    out = out.filter((o) => { const k = JSON.stringify(o.vals); if (seen.has(k)) return false; seen.add(k); return true; });
    note += ` DISTINCT 按「整行组合」去重：${before} → ${out.length} 行。`;
  }
  steps.push({ clause: "SELECT", sql: sql.split("\n")[0], cols, rows: out.map((o) => o.vals), marks: out.map(() => null), note });

  // ORDER BY
  if (order.length) {
    const keyFns = [];
    for (const [k, d] of order) {
      const ci = cols.indexOf(k);
      let fn;
      if (ci >= 0) fn = (o) => o.vals[ci];
      else if (!grouped && !q.distinct && t.cols.includes(k)) fn = (o) => o.src.row[k];
      else return fail("ORDER BY", grouped ? "ORA-00979" : "ORA-00904", `${k}：${grouped ? "分组后只能按分组键、聚合值或它们的别名排序" : "这一列/别名不存在"}。`);
      keyFns.push([fn, d === "DESC" ? -1 : 1]);
    }
    out = [...out].sort((a, b) => { for (const [fn, s] of keyFns) { const d = cmp(fn(a), fn(b)); if (d) return s * d; } return 0; });
    steps.push({ clause: "ORDER BY", sql: `ORDER BY ${orderSql(order)}`, cols, rows: out.map((o) => o.vals), marks: out.map(() => null), note: `从左到右依次排序，前面的列相同才看后面的列（默认 ASC）。${order.some(([k]) => outItems.some((i) => i.alias === k)) ? " 这里用到了 SELECT 里起的别名——ORDER BY 在 SELECT 之后执行，所以可以。" : ""}` });
  }

  return { sql, steps, error: null, result: { cols, rows: out.map((o) => o.vals) } };
}

// ---------- joins (p.45–50) ----------
export const JOIN_TYPES = ["INNER", "LEFT", "RIGHT", "FULL"];

/**
 * data: "order" (Customer_T ⋈ Order_T) or "self" (Employee_T E ⋈ Employee_T M).
 * extraOrder adds order 1011 with CustomerID NULL (a legal optional FK) so RIGHT/FULL have something to show.
 * onlyUnmatched keeps rows where the right side is NULL (the "customers with no orders" pattern).
 */
export function runJoin({ data = "order", type = "INNER", extraOrder = false, onlyUnmatched = false }) {
  const self = data === "self";
  const L = self ? EMPLOYEE : CUSTOMER;
  const R = self ? EMPLOYEE : { ...ORDER, rows: extraOrder ? [...ORDER.rows, [1011, null]] : ORDER.rows };
  const lk = self ? "EmployeeSupervisor" : "CustomerID";
  const rk = self ? "EmployeeID" : "CustomerID";
  const lo = toObjs(L);
  const ro = toObjs(R);
  const pick = self
    ? { cols: ["E.EmployeeID", "E.EmployeeName", "E.EmployeeSupervisor", "M.EmployeeID", "M.EmployeeName AS Manager"], l: (r) => [r.EmployeeID, r.EmployeeName, r.EmployeeSupervisor], r: (r) => [r.EmployeeID, r.EmployeeName] }
    : { cols: ["Customer_T.CustomerID", "CustomerName", "OrderID", "Order_T.CustomerID"], l: (r) => [r.CustomerID, r.CustomerName], r: (r) => [r.OrderID, r.CustomerID] };
  const nullL = self ? [null, null, null] : [null, null];
  const nullR = [null, null];
  const rows = [];
  const usedR = new Set();
  for (const a of lo) {
    let hit = false;
    ro.forEach((b, j) => {
      if (a[lk] !== null && a[lk] === b[rk]) { rows.push({ v: [...pick.l(a), ...pick.r(b)], kind: "match" }); usedR.add(j); hit = true; }
    });
    if (!hit && (type === "LEFT" || type === "FULL")) rows.push({ v: [...pick.l(a), ...nullR], kind: "left" });
  }
  if (type === "RIGHT" || type === "FULL") ro.forEach((b, j) => { if (!usedR.has(j)) rows.push({ v: [...nullL, ...pick.r(b)], kind: "right" }); });
  // ORDER BY the left key (NULLs last), then the right key.
  const li = 0;
  const ri = nullL.length;
  rows.sort((x, y) => cmp(x.v[li], y.v[li]) || cmp(x.v[ri], y.v[ri]));
  const shown = onlyUnmatched ? rows.filter((r) => r.v[ri] === null) : rows;
  const on = self ? "E.EmployeeSupervisor = M.EmployeeID" : "Customer_T.CustomerID = Order_T.CustomerID";
  const kw = type === "INNER" ? "JOIN" : `${type} OUTER JOIN`;
  const sql = self
    ? `SELECT E.EmployeeID, E.EmployeeName, M.EmployeeName AS Manager\n  FROM Employee_T E\n  ${kw} Employee_T M\n    ON ${on}${onlyUnmatched ? "\n WHERE M.EmployeeID IS NULL" : ""};`
    : `SELECT Customer_T.CustomerID, CustomerName, OrderID\n  FROM Customer_T\n  ${kw} Order_T\n    ON ${on}${onlyUnmatched ? "\n WHERE OrderID IS NULL" : ""}\n ORDER BY Customer_T.CustomerID;`;
  return {
    sql,
    cols: pick.cols,
    rows: shown,
    splitAt: nullL.length,
    counts: { match: rows.filter((r) => r.kind === "match").length, left: rows.filter((r) => r.kind === "left").length, right: rows.filter((r) => r.kind === "right").length },
    leftName: self ? "Employee_T E" : "Customer_T",
    rightName: self ? "Employee_T M" : "Order_T",
  };
}

// ---------- DCL: GRANT / REVOKE (p.20–23) ----------
export const DCL_USERS = ["manager", "sales_user", "alice", "bob"];
export const DCL_ROLE = "order_clerk_role";
export const DCL_PRIVS = [
  ["Customer_T", "SELECT"],
  ["Order_T", "SELECT"],
  ["Order_T", "INSERT"],
  ["Order_T", "UPDATE"],
];

// Statements the lab can run. by = who issues it (owner = the schema owner / DBA).
export const DCL_STATEMENTS = [
  { id: "g1", by: "owner", sql: "GRANT SELECT ON Customer_T TO sales_user;", op: { kind: "grant", privs: ["SELECT"], obj: "Customer_T", to: ["sales_user"] } },
  { id: "g2", by: "owner", sql: "GRANT SELECT ON Customer_T TO manager WITH GRANT OPTION;", op: { kind: "grant", privs: ["SELECT"], obj: "Customer_T", to: ["manager"], wgo: true } },
  { id: "g3", by: "manager", sql: "GRANT SELECT ON Customer_T TO bob;", op: { kind: "grant", privs: ["SELECT"], obj: "Customer_T", to: ["bob"] } },
  { id: "g4", by: "sales_user", sql: "GRANT SELECT ON Customer_T TO alice;", op: { kind: "grant", privs: ["SELECT"], obj: "Customer_T", to: ["alice"] } },
  { id: "r0", by: "owner", sql: "CREATE ROLE order_clerk_role;", op: { kind: "createRole" } },
  { id: "g5", by: "owner", sql: "GRANT SELECT, INSERT, UPDATE ON Order_T TO order_clerk_role;", op: { kind: "grant", privs: ["SELECT", "INSERT", "UPDATE"], obj: "Order_T", to: [DCL_ROLE] } },
  { id: "g6", by: "owner", sql: "GRANT SELECT ON Order_T TO order_clerk_role WITH GRANT OPTION;", op: { kind: "grant", privs: ["SELECT"], obj: "Order_T", to: [DCL_ROLE], wgo: true } },
  { id: "g7", by: "owner", sql: "GRANT order_clerk_role TO alice, bob;", op: { kind: "grantRole", to: ["alice", "bob"] } },
  { id: "v1", by: "owner", sql: "REVOKE SELECT ON Customer_T FROM manager;", op: { kind: "revoke", privs: ["SELECT"], obj: "Customer_T", from: "manager" } },
  { id: "v2", by: "owner", sql: "REVOKE SELECT ON Customer_T FROM sales_user;", op: { kind: "revoke", privs: ["SELECT"], obj: "Customer_T", from: "sales_user" } },
  { id: "v3", by: "owner", sql: "REVOKE INSERT, UPDATE ON Order_T FROM order_clerk_role;", op: { kind: "revoke", privs: ["INSERT", "UPDATE"], obj: "Order_T", from: DCL_ROLE } },
  { id: "v4", by: "owner", sql: "REVOKE order_clerk_role FROM alice;", op: { kind: "revokeRole", from: "alice" } },
];

export const emptyDcl = () => ({ grants: [], roleExists: false, members: [] });

/** Apply one statement. Returns { state, ok, msg }. Grants are { grantee, priv, obj, grantor, wgo }. */
export function dclStep(state, stmtId) {
  const s = DCL_STATEMENTS.find((x) => x.id === stmtId);
  const op = s.op;
  const st = { grants: [...state.grants], roleExists: state.roleExists, members: [...state.members] };
  const err = (msg) => ({ state, ok: false, msg });
  const needsRole = (names) => names.includes(DCL_ROLE) && !st.roleExists;

  if (op.kind === "createRole") {
    if (st.roleExists) return err("ORA-01921：角色已经存在。");
    st.roleExists = true;
    return { state: st, ok: true, msg: "建好一个空角色：它本身还没有任何权限，要先把权限授给角色，再把角色授给用户。" };
  }
  if (op.kind === "grant") {
    if (needsRole(op.to)) return err("ORA-01917：order_clerk_role 还不存在——先 CREATE ROLE。");
    if (op.wgo && op.to.includes(DCL_ROLE)) return err("ORA-01926：不能把 WITH GRANT OPTION 授给角色（p.21 的 Note）。");
    if (s.by !== "owner") {
      const can = op.privs.every((p) => st.grants.some((g) => g.grantee === s.by && g.priv === p && g.obj === op.obj && g.wgo));
      if (!can) return err(`ORA-01031：insufficient privileges —— ${s.by} 自己${st.grants.some((g) => g.grantee === s.by && g.obj === op.obj) ? "虽然能查，但没有 GRANT OPTION" : "都没有这个权限"}，不能再转授给别人。`);
    }
    for (const to of op.to) for (const p of op.privs) {
      const i = st.grants.findIndex((g) => g.grantee === to && g.priv === p && g.obj === op.obj && g.grantor === s.by);
      const g = { grantee: to, priv: p, obj: op.obj, grantor: s.by, wgo: !!op.wgo };
      if (i >= 0) st.grants[i] = { ...st.grants[i], wgo: st.grants[i].wgo || g.wgo };
      else st.grants.push(g);
    }
    return { state: st, ok: true, msg: `${s.by === "owner" ? "表的所有者" : `${s.by} `}把 ${op.privs.join(", ")} ON ${op.obj} 授给 ${op.to.join(", ")}${op.wgo ? "，并允许对方继续转授（WITH GRANT OPTION）" : ""}。` };
  }
  if (op.kind === "grantRole") {
    if (!st.roleExists) return err("ORA-01919：角色不存在——先 CREATE ROLE。");
    for (const u of op.to) if (!st.members.includes(u)) st.members.push(u);
    return { state: st, ok: true, msg: `${op.to.join("、")} 获得了角色里的全部权限——以后改角色的权限，所有成员一起变。` };
  }
  if (op.kind === "revoke") {
    if (needsRole([op.from])) return err("ORA-01919：角色不存在。");
    const hit = st.grants.filter((g) => g.grantee === op.from && g.obj === op.obj && op.privs.includes(g.priv));
    if (!hit.length) return err(`ORA-01927：${op.from} 没有被授予这个权限，无从撤销。`);
    // Cascade: anything this grantee handed on (thanks to GRANT OPTION) goes too, recursively.
    const removed = [];
    let queue = hit.map((g) => g);
    const drop = new Set(queue);
    while (queue.length) {
      const next = [];
      for (const g of queue) {
        const stillHas = st.grants.some((x) => !drop.has(x) && x.grantee === g.grantee && x.obj === g.obj && x.priv === g.priv && x.wgo);
        if (stillHas) continue;
        for (const x of st.grants) if (!drop.has(x) && x.grantor === g.grantee && x.obj === g.obj && x.priv === g.priv) { drop.add(x); next.push(x); }
      }
      queue = next;
    }
    for (const g of drop) if (g.grantee !== op.from) removed.push(`${g.grantee} 的 ${g.priv} ON ${g.obj}（由 ${g.grantor} 转授）`);
    st.grants = st.grants.filter((g) => !drop.has(g));
    return { state: st, ok: true, msg: `撤销 ${op.from} 的 ${op.privs.join(", ")} ON ${op.obj}。${removed.length ? `连锁撤销：${removed.join("；")}。` : ""}` };
  }
  if (op.kind === "revokeRole") {
    if (!st.members.includes(op.from)) return err(`ORA-01951：${op.from} 没有这个角色。`);
    st.members = st.members.filter((u) => u !== op.from);
    return { state: st, ok: true, msg: `${op.from} 失去角色带来的所有权限（直接授给该用户的权限不受影响）。` };
  }
  return err("未知语句");
}

/** Effective privilege of a grantee (user or role) on obj/priv: { direct, viaRole, wgo }. */
export function dclCell(state, who, obj, priv) {
  const direct = state.grants.filter((g) => g.grantee === who && g.obj === obj && g.priv === priv);
  const viaRole = who !== DCL_ROLE && state.members.includes(who) && state.grants.some((g) => g.grantee === DCL_ROLE && g.obj === obj && g.priv === priv);
  return { direct: direct.length > 0, viaRole, wgo: direct.some((g) => g.wgo), from: direct.map((g) => g.grantor) };
}

export const DCL_SCRIPT = ["g1", "g2", "g3", "g4", "r0", "g5", "g6", "g7", "v1", "v4", "v3"];
