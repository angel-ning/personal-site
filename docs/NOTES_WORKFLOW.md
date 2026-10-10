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
| `<MCQ q="…" a="…" b="…" c="…" d="…" answer="B">解析</MCQ>` | 可点选的选择题（MC 考试的课一律用它做自测题）。选项最多到 `f`；`answer="CE"` 这样写多个字母就变成 Choose two / three：勾够数量再「提交」 |
| `<LayerQuiz />` | DBMS 分层「这属于哪一层」练习（数据在 `data/dbms-layers.json`） |
| `<RelAlgebraLab />` | σ / Π / ⋈ 在课件的 Artist / Album 表上组合 |
| `<BufferPoolLab />` | Buffer pool：hit / miss、dirty、LRU 替换、写回 |
| `<EerConstraintLab />` | EER 两个约束问题 → 自动画图 + discriminator 取值 |
| `<HierarchyExplorer />` | 超类 / 子类层级的属性继承 |
| `<TcpHandshakeLab />` | TCP 三次握手 + 数据段的 SEQ / ACK（自填 ISN、数据长度） |
| `<WindowLab />` | 滑动窗口 + 期望型 ACK + 超时重传（点选丢失的段） |
| `<SubnetLab />` | 子网划分：借位 → 掩码 / 子网表 / 某地址属于哪个子网（AND 逐位） |
| `<SubnetPlanner />` | 按「需要几个子网 + 每个多少主机」算借几位、列出可行方案 |
| `<PortLab />` | 端口号分类 + 多窗口访问服务器的 IP / MAC / Port (S, D) 与多路复用 |
| `<SqlPipelineLab />` | SELECT 逻辑执行顺序：FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY 逐步看中间表（含报错示例） |
| `<JoinLab />` | INNER / LEFT / RIGHT / FULL join 与 self-join，补 NULL 的行高亮 |
| `<GrantLab />` | GRANT / REVOKE 权限矩阵：角色、WITH GRANT OPTION、连锁撤销 |
| `<NormalizeWalkthrough />` | 规范化逐步演示（含 Lab 5-02 Project Equipment）：原始表 → 1NF → 2NF → 3NF，样本数据 + 高亮重复存储的格子 |
| `<FdFinderLab />` | 找 FD：选决定因素看样本数据里有没有反例 + 「第三层扫描」（每个非键列当决定因素，区分真 FD 和样本巧合） |
| `<IrPhaseQuiz set="nist\|picerl" />` | 「这一步属于 IR 哪个阶段」点选练习：`nist` = NIST 四阶段（ISOM 5280），`picerl` = 六阶段 + 勒索软件时间线（ISOM 5070 第 6 周） |
| `<BiaTimeLab variant="wrt\|mtpd" />` | BIA 时间线：`wrt` = MTD / RTO / WRT / RPO（ISOM 5280），`mtpd` = MTPD / RTO / RPO + 最低持续安排（ISOM 5070 第 6 周 p.33） |
| `<SqlExercise id="b03" />` · `<SqlTables set="pine\|lab6" />` · `<SqlScript set="…" />` · `<SqlProgress />` | ISOM 5260 SQL 练习册（`labs/sql-practice`）：题目 + 答案 SQL + Oracle 预期结果 / ORA 报错，在 SQL Developer 里对照。题目和预期结果在 `data/sql-practice.json`，由老师的 `oracle demo.sql` 和 `lab6_init.sql` 生成；不在浏览器里执行 SQL（SQLite / PostgreSQL 的规则和 Oracle 不同） |
| `<Result>` Markdown 表格 / 文字 `</Result>` | 折叠的「看结果」，紧跟在一段示例 SQL 后面：先自己在 SQL Developer 里跑，再点开对照（ISOM 5260 SQL 学习版） |
| `<CommandSortQuiz />` | 「这条语句属于 DDL / DML / DCL / TCL 哪一类」点选练习（题目在 `sql-commands.mjs`） |
| `<WriteQA id="…" kind="SA\|LA" marks="10" limit="…" q="…">` + `<Pt m="2">得分点</Pt>` | 考试形式的简答 / 长题：作答框（内容存在本机 localStorage，按 `id` 区分，id 要全站唯一）+ 实时词数，点开后显示得分点清单（勾选自动算自评分）和参考答案（English + 中文解析）。打印 / 导出 PDF 时作答框隐藏、答案展开（ISOM 5280 练习题页） |
| `<CalcDrill />` | 期末计算题随机练习（ISOM 5280）：SLE / ALE、CBA、MTD / RPO 达标判断、Lesson 5 定量风险四步，自己填答案检查 + 看步骤（逻辑在 `calc-drill-logic.mjs`，复用 `bia-logic` / `risk-logic`） |
| `<SeverityLadder />` | 事件分级 Level 1–4：按五个维度点选特征，取最严重一维定级，显示谁来领导、必须做什么 |
| `<PriorityScoreLab />` | 投资优先级打分（ISOM 5070 第 7 周 p.7 / p.20 两个公式）：给 p.21 的举措打分排序，再叠加「基础控制先投」和「前提不满足就先试点 / go slow」两道关（逻辑在 `invest-logic.mjs`） |
| `<BudgetMixLab />` | 安全预算配比 vs p.19 百分比区间：p.29 案例 US$1.2M、区间中点、工具堆砌反例三个预设，拖动占比、切换「恢复能力不可靠」，展开 p.30–35 的举措明细 |
| `<Ipv6Lab />` | IPv6 地址：完整 / 去前导 0 / `::` 压缩（含非法写法提示）、地址类型、GUA 三部分、solicited-node（逻辑在 `ipv6-logic.mjs`） |
| `<Eui64Lab />` | EUI-64 三步：MAC 拆开 → 插 FFFE → 翻转 U/L 位 → link-local / SLAAC 地址 |
| `<RaOptionLab />` | RA 三个选项（SLAAC only / SLAAC + stateless DHCPv6 / stateful DHCPv6）：消息顺序 + 每项信息从哪来（`ra-logic.mjs`） |
| `<Ipv6SubnetLab />` | IPv6 子网划分：/48 → /52…/80 列子网、nibble boundary、查地址属于哪个子网 |
| `<BaselineLab />` | 一周流量折线图：静态阈值 vs AI 基线（季节性、凌晨异常、业务变化后自动重建基线、trickle 外传），统计误报 / 抓到没有（`baseline-logic.mjs`） |
| `<TrendSortQuiz set="ml\|arch\|ztna\|iot" />` | ISOM 5180 第 6 周点选练习：ML 三种学习方式 / SDN 平面 + NFV 组件 / ZTNA 原则 / IoT 攻击面三层（题目在 `data/ai-trend-quiz.json`） |
| `<TxnSortQuiz set="acid\|redo-undo\|recovery" />` | ISOM 5260 第 6 周点选练习：ACID 哪一条 / REDO、UNDO 还是不用处理 / 四种 recovery（题目在 `data/txn-quiz.json`；和 TrendSortQuiz 共用 `sort-quiz.tsx` 的 `SortQuizView`，新的分类练习直接加 JSON + 一个三行的包装组件） |
| `<WalLab />` | WAL 正常运行：自己决定 flush 日志 / flush 数据页 / 回复用户 / 崩溃，违反 WAL 两条规则会被拦下，崩溃后自动跑恢复；含 p.16、p.17 演示（`recovery-logic.mjs`） |
| `<RecoveryLab presets="redo\|undo,recrash,abort\|ckpt" />` | 崩溃恢复逐步演示：分析 → REDO（比 pageLSN）→ UNDO（CLR、NextLSN、TXN-END），可改「崩溃时磁盘页面写到哪」，每步可先自己判断（`recovery-logic.mjs`） |
| `<AddressingLab start="a2\|q1\|q2\|chain\|mock" />` | ISOM 5180 期末：给一个网络 + 拓扑图 → 数网络（LAN + 路由器之间的线）、min / max 借位、子网表、编址表（路由器 LAN 接口 = 第一个可用地址 = 主机网关）、每台路由器的路由表、选两台主机看每一跳的 IP / MAC 和 ARP 谁。拓扑和画图坐标在 `addressing-logic.mjs` 的 `TOPOLOGIES`，加新图就加一项 |
| `<AddressingQuiz start="…" />` | 同一批拓扑的考试模式：空白表自己加行（Device · Interface · IP · Mask · Gateway），不提示哪些接口要地址；`checkFreeRows` 自己判断每个地址属于哪个网络，再列出错格和漏掉的接口。内容存在本机 localStorage（`addrquiz:<id>`） |
| `<SeqAckLab preset={0} hide />` | 给两边 ISN + window size 画 SEQ / ACK 时序图：三次握手 → 一窗一窗发段 → 期望型 ACK，可选按段 / 按字节编号、丢一段（超时重传）；`hide` 先隐藏数字。轮次逻辑复用 `tcp-logic.mjs` 的 `simulateWindow`（`seqack-logic.mjs`） |

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
