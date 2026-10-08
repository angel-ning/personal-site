// Pure logic for <CalcDrill /> — random calculation questions for the ISOM 5280 final
// (the lecturer said to bring a calculator for the BIA / risk questions).
// Four kinds, all reusing the formulas the lesson notes already implement:
//   ale  — Lesson 6 p.13: SLE = AV × EF, ALE = SLE × ARO
//   cba  — textbook Ch.4: CBA = ALE(before) − ALE(after) − ACS
//   bia  — Lesson 6 p.12: downtime = RTO + WRT vs MTD; worst data loss = backup interval vs RPO
//   risk — Lesson 5 p.36: Loss Frequency × Loss Magnitude ± uncertainty vs Risk Appetite
// Questions are generated from a numeric seed so server and client render the same question.
// Shared with scripts/lib/mdx-core.mjs for the exported Markdown table.

import { computeAle, computeTimeline, fmtUsd, fmtH } from "./bia-logic.mjs";
import { computeRisk } from "./risk-logic.mjs";

export const KINDS = [
  { id: "ale", label: "SLE / ALE" },
  { id: "cba", label: "值不值得买（CBA）" },
  { id: "bia", label: "MTD / RPO 达标吗" },
  { id: "risk", label: "L5 定量风险" },
];

// mulberry32: small deterministic PRNG.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const num = (n) => Number(round(n, 4)).toLocaleString("en-US", { maximumFractionDigits: 4 });

const AROS = [
  { text: "每年 3 次", aro: 3 },
  { text: "每年 2 次", aro: 2 },
  { text: "每年 1 次", aro: 1 },
  { text: "每 2 年一次", aro: 0.5 },
  { text: "每 4 年一次", aro: 0.25 },
  { text: "每 5 年一次", aro: 0.2 },
  { text: "每 10 年一次", aro: 0.1 },
  { text: "每 20 年一次", aro: 0.05 },
];
const ASSETS = [
  { name: "客户数据库", av: [400_000, 800_000, 1_200_000] },
  { name: "网上银行服务器", av: [500_000, 1_000_000, 2_000_000] },
  { name: "计费系统", av: [200_000, 300_000, 600_000] },
  { name: "电商网站", av: [150_000, 250_000, 500_000] },
];
const THREATS = ["勒索软件攻击", "DDoS 攻击", "数据泄露", "内部人员误操作"];

function genAle(r) {
  const asset = pick(r, ASSETS);
  const av = pick(r, asset.av);
  const efPct = pick(r, [10, 20, 25, 30, 40, 50, 60, 75]);
  const freq = pick(r, AROS);
  const threat = pick(r, THREATS);
  const { sle, ale } = computeAle({ av, efPct, aro: freq.aro, efAfterPct: 0, aroAfter: 0, acs: 0 });
  return {
    kind: "ale",
    prompt: `${asset.name}价值 ${fmtUsd(av)}。一次${threat}会损失其价值的 ${efPct}%，预计${freq.text}。求 SLE 和 ALE。`,
    answers: [
      { key: "sle", label: "SLE", type: "num", value: sle, unit: "US$" },
      { key: "ale", label: "ALE", type: "num", value: ale, unit: "US$/年" },
    ],
    steps: [
      `SLE = AV × EF = ${fmtUsd(av)} × ${efPct}% = ${fmtUsd(sle)}`,
      `ARO：${freq.text} → ${freq.aro}`,
      `ALE = SLE × ARO = ${fmtUsd(sle)} × ${freq.aro} = ${fmtUsd(ale)}`,
    ],
  };
}

