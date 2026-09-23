// Vendor (third-party) inherent cyber-risk tiering, shared with scripts/mdx-to-md.mjs (Week 5 p.6).
// Rating = 0.25*Data + 0.25*Access + 0.20*Criticality + 0.15*BlastRadius + 0.10*FourthParty + 0.05*Regulatory
// Each factor is scored 1 (Low) / 3 (Moderate) / 5 (High-critical). The slide only anchors one
// threshold explicitly: rating > 3.5 -> Tier 1 (full assessment). Below that, the deck's own
// worked example (a SaaS travel-expense tool) is treated as a lower, non-Tier-1 tier — we don't
// invent unsupported Tier 2/3 cutoffs beyond that.

export const FACTORS = [
  {
    id: "d",
    label: "Data exposure",
    weight: 0.25,
    levels: [
      { score: 1, label: "Public / 无公司数据" },
      { score: 3, label: "Internal / confidential data" },
      { score: 5, label: "客户 PII、凭证、支付数据、MNPI、密钥" },
    ],
  },
  {
    id: "a",
    label: "Access & connectivity",
    weight: 0.25,
    levels: [
      { score: 1, label: "无访问；独立服务" },
      { score: 3, label: "SSO 或有限用户访问" },
      { score: 5, label: "特权/admin 访问、API 写权限、生产网络连接" },
    ],
  },
  {
    id: "c",
    label: "Business criticality",
    weight: 0.2,
    levels: [
      { score: 1, label: "容易替换的非核心工具" },
      { score: 3, label: "重要的支撑性工作流" },
      { score: 5, label: "关键业务服务：交易、身份、云、支付、安全运营" },
    ],
  },
  {
    id: "b",
    label: "Blast radius",
    weight: 0.15,
    levels: [
      { score: 1, label: "用户少；环境隔离" },
      { score: 3, label: "部门级影响" },
      { score: 5, label: "全企业级或面向客户的中断；系统性影响" },
    ],
  },
  {
    id: "f",
    label: "Fourth-party exposure",
    weight: 0.1,
    levels: [
      { score: 1, label: "没有实质性分包商" },
      { score: 3, label: "已知的托管/分包商，范围有限" },
      { score: 5, label: "依赖云/MSP/软件库/离岸交付/不透明分包商" },
    ],
  },
  {
    id: "r",
    label: "Regulatory impact",
    weight: 0.05,
    levels: [
      { score: 1, label: "影响很小" },
      { score: 3, label: "涉及合同/审计要求" },
      { score: 5, label: "金融外包、隐私泄露、市场行为、监管报告相关" },
    ],
  },
];

export function computeVendorTier(scores) {
  const rating = FACTORS.reduce((sum, f) => sum + f.weight * (scores[f.id] ?? 1), 0);
  const isTier1 = rating > 3.5;
  return { rating, isTier1 };
}

// p.6's two worked examples: a low-stakes SaaS tool vs. a Tier 1 MSP/cloud order-management system.
export const VENDOR_TIER_PRESETS = [
  {
    id: "saas-travel",
    label: "SaaS 报销工具（Week 5 案例，非 Tier 1）",
    scores: { d: 3, a: 3, c: 1, b: 1, f: 3, r: 1 },
  },
  {
    id: "cloud-oms",
    label: "云端 OMS / MSP MDR（Week 5 案例，Tier 1）",
    scores: { d: 5, a: 5, c: 5, b: 5, f: 3, r: 5 },
  },
  {
    id: "custom",
    label: "自定义",
    scores: { d: 3, a: 3, c: 3, b: 3, f: 3, r: 3 },
  },
];
