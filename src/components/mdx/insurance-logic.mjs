// Cyber insurance as a financial layer on top of a loss, shared with scripts/mdx-to-md.mjs (Week 4 p.10).
// Insurance Recovery = min(max(Gross Covered Loss − Retention, 0), Limit)
// Net Retained Loss = Gross Covered Loss − Insurance Recovery + Uncovered Loss + Premium

export function computeInsurance({ grossCovered, retention, limit, uncovered, premium }) {
  const recovery = Math.min(Math.max(grossCovered - retention, 0), limit);
  const netRetained = grossCovered - recovery + uncovered + premium;
  return { recovery, netRetained };
}

// A US$9.3M most-likely ransomware loss (Week 3 p.32) hitting a policy with a US$0.5M
// retention and US$5M limit: most of the loss is covered, but the excess above the limit
// and anything the policy excludes (e.g. an OT/business-interruption sublimit) stays with the firm.
export const INSURANCE_PRESETS = [
  {
    id: "ransomware",
    label: "Ransomware 损失投保（示例）",
    grossCovered: 9.3,
    retention: 0.5,
    limit: 5.0,
    uncovered: 1.0,
    premium: 0.3,
  },
  {
    id: "custom",
    label: "自定义",
    grossCovered: 4,
    retention: 0.2,
    limit: 3,
    uncovered: 0.3,
    premium: 0.15,
  },
];

export const fmtM = (m) => `US$${m.toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
