---
title:
  en: "Final Practice · Short and Long Questions (Week 1–7)"
  zh: "期末模拟题 · 简答 + 情景长题（第 1–7 周）"
summary:
  en: "Exam-style practice for the 30-minute open-book final: 21 short questions (define, list, distinguish, calculate) and 6 multi-part scenario questions across all seven weeks, each with an answer box, scoring points, a bilingual model answer and the search words to use on the review page, plus two timed mock papers."
  zh: "30 分钟开卷期末的考试形式练习：21 道简答（定义、列举、区分、计算）和 6 道多小问的情景长题，覆盖 7 周，每题有作答框、得分点、中英参考答案和「在总复习页搜什么」，最后两套计时模拟卷。"
date: 2026-10-13
tags: [Practice, FinalReview, OpenBook, ShortAnswer, LongQuestion]
---
# ISOM 5070 期末模拟题 · SA + LA

**总复习页**：[期末总复习（Ctrl+F 用）](../final-review/)

> **怎么用**：题型不确定，所以简答（SA）和情景长题（LA）都练。先在框里**用英文写**，写完再点开参考答案，按得分点自评。内容存在这个浏览器里，刷新不会丢。  
> 每题下面都写了「🔎 搜」——就是考试时该在总复习页按 Ctrl+F 搜的词，**顺便练「看到题 → 想到搜什么」这一步**，这在开卷考里最省时间。  
> **时间感**：30 分钟 4–5 题 ≈ 每题 6 分钟。SA 目标 4–5 分钟写完，LA 目标 8–10 分钟。  
> 得分点和分值是我按题目设计的，不是老师给的评分标准。

---

## Section A · Short Questions（SA）

### Week 1

**\[Short Question · 6 marks · 约 80–120 词] A1. Distinguish between prevention, mitigation and remediation in cyber risk management. Give one cybersecurity example of each.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Prevention：风险发生之前，消除可能性 + 例子（安全培训）  
> ☐ \[2 分] Mitigation：承认仍可能发生，降低可能性或影响 + 例子（网络分段）  
> ☐ \[2 分] Remediation：发生 / 发现之后，纠正根因防止复发 + 例子（修补已被利用的漏洞）
>
> **English**
>
> - **Prevention** takes place *before* a risk materialises and aims to eliminate the possibility of it occurring — e.g. security awareness training so staff do not click phishing links.
> - **Mitigation** accepts the risk may still occur and reduces its likelihood or impact — e.g. network segmentation that limits how far an intruder can move.
> - **Remediation** happens *after* the risk has occurred or been discovered and corrects the root cause so it does not recur — e.g. patching a vulnerability that was exploited.
>
> **中文解析**
>
> 按**时间点**区分：事前消除 → 降低 → 事后根治。「打补丁」看时机：没被利用前是 prevention，被利用后是 remediation。  
> 🔎 搜：`remediation`、`预防`

**\[Short Question · 6 marks · 约 100 词] A2. List the five primary risk assessment dimensions taught in the course and briefly explain why a likelihood × impact heat map alone may be insufficient.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[3 分] 五个维度：Likelihood、Severity、Velocity、Volatility、Connectivity（各带一句解释）  
> ☐ \[3 分] 热力图只反映两维：漏了速度（勒索几分钟 vs 泄露几个月）、波动、关联（连锁风险）；还会把太多风险都标成 High
>
> **English**
>
> The five primary dimensions are **Likelihood** (probability of occurrence), **Severity** (damage if it occurs), **Velocity** (how fast it impacts the firm), **Volatility** (how much the probability changes with circumstances) and **Connectivity** (how it correlates with other risks). A heat map only plots likelihood against impact, so it misses velocity — ransomware can encrypt a network in minutes while a leak may hurt reputation months later — and connectivity, since one risk can trigger others. It also tends to rate too many risks as "High", which is why quantitative methods such as FAIR are used for material decisions.
>
> **中文解析**
>
> 答题时把三个「热力图看不到」的维度点出来，再连到 W3「什么时候用 FAIR」。  
> 🔎 搜：`velocity`、`heat map`

**\[Short Question · 6 marks · 约 100 词] A3. Compare the regulatory approaches of China, the EU and the USA to cyber security along three dimensions.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Governing approach：中国国家中心 / 网络主权；欧盟区域统一协调；美国分行业、无单一综合法  
> ☐ \[2 分] Core laws：CSL/DSL/PIPL；GDPR/NIS2/DORA；CFAA + 行业法 + NIST  
> ☐ \[2 分] Priority 或 data flows：国家安全 + 最严跨境；个人数据保护 + GDPR 传输机制；关键基础设施 + 更开放
>
> **English**
>
> |                       | China                                            | EU                                                                | USA                                                     |
> | --------------------- | ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------- |
> | Approach              | State-centred cyber sovereignty, strong control  | Harmonised regional regulation                                    | Sectoral and decentralised; no single omnibus law       |
> | Core laws             | CSL, DSL, PIPL                                   | GDPR, NIS2, DORA                                                  | CFAA, GLBA, HIPAA, SEC rules, NIST guidance             |
> | Priority / data flows | National security; strictest cross-border limits | Personal-data protection; transfers allowed under GDPR mechanisms | Critical-infrastructure protection; generally more open |
>
> **中文解析**
>
> 课件有五个维度（approach、core laws、priority、data flows、enforcement），挑三个写就够。  
> 🔎 搜：`cyber sovereignty`、`跨境`

### Week 2

