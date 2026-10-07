// Pure logic for <PriorityScoreLab /> and <BudgetMixLab /> (ISOM 5070 Week 7), shared with scripts/lib/mdx-core.mjs.
//
// Priority scoring — two formulas from the slides:
//   p.7  Priority score      = Expected loss reduction × Control confidence × Strategic relevance
//                              ─────────────────────────────────────────────────────────────────
//                                              Cost × Time to value
//   p.20 Investment priority = Annual loss reduction + Tail-risk reduction + Compliance/resilience value
//                              ─────────────────────────────────────────────────────────────────────
//                                       Total cost of ownership × Time to benefit × Delivery risk
// The slides give no numbers for these; the inputs below are illustrative (US$k, years). Costs come from
// the case-study line items on p.30–34 where one exists. The funding decision layers p.18 ④ (foundational
// controls are funded even when narrow ROI looks modest) and p.21 / p.24 (fund only once prerequisites
// exist) on top of the score — that combination is my modeling of the slides, not a slide formula.

export const FORMULAS = {
  simple: { id: "simple", label: "p.7 Priority score", num: "Expected loss reduction × Control confidence × Strategic relevance", den: "Cost × Time to value" },
  full: { id: "full", label: "p.20 Investment priority", num: "Annual loss reduction + Tail-risk reduction + Compliance/resilience value", den: "TCO × Time to benefit × Delivery risk" },
};

export const DELIVERY_RISK = [
  { v: 1, label: "低 ×1" },
  { v: 1.5, label: "中 ×1.5" },
  { v: 2, label: "高 ×2" },
];

// alr = annual (expected) loss reduction, tail = tail-risk (P95/P99) reduction, comp = compliance/resilience value,
// cost = TCO, time = years to benefit, risk = delivery-risk multiplier, conf = control confidence 0–1, rel = strategic relevance 1–5.
export const INITIATIVES = [
  {
    id: "mfa-pam",
    name: "Phishing-resistant MFA + PAM",
    scenario: "Credential theft / privileged takeover",
    costNote: "p.30：MFA US$70k + PAM US$95k",
    alr: 900, tail: 1500, comp: 300, cost: 165, time: 0.25, risk: 1, conf: 0.8, rel: 5,
    foundational: true,
    slideDecision: "Fund immediately",
  },
  {
    id: "backup",
    name: "Immutable backup + clean recovery",
    scenario: "Ransomware / destructive attack",
    costNote: "p.32：备份 US$85k + clean room US$55k",
    alr: 700, tail: 2500, comp: 300, cost: 140, time: 0.5, risk: 1, conf: 0.8, rel: 5,
    foundational: true,
    slideDecision: "Fund immediately",
  },
  {
    id: "mdr",
    name: "MDR / SOC use-case engineering",
    scenario: "Undetected intrusion",
    costNote: "p.31：MDR US$95k + SIEM 用例 US$35k",
    alr: 500, tail: 800, comp: 100, cost: 130, time: 0.5, risk: 1.5, conf: 0.6, rel: 4,
    prereq: { label: "已有可用的 telemetry（遥测数据）和明确的响应负责人", met: true, whenMissing: "先补 telemetry 和响应 ownership 再买（p.21：Fund if telemetry and response ownership exist）" },
    slideDecision: "Fund if telemetry and response ownership exist",
  },
  {
    id: "dlp",
    name: "DLP platform expansion",
    scenario: "Investor-data leakage",
    costNote: "全面铺开的估算；p.34 案例只花 US$35k 做邮件 / 协作 / 终端",
    alr: 300, tail: 500, comp: 100, cost: 150, time: 1, risk: 2, conf: 0.5, rel: 3,
    prereq: { label: "敏感数据已分类、有 owner、知道正常的共享流程", met: false, whenMissing: "先小范围试点（pilot），数据分类成熟后再扩大（p.21 / p.24）" },
    slideDecision: "Pilot first; scale based on data classification maturity",
  },
  {
    id: "ai-platform",
    name: "Advanced AI security platform",
    scenario: "AI data leakage / model abuse",
    costNote: "估算；p.34 案例只花 US$30k 做 AI 政策和测试",
    alr: 150, tail: 400, comp: 50, cost: 200, time: 1, risk: 2, conf: 0.3, rel: 2,
    prereq: { label: "已有 AI inventory、使用政策、风险分类和批准的平台", met: false, whenMissing: "先建 AI 清单和政策基线，再有选择地投（p.21 / p.24）" },
    slideDecision: "Fund selectively after AI inventory and policy baseline",
  },
  {
    id: "siem",
    name: "Large SIEM migration",
    scenario: "Undetected intrusion",
    costNote: "估算；p.24 的第一个 go-slow 例子",
    alr: 200, tail: 300, comp: 100, cost: 400, time: 1.5, risk: 2, conf: 0.5, rel: 3,
    prereq: { label: "已有有用的 telemetry、响应负责人和优先检测用例", met: false, whenMissing: "Go slow：先把 telemetry、ownership 和优先用例做出来（p.24）" },
    slideDecision: "Go slow (p.24)",
  },
];

