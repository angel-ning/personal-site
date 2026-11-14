// ISOM 6200 Lecture 3: data-quality checks on the Slide 11 sales records (2A · quality and integrity).
// The exercise criteria are applied as rules, so every flag can be traced back to the sentence that causes it.

export const DIMENSIONS = [
  { id: "accuracy", label: "Accuracy", zh: "准确", def: "值和真实的对象 / 事件一致" },
  { id: "completeness", label: "Completeness", zh: "完整", def: "要求的记录和字段都在" },
  { id: "consistency", label: "Consistency", zh: "一致", def: "相关的值和含义在字段、来源之间一致" },
  { id: "timeliness", label: "Timeliness", zh: "及时", def: "需要时数据是最新、可用的" },
  { id: "validity", label: "Validity", zh: "有效", def: "值符合规定的格式、范围或输入规则" },
  { id: "uniqueness", label: "Uniqueness", zh: "唯一", def: "选定的键只对应一条记录，没有多余的重复" },
];

export const CRITERIA = [
  "所有字段都必填。",
  "每张 ticket 对应一个事件；同一个顾客可以买好几次。",
  "只要香港的销售，币种 HKD；HK 和 Hong Kong 是同一个地区。",
  "日期必须是合法的 ISO 格式（YYYY-MM-DD）；销售额必须为正数；销售后两天内装载 (loaded)。",
  "参照证据：T107 已批准的收据金额是 HKD 1,200。",
];

