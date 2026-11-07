// ISOM 6200 Lecture 2: a combined accuracy can pass while a group fails (Slide 40 synthetic trial, Harbor L2-A4).
import { pct, wilson } from "./pilot-logic.mjs";

export { pct };

export const SUBGROUP_PRESETS = [
  {
    id: "slide40",
    label: "Slide 40 合成试验",
    target: 0.9,
    groups: [
      { id: "A", label: "Language A", n: 200, ok: 194, escalation: null },
      { id: "B", label: "Language B", n: 100, ok: 78, escalation: null },
    ],
    note: "和后面的 Harbor 案例无关，是另一组合成数据。",
  },
  {
    id: "harbor",
    label: "Harbor L2-A4 扩展试验",
    target: 0.9,
    groups: [
      { id: "A", label: "Language A", n: 200, ok: 178, escalation: "未单独记录" },
      { id: "B", label: "Language B", n: 100, ok: 92, escalation: "没有测试记录（L2-A5），帮助页只有英文" },
    ],
    note: "签字的扩展标准：每种语言 ≥ 90% 正确，并且两种语言都有可用的升级渠道。没有错误样例和代表性分析。",
  },
];

/**
 * @param {{ target: number, groups: { id: string, label: string, n: number, ok: number, escalation?: string | null }[] }} p
 */
export function subgroupCheck({ target, groups }) {
  const rows = groups.map((g) => {
    const ok = Math.min(g.ok, g.n);
    const rate = g.n ? ok / g.n : 0;
    const ci = wilson(ok, g.n);
    return { ...g, ok, rate, ci, meets: rate >= target - 1e-9, sure: ci.lo >= target };
  });
  const n = rows.reduce((s, r) => s + r.n, 0);
  const ok = rows.reduce((s, r) => s + r.ok, 0);
  const rate = n ? ok / n : 0;
  const combined = { n, ok, rate, ci: wilson(ok, n), meets: rate >= target - 1e-9 };
  const failing = rows.filter((r) => !r.meets);
  const gap = rows.length ? Math.max(...rows.map((r) => r.rate)) - Math.min(...rows.map((r) => r.rate)) : 0;
  const escalationGaps = rows.filter((r) => r.escalation);

  let verdict;
  if (failing.length && combined.meets) verdict = `合计 ${pct(rate)} 看起来达标，但 ${failing.map((r) => `${r.label} ${pct(r.rate)}`).join("、")} 没达到每组 ${pct(target)} 的标准——平均数把它盖住了。`;
  else if (failing.length) verdict = `${failing.map((r) => `${r.label} ${pct(r.rate)}`).join("、")} 没达标，合计也没达标。`;
  else verdict = `每组都达到 ${pct(target)}（点估计）。${rows.some((r) => !r.sure) ? "但有的组 95% 区间下限低于标准，样本还不足以下定论。" : ""}`;

  return { rows, combined, failing, gap, verdict, escalationGaps };
}