export function scoreSimple(x) {
  const den = x.cost * x.time;
  return den > 0 ? (x.alr * x.conf * x.rel) / den : 0;
}

export function scoreFull(x) {
  const den = x.cost * x.time * x.risk;
  return den > 0 ? (x.alr + x.tail + x.comp) / den : 0;
}

// Decision: foundational → fund now; missing prerequisite → go slow / pilot; otherwise rank by score.
// `fundTop` = how many of the remaining scored initiatives the budget can take this year.
export function decide(items, formula = "full", fundTop = 1) {
  const score = formula === "simple" ? scoreSimple : scoreFull;
  const scored = items.map((x) => ({ ...x, score: score(x) }));
  const order = [...scored].sort((a, b) => b.score - a.score).map((x) => x.id);
  const eligible = scored.filter((x) => !x.foundational && (!x.prereq || x.prereq.met)).sort((a, b) => b.score - a.score);
  const funded = new Set(eligible.slice(0, fundTop).map((x) => x.id));
  return scored
    .map((x) => {
      let verdict, kind, why;
      if (x.foundational) {
        verdict = "Fund immediately";
        kind = "fund";
        why = "基础性控制（p.18 ④）：即使 ROI 看起来一般也要先投";
      } else if (x.prereq && !x.prereq.met) {
        verdict = x.id === "dlp" ? "Pilot first" : "Go slow";
        kind = "slow";
        why = x.prereq.whenMissing;
      } else if (funded.has(x.id)) {
        verdict = "Fund";
        kind = "fund";
        why = "前提条件已满足，分数排在可投范围内";
      } else {
        verdict = "Next year / defer";
        kind = "defer";
        why = "前提已满足，但单位成本的降险效果排不进今年的预算";
      }
      return { ...x, rank: order.indexOf(x.id) + 1, verdict, kind, why };
    })
    .sort((a, b) => a.rank - b.rank);
}

export const fmtScore = (s) => (s >= 10 ? s.toFixed(1) : s.toFixed(2));

// ---------------- Budget mix (p.19 ranges vs the p.29 case allocation) ----------------
// p.19's seven categories plus p.29's contingency reserve (which p.19 has no range for).
// The p.29 case lumps "Data protection and AI controls" (US$120k); here it is split by p.34's line items:
// discovery + DLP + encryption = US$90k data, approved-AI environment + AI testing = US$30k AI.

