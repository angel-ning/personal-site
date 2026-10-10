// Core of the MDX → plain Markdown conversion, shared by scripts/mdx-to-md.mjs (CLI)
// and scripts/sync-content.mjs (per-note download bundles). Each note component
// becomes the Markdown it stands for (Callout → blockquote, Figure → image + caption,
// QA → question + answer, interactive demos → tables computed from the same data).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkBreaks from "remark-breaks";
import remarkStringify from "remark-stringify";
import { visit, SKIP } from "unist-util-visit";
import { switchFrame, toMin } from "../../src/components/mdx/switch-logic.mjs";
import { collisionRows, collisionSvgStatic } from "../../src/components/mdx/collision-map.mjs";
import { analyzeIp, IP_PRESETS } from "../../src/components/mdx/ip-logic.mjs";
import { ARTIST, ALBUM, ARTIST_ALBUM, runQuery, emptyPool, poolStep, POOL_SCRIPT } from "../../src/components/mdx/db-logic.mjs";
import { EER_SCENARIOS, constraintInfo, discriminatorName, HIERARCHY, inheritance } from "../../src/components/mdx/eer-logic.mjs";
import { computeFair, FAIR_PRESETS, fmtM as fmtFairM } from "../../src/components/mdx/fair-logic.mjs";
import { computeControlRoi, ROI_PRESETS, fmtM as fmtRoiM, fmtPct } from "../../src/components/mdx/control-roi-logic.mjs";
import { computeInsurance, INSURANCE_PRESETS, fmtM as fmtInsM } from "../../src/components/mdx/insurance-logic.mjs";
import { CAPACITY, HALFOPEN_TIMEOUT, runScript } from "../../src/components/mdx/syn-flood-logic.mjs";
import { MODES, scenarioLabel, verifyPki } from "../../src/components/mdx/pki-logic.mjs";
import { computeRisk, RISK_SCENARIOS } from "../../src/components/mdx/risk-logic.mjs";
import { computeTimeline, TIMELINE_PRESETS, MTPD_PRESETS, fmtH, computeAle, ALE_PRESETS, fmtUsd } from "../../src/components/mdx/bia-logic.mjs";
import { KINDS as DRILL_KINDS, makeQuestion as drillQuestion, fmtAnswer as drillAnswer } from "../../src/components/mdx/calc-drill-logic.mjs";
import { classifySeverity, SEVERITY_PRESETS, DIMENSIONS as SEVERITY_DIMENSIONS } from "../../src/components/mdx/severity-logic.mjs";
import { decide as decideInvest, INITIATIVES as INVEST_ITEMS, fmtScore as fmtInvestScore, checkMix, MIX_PRESETS, fmtK as fmtInvestK, fmtPct1 as fmtInvestPct, rangeText as investRange } from "../../src/components/mdx/invest-logic.mjs";
import { symbolFor as cardSymbolFor, symbolName as cardSymbolName } from "../../src/components/mdx/cardinality-logic.mjs";
import { evaluate as evalFirewall, PRESETS as FW_PRESETS } from "../../src/components/mdx/firewall-logic.mjs";
import { classifyFd, fdText } from "../../src/components/mdx/normalization-logic.mjs";
import { WALK_SCENARIOS, normalizeSteps } from "../../src/components/mdx/normalize-steps.mjs";
import { FD_SCENARIOS, sweepNonKey } from "../../src/components/mdx/fd-finder-logic.mjs";
import { tcpConversation, HANDSHAKE_PRESETS, simulateWindow, WINDOW_PRESETS, classifyPort, PORT_PRESETS, openConnections } from "../../src/components/mdx/tcp-logic.mjs";
import { subnetPlan, planOptions, SUBNET_PRESETS, PLAN_PRESETS } from "../../src/components/mdx/subnet-logic.mjs";
import { computeVendorTier, FACTORS as VENDOR_FACTORS, VENDOR_TIER_PRESETS } from "../../src/components/mdx/vendor-tier-logic.mjs";
import { runSql, runJoin, show as sqlShow, SQL_PRESETS, JOIN_TYPES, DCL_STATEMENTS, DCL_SCRIPT, DCL_USERS, DCL_ROLE, DCL_PRIVS, dclStep, dclCell, emptyDcl } from "../../src/components/mdx/sql-logic.mjs";
import { COMMAND_ITEMS } from "../../src/components/mdx/sql-commands.mjs";
import { analyzeIpv6, IPV6_PRESETS, eui64, EUI_PRESETS, ipv6SubnetPlan, SUBNET6_PRESETS, fmtBig } from "../../src/components/mdx/ipv6-logic.mjs";
import { RA_OPTIONS, RA_FIELDS } from "../../src/components/mdx/ra-logic.mjs";
import { simulate as simulateBaseline, SCENARIOS as BASELINE_SCENARIOS, BASELINE_PRESETS } from "../../src/components/mdx/baseline-logic.mjs";
import { findExercise, cellText as sqlxCell, parseInline, levelDots, expectSummary } from "../../src/components/mdx/sql-practice-logic.mjs";
import { RECOVERY_PRESETS, PHASE_LABEL, WAL_DEMOS, WAL_ACTION_LABEL, recover, presetStart, recLine, pageText, runWal } from "../../src/components/mdx/recovery-logic.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const osi = readJson("src/components/mdx/data/osi.json");
const lab = readJson("src/components/mdx/data/switch-lab.json");
const dbLayers = readJson("src/components/mdx/data/dbms-layers.json");
const pmrItems = readJson("src/components/mdx/data/pmr-items.json");
const cardinalityItems = readJson("src/components/mdx/data/cardinality-items.json");
const normalizationScenarios = readJson("src/components/mdx/data/normalization-scenarios.json");
const threatActorData = readJson("src/components/mdx/data/threat-actor-items.json");
const firewallRules = readJson("src/components/mdx/data/firewall-rules.json");
const irPhaseData = readJson("src/components/mdx/data/ir-phase-items.json");
const irPicerlData = readJson("src/components/mdx/data/ir-picerl-items.json");
const sqlPractice = readJson("src/components/mdx/data/sql-practice.json");
const aiTrendQuiz = readJson("src/components/mdx/data/ai-trend-quiz.json");
const txnQuiz = readJson("src/components/mdx/data/txn-quiz.json");
const note = (t) => para({ type: "emphasis", children: [text(t)] });
const relTable = (r) => table(r.cols, r.rows.map((row) => row.map(String)));

