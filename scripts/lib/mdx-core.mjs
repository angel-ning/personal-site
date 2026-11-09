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
import { computeRisk, RISK_SCENARIOS, HEATMAP_ROWS, IMPACT_LABELS as HM_IMPACT, LIKELIHOOD_LABELS as HM_LIK, VALUE_CRITERIA, VALUE_ASSETS, weightedValue } from "../../src/components/mdx/risk-logic.mjs";
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
import { topologyById, requirements as addrRequirements, addressPlan, routingTables, walkPacket, topologySvg, toStaticSvg } from "../../src/components/mdx/addressing-logic.mjs";
import { SEQACK_PRESETS, seqAckLadder, ladderSvg, arrowLabel } from "../../src/components/mdx/seqack-logic.mjs";
import { toBits, toHex, readOctet, decompose, andTable, BINARY_PRESETS, AND_PRESETS } from "../../src/components/mdx/binary-logic.mjs";
import { prefixRows, fitRequirements, fieldSplit, NEED_PRESETS, SPLIT_PRESETS } from "../../src/components/mdx/mask-logic.mjs";
import { DEMO as STATEFUL_DEMO, STATELESS_RULES, runStateful } from "../../src/components/mdx/stateful-logic.mjs";
import { MODES as VPN_MODES, MODE_IDS as VPN_MODE_IDS } from "../../src/components/mdx/vpn-logic.mjs";
import { vigenere, transposition, CIPHER_PRESETS, keyCount, KEY_COUNT_PRESETS, keyStrength, KEY_STRENGTH_PRESETS } from "../../src/components/mdx/cipher-logic.mjs";
import { avalanche, HASH_PRESETS, chainCheck, sealChain, CHAIN_DATA } from "../../src/components/mdx/hash-logic.mjs";
import { costBalance, COST_PRESETS, fmtK as fmtCostK } from "../../src/components/mdx/cost-balance-logic.mjs";
import { TLS_STEPS } from "../../src/components/mdx/tls-logic.mjs";
import { LOOKUP_PRESETS, LOOKUP_ROUTERS, buildTable, lookup as routeLookup, staticCommand, prefixToMask, dvRun, LS_PRESETS, LS_LINKS, linkCost, spf, lsSvg, toStaticSvg as routingStatic } from "../../src/components/mdx/routing-logic.mjs";
import { RIP_PRESETS, ripRun, showLine as ripShowLine, AD_PRESETS, chooseRoute, srcLabel as adSrcLabel } from "../../src/components/mdx/rip-logic.mjs";
import { EIGRP_PRESETS, dual as eigrpDual, failover as eigrpFailover, ROLE_LABEL as EIGRP_ROLE } from "../../src/components/mdx/eigrp-logic.mjs";
import { PREFIX_SETS, longestMatch } from "../../src/components/mdx/prefix-logic.mjs";
import { upgradeCost as zaraCost, networkTradeoff as zaraNet, UPGRADE_PRESETS as ZARA_PRESETS, fmtEur } from "../../src/components/mdx/zara-logic.mjs";
import { CALLERS as CRM_CALLERS, ROUTE_STEPS as CRM_STEPS, routeFor as crmRoute, routeNote as crmRouteNote } from "../../src/components/mdx/crm-logic.mjs";
import { MODELS as CLOUD_MODELS, STACK as CLOUD_STACK, KITCHEN as CLOUD_KITCHEN, ELASTIC_PRESETS, elasticity, elasticityVerdict, TCO_PRESETS, tco, fmtUsd as cloudUsd } from "../../src/components/mdx/cloud-logic.mjs";
import { OPTION_SETS, weightedScores, PROVIDERS, quoteRow, LAYER_PRESETS, layerCase, CAPACITY_PRESETS, capacityMix, capacityVerdict, fmtEur as sourcingEur } from "../../src/components/mdx/sourcing-logic.mjs";
import { businessCase as crmCase, CASE_PRESETS as CRM_PRESETS, fmtUsdK as crmUsd } from "../../src/components/mdx/crm-case-logic.mjs";
import { FLOW_PRESETS as OTIS_PRESETS, whoKnows as otisWhoKnows, flowSvg as otisFlowSvg, toStaticSvg as otisStatic, STAKEHOLDERS as OTIS_ROLES, ATTITUDE as OTIS_ATT } from "../../src/components/mdx/otis-logic.mjs";
import { RECOVERY_PRESETS, PHASE_LABEL, WAL_DEMOS, WAL_ACTION_LABEL, recover, presetStart, recLine, pageText, runWal } from "../../src/components/mdx/recovery-logic.mjs";

import { PY_DEFAULT_TEXT, PY_OPS, runPyOp } from "../../src/components/mdx/py-object-logic.mjs";
import { TRIAGE_LABEL, TRIAGE_RULE_WORDS, evaluate as triageEvaluate } from "../../src/components/mdx/triage-logic.mjs";
import { overfitTable } from "../../src/components/mdx/overfit-logic.mjs";
import { FORMAT_PRESETS, formatValue, fl, pyRepr as pyLabRepr, BRANCH_PRESETS, runBranches, branchValueText, SLICE_ITEMS, SLICE_PRESETS, evalSubscript, RANGE_PRESETS, pyRange, NESTED_PRESETS, walkPath, shortRepr as pyShort, TEMP_PROMPT, nextTokenProbs } from "../../src/components/mdx/py-lab-logic.mjs";
import { FLOW_STAGES } from "../../src/components/mdx/ai-flow-logic.mjs";
import { LOOP_FACTORS, LOOP_PRESETS, decideLoop } from "../../src/components/mdx/loop-logic.mjs";
import { PILOT_UNTESTED, pilotSummary, pct as pilotPct, zeroErrorBound } from "../../src/components/mdx/pilot-logic.mjs";
import { RECEIPT_PRESETS, traceCopies } from "../../src/components/mdx/copy-trace-logic.mjs";
import { GATES, PATHS, RECORDS, USERS, WORKPAPER, evaluateGate } from "../../src/components/mdx/permission-gate-logic.mjs";
import { CONTROL_MODES, SUPPLIERS, VERDICT_LABEL, assessTraining, gateDecision, memoryWalk } from "../../src/components/mdx/grc-talk-logic.mjs";
import { SUBGROUP_PRESETS, subgroupCheck } from "../../src/components/mdx/subgroup-logic.mjs";
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
const l3Quiz = readJson("src/components/mdx/data/l3-quiz.json");
const l4Quiz = readJson("src/components/mdx/data/l4-quiz.json");
const l5Quiz = readJson("src/components/mdx/data/l5-quiz.json");
const l6Quiz = readJson("src/components/mdx/data/l6-quiz.json");
const caseQuiz = readJson("src/components/mdx/data/case-quiz.json");
const routingQuiz = readJson("src/components/mdx/data/routing-quiz.json");
const pyIntroQuiz = readJson("src/components/mdx/data/py-intro-quiz.json");
const pyTraces = readJson("src/components/mdx/data/py-traces.json");
const pyNbQuiz = readJson("src/components/mdx/data/py-notebook-quiz.json");
const govQuiz = readJson("src/components/mdx/data/gov-quiz.json");
const privacyQuiz = readJson("src/components/mdx/data/privacy-quiz.json");
const note = (t) => para({ type: "emphasis", children: [text(t)] });
const relTable = (r) => table(r.cols, r.rows.map((row) => row.map(String)));

