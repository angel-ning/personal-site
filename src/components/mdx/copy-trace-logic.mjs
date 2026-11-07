// ISOM 6200 Lecture 2: follow Harbor's data through every copy (L2-A2, L2-A3, L2-A5; Slides 13, 20, 24, 25, 29).

/**
 * Every place a support-ticket excerpt can end up once the expansion is live.
 * pilot = does the approved staff-draft FAQ pilot already create this copy with personal data?
 * outside = held outside Harbor's own Hong Kong systems.
 * masked = what masking before sending (Slide 20) changes for this copy.
 */
export const COPIES = [
  {
    id: "source",
    name: "Source ticket",
    zh: "原始工单库",
    where: "Harbor · Hong Kong",
    holder: "Harbor（Custodian 运维）",
    pilot: false,
    outside: false,
    expiry: "按 Harbor 的保留表（L2-A3 要求有文件、有理由）",
    known: true,
    evidence: "删除回执上写明的源库操作",
  },
  {
    id: "index",
    name: "Retrieval index",
    zh: "检索索引 / 缓存片段",
    where: "Harbor · Hong Kong",
    holder: "Harbor",
    pilot: false,
    outside: false,
    expiry: "删源工单时是否同步删掉索引？",
    known: true,
    evidence: "受控检索：删除后再搜，确认搜不到",
  },
  {
    id: "prompt",
    name: "Prompt + retrieved excerpt sent to provider",
    zh: "发给供应商的 prompt 和检索片段",
    where: "Provider · Singapore",
    holder: "Singapore-hosted provider",
    pilot: false,
    outside: true,
    masked: "姓名、账号 ID 换成 token；自由文本里仍可能有可识别信息",
    expiry: "处理完是否保留？保留到哪一份副本里？",
    known: false,
    evidence: "供应商条款 + 实际数据流记录（发了哪些字段）",
  },
  {
    id: "diag",
    name: "Provider diagnostics",
    zh: "供应商诊断日志",
    where: "Provider · Singapore（+ 分包商？）",
    holder: "Provider，分包商名单未提供",
    pilot: false,
    outside: true,
    masked: "只能看到 token；但 token 能否被重新关联取决于 lookup 在谁手里",
    expiry: "合同允许最长 90 天；没有到期测试、没有分包商清单（L2-A3）",
    known: false,
    evidence: "到期测试 + subprocessor inventory；90 天是条款，不是测试结果",
  },
  {
    id: "log",
    name: "Harbor prompt / output log",
    zh: "Harbor 自己的 prompt / 输出日志",
    where: "Harbor · Hong Kong",
    holder: "Harbor",
    pilot: false,
    outside: false,
    expiry: "排错用的日志：字段、访问、保留期是否有理由？",
    known: false,
    evidence: "日志清单、访问记录、到期检查（L2-A5：删除测试没覆盖）",
  },
  {
    id: "backup",
    name: "Recovery backup",
    zh: "恢复备份",
    where: "Harbor",
    holder: "Harbor",
    pilot: false,
    outside: false,
    expiry: "恢复旧备份会不会把已删的数据带回来？",
    known: false,
    evidence: "备份到期证据 + 恢复测试（在声明的范围内）",
  },
  {
    id: "reply",
    name: "Reply delivered to the customer",
    zh: "发给顾客的回复",
    where: "Customer channel",
    holder: "顾客 + Harbor 的回复记录",
    pilot: true,
    outside: true,
    expiry: "回复里有没有带出别人的工单内容？送到的是不是本人？",
    known: false,
    evidence: "访问边界测试：一位顾客取不到另一位的工单（Slide 28 C）",
  },
];

/** Preset receipts: L2-A5 test deletion covered source + index only. */
export const RECEIPT_PRESETS = [
  { id: "a5", label: "L2-A5 删除测试（源库 + 索引）", covers: ["source", "index"] },
  { id: "source", label: "只删了源工单", covers: ["source"] },
  { id: "full", label: "假设：回执覆盖全部副本", covers: COPIES.map((c) => c.id) },
];

/**
 * @param {{ expanded: boolean, masked: boolean, covers: string[] }} s
 */
export function traceCopies({ expanded, masked, covers }) {
  const rows = COPIES.map((c) => {
    const personal = expanded || c.pilot ? (c.id === "reply" && !expanded ? "FAQ 内容，不含工单" : masked && c.masked ? "已遮蔽（假名化）" : "含姓名 / 账号 ID / 自由文本") : "不产生（试点只用 FAQ）";
    const exists = expanded || c.pilot;
    return { ...c, exists, personal, covered: exists && covers.includes(c.id) };
  });
  const live = rows.filter((r) => r.exists);
  const withPersonal = live.filter((r) => r.personal.startsWith("含") || r.personal.startsWith("已遮蔽"));
  const remaining = live.filter((r) => !r.covered);
  const outside = withPersonal.filter((r) => r.outside);
  const unverified = live.filter((r) => !r.known && !r.covered);
  const coveredNames = live.filter((r) => r.covered).map((r) => r.zh);
  const claim = !coveredNames.length
    ? "回执没有指名任何一份副本：什么都证明不了。"
    : remaining.length
      ? `可以说「工单已从${coveredNames.join("、")}删除」；不能说「所有副本都删了」——还有 ${remaining.length} 份没被回执覆盖。`
      : "回执覆盖了这张图上的每一份副本——但仍要确认清单本身完整（有没有漏掉的分包商、导出、截图）。";
  return { rows, live, withPersonal, remaining, outside, unverified, claim };
}
