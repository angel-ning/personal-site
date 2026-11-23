// ISOM 5100 week 5 (Managing IT Projects): function point analysis, Delphi rounds, the integrative
// change control flow (Slide 17), the HRBPS scope-creep arithmetic and the Norsk Hydro ransom trade-off.
// Shared by the components in project-labs.tsx and by scripts/lib/mdx-core.mjs (README export).

// ---------- Function point analysis (Slides 11–13) ----------

export const FPA_ELEMENTS = [
  { id: "inputs", label: "Inputs 输入", weights: [2, 3, 4] },
  { id: "outputs", label: "Outputs 输出", weights: [3, 6, 9] },
  { id: "inquiries", label: "Inquiries 查询", weights: [2, 4, 6] },
  { id: "files", label: "Files 文件", weights: [5, 8, 12] },
  { id: "interfaces", label: "Interfaces 接口", weights: [5, 10, 15] },
];
export const LEVELS = ["Low", "Average", "High"];

// counts[i], levels[i] ∈ 0 | 1 | 2
export function fpa({ counts, levels, rate, team, wage }) {
  const rows = FPA_ELEMENTS.map((e, i) => {
    const w = e.weights[levels[i]];
    return { ...e, count: counts[i], level: LEVELS[levels[i]], weight: w, points: counts[i] * w };
  });
  const total = rows.reduce((s, r) => s + r.points, 0);
  const personMonths = total / rate;
  const months = team > 0 ? personMonths / team : Infinity;
  const cost = personMonths * wage;
  return { rows, total, personMonths, months, cost };
}

export const FPA_PRESETS = [
  {
    id: "slide12",
    label: "Slide 12：Patient Admitting and Billing",
    note: "课件的例题：15 个低复杂度输入、5 个中等输出、10 个中等查询、30 个高复杂度文件、20 个中等接口；行业比率 5 FP = 1 人月，10 个程序员。工资是示意数字。",
    x: { counts: [15, 5, 10, 30, 20], levels: [0, 1, 1, 2, 1], rate: 5, team: 10, wage: 8000 },
  },
  {
    id: "files-low",
    label: "同一系统，文件只算 Average",
    note: "只把 30 个文件从 High 改成 Average（×12 → ×8）：总点数少 120，工期少两个多月。复杂度评级是主观判断，这就是 FPA 的弱点。",
    x: { counts: [15, 5, 10, 30, 20], levels: [0, 1, 1, 1, 1], rate: 5, team: 10, wage: 8000 },
  },
  {
    id: "team20",
    label: "人数翻倍到 20 人",
    note: "公式上工期减半到约 6.6 个月。现实里加人要沟通和上手，工期不会按比例缩短（Brooks 定律，见课外补充）。",
    x: { counts: [15, 5, 10, 30, 20], levels: [0, 1, 1, 2, 1], rate: 5, team: 20, wage: 8000 },
  },
];

// ---------- Delphi technique (Slide 9) ----------

// Each round every estimator moves `pull` of the way toward the anchor: the group median when anonymous,
// the boss's (estimator 0) number when names are shown. Returns one row per round.
export function delphi(initial, { rounds = 3, pull = 0.5, anonymous = true } = {}) {
  const out = [];
  let cur = initial.slice();
  for (let r = 0; r <= rounds; r++) {
    const sorted = cur.slice().sort((a, b) => a - b);
    const mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    out.push({ round: r, values: cur.map((v) => Math.round(v * 10) / 10), median: Math.round(mid * 10) / 10, min: sorted[0], max: sorted[sorted.length - 1], spread: Math.round((sorted[sorted.length - 1] - sorted[0]) * 10) / 10 });
    const anchor = anonymous ? mid : cur[0];
    cur = cur.map((v, i) => (!anonymous && i === 0 ? v : v + (anchor - v) * pull));
  }
  return out;
}

export const DELPHI_ESTIMATORS = ["IT 经理（资深）", "开发 A", "开发 B", "测试", "业务分析师"];
export const DELPHI_PRESETS = [
  { id: "spread", label: "意见分散", note: "五个人对同一份范围说明给出很不一样的人月数，匿名几轮后收敛到中位数附近。", initial: [12, 20, 26, 30, 45], anonymous: true },
  { id: "boss", label: "不匿名：大家跟着资深经理走", note: "同样的初始数字，但名字公开：其他人向资深经理的 12 人月靠拢，结果收敛了，却收敛到一个偏低的数。这正是 Delphi 要匿名的原因。", initial: [12, 20, 26, 30, 45], anonymous: false },
  { id: "outlier", label: "一个人看到了别人没看到的风险", note: "测试人员给 60 人月，因为他知道要和旧系统做数据迁移。匿名收敛把这个信息「平均掉」了：Delphi 的另一个缺点。要求离群的人写出理由才能补救。", initial: [18, 20, 22, 60, 21], anonymous: true },
];

