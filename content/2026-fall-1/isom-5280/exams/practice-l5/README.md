---
title:
  en: "Practice L5 · Risk Management & AI Risk"
  zh: "练习题 L5 · 风险管理与 AI 风险"
summary:
  en: "Exam-style practice for Lesson 5: multiple choice, short questions and a long case question with answer boxes, scoring points for self-marking, and bilingual model answers."
  zh: "第 5 课考试形式练习：选择题、简答题、长题案例，带作答框、得分点自评和双语参考答案。"
week: 5
date: 2026-10-09
unlisted: true
tags: [Practice, RiskManagement, RiskTreatment, RiskAppetite, ShadowAI]
---
# 练习题 L5 · 风险管理与 AI 风险

**复习页**：[L5 期末复习](../final-l5/)　**总览**：[期末总复习](../final-review/)

> **怎么用**：选择题直接点选；简答和长题先在框里**用英文写**，再点「查看参考答案」，按得分点勾选自评。写的内容保存在这个浏览器里。计算题请带计算器。  
> 分值参照 Assignment 1：选择题每题 2 分，简答每题 10 分，长题 20 分。

## Section A · Multiple Choice

**1. Which step of the risk management process compares uncontrolled risks against the risk appetite?**

- A. Identifying risk
- B. Analyzing risk
- C. Evaluating the risk
- D. Summarizing the findings

> **答案：C**
>
> *EN:* Step 4, evaluating the risk, compares uncontrolled risks with the risk appetite; only risks above it go on to treatment.
>
> 第 4 步 Evaluating 才和风险胃口比。

**2. According to ISO 31000, risk appetite is:**

- A. The maximum loss an insurer will cover
- B. The amount and type of risk an organisation is willing to take to meet its strategic objectives
- C. The probability that an attack succeeds
- D. The total value of information assets

> **答案：B**
>
> *EN:* Risk appetite is set by the board and is the line against which evaluated risks are compared.
>
> 风险胃口：为了实现战略目标愿意承担的风险数量和类型，董事会定。

**3. Attack likelihood 30%, attack success probability 50%, asset value 200, probable loss 50%. What is the calculated risk?**

- A. 15
- B. 30
- C. 50
- D. 100

> **答案：A**
>
> *EN:* Loss frequency = 30% × 50% = 15%; loss magnitude = 200 × 50% = 100; risk = 15% × 100 = **15**.
>
> 15% × 100 = 15。

**4. A company outsources payment processing to a certified provider under a strict SLA. Which risk treatment is this?**

- A. Mitigation
- B. Transference
- C. Acceptance
- D. Termination

> **答案：B**
>
> *EN:* Shifting risk to another entity through outsourcing or contracts is transference; the key is an effective SLA.
>
> 外包 + SLA = 转移。

**5. Acceptance is a valid risk treatment only when the organisation has:**

- A. Not yet assessed the risk
- B. Determined that the cost of controls is not justified after a thorough risk assessment
- C. Bought insurance
- D. Shut down the asset

> **答案：B**
>
> *EN:* Acceptance must follow a full assessment showing treatment costs outweigh the benefit — otherwise it is simply neglect.
>
> 接受必须是评估过后的决定，不是放着不管。

**6. Which of the following is the unauthorised use of AI tools within an organisation?**

- A. Agentic AI
- B. Shadow AI
- C. Predictive AI
- D. Explainable AI

> **答案：B**
>
> *EN:* Shadow AI — for example Samsung staff pasting confidential material into an unapproved AI tool in 2023.
>
> Shadow AI：未经批准使用 AI，例如 Samsung 2023。

**7. Criminals use AI to clone a CFO's voice and instruct a transfer. In the three AI risk views, this belongs to:**

- A. AI for risk management
- B. Risks from using AI
- C. Risks from others using AI
- D. None of these

> **答案：C**
>
> *EN:* It is an external party using AI against the organisation — deepfake voice for social engineering.
>
> 别人用 AI 攻击你 = Risks from others using AI。

**8. Which is NOT one of the common risk management failures listed in Lesson 5 (Stulz)?**

- A. Failure to use appropriate risk metrics
- B. Failure to communicate risk to top management
- C. Failure to monitor risks
- D. Failure to buy enough cyber insurance