**\[Short Question · 6 marks · 约 100 词] A4. Why do organisations adopt cyber security frameworks instead of designing security on their own? Give three reasons.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 系统化、有优先级的方法论 / 成熟度路线图  
> ☐ \[2 分] 合规强制（金融、医疗等受监管行业）  
> ☐ \[2 分] 审计轨迹，向董事会 / 投资人 / 监管证明治理良好
>
> **English**
>
> Frameworks are not adopted simply to be "more secure". They provide (1) a **systematic, prioritised methodology and maturity roadmap** for risk-management decisions; (2) a way to meet **mandatory compliance** requirements in regulated industries such as financial services and healthcare; and (3) an **audit trail and common reporting language** that demonstrates good governance to the board, investors and regulators.
>
> **中文解析**
>
> 只写「更安全」拿不到分。  
> 🔎 搜：`why framework`

**\[Short Question · 8 marks · 约 120 词] A5. Name the six functions of NIST CSF 2.0 and explain the difference between an Organizational Profile and a Tier.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[3 分] 六个功能 Govern、Identify、Protect、Detect、Respond、Recover（Govern 是 2.0 新增）  
> ☐ \[2 分] Profile：Current vs Target，记录到 subcategory，找 gap、排优先级  
> ☐ \[2 分] Tier：治理流程的严谨 / 整合程度（Partial → Risk Informed → Repeatable → Adaptive），不是认证也不是打分  
> ☐ \[1 分] 两者独立（可以 Profile 未达标但 Tier 高）
>
> **English**
>
> The six functions are **Govern, Identify, Protect, Detect, Respond and Recover**; Govern was added in 2.0 to cover strategy, risk appetite, roles and supply-chain expectations. An **Organizational Profile** records the firm's **current** and **target** outcomes at subcategory level so gaps can be identified and prioritised — it answers "what have we achieved?". A **Tier** (1 Partial, 2 Risk Informed, 3 Repeatable, 4 Adaptive) describes **how rigorous and integrated** the risk-management process is — it answers "how do we achieve it?". Tiers are not a certification or a score, and the two are independent: a firm tracking assets in a spreadsheet under a strict, reviewed process can be Tier 3 while still short of its target profile.
>
> 🔎 搜：`NIST CSF 2.0`、`Tier`

**\[Short Question · 6 marks · 约 100 词] A6. Explain the difference between governance and management in COBIT 2019, and describe how COBIT, ISO 27001, ISO 27002, CIS Controls and NIST CSF can be used together.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Governance：评估、定方向、监督（董事会）；Management：计划、建设、运行、监控（执行层）  
> ☐ \[4 分] 运营模型：COBIT 分配问责 → ISO 27001 运行 ISMS → ISO 27002 + CIS 设计和落地控制 → NIST CSF Profile 沟通现状和目标
>
> **English**
>
> In COBIT, **governance** evaluates stakeholder needs, sets direction and monitors performance — a board and executive responsibility — while **management** plans, builds, runs and monitors activities to execute that direction. A typical operating model: use **COBIT** to assign accountability across board, executives, risk, technology, security and audit; **ISO 27001** to run a certifiable ISMS; **ISO 27002 and CIS Controls** to design and implement specific controls; and **NIST CSF Profiles** to communicate current and target posture. FAIR sits alongside as the tool that quantifies any identified risk in money.
>
> 🔎 搜：`COBIT`、`operating model`

**\[Short Question · 6 marks · 约 100 词] A7. Explain MITRE ATT\&CK's three-level TTP structure and how D3FEND relates to it. Why is a purple team useful?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Tactics = why（目标），Techniques = how（方法），Procedures = how exactly（具体步骤 / 工具）  
> ☐ \[2 分] D3FEND：防御技术知识图谱，把防御（detect / harden / isolate / restrict / validate）映射到 ATT\&CK 攻击行为  
> ☐ \[2 分] Purple team：协作机制，用 ATT\&CK 模拟攻击、用 D3FEND 验证防御，把红队发现变成蓝队检测
>
> **English**
>
> ATT\&CK describes adversary behaviour in three levels: **tactics** are the attacker's goals (the *why*, e.g. initial access), **techniques** are the methods (the *how*, e.g. phishing) and **procedures** are the specific steps and tools (the *how exactly*). **D3FEND** is a knowledge graph of defensive techniques — detect, harden, isolate, restrict, validate — mapped to those ATT\&CK behaviours, so the two form an attack-to-defence lookup. A **purple team** is a collaboration mechanism: red emulates ATT\&CK techniques and blue verifies, using D3FEND, whether defences actually detect or block them, so findings quickly become detection rules.
>
> 🔎 搜：`ATT&CK`、`D3FEND`、`purple`

### Week 3

**\[Short Question · 6 marks · 约 100 词] A8. List the seven steps of the cyber security risk management methodology in order.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[4 分] 七步名称正确（每错一步扣分）  
> ☐ \[2 分] 顺序正确，并说明第 7 步是持续循环、变化后回到第 1 步
>
> **English**
>
> (1) Establish context and governance; (2) identify assets, processes, data and dependencies; (3) identify threat scenarios and vulnerabilities (threat modelling); (4) assess inherent risk; (5) select and implement risk treatment; (6) assess residual risk and obtain acceptance; (7) monitor, report, test and reassess — a continuous loop that returns to step 1 when the business, threats or controls change.
>
> 🔎 搜：`seven steps`

**\[Short Question · 6 marks · 约 100 词] A9. What five elements must a threat model contain? Write one sentence that combines all five for a ransomware scenario against a hedge fund.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[3 分] Actor、Attack path、Weakness、Targeted asset / service、Business impact  
> ☐ \[3 分] 一句话把五个要素都串起来，且场景合理
>
> **English**
>
> A threat model needs an **actor**, an **attack path**, a **weakness**, the **targeted assets or services**, and the **business impacts**. Example: *"A financially motivated ransomware affiliate (actor) gains access through a phishing email and stolen credentials (attack path), exploits standing admin privileges and untested backups (weakness) to encrypt the portfolio-operations file servers (target), disrupting trading support, delaying NAV reporting and triggering investor and regulatory notifications (impact)."*
>
> 🔎 搜：`threat model`

