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
import { symbolFor as cardSymbolFor, symbolName as cardSymbolName } from "../../src/components/mdx/cardinality-logic.mjs";
import { evaluate as evalFirewall, PRESETS as FW_PRESETS } from "../../src/components/mdx/firewall-logic.mjs";
import { classifyFd, fdText } from "../../src/components/mdx/normalization-logic.mjs";
import { tcpConversation, HANDSHAKE_PRESETS, simulateWindow, WINDOW_PRESETS, classifyPort, PORT_PRESETS, openConnections } from "../../src/components/mdx/tcp-logic.mjs";
import { subnetPlan, planOptions, SUBNET_PRESETS, PLAN_PRESETS } from "../../src/components/mdx/subnet-logic.mjs";
import { computeVendorTier, FACTORS as VENDOR_FACTORS, VENDOR_TIER_PRESETS } from "../../src/components/mdx/vendor-tier-logic.mjs";
import { runSql, runJoin, show as sqlShow, SQL_PRESETS, JOIN_TYPES, DCL_STATEMENTS, DCL_SCRIPT, DCL_USERS, DCL_ROLE, DCL_PRIVS, dclStep, dclCell, emptyDcl } from "../../src/components/mdx/sql-logic.mjs";

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
  const md = String(file).replace(/\\([<{])/g, "$1");
  return { md, images: [...new Set(images)], generated: ctx.generated };
}

