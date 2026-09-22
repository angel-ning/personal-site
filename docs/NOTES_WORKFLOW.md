# 课程笔记工作流（给 Claude 的说明书）

> 每次做课程笔记前先读这份文件。它总结了 ISOM 5180 第 1–2 周笔记的做法，目标是：**新的 session 不需要重新解释，就能做出同样质量的笔记。**
> 这份文件优先于 `slides-to-study-notes` skill 里「把 .md 写在 PDF 旁边」的默认做法：笔记的正本是网站里的 **MDX**，`README.md` 只是从它导出的阅读版，本地不再生成 PDF。

---

## 1. 产出物（一次做齐）

| 产出 | 位置 | 怎么来 |
|---|---|---|
| **笔记正本** | `content/<学期>/<课程>/lectures/week-NN/index.mdx` + `images/` | 手写 MDX |
| GitHub 阅读版 | 同目录 `README.md` | `npm run mdx-to-md -- <笔记目录>` |
| 网站下载包 | `public/content/…/*.zip` | 构建时自动生成，不用管 |

> 本地课件文件夹里不再生成 `.md`/`.pdf` 副本——这一步已省略，正本只有网站里的 MDX 和它旁边的 `README.md`。

**不要**再写 `index.md` 或独立 `index.html`：`.md` 不能用组件；HTML 笔记在 Vercel 上会 404（ISOM 5260 第 2 周就是这样被转成 MDX 的）。

frontmatter：

```yaml
---
title:
  en: "Week 2 · Network Layer & IPv4 Addressing"
  zh: "第 2 周 · 网络层与 IPv4 地址"
summary:
  en: "…"
  zh: "…"
week: 2
date: 2026-09-22
tags: [IPv4, NAT, DHCP]
---
```

## 2. 读材料

1. **课件**：`.pptx` 先转 PDF（Keynote：先 `open -a Keynote`，再用 osascript `export … as PDF`；复制到 scratchpad 再转，不要动原文件）。然后用 `slides-to-study-notes` skill 的 `slide_kit.py extract` 出图和文字。**所有被标记为「内容在图里」的页都要看图**，拼成 contact sheet 一次看 6 页最快。
2. **老师的手写补充 (Supplementary)**：通常是老师课上现场画的拓扑、表格、例题，**是最重要的考点信号**。
   - 文件可能是**空白版**（只有空表）。先问用户有没有「Completed」版或课堂笔记照片。
   - 在对应课件内容旁边插入板书（`<Figure board …>`），下面用 `<Callout type="board">` 写解答。
   - 标注来源：用户照片 / Completed 版里的答案标 **「课堂答案」**；自己推的标 **「我的解答」**。两者不能混。
3. **用户说的重点优先于一切**。用户没说时，按篇幅、板书、课件自带练习推断优先级，并在开头说明依据。

## 3. 笔记结构

沿用 ISOM 5180 第 1、2 周的结构（`content/2026-fall-1/isom-5180/lectures/week-01/index.mdx` 是范本，动笔前先读一遍）：

1. `# 标题` + **主题** 一行 + 优先级图例（🔴 必考核心 · 🟡 需要理解 · 🟢 了解即可）+ 优先级依据
2. `## 0. 核心地图`：一条箭头链把本周所有主题串起来 + 一句话抓住本周
3. `## N. 🔴 主题（English）`：优先级写在标题里，这样目录就是复习清单
   - 课件截图放在小节标题下面，用 `<Figure>`
   - **中英对照表**（课件原文 | 中文 / 小白解释 | 例子）
   - 考点、踩坑、口诀、小白类比用 Callout
   - 课件没讲的背景知识用 `<Callout type="extra">`，优先级按 🟢
4. `## 🔴 综合缩写速查表`
5. `## 模拟自测题`：每题一个 `<QA>`，点开看答案，按笔记顺序

写作要点：
- 中文讲解，专有名词保留英文；用户本科是 CS，商科/管理术语要从底层逻辑讲，技术术语可以简略
- **用户纠正或补充的理解要写进笔记**；用户理解有偏差时，温和指出并写出正确版本（例：「找不到 PC3 MAC 的是 PC1，不是路由器」）
- 课上**还没讲**的部分可以预习，但必须用 `<Callout type="todo">` 标明，讲完后再对照改
- 板书题优先做成「给拓扑 → 填表 / 写 IP(S, D)、MAC(S, D)」的完整解答，这是这门课的主要考法

## 4. MDX 组件（`src/components/mdx/`）