**\[Short Question · 8 marks · 写出计算过程] A10. A FAIR analysis estimates TEF = 1.0 per year and Vulnerability = 25%. Primary loss is US$5.3M and secondary loss is US$4.0M per event. (a) Calculate LEF, LM and annualised risk. (b) A control would reduce vulnerability to 10%. What is the new annualised risk and the risk reduction?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] LEF = 1.0 × 25% = 0.25 次 / 年  
> ☐ \[2 分] LM = 5.3 + 4.0 = US$9.3M；Risk = 0.25 × 9.3 = US$2.325M / 年  
> ☐ \[2 分] 新 LEF = 0.10，新 Risk = US$0.93M / 年  
> ☐ \[2 分] 降幅 US$1.395M / 年，并说明要和控制成本比（ROI）
>
> **English**
>
> (a) LEF = TEF × Vulnerability = 1.0 × 0.25 = **0.25 events per year** (about one event every four years). LM = 5.3 + 4.0 = **US$9.3M**. Annualised risk = 0.25 × 9.3 = **US$2.325M**.  
> (b) New LEF = 1.0 × 0.10 = 0.10; new risk = 0.10 × 9.3 = **US$0.93M**. Risk reduction = 2.325 − 0.93 = **US$1.395M per year**, which should be compared with the control's lifecycle cost to decide whether it is worth funding.
>
> **中文解析**
>
> 控制只改 Vulnerability，LM 不变——这就是 FAIR workflow 第 6 步「只改动控制会影响的输入」。  
> 🔎 搜：`LEF`、`公式与计算`

**\[Short Question · 6 marks · 约 100 词] A11. When should an organisation use a full FAIR analysis, and when should it not? Give at least two situations for each.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[3 分] 该用：大笔资金；多个控制要经济比较；热力图太多 High；定保险 retention / limit；董事会要尾部；想接受大额剩余风险（任二）  
> ☐ \[3 分] 不该用：明显低风险；强制性控制；运营紧急；证据太弱；immaterial（任二）
>
> **English**
>
> Use FAIR selectively for material, contested or expensive decisions — for example when a remediation programme needs significant funding, when two or more controls compete to treat the same risk, when a heat map rates too many risks as High, when setting cyber-insurance retention and limits, or when the board wants financial and tail-risk exposure. Do not use it when the risk is clearly low and within appetite, when the action is mandatory regardless of economics (a binding regulatory control), when the decision is operationally urgent, when evidence is too weak to distinguish options, or when losses and costs are immaterial. Its purpose is to make assumptions explicit and improve trade-offs, not to predict perfectly.
>
> 🔎 搜：`when to use FAIR`

### Week 4

**\[Short Question · 6 marks · 写出计算过程] A12. Baseline expected loss is US$6.0M per year. After phishing-resistant MFA and PAM, residual expected loss is US$2.2M. The control costs US$1.8M one-off plus US$0.4M per year. Using the first-year cost, calculate expected benefit, net benefit and ROI, and state whether the investment is justified.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Expected benefit = 6.0 − 2.2 = US$3.8M  
> ☐ \[2 分] Cost = 2.2M；Net benefit = 1.6M；ROI ≈ 73%  
> ☐ \[2 分] 结论：值得投，并提到尾部风险（超 US$10M 的概率 14% → 4%）或交付风险 / 证据
>
> **English**
>
> Expected benefit = 6.0 − 2.2 = **US$3.8M**. First-year cost = 1.8 + 0.4 = **US$2.2M**. Net benefit = 3.8 − 2.2 = **US$1.6M**. ROI = 1.6 / 2.2 ≈ **73%**. The investment is economically justified; it also cuts the probability of a single-year loss above US$10M from 14% to 4%, so tail risk falls and residual risk is likely to move within appetite — subject to delivery risk and evidence that the controls work.
>
> 🔎 搜：`ROI`、`MFA + PAM`

**\[Short Question · 6 marks · 写出计算过程] A13. A ransomware event causes a gross covered loss of US$8M. The policy has a US$1M retention and a US$4M limit; uncovered losses are US$0.5M and the premium is US$0.2M. Calculate the insurance recovery and the net retained loss. What does this show about cyber insurance?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Recovery = min(max(8 − 1, 0), 4) = US$4M  
> ☐ \[2 分] Net retained = 8 − 4 + 0.5 + 0.2 = US$4.7M  
> ☐ \[2 分] 保险是一层财务缓冲，不能替代风险分析和控制（自留、上限、除外、保费）
>
> **English**
>
> Insurance recovery = min(max(8 − 1, 0), 4) = **US$4M** (capped by the limit). Net retained loss = 8 − 4 + 0.5 + 0.2 = **US$4.7M**. Insurance is a **financial layer, not a substitute for risk analysis**: the firm still bears the retention, losses above the limit, excluded losses and the premium, and insurance does not restore operations or reputation.
>
> 🔎 搜：`net retained loss`

**\[Short Question · 6 marks · 约 100 词] A14. A CISO opens a board presentation with: 'Over the past year, the security team completed an assessment across 12 domains and identified 57 findings.' Critique this opening and rewrite it.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 问题：只讲过程 / 工作量，没有建议和要求的决策  
> ☐ \[3 分] 改写包含：明确建议 + 金额 / 时间 + 针对的情景 + 量化收益  
> ☐ \[1 分] 提到高管汇报是决策工具，30 秒内能复述
>
> **English**
>
> The opening reports **activity, not a decision** — the board cannot tell what it is being asked to approve. A strong opening leads with the recommendation and the ask: *"Approve a US$10M, 18-month resilience programme. It addresses the two scenarios — identity compromise and third-party outage — that drive 70% of our modelled severe-loss exposure, and is expected to reduce annualised loss exposure by US$25–40M."* An executive presentation is a decision tool: answer first, a few supporting facts, visible options, and a precise ask.
>
> 🔎 搜：`weak opening`

