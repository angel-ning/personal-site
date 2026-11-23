// IT sourcing (ISOM 5100 week 3): weighted option scoring for the Method and Cohere cases,
// the payback of Method's integration layer (Exhibit 6), and Cohere's capacity split under stress.
// Shared by <WeightedOptionLab />, <IntegrationLayerLab />, <CapacityMixLab /> and scripts/mdx-to-md.mjs.

// ---------- Weighted scoring ----------

// Scores are 1–5 (5 = best for the company) and are my own judgement, not case data.
export const OPTION_SETS = {
  method: {
    title: "Method：四个方案按七个标准打分",
    source: "案例 p.3–6",
    options: [
      { id: "stay", label: "留在 VONZU" },
      { id: "saas", label: "换 SaaS" },
      { id: "build", label: "自建应用" },
      { id: "hybrid", label: "混合中间层" },
    ],
    criteria: [
      { id: "speed", label: "集成速度和自主", scores: [1, 3, 5, 4] },
      { id: "cx", label: "标签和客户体验", scores: [2, 4, 5, 4] },
      { id: "owner", label: "集成资产和客户入口归谁", scores: [1, 1, 5, 4] },
      { id: "exit", label: "不依赖供应商、能退出", scores: [1, 2, 5, 4] },
      { id: "feasible", label: "时间、钱、人够不够", scores: [5, 3, 1, 3] },
      { id: "security", label: "安全和运维负担轻", scores: [5, 5, 1, 3] },
      { id: "disrupt", label: "对现有客户影响小", scores: [5, 1, 1, 3] },
    ],
    presets: [
      { id: "equal", label: "所有标准同等重要", note: "作为起点。", weights: [2, 2, 2, 2, 2, 2, 2] },
      { id: "luis", label: "Luis Ángel：要自主", note: "他有 25 年以上行业经验，待过自研软件的公司，最在意摆脱 VONZU。", weights: [3, 2, 3, 3, 1, 1, 1] },
      { id: "jose", label: "José：省资源", note: "他认为公司没有自建的时间、钱和人，安全和运维最好继续交给供应商。", weights: [3, 3, 0, 0, 3, 3, 0] },
      { id: "maria", label: "Maria：两头兼顾", note: "既要拿回集成的自主权，也要留意公司的能力。", weights: [3, 3, 3, 3, 3, 2, 2] },
    ],
  },
  cohere: {
    title: "Cohere：三个选项按董事会的标准打分",
    source: "案例 p.1、p.3",
    options: [
      { id: "a", label: "A · CoreWeave" },
      { id: "b", label: "B · Hyperscaler" },
      { id: "c", label: "C · 分 workload 组合" },
    ],
    criteria: [
      { id: "speed", label: "上市速度", scores: [5, 2, 4] },
      { id: "cost", label: "算力成本", scores: [4, 2, 3] },
      { id: "resil", label: "运营韧性", scores: [2, 5, 4] },
      { id: "trust", label: "企业客户信任", scores: [2, 5, 4] },
      { id: "flex", label: "战略灵活性", scores: [2, 2, 5] },
      { id: "simple", label: "团队负担轻", scores: [2, 5, 2] },
    ],
    presets: [
      { id: "equal", label: "同等重要", note: "作为起点。B 和 C 很接近，说明结论取决于权重。", weights: [2, 2, 2, 2, 2, 2] },
      { id: "cto", label: "抢发布窗口", note: "只看速度和成本：对手是 OpenAI 和 Anthropic，North 晚发布的代价最大。", weights: [5, 3, 1, 1, 1, 1] },
      { id: "risk", label: "风险优先的董事", note: "受监管的客户和供应商的负债压倒一切，团队也不想多管一套环境。", weights: [1, 1, 5, 5, 1, 3] },
      { id: "mine", label: "我的权重", note: "速度重要，但 Cohere 卖的是信任和部署灵活性。", weights: [4, 2, 3, 4, 4, 2] },
    ],
  },
  // ISOM 5100 week 4.
  co7: {
    title: "CO7：四个 HCM 方案按六个标准打分",
    source: "案例 p.4–9",
    options: [
      { id: "odoo", label: "① Odoo HR" },
      { id: "odoopay", label: "② Odoo + 工资模块" },
      { id: "payworks", label: "③ 扩展 Payworks" },
      { id: "build", label: "④ 定制开发" },
    ],
    criteria: [
      { id: "cost", label: "三年 TCO 在预算内", scores: [4, 1, 5, 2] },
      { id: "func", label: "覆盖 Pouliot 的需求（培训、技能、绩效、调查）", scores: [5, 5, 3, 4] },
      { id: "single", label: "一份员工数据，不再重复录入", scores: [3, 4, 4, 4] },
      { id: "ease", label: "CO7 自己管得了（没有 IT 团队）", scores: [5, 2, 5, 1] },
      { id: "fast", label: "马上能用（准备下一次收购）", scores: [4, 3, 5, 1] },
      { id: "risk", label: "合规和安全风险低", scores: [4, 2, 5, 2] },
    ],
    presets: [
      { id: "equal", label: "同等重要", note: "作为起点。① 和 ③ 很接近，结论取决于你更看重功能还是省事。", weights: [2, 2, 2, 2, 2, 2] },
      { id: "laurence", label: "Laurence：财务和工资", note: "VP Finance，管工资和预算，刚花钱收购了 Sherbrooke。", weights: [5, 1, 3, 3, 2, 4] },
      { id: "pouliot", label: "Pouliot：HR 功能", note: "她要培训计划、技能库、KPI 绩效和员工调查，想做数据驱动的 HR；系统由她自己管，不太担心操作复杂。", weights: [2, 5, 3, 1, 2, 2] },
      { id: "growth", label: "收购节奏", note: "公司在考虑下一次收购：越快上线、越不需要技术人员越好。", weights: [3, 2, 3, 4, 5, 3] },
    ],
  },
  cathay: {
    title: "Cathay 2026：A 扩大供应商 vs B 少数战略伙伴",
    source: "案例 p.2–3",
    options: [
      { id: "a", label: "A · 扩大供应商生态" },
      { id: "b", label: "B · 少数战略伙伴" },
    ],
    criteria: [
      { id: "price", label: "价格压力和透明度", scores: [5, 2] },
      { id: "lock", label: "降低对单一供应商的依赖", scores: [5, 2] },
      { id: "best", label: "拿到专业的 AI / 数据能力", scores: [5, 3] },
      { id: "account", label: "责任清楚、出事有人负责", scores: [2, 5] },
      { id: "integr", label: "整合成本和数据治理简单", scores: [2, 5] },
      { id: "skills", label: "内部团队负担得起", scores: [1, 4] },
      { id: "transit", label: "转换风险低（航空关键系统）", scores: [2, 5] },
    ],
    presets: [
      { id: "equal", label: "同等重要", note: "作为起点：B 领先，但把「价格」或「依赖」的权重提到 5，A 就翻盘。", weights: [2, 2, 2, 2, 2, 2, 2] },
      { id: "cfo", label: "采购 / 财务", note: "1997 年的教训是没有竞争就没有价格纪律，基准比较形同虚设。", weights: [5, 4, 3, 1, 1, 1, 2] },
      { id: "ops", label: "运营 / IT 基础设施", note: "订票、值机、排班都在云上，宕机的代价远大于多付的钱。", weights: [1, 2, 2, 5, 4, 3, 5] },
      { id: "mine", label: "我的权重", note: "价格和依赖都重要，但 Cathay 先要有管理多家供应商的能力。", weights: [4, 4, 3, 3, 3, 4, 3] },
    ],
  },
  // ISOM 5100 week 5.
  rollout: {
    title: "SodaStream Canada：ERP 怎么上线",
    source: "案例 p.3–5（分数是我的判断）",
    options: [
      { id: "bigbang", label: "一次全部上线" },
      { id: "phased", label: "按功能分阶段" },
      { id: "pilot", label: "先财务，再订单 + 3PL" },
    ],
    criteria: [
      { id: "deadline", label: "赶上 2021 年 6 月上线", scores: [4, 2, 3] },
      { id: "risk", label: "出问题时影响面小（订单、发货不中断）", scores: [1, 5, 4] },
      { id: "global", label: "尽快和全球 NetSuite 一致（CoA、合并报表）", scores: [5, 2, 4] },
      { id: "bridge", label: "不用在新旧系统之间做临时接口", scores: [5, 1, 3] },
      { id: "learn", label: "用户（远程 UAT、疫情）有时间适应", scores: [1, 5, 4] },
      { id: "cost", label: "NetDynamic 的人力和成本", scores: [4, 2, 3] },
    ],
    presets: [
      { id: "equal", label: "同等重要", note: "作为起点。", weights: [2, 2, 2, 2, 2, 2] },
      { id: "parent", label: "母公司：全球一致", note: "SodaStream 总部要的是集中财务数据和统一的 CoA，越早接入越好。", weights: [4, 2, 5, 3, 1, 2] },
      { id: "canada", label: "SodaStream Canada：别影响生意", note: "B2B 大单（Canadian Tire 一单可达 $100,000）和 3PL 发货不能断；用户只能远程培训。", weights: [2, 5, 2, 1, 5, 2] },
      { id: "mine", label: "我的权重", note: "风险和学习时间最重要，但也要尽快把财务并进全球系统。", weights: [3, 4, 4, 2, 4, 2] },
    ],
  },
  hydro: {
    title: "Norsk Hydro：遭到勒索后怎么应对",
    source: "案例 p.2–9（分数是我的判断）",
    options: [
      { id: "open", label: "拒付 + 公开（Hydro）" },
      { id: "quiet", label: "拒付 + 低调处理" },
      { id: "pay", label: "付赎金 + 保密" },
    ],
    criteria: [
      { id: "short", label: "短期恢复快、直接损失小", scores: [2, 2, 4] },
      { id: "repeat", label: "不被盯上再次勒索", scores: [5, 4, 1] },
      { id: "ethics", label: "合法合规、不资助犯罪", scores: [5, 5, 1] },
      { id: "staff", label: "员工能配合（3.5 万人要知道别开电脑）", scores: [5, 2, 2] },
      { id: "trust", label: "客户、市场和监管的信任", scores: [5, 3, 1] },
      { id: "control", label: "信息不被攻击者或媒体抢先", scores: [4, 2, 2] },
    ],
    presets: [
      { id: "equal", label: "同等重要", note: "作为起点。", weights: [2, 2, 2, 2, 2, 2] },
      { id: "cfo", label: "只看这个季度的账", note: "停产每天都在亏钱，赎金看起来比停一周便宜；其他标准几乎不算。只有这样付钱才胜出。", weights: [5, 0, 0, 0, 1, 0] },
      { id: "hydro", label: "Hydro 管理层", note: "「从来没有付钱这个选项」：付了会再来；靠透明让员工和客户站在自己这边。", weights: [1, 4, 5, 4, 4, 3] },
      { id: "small", label: "一家没有备份的小医院", note: "恢复速度权重最高，但只要还在乎一点合规和再被勒索，付钱仍然不赢。真正逼医院付钱的是没有备份：那改变的是「短期恢复」这一行的分数（试试把付赎金改成 5、两个拒付改成 1），不是权重。", weights: [5, 1, 1, 1, 1, 0] },
    ],
  },
};

