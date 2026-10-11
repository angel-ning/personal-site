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

// The heat map's cells, for <HeatMapLab /> (same matrix as above, rows Severe..Insignificant).
export const HEATMAP_ROWS = HEATMAP;
export const HEAT_LEVELS = ["Low", "Medium", "High", "Critical"];

/** Is this cell above a risk appetite expressed as the highest acceptable level? */
export function aboveAppetite(label, appetite) {
  return HEAT_LEVELS.indexOf(label) > HEAT_LEVELS.indexOf(appetite);
}

// Slide 33 (Assigning Value, Whitman's weighted factor analysis): each asset is scored 1–5
// on three criteria; the weighted sum gives its importance band.
export const VALUE_CRITERIA = [
  { id: "revenue", label: "Impact on Revenue", weight: 0.3 },
  { id: "profit", label: "Impact on Profitability", weight: 0.4 },
  { id: "reputation", label: "Impact on Reputation", weight: 0.3 },
];

export const VALUE_ASSETS = [
  { name: "Customer order via SSL (inbound)", scores: [5, 5, 5] },
  { name: "EDI Document Set 1 — Logistics bill of lading to outsourcer (outbound)", scores: [5, 5, 3] },
  { name: "EDI Document Set 2 — Supplier orders (outbound)", scores: [4, 5, 4] },
  { name: "Customer service request via e-mail (inbound)", scores: [3, 3, 5] },
  { name: "EDI Document Set 3 — Supplier fulfillment advice (inbound)", scores: [3, 3, 2] },
];

const BANDS = [
  [4.5, "Critically Important"],
  [3.5, "Very Important"],
  [2.5, "Important"],
  [1.5, "Somewhat Important"],
  [0.5, "Not Important"],
  [0, "Not Applicable"],
];

export function importanceBand(total) {
  return BANDS.find(([min]) => total >= min - 1e-9)[1];
}

/** Weighted total for one asset given the criteria weights; rounded to one decimal like the slide. */
export function weightedValue(scores, weights) {
  const total = scores.reduce((sum, s, i) => sum + s * weights[i], 0);
  const rounded = Math.round(total * 10) / 10;
  return { total: rounded, band: importanceBand(rounded) };
}