### Week 5

**\[Short Question · 6 marks · 写出计算过程] A15. A cloud order-management vendor scores D = 5, A = 5, C = 5, B = 3, F = 3, R = 3. Calculate its inherent cyber risk rating using the course weights and state its tier and two consequences of that tier.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 公式 0.25D + 0.25A + 0.20C + 0.15B + 0.10F + 0.05R  
> ☐ \[2 分] 1.25 + 1.25 + 1.00 + 0.45 + 0.30 + 0.15 = 4.40 > 3.5 → Tier 1  
> ☐ \[2 分] 后果：完整尽调（架构、隐私、财务韧性、第四方）；higher-tier 控制；合同条款到位前不得生产使用 / 共享敏感数据（任二）
>
> **English**
>
> Rating = 0.25(5) + 0.25(5) + 0.20(5) + 0.15(3) + 0.10(3) + 0.05(3) = 1.25 + 1.25 + 1.00 + 0.45 + 0.30 + 0.15 = **4.40**, above the 3.5 threshold, so the vendor is **Tier 1**. It must go through full due diligence (architecture, privacy, financial resilience, fourth parties), meet higher-tier controls such as phishing-resistant MFA with PAM, annual penetration tests and tested DR, and cannot be used in production or receive sensitive data until the required contract clauses are signed.
>
> 🔎 搜：`vendor tiering`

**\[Short Question · 6 marks · 约 100 词] A16. A vendor contract says: 'The supplier will notify the customer promptly of any security incident.' What is wrong with this clause? List four other cyber clauses a Tier 1 contract should contain.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] promptly 太模糊：没有触发条件、渠道、首次通知时限、更新频率、所需信息、事后报告  
> ☐ \[4 分] 其他条款（任四）：security standard、audit and evidence rights、sub-contractor governance、vulnerability remediation、data handling / destruction、resilience (RTO)、secure development、exit assistance、liability and insurance
>
> **English**
>
> "Promptly" is unenforceable: it gives no **trigger, channel, deadline for first notice, update frequency, required information or post-incident report**, so there is no actionable timeline when an incident happens. A Tier 1 contract should also include: audit and evidence rights (SOC reports, pen-test summaries); sub-contractor disclosure and flow-down; vulnerability remediation obligations; data ownership, handling and certified destruction; resilience commitments with a contractual RTO; exit assistance; and liability and insurance matched to potential loss.
>
> 🔎 搜：`contract clauses`、`promptly`

**\[Short Question · 8 marks · 约 120 词] A17. Name the four functions of the NIST AI RMF and list four of the six new risks an organisation takes on when it adopts AI.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[4 分] Govern、Map、Measure、Manage 各一句  
> ☐ \[4 分] 六类风险任四：data leakage、prompt injection、model / supply-chain compromise、excessive agent privileges、shadow AI、overreliance / automation bias
>
> **English**
>
> The AI RMF has four functions: **Govern** (culture, policy, accountability, model inventory), **Map** (context, intended use, stakeholders and what could go wrong for whom), **Measure** (evidence-based testing such as accuracy, fairness, red-teaming and drift) and **Manage** (prioritise and treat residual risk with deployment gates, human review, rollback or kill switch and monitoring). Adopting AI adds risks such as **data leakage** through unapproved tools, **prompt injection**, **model and supply-chain compromise** (poisoned data, malicious plug-ins), **excessive agent privileges**, **shadow AI** and **overreliance / automation bias**.
>
> 🔎 搜：`AI RMF`、`six AI risks`

### Week 6

**\[Short Question · 6 marks · 约 100 词] A18. List the six stages of incident response used in the course and explain the difference between containment, eradication and recovery.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[3 分] Preparation → Identification → Containment → Eradication → Recovery → Post Mortem  
> ☐ \[3 分] Containment 临时切断控制、阻止扩散；Eradication 去掉根因、确保攻击者回不来；Recovery 从 known-good 备份干净恢复并加强监控
>
> **English**
>
> The stages are **Preparation, Identification, Containment, Eradication, Recovery and Post Mortem**. **Containment** stops the damage spreading by cutting the attacker's current control — isolating endpoints, disabling accounts, revoking sessions — and is temporary. **Eradication** removes the root cause so the attacker cannot return: malware and persistence, exploited vulnerabilities, all stolen credentials and keys. **Recovery** restores systems from known-good backups in a clean environment, validates them and returns them to production in stages under heightened monitoring.
>
> 🔎 搜：`PICERL`

**\[Short Question · 6 marks · 约 100 词] A19. Compare incident response, crisis management, business continuity and disaster recovery: what question does each answer and who leads it?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[4 分] 四者各自的核心问题  
> ☐ \[2 分] 负责人：CISO / IC；CEO / COO / crisis director；COO / BCP 经理 / 业务 owner；CIO / CTO
>
> **English**
>
> | Capability          | Question                                                                          | Leader                                    |
> | ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
> | Incident response   | What happened and how do we contain and eradicate it?                             | CISO / incident commander                 |
> | Crisis management   | How do executives protect people, stakeholders, reputation and strategic options? | CEO, COO, crisis director                 |
> | Business continuity | How do critical services keep running at an acceptable level?                     | COO, BCP manager, business-service owners |
> | Disaster recovery   | How do we restore applications, infrastructure and data?                          | CIO / CTO, IT recovery lead               |
>
> In short: IR manages the threat, crisis management the decisions, BC the business and DR the technology.
>
> 🔎 搜：`IR vs crisis`、`BC vs DR`

