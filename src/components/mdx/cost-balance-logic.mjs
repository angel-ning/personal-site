// Pure logic for <CostBalanceLab /> (ISOM 5280 Lesson 6 p.14, Figure 5-5 Cost balancing):
// faster recovery options cost more to keep ready, slower ones lose more while the business is down.
// Total yearly cost = option's yearly cost + expected disruption cost (ARO × downtime × loss per hour).
// The option figures are illustrative assumptions, not slide numbers.

export const RECOVERY_OPTIONS = [
  { id: "tape", label: "Tape backup（磁带备份，异地保存）", yearlyCost: 20_000, downtimeH: 72 },
  { id: "cold", label: "Cold site（冷备：有场地，设备要临时装）", yearlyCost: 50_000, downtimeH: 48 },
  { id: "warm", label: "Warm site（温备：设备已装好，数据要恢复）", yearlyCost: 120_000, downtimeH: 12 },
  { id: "hot", label: "Hot site（热备：随时可切换）", yearlyCost: 300_000, downtimeH: 2 },
  { id: "mirror", label: "System mirror（系统镜像，实时同步）", yearlyCost: 600_000, downtimeH: 0.25 },
];

export const COST_PRESETS = [
  { label: "网上银行（每小时损失大）", lossPerHour: 80_000, aro: 0.5, mtd: 4 },
  { label: "电商网站（MTD 只有 8 小时）", lossPerHour: 15_000, aro: 0.5, mtd: 8 },
  { label: "内部报表系统（停几天也还好）", lossPerHour: 1_000, aro: 1, mtd: 96 },
];

/** Cost of each option for the given loss per hour, yearly incident rate and MTD; marks the cheapest one that meets the MTD. */
export function costBalance({ lossPerHour, aro, mtd }) {
  const rows = RECOVERY_OPTIONS.map((o) => {
    const disruption = aro * o.downtimeH * lossPerHour;
    return { ...o, disruption, total: o.yearlyCost + disruption, meetsMtd: o.downtimeH <= mtd };
  });
  const cheapest = rows.reduce((a, b) => (b.total < a.total ? b : a));
  const feasible = rows.filter((r) => r.meetsMtd);
  const best = feasible.length ? feasible.reduce((a, b) => (b.total < a.total ? b : a)) : null;
  return { rows, cheapestId: cheapest.id, bestId: best?.id ?? null, mtdForcesUpgrade: best && best.id !== cheapest.id };
}

export const fmtK = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
