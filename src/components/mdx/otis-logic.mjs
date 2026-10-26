// OTISLINE (ISOM 5100 week 1): who learns about an elevator's callbacks before and after the
// centralised system, plus the stakeholder map. Shared by <OtisFlowLab />, <OtisStakeholderLab />
// and scripts/mdx-to-md.mjs.

export const LEVELS = [
  { id: "president", label: "大区总裁 / NAO 高层", short: "大区总裁 / NAO 高层", en: "President" },
  { id: "rvp", label: "Regional VP（大区副总裁）", short: "Regional VP", en: "Regional VP" },
  { id: "district", label: "District manager（中层，不在现场）", short: "District manager（中层）", en: "District manager" },
  { id: "branch", label: "Branch / field office manager", short: "Branch manager", en: "Branch manager" },
  { id: "mechanic", label: "维修技工 Mechanic", short: "Mechanic（维修技工）", en: "Mechanic" },
];

// Escalation thresholds from the case: ≥3 callbacks in a month → district manager,
// ≥8 in 90 days → regional VP, critical situations → president. Higher levels include lower ones.
export function escalation({ m30, d90, critical }) {
  const to = new Set();
  if (m30 >= 3 || d90 >= 8 || critical) to.add("district");
  if (d90 >= 8 || critical) to.add("rvp");
  if (critical) to.add("president");
  return to;
}

// s = { m30, d90, critical, requested, hide }
//   requested: has someone above the branch asked for callback data (pre-OTISLINE only)
//   hide:      the branch manager covers up for a bad mechanic in the written report
export function whoKnows(mode, s) {
  const total = Math.max(s.m30, s.d90);
  const quiet = total === 0;
  if (mode === "pre") {
    const upward = s.requested && !s.hide;
    const late = !upward && (s.d90 >= 8 || s.critical);
    return LEVELS.map((lv) => {
      if (lv.id === "mechanic") return { ...lv, knows: !quiet, how: quiet ? "没有 callback" : "亲手修的，写书面报告" };
      if (lv.id === "branch") return { ...lv, knows: !quiet, how: quiet ? "没有 callback" : "服务台手工登记日志" };
      if (quiet) return { ...lv, knows: false, how: "没有 callback" };
      if (!s.requested)
        return late
          ? { ...lv, knows: false, how: "没人来要数据 → 不知道，直到客户投诉或取消合同", late: true }
          : { ...lv, knows: false, how: "没人来要数据，就不会上报" };
      if (s.hide)
        return { ...lv, knows: false, how: "收到的是 branch 写的报告，看起来一切正常；不在现场，无法核实", fooled: true };
      return { ...lv, knows: true, how: "上级要了才手工汇总上报，耗时、滞后" };
    });
  }
  const to = escalation(s);
  return LEVELS.map((lv) => {
    if (lv.id === "mechanic") return { ...lv, knows: !quiet, how: quiet ? "没有 callback" : "由中央调度中心派工" };
    if (lv.id === "branch") return { ...lv, knows: !quiet, how: quiet ? "没有 callback" : "系统里有完整记录" };
    if (to.has(lv.id)) return { ...lv, knows: true, how: "达到阈值，系统自动推送 excess callback 报告" };
    return { ...lv, knows: false, how: quiet ? "没有 callback" : "还没到这一级的阈值（数据在系统里，随时可查）" };
  });
}

export const FLOW_PRESETS = [
  { id: "normal", label: "偶尔坏一次", s: { m30: 1, d90: 2, critical: false, requested: false, hide: false } },
  { id: "repeat", label: "一个月坏 3 次", s: { m30: 3, d90: 4, critical: false, requested: false, hide: false } },
  { id: "cover", label: "坏 8 次，branch 掩盖", s: { m30: 4, d90: 8, critical: false, requested: true, hide: true } },
  { id: "critical", label: "危急情况", s: { m30: 5, d90: 10, critical: true, requested: false, hide: false } },
];

const FONT = `system-ui,-apple-system,'PingFang SC','Hiragino Sans GB',sans-serif`;

