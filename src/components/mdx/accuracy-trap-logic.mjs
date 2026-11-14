// ISOM 6200 Lecture 3: what an overall score hides (Slide 12 test set) and too few examples of one kind (Slide 13 training set).

export const ACC_PRESETS = [
  { id: "slide12", label: "Slide 12：全部判合法", legit: 990, fraud: 10, caught: 0, falseAlarm: 0, note: "课件的例子：990 合法 + 10 欺诈，模型把 1,000 笔都判成合法。" },
  { id: "catch8", label: "抓到 8 笔，误报 30 笔", legit: 990, fraud: 10, caught: 8, falseAlarm: 30, note: "示意数字（不是课件的）：总准确率反而更低，但真的在抓欺诈。" },
  { id: "balanced", label: "测试集 500 / 500", legit: 500, fraud: 500, caught: 0, falseAlarm: 0, note: "示意：同一个「全判合法」的模型，在平衡的测试集上只有 50%。" },
];

/**
 * @param {{ legit: number, fraud: number, caught: number, falseAlarm: number }} p
 * caught = fraud payments flagged as fraud (TP); falseAlarm = legitimate payments flagged as fraud (FP).
 */
export function confusion({ legit, fraud, caught, falseAlarm }) {
  const tp = Math.min(Math.max(0, caught), fraud);
  const fp = Math.min(Math.max(0, falseAlarm), legit);
  const fn = fraud - tp;
  const tn = legit - fp;
  const n = legit + fraud;
  const accuracy = n ? (tp + tn) / n : 0;
  const recall = fraud ? tp / fraud : null; // share of fraud caught
  const precision = tp + fp ? tp / (tp + fp) : null; // share of alerts that are fraud
  const baseline = n ? Math.max(legit, fraud) / n : 0; // "always predict the majority class"
  const fpr = legit ? fp / legit : null;
  let verdict;
  if (fraud && tp === 0) verdict = `总准确率 ${pct(accuracy)}，可是 ${fraud} 笔欺诈一笔都没抓到（召回率 0%）。「永远判合法」这个什么都不做的模型就能拿到 ${pct(baseline)}。`;
  else if (accuracy < baseline) verdict = `总准确率 ${pct(accuracy)} 比「永远判合法」的 ${pct(baseline)} 还低，但抓到了 ${tp} / ${fraud} 笔欺诈——准确率在这里不是合适的指标。`;
  else verdict = `总准确率 ${pct(accuracy)}；欺诈召回率 ${pct(recall)}，告警里 ${precision == null ? "—" : pct(precision)} 是真的欺诈。`;
  return { tp, fp, fn, tn, n, accuracy, recall, precision, baseline, fpr, verdict };
}

/** Slide 13: training examples per fraud method. */
export const METHODS = [
  { id: "card", label: "Stolen card details", zh: "盗用卡资料", n: 990 },
  { id: "ato", label: "Account takeover", zh: "账户接管", n: 10 },
];

export function representation(methods = METHODS, minShare = 0.1) {
  const total = methods.reduce((s, m) => s + m.n, 0);
  return methods.map((m) => ({ ...m, share: total ? m.n / total : 0, thin: total ? m.n / total < minShare : false, total }));
}

export const pct = (x) => (x == null ? "—" : `${+(x * 100).toFixed(1)}%`);