/** Slide 11 rows, as of 12 October 2026. */
export const QUALITY_ROWS = [
  { ticket: "T101", customer: "C01", region: "Hong Kong", sale: "2026-10-09", amount: 1200, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T102", customer: "C02", region: "HK", sale: "2026-10-09", amount: 900, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T103", customer: "C03", region: "", sale: "2026-10-09", amount: 600, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T104", customer: "C04", region: "Hong Kong", sale: "2026-99-09", amount: 500, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T105", customer: "C01", region: "Hong Kong", sale: "2026-10-09", amount: 300, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T105", customer: "C01", region: "Hong Kong", sale: "2026-10-09", amount: 300, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T107", customer: "C07", region: "Hong Kong", sale: "2026-10-09", amount: 12000, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T108", customer: "C08", region: "Hong Kong", sale: "2026-10-09", amount: 100, currency: "HKD", loaded: "2026-08-01" },
  { ticket: "T109", customer: "C09", region: "Hong Kong", sale: "2026-10-09", amount: -50, currency: "HKD", loaded: "2026-10-10" },
  { ticket: "T110", customer: "C10", region: "Hong Kong", sale: "2026-10-09", amount: 100, currency: "USD", loaded: "2026-10-10" },
];

/** Receipts the exercise supplies as reference evidence. */
export const RECEIPTS = { T107: 1200 };

const REGION_ALIASES = { "hong kong": "Hong Kong", hk: "Hong Kong" };

function isIsoDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const fmtAmount = (n) => (n < 0 ? `−${Math.abs(n).toLocaleString("en-US")}` : n.toLocaleString("en-US"));

/**
 * Apply the Slide 11 criteria to every row.
 * Each issue: { dim, why, fix, needs } where needs = "rule" (the criteria already settle the fix),
 * "evidence" (go back to the source) or "decision" (a business owner must decide before training).
 */
export function checkRows(rows = QUALITY_ROWS) {
  const seen = new Map();
  return rows.map((r, i) => {
    const issues = [];
    const key = r.ticket;
    if (seen.has(key)) {
      const first = rows[seen.get(key)];
      const same = ["customer", "region", "sale", "amount", "currency", "loaded"].every((f) => first[f] === r[f]);
      issues.push({
        dim: "uniqueness",
        why: `ticket ${key} 已经出现过（第 ${seen.get(key) + 1} 行）${same ? "，而且每个字段都一样" : ""}；每张 ticket 只对应一个事件。`,
        fix: same ? "核对源系统确认是重复装载，再删掉多出来的一行" : "两行内容不同：先查哪一条是真的",
        needs: "evidence",
      });
    } else seen.set(key, i);

    const missing = ["customer", "region", "sale", "currency", "loaded"].filter((f) => !String(r[f] ?? "").trim());
    if (missing.length || r.amount == null)
      issues.push({ dim: "completeness", why: `必填字段为空：${missing.join("、") || "amount"}。`, fix: "回源系统补；不要按「大概是香港」去猜", needs: "evidence" });

    const region = REGION_ALIASES[String(r.region).toLowerCase()];
    if (r.region && region && r.region !== region)
      issues.push({ dim: "consistency", why: `写成「${r.region}」，别的行写「${region}」；准则说两者是同一个地区。`, fix: "按准则统一成同一个标签，记在准备日志里", needs: "rule" });
    if (r.currency && r.currency !== "HKD")
      issues.push({ dim: "consistency", why: `币种是 ${r.currency}，准则要求 HKD；和其他行的计量单位不一致。`, fix: "按哪天、哪个汇率换算，还是直接排除？要业务决定并记录", needs: "decision" });

    if (!isIsoDate(r.sale))
      issues.push({ dim: "validity", why: `销售日期「${r.sale}」不是合法日期（没有第 ${r.sale.split("-")[1]} 个月）。`, fix: "回源系统查真实日期；不能自己改成 10 月", needs: "evidence" });
    if (r.amount != null && r.amount <= 0)
      issues.push({ dim: "validity", why: `金额 ${fmtAmount(r.amount)} 违反「销售额必须为正数」。`, fix: "可能是退款或冲销：它算不算「销售」、要不要留，是业务决定", needs: "decision" });

    if (isIsoDate(r.sale) && isIsoDate(r.loaded)) {
      const lag = days(r.sale, r.loaded);
      if (lag < 0 || lag > 2)
        issues.push({
          dim: "timeliness",
          why: lag < 0 ? `装载日期 ${r.loaded} 比销售日期早 ${-lag} 天，违反「两天内装载」，而且逻辑上不可能。` : `销售后 ${lag} 天才装载，超过两天。`,
          fix: lag < 0 ? "日期本身可能也录错了（准确性问题）：回源系统和装载日志核对" : "查装载流程为什么延迟",
          needs: "evidence",
        });
    }

    const receipt = RECEIPTS[r.ticket];
    if (receipt != null && receipt !== r.amount)
      issues.push({ dim: "accuracy", why: `批准的收据是 HKD ${fmtAmount(receipt)}，记录是 ${fmtAmount(r.amount)}：格式合法，但值不对（多了一个 0）。`, fix: `按收据更正为 ${fmtAmount(receipt)}，记录更正理由和证据`, needs: "rule" });

    const sameCustomer = rows.findIndex((o, k) => k !== i && o.customer === r.customer && o.ticket !== r.ticket);
    const trap = !issues.length && sameCustomer >= 0 ? `顾客 ${r.customer} 也出现在 ${rows[sameCustomer].ticket}——但准则说同一个顾客可以买好几次，这不是重复。` : null;
    return { ...r, row: i + 1, issues, trap };
  });
}

export const NEEDS_LABEL = { rule: "准则已能决定怎么改", evidence: "要回源找证据", decision: "要业务决定" };

/** Compare a learner's ticked dimensions with the computed ones. */
export function gradeRow(checked, picked) {
  const want = new Set(checked.issues.map((x) => x.dim));
  const got = new Set(picked);
  const missed = [...want].filter((d) => !got.has(d));
  const extra = [...got].filter((d) => !want.has(d));
  return { ok: !missed.length && !extra.length, missed, extra };
}

export const dimLabel = (id) => {
  const d = DIMENSIONS.find((x) => x.id === id);
  return d ? `${d.label}（${d.zh}）` : id;
};