export function weightedScores(set, weights, scores = set.criteria.map((c) => c.scores)) {
  const totals = set.options.map((o, i) => ({ ...o, total: scores.reduce((sum, row, c) => sum + row[i] * (weights[c] ?? 0), 0) }));
  const top = Math.max(...totals.map((o) => o.total));
  const winners = totals.filter((o) => o.total === top);
  return { totals, top, winners, tie: winners.length > 1 };
}

// For each criterion: which weight (0–5), other weights unchanged, would hand first place to someone else?
export function flips(set, weights, scores = set.criteria.map((c) => c.scores)) {
  const base = weightedScores(set, weights, scores);
  if (base.tie) return [];
  return set.criteria.flatMap((c, i) => {
    const found = [];
    for (let w = 0; w <= 5; w++) {
      if (w === weights[i]) continue;
      const next = weightedScores(set, weights.map((v, k) => (k === i ? w : v)), scores);
      if (!next.tie && next.winners[0].id !== base.winners[0].id) found.push({ w, winner: next.winners[0].label });
    }
    if (!found.length) return [];
    const nearest = found.reduce((a, b) => (Math.abs(b.w - weights[i]) < Math.abs(a.w - weights[i]) ? b : a));
    return [{ criterion: c.label, from: weights[i], to: nearest.w, winner: nearest.winner }];
  });
}

