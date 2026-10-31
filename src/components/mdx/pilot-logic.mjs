// ISOM 6200 Lecture 1: what does a pilot result actually support? (L1-A3 pilot extract, Slide 35 "98% accurate—on what?")

/** L1-A3 breakdown of the same 40 routine test requests. */
export const PILOT_ROWS = [
  { id: "plain", label: "Straightforward fare conditions", zh: "简单的票价条件", n: 24, ok: 24 },
  { id: "date", label: "Date-bound eligibility questions", zh: "跟日期有关的资格问题", n: 10, ok: 8, note: "两个错误都在这里：说成 14 天，v3 规定 7 天" },
  { id: "reworded", label: "Reworded routine questions", zh: "换个说法的常规问题", n: 6, ok: 6 },
];

/** Uses the sponsor wants, none of which appear in the 40 requests. */
export const PILOT_UNTESTED = [
  { id: "partial", label: "Partially used fares", zh: "部分已使用的票" },
  { id: "exception", label: "Exception requests", zh: "例外申请" },
  { id: "dispute", label: "Disputed answers", zh: "有争议的回答" },
  { id: "update", label: "Policy-update runs", zh: "政策更新后再跑" },
  { id: "handoff", label: "End-to-end agent receipt (handoff)", zh: "转人工后坐席真的收到并处理" },
  { id: "language", label: "Non-English / other months", zh: "非英语 / 其他月份的请求" },
];

/** Wilson score interval for k successes out of n (95% by default). */
export function wilson(k, n, z = 1.96) {
  if (!n) return { lo: 0, hi: 0 };
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { lo: Math.max(0, c - h), hi: Math.min(1, c + h) };
}

export const pct = (x) => `${+(x * 100).toFixed(1)}%`;

/** @param {string[]} included ids of PILOT_ROWS to count */
export function pilotSummary(included = PILOT_ROWS.map((r) => r.id)) {
  const rows = PILOT_ROWS.map((r) => ({ ...r, rate: r.ok / r.n, ci: wilson(r.ok, r.n), on: included.includes(r.id) }));
  const on = rows.filter((r) => r.on);
  const n = on.reduce((s, r) => s + r.n, 0);
  const ok = on.reduce((s, r) => s + r.ok, 0);
  const worst = on.length ? on.reduce((a, b) => (b.rate < a.rate ? b : a)) : null;
  return { rows, n, ok, rate: n ? ok / n : 0, ci: wilson(ok, n), worst };
}

/** Zero errors in n tests still leaves an upper bound on the error rate ("rule of three" ≈ 3/n). */
export function zeroErrorBound(n) {
  return n ? 1 - wilson(n, n).lo : 1;
}