// Org chart with the information flow for one mode. `lit` = level ids that currently know.
export function flowSvg(mode, lit = new Set()) {
  const pre = mode === "pre";
  const y = { president: 40, rvp: 100, district: 160, branch: 230, mechanic: 300 };
  const box = (id, label) =>
    `<rect x="40" y="${y[id] - 18}" width="250" height="36" rx="8" class="of-box${lit.has(id) ? " of-lit" : ""}"/>` +
    `<text x="165" y="${y[id] + 5}" class="of-t" text-anchor="middle">${label}</text>`;
  const up = (from, to, cls, label) =>
    `<line x1="120" y1="${y[from] - 18}" x2="120" y2="${y[to] + 20}" class="${cls}" marker-end="url(#of-arr)"/>` +
    (label ? `<text x="112" y="${(y[from] + y[to]) / 2 + 4}" class="of-s" text-anchor="end">${label}</text>` : "");
  const head = pre ? "Pre-OTISLINE：bottom-up，逐层往上，要了才报" : "Post-OTISLINE：数据集中，按阈值自动推送";

  const body = pre
    ? [
        up("mechanic", "branch", "of-solid", "书面报告"),
        up("branch", "district", "of-dash", "要了才报"),
        up("district", "rvp", "of-dash", ""),
        up("rvp", "president", "of-dash", ""),
        `<rect x="420" y="212" width="130" height="36" rx="8" class="of-box"/><text x="485" y="235" class="of-t" text-anchor="middle">客户</text>`,
        `<line x1="420" y1="230" x2="292" y2="230" class="of-solid" marker-end="url(#of-arr)"/>`,
        `<text x="356" y="222" class="of-s" text-anchor="middle">打给本地办公室</text>`,
        `<line x1="200" y1="248" x2="200" y2="280" class="of-solid" marker-end="url(#of-arr)"/>`,
        `<text x="208" y="268" class="of-s">本地派工</text>`,
        `<text x="330" y="120" class="of-s">每一层都可以过滤、美化信息</text>`,
        `<text x="330" y="138" class="of-s">上级不在现场 → 无法核实</text>`,
      ]
    : [
        `<rect x="410" y="142" width="160" height="56" rx="10" class="of-hub"/>`,
        `<text x="490" y="166" class="of-t" text-anchor="middle">OTISLINE 中心</text>`,
        `<text x="490" y="184" class="of-s" text-anchor="middle">mainframe · 24h · 160 人</text>`,
        `<rect x="430" y="282" width="120" height="36" rx="8" class="of-box"/><text x="490" y="305" class="of-t" text-anchor="middle">客户</text>`,
        `<line x1="490" y1="282" x2="490" y2="200" class="of-solid" marker-end="url(#of-arr)"/>`,
        `<text x="498" y="246" class="of-s">直接打给中心</text>`,
        `<line x1="410" y1="190" x2="292" y2="296" class="of-solid" marker-end="url(#of-arr)"/>`,
        `<text x="330" y="262" class="of-s">中央派工</text>`,
        ...["district", "rvp", "president"].map(
          (id) => `<line x1="410" y1="${id === "district" ? 160 : 150}" x2="292" y2="${y[id]}" class="of-push" marker-end="url(#of-arr-p)"/>`,
        ),
        `<text x="352" y="82" class="of-p" text-anchor="middle">自动推送报告</text>`,
        up("mechanic", "branch", "of-faint", ""),
      ];

  return `<svg viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${head}">
<style>
.of-box{fill:var(--surface,#ffffff);stroke:var(--line-strong,#cfccc4);stroke-width:1.2}
.of-lit{fill:var(--accent-wash,#e8effc);stroke:var(--accent,#2f5fd0);stroke-width:2}
.of-hub{fill:var(--accent-wash,#e8effc);stroke:var(--accent,#2f5fd0);stroke-width:1.6}
.of-solid{stroke:var(--fg-3,#8b8b93);stroke-width:1.6;fill:none}
.of-faint{stroke:var(--line-strong,#cfccc4);stroke-width:1.2;fill:none}
.of-dash{stroke:var(--fg-3,#8b8b93);stroke-width:1.6;fill:none;stroke-dasharray:5 4}
.of-push{stroke:var(--accent,#2f5fd0);stroke-width:1.8;fill:none}
.of-ah{fill:var(--fg-3,#8b8b93)}
.of-ahp{fill:var(--accent,#2f5fd0)}
.of-t{fill:var(--fg,#16161a);font-family:${FONT};font-size:12.5px;font-weight:500}
.of-h{fill:var(--fg,#16161a);font-family:${FONT};font-size:13px;font-weight:600}
.of-s{fill:var(--fg-3,#8b8b93);font-family:${FONT};font-size:11.5px}
.of-p{fill:var(--accent,#2f5fd0);font-family:${FONT};font-size:11.5px;font-weight:600}
</style>
<defs>
<marker id="of-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="of-ah"/></marker>
<marker id="of-arr-p" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="of-ahp"/></marker>
</defs>
<text x="20" y="16" class="of-h">${head}</text>
${LEVELS.map((lv) => box(lv.id, lv.short)).join("\n")}
${body.join("\n")}
</svg>`;
}