// ---------- Method: integration layer payback (Exhibit 5–6) ----------

export const PROVIDERS = [
  { id: "A", cost: 78720, weeks: 14, people: 6, team: "项目总监、功能顾问、UX/UI 架构师、2 名程序分析员、系统技术员" },
  { id: "B", cost: 43070, weeks: 16, people: 4, team: "项目经理、UX/UI 设计师、前端、后端" },
  { id: "C", cost: 54400, weeks: 16, people: 7, team: "项目负责人、3 名高级开发、2 名 Java 后端、1 名 Angular 前端" },
];

// Person-weeks assume everyone is full-time for the whole project; the quotes do not say so.
export function quoteRow(p) {
  const personWeeks = p.people * p.weeks;
  return { ...p, personWeeks, perPersonWeek: p.cost / personWeeks };
}

export const fmtEur = (v) => `€${Math.round(v).toLocaleString("en-US")}`;

// x = { customers, perYear, vonzuCost, layerCost, moveCost, runPct, kept, margin, connectorPct }
// Only the provider quotes come from the case; every x value is an assumption to play with.
export function layerCase(x, provider) {
  const directYear = x.perYear * x.vonzuCost;
  const run = (provider.cost * x.runPct) / 100;
  const layerYear = x.perYear * x.layerCost + run;
  const retained = x.kept * x.margin;
  const benefit = directYear - layerYear + retained;
  const upfront = provider.cost + x.customers * x.moveCost;
  const payback = benefit > 0 ? upfront / benefit : null;
  const reintegrate = x.customers * x.vonzuCost;
  const connector = (provider.cost * x.connectorPct) / 100;
  return { provider, directYear, run, layerYear, retained, benefit, upfront, payback, reintegrate, connector };
}

