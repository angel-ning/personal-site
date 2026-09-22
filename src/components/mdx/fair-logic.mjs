// FAIR (Factor Analysis of Information Risk) quantitative model, shared with scripts/mdx-to-md.mjs.
// Core model: Risk (Annualized Loss Expectancy) = Loss Event Frequency (LEF) × Loss Magnitude (LM),
// where LEF = Threat Event Frequency (TEF) × Vulnerability.

export function computeFair({ tef, vuln, primary, secondary }) {
  const v = Math.max(0, Math.min(100, vuln)) / 100;
  const lef = tef * v;
  const lm = primary + secondary;
  const risk = lef * lm;
  return { lef, lm, risk };
}

// Week 3 slide's detailed ransomware case (pp.30-32): TEF/Vulnerability at their most-likely
// value, and the six loss components regrouped into Primary (direct/operational: incident
// response, tech recovery, business interruption) vs Secondary (stakeholder-reaction driven:
// client remediation, regulatory/legal, reputational) per the FAIR definition on p.24.
export const FAIR_PRESETS = [
  {
    id: "ransomware",
    label: "Ransomware（Week 3 案例）",
    tef: 1.0,
    vuln: 25,
    primary: 5.3,
    secondary: 4.0,
    tefRange: [0.4, 1.0, 2.0],
    vulnRange: [10, 25, 45],
  },
  {
    id: "custom",
    label: "自定义",
    tef: 2,
    vuln: 20,
    primary: 2,
    secondary: 1,
  },
];

export const fmtM = (m) => `US$${m.toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
