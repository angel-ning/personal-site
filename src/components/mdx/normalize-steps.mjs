// Step-by-step normalization (raw → 1NF → 2NF → 3NF) on sample data, for <NormalizeWalkthrough />
// and scripts/lib/mdx-core.mjs. Follows the lecture's conversion rules (p.33, p.37, p.39) literally:
//   1NF: spread multivalued cells into their own rows, repeat common values.
//   2NF: for each determinant in a partial dependency, new table keyed by it; move the attributes
//        that depend only on it (including those that hang off them transitively).
//   3NF: for each non-key determinant, new table keyed by it; move its dependents;
//        keep the determinant in the original table as a foreign key.
import { classifyFd } from "./normalization-logic.mjs";

export const WALK_SCENARIOS = [
  {
    id: "enroll",
    label: "选课表（三步都要做）",
    table: "STUDENT ENROLLMENT",
    note: "一张「学生 + 导师 + 选课」混在一起的登记表，一个学生一行，选的课挤在同一格里。",
    cols: ["StudentID", "StudentName", "AdvisorID", "AdvisorName", "CourseID", "CourseTitle", "Grade"],
    multi: ["CourseID", "CourseTitle", "Grade"],
    rows: [
      ["S1", "Amy", "A7", "Dr. Lee", ["ISOM5260", "ISOM5180", "ISOM5070"], ["Database", "Networks", "Cyber Risk"], ["A", "B+", "A-"]],
      ["S2", "Ben", "A7", "Dr. Lee", ["ISOM5260", "ISOM5070"], ["Database", "Cyber Risk"], ["B", "A"]],
      ["S3", "Cara", "A9", "Dr. Wong", ["ISOM5180"], ["Networks"], ["A"]],
    ],
    pk: ["StudentID", "CourseID"],
    pkWhy: "摊开以后同一个 StudentID 出现好几行，单靠 StudentID 已经不唯一；要 StudentID + CourseID 才能锁定一行。",
    fds: [
      { det: ["StudentID"], dep: ["StudentName", "AdvisorID"] },
      { det: ["CourseID"], dep: ["CourseTitle"] },
      { det: ["StudentID", "CourseID"], dep: ["Grade"] },
      { det: ["AdvisorID"], dep: ["AdvisorName"] },
    ],
    names: { StudentID: "STUDENT", CourseID: "COURSE", AdvisorID: "ADVISOR", rest: "ENROLLMENT" },
  },
  {
    id: "emp",
    label: "EMP COURSE（课件 p.30–37）",
    table: "EMP COURSE",
    note: "课件的员工培训表：一个员工一行，上过的课和完成日期挤在同一格里（p.33 左表）。",
    cols: ["EmpID", "Name", "Department", "Salary", "Course", "DateCompleted"],
    multi: ["Course", "DateCompleted"],
    rows: [
      [100, "Peter Lau", "IT", 35000, ["C++", "Java"], ["21-JAN-2024", "26-MAR-2024"]],
      [110, "John Chan", "MARK", 33000, ["CSR", "CRM-1"], ["23-DEC-2024", "4-MAY-2024"]],
      [150, "Queenie Lee", "ACCT", 20000, ["Tax Acct", "Costing"], ["20-MAY-2024", "20-AUG-2024"]],
    ],
    pk: ["EmpID", "Course"],
    pkWhy: "摊开后 EmpID 重复出现，要 EmpID + Course 才能唯一确定一行（p.35）。",
    fds: [
      { det: ["EmpID"], dep: ["Name", "Department", "Salary"] },
      { det: ["EmpID", "Course"], dep: ["DateCompleted"] },
    ],
    names: { EmpID: "EMPLOYEE", rest: "EMPCOURSE" },
  },
  {
    id: "order",
    label: "CUSTOMERORDER（课件 p.38–39）",
    table: "CUSTOMERORDER",
    note: "课件的订单表：每格都是单值，主键是单个属性 OrderID。",
    cols: ["OrderID", "OrderDate", "CustomerID", "CustomerName", "CustomerAddress"],
    multi: [],
    rows: [
      [1001, "21-OCT-2024", "C1", "Contemporary Casuals", "Gainesville"],
      [1002, "21-OCT-2024", "C8", "California Classics", "Santa Clara"],
      [1003, "22-OCT-2024", "C1", "Contemporary Casuals", "Gainesville"],
      [1004, "22-OCT-2024", "C1", "Contemporary Casuals", "Gainesville"],
    ],
    pk: ["OrderID"],
    pkWhy: "没有多值属性，原表已经是 1NF；OrderID 本身唯一。",
    fds: [
      { det: ["OrderID"], dep: ["OrderDate", "CustomerID"] },
      { det: ["CustomerID"], dep: ["CustomerName", "CustomerAddress"] },
    ],
    names: { CustomerID: "CUSTOMER", rest: "ORDER" },
  },
];