export const LAYER_PRESETS = [
  { id: "cost", label: "只算集成费", note: "只比较每个新客户的集成费，不算留住客户的价值。", x: { customers: 30, perYear: 10, vonzuCost: 3000, layerCost: 500, moveCost: 300, runPct: 20, kept: 0, margin: 20000, connectorPct: 15 } },
  { id: "retain", label: "算上留住客户", note: "假设集成更快、集成资产留在 Method，每年多留住 1 个客户。", x: { customers: 30, perYear: 10, vonzuCost: 3000, layerCost: 500, moveCost: 300, runPct: 20, kept: 1, margin: 20000, connectorPct: 15 } },
  { id: "growth", label: "高增长", note: "每年 25 个新客户，多留住 2 个：接近合伙人担心的增长路径。", x: { customers: 30, perYear: 25, vonzuCost: 3000, layerCost: 500, moveCost: 300, runPct: 20, kept: 2, margin: 20000, connectorPct: 15 } },
];

export function layerVerdict(r) {
  if (r.payback === null) return "每年的收益抵不过运行成本：单看这些数字，中间层回不了本。";
  const y = r.payback.toFixed(1);
  if (r.payback > 5) return `约 ${y} 年回本，单靠节省集成费不足以支持这项投资。要批准它，理由必须是留住客户、缩短集成时间和退出供应商的选择权。`;
  if (r.payback > 3) return `约 ${y} 年回本，财务上可以接受，但结论取决于留住客户的假设。`;
  return `约 ${y} 年回本，财务上站得住。真正要审查的是假设：每年真能多留住这么多客户吗？`;
}

// ---------- Cohere: capacity split under stress ----------

// All numbers are illustrative indices: need 100 units; hyperscaler on-demand price = 1.
export const CAPACITY_DEFAULT = { neoPrice: 0.6, hyperSupply: 60, neoSpare: 20, dualCost: 8, moveCost: 0.2, weeksPerPoint: 0.2 };

