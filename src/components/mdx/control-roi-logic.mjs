// Financial value of a security control, shared with scripts/mdx-to-md.mjs (Week 4 p.9).
// Expected Benefit = Baseline Expected Loss − Residual Expected Loss
// Net Benefit = Expected Benefit − Control Lifecycle Cost
// ROI = (Expected Benefit − Control Cost) / Control Cost

export function computeControlRoi({ baseline, residual, cost }) {
  const benefit = baseline - residual;
  const net = benefit - cost;
  const roi = cost > 0 ? net / cost : null;
  return { benefit, net, roi };
}

// Week 4 slide's MFA + PAM case (p.13, using the annual-loss-exposure figures from Week 3 p.29):
// baseline US$6.0M, residual US$2.2M, cost US$1.8M upfront + US$0.4M/yr amortized into year 1.
export const ROI_PRESETS = [
  {
    id: "mfa-pam",
    label: "MFA + PAM 投资（Week 3/4 案例）",
    baseline: 6.0,
    residual: 2.2,
    cost: 2.2, // US$1.8M upfront + US$0.4M year-1 operating
  },
  {
    id: "custom",
    label: "自定义",
    baseline: 5,
    residual: 3,
    cost: 1,
  },
];

export const fmtM = (m) => `US$${m.toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
export const fmtPct = (r) => (r === null ? "—" : `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}%`);