**\[Short Question · 6 marks · 写出判断过程] A20. For trade execution, the BIA sets MTPD = 2–4 hours, RTO = 1 hour and RPO = 15 minutes. Backups run hourly and a full restore takes 3 hours. Define the three metrics and assess whether the current capability meets them.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[3 分] 三个定义：MTPD 最长可容忍中断；RTO 恢复目标时间（< MTPD）；RPO 以时间计的最大数据丢失  
> ☐ \[2 分] 3 小时 > RTO 1h 且超 MTPD 下限 2h；每小时备份最坏丢 1 小时 > RPO 15 分钟  
> ☐ \[1 分] 建议：更频繁备份 / 复制、更快恢复、人工下单 + 双人审批的替代流程、恢复后对账
>
> **English**
>
> **MTPD** is the longest disruption the firm can tolerate before harm becomes unacceptable; **RTO** is the target time to restore the service to an agreed minimum level and must be below the MTPD; **RPO** is the maximum tolerable data loss measured in time, which drives backup frequency. A 3-hour restore misses the 1-hour RTO and exceeds the 2-hour lower bound of the MTPD; hourly backups could lose up to 60 minutes of orders, far beyond the 15-minute RPO. The firm needs near-real-time replication, a faster recovery capability, a manual order process with dual approval as a workaround, and reconciliation after recovery.
>
> 🔎 搜：`MTPD`、`RPO`

### Week 7

**\[Short Question · 8 marks · 约 120 词] A21. 'A cybersecurity investment plan is not a shopping list of security products.' Explain this statement using the course's test question for every investment proposal and at least two of the five investment principles.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 定义：有资金支持的降险和韧性举措组合（funded portfolio）  
> ☐ \[2 分] 红字四问：which scenario、how much、by when、what evidence  
> ☐ \[4 分] 任两条原则并解释：业务服务和损失情景出发；每块钱降多少风险；为完整生命周期出钱（shelfware）；基础韧性与优化分开；当作 ERM 组合
>
> **English**
>
> An investment plan is a **funded portfolio of risk-reduction and resilience initiatives**: every dollar must be linked to a material loss scenario, a measurable reduction, an accountable owner and evidence. The course's test for each proposal is: ***which material business-loss scenario does it reduce, by how much, by when, and what evidence will prove the reduction?*** Two principles make this concrete. **Start with business services and loss scenarios** — protect trading, payments and investor data rather than buying tools in isolation. **Fund the whole control lifecycle** — a tool without operators, integration, detection engineering, testing and an executive owner becomes shelfware. Mandatory resilience (backups, MFA, IR) is funded even when narrow ROI looks modest, because its value is in the tail.
>
> 🔎 搜：`investment plan`、`shopping list`

---

## Section B · Long Scenario Questions（LA）

**\[Long Question · 20 marks · 每小问约 60–100 词] B1. A finance clerk at a Hong Kong asset manager joins a video call with what appear to be the CFO and two colleagues. Under time pressure, she makes five transfers totalling HK$40M to new beneficiaries. The fraud is discovered a week later. (a) Identify three controls that failed (root causes). (b) Map the attack to its stages. (c) Recommend improvements in three categories. (d) How has AI changed this type of attack?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[5 分] (a) 任三 root causes：身份验证依赖外表；高风险动作缺独立验证路径；权威压过质疑；收款人控制弱；检测太晚  
> ☐ \[4 分] (b) Targeting → Pretext → Impersonation → Social engineering → Execution → Discovery  
> ☐ \[7 分] (c) 身份与沟通（抗钓鱼 MFA、交易签名、反冒充流程、deepfake 培训）；治理与准备（纳入威胁模型、演练、银行快速冻结）；操作控制（双人独立审批、回拨、新收款人验证、冷静期、视频 / 邮件不足以核实付款）  
> ☐ \[4 分] (d) AI 放大攻击链早期（侦察、冒充）——克隆语音、合成视频、更大规模；但不改变攻防基本逻辑；防守也可以用 AI 检测异常付款
>
> **English**
>
> **(a) Failed controls.** Identity verification relied on appearance — a video call was treated as proof of the CFO's identity. There was no independent control path for high-risk payments, so a social-engineering request could move money without out-of-band verification. Authority and urgency overrode the normal challenge process. New beneficiaries and an unusual sequence of payments did not trigger a stop-and-verify control, and detection relied on after-the-fact review.
>
> **(b) Attack chain.** Targeting (a clerk with payment authority, identified from exposed organisational information) → pretext (messages impersonating executives) → impersonation (deepfake multi-person video call) → social engineering (authority plus urgency) → execution (multiple transfers to attacker accounts) → discovery (a week later).
>
> **(c) Improvements.** *Identity and communication*: phishing-resistant MFA and strong transaction signing; an anti-impersonation procedure under which any request involving money, credentials or bypassing controls must be challenged; deepfake scenarios in training. *Governance and preparedness*: add executive impersonation to the threat model and fraud-risk register; rehearse it; agree rapid recall and freeze procedures with banks. *Operational controls*: dual independent approval above a threshold; call-back on a known number for new beneficiaries or changed bank details; cooling-off periods; automatic holds when several risk signals coincide. Email, chat, voice or video alone is never sufficient to verify a material payment instruction.
>
> **(d) AI.** AI does not change the basic logic of the attack, but it strengthens its early stages: cloned voices, synthetic video and fluent, targeted pretexts make impersonation cheap, convincing and scalable. Defenders can also use AI to flag anomalous payment patterns, but the decisive control is a process that does not rely on recognising a face.
>
> **中文解析**
>
> 课件的分析方法就是**先诊断（哪些控制失效）再开药（怎么改进）**，每个改进要对应一个失效点。W7 也把它列成情景「AI 冒充触发虚假付款变更」，对策是**双人审批 + 可信回拨**。  
> 🔎 搜：`deepfake`、`root cause`、`callback`

