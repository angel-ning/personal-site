// ISOM 6200 Lecture 5 (AAIA 3A–3B): Harbourleaf Retail audit planning, sampling, routing outcomes and claim evidence.
// Case figures come from the Lecture 5 pre-class deck. Per-stratum error rates and the claim → evidence mapping are
// teaching assumptions, marked as such on the page.
import { pct, wilson } from "./pilot-logic.mjs";

export { pct, wilson };

// ---------- Slide 19–20: the population and three ways to select ----------

/** Slide 19: 1,000 request events; register and export totals match. */
export const STRATA = [
  { id: "b-en", period: "before", lang: "English", zh: "改前 · 英语", n: 360 },
  { id: "b-yue", period: "before", lang: "Cantonese", zh: "改前 · 粤语", n: 120 },
  { id: "b-cmn", period: "before", lang: "Mandarin", zh: "改前 · 普通话", n: 120 },
  { id: "a-en", period: "after", lang: "English", zh: "改后 · 英语", n: 240 },
  { id: "a-yue", period: "after", lang: "Cantonese", zh: "改后 · 粤语", n: 80 },
  { id: "a-cmn", period: "after", lang: "Mandarin", zh: "改后 · 普通话", n: 80 },
];

/** Slide 19 "Outside this event list". */
export const OUTSIDE_LIST = [
  { label: "Unrecorded personal-tool use", zh: "没被记录的个人工具使用：不知道漏了多少" },
  { label: "Synthetic tests", zh: "合成测试：是设计出来的输入，不是真实事件" },
];

/** ASSUMPTION (not in the deck): translation error rates per stratum, used only to show what each design can estimate. */
export const ASSUMED_ERROR = { "b-en": 0.02, "b-yue": 0.05, "b-cmn": 0.04, "a-en": 0.02, "a-yue": 0.15, "a-cmn": 0.05 };

export const METHODS = [
  { id: "random", label: "Random sampling", zh: "简单随机：1,000 条里每条被抽中的机会相同，不放回" },
  { id: "stratified", label: "Stratified sampling", zh: "分层随机：6 组（语言 × 改前 / 改后）每组各抽一样多，组内随机" },
  { id: "judgmental", label: "Judgmental sampling", zh: "判断抽样：故意挑已知高风险的记录（改后粤语、混合语言、例外）" },
];

// xorshift32 with a fixed seed: the same sample on server and client (no hydration mismatch).
function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/** The 1,000 events. Within each stratum, which records are translation errors is fixed (assumed rates). */
export function population() {
  const out = [];
  for (const s of STRATA) {
    const bad = Math.round(s.n * ASSUMED_ERROR[s.id]);
    const r = rng(s.n * 7919 + s.id.length * 104729 + s.id.charCodeAt(2));
    const flags = Array.from({ length: s.n }, (_, i) => i < bad);
    for (let i = flags.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [flags[i], flags[j]] = [flags[j], flags[i]];
    }
    flags.forEach((err, i) => out.push({ id: `${s.id}-${i + 1}`, stratum: s.id, err, risky: s.id === "a-yue" || (i % 25 === 0 && s.period === "after") }));
  }
  return out;
}