// ---------- Integrative change control (Slide 17) ----------

// The swimlane flow. `ask` steps branch on a yes/no answer.
export const ICCP_STEPS = {
  create: { lane: "Initiator", label: "Create RFC 提交变更请求", next: "screen" },
  screen: { lane: "Screener", label: "Initial review of RFC 初审", next: "complete" },
  complete: { lane: "Screener", label: "RFC complete? 信息齐全吗？", ask: "complete", yes: "priority", no: "collect" },
  collect: { lane: "Initiator", label: "Collect additional info 补充信息", next: "screen" },
  priority: { lane: "Screener", label: "Review & assign priority 定优先级（E / H / M / L）", next: "category" },
  category: { lane: "Screener", label: "Review & assign category 定类别（Major / Significant / Minor / Operational）", next: "log" },
  log: { lane: "Screener", label: "Update change log & schedule 登记并排期", next: "inform" },
  inform: { lane: "Screener", label: "Inform all of status 通知所有人", next: "review" },
  review: { lane: "CAB", label: "Review changes CAB 审议", next: "authority" },
  authority: { lane: "CAB", label: "Authority to make change? CAB 有权决定吗？", ask: "authority", yes: "approved", no: "escalate" },
  escalate: { lane: "CAB", label: "Escalate 上报（发起人 / 指导委员会）", next: "approved" },
  approved: { lane: "CAB", label: "Change approved? 批准吗？", ask: "approved", yes: "schedule", no: "reject" },
  reject: { lane: "Screener", label: "Update change log 记录驳回（结束）", end: "rejected" },
  schedule: { lane: "CAB", label: "Schedule change 排期", next: "make" },
  make: { lane: "Owner", label: "Make change 执行变更（结束）", end: "done" },
};
export const ICCP_LANES = ["Initiator", "Screener", "CAB", "Owner"];

export const RFC_CASES = [
  {
    id: "rfc042",
    label: "Slide 18：RFC-042 月度财务报告",
    who: "Sally Jones（Finance Systems）",
    desc: "存货持有成本在报告生成之后才录入，月报出错。要求推迟生成月报，并加一个「成本数据齐了才运行」的检查。",
    priority: "High",
    category: "Minor",
    impact: "Cost、Quality",
    answers: { complete: true, authority: true, approved: true },
    why: "信息齐全；影响面小（Minor），在 CAB 的权限内；不改会继续拿错误数字做决策，所以批准。",
  },
  {
    id: "hrbps-model",
    label: "HRBPS：要改数据模型的增强请求",
    who: "HR 用户（经项目经理转交）",
    desc: "22 个增强请求里的 2 个：用户觉得很有价值，但要改底层数据模型。系统架构师还没评估。",
    priority: "Medium",
    category: "Major",
    impact: "Scope、Schedule、Cost、Risk、Quality",
    answers: { complete: false, authority: false, approved: false },
    why: "第一次提交缺少架构师的影响评估，要退回补充。改数据模型是 Major，超出 CAB 权限，要上报给发起人（CEO）。在项目已经超支 62%、MVP 还没交付的情况下，合理的结论是放进第二期，而不是现在做。",
  },
  {
    id: "hrbps-label",
    label: "HRBPS：把一个按钮的文字改清楚",
    who: "试点用户",
    desc: "福利登记页面上「Submit」改成「Submit enrollment」，避免用户以为已经提交。",
    priority: "Low",
    category: "Operational",
    impact: "Quality",
    answers: { complete: true, authority: true, approved: true },
    why: "改动小、不影响范围和进度，CAB（甚至可以授权项目经理）直接批准。ICCP 不是要拒绝所有变更，而是让每个变更都被看见、被记录、按影响大小走不同的审批层级。",
  },
  {
    id: "nd-home",
    label: "SodaStream Canada：把 Home Exchange 流程加进 ERP",
    who: "SodaStream Canada 业务团队",
    desc: "未来可能推出的上门换气瓶计划，要求现在就在 NetSuite 里建好流程。",
    priority: "Low",
    category: "Significant",
    impact: "Scope、Schedule、Cost",
    answers: { complete: true, authority: true, approved: false },
    why: "信息齐全，CAB 有权决定。但这个计划还只是「potential」，在 2021 年 6 月上线前加进来会扩大范围、挤占核心流程的测试时间，所以驳回或推迟到上线后，并记录在变更日志里。",
  },
];

export function iccpPath(answers) {
  const path = [];
  let id = "create";
  let loops = 0;
  const seen = { complete: 0 };
  while (id && path.length < 30) {
    const s = ICCP_STEPS[id];
    let answer;
    if (s.ask) {
      // An incomplete RFC is sent back once; the second time round it is complete.
      if (s.ask === "complete") {
        answer = answers.complete || seen.complete > 0;
        seen.complete += 1;
      } else answer = answers[s.ask];
    }
    path.push({ id, ...s, answer });
    if (s.end) return { path, end: s.end, loops };
    if (id === "collect") loops += 1;
    id = s.ask ? (answer ? s.yes : s.no) : s.next;
  }
  return { path, end: "stuck", loops };
}