// ---------- mdast helpers ----------
const text = (value) => ({ type: "text", value });
const strong = (value) => ({ type: "strong", children: [text(value)] });
const para = (...children) => ({ type: "paragraph", children });
const cell = (v) => ({ type: "tableCell", children: typeof v === "string" ? [text(v)] : [v] });
const table = (head, rows) => ({
  type: "table",
  align: head.map(() => null),
  children: [head, ...rows].map((r) => ({ type: "tableRow", children: r.map(cell) })),
});
const attrs = (node) =>
  Object.fromEntries(
    node.attributes.filter((a) => a.type === "mdxJsxAttribute").map((a) => [a.name, a.value ?? true]),
  );

const CALLOUTS = {
  exam: ["🎯", "考点"],
  tip: ["💡", "小白理解"],
  warn: ["⚠️", "踩坑提醒"],
  board: ["✍️", "老师板书"],
  extra: ["➕", "课外补充"],
  memo: ["🧠", "记忆口诀"],
  note: ["📌", "注意"],
  todo: ["📝", "TODO"],
  biz: ["💼", "业务视角"],
};

// Plain-Markdown stand-ins for <Mk>: 【entity】 〔attribute〕 _verb_ ⟨cardinality⟩.
const MK = { e: ["【", "】"], a: ["〔", "〕"], c: ["⟨", "⟩"] };