function drawFrom(list, k, r) {
  const a = list.slice();
  const m = Math.min(k, a.length);
  for (let i = 0; i < m; i++) {
    const j = i + Math.floor(r() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, m);
}

/**
 * @param {{ method: string, size: number, seed?: number }} p
 * size = total sample size (stratified splits it evenly across the 6 strata).
 */
export function drawSample({ method, size, seed = 1 }) {
  const pop = population();
  const r = rng(seed * 2654435761 + size);
  const N = pop.length;
  let picked = [];
  if (method === "random") picked = drawFrom(pop, size, r);
  else if (method === "stratified") {
    const per = Math.max(1, Math.floor(size / STRATA.length));
    for (const s of STRATA) picked.push(...drawFrom(pop.filter((x) => x.stratum === s.id), per, r));
  } else {
    // judgmental: known risk conditions first, chosen on purpose (not at random)
    const risky = pop.filter((x) => x.risky);
    picked = risky.slice(0, Math.min(size, risky.length));
  }
  const rows = STRATA.map((s) => {
    const inS = picked.filter((x) => x.stratum === s.id);
    const errs = inS.filter((x) => x.err).length;
    const trueErr = pop.filter((x) => x.stratum === s.id && x.err).length;
    return {
      ...s,
      k: inS.length,
      errs,
      // random: every record has the same known chance (size / 1,000), so each sampled record stands for N / size;
      // stratified: the chance is set per stratum (k / N_h), so weights differ by stratum.
      chance: method === "judgmental" ? null : method === "random" ? size / N : inS.length / s.n,
      weight: method === "judgmental" || !inS.length ? null : method === "random" ? N / size : s.n / inS.length,
      obsRate: inS.length ? errs / inS.length : null,
      trueRate: trueErr / s.n,
    };
  });
  const n = picked.length;
  const errs = picked.filter((x) => x.err).length;
  const trueOverall = pop.filter((x) => x.err).length / N;
  const unweighted = n ? errs / n : 0;
  const covered = rows.every((x) => x.k > 0);
  const weighted = covered ? rows.reduce((t, x) => t + x.n * x.obsRate, 0) / N : null;
  const thin = rows.filter((x) => x.k > 0 && x.k < 10).map((x) => x.zh);
  const missing = rows.filter((x) => x.k === 0).map((x) => x.zh);

  let estimate, verdict;
  if (method === "random") {
    estimate = unweighted;
    verdict = missing.length
      ? `可以估计整体错误率（每条机会相同），但这次一个都没抽到：${missing.join("、")}——这些组之间没法比较。`
      : thin.length
        ? `可以估计整体错误率；但 ${thin.join("、")} 每组不到 10 条，组间比较很不可靠。`
        : "可以估计整体错误率；各组都抽到了一些，组间比较仍要看每组样本数。";
  } else if (method === "stratified") {
    estimate = weighted;
    verdict = "每组都有样本，可以比较语言和前后两期。估计整体比例时要按每组的权重（组大小 ÷ 组样本数）加权，不能把所有样本直接合起来算。";
  } else {
    estimate = null;
    verdict = "能有针对性地检查已知风险，但样本不是按已知机会抽的：观察到的错误率不能代表整体，不能用来估计服务整体的错误率。";
  }
  return { rows, n, errs, unweighted, weighted, trueOverall, estimate, covered, thin, missing, verdict, picked: picked.map((x) => x.id) };
}

/** Slide 18 "View sampling examples": an agreed check, then a result against it. */
export const SAMPLE_CHECKS = [
  { id: "routine", label: "Example 1 · Routine translations", design: "Random sample · 100 translation records", k: 97, n: 100, rule: "≥ 95 / 100 explain the policy correctly", min: 95, every: false },
  { id: "dispute", label: "Example 2 · Dispute routing", design: "Targeted selection · 20 dispute records", k: 19, n: 20, rule: "Every reviewed dispute reaches a Human Agent before advice", min: 20, every: true },
];

export function checkResult({ k, n, min, every }) {
  const met = every ? k === n : k >= min;
  const ci = wilson(k, n);
  return {
    met,
    ci,
    text: met
      ? `达到约定标准（${k}/${n}）。但还要看那 ${n - k} 个错误是什么、抽样的局限，再下结论。`
      : every
        ? `没达到：约定是「每一个都要」，${n - k} 个失败就是 not met。要调查原因，服务负责人修，审计再测。`
        : `没达到：${k}/${n} 低于约定的 ${min}/${n}。`,
  };
}

// ---------- Slide 21 / 23: required route vs observed route ----------

/** Positive = the service sends the request to a Human Agent (Slide 23). need = reviewer's required route. */
export const ROUTE_CASES = [
  { id: "yue-exc", label: "粤语 · 例外申请（「我唔係要改資料…」）", need: "agent", seen: "advice", src: "Slides 13、23、25", harm: "顾客拿到 AI 对个案的建议，没有受训人员复核；可能被告知不符合资格或错过期限" },
  { id: "cmn-rout", label: "普通话 · 常规问题", need: "ai", seen: "agent", src: "Slide 23", harm: "不必要的转人工：排队变长、成本上升、顾客等更久，人手被占用" },
  { id: "en-rout", label: "英语 · 常规问题（问截止日期）", need: "ai", seen: "ai", src: "Slide 5 pilot 类型", harm: "路由正确；但内容可能仍错（pilot 里 40 条有 2 条截止日期错）" },
  { id: "en-disp", label: "英语 · 资格争议", need: "agent", seen: "agent", src: "Slide 18 Example 2 类型", harm: "路由正确；仍要证明 Human Agent 真的处理完了" },
  { id: "run1", label: "同一粤语例外 · 第 1 次", need: "agent", seen: "agent", src: "Slide 21", harm: "这一次对了" },
  { id: "run2", label: "同一粤语例外 · 第 2 次", need: "agent", seen: "advice", src: "Slide 21", harm: "同样条件下第二次给了建议：非确定性让「一次通过」不能当成证据" },
  { id: "run3", label: "同一粤语例外 · 第 3 次", need: "agent", seen: "agent", src: "Slide 21", harm: "又对了；三次里一次失败，必需的转交不可靠" },
  { id: "mixed", label: "粤英夹杂 · 账户不是本人的（wrong account）", need: "agent", seen: "agent", src: "Slide 21 罕见高风险（示意）", harm: "路由正确；但进队列 ≠ 处理完成" },
];

export const ROUTE_LABELS = {
  agent: "Human Agent queue",
  advice: "AI Assistant advice",
  ai: "AI Assistant advice",
};

export const OUTCOMES = [
  { id: "TP", label: "TP · True positive", zh: "该转、转了：正确升级" },
  { id: "FP", label: "FP · False positive", zh: "不该转、转了：不必要的升级" },
  { id: "TN", label: "TN · True negative", zh: "不该转、没转：正确地不升级" },
  { id: "FN", label: "FN · False negative", zh: "该转、没转：漏掉的升级" },
];

/** @param {string} need "agent" or "ai"  @param {string} seen "agent" or "advice" */
export function routeOutcome(need, seen) {
  const positive = seen === "agent";
  const needed = need === "agent";
  if (positive && needed) return "TP";
  if (positive && !needed) return "FP";
  if (!positive && !needed) return "TN";
  return "FN";
}

export function routeSummary(cases = ROUTE_CASES) {
  const counts = { TP: 0, FP: 0, TN: 0, FN: 0 };
  for (const c of cases) counts[routeOutcome(c.need, c.seen)]++;
  const fnCases = cases.filter((c) => routeOutcome(c.need, c.seen) === "FN").map((c) => c.label);
  return {
    counts,
    policyMet: counts.FN === 0,
    verdict: counts.FN
      ? `政策要求「每一个例外 / 争议都先到 Human Agent」：有 ${counts.FN} 个 FN，就是 not met——不需要算比例。这些是故意挑的案例，不能估计服务整体的错误率。`
      : "这批案例里没有漏掉的升级。但它们是故意挑的，只说明这些案例；也只证明进了队列，不证明 Human Agent 完成了处理。",
    fnCases,
  };
}

// ---------- Slides 12, 14, 15: which claim does each record support? ----------

export const CLAIM_LEVELS = [
  { id: "design", label: "Design", zh: "规则本身能应对风险" },
  { id: "impl", label: "Implementation", zh: "规则已经落地、可以用" },
  { id: "op", label: "Operation", zh: "一段时间里人 / 系统真的照做" },
];

/**
 * Presets. Each evidence item supports a claim at a level; access says whether it is inside the audit's rights.
 * The mapping is the note's reasoning (我的解答), built from the deck's facts.
 */
export const CLAIM_PRESETS = [
  {
    id: "ico",
    label: "ICO · 警方人脸识别（Slide 12）",
    claim: "Senior staff approved the required privacy-risk assessments (DPIAs) before use.",
    zh: "高级人员在使用前批准了所需的隐私风险评估（DPIA）",
    evidence: [
      { id: "policy", label: "书面规定：DPIA 需高级人员批准", level: "design", access: "in", note: "只证明规则存在、针对这个风险" },
      { id: "form", label: "审批流程 / 表单里有高级签批步骤，demo 能走通", level: "impl", access: "in", note: "证明规则落地、可以用；不证明每次都用了" },
      { id: "interview", label: "员工访谈：「我们都会先批」", level: null, access: "in", note: "访谈是线索，要用记录印证；本身不证明执行" },
      { id: "sample", label: "抽样：每个 DPIA 有高级人员签名，日期早于首次使用", level: "op", access: "in", note: "这才是运行有效性的证据（要先定义抽样总体）" },
      { id: "plans", label: "各警队提交的整改计划（action plans）", level: null, access: "in", note: "计划 ≠ 完成；报告只说会安排跟进审计" },
    ],
    failure: { label: "抽样发现：部分案例没按规定由高级人员批准", note: "ICO 的发现正是如此（报告 p.15）" },
  },
  {
    id: "translation",
    label: "Harbourleaf · 翻译服务（Slides 14–15）",
    claim: "Customer text sent for translation is stored only in approved systems and deleted after 30 days.",
    zh: "送去翻译的顾客文本只存在批准的系统里，30 天后删除",
    evidence: [
      { id: "use", label: "采购、连接、数据流记录：翻译服务在用", level: null, access: "in", note: "证明服务在范围内、库存漏了它；不证明存储合规" },
      { id: "clause", label: "模型供应商条款：「不用顾客 prompt 训练」", level: null, access: "in", note: "是模型供应商的条款，说的是训练，不是翻译服务的存储或删除" },
      { id: "toolclaim", label: "工具输出：「翻译服务不保留顾客文本」", level: null, access: "in", note: "工具只拿到部分元数据，没对照原始来源核实前不能依赖" },
      { id: "policy", label: "政策：只存批准的系统，30 天删除", level: "design", access: "in", note: "这是审计标准（criterion），也是设计层面的证据" },
      { id: "config", label: "翻译服务的存储位置与保留期设置（Storage durations）", level: "impl", access: "approval", note: "讲义说缺失；要向 Service Director 要（假设可在去标识记录里查看）" },
      { id: "deletion", label: "抽样的删除记录（deletion records）", level: "op", access: "approval", note: "讲义说缺失；这是唯一能证明「真的删了」的证据" },
      { id: "privacy", label: "隐私评审摘要的附件", level: null, access: "approval", note: "附件需要另外的访问批准" },
      { id: "raw", label: "原始对话记录 / 员工个人工具账户", level: null, access: "out", note: "超出审计授权：不能自己去查，要申请扩权或在报告里写明限制" },
    ],
    failure: { label: "抽样发现：有顾客文本超过 30 天仍未删除", note: "假设情形（讲义没给）" },
  },
];

/**
 * @param {string} presetId
 * @param {string[]} have  evidence ids the auditor has obtained
 * @param {boolean} failure  a sampled exception was found
 * @param {boolean} approved  access approval granted for items marked "approval"
 */
export function evaluateClaim(presetId, have, failure = false, approved = false) {
  const p = CLAIM_PRESETS.find((x) => x.id === presetId) ?? CLAIM_PRESETS[0];
  const usable = p.evidence.filter((e) => have.includes(e.id) && (e.access === "in" || (e.access === "approval" && approved)));
  const blocked = p.evidence.filter((e) => have.includes(e.id) && !usable.includes(e)).map((e) => e.label);
  const levels = Object.fromEntries(CLAIM_LEVELS.map((l) => [l.id, usable.some((e) => e.level === l.id)]));
  let result, why;
  if (failure && levels.op) {
    result = "Not met";
    why = "运行抽样发现例外：规则在，但没有被一贯执行。结论写「不符合」，说明是哪些案例、抽样范围多大。";
  } else if (failure) {
    result = "Insufficient evidence";
    why = "勾了「发现例外」，但还没有运行层面的抽样记录支撑这个发现——先拿到记录。";
  } else if (levels.design && levels.impl && levels.op) {
    result = "Met (within the tested scope)";
    why = "设计、落地、运行三层都有证据。结论仍只覆盖抽样的总体和期间。";
  } else {
    result = "Insufficient evidence";
    const miss = CLAIM_LEVELS.filter((l) => !levels[l.id]).map((l) => l.label);
    why = `还缺 ${miss.join(" / ")} 层面的证据。没有证据 ≠ 不符合，也不能写成「符合」。`;
  }
  const notes = usable.map((e) => `${e.label}：${e.note}`);
  return { preset: p, levels, result, why, blocked, notes };
}
