// Cloud computing (ISOM 5100 week 2): service-model responsibility (slides 17–19), elasticity and
// pricing per workload (slides 9, 30, 35), and the cloud-exit / TCO comparison (slide 2, slide 31).
// Shared by <ServiceModelLab />, <ElasticityLab />, <CloudExitLab /> and scripts/mdx-to-md.mjs.

// ---------- Service models (slide 19) ----------

export const STACK = ["Applications", "Data", "Runtime", "Middleware", "O/S", "Virtualization", "Servers", "Storage", "Networking"];

// mine = how many layers from the top the customer still manages
export const MODELS = [
  {
    id: "onprem",
    label: "On-premises",
    mine: 9,
    food: "Home cooking：厨房、锅具、厨师都自己出",
    kitchen: ["you", "you", "you"],
    example: "自己机房里的 ERP；37signals 出云后的 Basecamp",
    control: "最高：每一层都能改",
    speed: "最慢：先买硬件、装系统，才能上线",
    skills: "要有完整的 IT 团队（硬件、网络、系统、数据库）",
    cost: "前期大笔 capex；为峰值买的容量平时闲着",
    fit: "需求稳定、规模够大、有运维能力，或者法规要求自己控制",
  },
  {
    id: "iaas",
    label: "IaaS",
    mine: 5,
    food: "Rent a commercial kitchen：租厨房，锅具和厨师自己出",
    kitchen: ["you", "you", "provider"],
    example: "AWS EC2 虚拟机、Amazon S3 存储；HEY 上线时跑在云上的服务器",
    control: "高：OS 以上都自己管",
    speed: "快：几分钟开一台机器",
    skills: "仍要会管 OS、中间件、数据库",
    cost: "按用量付费（opex），可以随时加减",
    fit: "要控制软件环境，又不想买硬件；需求波动大",
  },
  {
    id: "paas",
    label: "PaaS",
    mine: 2,
    food: "Rent the kitchen and the vessels：厨房和锅具都租，只出厨师",
    kitchen: ["you", "provider", "provider"],
    example: "Windows Azure / Google App Engine：只上传代码，平台负责运行",
    control: "中：只管自己的应用和数据",
    speed: "更快：开发者不用管服务器",
    skills: "主要是开发能力",
    cost: "按用量付费；但平台专有的服务越用越多，换平台越难",
    fit: "自己开发应用，想把精力放在产品上",
  },
  {
    id: "saas",
    label: "SaaS",
    mine: 0,
    food: "Hire a caterer：全部外包，只管吃",
    kitchen: ["provider", "provider", "provider"],
    example: "Salesforce、Microsoft 365、Google Docs；LearnSphere 考虑的 EduConnect 360；Rexel 的 SmartRecruiters",
    control: "最低：只能配置，不能改代码",
    speed: "最快：注册就能用",
    skills: "几乎不需要技术人员，但要有人管配置和数据",
    cost: "订阅费（按用户 / 按月），长期累计不一定便宜",
    fit: "通用的业务功能（邮件、CRM、招聘），不是公司的差异化来源",
  },
];

export const KITCHEN = ["Cook 厨师（应用）", "Vessels 锅具（平台）", "Kitchen 厨房（基础设施）"];

export function stackRows(modelId) {
  const m = MODELS.find((x) => x.id === modelId) ?? MODELS[0];
  return STACK.map((layer, i) => ({ layer, who: i < m.mine ? "you" : "provider" }));
}

// ---------- Elasticity and pricing per workload (slides 9, 30, 35) ----------

