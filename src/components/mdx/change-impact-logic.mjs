// ISOM 6200 Lecture 3 (2C): what does a change touch, which tests must cover it, and what do the supplied records show?
// Northstar (Slides 3, 19, 33, 36–45) and Pine Orchard (Slide 42). Evidence statuses quote the pre-class records only.

/** Slide 36's four parts of a service setup. */
export const PARTS = [
  { id: "data", label: "Data and preparation", zh: "数据和准备", q: "用哪些数据？怎么准备？" },
  { id: "model", label: "AI model", zh: "AI 模型", q: "哪个模型、哪个版本？" },
  { id: "settings", label: "Instructions and access settings", zh: "指令和访问设置", q: "限制数据访问、引导处理、限制输出访问" },
  { id: "output", label: "Business output", zh: "业务输出", q: "什么回答或动作？谁收到？" },
];

/** Things a change request can alter. */
export const CHANGES = [
  { id: "model", part: "model", label: "换 AI 模型 / 版本", affects: ["回答的措辞和正确率都可能变", "旧的评估结果不再对应这个版本"], tests: ["regression", "dlp"] },
  { id: "instructions", part: "settings", label: "改回答指令 (instructions)", affects: ["回答怎么组织、何时拒绝、何时转人工"], tests: ["regression", "dlp"] },
  { id: "access", part: "settings", label: "改账户 / 检索权限设置", affects: ["谁能检索到哪个集合"], tests: ["permission", "regression"] },
  { id: "policies", part: "data", label: "替换政策文件（员工 + 经理两个集合）", affects: ["能被选进 context 的内容变了，包括仅限经理的指南和个案记录", "旧版本还会不会被检索到"], tests: ["permission", "freshness", "regression"] },
  { id: "catalogue", part: "data", label: "重建检索目录 (search catalogue)", affects: ["同一个问题会检索到哪些片段", "目录里的访问标签有没有跟着文件过来"], tests: ["permission", "freshness", "regression"] },
  { id: "feed", part: "data", label: "更换外部数据源（供应商数据 feed）", affects: ["输入数据的来源、覆盖范围和格式", "模型用的是另一份数据了，即使模型本身没变"], tests: ["provenance", "regression", "retire"] },
  { id: "export", part: "output", label: "新增文件导出 (document export)", affects: ["新的交付动作：整份文件离开服务", "谁可以要求导出、导出给谁"], tests: ["permission", "dlp", "rollback"] },
  { id: "hrsubmit", part: "output", label: "新增 HR 申请提交（写入外部系统）", affects: ["从「回答」变成「行动」：在 HR 门户里创建申请", "身份、确认、重试、经理审批"], tests: ["action", "dlp", "rollback"] },
];

/** Slide 37 test focus, plus the lifecycle checks this lecture adds. */
export const TESTS = [
  { id: "permission", label: "权限基线", how: "普通员工和授权经理各发允许的和受限的请求；检索、摘要、导出都不超出批准范围", src: "Slide 37" },
  { id: "dlp", label: "DLP 与 guardrails", how: "受限 / 敏感数据、间接 prompt、工具动作；查输入和输出过滤；必须的动作审批真的被强制", src: "Slide 37" },
  { id: "regression", label: "回归测试与服务质量", how: "重跑相关的旧检查，给改了的功能加测试；允许的回答有用、未授权的动作被拦；测失败、限度和 fallback；先定预期结果和通过标准", src: "Slide 37" },
  { id: "freshness", label: "版本与时效", how: "每类请求都检索到当前生效的版本，旧版本不会被选进 context", src: "Slide 31" },
  { id: "action", label: "动作边界", how: "只以本人身份、明确确认后提交；重试不产生重复；不能代别人提交；经理仍然审批", src: "Slides 28–29、44" },
  { id: "provenance", label: "来源与覆盖", how: "来源历史 (provenance / lineage)、来源地点、本地季节的覆盖结果，由有权的 owner 审查", src: "Slide 42" },
  { id: "retire", label: "旧组件退役", how: "旧凭证撤销、旧连接关闭、副本按规则保留或删除", src: "Slide 32" },
  { id: "rollback", label: "回滚准备", how: "定触发条件、回退版本；验证恢复后的行为（新权限真的被移除）；确认并记录", src: "Slides 40–41" },
];

export const STATUS = {
  ok: { label: "有证据", tone: "ok" },
  partial: { label: "部分", tone: "partial" },
  defect: { label: "发现缺陷", tone: "bad" },
  gap: { label: "没有证据", tone: "bad" },
  na: { label: "记录没涉及", tone: "na" },
};

