// Pure BIA logic for <BiaTimeLab /> and <AleCalculator /> (ISOM 5280 Lesson 6, p.12-14).
// Shared with scripts/lib/mdx-core.mjs for the exported Markdown tables.

// ---------- Recovery timeline: RPO / RTO / WRT / MTD (p.12) ----------
// Slide diagram: last backup ──RPO── incident strikes ──RTO── systems recovered ──WRT── resume operations.
// MTD spans incident → resume operations, so the plan only works when RTO + WRT ≤ MTD.
// dataLossHours = time between the last good backup and the incident (actual data lost);
// rpoTarget = how much data loss the business says it can tolerate.

export function computeTimeline({ rpoTarget, backupInterval, rto, wrt, mtd }) {
  const downtime = rto + wrt;
  const slack = mtd - downtime;
  const worstDataLoss = backupInterval; // incident right before the next backup
  return {
    downtime,
    slack,
    mtdOk: downtime <= mtd,
    worstDataLoss,
    rpoOk: worstDataLoss <= rpoTarget,
  };
}

export const TIMELINE_PRESETS = [
  { id: "bank", label: "银行核心系统（达标）", rpoTarget: 0.25, backupInterval: 0.25, rto: 2, wrt: 1, mtd: 4 },
  { id: "slow-validate", label: "同上，但测试验证拖太久", rpoTarget: 0.25, backupInterval: 0.25, rto: 2, wrt: 3, mtd: 4 },
  { id: "daily-backup", label: "电商订单库：每天才备份一次", rpoTarget: 1, backupInterval: 24, rto: 4, wrt: 2, mtd: 12 },
  { id: "custom", label: "自定义", rpoTarget: 4, backupInterval: 4, rto: 8, wrt: 4, mtd: 24 },
];

// ISOM 5070 Week 6 p.33: MTPD / RTO / RPO per investment-management service. That slide has no WRT,
// so wrt = 0 and the check becomes RTO ≤ MTPD. Where the slide gives a range, the lower end is used;
// 1 business day is counted as 24 h to keep one unit.
export const MTPD_PRESETS = [
  { id: "trade", label: "交易执行 / 订单管理", rpoTarget: 0.25, backupInterval: 0.25, rto: 1, wrt: 0, mtd: 2, fallback: "人工下单流程 + 双人审批 + 电话录音确认" },
  { id: "valuation", label: "组合估值 / 风险监控", rpoTarget: 1, backupInterval: 1, rto: 4, wrt: 0, mtd: 24, fallback: "备用风险环境 + 受控的 spreadsheet 敞口报告" },
  { id: "cash", label: "资金划转 / 支付控制", rpoTarget: 0.25, backupInterval: 0.25, rto: 2, wrt: 0, mtd: 4, fallback: "银行网银后备 + 职责分离核验 + 电话回拨确认" },
  { id: "investor", label: "投资者报告", rpoTarget: 24, backupInterval: 24, rto: 24, wrt: 0, mtd: 48, fallback: "用上一期数据 + 受控的人工制作 + 通知客户" },
  { id: "email", label: "企业邮件 / 协作", rpoTarget: 4, backupInterval: 4, rto: 4, wrt: 0, mtd: 24, fallback: "应急协作渠道 + 预先建好的电话 / 短信 call tree" },
  { id: "trade-slow", label: "✗ 交易系统，但恢复要 3 小时", rpoTarget: 0.25, backupInterval: 0.25, rto: 3, wrt: 0, mtd: 2, fallback: "RTO 超过 MTPD：人工下单流程必须撑过这个缺口，否则伤害不可接受" },
  { id: "cash-backup", label: "✗ 支付系统，但每 4 小时才备份", rpoTarget: 0.25, backupInterval: 4, rto: 2, wrt: 0, mtd: 4, fallback: "RPO 不达标：最坏会丢 4 小时的支付指令，要逐笔对账补录（p.35 reconciliation controls）" },
  { id: "custom", label: "自定义", rpoTarget: 1, backupInterval: 1, rto: 4, wrt: 0, mtd: 8, fallback: "" },
];

export const fmtH = (h) => {
  if (h < 1) return `${Math.round(h * 60)} 分钟`;
  return `${Number(h.toFixed(2))} 小时`;
};

// ---------- Dollar impact: AV × EF = SLE, SLE × ARO = ALE (p.13) ----------
// Cost-benefit (textbook WM Ch.4): CBA = ALE(prior) − ALE(post) − ACS (annual cost of safeguard).

export function computeAle({ av, efPct, aro, efAfterPct, aroAfter, acs }) {
  const sle = av * (efPct / 100);
  const ale = sle * aro;
  const sleAfter = av * (efAfterPct / 100);
  const aleAfter = sleAfter * aroAfter;
  const cba = ale - aleAfter - acs;
  return { sle, ale, sleAfter, aleAfter, cba, worth: cba > 0 };
}

export const ALE_PRESETS = [
  {
    id: "ransomware",
    label: "勒索软件 × 计费系统，加 MFA + EDR",
    av: 1_000_000,
    efPct: 40,
    aro: 0.5,
    efAfterPct: 40,
    aroAfter: 0.1,
    acs: 50_000,
  },
  {
    id: "too-expensive",
    label: "同一风险，但控制每年花 25 万",
    av: 1_000_000,
    efPct: 40,
    aro: 0.5,
    efAfterPct: 40,
    aroAfter: 0.1,
    acs: 250_000,
  },
  {
    id: "flood",
    label: "洪水 × 数据中心（50 年一遇），建异地灾备",
    av: 5_000_000,
    efPct: 60,
    aro: 0.02,
    efAfterPct: 10,
    aroAfter: 0.02,
    acs: 100_000,
  },
];

export const fmtUsd = (n) => `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