export const SCENARIOS = [
  { id: "base", label: "基准", neo: 1, hyper: 60, demand: 1, note: "两边都按承诺交付" },
  { id: "squeeze", label: "大客户优先", neo: 0.5, hyper: 60, demand: 1, note: "CoreWeave 把 GPU 先给更大的客户，只交付一半" },
  { id: "distress", label: "CoreWeave 融资出问题", neo: 0, hyper: 60, demand: 1, note: "信贷收紧，容量拿不到" },
  { id: "shortage", label: "GPU 短缺加剧", neo: 1, hyper: 30, demand: 1, note: "Hyperscaler 优先自家 AI 产品，供应减半" },
  { id: "demand", label: "需求不及预期", neo: 1, hyper: 60, demand: 0.6, note: "只需要 60% 的算力，长期承诺用不完" },
];

export function runScenario(split, portable, s, p = CAPACITY_DEFAULT) {
  const need = 100 * s.demand;
  const plannedHyper = 100 - split;
  const neoDelivered = split * s.neo;
  let hyperAvail = Math.min(plannedHyper, s.hyper);
  let moved = 0;
  // A portable stack can move a shortfall to the other side, but only as far as the existing
  // relationship reaches: in a GPU shortage nobody hands large capacity to a customer they don't already serve.
  if (portable) {
    const short = Math.max(0, need - neoDelivered - hyperAvail);
    const spareHyper = Math.min(Math.max(0, s.hyper - hyperAvail), plannedHyper * 0.5);
    const toHyper = Math.min(short, spareHyper);
    hyperAvail += toHyper;
    moved += toHyper;
  }
  let neoUsable = neoDelivered;
  if (portable && s.neo === 1) {
    const short = Math.max(0, need - neoDelivered - hyperAvail);
    const toNeo = Math.min(short, p.neoSpare, split * 0.5);
    neoUsable += toNeo;
    moved += toNeo;
  }
  const hyperUsed = Math.min(hyperAvail, Math.max(0, need - neoUsable));
  const served = Math.min(need, neoUsable + hyperUsed);
  const stranded = Math.max(0, neoUsable - need) * p.neoPrice;
  const overhead = split > 0 && split < 100 ? p.dualCost : 0;
  const cost = neoUsable * p.neoPrice + hyperUsed + moved * p.moveCost + overhead;
  const shortfall = need > 0 ? ((need - served) / need) * 100 : 0;
  return { scenario: s, need, served, shortfall, delay: shortfall * p.weeksPerPoint, cost, unit: served > 0 ? cost / served : 0, stranded };
}

export function capacityMix(split, portable, p = CAPACITY_DEFAULT) {
  const rows = SCENARIOS.map((s) => runScenario(split, portable, s, p));
  return { rows, base: rows[0], worstDelay: Math.max(...rows.map((r) => r.delay)), worstStranded: Math.max(...rows.map((r) => r.stranded)) };
}

export function capacitySweep(portable, p = CAPACITY_DEFAULT) {
  return Array.from({ length: 11 }, (_, i) => {
    const split = i * 10;
    const r = capacityMix(split, portable, p);
    return { split, unit: r.base.unit, worstDelay: r.worstDelay };
  });
}

export const CAPACITY_PRESETS = [
  { id: "b", label: "全押 Hyperscaler", split: 0, portable: false },
  { id: "c", label: "40% CoreWeave + 可迁移", split: 40, portable: true },
  { id: "a", label: "全押 CoreWeave", split: 100, portable: false },
];

export function capacityVerdict(split, portable, r) {
  const worst = r.rows.reduce((a, b) => (b.delay > a.delay ? b : a));
  const lead = `最坏情况是「${worst.scenario.label}」，发布约晚 ${worst.delay.toFixed(0)} 周；基准情况下每单位算力的成本是 ${r.base.unit.toFixed(2)}。`;
  if (split === 0) return `${lead} 没有供应商财务风险，但 GPU 不够本身就是延误：这是选项 B 的代价。`;
  if (split === 100) return `${lead} 基准最便宜，但所有风险都压在一家负债很高的供应商身上。`;
  if (!portable) return `${lead} 打开「技术栈可迁移」对比一下：组合的价值有一部分来自能把 workload 搬走。`;
  return `${lead} 组合买的是保险：单价高一些，换来任何一边出问题时都还能继续。`;
}