> **答案：D**
>
> *EN:* The five failures are not taking risks into account, wrong metrics, not communicating to top management, not monitoring, and not managing risks.
>
> 五个失败模式里没有「保险买得不够」。

## Section B · Short Questions

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B1. Define risk management and explain why it is described as a business and governance problem rather than a technology problem. Use the core concept Threat ∩ Vulnerability ∩ Consequence.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 定义：识别风险、评估相对量级、降到可接受水平（Whitman & Mattord）  
> ☐ \[2 分] 风险 = 威胁 ∩ 脆弱性 ∩ 后果，三者缺一不成风险  
> ☐ \[2 分] 后果是业务影响，判断「可接受」靠风险胃口，由董事会定  
> ☐ \[2 分] 领导力、政策、流程同样关键，技术解决不了全部  
> ☐ \[2 分] 没有零风险，目标是可接受风险，要在保护 CIA 的同时让业务运转
>
> **English**
>
> **Risk management** is “the process of identifying risk, assessing its relative magnitude, and taking steps to reduce it to an acceptable level”. A risk exists only where a **threat**, a **vulnerability** and a **consequence** overlap.
>
> It is a business and governance problem because:
>
> - The **consequence** is a business impact, and what counts as **acceptable** is set by the board's **risk appetite**.
> - **Leadership, policy and process** are as critical as technology — technology alone cannot solve it.
> - There is **no risk-free activity**; the goal is acceptable risk while still enabling the business and protecting CIA.
>
> **中文解析**
>
> 课件 p.25 三条原则：连到 CIA、管理不只是技术、没有零风险。用 T ∩ V ∩ C 说明「后果」属于业务层面，所以决定权在管理层。

**\[Short Question · 10 marks] B2. A customer database is worth HK$2,000,000. The chance of an attack this year is 20%, and the chance an attack succeeds is 40%. A successful attack would destroy 60% of the asset's value. All estimates are ±10%. The risk appetite is HK$90,000. (a) Calculate the loss frequency, loss magnitude, calculated risk and its range. (b) Should the company accept or treat the risk? Justify.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Loss frequency = 20% × 40% = 8%  
> ☐ \[2 分] Loss magnitude = 2,000,000 × 60% = HK$1,200,000  
> ☐ \[2 分] Calculated risk = 8% × 1,200,000 = HK$96,000  
> ☐ \[2 分] ±10% → HK$86,400 \~ HK$105,600  
> ☐ \[2 分] 点估计和上限都超过 90,000 → Treat；并说明按上限判断
>
> **English**
>
> **(a)**
>
> - Loss frequency = 20% × 40% = **8%**
> - Loss magnitude = HK$2,000,000 × 60% = **HK$1,200,000**
> - Calculated risk = 8% × 1,200,000 = **HK$96,000**, ±10% → **HK$86,400 to HK$105,600**
>
> **(b)** **Treat.** The point estimate (HK$96,000) and the upper bound (HK$105,600) both exceed the HK$90,000 risk appetite. Because every input is an estimate, the decision should be based on the upper bound, and the preferred treatment is mitigation.
>
> **中文解析**
>
> 按 L5 p.36 四步算。即使下限 86,400 低于胃口，也要看上限，不能侥幸接受。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B3. Explain the difference between risk acceptance and risk avoidance (termination). Give one example of each, and explain why neither should be confused with neglect.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Acceptance：不在现有保护之外再做什么，接受后果  
> ☐ \[2 分] Acceptance 的条件：完整评估后，处理成本不值得  
> ☐ \[2 分] Avoidance：有意识地不保护资产，关停、断网，把它移出运营环境  
> ☐ \[2 分] 各一个例子（如：低价值宣传网站接受；旧系统下线）  
> ☐ \[2 分] 都必须是有记录的主动决策，而不是放着不管 / 放弃资产
>
> **English**
>
> - **Acceptance**: the decision to do **nothing beyond current protection** and accept the outcome. Valid only after a thorough assessment shows the cost of treatment is not justified. *Example*: a low-value public brochure website.
> - **Avoidance / termination**: an **intentional choice not to protect an asset**, removing it by shutting it down or disconnecting it. *Example*: decommissioning an unused legacy server still connected to the network.
> - Neither is neglect: both must be **conscious, documented business decisions**. Ignoring a risk without assessment, or abandoning an asset still connected to the network, is a failure, not a strategy.
>
> **中文解析**
>
> 课件特别强调：Acceptance 必须在完成一系列评估之后；Termination 「must be a conscious business decision, not simply the abandonment of an asset」。