// Demand per period, in capacity units. Each pattern is one workload from the slides or the 37signals case.
export const PATTERNS = [
  {
    id: "stable",
    label: "稳定增长（Basecamp / Payroll）",
    unit: "月",
    demand: [100, 101, 103, 104, 105, 107, 108, 110, 111, 113, 114, 116],
    note: "成熟的订阅软件：需求可以预测，每年稳定增长。37signals 认为自己就是这种情况。",
  },
  {
    id: "holiday",
    label: "节日峰值（E-commerce）",
    unit: "周",
    demand: [100, 100, 100, 100, 100, 100, 100, 100, 100, 300, 120, 100],
    note: "Slide 35：全年平稳，节日那一周变成三倍。买够峰值的容量，其余 11 周大部分闲着。",
  },
  {
    id: "launch",
    label: "新产品上线（HEY 2020）",
    unit: "周",
    demand: [10, 60, 100, 100, 95, 95, 90, 92, 94, 95, 97, 98],
    note: "案例：内部预测 6 个月 30,000 人试用，实际 3 周就有 300,000 人。按预测买机器，大约只够实际的十分之一。",
  },
  {
    id: "bursty",
    label: "月底分析（Analytics）",
    unit: "周",
    demand: [15, 15, 15, 100, 15, 15, 15, 100, 15, 15, 15, 100],
    note: "Slide 35：财务跑数时用量暴涨，其余时间几乎空闲。只在用的时候付钱最划算。",
  },
  {
    id: "uber",
    label: "高速增长 + 疫情下跌（Uber）",
    unit: "年",
    demand: [37, 52, 69, 50, 64, 76, 94, 113, 136],
    note: "Slide 10：2017–2025 年 trips（亿次）。2020 年骤降，自己买的机器会闲置；租的容量跟着曲线走。",
  },
];

// Unit prices relative to on-demand = 1 per capacity unit per period.
// reserved: slide 31 uses ~40% below on-demand (slide 30: up to 75% with a 3-year term).
// own:      amortised hardware + data centre + people per unit of capacity — an assumption to play with.
export const PRICE_DEFAULT = { reserved: 0.6, own: 0.45 };

// x = { pattern, ownPct, reservePct, reserved, own }
//   ownPct:     owned capacity as % of the actual peak (100 = perfect foresight; HEY's forecast ≈ 10)
//   reservePct: committed baseline as % of the peak; anything above it is bought on demand
export function elasticity(x) {
  const p = PATTERNS.find((q) => q.id === x.pattern) ?? PATTERNS[0];
  const d = p.demand;
  const peak = Math.max(...d);
  const total = d.reduce((s, v) => s + v, 0);
  const n = d.length;

  const cap = (peak * x.ownPct) / 100;
  const own = {
    id: "own",
    label: "自己买硬件（按容量付钱）",
    cost: cap * n * x.own,
    idle: d.reduce((s, v) => s + Math.max(0, cap - v), 0),
    unmet: d.reduce((s, v) => s + Math.max(0, v - cap), 0),
  };
  const onDemand = { id: "ondemand", label: "全部按需（Rent it）", cost: total, idle: 0, unmet: 0 };
  const base = (peak * x.reservePct) / 100;
  const burst = d.reduce((s, v) => s + Math.max(0, v - base), 0);
  const mix = {
    id: "mix",
    label: "预留基线 + 按需补峰（Book + Rent）",
    cost: base * n * x.reserved + burst,
    idle: d.reduce((s, v) => s + Math.max(0, base - v), 0),
    unmet: 0,
  };
  const options = [own, onDemand, mix];
  const served = options.filter((o) => o.unmet === 0);
  const best = served.reduce((a, b) => (b.cost < a.cost ? b : a), served[0]);
  return { pattern: p, peak, total, cap, base, options, best, utilisation: total / (peak * n) };
}

// A short verdict for the lab and the static export.
export function elasticityVerdict(r) {
  const own = r.options[0];
  if (own.unmet > 0)
    return `自己买的容量不够：有 ${Math.round((own.unmet / r.total) * 100)}% 的需求没服务到（宕机或排队）。这就是 HEY 上线时云的价值：预测错了也能马上加机器。`;
  if (r.best.id === "own")
    return `平均利用率 ${Math.round(r.utilisation * 100)}%：需求稳定，买下来的机器几乎一直在用，自己买最便宜。这正是 37signals 的论点。`;
  if (r.best.id === "mix")
    return `平均利用率 ${Math.round(r.utilisation * 100)}%：稳定的那部分用预留价，峰值按需补，比全部按需和自己买都便宜。大多数公司的做法。`;
  return `平均利用率只有 ${Math.round(r.utilisation * 100)}%：为峰值买的容量大部分时间闲着，全部按需反而最便宜。这就是 elasticity 的价值。`;
}