| 组件 | 用途 |
|---|---|
| `<Callout type="exam\|tip\|warn\|board\|extra\|memo\|note\|todo\|biz" title="…">` | 内容前后各空一行 |
| `<Figure src="images/x.png" caption="…" source="Slide 3" />` | 加 `board` = 老师手写板书 |
| `<QA q="问题">答案</QA>` | 自测题 |
| `<Mk t="e\|a\|v\|c">…</Mk>` | 读题标注：实体 / 属性 / 动词 / 基数 |
| `<LayerStack />` | OSI 七层对照 |
| `<SwitchLab />` | 交换机 MAC 表 learn / flood / forward / filter |
| `<FcsDemo />` | FCS 差错检测 |
| `<CollisionMap />` | Hub 冲突 vs 交换机防冲突示意图 |
| `<IpAnalyzer />` | IPv4 地址分析（class、network / broadcast、主机范围） |
| `<MCQ q="…" a="…" b="…" c="…" d="…" answer="B">解析</MCQ>` | 可点选的选择题（MC 考试的课一律用它做自测题） |
| `<LayerQuiz />` | DBMS 分层「这属于哪一层」练习（数据在 `data/dbms-layers.json`） |
| `<RelAlgebraLab />` | σ / Π / ⋈ 在课件的 Artist / Album 表上组合 |
| `<BufferPoolLab />` | Buffer pool：hit / miss、dirty、LRU 替换、写回 |
| `<EerConstraintLab />` | EER 两个约束问题 → 自动画图 + discriminator 取值 |
| `<HierarchyExplorer />` | 超类 / 子类层级的属性继承 |

### 什么时候新做一个互动组件（重要，别忘了）

**只要一个知识点是「过程 / 算法 / 计算 / 状态变化」，就应该做成可以点的小实验**，而不是只放一张表。判断标准：学生需要「自己换个输入试一试」才能真正懂的东西。已有例子：

- 交换机逐帧学习 MAC 表 → `SwitchLab`（按板书一帧帧走 + 自己发帧 + 老化）
- FCS 校验 → `FcsDemo`（改比特、选干扰位）
- IP 分类与保留地址 → `IpAnalyzer`（输入任意地址）
- 关系代数 → `RelAlgebraLab`；buffer pool → `BufferPoolLab`；EER 约束 → `EerConstraintLab`
- 考选择题的课（如 ISOM 5260）→ 自测题用 `<MCQ>`，分类记忆题做成 `LayerQuiz` 这样的点选练习

以后可能用得上的：子网划分计算器、路由表逐跳查表、ARP 请求/应答动画、DHCP DORA 时序、NAT/PAT 表、加密算法演示、风险矩阵计算……

做法：
1. **逻辑写成纯函数**放在 `*.mjs`（例：`switch-logic.mjs`、`ip-logic.mjs`），数据放 `data/*.json`。
2. 界面写成 `"use client"` 组件，只调用这些纯函数；样式复用 `globals.css` 里的 `.lab`、`.lab-head`、`.lab-controls`、`.lab-table`、`.lab-decision`。
3. 在 `src/components/mdx/index.tsx` 的 `noteComponents` 里注册。
4. **在 `scripts/lib/mdx-core.mjs` 里加一个同名映射**，用同一套纯函数算出一张静态表格，这样 README / 下载包里也有内容。没有映射的组件在导出时会丢失并打印警告。
5. 需要示意图时优先画成 SVG（参考 `collision-map.mjs`）：颜色写成 `var(--token, #亮色值)`，网页能跟随暗色模式，导出时自动替换成亮色值。

## 5. 容易踩的坑

- **MDX 转义**：正文里的 `<`、`{`、`}` 要写成 `\<`、`\{`、`\}`（例如 `{Attr}`、`|<`），否则编译报错。表格里的 `|` 写成 `\|`。
- **中文粗体**：已装 `remark-cjk-friendly`，`**目标：**为……` 能正常加粗；如果看到页面上出现 `**`，先检查这个插件还在不在。
- **图片**：截图只用课件页和板书，裁切后一定打开检查有没有切掉内容；手写板书要旋转的先旋转。SVG 必须保留 `viewBox` 的大小写（不要用会把属性转成小写的 HTML 解析器处理 SVG）。
- **Node 版本**：本机默认 Node 18，要用 `PATH=~/.nvm/versions/node/v21.7.3/bin:$PATH`。
- **新笔记路由 404**：dev server 只在启动时同步内容，新建笔记目录后要重启 `npm run dev`。

## 6. 验证与发布

1. 启动预览（`.claude/launch.json` 里的 `site`），打开笔记页：检查没有坏图、互动组件能用、手机宽度不溢出、暗色模式可读。
2. `npx tsc --noEmit`、`npm run lint`、`npm run build` 全部通过。
3. 生成 README（见第 1 节）。
4. **先本地测试，等用户说了再 commit / push。**

---

## 给用户：新 session 里怎么说

一般只要说一句就够了（这份文件会被自动读到）：

```
做 ISOM 5180 第 3 周的笔记，课件在 "2026 Fall 1st/ISOM 5180/lectures/lec3/"，按 personal-site/docs/NOTES_WORKFLOW.md 来，用 MDX，该做互动组件的地方做互动组件。

我记得的重点：……（越具体越好，比如老师反复强调的点、板书题）
课上讲到：……（讲到哪一页，之后的部分标成预习）
```

如果老师的手写补充是空白版，把课堂笔记拍照直接贴进对话。