// ---------- HRBPS scope creep (short case) ----------

export const HRBPS_FACTS = { builtPct: 40, extraMonths: 7, schedulePct: 45, budgetPct: 62, enhancements: 22, modelChanges: 2 };

// Original duration implied by "seven more months (a 45 percent increase on the original)".
export function hrbpsBaseline(f = HRBPS_FACTS) {
  const original = f.extraMonths / (f.schedulePct / 100);
  return { original, total: original + f.extraMonths };
}

// What-if: accept k minor enhancements and m data-model changes. Effort per item is an assumption.
export function hrbpsWhatIf({ budget = 100, minor = 0, model = 0, minorWeeks = 1.5, modelWeeks = 8, costPerMonth = undefined }) {
  const b = hrbpsBaseline();
  const perMonth = costPerMonth ?? (budget * (1 + HRBPS_FACTS.budgetPct / 100)) / b.total;
  const addMonths = (minor * minorWeeks + model * modelWeeks) / 4.33;
  const months = b.total + addMonths;
  const cost = budget * (1 + HRBPS_FACTS.budgetPct / 100) + addMonths * perMonth;
  return { original: b.original, months, addMonths, cost, schedulePct: (months / b.original - 1) * 100, budgetPct: (cost / budget - 1) * 100 };
}

export const HRBPS_PRESETS = [
  { id: "now", label: "只完成已批准的范围", note: "案例给的数字：再要 7 个月（+45%），预算 +62%。由此倒推原计划约 15.6 个月。", x: { minor: 0, model: 0 } },
  { id: "all", label: "22 个增强全部接受", note: "假设 20 个小改动各 1.5 周、2 个数据模型改动各 8 周（示意）：工期接近翻倍。", x: { minor: 20, model: 2 } },
  { id: "two", label: "只接受两个数据模型改动", note: "用户最看重的两个：每个都牵动底层设计、测试和数据迁移，单这两项就再加约 3.7 个月（示意）。", x: { minor: 0, model: 2 } },
];

// ---------- Norsk Hydro: pay or refuse (illustrative) ----------

// All inputs are assumptions except the case's "more than $50 million" for the refuse path.
export function ransomCompare(x) {
  const daily = x.dailyLoss;
  const payDays = x.daysWithKey;
  const refuseDays = x.daysWithoutKey;
  // Paying: ransom + downtime while decrypting; if the key fails you rebuild anyway.
  const payDowntime = x.keyWorks / 100 * payDays * daily + (1 - x.keyWorks / 100) * (payDays + refuseDays) * daily;
  const pay = x.ransom + payDowntime + x.rebuild * (x.rebuildAnyway ? 1 : 1 - x.keyWorks / 100) + (x.repeat / 100) * x.repeatCost;
  const refuse = refuseDays * daily + x.rebuild;
  return {
    pay: { ransom: x.ransom, downtime: payDowntime, rebuild: x.rebuild * (x.rebuildAnyway ? 1 : 1 - x.keyWorks / 100), repeat: (x.repeat / 100) * x.repeatCost, total: pay },
    refuse: { downtime: refuseDays * daily, rebuild: x.rebuild, total: refuse },
    cheaper: pay < refuse ? "pay" : "refuse",
    gap: Math.abs(pay - refuse),
  };
}

export const RANSOM_DEFAULT = { ransom: 10, keyWorks: 70, daysWithKey: 3, daysWithoutKey: 7, dailyLoss: 5, rebuild: 15, rebuildAnyway: true, repeat: 30, repeatCost: 40 };

export const RANSOM_PRESETS = [
  { id: "hydro", label: "接近 Hydro 的情况", note: "案例只给了结果：拒付，工厂停产近一周，总损失超过 $50M。其余数字是假设：赎金 $10M、密钥 70% 能用、付了之后仍要重建系统（攻击者有管理员权限、潜伏了几个月）。", x: RANSOM_DEFAULT },
  { id: "naive", label: "只看短期账", note: "如果相信密钥一定有效、付了就不用重建、不会再被攻击：付钱看起来便宜。很多公司就是这样算的。", x: { ...RANSOM_DEFAULT, keyWorks: 100, rebuildAnyway: false, repeat: 0 } },
  { id: "nobackup", label: "没有可用的备份", note: "如果没有离线备份，不付钱就要从零重建，停机可能是一个月：这时付钱在账面上明显更便宜，这就是「事前准备」决定了能不能说不。", x: { ...RANSOM_DEFAULT, daysWithoutKey: 30 } },
];

export const fmtM = (v) => `$${(Math.round(v * 10) / 10).toLocaleString("en-US")}M`;
export const fmtUsd = (v) => `$${Math.round(v).toLocaleString("en-US")}`;