export const ELASTIC_PRESETS = [
  { id: "stable", label: "Basecamp：稳定", x: { pattern: "stable", ownPct: 110, reservePct: 85, ...PRICE_DEFAULT } },
  { id: "holiday", label: "电商：节日峰值", x: { pattern: "holiday", ownPct: 100, reservePct: 33, ...PRICE_DEFAULT } },
  { id: "launch", label: "HEY：按预测买机器", x: { pattern: "launch", ownPct: 10, reservePct: 0, ...PRICE_DEFAULT } },
  { id: "bursty", label: "月底分析", x: { pattern: "bursty", ownPct: 100, reservePct: 15, ...PRICE_DEFAULT } },
];

// ---------- Cloud exit / TCO (slide 2, slide 31) ----------

// x = { years, cloudAnnual, hardware, life, ownAnnual, migration }
//   cloudAnnual: all-in yearly cost of staying (fees, transfer, licences, people, downtime)
//   hardware:    servers bought up front (incl. spare capacity); bought again every `life` years
//   ownAnnual:   yearly cost after the move (data centre, licences, people, what stays in the cloud)
//   migration:   one-time transition cost
export function tco(x) {
  const rows = [];
  let cloud = 0;
  let own = x.hardware + x.migration;
  rows.push({ year: 0, cloudFlow: 0, ownFlow: own, cloud, own });
  for (let y = 1; y <= x.years; y++) {
    const refresh = y < x.years && y % x.life === 0 ? x.hardware : 0;
    cloud += x.cloudAnnual;
    own += x.ownAnnual + refresh;
    rows.push({ year: y, cloudFlow: x.cloudAnnual, ownFlow: x.ownAnnual + refresh, cloud, own });
  }
  const payback = rows.find((r) => r.year > 0 && r.own <= r.cloud)?.year ?? null;
  const saving = cloud - own;
  // The yearly cloud bill at which owning only breaks even over the horizon.
  const refreshes = Math.max(0, Math.ceil(x.years / x.life) - 1);
  const breakEven = (x.hardware * (1 + refreshes) + x.migration) / x.years + x.ownAnnual;
  return { rows, payback, saving, breakEven, upfront: x.hardware + x.migration };
}

export const TCO_PRESETS = [
  {
    id: "slide31",
    label: "课件 p.31：3 年 TCO",
    note: "On-prem：硬件 US$240K（含第 3 年更新）+ 每年机房 18K、软件 30K、1 名 IT 120K… 合计 3 年 624K；Cloud（reserved）：每年约 111K，3 年 332K。这里的「Own」就是 on-premises。",
    x: { years: 3, cloudAnnual: 110667, hardware: 240000, life: 5, ownAnnual: 128000, migration: 0 },
  },
  {
    id: "dhh",
    label: "37signals：课件 p.2 的数字（自报）",
    note: "每年云账单 US$3.2M → 出云后 US$1.3M，买了 US$600K 服务器。只用课件给的数字，没有单独计机房租金、额外人手和迁移成本：这是公司自己报告的口径。",
    x: { years: 5, cloudAnnual: 3200000, hardware: 600000, life: 5, ownAnnual: 1300000, migration: 0 },
  },
  {
    id: "careful",
    label: "37signals：加上保守假设（我的假设）",
    note: "示意数字：服务器多买 50% 作为应对突发的余量（US$900K）；每年加机房 US$250K、2 名运维 US$400K；一次性迁移 US$300K（工程师几个月不做产品）。看结论会不会变。",
    x: { years: 5, cloudAnnual: 3200000, hardware: 900000, life: 5, ownAnnual: 1950000, migration: 300000 },
  },
  {
    id: "startup",
    label: "初创公司（示意）",
    note: "示意数字：每年云账单只有 US$200K，需求不可预测。买硬件要 US$300K、每年还要 1 名运维，出云很难回本。",
    x: { years: 3, cloudAnnual: 200000, hardware: 300000, life: 4, ownAnnual: 160000, migration: 80000 },
  },
];

export const fmtUsd = (n) => {
  const s = n < 0 ? "−" : "";
  const a = Math.abs(n);
  return a >= 1e6 ? `${s}US$${(a / 1e6).toFixed(2)}M` : `${s}US$${Math.round(a / 1000)}K`;
};
