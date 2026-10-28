// CRM (ISOM 5100 week 1): the customer-service routing process map (slide 14).
// Shared by <CrmRouteLab /> and scripts/mdx-to-md.mjs.

// ---------- Slide 14: customer service process map ----------

export const ROUTE_STEPS = {
  receive: "Receive service request",
  obtain: "Obtain customer information（查 customer database）",
  known: "Customer info available?",
  score: "Score customer",
  high: "High value customer?",
  special: "Provide special offers and service",
  best: "Route to best agent",
  resolve: "Resolve service issue",
};

export const CALLERS = [
  { id: "new", label: "新客户（数据库里没有）", known: false, high: false },
  { id: "low", label: "老客户 · 一般价值", known: true, high: false },
  { id: "vip", label: "老客户 · 高价值", known: true, high: true },
];

// Path through the map for one caller: list of { step, answer? }.
export function routeFor({ known, high }) {
  const path = [{ step: "receive" }, { step: "obtain" }, { step: "known", answer: known ? "Yes" : "No" }];
  if (known) {
    path.push({ step: "score" }, { step: "high", answer: high ? "Yes" : "No" });
    if (high) path.push({ step: "special" });
  }
  path.push({ step: "best" }, { step: "resolve" });
  return path;
}

export function routeNote({ known, high }) {
  if (!known) return "没有资料就没法打分：直接分给合适的客服处理。处理完以后这位客户就进了数据库，下次再来就能识别。";
  if (!high) return "能识别、但不是高价值客户：按正常流程分给最合适的客服。任何客服都看得到同一份历史记录（slide 13）。";
  return "高价值客户先拿到特别优惠和服务，再分给最好的客服。这就是 CRM 里建模的忠诚度流程：把资源优先给最赚钱的客户。";
}