const key = (r, idx) => JSON.stringify(idx.map((i) => r[i]));

/** Distinct projection of rows (array of arrays over `cols`) onto `sub`. */
function project(cols, rows, sub) {
  const idx = sub.map((c) => cols.indexOf(c));
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = key(r, idx);
    if (!seen.has(k)) { seen.add(k); out.push(idx.map((i) => r[i])); }
  }
  return out;
}

/**
 * Redundant cells in a table: for every FD whose determinant is not the table's whole key
 * (and fits in the table), each repeated determinant value re-stores its dependents.
 * Returns { count, cells: Set of "row:col" } for highlighting.
 */
export function redundancy(t, fds) {
  const cells = new Set();
  for (const fd of fds) {
    if (!fd.det.every((c) => t.cols.includes(c))) continue;
    if (fd.det.length === t.pk.length && fd.det.every((c) => t.pk.includes(c))) continue;
    const deps = fd.dep.filter((c) => t.cols.includes(c));
    if (!deps.length) continue;
    const di = fd.det.map((c) => t.cols.indexOf(c));
    const first = new Map();
    t.rows.forEach((r, ri) => {
      const k = key(r, di);
      if (!first.has(k)) { first.set(k, ri); return; }
      for (const c of deps) cells.add(`${ri}:${t.cols.indexOf(c)}`);
    });
  }
  return { count: cells.size, cells };
}

// Attributes that depend on `start` directly or through non-key determinants inside `pool`.
function closure(start, fds, pool) {
  const got = new Set(start.dep.filter((c) => pool.includes(c)));
  let grew = true;
  while (grew) {
    grew = false;
    for (const fd of fds) {
      if (fd === start || !fd.det.every((c) => got.has(c))) continue;
      for (const c of fd.dep) if (pool.includes(c) && !got.has(c)) { got.add(c); grew = true; }
    }
  }
  return [...got];
}

const tableName = (s, det) => s.names[det.join("+")] ?? det.join("_").toUpperCase();

/**
 * Returns the steps: [{ id, title, rule, tables: [{ name, cols, pk, fk: [{col, ref}], rows, moved? }], fds?, notes: [] }].
 */