## Section C · Long Question

> **📌 案例：GreenFin（虚构）**
>
> GreenFin 是一家香港网上贷款公司，有 80 名员工。
>
> - 员工普遍用免费的公开 AI 工具总结客户贷款申请，管理层不知道。
> - 公司的信用审批模型由一家外部 AI 供应商提供，没人能解释它为什么拒绝某些申请人；监管机构最近来函询问。
> - 去年发生两次钓鱼导致账号被盗，每次损失约 HK$500,000。
> - 董事会从未讨论过风险胃口，风险报告只是一份「十大风险」清单。

**\[Long Question · 20 marks] C1. (a) Identify and classify the AI-related risks facing GreenFin using the three AI risk views (6 marks). (b) Recommend a risk treatment for each of THREE risks, naming the strategy (mitigation, transference, acceptance or termination) and justifying it (9 marks). (c) Using the risk management failures and the “better questions” in Lesson 5, advise the board on how to improve its risk governance (5 marks).**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] (a) Risks from using AI：Shadow AI——员工用公开工具处理客户资料，数据外泄、无治理  
> ☐ \[2 分] (a) Risks from using AI：信用模型不可解释 / 偏见 → 监管和法律风险  
> ☐ \[2 分] (a) Risks from others using AI：AI 驱动的钓鱼导致账号被盗（或供应商风险）  
> ☐ \[3 分] (b) Shadow AI → Mitigation：AI 治理政策、批准的企业版工具、培训、DLP（How, not No）  
> ☐ \[3 分] (b) 信用模型 → Mitigation + Transference：要求可解释性、人工复核；合同 / SLA 约束供应商；无法解释就 Termination 该模型  
> ☐ \[3 分] (b) 钓鱼 → Mitigation（MFA、培训演练）+ Transference（网络保险）  
> ☐ \[3 分] (c) 指出失败：没有风险胃口、指标不当、风险没传达给高层 / 没持续监控  
> ☐ \[2 分] (c) 更好的问题：要做什么决策、哪些不确定性会改变选择、看过底层数据吗
>
> **English**
>
> **(a) AI risks**
>
> - *Risks from using AI*: **Shadow AI** — staff paste customer loan data into public AI tools → data exposure, no governance, inconsistent controls.
> - *Risks from using AI*: the credit model's **explainability gap and possible bias** → GreenFin cannot defend decisions to the regulator; legal and regulatory risk.
> - *Risks from others using AI*: **AI-driven phishing** led to two account compromises (about HK$1M in total). There is also **third-party risk** from the external model vendor.
>
> **(b) Treatments**
>
> 1. **Shadow AI → Mitigation**: an AI governance policy, an approved enterprise AI tool (“how, not no”), staff training and data-loss prevention — the risk is high and controls are cheap.
> 2. **Credit model → Mitigation and transference**: require explainability and human review of rejections; put model documentation, audit rights and performance obligations into the vendor contract / SLA. If the model still cannot be explained, **terminate** its use for decisions — regulatory exposure exceeds its value.
> 3. **AI phishing → Mitigation plus transference**: MFA and phishing simulations reduce likelihood; cyber insurance covers residual financial loss.
>
> **(c) Governance advice**
>
> - GreenFin shows classic **failures**: no risk appetite (risks cannot be evaluated), inappropriate metrics (a top-ten list without likelihood or impact), and risk not communicated to or monitored by the board.
> - The board should **set a risk appetite and limits**, use quantitative assessment and heat maps, and review AI risk regularly.
> - Ask **better questions, not better reports**: What decision are we making, and which uncertainties could change it? Which option gives the best chance of success given what we don't know? Have we seen the underlying data?
>
> **中文解析**
>
> - **(a)** 用课件 p.8 的三栏归类，每个风险都要点名属于哪一栏。
> - **(b)** 每个风险写出策略名称 + 理由。可以组合使用（Mitigation 为主，Transference 补充），解释不了的模型可以终止使用。
> - **(c)** 直接引用 Stulz 的失败模式和「更好的问题」表格，这页课件就是为这类题准备的。