const components = {
  Mk(node, a) {
    if (a.t === "v") return [{ type: "emphasis", children: node.children }];
    const [l, r] = MK[a.t] ?? ["", ""];
    return [text(l), { type: "strong", children: node.children }, text(r)];
  },
  Callout(node, a) {
    const [icon, label] = CALLOUTS[a.type] ?? CALLOUTS.note;
    return [{ type: "blockquote", children: [para(strong(`${icon} ${a.title ?? label}`)), ...node.children] }];
  },
  Figure(_node, a) {
    const img = { type: "image", url: a.src, alt: a.alt ?? a.caption ?? "" };
    const cap = [a.board ? "✍️ " : "", a.caption ?? "", a.source ? `（${a.source}）` : ""].join("");
    return cap.trim() ? [para(img), para({ type: "emphasis", children: [text(cap)] })] : [para(img)];
  },
  QA(node, a) {
    return [para(strong(a.q)), { type: "blockquote", children: node.children }];
  },
  LayerStack() {
    return [
      table(
        ["#", "OSI 层", "做什么", "PDU", "典型设备", "TCP/IP"],
        osi.map((l) => [String(l.n), `${l.en} ${l.zh}`, `${l.roleZh}（${l.examples}）`, strong(l.pdu), l.devices, l.tcpip]),
      ),
    ];
  },
  SwitchLab() {
    let t = [];
    const rows = lab.script.map((f, i) => {
      const r = switchFrame(lab, t, f.src, f.dst, toMin(f.time));
      t = r.table;
      const d = { flood: "Flood", forward: "Forward", filter: "Filter" }[r.decision];
      const where = r.outPorts.length ? ` → ${r.outPorts.join(", ")}` : "";
      return [String(i + 1), f.time, `${f.src} → ${f.dst}`, `MAC-${f.src} @ ${r.inPort}（${r.learned === "new" ? "新增" : "刷新"}）`, strong(d + where)];
    });
    return [
      para({ type: "emphasis", children: [text("（网页版此处是可交互的交换机演示；下表是同一套规则算出的结果）")] }),
      table(["#", "时间", "帧", "学习", "决策"], rows),
    ];
  },
  CollisionMap(_node, _a, ctx) {
    ctx.generated.push({ path: "images/COLLISION_MAP.svg", data: collisionSvgStatic });
    return [
      para({ type: "image", url: "images/COLLISION_MAP.svg", alt: "Hub 上的冲突与交换机的防冲突机制" }),
      table(
        ["标记", "冲突在哪里发生（Hub）", "交换机怎么防", "位置"],
        collisionRows.map((r) => [strong(r.mark), r.where, r.fix, r.place]),
      ),
    ];
  },
  IpAnalyzer() {
    const rows = IP_PRESETS.map((ip) => {
      const r = analyzeIp(ip);
      return [
        strong(ip),
        `Class ${r.cls}（开头 ${r.lead}）`,
        r.binary.join("."),
        r.network ?? "—",
        r.broadcast ?? "—",
        r.network ? `${r.firstHost} – ${r.lastHost}` : r.note,
        r.scope,
      ];
    });
    return [
      para({ type: "emphasis", children: [text("（网页版此处可以输入任意 IPv4 地址自动分析；下表是几个例子的结果）")] }),
      table(["地址", "Class", "二进制", "Network address", "Broadcast", "可用主机 / 说明", "范围"], rows),
    ];
  },
  MCQ(node, a) {
    const opts = ["a", "b", "c", "d", "e"].filter((k) => a[k]).map((k) => ({
      type: "listItem",
      spread: false,
      children: [para(text(`${k.toUpperCase()}. ${a[k]}`))],
    }));
    return [
      para(strong(a.q)),
      { type: "list", ordered: false, spread: false, children: opts },
      { type: "blockquote", children: [para(strong(`答案：${a.answer}`)), ...node.children] },
    ];
  },
  LayerQuiz() {
    const name = (id) => dbLayers.layers.find((l) => l.id === id).en;
    return [
      note("（网页版此处是「这属于哪一层」的点选练习；下表是全部题目和答案）"),
      table(["功能 / 概念", "属于", "理由"], dbLayers.items.map((it) => [it.text, strong(name(it.layer)), it.why])),
    ];
  },
  RelAlgebraLab() {
    const ex = [
      { where: "Year=1990", cols: [] },
      { where: "Year=1990", cols: ["Year", "ArtistName"] },
      { joinAlbums: true, where: "ReleaseYear=1994", cols: ["ArtistName"] },
    ].map(runQuery);
    return [
      note("（网页版此处可以自己组合 σ / Π / ⋈；下面是课件的三张表和三个例子的结果）"),
      para(strong("Artist")), relTable(ARTIST),
      para(strong("Album")), relTable(ALBUM),
      para(strong("ArtistAlbum")), relTable(ARTIST_ALBUM),
      ...ex.flatMap((q) => [para({ type: "inlineCode", value: q.expr }), relTable(q.result)]),
    ];
  },
  BufferPoolLab() {
    let st = emptyPool();
    const rows = POOL_SCRIPT.map((r, i) => {
      const out = poolStep(st, r);
      st = out.state;
      const req = r.op === "flush" ? "Flush" : `${r.op === "update" ? "Update" : "Get"} Page #${r.page}`;
      const frames = st.frames.map((f) => `${f.page}${f.dirty ? "*" : ""}`).join(", ");
      return [String(i + 1), req, out.steps.filter((x) => x.layer !== "exec").map((x) => x.text).join("；"), frames];
    });
    return [
      note("（网页版此处是可操作的 buffer pool，3 个 frame；下表是示例步骤，* = dirty）"),
      table(["#", "请求", "发生了什么", "之后的 frames"], rows),
    ];
  },
  EerConstraintLab() {
    const combos = [
      { total: true, overlap: false }, { total: true, overlap: true },
      { total: false, overlap: false }, { total: false, overlap: true },
    ].map((c) => {
      const i = constraintInfo(c);
      return [c.total ? "Yes" : "No", c.overlap ? "Yes" : "No", i.line, i.letter, i.membership, i.discriminator];
    });
    const sc = EER_SCENARIOS.map((s) => {
      const i = constraintInfo(s.answer);
      return [s.text, `${s.answer.total ? "双线" : "单线"} + ${i.letter}`, discriminatorName(s, s.answer.overlap), s.why];
    });
    return [
      note("（网页版此处可以选场景、回答两个问题，自动画出图和 discriminator）"),
      table(["Q1 必须属于某子类？", "Q2 能同时属于多个？", "线", "圆圈", "每个实例属于", "Discriminator"], combos),
      table(["场景", "标记", "Discriminator", "理由"], sc),
    ];
  },
  HierarchyExplorer() {
    const rows = Object.keys(HIERARCHY).map((n) => {
      const [own, ...up] = inheritance(n);
      return [strong(n), own.attrs.join(", "), up.map((u) => `${u.attrs.join(", ")}（${u.entity}）`).join("；") || "—（root）"];
    });
    return [note("（网页版此处可以点实体看继承路径）"), table(["实体", "自己的属性", "继承的属性"], rows)];
  },
  FcsDemo() {
    return [para({ type: "emphasis", children: [text("（网页版此处可交互：改发送的比特、选择被干扰的位，观察接收方重算的 FCS 是否一致）")] })];
  },
  FairCalculator() {
    const rows = FAIR_PRESETS.map((p) => {
      const { lef, lm, risk } = computeFair(p);
      return [p.label, `${p.tef} × ${p.vuln}% = ${lef.toFixed(3)}`, fmtFairM(lm, p.currency), strong(fmtFairM(risk, p.currency))];
    });
    return [
      note("（网页版此处可以自己调 TEF / Vulnerability / Primary / Secondary；下表是预设场景的结果）"),
      table(["场景", "LEF = TEF × Vulnerability", "LM", "Risk（年化预期损失）"], rows),
    ];
  },
  ControlRoiCalculator() {
    const rows = ROI_PRESETS.map((p) => {
      const { benefit, net, roi } = computeControlRoi(p);
      return [p.label, fmtRoiM(benefit), fmtRoiM(net), strong(fmtPct(roi))];
    });
    return [
      note("（网页版此处可以自己调 Baseline / Residual / Cost；下表是预设场景的结果）"),
      table(["场景", "Expected Benefit", "Net Benefit", "ROI"], rows),
    ];
  },
  InsuranceCalculator() {
    const rows = INSURANCE_PRESETS.map((p) => {
      const { recovery, netRetained } = computeInsurance(p);
      return [p.label, fmtInsM(recovery), strong(fmtInsM(netRetained))];
    });
    return [
      note("（网页版此处可以自己调 Loss / Retention / Limit / Uncovered / Premium；下表是预设场景的结果）"),
      table(["场景", "Insurance Recovery", "Net Retained Loss"], rows),
    ];
  },
  SynFloodLab() {
    const STATUS = { established: "✅ 已建立", "half-open": "⏳ 半开" };
    const rows = runScript().map((s, i) => [
      String(i + 1),
      s.action,
      `${s.backlog.length}/${CAPACITY}`,
      s.backlog.map((e) => STATUS[e.status]).join(", ") || "（空）",
    ]);
    return [
      note(`（网页版此处可交互：自己发正常连接 / 伪造 SYN，看队列如何被打满；下表是同一套规则跑一遍的脚本，半开连接超时阈值 = ${HALFOPEN_TIMEOUT} tick）`),
      table(["#", "动作", "队列", "队列内容"], rows),
    ];
  },
  PkiTrustLab() {
    const scenarios = MODES.flatMap((mode) =>
      (mode === "hash" ? [{ tampered: false }, { tampered: true }] : [{ impersonated: false }, { impersonated: true }, { tampered: true }]).map(
        (s) => ({ mode, tampered: false, impersonated: false, ...s }),
      ),
    );
    const rows = scenarios.map((s) => {
      const r = verifyPki(s);
      return [scenarioLabel(s), r.integrityCheckPassed ? "一致" : "不一致", r.caCheckApplies ? (r.caCheckPassed ? "通过" : "拒绝") : "—", r.fooled ? strong("Bob 被骗了") : r.bobAccepts ? "正确接受" : "正确拒绝"];
    });
    return [
      note("（网页版此处可交互：切换 Hash / Signature / Certificate 三种模式，勾选「篡改内容」「冒充身份」看 Bob 会不会被骗；下表是同一套规则跑一遍全部组合）"),
      table(["场景", "摘要比对", "CA 检查", "结果"], rows),
    ];
  },
  RiskAssessmentLab() {
    const rows = RISK_SCENARIOS.map((s) => {
      const r = computeRisk(s);
      return [
        s.label,
        `${s.attackLikelihoodPct}% × ${s.successProbPct}% = ${r.lossFrequencyPct.toFixed(1)}%`,
        `${s.assetValue} × ${s.probableLossPct}% = ${r.lossMagnitude.toFixed(1)}`,
        `${r.rangeLow.toFixed(1)} ~ ${r.rangeHigh.toFixed(1)}`,
        `${r.likelihoodLabel} × ${r.impactLabel} → ${r.heatLabel}`,
        r.acceptable ? "Accept" : strong("需要 Treat"),
      ];
    });
    return [
      note("（网页版此处可交互：自己调 Asset Value / Likelihood / Probable Loss 等参数，实时看 Heat Map 落点；下表是几个例子的结果）"),
      table(["场景", "Loss Frequency", "Loss Magnitude", "Calculated Risk", "Heat Map", "决定"], rows),
    ];
  },
  BiaTimeLab(_node, a) {
    if (a.variant === "mtpd") {
      const rows = MTPD_PRESETS.filter((p) => p.id !== "custom").map((p) => {
        const r = computeTimeline(p);
        return [
          p.label,
          `RTO ${fmtH(p.rto)} vs MTPD ${fmtH(p.mtd)}`,
          r.mtdOk ? "达标" : strong(`超出 ${fmtH(-r.slack)}`),
          `备份间隔 ${fmtH(p.backupInterval)} vs RPO ${fmtH(p.rpoTarget)}`,
          r.rpoOk ? "达标" : strong("不达标"),
          p.fallback,
        ];
      });
      return [
        note("（网页版此处可交互：自己调备份间隔、RPO、RTO、MTPD，时间轴实时变化；下表是 p.33 各项服务和两个反例的结果）"),
        table(["服务", "RTO vs MTPD", "停机", "数据丢失", "RPO", "最低持续安排"], rows),
      ];
    }
    const rows = TIMELINE_PRESETS.filter((p) => p.id !== "custom").map((p) => {
      const r = computeTimeline(p);
      return [
        p.label,
        `${fmtH(p.rto)} + ${fmtH(p.wrt)} = ${fmtH(r.downtime)} vs MTD ${fmtH(p.mtd)}`,
        r.mtdOk ? "达标" : strong(`超出 ${fmtH(-r.slack)}`),
        `备份间隔 ${fmtH(p.backupInterval)} vs RPO ${fmtH(p.rpoTarget)}`,
        r.rpoOk ? "达标" : strong("不达标"),
      ];
    });
    return [
      note("（网页版此处可交互：自己调备份间隔、RPO、RTO、WRT、MTD，时间轴实时变化；下表是几个预设场景的结果）"),
      table(["场景", "停机 = RTO + WRT", "MTD", "数据丢失", "RPO"], rows),
    ];
  },
  AleCalculator() {
    const rows = ALE_PRESETS.map((p) => {
      const r = computeAle(p);
      return [
        p.label,
        `${fmtUsd(p.av)} × ${p.efPct}% = ${fmtUsd(r.sle)}`,
        `${fmtUsd(r.sle)} × ${p.aro} = ${fmtUsd(r.ale)}`,
        fmtUsd(r.aleAfter),
        fmtUsd(p.acs),
        r.worth ? `${fmtUsd(r.cba)}（划算）` : strong(`${fmtUsd(r.cba)}（不划算）`),
      ];
    });
    return [
      note("（网页版此处可交互：自己填 AV / EF / ARO 和控制后的数值；下表是预设场景的结果）"),
      table(["场景", "SLE = AV × EF", "ALE = SLE × ARO", "控制后 ALE", "ACS", "CBA"], rows),
    ];
  },
  IrPhaseQuiz(_node, a) {
    const data = a.set === "picerl" ? irPicerlData : irPhaseData;
    const name = (id) => data.phases.find((p) => p.id === id).en;
    return [
      note("（网页版此处是「这一步属于 IR 哪个阶段」的点选练习；下表是全部题目和答案）"),
      table(["动作", "阶段", "理由"], data.items.map((it) => [it.text, strong(name(it.phase)), it.why])),
    ];
  },
  WriteQA(node, a) {
    const kind = a.kind === "LA" ? "Long Question" : "Short Question";
    const meta = [kind, a.marks && `${a.marks} marks`, a.limit].filter(Boolean).join(" · ");
    return [
      para(strong(`[${meta}] ${a.q}`)),
      note("（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）"),
      { type: "blockquote", children: node.children },
    ];
  },
  Pt(node, a) {
    const inline = node.children.length === 1 && node.children[0].type === "paragraph" ? node.children[0].children : node.children;
    return [para(text(`☐ [${a.m ?? 1} 分] `), ...inline)];
  },
  CalcDrill() {
    const rows = DRILL_KINDS.map((k) => {
      const q = drillQuestion(k.id, 1);
      return [k.label, q.prompt, q.answers.map((x) => `${x.label}：${drillAnswer(x)}`).join("；"), q.steps.join("；")];
    });
    return [
      note("（网页版此处可交互：按题型随机出题、自己填答案检查、看步骤；下表是每种题型的一道例题）"),
      table(["题型", "题目", "答案", "步骤"], rows),
    ];
  },
  SeverityLadder() {
    const rows = SEVERITY_PRESETS.map((p) => {
      const r = classifySeverity(p.picks);
      const facts = SEVERITY_DIMENSIONS.map((d) => d.options[p.picks[d.id]]).filter((o) => o.level > 1).map((o) => `${o.label}（L${o.level}）`);
      return [p.label, facts.join("；") || "全部最低一档", strong(`Level ${r.level.n} · ${r.level.en}`), r.level.lead];
    });
    return [
      note("（网页版此处可交互：按五个维度点选事件特征，取最严重的一维定级；下表是预设场景的结果）"),
      table(["场景", "触发升级的特征", "级别", "谁来领导"], rows),
    ];
  },
  PriorityScoreLab() {
    const full = decideInvest(INVEST_ITEMS, "full", 1);
    const simple = Object.fromEntries(decideInvest(INVEST_ITEMS, "simple", 1).map((x) => [x.id, x]));
    const rows = full.map((x) => [
      `${x.name}（${x.scenario}）`,
      `${fmtInvestScore(x.score)}（第 ${x.rank}）`,
      `${fmtInvestScore(simple[x.id].score)}（第 ${simple[x.id].rank}）`,
      strong(x.verdict),
      x.why,
    ]);
    return [
      note("（网页版此处可交互：切换 p.7 / p.20 公式、改每项举措的输入和前提条件；下表是默认数值的结果。数值为示意，成本参考 p.30–34 案例）"),
      table(["Initiative", "p.20 分数", "p.7 分数", "决定", "理由"], rows),
    ];
  },
  BudgetMixLab() {
    const blocks = MIX_PRESETS.flatMap((p) => {
      const r = checkMix(p.shares, p.total);
      const status = { in: "区间内", below: "低于区间", above: "高于区间", na: "—" };
      return [
        para(strong(`${p.label}（合计 ${fmtInvestPct(r.sum)}）`)),
        table(
          ["类别", "p.19 建议", "占比", "金额", "判断"],
          r.rows.map((c) => [c.name, investRange(c), fmtInvestPct(c.pct), fmtInvestK(c.k), c.status === "in" || c.status === "na" ? status[c.status] : strong(status[c.status])]),
        ),
      ];
    });
    return [note("（网页版此处可交互：拖动每一类的预算占比、改总预算、切换「恢复能力不可靠」，并展开 p.30–35 的举措明细；下面是三个预设的结果）"), ...blocks];
  },
  PmrQuiz() {
    const name = (id) => pmrItems.categories.find((c) => c.id === id).en;
    return [
      note("（网页版此处是「这属于 Prevention / Mitigation / Remediation 哪一种」的点选练习；下表是全部题目和答案）"),
      table(["动作", "属于", "理由"], pmrItems.items.map((it) => [it.text, strong(name(it.cat)), it.why])),
    ];
  },
  CardinalityLab() {
    const rows = cardinalityItems.map((it) => [
      `${it.from} → ${it.to}`,
      it.rule,
      strong(`${cardSymbolFor(it.min, it.max)}（${cardSymbolName(it.min, it.max)}）`),
      it.why,
    ]);
    return [
      note("（网页版此处可交互：对每条 business rule 回答两个问题，自动算出基数符号；下表是全部题目和答案）"),
      table(["A → B", "Business rule", "B 端符号", "理由"], rows),
    ];
  },
  NormalizationLab() {
    const blocks = normalizationScenarios.flatMap((s) => {
      const fdRows = s.fds.map((fd) => [fdText(fd), strong(classifyFd(s.pk, fd.det))]);
      const decompRows = s.decomposition.map((t) => [
        t.name,
        t.cols.map((c) => (t.pk.includes(c) ? `_${c}_` : c)).join(", "),
        t.fk.map((f) => `${f.col} → ${f.ref}`).join("；") || "—",
      ]);
      return [
        para(strong(`${s.label}：${s.table}（主键 = ${s.pk.join(" + ")}）`)),
        table(["Functional Dependency", "属于"], fdRows),
        table(["分解后的表", "列（斜体 = 主键）", "外键"], decompRows),
      ];
    });
    return [note("（网页版此处可交互：给每条函数依赖分类 Full / Partial / Transitive，再看分解到 3NF 的结果；下面是全部场景的答案）"), ...blocks];
  },
  NormalizeWalkthrough() {
    const schema = (t) => t.cols.map((c) => (t.pk.includes(c) ? `_${c}_` : c)).join(", ");
    const blocks = WALK_SCENARIOS.flatMap((s) => {
      const steps = normalizeSteps(s);
      const out = [para(strong(s.label))];
      for (const st of steps) {
        out.push(para(strong(`${st.title}`), text(st.id === "raw" ? "" : `（${st.tables.length} 张表，重复存储 ${st.redundant} 格）`)));
        if (st.id === "raw" || st.id === "1nf") {
          const t = st.tables[0];
          out.push(table(t.cols, t.rows.map((r) => r.map((v) => (Array.isArray(v) ? v.join(", ") : String(v))))));
        } else if (st.fds) {
          out.push(table(["Functional Dependency", "类型"], st.fds.map((fd) => [fdText(fd), strong(fd.kind)])));
        } else {
          out.push(table(["表", "列（斜体 = 主键）", "外键"], st.tables.map((t) => [t.name, schema(t), t.fk.map((f) => `${f.col} → ${f.ref}`).join("；") || "—"])));
        }
        if (st.notes.length) out.push({ type: "list", ordered: false, spread: false, children: st.notes.map((n) => ({ type: "listItem", spread: false, children: [para(text(n))] })) });
      }
      return out;
    });
    return [note("（网页版此处可以一步步看原始表 → 1NF → 2NF → 3NF，并高亮每一步还在重复存储的格子；下面是三个例子每一步的结果）"), ...blocks];
  },
  FdFinderLab() {
    const blocks = FD_SCENARIOS.flatMap((s) => [
      para(strong(`${s.label}（主键 = ${s.pk.join(" + ")}）`)),
      table(
        ["非键列放左边", "数据里没有反例的候选", "业务含义判断"],
        sweepNonKey(s).flatMap((r) =>
          r.found.length
            ? r.found.map((f) => [`${r.det} → ${f.col}`, f.real ? strong("真 FD") : "假候选", f.why])
            : [[`${r.det} → ∅`, "—", "数据里就有反例"]],
        ),
      ),
    ]);
    return [note("（网页版此处可交互：自己选决定因素，看数据里有没有反例；下面是每个例子「第三层扫描」的结果）"), ...blocks];
  },
  ThreatActorQuiz() {
    const name = (id) => threatActorData.types.find((t) => t.id === id).en;
    return [
      note("（网页版此处是「这是哪种 Threat Actor」的点选练习，部分题目要选两项；下表是全部题目和答案）"),
      table(
        ["场景", "属于", "理由"],
        threatActorData.items.map((it) => [it.scenario, strong(it.answers.map(name).join(" + ")), it.why]),
      ),
    ];
  },
  FirewallRuleLab() {
    const rows = FW_PRESETS.map((p) => {
      const r = evalFirewall(firewallRules, { srcIp: p.srcIp, dstIp: p.dstIp, dstPort: p.dstPort });
      return [p.label, `${p.srcIp} → ${p.dstIp}:${p.dstPort}`, `#${r.index + 1}`, strong(r.rule.action === "allow" ? "Allow" : "Deny")];
    });
    return [
      note("（网页版此处可交互：自己填 Source IP / Dest IP / Dest Port，逐条走一遍规则表；下表是几个典型场景的结果）"),
      table(["场景", "Packet", "命中规则", "结果"], rows),
    ];
  },
  TcpHandshakeLab() {
    const blocks = HANDSHAKE_PRESETS.flatMap((p) => [
      para(strong(`${p.label}：Client ISN = ${p.clientIsn}，Server ISN = ${p.serverIsn}`)),
      table(
        ["#", "方向", "Flags", "SEQ", "ACK", "Len", "说明"],
        tcpConversation(p).map((r, i) => [String(i + 1), r.from === "client" ? "Client → Server" : "Server → Client", r.flags, String(r.seq), r.ack == null ? "—" : String(r.ack), String(r.len), r.why]),
      ),
    ]);
    return [note("（网页版此处可以自己填两边的 ISN 和数据长度，一步步看 SEQ / ACK；下面是两个例子的结果）"), ...blocks];
  },
  WindowLab() {
    const blocks = WINDOW_PRESETS.flatMap((p) => [
      para(strong(p.label)),
      table(
        ["轮", "窗口", "发送方发出（↻ 重传，✗ 丢失）", "接收方回"],
        simulateWindow(p).map((r, i) => [
          String(i + 1),
          `${r.winStart}–${Math.min(p.total, r.winStart + r.window - 1)}（${r.window}）`,
          r.sent.map((s) => `${s.retx ? "↻" : ""}${s.n}${s.arrived ? "" : "✗"}`).join("  "),
          `ACK ${r.ack}${r.timeout ? " ⏰ 超时" : ""}`,
        ]),
      ),
    ]);
    return [note("（网页版此处可以自己设窗口大小、点选丢失的段，一轮轮看滑动和重传；下面是三个例子）"), ...blocks];
  },
  PortLab() {
    const ports = PORT_PRESETS.map((n) => {
      const r = classifyPort(n);
      return [strong(String(n)), r.label, r.known ? `${r.known.proto} ${r.known.app}` : "—"];
    });
    const flows = openConnections(["UST", "FB"]).flatMap((c) => [
      [`PC → ${c.server.id}`, `(${c.request.ip.join(", ")})`, `(${c.request.mac.join(", ")})`, `(${c.request.port.join(", ")})`],
      [`${c.server.id} → PC`, `(${c.reply.ip.join(", ")})`, `(${c.reply.mac.join(", ")})`, `(${c.reply.port.join(", ")})`],
    ]);
    return [
      note("（网页版此处可以输入任意端口号分类，并打开多个浏览器窗口观察源端口怎样区分对话）"),
      table(["端口", "范围", "常见用途"], ports),
      table(["方向", "IP (S, D)", "MAC (S, D)", "Port (S, D)"], flows),
    ];
  },
  SubnetLab() {
    const blocks = SUBNET_PRESETS.flatMap((x) => {
      const p = subnetPlan(x.address, x.borrow);
      const n = Math.min(p.subnets, 8);
      const rows = Array.from({ length: n }, (_, i) => p.subnet(i)).map((r) => [String(r.i), r.subnetBits, r.network, `${r.first} – ${r.last}`, r.broadcast]);
      if (p.subnets > n) {
        const l = p.subnet(p.subnets - 1);
        rows.push(["…", "…", "…", "…", "…"], [String(l.i), l.subnetBits, l.network, `${l.first} – ${l.last}`, l.broadcast]);
      }
      const hit = p.locate(x.probe);
      return [
        para(strong(`${x.label}：Class ${p.cls}，掩码 ${p.mask.dotted} (/${p.prefix})，2^${p.borrow} = ${p.subnets} 个子网，每个 2^${p.hostBits} − 2 = ${p.hostsPerSubnet} 台主机`)),
        table(["S.N #", "子网位", "Network address", "Host range", "Broadcast"], rows),
        para(text(`${x.probe} AND ${p.mask.dotted} = `), strong(hit.network), text(`（第 ${hit.i} 个子网，broadcast ${hit.broadcast}）`)),
      ];
    });
    return [note("（网页版此处可以输入任意网络和借位数，并查任意地址属于哪个子网；下面是板书和课件例子的结果）"), ...blocks];
  },
  SubnetPlanner() {
    const rows = PLAN_PRESETS.map((x) => {
      const r = planOptions(x.cls, x.subnets, x.hosts);
      const base = 32 - r.total;
      return [x.label, `Class ${x.cls}`, String(x.subnets), String(x.hosts), String(r.minBorrow), String(r.minHostBits), strong(r.feasible ? (r.minBorrow === r.maxBorrow ? `借 ${r.minBorrow} 位 (/${base + r.minBorrow})` : `借 ${r.minBorrow}–${r.maxBorrow} 位 (/${base + r.minBorrow}–/${base + r.maxBorrow})`) : "做不到")];
    });
    return [
      note("（网页版此处可以自己填 Class、需要的子网数和主机数；下表是课件和板书题的结果）"),
      table(["题目", "Class", "需要子网", "每子网主机", "最少借位", "最少 host 位", "可行方案"], rows),
    ];
  },
  VendorTierCalculator() {
    const rows = VENDOR_TIER_PRESETS.map((p) => {
      const { rating, isTier1 } = computeVendorTier(p.scores);
      const factorStr = VENDOR_FACTORS.map((f) => `${f.id.toUpperCase()}=${p.scores[f.id]}`).join(" ");
      return [p.label, factorStr, strong(rating.toFixed(2)), isTier1 ? strong("Tier 1") : "非 Tier 1"];
    });
    return [
      note("（网页版此处可以自己给 6 个因子打分 1/3/5；下表是预设场景的结果）"),
      table(["场景", "因子打分", "Rating", "结论"], rows),
    ];
  },
  SqlPipelineLab() {
    const code = (value) => ({ type: "code", lang: "sql", value });
    const blocks = SQL_PRESETS.flatMap((p) => {
      const r = runSql(p.q);
      const order = r.steps.map((s) => `${s.clause}（${s.marks.filter((m) => m !== "drop").length} ${s.clause === "HAVING" ? "组" : "行"}）`).join(" → ");
      return [
        para(strong(p.label)),
        code(r.sql),
        para(text(`执行顺序：${order}${r.error ? ` → ${r.error.clause} ✗` : ""}`)),
        r.error ? para(strong(`${r.error.code}：`), text(r.error.msg)) : table(r.result.cols, r.result.rows.map((row) => row.map(sqlShow))),
      ];
    });
    return [note("（网页版此处可以自己组合 WHERE / GROUP BY / HAVING / ORDER BY，并逐步查看每个子句执行后的中间表；下面是预设查询的结果）"), ...blocks];
  },
  JoinLab() {
    const counts = JOIN_TYPES.map((t) => {
      const r = runJoin({ type: t, extraOrder: true });
      return [t === "INNER" ? "INNER JOIN" : `${t} OUTER JOIN`, String(r.counts.match), String(r.counts.left), String(r.counts.right), strong(String(r.rows.length))];
    });
    const left = runJoin({ type: "LEFT" });
    const self = runJoin({ data: "self", type: "INNER" });
    return [
      note("（网页版此处可以切换四种 join、加一张 CustomerID 为 NULL 的订单、以及做 self-join；下面是同一套数据的结果）"),
      para(text("Customer_T（15 位客户）⋈ Order_T（10 张订单 + 1 张 CustomerID = NULL 的订单 1011）：")),
      table(["Join", "匹配行", "左边独有（补 NULL）", "右边独有（补 NULL）", "结果行数"], counts),
      para(strong("LEFT OUTER JOIN（p.47）")),
      table(left.cols, left.rows.map((r) => r.v.map(sqlShow))),
      para(strong("Self-join（p.50）")),
      table(self.cols, self.rows.map((r) => r.v.map(sqlShow))),
    ];
  },
  GrantLab() {
    let st = emptyDcl();
    const rows = DCL_SCRIPT.map((id, i) => {
      const r = dclStep(st, id);
      st = r.state;
      const s = DCL_STATEMENTS.find((x) => x.id === id);
      return [String(i + 1), s.by, { type: "inlineCode", value: s.sql }, r.ok ? "✓" : "✗", r.msg];
    });
    const who = [...DCL_USERS, DCL_ROLE];
    const matrix = who.map((u) => [
      u + (u !== DCL_ROLE && st.members.includes(u) ? `（+ ${DCL_ROLE}）` : ""),
      ...DCL_PRIVS.map(([o, p]) => {
        const c = dclCell(st, u, o, p);
        return c.direct || c.viaRole ? `✓${c.wgo ? " (GRANT OPTION)" : ""}${c.viaRole ? "（经由角色）" : ""}` : "—";
      }),
    ]);
    return [
      note("（网页版此处可以按任意顺序执行 GRANT / REVOKE 并看权限矩阵变化；下面是按课件顺序走一遍的结果）"),
      table(["#", "执行者", "语句", "", "结果"], rows),
      para(strong("最终权限矩阵")),
      table(["用户 / 角色", ...DCL_PRIVS.map(([o, p]) => `${p} ON ${o}`)], matrix),
    ];
  },
  SqlExercise(_node, a) {
    const ex = findExercise(sqlPractice, a.id);
    const inline = (t) => parseInline(t).map((p) => (p.t === "code" ? { type: "inlineCode", value: p.v } : p.t === "b" ? strong(p.v) : text(p.v)));
    const out = [
      para(strong(`${ex.id} · ${ex.title}`), text(`（${sqlPractice.sections[ex.section]} ${levelDots(ex.level)}）`)),
      para(...inline(ex.q)),
    ];
    if (ex.hint) out.push(para(text("提示："), ...inline(ex.hint)));
    const answer = ex.steps.flatMap((s, i) => {
      const x = s.expect;
      const blocks = [{ type: "code", lang: "sql", value: s.sql }];
      const head = `${ex.steps.length > 1 ? `第 ${i + 1} 步 · ` : ""}预期：${expectSummary(x)}`;
      if (x.kind === "rows" || x.kind === "contains") {
        blocks.push(para(strong(head)));
        if (x.rows.length) blocks.push(table(x.cols, x.rows.map((r) => r.map(sqlxCell))));
        if (x.note || x.text) blocks.push(para(...inline(x.note ?? x.text)));
      } else if (x.kind === "error") {
        blocks.push(para(strong(`${ex.steps.length > 1 ? `第 ${i + 1} 步 · ` : ""}预期报错：`), { type: "inlineCode", value: `${x.code}: ${x.msg}` }));
      } else if (x.kind === "free") {
        blocks.push(para(strong("预期：")), para(...inline(x.text)));
      } else {
        blocks.push(para(strong(head)));
      }
      return blocks;
    });
    out.push({ type: "blockquote", children: [...answer, ...(ex.why ? [para(strong("为什么："), ...inline(ex.why))] : [])] });
    return out;
  },
  SqlTables(_node, a) {
    const ds = sqlPractice.datasets[a.set];
    return ds.tables.flatMap((t) => [
      para(strong(t.name), text(`：${t.desc}（${t.rows.length} 行）`)),
      table(t.cols.map((c) => `${c.name}${c.key ? ` (${c.key})` : ""}`), t.rows.map((r) => r.map(sqlxCell))),
    ]);
  },
  SqlScript(_node, a) {
    const ds = sqlPractice.datasets[a.set];
    return [note(`（网页版此处可以一键复制 ${ds.file}；完整脚本如下）`), { type: "code", lang: "sql", value: ds.script.trimEnd() }];
  },
  SqlProgress() {
    return [];
  },
  Result(node, a) {
    return [para(strong(`${a.label ?? "结果"}：`)), ...node.children];
  },
  Ipv6Lab() {
    const rows = IPV6_PRESETS.map((a) => {
      const r = analyzeIpv6(a);
      if (r.error) return [{ type: "inlineCode", value: a }, "—", "—", r.error];
      return [{ type: "inlineCode", value: a }, { type: "inlineCode", value: r.compressed }, `${r.info.en}（${r.info.range}）`, r.parts ? `GRP ${r.parts.routing} · Subnet ID ${r.parts.subnet} · IID ${r.parts.iid}` : r.info.note];
    });
    return [note("（网页版此处可以输入任意 IPv6 地址：显示完整 / 去前导 0 / 压缩写法、地址类型、GUA 三部分和 solicited-node 地址；下表是几个例子）"), table(["输入", "压缩写法", "类型", "说明"], rows)];
  },
  Eui64Lab() {
    const rows = EUI_PRESETS.map((x) => {
      const r = eui64(x.mac, x.prefix);
      return [x.label, r.mac, `${r.oui.join(":")}:FF:FE:${r.device.join(":")}`, `${r.oui[0]} → ${r.flippedHex}`, strong(r.iid), r.linkLocal, r.global];
    });
    return [note("（网页版此处可以输入任意 MAC 地址和 /64 prefix，逐步生成 EUI-64 Interface ID）"), table(["例子", "MAC", "插入 FFFE", "翻转 U/L 位", "Interface ID", "Link-local", "SLAAC 全球单播"], rows)];
  },
  RaOptionLab() {
    return [
      note("（网页版此处可以切换 RA 的三个选项，看消息顺序和每项信息的来源）"),
      table(["信息", ...RA_OPTIONS.map((o) => `Option ${o.id} · ${o.name}`)], [
        ...RA_FIELDS.map((f) => [f.label, ...RA_OPTIONS.map((o) => o.source[f.key])]),
        ["消息顺序", ...RA_OPTIONS.map((o) => o.steps.map((x) => x.msg).join(" → "))],
        ["状态", ...RA_OPTIONS.map((o) => o.stateful)],
      ]),
    ];
  },
  Ipv6SubnetLab() {
    const blocks = SUBNET6_PRESETS.flatMap((x) => {
      const p = ipv6SubnetPlan(x.block, x.prefix);
      const rows = [0, 1, 2, 3].map((i) => p.subnet(i)).map((r) => [r.id, r.network]);
      rows.push(["…", "…"], [p.last.id, p.last.network]);
      const hit = p.locate(x.probe);
      return [
        para(strong(`${x.label}：借 ${p.bits} 位 → 2^${p.bits} = ${fmtBig(p.count)} 个子网，每个子网 Interface ID 剩 ${p.iidBits} 位`)),
        table(["#", "子网"], rows),
        para(text(`${x.probe} → `), strong(hit.network)),
      ];
    });
    return [note("（网页版此处可以自己选地址块和新前缀长度，并查任意地址属于哪个子网）"), ...blocks];
  },
  BaselineLab() {
    const all = BASELINE_SCENARIOS.map((x) => x.id);
    const name = (id) => BASELINE_SCENARIOS.find((x) => x.id === id).label;
    const ev = (t) => t.events.map((e) => `${e.caught ? "✅" : "❌"} ${name(e.id)}`).join("；");
    const rows = BASELINE_PRESETS.flatMap((x) => {
      const { summary } = simulateBaseline(all, x.threshold);
      return [
        [x.label, "规则阈值", String(summary.static.alerts), String(summary.static.fp), ev(summary.static)],
        [x.label, "AI 基线", String(summary.ai.alerts), String(summary.ai.fp), ev(summary.ai)],
      ];
    });
    return [
      note("（网页版此处是一周流量的折线图：可以拖动规则阈值、打开 / 关闭三个场景，看规则和 AI 基线各报了什么警；下表是三个场景全开时的结果）"),
      table(["设置", "方法", "报警数", "误报", "攻击抓到没有"], rows),
    ];
  },
  TrendSortQuiz(node, a) {
    const set = aiTrendQuiz[a.set] ?? aiTrendQuiz.ml;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  CommandSortQuiz() {
    return [
      note("（网页版此处是「这条语句属于哪一类」的点选练习；下表是全部题目和答案）"),
      table(["语句", "类别", "理由"], COMMAND_ITEMS.map((it) => [{ type: "inlineCode", value: it.sql }, strong(it.a), it.why])),
    ];
  },
  TxnSortQuiz(_node, a) {
    const set = txnQuiz[a.set] ?? txnQuiz.acid;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  WalLab() {
    return [
      note("（网页版此处可以自己一步步执行 T1，决定什么时候 flush 日志、flush 数据页、回复用户、崩溃；违反 WAL 的操作会被拦下。下面是三个演示的结果）"),
      ...WAL_DEMOS.flatMap((d) => {
        const { state, trail } = runWal(d.actions);
        const rows = trail.map((t, i) => [String(i + 1), WAL_ACTION_LABEL[t.action], t.msg?.text ?? ""]);
        const after = state.crashed
          ? [para(strong("重启后恢复："), text(`${state.crashed.verdict}。`)), para(text(state.crashed.result.steps.map((s) => `【${PHASE_LABEL[s.phase]}】${s.title}`).join(" → ")))]
          : [];
        return [para(strong(d.label)), table(["#", "操作", "结果"], rows), ...after];
      }),
    ];
  },
  RecoveryLab(_node, a) {
    const ids = a.presets ? String(a.presets).split(",").map((s) => s.trim()) : RECOVERY_PRESETS.map((p) => p.id);
    return [
      note("（网页版此处可以逐步走恢复过程、每一步先自己判断，还可以改「崩溃时磁盘页面写到哪里」；下面是课件设定下的完整步骤）"),
      ...RECOVERY_PRESETS.filter((p) => ids.includes(p.id)).flatMap((p) => {
        const start = presetStart(p);
        const run = recover({ init: p.init, log: p.log, page: start, crash: p.crash, abortTxn: p.abortTxn });
        const rows = run.steps.map((s, i) => [String(i + 1), PHASE_LABEL[s.phase], s.title, pageText(s.page)]);
        return [
          para(strong(`${p.label}（${p.source}）`), text(`：${p.intro}`)),
          para(text(`日志：${p.log.map(recLine).join("；")}${p.crash ? " → CRASH" : ""}`)),
          para(text(`${p.crash ? "崩溃时磁盘页面" : "内存里的页面"}：${pageText(start)}`)),
          table(["#", "阶段", "发生了什么", "之后的页面"], rows),
        ];
      }),
    ];
  },
};

function convert(ctx) {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.type === "mdxjsEsm" || node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        const fn = components[node.name];
        // Lowercase tags are plain HTML (<u>, <br />, <sub>…): keep them as raw HTML, which Markdown allows.
        const isHtml = /^[a-z]/.test(node.name ?? "");
        if (!fn && !isHtml) console.warn(`  ! no Markdown mapping for <${node.name}>, keeping its children`);
        const replacement = fn
          ? fn(node, attrs(node), ctx)
          : isHtml && node.children.length === 0
            ? [{ type: "html", value: `<${node.name} />` }]
            : isHtml
              ? [{ type: "html", value: `<${node.name}>` }, ...node.children, { type: "html", value: `</${node.name}>` }]
              : node.children;
        parent.children.splice(index, 1, ...replacement);
        return index; // revisit: children may contain more components
      }
    });
  };
}

/**
 * Convert MDX source (without frontmatter) to plain Markdown.
 * Returns the Markdown, the relative image URLs it references, and files the
 * components generated (e.g. an SVG diagram) as { path, data } relative to the note.
 */
export async function mdxToMarkdown(body) {
  const images = [];
  const ctx = { generated: [] };
  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkCjkFriendly)
    .use(convert, ctx)
    .use(remarkBreaks)
    .use(() => (tree) => visit(tree, "image", (n) => images.push(n.url)))
    .use(remarkStringify, {
      bullet: "-",
      rule: "-",
      fences: true,
      // Two trailing spaces rather than a backslash: both GitHub and python-markdown understand it.
      handlers: { break: () => "  \n" },
    })
    .process(body);

  // remark-mdx is still registered, so stringify escapes "<" and "{" for MDX — undo that for plain Markdown.
  // A text "<" right before a letter (e.g. "<T1 COMMIT>") would read as an HTML tag and vanish on GitHub, so keep it as &lt;.
  const md = String(file).replace(/\\<(?=[A-Za-z/!?])/g, "&lt;").replace(/\\([<{])/g, "$1");
  return { md, images: [...new Set(images)], generated: ctx.generated };
}

