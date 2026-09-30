// Pure logic for <SeverityLadder /> (ISOM 5070 Week 6 p.16, p.18).
// The slide lists four levels with example facts. Here each fact the responder can observe is tied to
// the lowest level whose example mentions it, and the incident takes the highest level any fact reaches
// ("the worst dimension decides") — p.18's severity matrix weighs service impact, data sensitivity,
// attacker activity, affected population, regulatory triggers and recoverability together.

export const LEVELS = [
  null,
  { n: 1, en: "Security event", zh: "安全事件", lead: "SOC / security operations", response: "Investigate, document, close or escalate（调查、记录，关闭或升级）" },
  { n: 2, en: "Contained incident", zh: "已遏制的事件", lead: "Incident commander", response: "Contain, investigate, eradicate, notify defined internal owners（遏制、调查、根除，通知内部负责人）" },
  { n: 3, en: "Major incident", zh: "重大事件", lead: "CISO / incident commander with executive oversight", response: "Mobilize legal, compliance, business continuity, communications, and executive sponsors（拉上法务、合规、BCP、公关和高管）" },
  { n: 4, en: "Crisis", zh: "危机", lead: "Crisis director / executive crisis-management team", response: "Formal crisis declaration, board escalation, stakeholder communications, recovery governance（正式宣布危机、上报董事会）" },
];

// Each dimension: options ordered by level. `level` = the p.16 row whose example mentions this fact.
export const DIMENSIONS = [
  {
    id: "spread",
    label: "攻击扩散范围",
    options: [
      { level: 1, label: "被拦截 / 只在一台设备上被阻止" },
      { level: 2, label: "一个账号或少量终端中招" },
      { level: 3, label: "多个系统受影响" },
      { level: 4, label: "大范围勒索软件（broad ransomware）" },
    ],
  },
  {
    id: "data",
    label: "数据",
    options: [
      { level: 1, label: "没有数据外泄迹象" },
      { level: 3, label: "很可能有数据暴露（likely exposure）" },
      { level: 4, label: "确认重大数据泄露（confirmed material breach）" },
    ],
  },
  {
    id: "service",
    label: "业务服务",
    options: [
      { level: 1, label: "关键服务不受影响" },
      { level: 3, label: "中断时长逼近 RTO" },
      { level: 4, label: "关键服务长时间中断 / 交易或支付受影响" },
    ],
  },
  {
    id: "vendor",
    label: "第三方",
    options: [
      { level: 1, label: "不涉及关键供应商" },
      { level: 3, label: "关键供应商被攻陷" },
    ],
  },
  {
    id: "external",
    label: "外部 / 监管",
    options: [
      { level: 1, label: "没有外部曝光或监管触发" },
      { level: 4, label: "可信的媒体 / 公众风险，或重大监管暴露" },
    ],
  },
];

export function classifySeverity(picks) {
  const hits = DIMENSIONS.map((d) => {
    const opt = d.options[picks[d.id] ?? 0] ?? d.options[0];
    return { id: d.id, label: d.label, opt };
  });
  const n = Math.max(...hits.map((h) => h.opt.level));
  const drivers = hits.filter((h) => h.opt.level === n && n > 1);
  return { level: LEVELS[n], drivers, crisis: n === 4, executive: n >= 3 };
}

// picks = index into each dimension's options.
export const SEVERITY_PRESETS = [
  { id: "phish", label: "钓鱼邮件被拦截", picks: { spread: 0, data: 0, service: 0, vendor: 0, external: 0 } },
  { id: "one-account", label: "一个账号被盗，已禁用", picks: { spread: 1, data: 0, service: 0, vendor: 0, external: 0 } },
  { id: "fs02", label: "p.10 勒索：FS-02 + 14 台终端，支付不受影响", picks: { spread: 2, data: 0, service: 0, vendor: 0, external: 0 } },
  { id: "vendor", label: "关键供应商（MSP）被攻陷", picks: { spread: 1, data: 0, service: 0, vendor: 1, external: 0 } },
  { id: "p25", label: "p.25 投资公司勒索 + 数据外泄", picks: { spread: 3, data: 1, service: 1, vendor: 0, external: 1 } },
];