// ---------- mdast helpers ----------
const text = (value) => ({ type: "text", value });
const strong = (value) => ({ type: "strong", children: [text(value)] });
const para = (...children) => ({ type: "paragraph", children });
const cell = (v) => ({ type: "tableCell", children: Array.isArray(v) ? v : typeof v === "string" ? [text(v)] : [v] });
// `code` and **bold** inside a plain string → inline mdast nodes.
const rich = (s) => s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((p) => p.startsWith("`") && p.endsWith("`") && p.length > 1 ? { type: "inlineCode", value: p.slice(1, -1) } : p.startsWith("**") && p.endsWith("**") && p.length > 3 ? strong(p.slice(2, -2)) : text(p));
const codeBlock = (value, lang = null) => ({ type: "code", lang, value });
const ic = (value) => ({ type: "inlineCode", value });
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
    const opts = ["a", "b", "c", "d", "e", "f"].filter((k) => a[k]).map((k) => ({
      type: "listItem",
      spread: false,
      children: [para(text(`${k.toUpperCase()}. ${a[k]}`))],
    }));
    return [
      para(strong(a.q)),
      { type: "list", ordered: false, spread: false, children: opts },
      { type: "blockquote", children: [para(strong(`答案：${String(a.answer).toUpperCase().replace(/[^A-F]/g, "").split("").join("、")}`)), ...node.children] },
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
  AddressingLab(_node, a, ctx) {
    const t = topologyById(a.start ?? "a2");
    const req = addrRequirements(t);
    const ap = addressPlan(t, req.pick);
    const w = walkPacket(t, ap, ...t.walk);
    const img = `images/TOPO_${t.id.toUpperCase()}.svg`;
    ctx.generated.push({ path: img, data: toStaticSvg(topologySvg(t, ap, { highlight: w.path })) });
    return [
      note(`（网页版此处可以换拓扑、换借位数、切换子网表 / 编址表 / 路由表 / 走一个包；下面是「${t.label}」借 ${req.pick} 位的结果）`),
      para({ type: "image", url: img, alt: t.label }),
      para(strong(`${req.lans} 个 LAN + ${req.links} 条路由器之间的线 = ${req.subnetsDrawn} 个网络；最少借 ${req.minBorrow} 位，最多借 ${req.maxBorrow} 位；这里借 ${req.pick} 位 → 掩码 ${ap.mask}（/${ap.prefix}）`)),
      table(["Subnet #", "Network", "Usable host range", "Broadcast", "Assigned usage"], ap.subnets.map((s) => [String(s.i), s.network, `${s.first} – ${s.last}`, s.broadcast, s.usage])),
      table(["Device", "Interface", "IP Address", "Subnet Mask", "Default Gateway"], ap.rows.map((r) => [r.device, r.iface, r.role === "router-lan" ? strong(r.ip) : r.ip, r.mask, r.gateway])),
      ...routingTables(t, ap).flatMap((rt) => [
        para(strong(`${rt.name} 路由表`)),
        table(["来源", "Network", "Interface", "Next hop", "Hop"], rt.rows.map((x) => [x.src, `${x.network}/${x.prefix}`, x.iface, x.nextHop, String(x.hops)])),
      ]),
      para(strong(`${t.walk[0]} → ${t.walk[1]}：IP (S, D) = (${w.sIp}, ${w.dIp}) 一路不变`)),
      table(["段", "MAC (S, D)", "发之前 ARP 谁"], w.segs.map((g) => [`${g.from} → ${g.to}`, g.l2 ? `(${g.l2.join(", ")})` : "串行线：PPP / HDLC，没有 MAC", g.arp])),
    ];
  },
  AddressingQuiz(_node, a, ctx) {
    const t = topologyById(a.start ?? "q1");
    const req = addrRequirements(t);
    const ap = addressPlan(t, req.pick);
    const img = `images/TOPO_${t.id.toUpperCase()}_BLANK.svg`;
    ctx.generated.push({ path: img, data: toStaticSvg(topologySvg(t, null, { showAddr: false, showIfaces: false })) });
    return [
      note("（网页版此处是空白编址表：自己加行填 Device / Interface / IP / Mask / Gateway，点「检查」逐格判断并列出漏掉的接口）"),
      para(strong(`${t.source}：`), text(`${t.question} 网络：${t.base}。把所有需要 IP 地址的地方写进表里。`)),
      para({ type: "image", url: img, alt: t.label }),
      { type: "html", value: "<details><summary>参考答案</summary>" },
      para(text(`${req.subnetsDrawn} 个网络 → 最少借 ${req.minBorrow} 位、最多借 ${req.maxBorrow} 位；借 ${req.pick} 位，掩码 ${ap.mask}`)),
      table(["Device", "Interface", "IP Address", "Subnet Mask", "Default Gateway"], ap.rows.map((r) => [r.device, r.iface, r.ip, r.mask, r.gateway])),
      { type: "html", value: "</details>" },
    ];
  },
  SeqAckLab(_node, a, ctx) {
    // preset={1} arrives as an MDX expression value, preset="1" as a string
    const i = Number((typeof a.preset === "object" ? a.preset?.value : a.preset) ?? 0);
    const p = SEQACK_PRESETS[i] ?? SEQACK_PRESETS[0];
    const l = seqAckLadder(p);
    const img = `images/SEQACK_${i}.svg`;
    ctx.generated.push({ path: img, data: toStaticSvg(ladderSvg(l, { a: p.a, b: p.b })) });
    return [
      note(`（网页版此处可以自己填两边的 ISN、window size、段数、编号方式和丢失的段；下面是「${p.label}」）`),
      para({ type: "image", url: img, alt: p.label }),
      table(["#", "方向", "段", "为什么"], l.events.map((e, k) => [String(k + 1), `${e.from} → ${e.to}`, arrowLabel(e), e.note])),
    ];
  },
  BinaryLab() {
    const conv = BINARY_PRESETS.map(readOctet).filter((n, i, all) => all.indexOf(n) === i).map((n) => [String(n), `${toBits(n).slice(0, 4)} ${toBits(n).slice(4)}`, toHex(n), decompose(n).join(" + ") || "0"]);
    const ands = AND_PRESETS.map((p) => {
      const t = andTable(p.ip, p.mask);
      return [`${p.ip} /${t.prefix}`, `${toBits(t.ip[t.focus])} AND ${toBits(t.mask[t.focus])} = ${toBits(t.net[t.focus])}（第 ${t.focus + 1} 段）`, strong(t.net.join(".")), t.bc.join(".")];
    });
    return [
      note("（网页版此处可以输入任意一个 octet 看二进制 / 十六进制 / 位权，并计算任意地址 AND 掩码；下面是几个例子）"),
      table(["十进制", "二进制", "Hex", "位权相加"], conv),
      table(["地址 / 掩码", "关键那一段的 AND", "子网地址", "广播地址"], ands),
    ];
  },
  MaskSizeLab() {
    const fits = NEED_PRESETS.map((p) => {
      const f = fitRequirements(p.cls, p.subnets, p.hosts);
      return [p.label, String(f.minBorrow), String(f.maxBorrow), strong(f.feasible ? (f.minPrefix === f.maxPrefix ? `/${f.minPrefix}` : `/${f.minPrefix} – /${f.maxPrefix}`) : "做不到（min > max）")];
    });
    const splits = SPLIT_PRESETS.map((p) => {
      const r = fieldSplit(p.ip, p.mask);
      const f = r.bits;
      const shown = `${f.slice(0, r.base)} | ${f.slice(r.base, r.prefix)} | ${f.slice(r.prefix)}`;
      return [`${p.ip} /${r.prefix}（${p.note}）`, { type: "inlineCode", value: shown }, `${r.subnetBits} = #${r.subnetNumber}`, strong(r.network), r.broadcast];
    });
    const rows = (cls) => prefixRows(cls).map((r) => [`/${r.prefix}`, r.mask, String(r.borrow), r.subnets.toLocaleString("en-US"), r.hosts.toLocaleString("en-US"), `${r.block}（第 ${r.octet} 段）`]);
    const head = ["Prefix 前缀", "Subnet mask 掩码", "Borrowed 借位", "Subnets 子网数", "Hosts 每子网主机", "Block 间隔"];
    return [
      note("（网页版此处可以输入需求找可行掩码，或输入地址 + 掩码看 Network | Subnet | Host 三段；下面是预设题目的结果和 Class C / B 的全部掩码）"),
      table(["需求", "最少借", "最多借", "可行掩码"], fits),
      table(["地址 / 掩码", "Network | Subnet | Host", "子网号", "子网地址", "广播"], splits),
      para(strong("Class C")), table(head, rows("C")),
      para(strong("Class B")), table(head, rows("B")),
    ];
  },
  CommandSortQuiz() {
    return [
      note("（网页版此处是「这条语句属于哪一类」的点选练习；下表是全部题目和答案）"),
      table(["语句", "类别", "理由"], COMMAND_ITEMS.map((it) => [{ type: "inlineCode", value: it.sql }, strong(it.a), it.why])),
    ];
  },
  OtisFlowLab(_node, _a, ctx) {
    ctx.generated.push({ path: "images/OTIS_FLOW_PRE.svg", data: otisStatic(otisFlowSvg("pre")) });
    ctx.generated.push({ path: "images/OTIS_FLOW_POST.svg", data: otisStatic(otisFlowSvg("post")) });
    const mark = (r) => (r.knows ? "✓" : r.fooled ? "✗（被蒙在鼓里）" : "✗");
    return [
      note("（网页版此处可交互：切换 Pre / Post、调 callback 次数、勾选「branch 掩盖」，看每一层知不知道；下面是两张信息流图和四个预设场景）"),
      para({ type: "image", url: "images/OTIS_FLOW_PRE.svg", alt: "Pre-OTISLINE 信息流" }),
      para({ type: "image", url: "images/OTIS_FLOW_POST.svg", alt: "Post-OTISLINE 信息流" }),
      ...OTIS_PRESETS.flatMap((p) => {
        const pre = otisWhoKnows("pre", p.s);
        const post = otisWhoKnows("post", p.s);
        return [
          para(strong(`${p.label}（30 天 ${p.s.m30} 次 · 90 天 ${p.s.d90} 次${p.s.critical ? " · 危急" : ""}${p.s.hide ? " · branch 掩盖" : ""}${p.s.requested ? " · 上级来要数据" : ""}）`)),
          table(["层级", "Pre", "Pre：原因", "Post", "Post：原因"], pre.map((r, i) => [r.label, mark(r), r.how, mark(post[i]), post[i].how])),
        ];
      }),
    ];
  },
  OtisStakeholderLab() {
    return [
      note("（网页版此处可以点每个角色看前后对比；下表是全部角色）"),
      table(["角色", "态度", "以前", "以后", "原因", "类别", "管理层怎么应对"], OTIS_ROLES.map((r) => [r.label, strong(OTIS_ATT[r.attitude].label), r.before, r.after, r.why, r.cat, r.fix])),
    ];
  },
  ZaraCostLab() {
    const net = zaraNet({ stores: 550, minutes: 15, wage: 10, support: 2000 });
    return [
      note("（网页版此处可以改门店数、新 OS、升级范围、是否装无线网络、每店 IT 支持，看一次性和每年成本；下面是三个预设和店内网络的默认测算）"),
      ...ZARA_PRESETS.flatMap((p) => {
        const r = zaraCost(p.x);
        return [
          para(strong(p.label), text(`：${p.note}`)),
          table(["项目", "怎么算", "一次性", "每年"], [...r.lines.map((l) => [l.label, l.calc, l.once ? fmtEur(l.once) : "—", l.annual ? fmtEur(l.annual) : "—"]), [strong("合计"), "", strong(fmtEur(r.once)), strong(fmtEur(r.annual))]]),
        ];
      }),
      para(strong("店内网络（Slide 12）"), text(`：550 店 × 15 分钟 × €10 × 360 天 ≈ ${fmtEur(net.benefit)} / 年；如果每店每年要 €2,000 IT 支持，成本 ${fmtEur(net.cost)} / 年，净值 ${fmtEur(net.net)}（时薪和支持成本都是假设）。`)),
    ];
  },
  ServiceModelLab() {
    const who = (m, i) => (i < m.mine ? "你" : "供应商");
    return [
      note("（网页版此处可以切换 On-prem / IaaS / PaaS / SaaS，看每一层谁来管；下表是四种模式的对照）"),
      table(["Layer", ...CLOUD_MODELS.map((m) => m.label)], CLOUD_STACK.map((l, i) => [l, ...CLOUD_MODELS.map((m) => who(m, i))])),
      table(["Catering（Slide 17）", ...CLOUD_MODELS.map((m) => m.label)], CLOUD_KITCHEN.map((k, i) => [k, ...CLOUD_MODELS.map((m) => (m.kitchen[i] === "you" ? "你" : "供应商"))])),
      table(["", ...CLOUD_MODELS.map((m) => m.label)], [
        ["例子", ...CLOUD_MODELS.map((m) => m.example)],
        ["控制权", ...CLOUD_MODELS.map((m) => m.control)],
        ["上线速度", ...CLOUD_MODELS.map((m) => m.speed)],
        ["成本结构", ...CLOUD_MODELS.map((m) => m.cost)],
        ["适合", ...CLOUD_MODELS.map((m) => m.fit)],
      ]),
    ];
  },
  ElasticityLab() {
    return [
      note("（网页版此处可以选需求曲线、调自己买的容量和预留基线，比较三种买法；下面是四个预设的结果，按需单价 = 1）"),
      ...ELASTIC_PRESETS.flatMap((p) => {
        const r = elasticity(p.x);
        return [
          para(strong(p.label), text(`：${r.pattern.note}（自己买 ${p.x.ownPct}% 峰值，预留 ${p.x.reservePct}% 峰值）`)),
          table(["买法", "总成本", "闲置容量", "没服务到的需求"], r.options.map((o) => [o.id === r.best.id ? strong(`${o.label} ✓`) : o.label, String(Math.round(o.cost)), String(Math.round(o.idle)), String(Math.round(o.unmet))])),
          para(text(elasticityVerdict(r))),
        ];
      }),
    ];
  },
  CloudExitLab() {
    return [
      note("（网页版此处可以拖动年数、云账单、硬件、运营和迁移成本，看累计成本曲线；下面是四个预设的结果）"),
      ...TCO_PRESETS.flatMap((p) => {
        const r = tco(p.x);
        return [
          para(strong(p.label), text(`：${p.note}`)),
          table(["", ...r.rows.map((row) => (row.year === 0 ? "起点" : `Y${row.year}`))], [
            ["云：累计", ...r.rows.map((row) => cloudUsd(row.cloud))],
            ["自有：累计", ...r.rows.map((row) => cloudUsd(row.own))],
          ]),
          para(strong(r.saving > 0 ? `${p.x.years} 年省 ${cloudUsd(r.saving)}${r.payback ? `，第 ${r.payback} 年回本` : ""}` : `${p.x.years} 年多花 ${cloudUsd(-r.saving)}，留在云上更便宜`), text(`；每年云账单高于约 ${cloudUsd(r.breakEven)} 时买硬件才划算。`)),
        ];
      }),
    ];
  },
  WeightedOptionLab(_node, a) {
    const set = OPTION_SETS[a.set] ?? OPTION_SETS.method;
    return [
      note("（网页版此处可以改权重和 1–5 分，看哪个方案胜出、什么会改变结论；分数是我的判断，下面是几组权重的结果）"),
      table(["标准", ...set.options.map((o) => o.label)], set.criteria.map((c) => [c.label, ...c.scores.map(String)])),
      table(["权重视角", ...set.options.map((o) => o.label), "得分最高"], set.presets.map((p) => {
        const r = weightedScores(set, p.weights);
        return [p.label, ...r.totals.map((o) => String(o.total)), strong(r.winners.map((o) => o.label).join("、"))];
      })),
    ];
  },
  IntegrationLayerLab() {
    return [
      note("（网页版此处可以拖动客户数、集成费、留存等假设；除三家报价外都是示意数字，下面是三个预设的结果）"),
      table(["供应商", "报价", "人 × 周", "每人周（假设全程全职）", "团队"], PROVIDERS.map((p) => {
        const q = quoteRow(p);
        return [q.id, sourcingEur(q.cost), `${q.people} × ${q.weeks} = ${q.personWeeks}`, sourcingEur(q.perPersonWeek), q.team];
      })),
      ...LAYER_PRESETS.flatMap((p) => [
        para(strong(p.label), text(`：${p.note}`)),
        table(["供应商", "每年净收益", "前期合计", "回本（年）", "换 SaaS：直接集成 vs 中间层"], PROVIDERS.map((v) => {
          const r = layerCase(p.x, v);
          return [v.id, sourcingEur(r.benefit), sourcingEur(r.upfront), r.payback === null ? "回不了本" : r.payback.toFixed(1), `${sourcingEur(r.reintegrate)} vs ${sourcingEur(r.connector)}`];
        })),
      ]),
    ];
  },
  CapacityMixLab() {
    return [
      note("（网页版此处可以拖动放在 CoreWeave 的比例、切换技术栈是否可迁移；所有数字都是示意指数，总需求 100，下面是三个预设）"),
      ...CAPACITY_PRESETS.flatMap((p) => {
        const r = capacityMix(p.split, p.portable);
        return [
          para(strong(p.label)),
          table(["情景", "需要", "拿到", "发布延误（周）", "总成本", "用不完的承诺"], r.rows.map((x) => [x.scenario.label, String(x.need), String(Math.round(x.served)), x.delay.toFixed(0), x.cost.toFixed(0), x.stranded.toFixed(0)])),
          para(text(capacityVerdict(p.split, p.portable, r))),
        ];
      }),
    ];
  },
  CrmRouteLab() {
    return [
      note("（网页版此处可以选不同的来电客户，看在 slide 14 流程图里怎么走；下表是三种客户的路径）"),
      table(["来电客户", "路径", "结果"], CRM_CALLERS.map((c) => [c.label, crmRoute(c).map((p) => CRM_STEPS[p.step].split("（")[0] + (p.answer ? ` → ${p.answer}` : "")).join(" ⇒ "), crmRouteNote(c)])),
    ];
  },
  CrmCaseLab() {
    return [
      note("（网页版此处可以拖动各项假设，看 EduConnect 360 每年净收益和累计现金流；下面是三个预设的结果）"),
      ...CRM_PRESETS.flatMap((p) => {
        const r = crmCase(p.x);
        return [
          para(strong(p.label), text(`：${p.note}`)),
          table(["Repeat", "Tickets", "Corporate", "总收益", "持续成本", "净收益 / 年", "2027", "累计 2030"], [[crmUsd(r.repeat), crmUsd(r.tickets), crmUsd(r.corporate), crmUsd(r.benefit), crmUsd(p.x.ongoing), strong(crmUsd(r.net)), crmUsd(r.years[0].flow), crmUsd(r.years[3].cum)]]),
        ];
      }),
    ];
  },
  RouteLookupLab() {
    return [
      note("（网页版此处可交互：选路由器、开关静态 / 默认路由、断开接口、输入任意目的 IP 看匹配哪一行；下面是六个预设的结果）"),
      ...LOOKUP_PRESETS.flatMap((p) => {
        const { rows, skipped } = buildTable(p.router, p.on, p.down);
        const r = routeLookup(rows, p.dest);
        const cmds = LOOKUP_ROUTERS[p.router].statics.filter((s) => p.on.includes(s.id)).map(staticCommand);
        return [
          para(strong(`${p.label}：${LOOKUP_ROUTERS[p.router].label} 收到去 ${p.dest} 的包`), text(cmds.length ? `（配置 ${cmds.join("；")}${p.down.length ? `；${p.down.join("、")} down` : ""}）` : p.down.length ? `（${p.down.join("、")} down）` : "")),
          table(["Source", "Subnet", "Mask", "Out Int.", "Next-Hop", "匹配"], rows.map((x, i) => [x.src, x.net, prefixToMask(x.prefix), x.out, x.hop ?? "N/A", i === r.index ? strong("✅ 选这条") : r.matches[i].hit ? "✓" : "—"])),
          para(strong(r.action === "forward" ? "转发" : "丢弃"), text(`：${r.why}${skipped.length ? `（${skipped.map(staticCommand).join("、")} 没装进路由表：出接口 down）` : ""}`)),
        ];
      }),
    ];
  },
  DistanceVectorLab() {
    const fmt = (t) => Object.entries(t).map(([n, e]) => `${n}: ${e.metric}${e.hop ? ` via ${e.hop}` : " 直连"}`).join(" · ");
    const runTable = (run) => table(["轮次", ...run.topo.routers], run.rounds.map((rd) => [rd.label, ...run.topo.routers.map((r) => fmt(rd.tables[r]))]));
    const a = dvRun("slide21");
    const b = dvRun("slide21", { failNet: "Z" });
    const c = dvRun("board");
    return [
      note("（网页版此处可交互：一轮一轮看路由表怎么变、收敛后断开某个网络、开关 split horizon；下面是三个场景）"),
      para(strong("Slide 21 拓扑从开机到收敛")), runTable(a),
      para(strong("收敛后网络 Z 断开（有 split horizon）")), runTable({ ...b, rounds: b.rounds.slice(b.failAt) }),
      para(strong("板书 p.5 三角形 R1–R2–R3")), runTable(c),
    ];
  },
  LinkStateLab(_node, _a, ctx) {
    return [
      note("（网页版此处可交互：选 SPF 树的根、改每条链路的 cost 或断开链路；下面是三个预设）"),
      ...LS_PRESETS.flatMap((p, k) => {
        const r = spf(p.root, p.costs, p.down);
        const file = `images/LS_SPF_${k + 1}.svg`;
        ctx.generated.push({ path: file, data: routingStatic(lsSvg(p.root, p.costs, p.down)) });
        return [
          para(strong(p.label), text(`（链路 cost：${LS_LINKS.map((l) => `${l.a}–${l.b}=${p.down.includes(l.id) ? "断" : linkCost(l, p.costs)}`).join("，")}）`)),
          para({ type: "image", url: file, alt: `SPF tree from ${p.root}` }),
          table(["步", "确定", "当时的距离"], r.steps.map((s, i) => [String(i + 1), `${s.pick} = ${s.cost}`, Object.entries(s.tentative).map(([x, d]) => `${x}=${d === Infinity ? "∞" : d}`).join(" ")])),
          table(["Network", "是什么", "Cost", "Next hop"], r.table.map((t) => [`${t.net}/24`, t.label, String(t.cost), t.hop ?? "直连"])),
        ];
      }),
    ];
  },
  RipNetworkLab() {
    return [
      note("（网页版此处可交互：给每台路由器勾选 / 输入 network 命令、改等价路径上限，看哪些接口跑 RIP、路由表收敛成什么样；下面是六个预设的结果）"),
      ...RIP_PRESETS.flatMap((p) => {
        const r = ripRun(p.topo, p.cmds, p.maxPaths ?? 4);
        const names = Object.keys(r.tables);
        return [
          para(strong(p.label), text(`（${r.topo.note}）`)),
          table(["路由器", "network 命令", "跑 RIP 的接口", "没跑 RIP 的接口"], names.map((n) => [n, r.cmds[n].map((c) => `network ${c}`).join("；"), r.ifs[n].filter((i) => i.on).map((i) => `${i.name} ${i.ip}`).join("、") || "—", r.ifs[n].filter((i) => !i.on).map((i) => `${i.name} ${i.ip}`).join("、") || "—"])),
          { type: "code", lang: "text", value: names.map((n) => `${n}#show ip route\n${r.tables[n].map(ripShowLine).join("\n")}`).join("\n\n") },
          ...r.missing.map((m) => para(strong(`${m.routers.join("、")} 没有 ${m.net}`), text(`：${m.why}`))),
        ];
      }),
    ];
  },
  AdLab() {
    return [
      note("（网页版此处可交互：换来源协议、改 metric、把静态路由的 AD 调成浮动、断开链路，看哪条进路由表；下面是六个预设的结果）"),
      ...AD_PRESETS.flatMap((p) => {
        const r = chooseRoute(p.cands, p.dest);
        return [
          para(strong(`${p.label}`), text(`：去 ${p.dest}`)),
          table(["来源", "网段", "AD", "Metric", "经过", "链路", "结果"], r.rows.map((c) => [adSrcLabel(c.src), `${c.net}/${c.prefix}`, String(c.ad), String(c.metric), c.via, c.up ? "up" : "down", r.winners.includes(c.id) ? strong("✅ 进路由表") : "—"])),
          para(text(r.steps.map((s, i) => `${i + 1}. ${s}`).join("  "))),
        ];
      }),
    ];
  },
  EigrpDualLab() {
    return [
      note("（网页版此处可交互：改链路 cost 和邻居报的 RD、断开链路，看 FD / successor / feasible successor 怎么变；下面是三个预设的结果，以及 successor 断掉时 DUAL 怎么处理）"),
      ...EIGRP_PRESETS.flatMap((p) => {
        const d = eigrpDual(p.paths);
        const f = eigrpFailover(p.paths.map((x) => ({ ...x, up: !d.successors.includes(x.id) })));
        return [
          para(strong(`${p.label}`), text(`：${p.router} 去 ${p.dest}。${p.note}`)),
          table(["经过邻居", "链路 cost", "RD", "总距离", "角色"], d.rows.map((r) => [r.via, String(r.link), String(r.rd), `${r.link} + ${r.rd} = ${r.total}`, r.role === "successor" ? strong(EIGRP_ROLE[r.role]) : EIGRP_ROLE[r.role]])),
          para(text(`FD = ${d.fd}。successor 全部断掉时：`), text(f.steps.map((s, i) => `${i + 1}. ${s}`).join("  "))),
        ];
      }),
    ];
  },
  PrefixMatchLab(_node, a) {
    const S = PREFIX_SETS[a.set] ?? PREFIX_SETS.lab;
    return [
      note("（网页版此处可交互：改目的 IP、改路由的网段和前缀长度，逐位看哪几条匹配、哪条最长；下面是这一组的结果）"),
      para(strong(S.label)),
      table(["路由", "网段 / 前缀", "二进制"], S.routes.map((r) => [r.id + (r.out ? ` · ${r.out}` : ""), `${r.net}/${r.prefix}`, { type: "inlineCode", value: longestMatch(S.routes, S.dests[0]).rows.find((x) => x.id === r.id).netBin }])),
      table(["目的 IP", "二进制", "匹配的路由", "选哪条"], S.dests.map((d) => {
        const r = longestMatch(S.routes, d);
        return [d, { type: "inlineCode", value: r.destBin }, r.rows.filter((x) => x.hit).map((x) => `${x.id} (/${x.prefix})`).join("、") || "—", strong(r.winner ?? "丢弃")];
      })),
    ];
  },
  RoutingSortQuiz(_node, a) {
    const set = routingQuiz[a.set] ?? routingQuiz.route;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  CaseSortQuiz(_node, a) {
    const set = caseQuiz[a.set] ?? caseQuiz.otis;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["挑战", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  L6SortQuiz(_node, a) {
    const set = l6Quiz[a.set] ?? l6Quiz.plan;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  CostBalanceLab() {
    return [
      note("（网页版此处可以改每小时损失、ARO 和 MTD，看哪个恢复方案总成本最低、是否满足 MTD；下面是三个预设的结果，方案成本是示意数字）"),
      ...COST_PRESETS.flatMap((p) => {
        const r = costBalance(p);
        return [
          para(strong(`${p.label}：每小时损失 ${fmtCostK(p.lossPerHour)}，ARO ${p.aro}，MTD ${p.mtd} 小时`)),
          table(["恢复方案", "停机", "恢复成本 / 年", "预期中断成本 / 年", "总成本", "满足 MTD"], r.rows.map((x) => [x.label, `${x.downtimeH} h`, fmtCostK(x.yearlyCost), fmtCostK(x.disruption), x.id === r.bestId ? strong(fmtCostK(x.total) + " ← 选这个") : fmtCostK(x.total), x.meetsMtd ? "✓" : "✗"])),
        ];
      }),
    ];
  },
  L5SortQuiz(_node, a) {
    const set = l5Quiz[a.set] ?? l5Quiz.treat;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  AssetValueLab() {
    const w = VALUE_CRITERIA.map((c) => c.weight);
    return [
      note("（网页版此处可以改权重和每项分数，看总分和排名怎么变；下表是课件 p.33 的数字）"),
      table(["Information asset", ...VALUE_CRITERIA.map((c) => `${c.label}（${c.weight}）`), "Total", "Importance"], VALUE_ASSETS.map((a) => { const r = weightedValue(a.scores, w); return [a.name, ...a.scores.map(String), strong(String(r.total)), r.band]; })),
    ];
  },
  HeatMapLab() {
    return [
      note("（网页版此处可以点任一格看 Impact × Likelihood，并移动风险胃口这条线，看哪些格要 Treat；下表是课件 p.37 的矩阵）"),
      table(["Impact \\ Likelihood", ...HM_LIK.map((l, i) => `${l} (${i + 1})`)], [5, 4, 3, 2, 1].map((i) => [`${HM_IMPACT[i - 1]} (${i})`, ...HEATMAP_ROWS[5 - i]])),
    ];
  },
  L4SortQuiz(_node, a) {
    const set = l4Quiz[a.set] ?? l4Quiz.why;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  CipherLab() {
    const v = vigenere(CIPHER_PRESETS.vigenere.plain, CIPHER_PRESETS.vigenere.key);
    const t = transposition(CIPHER_PRESETS.transposition.plain, CIPHER_PRESETS.transposition.size);
    return [
      note("（网页版此处可以自己输入明文和密钥，看 Vigenère 逐字母右移、Caesar block 方阵怎么填；下面是课件例子）"),
      para(strong("Vigenère（p.6）："), text(`明文 ${v.plain}，密钥 ${CIPHER_PRESETS.vigenere.key} 重复成 ${v.keyStream}，逐字母右移 → 密文 ${v.cipher}`)),
      table(["明文", "密钥", "右移", "密文"], v.steps.map((s) => [s.p, s.k, String(s.shift), s.c])),
      para(strong("Caesar block（p.7）："), text(`空格写成 _，竖着填进 ${t.n}×${t.n} 方阵，横着读出 → 密文 ${t.cipher}`)),
      table(Array.from({ length: t.n }, (_, i) => `列 ${i + 1}`), t.grid.map((r) => r)),
    ];
  },
  KeyCountLab() {
    return [
      note("（网页版此处可以输入人数 n，比较对称和非对称各需要几把钥匙）"),
      table(["人数 n", "对称 n(n−1)/2", "非对称 2n"], KEY_COUNT_PRESETS.map((n) => { const k = keyCount(n); return [String(n), k.symmetric.toLocaleString("en-US"), k.asymmetric.toLocaleString("en-US")]; })),
    ];
  },
  KeyStrengthLab() {
    return [
      note("（网页版此处可以输入任意密钥长度，看暴力破解最多要猜几次、要多久；下表按课件 Table 10-5 的同一假设计算）"),
      table(["密钥长度", "最多猜测次数 2^k", "最长时间", "平均时间"], KEY_STRENGTH_PRESETS.map((b) => { const r = keyStrength(b); return [`${b} 位`, r.guessesText, r.max, r.avg]; })),
    ];
  },
  HashLab() {
    return [
      note("（网页版此处可以输入任意两条消息，比较 SHA-256 哈希有多少位不同；下表是预设例子）"),
      table(["对比", "消息 A 的哈希", "消息 B 的哈希", "不同的位"], HASH_PRESETS.map((p) => { const r = avalanche(p.a, p.b); return [`${p.note}：「${p.a}」vs「${p.b}」`, { type: "inlineCode", value: r.ha.slice(0, 16) + "…" }, { type: "inlineCode", value: r.hb.slice(0, 16) + "…" }, r.same ? "0（完全相同）" : `${r.bits} / 256`]; })),
    ];
  },
  ChainLab() {
    const stored = sealChain(CHAIN_DATA);
    const tampered = [...CHAIN_DATA];
    tampered[0] = "Alice → Bob 99 BTC";
    const show = (bs) => table(["Block", "交易", "Prev Hash", "Hash", "状态"], bs.map((b) => [String(b.i + 1), b.data, b.prev.slice(0, 10) + "…", b.hash.slice(0, 10) + "…", b.changed ? "✗ 内容被改，哈希变了" : b.brokenLink ? "✗ Prev Hash 对不上" : "✓ 有效"]));
    return [
      note("（网页版此处可以直接改任何一块的交易，看哈希链从哪里断开）"),
      para(strong("原始的链")), show(chainCheck(CHAIN_DATA, stored)),
      para(strong("把第 1 块改成「Alice → Bob 99 BTC」之后")), show(chainCheck(tampered, stored)),
    ];
  },
  TlsLab() {
    return [
      note("（网页版此处可以一步步点击 HTTPS 握手）"),
      table(["步骤", "用了什么", "发生了什么", "解决了什么", "窃听者看到"], TLS_STEPS.map((s) => [s.title, strong(s.tool), s.what, s.solves, s.sees])),
    ];
  },
  L3SortQuiz(_node, a) {
    const set = l3Quiz[a.set] ?? l3Quiz.fw;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  StatefulLab() {
    const verdict = (x) => (x.allow ? "✅ 放行" : "⛔ 丢弃");
    return [
      note("（网页版此处可以任意顺序发包，看 stateless 和 stateful 各自怎么判、state table 怎么变化；下表是笔记里的演示顺序）"),
      para(strong("Stateless 规则表："), text(STATELESS_RULES.map((r) => `${r.id}. ${r.text}`).join("；"))),
      table(
        ["#", "包", "Stateless", "Stateful", "Stateful 的理由", "之后的 state table"],
        runStateful(STATEFUL_DEMO).map((s, i) => [String(i + 1), `${s.pkt.label}（${s.pkt.src} → ${s.pkt.dst} ${s.pkt.flag}）`, verdict(s.stateless), strong(verdict(s.stateful)), s.stateful.why, s.table.join("；") || "（空）"]),
      ),
    ];
  },
  VpnModeLab() {
    return [
      note("（网页版此处可以切换 transport / tunnel / proxy，并站在不同观察者的位置看包；下表是全部情况）"),
      ...VPN_MODE_IDS.flatMap((id) => {
        const m = VPN_MODES[id];
        return [
          para(strong(m.label), text(`：${m.story}`)),
          table(
            ["段", "包的结构（🔒 = 加密）"],
            m.packets.map((p) => [p.title, p.layers.map((l) => `${l.enc ? "🔒" : ""}[${l.part}: ${l.value}]`).join(" ")]),
          ),
          table(
            ["观察者", "能看到", "看不到"],
            Object.values(m.observers).map((o) => [o.label, o.sees.join("；"), o.hidden.join("；") || "—"]),
          ),
          para(text(`目的地看到的发送者：${m.sender}`)),
        ];
      }),
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
  PyObjectLab() {
    return [
      note(`（网页版此处可以自己改字符串 s，点各种方法看 Python 会输出什么；下表是 s = ${JSON.stringify(PY_DEFAULT_TEXT)} 的结果）`),
      table(["代码", "返回类型", "输出", "说明"], PY_OPS.map((o) => { const r = runPyOp(PY_DEFAULT_TEXT, o.id); return [{ type: "inlineCode", value: o.code }, r.type, { type: "inlineCode", value: r.out }, o.note]; })),
    ];
  },
  TriageLab() {
    const runs = [["rules", "固定规则"], ["pretrained", "Pretrained"], ["finetuned", "Finetuned"]].map(([id, name]) => [name, triageEvaluate(id)]);
    const cell1 = (r) => `${r.label === r.y ? "✓" : "✗"} ${TRIAGE_LABEL[r.label]}${r.score === null ? "" : ` (${Math.round(r.score * 100)}%)`}${r.review ? " ·复核" : ""}`;
    return [
      note(`（网页版此处可以切换方法、拖动阈值、自己输入文字；规则 = 出现 ${TRIAGE_RULE_WORDS.join(" / ")} 就判 Threat，两个模型是示意权重，阈值 0.5，离阈值 0.2 以内标「复核」）`),
      table(["方法", "TP", "FN 漏报", "FP 误报", "TN", "判对"], runs.map(([n, e]) => [n, String(e.tp), String(e.fn), String(e.fp), String(e.tn), `${e.correct} / ${e.total}`])),
      table(["Text in", "真实", ...runs.map(([n]) => n)], runs[0][1].rows.map((r, i) => [{ type: "inlineCode", value: r.text }, TRIAGE_LABEL[r.y], ...runs.map(([, e]) => cell1(e.rows[i]))])),
    ];
  },
  OverfitLab() {
    return [
      note("（网页版此处可以拖动多项式次数，看曲线怎么从「太简单」变成「背答案」；下表是 10 个训练点、10 个测试点的均方误差）"),
      table(["degree", "训练误差", "测试误差", "判断"], overfitTable().map((f) => [String(f.degree), f.train.toFixed(3), f.test.toFixed(3), f.id === "good" ? strong(f.label) : f.label])),
    ];
  },
  PyIntroSortQuiz(_node, a) {
    const set = pyIntroQuiz[a.set] ?? pyIntroQuiz.task;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  CodeTrace(_node, a) {
    const t = pyTraces[a.id];
    if (!t) return [note(`（找不到代码运行记录：${a.id}）`)];
    const out = t.steps.map((st) => st.out).join("");
    const err = t.steps.find((st) => st.error)?.error;
    const tags = [t.mine ? "我的解答 / 补充" : "", t.mock ? "模型输出为示意" : "", t.source].filter(Boolean).join(" · ");
    return [
      para(strong(`▶ ${t.title}`), text(tags ? `（${tags}）` : "")),
      ...(t.setupNote ? [note(t.setupNote)] : []),
      codeBlock(t.code.join("\n"), "python"),
      table(["行", "代码", "在做什么"], t.code.flatMap((c, i) => (t.notes[i] ? [[String(i + 1), ic(c.trim()), rich(t.notes[i])]] : []))),
      para(text("运行结果：")),
      codeBlock((out + (err ? `Traceback (most recent call last):\n  ...\n${err}\n` : "")).replace(/\n$/, "") || "（没有输出）", "text"),
      note("（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）"),
    ];
  },
  FStringLab() {
    const vals = [fl(368), 7, "TST"];
    return [
      note("（网页版此处可以自己输入值和格式；下表是三个例子在常用格式下的结果，两边的 | 是为了看清空格）"),
      table(["格式", "说明", ...vals.map((v) => `x = ${pyLabRepr(v)}`)], FORMAT_PRESETS.map((p) => [ic(p.spec === "" ? "{x}" : `{x:${p.spec}}`), p.desc, ...vals.map((v) => { const r = formatValue(v, p.spec); return r.ok ? ic(`|${r.text}|`) : r.error; })])),
    ];
  },
  BranchLab(_node, a) {
    const p = BRANCH_PRESETS.find((x) => x.id === a.preset) ?? BRANCH_PRESETS[0];
    return [
      note(`（网页版此处可以拖动 / 选择变量的值，看 if / elif / else 从上往下哪一支被选中：${p.title}）`),
      codeBlock(p.branches.map((b) => b.code + "\n    ...").join("\n"), "python"),
      table(["输入", "每个条件", "走哪一支", "结果"], p.samples.map((v) => { const r = runBranches(p, v); return [ic(branchValueText(p, v)), r.rows.map((x) => (x.state === "hit" ? "✓" : x.state === "false" ? "✗" : "–")).join(" "), ic(r.rows[r.hit].code), r.out.join("；")]; })),
    ];
  },
  SliceLab(_node, a) {
    if (a.mode === "range") {
      return [note("（网页版此处可以自己输入 range 的参数）"), table(["写法", "list(range(...))", "说明"], RANGE_PRESETS.map((p) => { const r = pyRange(p.args); return [ic(`range(${p.args})`), r.ok ? ic(pyLabRepr(r.values)) : r.error, p.note]; }))];
    }
    return [
      note(`（网页版此处可以自己输入 [i] / [a:b:c]，格子会高亮被取到的位置；skus = ${pyLabRepr(SLICE_ITEMS)}）`),
      table(["写法", "结果", "说明"], SLICE_PRESETS.map((p) => { const r = evalSubscript(SLICE_ITEMS, p.expr); return [ic(`skus${p.expr}`), r.ok ? ic(pyLabRepr(r.value)) : r.error, p.note]; })),
    ];
  },
  NestedPathLab(_node, a) {
    const ids = String(a.presets ?? "alerts,inventory").split(",").map((s) => s.trim());
    return [
      note("（网页版此处可以点数据里的任意一个值，自动写出取到它的代码，并逐层说明每一步拿到的是什么）"),
      ...NESTED_PRESETS.filter((p) => ids.includes(p.id)).flatMap((p) => [
        para(strong(p.title)),
        table(["代码", "拿到的是", "值"], walkPath(p, p.start).map((st) => [ic(st.code), st.what, ic(pyShort(st.value, 60))])),
      ]),
    ];
  },
  TemperatureLab() {
    const ts = [0.5, 1, 1.5];
    const rows = nextTokenProbs(1).map((c, i) => [ic(JSON.stringify(c.token)), ...ts.map((t) => `${(nextTokenProbs(t)[i].p * 100).toFixed(1)}%`)]);
    return [note(`（网页版此处可以切换 do_sample、拖动 temperature；prompt = "${TEMP_PROMPT}"，分数是示意值。do_sample=False 时永远选第一名 " be"）`), table(["下一个 token", ...ts.map((t) => `temperature=${t}`)], rows)];
  },
  PyNotebookSortQuiz(_node, a) {
    const set = pyNbQuiz[a.set] ?? pyNbQuiz.struct;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["题目", "答案", "理由"], set.items.map((it) => [ic(it.q.replace(/\n/g, " ⏎ ")), strong(label(it.a)), it.why]))];
  },
  AiFlowLab() {
    return [
      note("（网页版此处可以点 AI flow 的每一站，看审计问题和开场案例的记录；下表是全部五站）"),
      table(["站", "审计问题", "案例记录说了", "还缺什么", "该要的记录"], FLOW_STAGES.map((s, i) => [`0${i + 1} ${s.name}`, `${s.q} ${s.zh}`, s.known, s.gap, s.record])),
    ];
  },
  LoopLab() {
    return [
      note("（网页版此处可以按六个条件点选，看该用 HITL / HOTL / HOOTL；规则：最严格的一项决定模式。下表是 Slide 21 三个任务的结果）"),
      table(["任务", ...LOOP_FACTORS.map((f) => f.label), "模式", "上线前先解决"], LOOP_PRESETS.map((p) => {
        const r = decideLoop(p.picks);
        return [p.label, ...LOOP_FACTORS.map((f) => f.options[p.picks[f.id] ?? 0]), strong(r.mode.en), r.blockers.join("；") || "—"];
      })),
    ];
  },
  PilotEvidenceLab() {
    const s = pilotSummary();
    return [
      note("（网页版此处可以勾掉类别、自己输入测试数和正确数，看准确率和 95% 区间怎么变）"),
      table(["类别（L1-A3）", "对 / 测", "准确率", "95% 区间（Wilson）"], [
        ...s.rows.map((r) => [`${r.label}（${r.zh}）`, `${r.ok} / ${r.n}`, pilotPct(r.rate), `${pilotPct(r.ci.lo)}–${pilotPct(r.ci.hi)}`]),
        [strong("合计"), `${s.ok} / ${s.n}`, pilotPct(s.rate), `${pilotPct(s.ci.lo)}–${pilotPct(s.ci.hi)}`],
      ]),
      para(text(`24 / 24 全对，错误率的 95% 上限仍约 ${pilotPct(zeroErrorBound(24))}。完全没测：${PILOT_UNTESTED.map((u) => u.zh).join("、")}。`)),
    ];
  },
  GovSortQuiz(_node, a) {
    const set = govQuiz[a.set] ?? govQuiz.response;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
  },
  CopyTraceLab() {
    const t = traceCopies({ expanded: true, masked: false, covers: RECEIPT_PRESETS[0].covers });
    return [
      note("（网页版此处可以切换试点 / 扩展、勾选「发送前遮蔽」、改删除回执覆盖哪些副本；下表是扩展方案 + L2-A5 删除测试的情况）"),
      table(["副本", "在哪 · 谁持有", "到期问题", "要的证据", "L2-A5 回执覆盖"], t.rows.map((r) => [r.zh, `${r.where} · ${r.holder}`, r.expiry, r.evidence, r.covered ? "✓" : "✗"])),
      para(text(t.claim)),
    ];
  },
  TrainingEvidenceLab() {
    const cases = [["first", ["q"], false], ["first", ["q", "c"], false], ["first", ["q", "c", "d"], false], ["second", ["q", "c", "d"], false], ["second", ["q", "c", "d"], true]];
    return [
      note("（网页版此处可以选供应商、勾选 AI 读了哪些文件、模拟只会照抄例题；下表是几个代表情形）"),
      table(["供应商", "读了", "只会照抄例题", "AI 的结论", "说明"], cases.map(([supplierId, read, copyExample]) => {
        const s = SUPPLIERS.find((x) => x.id === supplierId);
        const r = assessTraining({ supplierId, read, copyExample });
        return [s.label, s.docs.filter((d) => read.includes(d.id)).map((d) => d.label).join("、"), copyExample ? "是" : "否", VERDICT_LABEL[r.says], `${r.why} ${r.outcomeText}`];
      })),
    ];
  },
  ServiceGateLab() {
    const cases = [
      { accepted: true, validated: false, aiSkips: true, aiForges: false },
      { accepted: true, validated: false, aiSkips: false, aiForges: true },
      { accepted: true, validated: true, aiSkips: false, aiForges: false },
    ];
    return [
      note("（网页版此处可以切换控制方式、两条记录的状态、AI 是否跳步或改字段；下表是几个代表情形）"),
      table(["Accepted plan", "Validated fix", "AI 的行为", "控制方式", "结果", "说明"], cases.flatMap((c) => CONTROL_MODES.map((m) => {
        const r = gateDecision({ ...c, mode: m.id });
        return [c.accepted ? "Yes" : "No", c.validated ? "Yes" : "No", c.aiForges ? "试图改验证字段" : c.aiSkips ? "跳步" : "按步骤", m.label, strong(r.status), r.why];
      }))),
    ];
  },
  MemoryGovernanceLab() {
    const base = { poisoned: true, provenance: false, writeApproval: false, revalidate: false, serviceGate: true };
    const cases = [["没有记忆控制", base], ["只有写入审批", { ...base, writeApproval: true }], ["来源 + 写入审批", { ...base, provenance: true, writeApproval: true }], ["来源 + 复用前验证", { ...base, provenance: true, revalidate: true }]];
    return [
      note("（网页版此处可以勾选各项控制，跟踪一条被投毒的记忆；下表是几个代表情形）"),
      table(["控制组合", "Write & store", "Retrieve & reuse", "同事的下一步"], cases.map(([label, c]) => {
        const r = memoryWalk(c);
        return [label, r.rows[1].text, r.rows[2].text, r.rows[3].text];
      })),
    ];
  },
  PermissionGateLab() {
    const cases = [
      { user: "alex", record: "alex", path: "ask", gate: "before" },
      { user: "alex", record: "sam", path: "ask", gate: "before" },
      { user: "alex", record: "alex", path: "inject", gate: "before" },
      { user: "alex", record: "alex", path: "inject", gate: "prompt" },
      { user: "alex", record: "sam", path: "api", gate: "before" },
      { user: "alex", record: "sam", path: "ask", gate: "none" },
    ];
    const lbl = (xs, id) => xs.find((x) => x.id === id).label;
    return [
      note("（网页版此处可以选登录身份、请求的记录、访问路径、检查放在哪、能不能对外发送；下表是几个代表情形）"),
      table(["登录", "请求", "路径", "检查在哪", "结果", "测试覆盖"], cases.map((c) => {
        const r = evaluateGate({ ...c, outbound: false });
        return [lbl(USERS, c.user), lbl(RECORDS, c.record), lbl(PATHS, c.path), lbl(GATES, c.gate), r.why, r.tested ? "在两条 trace 里" : "未测试"];
      })),
      table(["Workpaper 字段", "按 Slide 34 能填的", "还缺"], WORKPAPER.map((w) => [`${w.field}（${w.zh}）`, w.fill, w.missing])),
    ];
  },
  SubgroupGapLab() {
    return SUBGROUP_PRESETS.flatMap((p) => {
      const s = subgroupCheck({ target: p.target, groups: p.groups });
      return [
        para(strong(`${p.label}（每组标准 ≥ ${pilotPct(p.target)}）`)),
        table(["组", "对 / 测", "准确率", "95% 区间", "达标"], [
          ...s.rows.map((r) => [r.label, `${r.ok} / ${r.n}`, pilotPct(r.rate), `${pilotPct(r.ci.lo)}–${pilotPct(r.ci.hi)}`, r.meets ? "✓" : "✗"]),
          [strong("合计"), `${s.combined.ok} / ${s.combined.n}`, pilotPct(s.combined.rate), `${pilotPct(s.combined.ci.lo)}–${pilotPct(s.combined.ci.hi)}`, s.combined.meets ? "✓" : "✗"],
        ]),
        para(text(`${s.verdict} ${p.note}`)),
      ];
    });
  },
  PrivacySortQuiz(_node, a) {
    const set = privacyQuiz[a.set] ?? privacyQuiz.ref;
    const label = (id) => set.options.find((o) => o.id === id).label;
    return [note(`（网页版此处是点选练习：${set.title}；下表是全部题目和答案）`), table(["情景", "答案", "理由"], set.items.map((it) => [it.q, strong(label(it.a)), it.why]))];
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