export const toStaticSvg = (svg) => svg.replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g, "$1");

// Who likes / dislikes the system. `cls` from the case discussion; `cat` = SPCP heading it belongs under.
export const STAKEHOLDERS = [
  {
    id: "bad-mech",
    label: "Bad mechanic",
    attitude: "dislike",
    before: "修得马虎，同一部电梯反复坏，只要 branch 不说，上面没人知道",
    after: "每次 callback 都由中心记录，同一部电梯坏几次一目了然",
    why: "偷懒和返工被暴露",
    cat: "People",
    fix: "把 callback 数据用于培训和辅导，而不是只用来惩罚",
  },
  {
    id: "bad-branch",
    label: "Bad branch manager",
    attitude: "dislike",
    before: "自己写报告，可以替下属掩盖、美化数字（fake）",
    after: "数据来自客户打给中心的电话，不再经过 branch，造假被暴露",
    why: "以前靠信息不透明保护自己，现在藏不住",
    cat: "People",
    fix: "高层明确支持；把 callback 指标纳入绩效，同时给改进的时间",
  },
  {
    id: "mid",
    label: "Mid-level（district manager）",
    attitude: "dislike",
    before: "不在现场，靠 branch 交上来的报告了解情况，无法核实真假；但掌握向上汇报什么、怎么包装",
    after: "系统自动汇总、自动推给上级，「收集 → 汇总 → 往上传」这项工作被系统替代，绩效也被上级直接看到",
    why: "任务被替代 + 失去信息把关人（gatekeeper）的角色 + 被问责",
    cat: "Structure",
    fix: "重新定义中层的角色：从传递信息转为根据报告解决问题、辅导 branch",
  },
  {
    id: "good-branch",
    label: "Good branch（业绩好）",
    attitude: "mixed",
    before: "本来就做得好，靠本地调度和客户关系；总部很少过问",
    after: "和所有 branch 一样被监控、被比较；派工权交给中央",
    why: "本来就很好，现在却被监视；承担转换成本，收益不大",
    cat: "Structure",
    fix: "让好 branch 参与系统设计，推广他们的做法；阈值考虑楼宇和使用强度",
  },
  {
    id: "customer",
    label: "部分客户（楼宇业主 / 物业）",
    attitude: "mixed",
    before: "打给认识的本地办公室，对方熟悉这栋楼",
    after: "打给陌生的中央总机，对面不认识你",
    why: "以前是认识的人，现在不认识了，觉得服务没人情味",
    cat: "People",
    fix: "系统里记录每栋楼的信息；大客户保留固定联系人 / 技工",
  },
  {
    id: "hq",
    label: "Senior management / HQ",
    attitude: "like",
    before: "问题闹成投诉或解约才知道",
    after: "实时看到服务表现，按阈值收到报告",
    why: "终于看得见、管得到",
    cat: "Structure",
    fix: "—（推动者，要持续支持项目）",
  },
  {
    id: "eng",
    label: "Engineering 部门",
    attitude: "like",
    before: "只能看各地零散的手工日志",
    after: "有全国统一的 callback 数据，能找出反复出问题的型号和零件",
    why: "数据集中，能改进产品可靠性",
    cat: "Process",
    fix: "—（受益方）",
  },
];

export const ATTITUDE = {
  dislike: { label: "不喜欢", cls: "lab-flood" },
  mixed: { label: "可能不喜欢", cls: "lab-flood" },
  like: { label: "喜欢", cls: "lab-forward" },
};
