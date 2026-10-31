// ISOM 6200 Lecture 1, Slide 21: when should people be in, on or out of the loop?
// Each factor is scored 0 (fine without a person) / 1 (a person must be able to step in) / 2 (a person must decide first).
// The deck gives no scoring rule — this is a teaching aid: the strictest factor sets the mode.

export const LOOP_MODES = {
  hitl: { id: "hitl", en: "Human-in-the-Loop (HITL)", zh: "人在环内", gist: "Human validation before execution：人先确认，输出才生效" },
  hotl: { id: "hotl", en: "Human-on-the-Loop (HOTL)", zh: "人在环上", gist: "Autonomy under supervision; intervention when needed：系统先跑，人监督、随时能介入" },
  hootl: { id: "hootl", en: "Human-out-of-the-Loop (HOOTL)", zh: "人在环外", gist: "Routine autonomy within predefined boundaries：在事先划好的边界内自动运行" },
};

export const LOOP_FACTORS = [
  {
    id: "authority",
    label: "输出是什么",
    options: ["查已批准的信息（照原文给出）", "建议 / 资格判断（客户可能据此行动）", "本身就是决定（例外、拒绝、付款）"],
  },
  {
    id: "harm",
    label: "错了的后果",
    options: ["小：客户再问一次就好", "客户依赖后可能有损失", "重大：钱、法律、基本权益"],
  },
  {
    id: "reverse",
    label: "能在伤害发生前纠正吗",
    options: ["能：有复核或其他途径兜底", "通常要事后投诉才发现", "不可逆"],
  },
  {
    id: "evidence",
    label: "测试证据覆盖这个用途吗",
    options: ["覆盖，且上线后有监控", "只测了常规情况", "没测过"],
  },
  {
    id: "policy",
    label: "政策和授权",
    options: ["已批准自动化交付", "有政策，但没批准自动交付", "政策要求由人判断"],
  },
  {
    id: "cover",
    label: "需要时有人能介入吗",
    options: ["随时有人", "只在工作时间", "没有指定的人"],
  },
];

export const LOOP_PRESETS = [
  { id: "exception", label: "例外决定（部分使用的票、例外申请）", picks: { authority: 2, harm: 2, reverse: 1, evidence: 2, policy: 2, cover: 1 } },
  { id: "routine", label: "常规资格建议（七天规则）", picks: { authority: 1, harm: 1, reverse: 1, evidence: 1, policy: 1, cover: 1 } },
  { id: "lookup", label: "查已批准的政策原文", picks: { authority: 0, harm: 0, reverse: 0, evidence: 0, policy: 0, cover: 0 } },
];

const BLOCKERS = {
  evidence: ["", "测试只覆盖常规请求：先补测没覆盖的情况（L1-A3 没测例外、争议、政策更新、交接）", "没有测试证据：不能上线到客户面前"],
  policy: ["", "政策签了不等于批准了新的自动交付渠道：先要 Service Owner 的发布批准（L1-A1 审批栏是空的）", "政策规定这类事由受训人员决定：AI 只能起草，不能替人决定"],
  cover: ["", "只有工作时间有人：下班后的 HOTL 实际上变成了 HOOTL（L1-A4 只有一名坐席 09:00–17:00）", "没有指定能介入的人：HOTL 无从谈起"],
};

/** @param {Record<string, number>} picks */
export function decideLoop(picks) {
  const score = (id) => picks[id] ?? 0;
  const drivers = LOOP_FACTORS.filter((f) => score(f.id) > 0).map((f) => ({ id: f.id, label: f.label, level: score(f.id), text: f.options[score(f.id)] }));
  const max = Math.max(0, ...drivers.map((d) => d.level));
  const mode = max === 2 ? LOOP_MODES.hitl : max === 1 ? LOOP_MODES.hotl : LOOP_MODES.hootl;
  const blockers = ["evidence", "policy", "cover"].map((id) => BLOCKERS[id][score(id)]).filter(Boolean);
  const conditions =
    mode.id === "hootl"
      ? ["边界要事先写清楚（只回答已批准的原文，超出就转人工）", "持续监控 + 抽样复核，发现越界能停"]
      : mode.id === "hotl"
        ? ["指定一个有权暂停 / 纠正的人，并且在服务运行时都能联系到", "要有触发介入的信号（例：复核样本里的错误率超过约定上限）", "介入要留下记录：谁、何时、改了什么"]
        : ["AI 只能起草，人确认后才对客户生效", "复核人要受过训练、有授权，并有时间真的去看（不是橡皮图章）", "复核记录要能证明「有意义的人工参与」"];
  return { mode, drivers, blockers, conditions };
}
