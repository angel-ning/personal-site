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
