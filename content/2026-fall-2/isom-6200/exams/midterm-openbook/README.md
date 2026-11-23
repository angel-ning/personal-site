---
title:
  en: "Open-Book Sheet · Midterm (Lectures 1–4)"
  zh: "期中开卷速查表（第 1–4 讲）"
summary:
  en: "A printable sheet to take into the ISOM 6200C midterm: a four-step method for each question, question type → what the right answer looks like, who decides what in every case, what each kind of evidence does and does not prove, the course's lists and frameworks, a one-line card for every case, a topic → slide-page index for the post-class student slides, and the twenty in-class quiz answers."
  zh: "带进 ISOM 6200C 期中考场的打印版：每题四步法、题型 → 正确答案长什么样、每个案例里谁决定什么、每种证据能证明 / 不能证明什么、课程里的各种清单和框架、每个案例一行速记、按主题查 post-class 学生版 slides 页码的索引，以及四次课堂小测 20 题答案。"
date: 2026-11-23
tags: [Midterm, OpenBook, CheatSheet, AAIA, Evidence, Accountability]
---
# 期中开卷速查表 · ISOM 6200C Lectures 1–4

**怎么用**：用右上角「导出」打印，和 L1–L4 **post-class 学生版 slides** 一起带进考场（下面所有页码都是 post-class 版的页码）。考试时**先看 §2 判断题型**，再回记录里找那一句，用 §4 核对证据能证明什么，最后用 §5 排除干扰项。理解和例子在 [期中复习（理解版）](../midterm-review/)。

**考试**：11 月 28 日 · 50 分钟含交卷 · 20 道单选 · 每题 1 分 · **不倒扣，不要留空** · HB 铅笔 · 答在 Answer Sheet · 题目纸一起交。**时间：每题 2.5 分钟；第 40 分钟还没做完就先把剩下的全部填上。**

## 本页大纲

