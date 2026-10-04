// ISOM 5260 SQL practice book: exercises meant to be run in SQL Developer (real Oracle),
// with the expected result to compare against. Data lives in data/sql-practice.json
// (generated from the teacher's oracle demo.sql and lab6_init.sql).
// Shared by <SqlExercise />, <SqlTables />, <SqlScript /> and scripts/lib/mdx-core.mjs.

export const PREVIEW_ROWS = 10;

export function findExercise(data, id) {
  const ex = data.exercises.find((e) => e.id === id);
  if (!ex) throw new Error(`unknown SQL exercise "${id}"`);
  return ex;
}

// SQL Developer shows NULL as "(null)" in the result grid.
export const cellText = (v) => (v === null || v === undefined ? "(null)" : String(v));

// Tiny inline Markdown for exercise text: `code` and **bold**.
export function parseInline(text) {
  const out = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    out.push(m[1] !== undefined ? { t: "code", v: m[1] } : { t: "b", v: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

export const levelDots = (n) => "●".repeat(n) + "○".repeat(3 - n);

// One-line summary of what SQL Developer should show for a step.
export function expectSummary(x) {
  switch (x.kind) {
    case "rows":
      return x.rows.length === 0 ? "0 行（只有表头，没有数据）" : `${x.rows.length} 行`;
    case "count":
      return `${x.n} 行（只看行数）`;
    case "error":
      return `报错 ${x.code}`;
    case "msg":
      return x.text;
    default:
      return "";
  }
}
