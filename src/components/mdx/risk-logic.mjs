// Pure quantitative-risk-assessment logic for <RiskAssessmentLab />, reproducing the
// Loss Frequency / Loss Magnitude / Calculated Risk chain and the Heat Map matrix from
// Lesson 5 (p.36-37). Shared with scripts/lib/mdx-core.mjs for the exported Markdown table.

export const LIKELIHOOD_LABELS = ["Rare", "Unlikely", "Moderate", "Likely", "Almost Certain"];
export const IMPACT_LABELS = ["Insignificant", "Minor", "Moderate", "Major", "Severe"];

// Exactly the slide's Risk Rating Matrix: rows = impact band 5(Severe)..1(Insignificant), cols = likelihood band 1..5.
const HEATMAP = [
  ["Low", "Medium", "High", "High", "Critical"],
  ["Low", "Medium", "Medium", "High", "High"],
  ["Low", "Low", "Medium", "Medium", "High"],
  ["Low", "Low", "Low", "Medium", "Medium"],
  ["Low", "Low", "Low", "Low", "Low"],
];

const LIKELIHOOD_THRESHOLDS = [5, 15, 35, 65]; // % boundaries between bands 1-5
const IMPACT_THRESHOLDS = [10, 25, 50, 75];

export function heatLabelFor(impactBand, likelihoodBand) {
  return HEATMAP[5 - impactBand][likelihoodBand - 1];
}

function bandFromPct(pct, thresholds) {
  let band = 1;
  for (const t of thresholds) {
    if (pct >= t) band++;
  }
  return Math.min(band, 5);
}

export const DEFAULT_INPUT = {
  assetValue: 100,
  attackLikelihoodPct: 25,
  successProbPct: 50,
  probableLossPct: 80,
  uncertaintyPct: 10,
  riskAppetite: 12,
};

export function computeRisk(input) {
  const { assetValue, attackLikelihoodPct, successProbPct, probableLossPct, uncertaintyPct, riskAppetite } = input;
  const lossFrequency = (attackLikelihoodPct / 100) * (successProbPct / 100); // fraction
  const lossFrequencyPct = lossFrequency * 100;
  const lossMagnitude = assetValue * (probableLossPct / 100); // $
  const calculatedRisk = lossFrequency * lossMagnitude; // $
  const uncertaintyAbs = calculatedRisk * (uncertaintyPct / 100);
  const rangeLow = calculatedRisk - uncertaintyAbs;
  const rangeHigh = calculatedRisk + uncertaintyAbs;

  const likelihoodBand = bandFromPct(lossFrequencyPct, LIKELIHOOD_THRESHOLDS);
  const impactBand = bandFromPct(probableLossPct, IMPACT_THRESHOLDS);
  const heatLabel = heatLabelFor(impactBand, likelihoodBand);

  const acceptable = rangeHigh <= riskAppetite;

  return {
    lossFrequency, lossFrequencyPct, lossMagnitude, calculatedRisk, uncertaintyAbs, rangeLow, rangeHigh,
    likelihoodBand, impactBand, heatLabel, acceptable,
    likelihoodLabel: LIKELIHOOD_LABELS[likelihoodBand - 1], impactLabel: IMPACT_LABELS[impactBand - 1],
  };
}

export const RISK_SCENARIOS = [
  { label: "课件原例", ...DEFAULT_INPUT },
  { label: "收紧风险胃口", ...DEFAULT_INPUT, riskAppetite: 8 },
  { label: "资产价值翻倍", ...DEFAULT_INPUT, assetValue: 200 },
  { label: "攻击可能性更高", ...DEFAULT_INPUT, attackLikelihoodPct: 60 },
];