export const CATEGORIES = [
  {
    id: "identity", name: "Identity, access, and fraud prevention", zh: "身份、访问与反欺诈", min: 20, max: 25, foundation: true,
    funds: "MFA, PAM, identity governance, email security, payment-fraud controls, conditional access",
    page: "p.30",
    items: [
      { name: "Phishing-resistant MFA（管理员、远程访问、邮件、关键 SaaS / 云控制台）", k: 70, owner: "CIO / Head of Infrastructure", outcome: "特权用户 100%、员工 98%+ 覆盖" },
      { name: "Privileged-access management (PAM)", k: 95, owner: "CISO / Infrastructure", outcome: "没有共享管理员账号；限时特权；特权会话留日志" },
      { name: "Conditional access + identity threat detection", k: 45, owner: "CISO / MSSP", outcome: "拦截高风险登录；impossible travel、token 被盗、异常提权告警" },
      { name: "Access governance and recertification", k: 25, owner: "HR / IT / App owners", outcome: "特权访问每季度复核，关键系统访问每年复核" },
      { name: "Payment-fraud controls + finance simulations", k: 35, owner: "CFO / COO", outcome: "改银行信息和付款要独立回拨核实 + 双人授权" },
    ],
  },
  {
    id: "resilience", name: "Resilience and recovery", zh: "韧性与恢复", min: 20, max: 25, foundation: true,
    funds: "Immutable backups, clean-room recovery, disaster recovery, segmentation, incident response, exercises",
    page: "p.32",
    items: [
      { name: "Immutable, encrypted backup（关键数据和配置）", k: 85, owner: "Head of Infrastructure", outcome: "独立的备份凭证；不可篡改保留期；明确的备份覆盖范围" },
      { name: "Critical-service recovery design", k: 45, owner: "COO / CIO", outcome: "OMS/EMS、投资者记录、财务、通信、身份的恢复顺序" },
      { name: "Clean-room / isolated recovery", k: 55, owner: "CIO / MSP", outcome: "不用重新接回被攻陷的生产环境也能恢复" },
      { name: "Restoration testing + ransomware simulation", k: 35, owner: "COO / 业务服务负责人", outcome: "至少两次关键服务按 RTO / RPO 恢复测试" },
      { name: "Crisis comms + BCP integration", k: 20, owner: "COO / General Counsel", outcome: "对投资者、供应商、监管、员工的决策和沟通模板" },
    ],
  },
  {
    id: "detection", name: "Detection and response", zh: "检测与响应", min: 15, max: 20, foundation: true,
    funds: "EDR/XDR, SOC or MDR, SIEM use cases, threat hunting, forensics readiness",
    page: "p.31",
    items: [
      { name: "MDR service with 24/7 monitoring", k: 95, owner: "CISO", outcome: "监控终端、身份、邮件和部分云日志" },
      { name: "EDR expansion", k: 50, owner: "IT Operations", outcome: "终端和关键服务器 98%+ 覆盖" },
      { name: "SIEM / logging use cases for priority scenarios", k: 35, owner: "CISO / MDR provider", outcome: "特权滥用、异常下载、邮箱规则滥用、勒索行为、云管理变更" },
      { name: "IR retainer + forensics readiness", k: 30, owner: "General Counsel / CISO", outcome: "预先谈好的外部律师和取证支持；证据保全流程" },
      { name: "Incident playbooks + executive tabletop", k: 20, owner: "COO / CISO", outcome: "勒索、数据丢失、欺诈、供应商中断、MNPI 场景演练过" },
    ],
  },
  {
    id: "cloud", name: "Vulnerability, cloud, and application security", zh: "漏洞、云与应用安全", min: 15, max: 20,
    funds: "Asset discovery, exposure management, patching, CSPM, secure SDLC, penetration testing",
    page: "p.33",
    items: [
      { name: "Asset inventory + external attack-surface monitoring", k: 35, owner: "IT Operations", outcome: "对外资产清单、owner 和整改状态" },
      { name: "Vulnerability management + patching", k: 35, owner: "CIO / System owners", outcome: "可被利用的关键漏洞按 SLA 修复" },
      { name: "Cloud / SaaS security posture management", k: 40, owner: "Cloud Lead / CISO", outcome: "身份、存储、日志、管理访问、共享的安全基线" },
      { name: "Pen test：投资者门户、远程访问、关键 API", k: 25, owner: "CISO", outcome: "每年一次独立测试 + 整改验证" },
      { name: "Secure development / vendor app assurance", k: 20, owner: "CTO / Procurement", outcome: "重大变更、集成、外部代码的安全关卡" },
    ],
  },
  {
    id: "data", name: "Data security and privacy", zh: "数据安全与隐私", min: 10, max: 15,
    funds: "Classification, encryption, DLP, data-access monitoring, records controls",
    page: "p.34",
    items: [
      { name: "Data discovery + classification（高价值存储库）", k: 35, owner: "CISO / Data owners", outcome: "投资者、员工、交易、研究、MNPI 存储库已识别并有 owner" },
      { name: "DLP for email, collaboration, managed endpoints", k: 35, owner: "CISO / IT", outcome: "高风险外发要拦截或填写理由" },
      { name: "Encryption, secrets and key-management hardening", k: 20, owner: "Infrastructure / Engineering", outcome: "受限数据加密；脚本、代码库、共享盘里没有凭证" },
    ],
  },
  {
    id: "thirdparty", name: "Third-party, governance, and assurance", zh: "第三方、治理与保证", min: 10, max: 15,
    funds: "Vendor risk, cyber-risk quantification, GRC, audits, tabletop testing, training, insurance optimization",
    page: "p.35",
    items: [
      { name: "Critical-vendor mapping + tiered due diligence", k: 35, owner: "Procurement / Op Risk", outcome: "每个关键供应商都有负责人和风险记录" },
      { name: "Contract and resilience enhancement", k: 20, owner: "Legal / Procurement", outcome: "通知、审计、分包、恢复、数据返还、退出条款" },
      { name: "Cyber risk register + board reporting", k: 20, owner: "CISO / CRO", outcome: "头部场景的固有 / 剩余风险、处置、负责人、期限" },
      { name: "Cyber-risk quantification", k: 20, owner: "CRO / Finance / CISO", outcome: "勒索、欺诈、投资者数据泄露的预期年损失和尾部损失区间" },
      { name: "Workforce + high-risk-role training", k: 15, owner: "HR / CISO", outcome: "全员培训；财务、高管、助理、管理员的加强场景" },
      { name: "Vendor-outage + cyber-crisis exercise", k: 15, owner: "COO / CISO", outcome: "验证手工替代流程、沟通和升级" },
      { name: "Independent assurance / internal audit", k: 10, owner: "Internal Audit / Compliance", outcome: "关键控制按设计运作的证据" },
    ],
  },
  {
    id: "ai", name: "Strategic innovation and AI security", zh: "战略创新与 AI 安全", min: 0, max: 10, advanced: true,
    funds: "AI governance, red teaming, security automation, post-quantum readiness, pilot initiatives",
    page: "p.34",
    items: [
      { name: "Approved generative-AI environment + use policy", k: 15, owner: "COO / Legal / CISO", outcome: "批准的工具清单和禁止输入的数据类型" },
      { name: "AI / security testing for material integrations", k: 15, owner: "CISO / Technology Risk", outcome: "评估 prompt injection、过度权限、数据留存、输出完整性" },
    ],
  },
  {
    id: "reserve", name: "Contingency reserve", zh: "应急储备", min: null, max: null,
    funds: "Incident-response retainer, urgent remediation, or priority control gap",
    page: "p.29",
    items: [{ name: "应急储备（p.19 没有这一项）", k: 50, owner: "—", outcome: "IR retainer、紧急整改或优先控制缺口" }],
  },
];