export function normalizeSteps(s) {
  const steps = [];
  const raw = { name: s.table, cols: s.cols, pk: [], fk: [], rows: s.rows };
  steps.push({ id: "raw", title: "原始表", rule: s.note, tables: [raw], notes: s.multi.length ? [`${s.multi.join("、")} 一格里有多个值 → 不是 relation，连 1NF 都不是。`] : ["每格都是单值。"] });

  // 1NF
  const flat = [];
  for (const r of s.rows) {
    const n = Math.max(1, ...r.map((v) => (Array.isArray(v) ? v.length : 1)));
    for (let i = 0; i < n; i++) flat.push(r.map((v) => (Array.isArray(v) ? v[i] : v)));
  }
  const t1 = { name: s.table, cols: s.cols, pk: s.pk, fk: [], rows: flat };
  steps.push({
    id: "1nf",
    title: "1NF：去掉多值属性",
    rule: s.multi.length ? "把多值摊开成多行，公共值（学号、姓名……）每行重复填（p.33）。然后重新找主键。" : "原表没有多值属性，本来就是 1NF，这一步什么都不用做。",
    tables: [t1],
    notes: [`主键 = ${s.pk.join(" + ")}：${s.pkWhy}`],
  });

  // FD classification
  const classified = s.fds.map((fd) => ({ ...fd, kind: classifyFd(s.pk, fd.det) }));
  steps.push({ id: "fd", title: "找函数依赖并分类", rule: "对照主键看每条依赖的决定因素（箭头左边）：是整个主键 → Full；是主键的一部分 → Partial；不是主键（非键属性）→ Transitive。", tables: [t1], fds: classified, notes: [] });

  // 2NF
  let tables = [];
  let restCols = [...s.cols];
  const notes2 = [];
  for (const fd of classified.filter((f) => f.kind === "partial")) {
    const moved = closure(fd, s.fds, restCols).filter((c) => !s.pk.includes(c));
    const cols = [...fd.det, ...moved];
    tables.push({ name: tableName(s, fd.det), cols, pk: fd.det, fk: [], rows: project(s.cols, flat, cols), moved });
    restCols = restCols.filter((c) => !moved.includes(c));
    const extra = moved.filter((c) => !fd.dep.includes(c));
    notes2.push(`${fd.det.join(", ")} 是主键的一部分 → 新表 ${tableName(s, fd.det)}，搬走 ${moved.join("、")}${extra.length ? `（${extra.join("、")} 通过 ${fd.dep.filter((c) => s.fds.some((f) => f.det.includes(c) && f.dep.some((d) => extra.includes(d)))).join("、")} 间接依赖 ${fd.det.join(", ")}，也只跟它有关，一起搬）` : ""}。`);
  }
  if (tables.length) {
    const fk = tables.map((t) => t.pk).flat().filter((c) => s.pk.includes(c)).map((c) => ({ col: c, ref: tables.find((t) => t.pk.includes(c)).name }));
    tables.push({ name: s.names.rest, cols: restCols, pk: s.pk, fk, rows: project(s.cols, flat, restCols) });
    notes2.push(`原表只剩主键 + 真正依赖整个主键的属性，改名 ${s.names.rest}；主键里的每一部分同时是指向新表的外键。`);
  } else {
    tables = [{ ...t1, name: s.table }];
    notes2.push(s.pk.length === 1 ? "主键只有一个属性 → 不可能有部分依赖 → 1NF 自动就是 2NF。" : "没有部分依赖，已经是 2NF。");
  }
  steps.push({ id: "2nf", title: "2NF：消除部分依赖", rule: "每个「主键的一部分」当决定因素 → 建新表、用它当主键，把只依赖它的属性搬过去（p.37）。", tables, notes: notes2 });

  // 3NF
  const notes3 = [];
  const out = [];
  for (const t of tables) {
    let cur = t.name === s.table ? { ...t, name: s.names.rest } : t;
    const added = [];
    const tr = s.fds.filter((fd) => fd.det.every((c) => cur.cols.includes(c)) && !fd.det.some((c) => cur.pk.includes(c)) && fd.dep.some((c) => cur.cols.includes(c)));
    for (const fd of tr) {
      const moved = closure(fd, s.fds, cur.cols).filter((c) => !cur.pk.includes(c) && !fd.det.includes(c));
      const cols = [...fd.det, ...moved];
      const name = tableName(s, fd.det);
      added.push({ name, cols, pk: fd.det, fk: [], rows: project(s.cols, flat, cols) });
      const keep = cur.cols.filter((c) => !moved.includes(c));
      cur = { ...cur, cols: keep, fk: [...cur.fk, ...fd.det.map((c) => ({ col: c, ref: name }))], rows: project(s.cols, flat, keep) };
      notes3.push(`${t.name} 里 ${fd.det.join(", ")} 不是主键却决定 ${moved.join("、")} → 新表 ${name}；${cur.name === t.name ? `${t.name} ` : `原表（改名 ${cur.name}）`}保留 ${fd.det.join(", ")} 作外键。`);
    }
    out.push(cur, ...added);
  }
  if (!notes3.length) notes3.push("每张表里都没有「非键 → 非键」的依赖，2NF 就已经是 3NF。");
  steps.push({ id: "3nf", title: "3NF：消除传递依赖", rule: "每个「非键决定因素」→ 建新表、用它当主键，搬走依赖它的属性；原表留下它当外键（p.39）。", tables: out, notes: notes3 });

  // Redundancy counts per step (raw counts as its 1NF form for comparison)
  for (const st of steps) {
    const tabs = st.id === "raw" ? [] : st.tables;
    st.redundant = tabs.reduce((n, t) => n + redundancy(t, s.fds).count, 0);
    st.cells = tabs.reduce((n, t) => n + t.rows.length * t.cols.length, 0);
  }
  return steps;
}
