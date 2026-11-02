// ISOM 5100 Assignment 1: the LearnSphere / EduConnect 360 business case.
// Shared by <CrmCaseLab /> and scripts/mdx-to-md.mjs.
// All money in US$. Case figures: US$134 contribution per extra repeat enrollment; US$6.40 per ticket;
// 25,088 projected 2026 tickets; US$92,000 per mid-sized corporate account; first-year cash outflow
// US$1.05M; ongoing US$0.50–0.65M a year; benefits measurable from 2028 at the earliest.

export const CASE_FACTS = {
  contribPerRepeat: 134,
  costPerTicket: 6.4,
  tickets: 25088,
  accountValue: 92000,
  firstYear: 1050000,
  ongoingLow: 500000,
  ongoingHigh: 650000,
};

export function businessCase(x) {
  const f = CASE_FACTS;
  const extraRepeats = Math.round((x.eligible * x.repeatPts) / 100);
  const repeat = extraRepeats * f.contribPerRepeat;
  const tickets = Math.round(f.tickets * (x.ticketCut / 100) * f.costPerTicket);
  const corporate = Math.round(x.accounts * f.accountValue * (x.corpMargin / 100));
  const benefit = repeat + tickets + corporate + x.advisor;
  const net = benefit - x.ongoing;
  // 2027 = implementation year (no benefit); 2028+ = full benefit.
  const years = [];
  let cum = 0;
  for (let i = 0; i < 4; i++) {
    const flow = i === 0 ? -f.firstYear : net;
    cum += flow;
    years.push({ year: 2027 + i, flow, cum });
  }
  const payback = net > 0 ? 2027 + Math.ceil(f.firstYear / net) : null;
  return { extraRepeats, repeat, tickets, corporate, benefit, net, years, payback };
}

export const CASE_PRESETS = [
  {
    id: "vendor",
    label: "按 Exhibit 9 上限（偏乐观）",
    note: "把 128,000 次 enrollment 全当作合格的独立个人学员，repeat +5 个百分点。案例自己说这只是示意，真实人数要先核实。",
    x: { eligible: 128000, repeatPts: 5, ticketCut: 20, accounts: 3, corpMargin: 48, advisor: 0, ongoing: 500000 },
  },
  {
    id: "mid",
    label: "中间情况",
    note: "合格学员按 128,000 计，repeat +3 个百分点，工单减 15%，保住 2 个企业客户，持续成本取中间值。",
    x: { eligible: 128000, repeatPts: 3, ticketCut: 15, accounts: 2, corpMargin: 48, advisor: 0, ongoing: 575000 },
  },
  {
    id: "cautious",
    label: "保守（我的假设）",
    note: "假设剔除企业学员和重复报名后，合格的独立个人学员只有约 60,000 人（示意数字，案例没给）。repeat +2，工单减 10%，保住 2 个企业客户，持续成本取上限。",
    x: { eligible: 60000, repeatPts: 2, ticketCut: 10, accounts: 2, corpMargin: 48, advisor: 0, ongoing: 650000 },
  },
];

export const fmtUsdK = (n) => {
  const s = n < 0 ? "−" : "";
  const a = Math.abs(n);
  return a >= 1e6 ? `${s}US$${(a / 1e6).toFixed(2)}M` : `${s}US$${Math.round(a / 1000)}K`;
};