export const caseK = (c) => c.items.reduce((s, it) => s + it.k, 0);

// Shares in percent. "p29" is the slide's case (US$1.2M); "mid" is the midpoint of every p.19 range;
// "tools" is a deliberately tool-heavy mix to show what the checks catch.
export const MIX_PRESETS = [
  { id: "p29", label: "p.29 案例：US$1.2M", total: 1200, shares: Object.fromEntries(CATEGORIES.map((c) => [c.id, (caseK(c) / 1200) * 100])) },
  { id: "mid", label: "p.19 区间中点", total: 1200, shares: { identity: 22.5, resilience: 22.5, detection: 17.5, cloud: 17.5, data: 12.5, thirdparty: 12.5, ai: 5, reserve: 0 } },
  { id: "tools", label: "反例：工具堆砌型", total: 1200, shares: { identity: 12, resilience: 10, detection: 35, cloud: 15, data: 10, thirdparty: 3, ai: 15, reserve: 0 } },
];

// lowMaturity = "a firm without reliable recovery capability" (p.19): identity / recovery / detection should sit in
// the upper half of their ranges and AI tooling at the low end (≤ 5%) — my reading of p.19's sentence.
export function checkMix(shares, total, lowMaturity = false) {
  const sum = Object.values(shares).reduce((s, v) => s + v, 0);
  const rows = CATEGORIES.map((c) => {
    const pct = shares[c.id] ?? 0;
    const k = (pct / 100) * total;
    let status = "na";
    if (c.min !== null) status = pct < c.min - 0.05 ? "below" : pct > c.max + 0.05 ? "above" : "in";
    let note = "";
    if (lowMaturity && c.foundation && status === "in" && pct < (c.min + c.max) / 2) note = "恢复能力不可靠时应放在区间上半段";
    if (lowMaturity && c.advanced && pct > 5) note = "恢复能力不可靠时，AI / 高级工具先压到 5% 以下";
    return { ...c, pct, k, status, note, scale: caseK(c) ? k / caseK(c) : 0 };
  });
  const foundation = rows.filter((r) => r.foundation).reduce((s, r) => s + r.pct, 0);
  return { rows, sum, foundation, flags: rows.filter((r) => r.status === "below" || r.status === "above" || r.note).length };
}

export const fmtK = (k) => (k >= 1000 ? `US$${(k / 1000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M` : `US$${Math.round(k).toLocaleString("en-US")}k`);
export const fmtPct1 = (p) => `${p.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
export const rangeText = (c) => (c.min === null ? "—（p.19 无）" : `${c.min}–${c.max}%`);