**\[Long Question · 20 marks · 每小问约 60–100 词] B2. At 09:15, the SOC of a brokerage sees files on a finance share being rapidly encrypted. Initial checks show an employee opened a malicious attachment, credentials were stolen and the attacker moved laterally. Payments are not yet affected. (a) What should the firm do in the first hour? (b) Walk through the remaining IR stages. (c) At what severity level is this incident, and what would make it a crisis? (d) Which business continuity measures should run in parallel?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[6 分] (a) 开事件记录 + 任命 IC + 决策日志 + 独立沟通渠道；验证；先保全证据；定范围；按比例遏制；保护 crown jewels（身份、支付、备份）；拉上法务 / 保险；定更新节奏  
> ☐ \[5 分] (b) Eradication（找入口和持久化、确认备份和特权账号干净、重置凭证、gold image）→ Recovery（离线已验证备份、干净隔离环境、验证后接回、加强监控）→ Post Mortem（根因、整改 owner 和期限）  
> ☐ \[5 分] (c) Level 3 major incident（多系统、支付未受影响、未确认外泄）；升级到 Level 4：确认外泄、交易 / 支付受影响、长时间中断、媒体 / 监管暴露 → 宣布危机、crisis director、上报董事会  
> ☐ \[4 分] (d) BCP：按 BIA 优先级维持关键服务，财务流程手工替代，沟通 holding statement，恢复后对账；DR 负责系统恢复
>
> **English**
>
> **(a) First hour.** Open an incident record, appoint an incident commander, start a decision log and move to a communication channel independent of possibly compromised corporate systems. Validate the alert and check whether privileged access is involved and whether the attacker still has control. **Preserve evidence** — memory, endpoint images, logs, identity events — before changing systems. Scope affected services, accounts and lateral-movement paths, then **contain proportionately**: isolate infected hosts, disable the stolen account and sessions, block attacker infrastructure, and disconnect the share or subnet if spreading continues. Protect crown jewels — identity providers, payment channels, trading platforms and the backup infrastructure. Engage legal, privacy, business owners, the cyber insurer and external forensics, and set an update cadence (every 30 minutes during containment) reporting confirmed facts, working hypotheses and decisions needed, without premature attribution or assurances.
>
> **(b) Remaining stages.** *Eradication*: establish the entry path, find persistence, verify that backups and privileged accounts are clean, remove malware, reset credentials, patch and rebuild from gold images. *Recovery*: restore from verified offline backups into a clean, isolated environment, validate integrity and dependencies, reconnect in stages and monitor closely. *Post mortem*: timeline, root cause, notification assessment, executive report and remediation items with owners and due dates.
>
> **(c) Severity.** This is a **Level 3 major incident**: several systems are affected, but payments are untouched and no exfiltration is confirmed; it is led by the CISO / IC with executive oversight. It becomes a **Level 4 crisis** if a material data breach is confirmed, trading or payments are disrupted, the outage becomes prolonged, or there is media or regulatory exposure — then a crisis director declares a crisis, escalates to the board and runs parallel workstreams.
>
> **(d) Business continuity.** Keep priority services running per the BIA — e.g. switch affected finance processes to approved manual workarounds within their MTPD, use out-of-band communication if email is affected, prepare holding statements, and reconcile manual transactions once systems return. DR restores the systems; BC keeps the business operating meanwhile.
>
> 🔎 搜：`incident checklist`、`ransomware case`、`severity levels`

**\[Long Question · 20 marks · 每小问约 60–100 词] B3. A hedge fund plans to outsource its order-management system to a cloud vendor that will hold client orders, connect to trading venues and have admin access to a production integration. (a) Tier the vendor and justify. (b) What due-diligence evidence would you request? (c) Which contract clauses are essential? (d) How would you monitor the vendor and plan for exit? (e) Where does this sit in NIST CSF 2.0?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[4 分] (a) 打分（D、A、C 高）→ rating > 3.5 → Tier 1，说明权重最高的是 D 和 A  
> ☐ \[4 分] (b) SOC 2 / ISO 27001 + SoA、渗透测试、MFA / PAM 证据、BCP/DR 和 RTO/RPO、IR 计划、分包商清单  
> ☐ \[5 分] (c) 具体通知时限、审计权、分包商、漏洞修复、数据处理和销毁、合同化 RTO、退出协助、责任和保险  
> ☐ \[5 分] (d) 季度运营监督、年度控制保证、持续外部威胁监控、触发重评估；退出计划：数据导出、凭证吊销、替代方案；offboarding  
> ☐ \[2 分] (e) Govern → GV.SC
>
> **English**
>
> **(a) Tier.** Data exposure is High (client orders, possibly MNPI = 5), access is High (admin access and production integration = 5), criticality is High (trading workflow = 5), blast radius is enterprise / client-facing (5), fourth-party dependence on a cloud provider is Moderate (3), and regulatory impact is High (financial-services outsourcing = 5). Rating = 1.25 + 1.25 + 1.00 + 0.75 + 0.30 + 0.25 = **4.80 > 3.5 → Tier 1**. Data and access carry the highest weights, and both are at maximum.
>
> **(b) Evidence.** SOC 2 Type II report and ISO 27001 certificate with Statement of Applicability; recent penetration-test summary and remediation tracking; MFA coverage and PAM architecture; data-flow diagrams, encryption and key-management design; logging and 24×7 detection model; IR plan with tabletop evidence and notification process; BCP/DR plan with RTO/RPO commitments and restore-test results; subcontractor list and locations.
>
> **(c) Contract.** Incident notification with defined triggers, a deadline for first notice, update frequency and required information (not "promptly"); audit and evidence rights; subcontractor disclosure, flow-down and approval of material changes; vulnerability remediation timelines; data ownership, encryption, location, return and certified destruction; a contractual RTO and DR testing; exit assistance and data portability; liability caps and cyber-insurance requirements matched to potential loss.
>
> **(d) Monitoring and exit.** Quarterly operational oversight (SLAs, incidents, open remediation), semi-annual or annual control assurance (refreshed SOC and pen-test reports, DR tests), continuous external threat monitoring (leaked credentials, security ratings, disclosed vulnerabilities), and reassessment on triggers such as a breach, change of ownership or subcontractor, or service expansion. Plan exit before the relationship becomes critical: data export, transition support, an alternative provider or manual fallback, and offboarding that revokes accounts, tokens, certificates and API keys and verifies data destruction.
>
> **(e) NIST CSF 2.0.** Third-party risk sits under **Govern — GV.SC (cybersecurity supply-chain risk management)**, because it is about priorities, contractual requirements and accountability rather than a single technical control.
>
> 🔎 搜：`vendor tiering`、`due diligence`、`contract clauses`、`GV.SC`