function genCba(r) {
  const asset = pick(r, ASSETS);
  const av = pick(r, asset.av);
  const efPct = pick(r, [20, 25, 40, 50, 60]);
  const iBefore = Math.floor(r() * 4); // one of the four most frequent AROs
  const before = AROS[iBefore];
  const after = AROS[iBefore + 2 + Math.floor(r() * 3)];
  const control = pick(r, ["MFA + EDR", "SOAR 自动化响应", "异地备份", "WAF"]);
  const base = computeAle({ av, efPct, aro: before.aro, efAfterPct: efPct, aroAfter: after.aro, acs: 0 });
  const saving = base.ale - base.aleAfter;
  const acs = Math.max(1000, Math.round((saving * pick(r, [0.4, 0.6, 0.8, 1.2, 1.5])) / 1000) * 1000);
  const res = computeAle({ av, efPct, aro: before.aro, efAfterPct: efPct, aroAfter: after.aro, acs });
  return {
    kind: "cba",
    prompt: `${asset.name}价值 ${fmtUsd(av)}，一次攻击损失 ${efPct}%，目前${before.text}。部署 ${control} 每年花 ${fmtUsd(acs)}，可以把发生频率降到${after.text}（EF 不变）。求控制前后的 ALE 和 CBA，值得买吗？`,
    answers: [
      { key: "aleBefore", label: "ALE（控制前）", type: "num", value: res.ale, unit: "US$/年" },
      { key: "aleAfter", label: "ALE（控制后）", type: "num", value: res.aleAfter, unit: "US$/年" },
      { key: "cba", label: "CBA", type: "num", value: res.cba, unit: "US$/年" },
      { key: "worth", label: "结论", type: "bool", value: res.worth, yes: "值得买", no: "不值得" },
    ],
    steps: [
      `SLE = ${fmtUsd(av)} × ${efPct}% = ${fmtUsd(res.sle)}`,
      `ALE（前）= ${fmtUsd(res.sle)} × ${before.aro} = ${fmtUsd(res.ale)}`,
      `ALE（后）= ${fmtUsd(res.sle)} × ${after.aro} = ${fmtUsd(res.aleAfter)}`,
      `CBA = ALE前 − ALE后 − ACS = ${fmtUsd(res.ale)} − ${fmtUsd(res.aleAfter)} − ${fmtUsd(acs)} = ${fmtUsd(res.cba)}`,
      res.worth ? "CBA > 0 → 经济上划算" : "CBA ≤ 0 → 每年省下的损失还不够付控制的钱，不划算",
    ],
  };
}

function genBia(r) {
  const system = pick(r, ["核心银行系统", "支付网关", "电商订单系统", "邮件系统"]);
  const rto = pick(r, [1, 2, 3, 4, 6]);
  const wrt = pick(r, [0.5, 1, 2, 3]);
  const mtd = pick(r, [3, 4, 5, 6, 8, 12]);
  const rpoTarget = pick(r, [0.25, 1, 4, 12, 24]);
  const backupInterval = pick(r, [0.25, 1, 4, 12, 24]);
  const t = computeTimeline({ rpoTarget, backupInterval, rto, wrt, mtd });
  return {
    kind: "bia",
    prompt: `${system}：MTD = ${fmtH(mtd)}，RPO = ${fmtH(rpoTarget)}。恢复方案的 RTO = ${fmtH(rto)}，WRT = ${fmtH(wrt)}，每 ${fmtH(backupInterval)}备份一次。业务停机多久？最坏丢多少数据？两项是否达标？`,
    answers: [
      { key: "downtime", label: "停机时长（小时）", type: "num", value: t.downtime, unit: "小时" },
      { key: "mtdOk", label: "MTD", type: "bool", value: t.mtdOk, yes: "达标", no: "超出" },
      { key: "loss", label: "最坏数据丢失（小时）", type: "num", value: t.worstDataLoss, unit: "小时" },
      { key: "rpoOk", label: "RPO", type: "bool", value: t.rpoOk, yes: "达标", no: "不达标" },
    ],
    steps: [
      `停机 = RTO + WRT = ${fmtH(rto)} + ${fmtH(wrt)} = ${fmtH(t.downtime)}`,
      t.mtdOk ? `${fmtH(t.downtime)} ≤ MTD ${fmtH(mtd)} → 达标` : `${fmtH(t.downtime)} > MTD ${fmtH(mtd)} → 超出 ${fmtH(-t.slack)}（只看 RTO 会误判）`,
      `最坏情况：事故刚好发生在下一次备份之前 → 丢 ${fmtH(backupInterval)}的数据`,
      t.rpoOk ? `${fmtH(backupInterval)} ≤ RPO ${fmtH(rpoTarget)} → 达标` : `${fmtH(backupInterval)} > RPO ${fmtH(rpoTarget)} → 不达标，要提高备份频率`,
    ],
  };
}