export const CASES = {
  northstar: {
    label: "Northstar HR 政策助手",
    baseline: { data: "HR 政策库（HR 批准的文件）", model: "未写明模型标识和版本", settings: "检索 + 起草回答", output: "只回答政策，不导出文件，不批准申请" },
    approval: "现有批准只覆盖「仅搜索」的服务；HR 批准文件、service owner 批准发布是两份记录。没有新的发布批准。",
    evidence: {
      permission: { status: "gap", text: "只有管理员账户的 20 次搜索「完成数」（Slide 33）；没有普通员工或经理的会话，也没有检索 / 输出 trace。缺的是覆盖，不是失败。" },
      dlp: { status: "gap", text: "没有受限内容、间接 prompt 或导出收件人的测试记录。" },
      regression: { status: "gap", text: "试用报告只量了完成数，没有正确率、没有事先约定的通过标准、没有独立的最终评估。" },
      freshness: { status: "gap", text: "Northstar 记录没有测新旧政策版本；Slide 31 的 V1 / V2 例子说明为什么要测。" },
      action: { status: "defect", text: "沙盒：10 次正常提交各得 1 个 ID；代另一名员工提交被拦。但超时后重试 → 一次确认两个 ID。没有经理角色、敏感字段注入、恢复提交权限的测试。" },
      provenance: { status: "na", text: "—" },
      retire: { status: "na", text: "—" },
      rollback: { status: "gap", text: "恢复文件里有旧指令、旧政策文件和旧目录；没测过恢复后导出权限是否真的被移除（观察栏是空的）。清单没列模型文件和完整运行配置。" },
    },
    fields: {
      version: { have: false, text: "候选组件的标识（指令、文件、目录、权限）还没定" },
      results: { have: false, text: "只有管理员完成数 + 沙盒结果（含重复缺陷）" },
      scope: { have: false, text: "导出给谁、谁能提交，没有批准的范围" },
      owner: { have: false, text: "service owner 有权批准发布，但还没有决定（不是拒绝）" },
      conditions: { have: false, text: "没有条件、复审触发和回滚触发" },
    },
  },
  pine: {
    label: "Pine Orchard 天气 feed",
    baseline: { data: "果园数据集 + 现行供应商天气 feed（manifest 有版本）", model: "预测模型（manifest 有版本，不变）", settings: "—", output: "本地果园运营的天气预测" },
    approval: "Release manifest：换 feed 必须由 Operations Owner 在查过来源历史和本地生长季覆盖后批准。合同：客户负责本地适用性验证和发布批准。",
    evidence: {
      permission: { status: "na", text: "—" },
      dlp: { status: "na", text: "—" },
      regression: { status: "partial", text: "替代 feed 只通过了格式检查；没有预测表现的对比结果。" },
      freshness: { status: "na", text: "—" },
      action: { status: "na", text: "—" },
      provenance: { status: "gap", text: "没有来源地点清单，也没有本地季节覆盖结果；供应商负责记录 lineage，但验证是客户的事。" },
      retire: { status: "gap", text: "合同要求退役时撤销旧密钥 / token；记录里还没有撤销证据。" },
      rollback: { status: "partial", text: "客户可以暂停自动预测，改用现有的人工计划（fallback 存在，但没测过）。" },
    },
    fields: {
      version: { have: true, text: "manifest 有模型、数据集、现行 feed 的版本；替代 feed 的版本待记" },
      results: { have: false, text: "只有格式检查" },
      scope: { have: false, text: "替代 feed 用在哪些预测、哪个季节，还没定" },
      owner: { have: true, text: "Operations Owner（manifest 写明）——但还没批准" },
      conditions: { have: false, text: "14 天后自动启用，除非客户叫停：要先决定是否叫停" },
    },
  },
};

export const FIELDS = [
  { id: "version", label: "Change and version", zh: "变更和版本" },
  { id: "results", label: "Test results", zh: "测试结果" },
  { id: "scope", label: "Permitted scope", zh: "允许的范围" },
  { id: "owner", label: "Decision and owner", zh: "决定和 owner" },
  { id: "conditions", label: "Conditions and review", zh: "条件和复审" },
];

export const CHANGE_PRESETS = [
  { id: "s36", label: "Slide 36 提议", caseId: "northstar", changes: ["instructions", "policies", "catalogue", "export"] },
  { id: "s43", label: "Slide 43 扩展（+ HR 提交）", caseId: "northstar", changes: ["instructions", "policies", "catalogue", "export", "hrsubmit"] },
  { id: "pine", label: "Slide 42 Pine Orchard", caseId: "pine", changes: ["feed"] },
];

const RANK = { defect: 3, gap: 2, partial: 1, ok: 0, na: -1 };

/**
 * @param {{ caseId: keyof typeof CASES, changes: string[] }} p
 */
export function assessChange({ caseId, changes }) {
  const c = CASES[caseId] ?? CASES.northstar;
  const picked = CHANGES.filter((x) => changes.includes(x.id));
  const parts = PARTS.map((p) => ({ ...p, baseline: c.baseline[p.id], changed: picked.filter((x) => x.part === p.id).map((x) => x.label) }));
  const testIds = [...new Set(picked.flatMap((x) => x.tests))];
  const tests = TESTS.filter((t) => testIds.includes(t.id)).map((t) => ({ ...t, why: picked.filter((x) => x.tests.includes(t.id)).map((x) => x.label), ev: c.evidence[t.id] ?? { status: "na", text: "—" } }));
  const perChange = picked.map((x) => {
    const worst = x.tests.map((id) => c.evidence[id]?.status ?? "na").reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "na");
    return { ...x, worst };
  });
  const blocking = tests.filter((t) => t.ev.status === "gap" || t.ev.status === "defect");
  let verdict;
  if (!picked.length) verdict = "没选任何变更：现有批准和证据仍然对应当前版本（但运行中也要监控）。";
  else if (blocking.length)
    verdict = `现有批准不覆盖这些变更；${blocking.length} 项必需的测试${blocking.some((t) => t.ev.status === "defect") ? "里有发现的缺陷，其余" : ""}还没有证据（${blocking.map((t) => t.label).join("、")}）。按现有记录不能批准发布——这不等于测试失败，是还不能下结论。`;
  else verdict = "必需的测试都有至少部分证据；还要 owner 在批准记录里写明范围、条件和复审触发。";
  const fields = FIELDS.map((f) => ({ ...f, ...c.fields[f.id] }));
  return { caseLabel: c.label, approval: c.approval, parts, tests, perChange, fields, verdict, changed: picked.length > 0 };
}