- [1. 每题四步法](#1-每题四步法)
- [2. 题型 → 正确答案的长相](#2-题型--正确答案的长相)
- [3. 谁决定什么（所有案例）](#3-谁决定什么所有案例)
- [4. 证据能证明 / 不能证明什么](#4-证据能证明--不能证明什么)
- [5. 六种错误选项](#5-六种错误选项)
- [6. 课程里的清单和框架](#6-课程里的清单和框架)
- [7. 定义速查（English ↔ 中文）](#7-定义速查english--中文)
- [8. 案例一行速记](#8-案例一行速记)
- [9. 主题 → slides 页码索引](#9-主题--slides-页码索引)
- [10. 四次课堂小测答案](#10-四次课堂小测答案)

---

## 1. 每题四步法

1. **先读问题，不读记录**：圈出问的是哪一类——**Who** / **What evidence** / **Which conclusion is supported** / **What next** / **Which control** / **What type of attack / phase** / **Before restart**（→ §2）。
2. **回到记录找那一句**：找写着「must approve」「owns」「requires … before」「not tested / not supplied」「can / cannot」的句子。**答案几乎都能直接对应到记录里的一句话。**
3. **套原则**：服务 ≠ 模型 · 证据者 ≠ 决定者 · 证据只支持它的范围 · 按组看 · 需要 ≠ 允许 · 控制在模型外 · 事前胜事后 · hold 新的、保留旧的 · 记录 ≠ 效果 · 变更要 retest + regression + 批准 · 监督 = 信息 + 时间 + 权力。
4. **排除**：先划「事后」和「交给模型」，再划「找错人」「推广过度」「不相关证据」「反应过度」（§5）。剩两个时选**更完整但不过度**的。

---

## 2. 题型 → 正确答案的长相

| 题干                                               | 正确答案通常                                                                                 | 典型错误                                | 真题                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------ |
| **Who must** record / approve / accept …？        | 记录里**明确被赋予**这个权力的人（owner / steward / Finance），常带「after reviewing the revised evidence」 | IT、供应商、coordinator、工程、Operations、审计 | Cedar Q1 · Mosaic Q3 · Pine Q2 |
| **Which change triggers** the rule / reapproval？ | **谁做出有后果的决定**变了（人批准 → 自动执行）；或服务的组件 / 数据 / 工具变了                                         | 容量、报告方式、测试覆盖、量的变化                   | Cedar Q2                       |
| **Which conclusion is supported**？               | **最窄**的说法，常是「X, **not** Y」：只在测过的人群 / 版本 / 用途上成立                                        | 估计准确率、得出错误率、推广到没测的组                 | Cedar Q3 · Mosaic Q2           |
| **What evidence is still needed**？               | 正好补**记录里写着「没测 / 没提供」**的缺口，针对**拟用版本**和**没测的人群**                                         | 更多同样的样本、旧版本的数据、收据、截图、uptime、工作量     | Cedar Q5 · Pine Q1             |
| **What should X do next / best next action**？    | **保留已批准的 / 用 fallback + hold 新用途 + 补证据 + 正确的人决定**                                      | 先上线再查；上线后再接受风险；全部停掉；找供应商批准          | Cedar Q4 · Mosaic Q4 · Pine Q4 |
| **Which finding best supports** …？               | 直接回答「需要吗 / 达标吗」的那条测试结果                                                                 | 加密、保留、lookup 表等「保护」或「无关」事实          | Mosaic Q5                      |
| **Which control enforces** limits？               | **模型之外、事前**的 gate：工具要求授权调用者 + 有效批准                                                     | 事后复核、日志、模型自查                        | Alder Q1                       |
| **How should X handle** injected text？           | **当信息处理，权限在模型外强制**                                                                     | 照做、当作例外、靠模型拒绝                       | Alder Q3                       |
| **What must X test** before use？                 | 测**自己的服务**：本地数据、权限、连接的工具、失败处理                                                          | 重复供应商测试、读 model card、只测正常路径         | Alder Q2                       |
| **Which evidence best shows** X was done？        | **记录 + 效果测试**（撤销记录 + 旧凭证被拒）                                                            | 通知、发票、改标签、截图                        | Pine Q3                        |
| **Which statement is correct**（只有一部分变了）？         | 变了的部分**必须被记录 / 识别**（manifest 记录新 feed 和版本）                                             | 用不变的部分推断全部不变                        | Pine Q5                        |
| **What type of attack / which phase**？           | 查 §6 的定义表                                                                              | 名字相近的另一类                            | Alder Q4                       |
| **Before restart / release**？                    | **最完整**的：核实实时访问和影响 + retest 故障和相关功能 + 重启批准和风险接受 + 监控和停止规则                              | 只测正常路径、沿用旧批准、找无权的人批准、只靠小测试          | Alder Q5                       |

---

## 3. 谁决定什么（所有案例）

| 案例               | 决定 / 批准 / 接受风险                                                                                                                          | 提供证据 / 执行                                                                                                                                                         | 来源                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| L1 退票助手          | **Fare Policy Owner** 签政策 v3；**Service Owner** 证据复核后决定发布（deployment approval **未记录**）                                                   | 供应商、trained agent（处理例外）                                                                                                                                           | L1 Slide 51       |
| L1 Air Canada 延伸 | **Business Policy Owner** 授权规则和例外；**Service Owner** 决定发布                                                                                | Technical Supplier 实现；Trained Agent 在授权内解决争议                                                                                                                      | L1 Slide 25 背景    |
| L1 四角色           | **Business owner** 在授权内接受或上报风险                                                                                                          | **Control operator** 执行控制（无权接受风险）；**Internal audit** 独立评价（不接受风险、不做发布决定）；**External assessor** 只对约定范围的结论负责                                                         | L1 Slide 19       |
| Cedar            | **Events Director**：服务结果 + 剩余风险接受（扩展也保留）                                                                                                | Coordinator 批准每次分配；IT 运营 + 确认容量；供应商维护模型                                                                                                                           | L1 Slide 44       |
| L2 数据角色          | **Owner** 批准用途和范围                                                                                                                       | **Steward** 维护质量和使用规则；**Custodian** 运行存储和访问；Privacy / legal 建议；Supplier liaison 拿条款和证据；Internal audit 独立评估                                                        | L2 Slide 27       |
| Harbor           | **Service Director** 决定发布；**Data Owner** 批准改变的输入和目的（privacy / legal 提供建议）                                                               | 供应商（不训练、90 天诊断保留）                                                                                                                                                 | L2 Slide 54 记录 A1 |
| Mosaic           | **Data Steward** 批准新字段和改变的目的                                                                                                            | 供应商（加密、想保留数据行）；员工保留 lookup 表                                                                                                                                      | L2 Slide 45       |
| L3 生命周期          | Use case → **Business owner**；Deployment → **Release authority**；Monitoring → **Service owner**；Retirement → **Service & asset owners** | Builders 改进；**指定的 evaluators** 评估最终候选                                                                                                                             | L3 Slide 22       |
| Northstar        | **HR** 批准政策文件；**Service owner** 批准服务发布（两份不同记录）；HR 申请的最终批准人是**指定的经理**                                                                    | 工程（执行访问规则）；管理员账号试运行                                                                                                                                               | L3 Slides 3、49–52 |
| Pine Orchard     | **客户 / Operations Owner**：本地适用性 + 发布批准                                                                                                  | 供应商：来源历史（lineage）、版本变更、格式检查                                                                                                                                       | L3 Slide 43       |
| Alder            | **Finance** 批准例外；**独立授权流程**付款；重启要**重启批准 + 风险接受**                                                                                        | AI 只能建申请；Customer Support Ops 拥有服务流程；**Platform Security** 管 connector 权限和 IAM；**Incident Lead** 协调；Data Owner / Privacy Lead 管数据；Vendor Relationship Owner 对接供应商 | L4 Slides 4、48、59 |

**三条底线**：① 风险接受只能在**授权范围内**，不能授权被禁止的用途、抹掉违规、免除义务（L1 Slide 39）② **测试完成 ≠ 业务批准；旧版本的批准 ≠ 新版本的批准**（L3 Slide 38）③ **有权为安全暂停 ≠ 有权发布新版本**（L3 Slide 39）。

---

## 4. 证据能证明 / 不能证明什么

| 证据                              | ✅ 能证明                         | ❌ 不能证明                           | 页码              |
| ------------------------------- | ----------------------------- | -------------------------------- | --------------- |
| 96% 和 coordinator 一致（100 个普通请求） | 普通试点请求上的一致率                   | 拒绝准确率、4% 错误率、无障碍和申诉              | L1 44           |
| 38/40 匹配 v3（常规英文请求）             | 这 40 个请求的结果（错的 2 个都在日期类 8/10） | 部分使用的票、例外、争议、政策更新、交接；错误原因        | L1 36、51        |
| 起草 30 秒 vs 人工 4 分钟              | 起草速度                          | 整体收益（不含复核、纠错、跟进）；ROI             | L1 18、51        |
| Workado 98% / 53%               | 各自范围内的说法                      | 性能下降；在你的文件上的结果                   | L1 35           |
| 「每月 2,000 个决定」                  | 暴露面                           | 出错概率                             | L1 37           |
| 少量投诉                            | —                             | 准确率高；介入有效                        | L1 41           |
| 配置导出（规则启用）                      | Implementation：当时启用了          | 复核真的发生了（要 Operation 记录）          | L1 30           |
| 政策签了 / 链接到政策                    | 政策存在                          | 新渠道获准；回答和政策一致                    | L1 27–28、51     |
| 公开可见的数据                         | —                             | 可以收集、训练、画像                       | L2 17–19；L3 8   |
| 「不训练」承诺                         | 一个 safeguard                  | 保留、接收方、处理中的泄露、以后的用途              | L2 14、23        |
| 遮蔽 / 哈希 / 加密                    | 降低可见性 / 保护传输                  | 字段是需要的；匿名（有 lookup 就能连回）         | L2 12、20；Mosaic |
| 删除回执（源 + 索引）                    | 写到的存储和操作                      | 日志、供应商副本、备份                      | L2 25           |
| 删除命令（Everalbum）                 | 有删除义务（含派生模型）                  | 删除已完成                            | L2 26；L3 18     |
| 90 天保留上限                        | 合同允许的最长期限                     | 副本真的会过期                          | L2 29           |
| Alex 两个测试请求                     | 这两个情况符合规则                     | 其他用户、角色、路径、时期                    | L2 34–35        |
| 证书写 Division A                  | A 的管理体系在范围内                   | Division B；任何具体服务合法 / 准确         | L2 37           |
| 合并 90.7%                        | 合并结果                          | 每种语言达标（B 78%）                    | L2 40           |
| 分组差距                            | 偏见风险信号                        | 原因；歧视；（达标也不证明公平）                 | L2 41           |
| 调查公告（DPC / Grok）                | 调查开始了                         | 合法或违法                            | L3 8            |
| 公布的训练告知                         | 公司说了什么                        | 控制有效                             | L3 9            |
| 原文件 checksum 吻合                 | 原文件字节没变                       | 清洗后的副本保留了含义；改标签被授权               | L3 14；L4 77     |
| 99% 总准确率                        | —                             | 欺诈检测（0/10）                       | L3 12           |
| 1,000 条欺诈记录                     | —                             | 每种欺诈方法都覆盖（账户盗用只有 10）             | L3 13           |
| 输出警告                            | —                             | 撤回已送进模型的受限内容                     | L3 16           |
| 95/100（用来改进的同一批工单）              | 在这批熟悉案例上的匹配                   | 新工单上的表现；可以发布                     | L3 27           |
| 20 次管理员搜索完成                     | 管理员能完成搜索                      | 员工 / 经理能看到什么；正确率                 | L3 33           |
| 修好一个样本（V2）                      | 这一个样本对了                       | 所有缓存、索引、副本都更新了                   | L3 31           |
| 关掉界面                            | 一步退役                          | 凭证撤销、副本处理、连接关闭                   | L3 32           |
| 保留旧文件（回滚准备）                     | 可以开始恢复                        | 恢复后的服务能用、导出权限被移除                 | L3 40–41        |
| 回滚                              | 回到旧版本                         | 撤销已发生的数据变更、外部动作、导出的副本            | L3 40           |
| 公开 GitHub 仓库干净                  | 仓库的状态                         | PyPI 发布包的状态（Ultralytics）         | L3 30           |
| 扫描通过                            | 发现了什么                         | 不存在任何恶意行为                        | L3 30           |
| 10 次正常提交成功                      | 正常路径能用                        | 超时重试不重复（第 12 次生成两个申请）            | L3 50           |
| 完整的工单                           | 顾客说了什么                        | 检索的政策、配置、工具决定、付款结果               | L4 7            |
| 日志                              | 记录下来的行为                       | 模型的全部「想法」                        | L4 7            |
| 5 个禁用调用被拦下                      | 工具在这些测试里拒绝了                   | 模型不再提议；其他路径安全；（数量多 ≠ 风险大）        | L4 18、21        |
| English 38/40、Chinese 37/40     | 这个样本达到 90%                    | 运行中的检查、批准；高负载和其他语言；改善或公平         | L4 22           |
| 没找到批准回执                         | 记录里没有                         | 没有批准                             | L4 50           |
| 记录了暂停                           | 做了暂停动作                        | 每条执行路径都停了；付款被撤回                  | L4 51           |
| 恢复了标签                           | 标签恢复                          | 旧权限、待执行工作都没了                     | L4 53           |
| 20 个小恢复测试                       | 这些测试里无未授权执行                   | 实时权限、session、排队动作、13 个请求的影响；可以重启 | L4 59、64        |
| 读 model card / 供应商通用测试          | 供应商的范围                        | 本地数据、权限、工具、失败处理                  | L4 61           |

**反方向**：**缺记录 ≠ 证明失败**，只是限制保证程度（L1 30、41；L4 50）。

---

## 5. 六种错误选项

| # | 类型         | 识别词                                                                                                          |
| - | ---------- | ------------------------------------------------------------------------------------------------------------ |
| ① | **推广过度**   | establishes / estimates / proves / supports … when similar / cannot identify / all                           |
| ② | **找错决定人**  | IT / supplier / developer / coordinator / Operations / format-check team **approves**                        |
| ③ | **事后代替事前** | after refunds are paid / after the first month / after the next season / logs each completed / monitor while |
| ④ | **交给模型**   | the model checks its own … / rely on the model's refusal / prompt says                                       |
| ⑤ | **不相关证据**  | encrypted / receipt / invoice / screenshot / uptime / label removed / format checks / model card             |
| ⑥ | **反应过度**   | suspend the approved … until every uncertainty / no one / stop all                                           |

---

## 6. 课程里的清单和框架

**L1**

- **AI flow 五站**（Slide 8）：User（身份、访问、目的）→ Prompt（输入许可、上下文、敏感数据）→ Process（检索、模型、工具、人、授权动作）→ Output（政策一致、不确定性、后果性决定）→ User（接收方、交付、依赖、纠正途径）
- **Action authority**（Slide 12）：Drafting · Recommending · Acting
- **输出任务 vs 学习方式**（Slides 13–14）：Prediction / Generation · Supervised / Unsupervised / Reinforcement
- **HITL / HOTL / HOOTL**（Slide 21）：执行前人工验证 · 监督下自主、需要时介入 · 预设边界内常规自主。考虑：后果、可靠性、介入时间、可逆性、人手、授权边界
- **Lifecycle 里的治理**（Slide 22 解析）：Proposal（目的、owner、允许用途）· Release（对照标准的证据 + 记录的决定）· Operation & change（监控、重审假设）· Retirement（撤访问、处理数据和义务）
- **NIST AI RMF**（Slide 31）：**Govern**（权责）· **Map**（背景、受影响的人）· **Measure**（评估）· **Manage**（处理和监控）；自愿性
- **三层证据**（Slide 30）：Design · Implementation · Operation
- **伤害路径**（Slide 33）：Condition → Event → Consequence
- **风险比较**（Slides 34、37）：Severity · Likelihood · Exposure；加上时效、可逆性、受影响的人、safeguard 证据
- **四种风险应对**（Slide 38）：Avoidance · Reduction · Sharing / Transfer（本地责任保留）· Acceptance；**Inherent**（safeguard 之前）vs **Residual**（之后）
- **Risk appetite** 愿意承担的风险 · **Tolerance** 目标周围可接受的限度（L4 Slide 68）
- **风险接受记录**（Slide 39）：范围、剩余风险、证据和限制、授权 owner、复审日期、停止 / 升级条件
- **告警要带**（Slide 40）：报告期间、抽样方法、覆盖的请求类型、**分母**、阈值、复审频率；送到有权限的 owner；记录行动、后续 owner、期限

**L2**

- **三问**（L4 Slide 69）：Do we need it? · May we use it? · Is it protected?
- **数据流向的副本**（Slide 24 解析）：源工单 · 索引 / 缓存 · prompt 日志 · 供应商副本 · 恢复备份
- **输出泄露三机制**（Slide 22）：Memorisation · Inferred information · Membership inference
- **提示注入四道防线**（Slide 23 解析）：模型前（最小化、筛查）· 工具边界（按登录用户权限）· 披露前（接收方许可、遮蔽 / 阻止）· 验证和监控（允许和拒绝路径）
- **四种参照**（Slide 32）：Law / regulation（义务）· Standard（范围内要求，如 ISO/IEC 42001）· Framework / guidance（组织工作，如 NIST AI RMF、IMDA）· Internal policy（自己的规则）
- **PCPD AI 模范框架（2024）**（Slide 33）：① Strategy & governance ② Risk assessment & human oversight ③ Models & systems ④ Stakeholder communication；**指引，不是法规**
- **工作底稿四栏**（Slide 35）：Criterion / scope · Repeat the test · Observation / trace · Conclusion / limit
- **偏见来源**（Slide 40）：Institutional practices · Data & computation · Human judgement
- **透明三件事**（Slide 42）：告诉用户是 AI · 解释原因和限制 · 能找到真人复核和纠正
- **Masking / Pseudonymisation / Anonymisation**（L4 Slide 69）：隐藏值 / 替换标识符（都可能连回）/ 达到无法合理识别的标准

**L3**

- **数据四问**（Slide 4）：Data requirements · Permitted use · Quality & representation · Protection & retention
- **Fit for use 三对**（Slide 7）：收集目的 ↔ 任务 · 代表的人 ↔ 受影响的人 · 观察时期 ↔ 使用条件；**Data lag** → 重新训练或 RAG
- **数据质量六维**（Slide 10）：Accuracy · Completeness · Consistency · Timeliness · Validity · Uniqueness（Validity ≠ Accuracy；Completeness ≠ Uniqueness）
- **样本稀缺四步**（Slide 13）：找缺口 → 选应对 → 验证 → 记录限制
- **Guardrail 三类**（Slide 16 解析）：**Input**（身份和检索、内容和格式）· **Output**（信息披露 / DLP、质量和安全）· **Action**（工具范围、明确批准、频率 / 成本限制、安全 fallback）
- **为恢复保留**（Slide 17）：批准的数据 / 模型 / 配置版本 · 处理 / 变更 / 评估记录 · 恢复测试记录
- **By design / by default**（Slide 23）：Privacy · Security · Explainability
- **数据集用途**（Slide 26）：Training（学习）· Validation（比较、调参）· **Reserved test**（评估冻结的候选）
- **Prompt / Skill / Tool / MCP / Agent / Harness / Guardrail**（Slide 28 解析）：指令 · 可复用流程 · 可调用的函数 · 连接工具的协议（连接 ≠ 许可）· 用模型决定分步完成任务的系统 · 管理模型请求和工具执行的应用软件 · 输入 / 输出 / 动作周围的特定风险控制
- **安全失败**（Slide 29）：检查输入 → 检查限制（时间、调用次数、成本）→ 暂停或询问 → 只用验证过的 fallback
- **退役四项**（Slide 32 解析）：访问 / 凭证 · 副本 · 连接的服务 · 保留的证据
- **变更后三类测试**（Slide 37）：Permission baseline · DLP & guardrails · Regression；Expected → Observed → Pass / Fail / **Unresolved**
- **变更批准记录五栏**（Slide 38）：Change & version · Test results · Permitted scope · Decision & owner · Conditions & review
- **紧急变更四步**（Slide 39）：控制伤害 + 通知 owner → 紧急批准 → 最小变更 + 聚焦测试 → 记录、回滚条件、fallback、复审
- **回滚四步**（Slide 40）：设触发 → 定 fallback 版本 → 检查恢复后的行为和权限 → owner 确认并记录

**L4**

- **监督三件事**（Slide 3）：Set permissions · Test human intervention · Act on alerts
- **Logging / Monitoring / Observability**（Slide 5）：记录事件 · 检查条件 · 解释发生了什么
- **复核人的三个缺口**（Slide 8 解析）：Information · Time · Authority
- **介入测试四路径**（Slide 9 解析）：复核人退回 · Finance 拒绝 · Finance 批准 · 复核超时
- **Harness 五部分**（Slide 12 解析）：System prompts · Tools / skills / MCP · Bundled infrastructure · Orchestration · Hooks & middleware
- **测试四视角**（Slide 15）：Component · Integration · Black-box · Comparison
- **测试用例字段**（Slides 16–17）：ID · Summary · Priority · Severity · Prerequisites · Environment & input · Steps · Expected · Actual & status · Evidence & follow-up；**SMART**
- **测多深看四件事**（Slide 18）：伤害 · 多少人和请求 · 能否撤回 · 谁受影响
- **Retest vs Regression**（Slide 21）：修好已知故障 vs 没弄坏原来能用的
- **发布三档**（Slide 22）：Full release · Limited pilot · Hold
- **十种 agent 风险**（Slides 25–44）：① Prompt injection ② Excessive permissions ③ Lack of human reasonableness ④ Sandbox escape / runtime compromise ⑤ Credential & secrets exposure ⑥ Identity sprawl & standing privilege ⑦ Poor auditability & attribution ⑧ Invisible malicious behaviour ⑨ Plugin / tool supply chain ⑩ **Lethal trifecta = broad permissions + untrusted input + autonomous execution**
- **其他 AI 威胁**（Slide 45）：Poisoning（污染训练数据）/ Tampering（未批准改模型或设置）· Model theft · Information inference（membership / inversion）· Evasion（使用时改输入绕过检测）· Availability & cost
- **事件响应六阶段**（Slide 48）：Prepare → Detect & analyse → Contain → Eradicate → Recover → Learn（+ 尽早 Preserve evidence；Communicate 只说确认的事实）
- **Kill switch**（Slide 51 解析）：在 prompt 之外强制的快速停止，进入定义好的安全状态；测谁能启动、真正停了什么；重启另行批准
- **Canary**（Slide 54）：扩大使用前的小范围受控检查
- **Idempotency**（Slide 78）：重试同一个操作不产生第二个业务效果

---

## 7. 定义速查（English ↔ 中文）

| English                          | 中文 / 一句话                                       | 页           |
| -------------------------------- | ---------------------------------------------- | ----------- |
| AAIA                             | ISACA Advanced in AI Audit：本课按它的 Domain 1–3 组织 | L1 6        |
| Service boundary                 | 服务边界：人、数据、模型、连接，直到产生结果                         | L1 9、11     |
| Action authority                 | 行动权限：起草 / 建议 / 行动                              | L1 12       |
| Meaningful human involvement     | 有意义的人工参与：信息、时间、培训、改变决定的权力                      | L1 15       |
| Inherent / Residual risk         | 固有风险（safeguard 前）/ 剩余风险（safeguard 后）           | L1 38–39 解析 |
| Risk appetite / Tolerance        | 愿意承担的风险 / 目标周围可接受的限度                           | L4 68       |
| Negligent misrepresentation      | 疏忽性失实陈述（Air Canada 仲裁结论）                       | L1 26       |
| Privacy by design / by default   | 设计时内建保护 / 默认生效不需用户开启                           | L2 12；L3 23 |
| Data minimisation                | 数据最小化：只用任务需要的                                  | L2 12、16    |
| Secondary purpose                | 二次用途：原目的之外的新用途，要单独许可                           | L2 15       |
| Pseudonymisation                 | 假名化：替换标识符，仍可连回                                 | L4 69       |
| Membership inference             | 成员推断：判断某条记录是否在训练集里                             | L2 22；L4 45 |
| Prompt injection                 | 提示注入：不可信文本想改变 AI 的行为                           | L2 23；L4 25 |
| Data Owner / Steward / Custodian | 决定用途 / 维护含义和质量 / 技术上处理                         | L2 27；L4 69 |
| Workpaper                        | 审计工作底稿：让另一个审计员能重做测试                            | L2 35       |
| Certificate scope                | 证书范围：覆盖的实体、活动、服务、地点                            | L2 37       |
| Bias / Fairness                  | 结果的系统性偏差 / 检查有没有不合理的不利                         | L2 40；L4 72 |
| Fit for use                      | 适合用途：适合任务、受影响的人、使用条件                           | L3 7        |
| Data lag                         | 数据滞后：数据描述的是更早的情况                               | L3 7        |
| RAG                              | 回答时检索相关记录，**不重新训练**模型                          | L3 7        |
| Data integrity                   | 数据完整性：保持正确，防止不当修改                              | L3 14       |
| Checksum / digest                | 相同 = 字节相同；**安全仍需证据**                           | L3 14；L4 77 |
| Guardrail                        | 在输入、输出或动作上强制执行的过滤或控制                           | L3 16；L4 19 |
| DLP                              | Data loss prevention 数据防泄漏                     | L3 37       |
| Candidate                        | 被评估准备发布的具体版本                                   | L3 22       |
| Reserved test data               | 保留测试集：和改进模型用的数据分开                              | L3 26       |
| Harness                          | 管理模型请求和工具执行的应用软件                               | L3 28；L4 12 |
| MCP                              | 连接应用和工具的协议；**连接 ≠ 许可**                         | L3 28       |
| Robustness                       | 稳健性：处理意外情况而不造成不可接受的伤害                          | L3 29       |
| Artifact                         | 交付部署的打包软件或模型                                   | L3 30       |
| Retirement                       | 退役：结束使用，处理资产、访问和连接的服务                          | L3 32       |
| Baseline                         | 基线：记录下来的批准配置，用于比较变更前后                          | L3 36       |
| Regression test                  | 回归测试：变更没弄坏原来能用的                                | L3 37；L4 21 |
| Rollback                         | 回滚：回到合适的、之前批准的版本                               | L3 40       |
| Idempotency                      | 幂等：重试不产生第二个业务效果                                | L4 78       |
| Observability                    | 可观测性：能解释发生了什么                                  | L4 5        |
| Alert                            | 监控规则检测到需要处理的事件时通知负责团队                          | L4 11       |
| Standing privilege               | 常驻权限：在多次运行之间一直有效                               | L4 35       |
| Lethal trifecta                  | 致命三要素：宽权限 + 不可信输入 + 自主执行                       | L4 43       |
| Kill switch                      | 快速停止不安全功能、进入安全状态的受控方式                          | L4 51       |
| Canary                           | 扩大使用前的小范围受控检查                                  | L4 54       |

---

## 8. 案例一行速记

| 案例                                  | 事实                                                                              | 教训                                                    | 页                   |
| ----------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------- |
| **退票助手 L1-A1–A4**（虚构）               | v3 签了但没部署批准；38/40，错的都写 14 天（应 7 天）；一个工作日 agent；投诉只记订单号；没定复审和 stop/restart owner | **Hold** 直接面向顾客的建议，保留呼叫中心；修错、retest、测政策更新 / 交接 / 下班时段 | L1 51–53            |
| **ICO Recruitment rewired**（2026.3） | 30 多家雇主，很多可能完全自动决定                                                              | 看**被拒**那条路径上有没有有意义的人工参与                               | L1 15               |
| **Hyperproof / OutSystems / Aprio** | 合规证据共享平台                                                                        | 证据共享**不转移**决定权                                        | L1 19               |
| **JPMorgan / CFTC**（2021）           | 禁止非批准渠道，员工包括主管照用 WhatsApp                                                       | 政策 ≠ 行为；测实际行为                                         | L1 20               |
| **Klarna**（2024–25）                 | AI 客服后质量下降，重新招人                                                                 | 分开衡量价值、伤害、safeguard 运行；成本之外看质量和找到真人                   | L1 23；L3 21         |
| **Air Canada / Moffatt**（2024）      | 机器人说可出行后申请丧亲票价，链接政策说不行；疏忽性失实陈述                                                  | 公司为机器人的话负责；事实不足判断技术原因；链接 ≠ 一致性                        | L1 25–30；L4 10      |
| **Rite Aid / FTC**（2023）            | 人脸识别误匹配，员工跟踪、驱逐顾客                                                               | 行动前独立核实；员工总照告警行动时复核无效                                 | L1 33；L2 43         |
| **Workado / FTC**（2025）             | 宣称 98%，另一测试 53%                                                                 | 准确率「在什么上」；两个数字不衡量下降                                   | L1 35               |
| **Cedar Events**（小测）                | 排序 → 自动拒绝；96% 普通案例                                                              | Director 决定；hold 新用途；补无障碍测试                           | L1 44–49            |
| **Harbor L2-A1–A6**（虚构）             | 员工 FAQ 试点 → 顾客自助 + 工单检索；A 89%、B 92%；删除只覆盖源 + 索引；英文帮助                            | 继续员工试点；hold 自助和推送；Data Owner 批准；保留 / 性能 / 升级证据        | L2 54–56            |
| **加拿大调查 OpenAI**（2026.5）            | GPT-3.5/4 收集过宽、同意 / 告知问题                                                        | 公开 ≠ 允许；过去结论指导检查，不证明现在                                | L2 17–19            |
| **Everalbum / FTC**（2021）           | 停用账户后仍保留照片；命令删除上传内容和派生模型                                                        | 删除义务可覆盖模型；命令 ≠ 完成                                     | L2 26；L3 18         |
| **Mosaic Museum**（小测）               | 票数总数就够；哈希 ID 可连回；推广没审批                                                          | 只用总数；Data Steward 审批新用途                               | L2 45–50            |
| **DeepSeek / PIPC**（2025）           | 不必要地传给 Volcano；训练告知不足；已传数据建议删除                                                  | 报告的整改 ≠ 核实；按数据和伤害排优先级                                 | L2 51–52            |
| **X / Grok / Irish DPC**（2025）      | 用 EU 公开帖子训练 Grok，开调查                                                            | 调查公告 ≠ 结论；公开仍需依据                                      | L3 8                |
| **Anthropic 训练告知**（2025.8）          | 消费者可选是否训练；5 年 / 30 天                                                            | 公布的承诺 ≠ 控制有效                                          | L3 9                |
| **Hugging Face Spaces**（2024.5）     | 疑似访问 secrets，撤销 token                                                           | 密钥管理；旧 token 必须访问失败                                   | L3 25               |
| **Anthropic 可信 agent**（2026.4）      | 读日历自动，发邀请要批准；酒店报销限额                                                             | 读 ≠ 写；规则不清就暂停或询问                                      | L3 28–29            |
| **Ultralytics / PyPI**（2024.12）     | 挖矿代码在 PyPI 包里，不在 GitHub                                                         | 审仓库不够；连起源码、构建、包哈希、发布决定                                | L3 30               |
| **Northstar HR 助手**（虚构）             | 同模型，改指令 / 政策 / 目录 + 导出 + HR 提交；管理员账号测试；回滚未测；超时重试出两个申请                           | 按角色测访问；回滚后测导出被拒；延后 HR 提交，修幂等                          | L3 3、19、33、41、49–52 |
| **Pine Orchard**（小测）                | feed 退役，替代自动启动，只过格式检查                                                           | 阻止启动，用手工计划；撤销记录 + 拒绝测试；manifest 记录新 feed              | L3 43–48            |
| **Alder Services**（贯穿 L4）           | AI 只能建申请；Finance 批例外；事故中 AI 被给了付款权限，付出 HKD320                                   | 权限在工具端强制；暂停 ≠ 全停；重启要核实 + retest + 批准 + 风险接受 + 监控      | L4 4–64             |
| **BMW Toronto**（2026.6）             | 机器人报回购价，员工撤回后又恢复                                                                | 报道不说明原因，也不是判决                                         | L4 10               |

---

## 9. 主题 → slides 页码索引

（post-class 学生版页码。考场上找到页面后，**页面上的弹窗解析在打印版里看不到**，以本页和理解版为准。）

| 主题                         | L1       | L2       | L3       | L4          |
| -------------------------- | -------- | -------- | -------- | ----------- |
| 本讲路线 / AAIA                | 6        | 6        | 2        | 2           |
| 开场案例                       | 7、51     | 8、54     | 3        | 4           |
| 服务边界 / AI flow             | 8–11     | 9、13     | 5–6      | 14          |
| 谁决定 / 角色                   | 16、19、39 | 27       | 22       | 59（records） |
| 人工监督 / HITL                | 15、21、30 | 42–43    | 28–29    | 3、8–9       |
| 变化触发重审                     | 12、22    | 7        | 35–38    | —           |
| 政策 ≠ 行为                    | 20       | —        | —        | —           |
| 试点 / 准确率范围                 | 35–36    | 34–35    | 12–13、27 | 20–22       |
| 分组 / 公平                    | —        | 40–41    | 12–13    | 20          |
| 需要 / 允许 / 最小化              | —        | 12、15–20 | 4–9      | 69          |
| 推断 / 泄露 / 注入               | —        | 21–23    | 16       | 25–26、45    |
| 副本 / 保留 / 删除               | —        | 24–26、29 | 15–18、32 | 70          |
| 参照 / 框架 / 证书               | 31       | 32–37    | 23       | —           |
| 风险路径 / 比较 / 应对             | 32–41    | —        | —        | 18、68       |
| 告警 / 监控                    | 40       | —        | —        | 5–7、11      |
| Guardrail / harness / 工具权限 | —        | 23       | 16、28–29 | 12、19、27–28 |
| 开发 / 密钥 / 供应链              | —        | —        | 24–25、30 | 33–34、41–42 |
| 评估 / 测试用例                  | —        | —        | 26–27、37 | 13–21       |
| 变更 / 紧急 / 回滚               | —        | —        | 35–41    | 77–78       |
| 发布决定                       | 52–55    | 41、56–58 | 38、52    | 22          |
| 威胁                         | —        | 22–23    | 30       | 24–45       |
| 事件响应                       | —        | —        | 39–40    | 46–56       |
| 课堂小测                       | 44–49    | 45–50    | 43–48    | 59–64       |
| 总结                         | 54–55    | 57–58    | 53–54    | 65–80       |

---

## 10. 四次课堂小测答案

| 小测                           | Q1                                   | Q2                           | Q3                          | Q4                                  | Q5                                         |
| ---------------------------- | ------------------------------------ | ---------------------------- | --------------------------- | ----------------------------------- | ------------------------------------------ |
| **Cedar Events**（L1 44–49）   | **B** Events Director                | **D** 排序 → 无人批准的拒绝           | **A** 普通案例一致，不是拒绝的有效性       | **C** 保留人工分配，拿评估 + 证据 + Director 决定 | **A** 测无障碍相关的拒绝                            |
| **Mosaic Museum**（L2 45–50）  | **C** 只用每小时票数总数                      | **A** 员工能用 lookup 表连回会员      | **D** Data Steward 审查新目的和字段 | **D** 用总数 + 现有控制，等 Steward 审查再做推广   | **B** 只用总数的试验达标                            |
| **Pine Orchard**（L3 43–48）   | **B** 替代 feed 的来源历史 + 本地季节覆盖（拟用版本）   | **C** 客户，用供应商的来源记录           | **A** 撤销记录 + 旧凭证被拒的测试       | **C** 阻止未批准的启动，用手工计划                | **D** manifest 记录替代 feed 和版本               |
| **Alder Services**（L4 59–64） | **C** 批准限 Finance；付款工具要求授权调用者 + 有效批准 | **B** 测 Alder 的数据、权限、工具、失败处理 | **D** note 当信息；权限在模型外强制     | **A** Information inference         | **C** 核实访问和影响 + retest + 批准和风险接受 + 监控和停止规则 |