function genRisk(r) {
  const assetValue = pick(r, [100, 200, 500, 1000]);
  const attackLikelihoodPct = pick(r, [10, 20, 25, 30, 40, 50]);
  const successProbPct = pick(r, [20, 25, 40, 50, 60, 80]);
  const probableLossPct = pick(r, [20, 40, 50, 60, 80]);
  const uncertaintyPct = pick(r, [0, 10, 20]);
  const point = (attackLikelihoodPct / 100) * (successProbPct / 100) * assetValue * (probableLossPct / 100);
  const riskAppetite = round(point * pick(r, [0.8, 0.95, 1.05, 1.15, 1.4]), 1);
  const res = computeRisk({ assetValue, attackLikelihoodPct, successProbPct, probableLossPct, uncertaintyPct, riskAppetite });
  return {
    kind: "risk",
    prompt: `资产价值 ${assetValue}（$k）。被攻击的可能性 ${attackLikelihoodPct}%，攻击成功率 ${successProbPct}%，一旦成功损失 ${probableLossPct}%，所有估计 ±${uncertaintyPct}%。Risk Appetite = ${riskAppetite}。按 Lesson 5 的四步算，并决定 Accept 还是 Treat。`,
    answers: [
      { key: "lf", label: "Loss Frequency（%）", type: "num", value: res.lossFrequencyPct, unit: "%" },
      { key: "lm", label: "Loss Magnitude", type: "num", value: res.lossMagnitude, unit: "$k" },
      { key: "risk", label: "Calculated Risk（点估计）", type: "num", value: res.calculatedRisk, unit: "$k" },
      { key: "high", label: "区间上限", type: "num", value: res.rangeHigh, unit: "$k" },
      { key: "accept", label: "决定", type: "bool", value: res.acceptable, yes: "Accept", no: "Treat" },
    ],
    steps: [
      `① Loss Frequency = ${attackLikelihoodPct}% × ${successProbPct}% = ${num(res.lossFrequencyPct)}%`,
      `② Loss Magnitude = ${assetValue} × ${probableLossPct}% = ${num(res.lossMagnitude)}`,
      `③ Risk = ${num(res.lossFrequencyPct)}% × ${num(res.lossMagnitude)} = ${num(res.calculatedRisk)}，±${uncertaintyPct}% → ${num(res.rangeLow)} ~ ${num(res.rangeHigh)}`,
      res.acceptable
        ? `④ 区间上限 ${num(res.rangeHigh)} ≤ Risk Appetite ${riskAppetite} → Accept`
        : `④ 区间上限 ${num(res.rangeHigh)} > Risk Appetite ${riskAppetite} → Treat（按上限判断，不按点估计）`,
    ],
  };
}

const GEN = { ale: genAle, cba: genCba, bia: genBia, risk: genRisk };

export function makeQuestion(kind, seed) {
  const k = kind === "all" ? KINDS[seed % KINDS.length].id : kind;
  return GEN[k](rng(seed * 7919 + k.length));
}

// Numeric answers accept ±0.5% (or ±0.01 for values near zero); strips $ and commas.
export function checkNum(input, value) {
  const n = Number(String(input).replace(/[$,\s%−]/g, (c) => (c === "−" ? "-" : "")));
  if (String(input).trim() === "" || Number.isNaN(n)) return null;
  return Math.abs(n - value) <= Math.max(0.01, Math.abs(value) * 0.005);
}

export const fmtAnswer = (a) => {
  if (a.type === "bool") return a.value ? a.yes : a.no;
  if (a.unit.startsWith("US$")) return fmtUsd(a.value);
  return `${num(a.value)} ${a.unit}`;
};
