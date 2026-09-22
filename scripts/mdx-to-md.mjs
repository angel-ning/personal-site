#!/usr/bin/env node
// Turn an MDX note into plain Markdown: each note component becomes the Markdown
// it stands for (Callout → blockquote, Figure → image + caption, QA → question + answer,
// LayerStack / SwitchLab → tables computed from the same data the web components use).
//
//   npm run mdx-to-md -- <note dir | index.mdx> [--out file.md] [--no-frontmatter]
//
// Default output is README.md next to index.mdx, so the note reads well on GitHub.
// With --out elsewhere, referenced images are copied into images/ beside the output.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkStringify from "remark-stringify";
import { visit, SKIP } from "unist-util-visit";
import { switchFrame, toMin } from "../src/components/mdx/switch-logic.mjs";
import { collisionRows, collisionSvgStatic } from "../src/components/mdx/collision-map.mjs";
import { analyzeIp, IP_PRESETS } from "../src/components/mdx/ip-logic.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const osi = readJson("src/components/mdx/data/osi.json");
const lab = readJson("src/components/mdx/data/switch-lab.json");

const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--no-frontmatter") flags.noFrontmatter = true;
  else if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else pos.push(args[i]);
}
if (!pos[0]) {
  console.error("usage: npm run mdx-to-md -- <note dir | index.mdx> [--out file.md] [--no-frontmatter]");
  process.exit(1);
}
const src = path.resolve(fs.statSync(pos[0]).isDirectory() ? path.join(pos[0], "index.mdx") : pos[0]);
const srcDir = path.dirname(src);
const out = path.resolve(flags.out ?? path.join(srcDir, "README.md"));

const raw = fs.readFileSync(src, "utf8");
const fm = raw.match(/^---\n[\s\S]*?\n---\n/)?.[0] ?? "";
const body = raw.slice(fm.length);

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
};

const components = {
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
  CollisionMap() {
    // The diagram is written next to the note's other images so both README.md and exports can reference it.
    fs.mkdirSync(path.join(srcDir, "images"), { recursive: true });
    fs.writeFileSync(path.join(srcDir, "images", "COLLISION_MAP.svg"), collisionSvgStatic);
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
  FcsDemo() {
    return [para({ type: "emphasis", children: [text("（网页版此处可交互：改发送的比特、选择被干扰的位，观察接收方重算的 FCS 是否一致）")] })];
  },
};

function convert() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.type === "mdxjsEsm" || node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        const fn = components[node.name];
        if (!fn) console.warn(`  ! no Markdown mapping for <${node.name}>, keeping its children`);
        const replacement = fn ? fn(node, attrs(node)) : node.children;
        parent.children.splice(index, 1, ...replacement);
        return index; // revisit: children may contain more components
      }
    });
  };
}

const images = [];
const file = await unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGfm)
  .use(convert)
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
let md = String(file).replace(/\\([<{])/g, "$1");
if (!flags.noFrontmatter) md = fm + md;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);

let copied = 0;
if (path.dirname(out) !== srcDir) {
  for (const url of new Set(images)) {
    if (/^(https?:|data:|\/)/.test(url)) continue;
    const from = path.join(srcDir, decodeURI(url));
    if (!fs.existsSync(from)) {
      console.warn(`  ! missing image: ${url}`);
      continue;
    }
    const to = path.join(path.dirname(out), url);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied++;
  }
}
console.log(`✓ ${path.relative(process.cwd(), out) || out}${copied ? ` (+${copied} images)` : ""}`);