**\[Long Question · 20 marks · 每小问约 60–100 词] B4. You are the CRO of a 220-person Hong Kong hedge fund with no in-house 24×7 SOC. The board gives you US$1.2M of incremental first-year budget. (a) Which loss scenarios would you prioritise and why? (b) How would you allocate the budget? (c) Which initiatives would you fund immediately and which would you slow down? (d) How will you prove the plan works?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[5 分] (a) 从业务服务和损失情景出发：账号接管 → 管理员、勒索、AI 冒充付款欺诈、投资者数据外泄 / 未批准 AI、云 / 基金行政管理人故障、交易数据被篡改（任三以上，带基线缺口）  
> ☐ \[5 分] (b) 按 p.19 区间分配并给出金额（身份约 22.5%、恢复约 20%、检测约 19%……储备约 4%），解释偏离  
> ☐ \[5 分] (c) 立即投：抗钓鱼 MFA + PAM、不可篡改备份 + 干净恢复；有前提再投：MDR；先试点：DLP；go slow：大型 SIEM、AI 安全平台、重叠工具——说明缺的前提  
> ☐ \[5 分] (d) 红字四问；成功标准（特权 MFA 100%、员工 98%+、EDR 98%+、两次恢复测试、两次演练）；季度里程碑和高管决策；Q4 renew / scale / stop / replace；KPI / KRI 季度报董事会
>
> **English**
>
> **(a) Scenarios.** Start from business services and the few scenarios most likely to cause material loss: (1) a phished account escalating to admin — traditional MFA and standing privileges; (2) ransomware on file services and portfolio operations — backups exist but recovery has never been tested end to end; (3) AI impersonation triggering a fraudulent payment change — approvals rely on email; (4) investor data exfiltrated or pasted into unapproved AI tools; (5) a cloud, SaaS or fund-administrator outage blocking NAV processes; (6) manipulation of risk or valuation data. These threaten trading, cash, investor trust and regulatory standing.
>
> **(b) Allocation** (following the course's percentage ranges): identity, privileged access and fraud prevention **US$270k (22.5%)**; resilience, backup and recovery testing **US$240k (20%)**; detection, response and managed security **US$230k (19.2%)**; cloud, vulnerability and application security **US$155k (12.9%)**; data protection and AI controls **US$120k (10%)**; third-party risk, governance, testing and training **US$135k (11.3%)**; contingency reserve **US$50k (4.1%)**. Cloud and vulnerability spending sits below the 15–20% range because the budget is incremental and existing IT already covers part of it.
>
> **(c) Fund now vs go slow.** Fund immediately: phishing-resistant MFA (100% of privileged users, 98%+ of staff) with PAM, and immutable backups with clean-room recovery and restore tests — the foundations whose value lies in the tail. Fund 24×7 MDR because we have no SOC, but only with clear response ownership and telemetry. Pilot DLP after data discovery and classification. Go slow on a large SIEM migration, an advanced AI security platform before an AI inventory and policy exist, and overlapping point tools — they lack the prerequisites and would become shelfware.
>
> **(d) Proof.** Each initiative must answer which scenario it reduces, by how much, by when and with what evidence. Success criteria include 100% privileged MFA, EDR coverage of 98%+, two critical-service restores within RTO/RPO, two cross-functional exercises, finance BEC/deepfake drills and tested payment call-backs. Report KPIs and KRIs to the board quarterly; each quarter has an executive decision, and in Q4 we renew, scale, stop or replace initiatives based on demonstrated loss reduction.
>
> 🔎 搜：`case study`、`budget allocation`、`go slow`、`success criteria`

**\[Long Question · 20 marks · 每小问约 60–100 词] B5. A bank's operations team wants to deploy an AI agent that reads client emails, drafts replies and can create payment tickets in the core system. (a) Identify the main AI risks. (b) How would you apply the NIST AI RMF? (c) Which controls would you require before go-live? (d) How should this fit into the firm's existing risk management?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[5 分] (a) prompt injection（不可信邮件内容）、excessive agent privileges（能建付款单）、data leakage、model / supply-chain、overreliance、shadow AI（任四）  
> ☐ \[6 分] (b) Govern / Map / Measure / Manage 各写具体动作  
> ☐ \[5 分] (c) 最小权限 / 只读、付款动作人工审批（双人）、prompt injection 测试和红队、日志、kill switch、企业租户、数据限制  
> ☐ \[4 分] (d) 接入现有风险分类、风险登记册和问题管理（不另起一套）；部署前评估；KRI；重评估触发；按影响分级
>
> **English**
>
> **(a) Risks.** Untrusted email content can carry **prompt injection** that instructs the agent to leak data or raise a fraudulent payment; **excessive agent privileges** mean a single model error becomes a real payment; client data may **leak** through the model provider or logs; the model or its plug-ins may be **compromised**; and staff may **over-rely** on drafted replies or tickets without checking them.
>
> **(b) AI RMF.** *Govern*: add the use case to the AI inventory, name business, technology, risk and legal owners, and require approval by the AI committee. *Map*: document the intended use, data flows, client impact, dependencies and prohibited actions, and design human-in-the-loop steps. *Measure*: test accuracy, red-team for prompt injection and data leakage, and measure override and error rates. *Manage*: set deployment gates, human-review thresholds, a rollback or kill switch, KRIs and incident procedures, and revalidate on model or workflow changes.
>
> **(c) Controls before go-live.** Least privilege — the agent may draft but cannot submit payments; payment tickets require dual human approval and call-back verification; an enterprise tenant with contractual data protections; input filtering and output validation; full logging; segregation from sensitive systems; and a tested kill switch.
>
> **(d) Integration.** Treat AI risk inside the existing enterprise risk taxonomy, risk register and issue management rather than a separate system; require a pre-deployment AI risk assessment for this high-impact use; track it as a scenario in the cyber investment plan (AI spending within 0–10% and only after the inventory and policy baseline); and trigger reassessment when the model, vendor, prompts or workflow change.
>
> 🔎 搜：`AI RMF`、`six AI risks`、`agent privileges`

**\[Long Question · 20 marks · 每小问约 60–100 词] B6. The board of a securities firm says: 'Cyber is an IT problem — the CIO should handle it.' (a) Argue why cyber risk belongs in enterprise risk management. (b) Who should be accountable for what? (c) How should the firm decide whether a risk is acceptable? (d) What should the CISO report to the board, and how often?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[5 分] (a) 网络风险冲击财务、法律、声誉、运营，并和第三方、运营等风险关联；需要董事会定胃口、资源分配；ERM 组件（战略、胃口、分类、识别、测量、应对、报告、保证）  
> ☐ \[5 分] (b) Board 批准胃口和监督；高管纳入战略；CRO 独立挑战和汇总；CISO 识别评估执行；业务 owner 担剩余风险；控制 owner 实施；内审独立保证；CSO 不向 CIO 汇报保持独立  
> ☐ \[5 分] (c) 风险胃口；inherent → residual；四种处置；正式接受权限人签字、有期限、记在 risk-acceptance register；重大决策用 FAIR / P95 / 超胃口概率  
> ☐ \[5 分] (d) 每季度（或事件驱动）：Top 情景、inherent vs residual 和趋势、是否在胃口内、处置状态、关键控制指标（MFA、恢复测试）、第三方集中度、重大事件、需要的决策；用业务语言而不是补丁率
>
> **English**
>
> **(a) Why ERM.** Cyber incidents cause financial, legal, regulatory, operational and reputational loss — the same outcomes as other enterprise risks — and they are connected to third-party, operational and conduct risks. Decisions about risk appetite, funding and acceptance therefore belong to the board and executives, not to IT alone. Cyber should flow through every ERM component: strategy and objectives, risk appetite, taxonomy, identification, measurement (using FAIR for material scenarios), response, reporting and independent assurance.
>
> **(b) Accountability.** The board or risk committee approves risk appetite and challenges material exposures; executives embed cyber in strategy and resource allocation; the CRO provides methodology, aggregation and independent challenge; the CISO identifies and assesses risk and runs the control strategy; business-service owners own service impact, funding and residual risk; technology owners implement and evidence controls; internal audit gives independent assurance. Security should not report only to the CIO, so that it can challenge IT independently.
>
> **(c) Acceptability.** Compare residual risk — after controls are proven effective — with the board-approved risk appetite. Choose mitigate, avoid, transfer or accept; acceptance must be formal, made by the designated authority, time-limited and recorded in a risk-acceptance register. For material decisions, use FAIR to show expected loss, P95 exposure and the probability of exceeding appetite.
>
> **(d) Board reporting.** Quarterly, or immediately after a major event: top scenario risks with inherent versus residual exposure and trend, appetite breaches, treatment-plan status, key control metrics (phishing-resistant MFA coverage, restore-test results, critical vulnerabilities beyond SLA), third-party concentration, major incidents and lessons, and the decisions required. Report in business terms — "can an attack stop trading?" — rather than technical activity such as "95% patch compliance".
>
> 🔎 搜：`ERM`、`accountability`、`risk appetite`、`board reporting`

---

## Section C · 两套计时模拟卷（30 分钟）

按考试的样子做：**开计时器 30 分钟**，只用总复习页 Ctrl+F，不看本页答案，写完再对照。

> **🎯 模拟卷 A（5 题：4 SA + 1 LA）**
>
> 1. **A2**：风险评估五维度 + 热力图的局限（W1）
> 2. **A5**：NIST CSF 六功能 + Profile vs Tier（W2）
> 3. **A10**：FAIR 计算（W3）
> 4. **A19**：IR / Crisis / BC / DR 对比（W6）
> 5. **B4**：US$1.2M 投资计划（W7，长题）
>
> 建议时间：每道 SA 4–5 分钟，长题 10 分钟，留 2 分钟检查。

> **🎯 模拟卷 B（5 题：3 SA + 2 LA 的精简版）**
>
> 1. **A12**：控制措施 ROI 计算（W4）
> 2. **A15**：供应商 Tiering 计算（W5）
> 3. **A21**：投资计划不是购物清单（W7）
> 4. **B1 (a)(c)**：Deepfake 付款诈骗——只答失效控制和改进（W2）
> 5. **B2 (a)(c)**：勒索事件——只答第一小时和定级（W6）
>
> 覆盖 W2–W7，含两道计算。

> **💡 自评后怎么补**
>
> - 哪道题**找资料**超过 1 分钟：回总复习页看那一节的「🔎 搜索词」，记下你本来想搜的词，下次就搜得到。
> - 哪道题**写不出结构**：看总复习页第 10 节的答题模板，按模板重写一遍。
> - 计算题错了：对照总复习页第 8 节的公式总表。
