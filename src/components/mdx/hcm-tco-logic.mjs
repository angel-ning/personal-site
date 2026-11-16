// CO7 Technologies (ISOM 5100 week 4): three-year total cost of ownership of the four HCM options.
// Shared by <HcmTcoLab /> and scripts/lib/mdx-core.mjs. All prices are CA$ from the case (pp. 6–9,
// Exhibits 4 and 6); every value marked "assumption" is mine and can be changed in the lab.

export const CYCLES = 26; // bi-weekly payroll
export const CAP = { acquisition: 37500, tcoMax: 17500, tcoEasy: 15000 };

export const PAYWORKS_ADDONS = [
  { id: "hr", label: "Human Resources", price: 57.6, why: "员工数据库、入职流程、电子签名" },
  { id: "absence", label: "Absence Management", price: 57.6, why: "请假审批自动进入工资：解决 Laurence 的 Excel 假期表" },
  { id: "ats", label: "Applicant Tracking", price: 155.2, why: "招聘：Pouliot 现在手工发广告、排面试" },
  { id: "analytics", label: "Workforce Analytics", price: 63.05, why: "仪表板：人数、缺勤、流失率趋势" },
  { id: "advisory", label: "HR Advisory Services", price: 97, why: "HR / 法律咨询，CO7 只有一位 HR" },
];

export const TCO_DEFAULT = {
  users: 30, // 5 current Odoo users + the 25 the case says CO7 will soon add
  rate: 150, // consultant CA$/hour (case)
  addons: ["hr", "absence", "ats", "analytics"],
  buildCost: 25000, // case: simple end-to-end build
  buildTraining: 3750, // assumption: same as the Odoo HR training quote
  buildHours: 5, // case: 3–5 h of routine updates a year
  buildMajor: 20, // assumption: hours per year set aside for a major Odoo version change
  customNeedsPlan: true, // custom code cannot run on Odoo Online, so the build also needs the Custom plan
  payworksKept: true, // options 1, 2, 4 keep paying today's Payworks payroll
};

const odooYear = (perUser, users) => perUser * users * 12;

// Returns one row per option. "annual" is what the option adds per year on top of keeping Payworks
// payroll; the Odoo subscription is counted in full for options 1, 2 and 4 because the new plan
// replaces today's CA$13,560 contract (see the note in the lab).
export function tcoRows(x = TCO_DEFAULT) {
  const addons = PAYWORKS_ADDONS.filter((a) => x.addons.includes(a.id));
  const perCycle = addons.reduce((s, a) => s + a.price, 0);
  const std = odooYear(33.5, x.users);
  const custom = odooYear(51.8, x.users);
  const rows = [
    {
      id: "odoo",
      label: "① Odoo HR only",
      acq: [
        ["HR app 配置（案例写 $525）", 525],
        ["用户培训", 3750],
      ],
      yearly: [[`Standard plan $33.50 × ${x.users} 人 × 12`, std]],
      gaps: ["工资仍在 Payworks：入职仍要录两次，工资报告仍要手工记账", "Standard plan 不含 Studio（CO7 现在付费在用）"],
    },
    {
      id: "odoopay",
      label: "② Odoo HR + Canadian Payroll",
      acq: [
        ["HR app 配置", 525],
        ["HR 用户培训", 3750],
        ["Canadian Payroll 授权", 527.2],
        ["安装配置 3 h", 3 * x.rate],
        ["工资模块培训", 1500],
      ],
      yearly: [
        [`Custom plan $51.80 × ${x.users} 人 × 12（第三方模块不能放在 Odoo Online）`, custom],
        ["每次 Odoo 升级更新模块 1 h", x.rate],
      ],
      gaps: ["不能直接发工资到银行、不能向 CRA / MRQ 申报：Payworks 还得留着", "第三方模块没有质量审核（Exhibit 5），每年升级都要重新适配", "失去 Odoo Online 的托管和 99.9% 保障，要选 Odoo.sh"],
    },
    {
      id: "payworks",
      label: "③ Expand Payworks",
      acq: [],
      yearly: [[`${addons.map((a) => a.label).join(" + ") || "不加模块"}：$${perCycle.toFixed(2)} × ${CYCLES} 期`, perCycle * CYCLES]],
      gaps: ["工资报告仍要手工导入 Odoo 会计（每期半天）", "没有培训管理和员工调查功能", "SLA 没公开保证的 uptime（Exhibit 8）"],
    },
    {
      id: "build",
      label: "④ Build custom HCM",
      acq: [
        ["外部团队开发（4–6 个月）", x.buildCost],
        ["用户培训（假设）", x.buildTraining],
      ],
      yearly: [
        [`日常升级适配 ${x.buildHours} h`, x.buildHours * x.rate],
        [`大版本改动预留 ${x.buildMajor} h（假设）`, x.buildMajor * x.rate],
        ...(x.customNeedsPlan ? [[`Custom plan 和 Standard 的差价 × ${x.users} 人`, custom - std]] : []),
      ],
      gaps: ["4–6 个月后才能用，而公司正在准备下一次收购", "CO7 没有 IT 团队，代码出问题只能找外包", "Odoo 大版本改 schema / API 时要重新改造"],
    },
  ];
  return rows.map((r) => {
    const acquisition = r.acq.reduce((s, [, v]) => s + v, 0);
    const annual = r.yearly.reduce((s, [, v]) => s + v, 0);
    const total = acquisition + annual * 3;
    const perYear = total / 3;
    const band = perYear <= CAP.tcoEasy ? "easy" : perYear <= CAP.tcoMax ? "ok" : "over";
    return { ...r, acquisition, annual, total, perYear, band, acqOk: acquisition <= CAP.acquisition };
  });
}

export const fmtCad = (v) => `$${Math.round(v).toLocaleString("en-US")}`;

export const BAND_LABEL = { easy: "≤ $15,000：容易批准", ok: "≤ $17,500：可以接受", over: "超过 $17,500" };

export const TCO_PRESETS = [
  { id: "case", label: "按案例数字", note: "30 个用户，Payworks 加四个模块，定制开发按案例的 $25,000。", x: TCO_DEFAULT },
  { id: "lean", label: "Payworks 只加 HR 模块", note: "最省钱的 ③：只解决员工数据库，不解决招聘、假期和仪表板。", x: { ...TCO_DEFAULT, addons: ["hr"] } },
  { id: "grow", label: "再收购一家（60 人用 Odoo）", note: "按用户收费的 Odoo 方案随人数线性上涨，Payworks 报价按员工数，这里没法反映（案例只给了 96 人的报价）。", x: { ...TCO_DEFAULT, users: 60 } },
];
