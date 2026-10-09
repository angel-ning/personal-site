---
title:
  en: "Practice L6 · Incident Response & Contingency Planning"
  zh: "练习题 L6 · 事件响应与应急规划"
summary:
  en: "Exam-style practice for Lesson 6: multiple choice, short questions and a long case question with answer boxes, scoring points for self-marking, and bilingual model answers."
  zh: "第 6 课考试形式练习：选择题、简答题、长题案例，带作答框、得分点自评和双语参考答案。"
week: 6
date: 2026-10-09
unlisted: true
tags: [Practice, BIA, ALE, IncidentResponse, DisasterRecovery, CriticalInfrastructure]
---
# 练习题 L6 · 事件响应与应急规划

**复习页**：[L6 期末复习](../final-l6/)　**总览**：[期末总复习](../final-review/)

> **怎么用**：选择题直接点选；简答和长题先在框里**用英文写**，再点「查看参考答案」，按得分点勾选自评。写的内容保存在这个浏览器里。**计算题请带计算器。**  
> 分值参照 Assignment 1：选择题每题 2 分，简答每题 10 分，长题 20 分。

## Section A · Multiple Choice

**1. Which component of contingency planning provides the input for the IR, DR and BC plans?**

- A. Business impact analysis
- B. Digital forensics
- C. Crisis management plan
- D. Post-incident report

> **答案：A**
>
> *EN:* The BIA identifies the most critical functions and how long they can be down, which the other three plans depend on.
>
> BIA 是另外三份计划的输入。

**2. Which metric defines how much data loss, measured back from the incident to the last backup, the business can tolerate?**

- A. MTD
- B. RTO
- C. WRT
- D. RPO

> **答案：D**
>
> *EN:* The recovery point objective looks backwards and determines backup frequency.
>
> RPO 往回看，决定备份频率。

**3. An asset is worth $400,000, the exposure factor is 50%, and the event is expected once every 10 years. What is the ALE?**

- A. $4,000
- B. $20,000
- C. $40,000
- D. $200,000

> **答案：B**
>
> *EN:* SLE = 400,000 × 50% = 200,000; ARO = 0.1; ALE = 200,000 × 0.1 = **$20,000**.
>
> SLE = 20 万，ARO = 0.1，ALE = 2 万。

**4. According to the slides, who leads the contingency planning management team (CPMT)?**

- A. CIO
- B. CISO
- C. COO
- D. Legal counsel

> **答案：C**
>
> *EN:* The COO leads the CPMT; the CISO leads the IR team and legal counsel leads crisis management.
>
> CPMT 由 COO 领导；CISO 只领导 IR 团队。

**5. In the NIST incident handling checklist, reporting the incident to internal personnel and external organisations belongs to which phase?**

- A. Preparation
- B. Detection and analysis
- C. Containment, eradication and recovery
- D. Post-incident activity

> **答案：B**
>
> *EN:* Step 3, report the incident, is part of detection and analysis — not something left until afterwards.
>
> 通报在 Detection & Analysis 阶段，不是事后。

**6. Which contingency plan testing strategy has participants talk through a hypothetical scenario together, step by step?**

- A. Checklist
- B. Structured walk-through (tabletop)
- C. Simulation
- D. Full interruption

> **答案：B**
>
> *EN:* A tabletop exercise is a guided discussion of a scenario; a simulation has each person perform their steps without disrupting operations.
>
> 桌面推演 = 大家一起口头走一遍情景。

**7. An incident becomes a disaster when:**

- A. It involves ransomware
- B. It is reported to the police
- C. The organisation cannot contain it or cannot recover quickly
- D. It happens outside working hours

> **答案：C**
>
> *EN:* The distinction depends on scope and control, not on the type of attack.
>
> 看范围和能否控制，不看攻击类型。

**8. Under Hong Kong's Protection of Critical Infrastructures (Computer Systems) Ordinance, as stated in the slides, serious incidents must be reported within:**

- A. 2 hours
- B. 12 hours
- C. 24 hours
- D. 7 days

> **答案：B**
>
> *EN:* Serious incidents: within 12 hours; other incidents: within 24 hours per the slides (48 hours in the enacted ordinance).
>
> 严重事件 12 小时内。

## Section B · Short Questions

**\[Short Question · 10 marks] B1. A payment system has an MTD of 6 hours and an RPO of 30 minutes. The current plan restores the system in 4 hours (RTO), then needs 3 hours to re-enter and validate transactions (WRT). Backups run every 2 hours. (a) Does the plan meet the MTD and RPO? Show your working. (b) Recommend one change for each failure.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 停机 = RTO + WRT = 4 + 3 = 7 小时  
> ☐ \[2 分] 7 > 6 → MTD 不达标（只看 RTO 会误判）  
> ☐ \[2 分] 最坏数据丢失 = 备份间隔 2 小时 > 30 分钟 → RPO 不达标  
> ☐ \[2 分] MTD 对策：缩短 RTO / WRT（热备、自动化验证、BC 人工流程）  
> ☐ \[2 分] RPO 对策：至少每 30 分钟备份，或实时复制 / 日志传送
>
> **English**
>
> **(a)**
>
> - Downtime = RTO + WRT = 4 + 3 = **7 hours > 6-hour MTD** → **fails**. Looking at RTO alone (4 ≤ 6) would wrongly suggest it passes.
> - Worst-case data loss = backup interval = **2 hours > 30-minute RPO** → **fails**.
>
> **(b)**
>
> - **MTD**: shorten RTO or WRT — a hot standby / mirrored system, automated reconciliation, or a BC manual fallback that keeps payments running.
> - **RPO**: back up at least every 30 minutes, or use real-time replication / log shipping.
>
> **中文解析**
>
> 两条关系式：MTD ≥ RTO + WRT；最坏数据丢失 = 备份间隔，要 ≤ RPO。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B2. Distinguish incident reaction from incident recovery, giving at least TWO activities of each. Why does the slide include “restore … confidence” in recovery?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[3 分] Reaction（止血）：按 alert roster 通知、记录事件、遏制（断网、停账户、改防火墙规则、停服务 / 服务器）  
> ☐ \[3 分] Recovery（复原）：取证评估损害、修补漏洞、升级防护、评估监控能力、恢复数据服务流程、事后复盘  
> ☐ \[2 分] 两者区别：先控制住，再复原并改进  
> ☐ \[2 分] 信心：技术恢复后客户、员工、监管不一定信你，要靠沟通恢复（Colonial 抢购汽油）
>
> **English**
>
> - **Incident reaction** stops the bleeding: notify key personnel using the **alert roster**; **document** the incident; apply **containment** — “cut the wire”, disable compromised accounts, reconfigure firewall rules, disable compromised services or servers.
> - **Incident recovery** restores and improves: **damage assessment** using forensics; identify and fix vulnerabilities; install or upgrade safeguards; evaluate monitoring; restore data, services and processes; hold an **after-action review**.
> - **Confidence** is included because technical recovery is not enough: customers, staff and regulators may still distrust the organisation, so communication must rebuild trust — after Colonial restarted its pipeline, panic buying of fuel continued.
>
> **中文解析**
>
> 课件 p.25 左红右绿两栏。Recovery 里的 confidence 很容易被忽略，答出来是加分点。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B3. What are the two key purposes of digital forensics? Explain why evidence must be preserved before containment and eradication, and how most organisations obtain forensic capability.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 目的 1：调查不当行为的指控  
> ☐ \[2 分] 目的 2：根因分析  
> ☐ \[2 分] 内容：保全、识别、提取、记录、解读数字介质  
> ☐ \[2 分] 先保全证据：重装、清除会破坏证据，之后无法追查根因或用于法律程序（NIST 第 4 步排在遏制之前）  
> ☐ \[2 分] 多数组织：没有常设团队，自己收集数据、外包分析（如 Colonial 请 Mandiant）或外聘 / 培训
>
> **English**
>
> - Digital forensics determines **what happened and how**, through the **preservation, identification, extraction, documentation and interpretation** of digital media.
> - Two purposes: **investigating allegations of wrong conduct** and **performing root cause analysis**.
> - Evidence must be **preserved first** (NIST step 4 comes before containing and eradicating) because reimaging systems and removing malware destroy logs and artefacts; without them the organisation cannot find the root cause, prove what happened to regulators or courts, or show it did everything possible.
> - Most organisations **cannot sustain a permanent forensics team**, so they **collect data in-house and outsource the analysis**, hire externally or train staff — Colonial engaged Mandiant within about an hour.
>
> **中文解析**
>
> 答「为什么先保全证据」要说出：清除会毁证据 → 查不到根因、无法举证。KPMG 的缺口 4（数据保留不足）也是同一个道理。

## Section C · Long Question

> **📌 案例：MetroLink（虚构）**
>
> MetroLink 是香港一家铁路信号系统营运商（属于关键基础设施类别 1）。
>
> - **周五 22:00**：值班工程师发现几台工作站出现勒索信，信号调度系统的部分服务器被加密。
> - **周五 22:30**：IT 经理切断办公网络与信号系统的连接，列车改为人工调度、减班运行。
> - **周六 08:00**：公司才通知管理层；IT 团队开始重装服务器，没有先保留磁盘镜像和日志。
> - **周六 14:00**：发现另外 6 台服务器也被感染，重新开始清除。
> - **周日 20:00**：才向保安局专员通报。
> - **周二**：信号系统完全恢复；公司没有开检讨会，因为「已经恢复了」。
> - 备份每 24 小时一次，最近一次备份完好。

**\[Long Question · 20 marks] C1. (a) Map MetroLink's actions to the NIST incident response phases and evaluate what was done well and badly (8 marks). (b) Was this an incident or a disaster? Which contingency plans should have been activated? (4 marks) (c) Did MetroLink meet its obligations under the Critical Infrastructure Ordinance? (4 marks) (d) Recommend FOUR improvements (4 marks).**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] (a) Detection & analysis：发现快（值班工程师），但 10 小时后才通知管理层，通报延迟  
> ☐ \[2 分] (a) Containment：切断与信号系统的连接、人工调度 → 做得好（类似 Colonial 主动关停）  
> ☐ \[2 分] (a) Eradication：没先保全证据就重装 → 违反 NIST 第 4 步；发现新感染主机后回到检测分析（回路）  
> ☐ \[2 分] (a) Post-incident：没开 lessons learned 会，重大事件是必需的，计划没更新  
> ☐ \[2 分] (b) Disaster：核心信号系统受影响、多台服务器、无法快速恢复  
> ☐ \[2 分] (b) 同时启动 IR + DR（原址重建）+ BC（人工调度 = BC），危机管理团队负责对外沟通  
> ☐ \[2 分] (c) 严重事件应 12 小时内报告，实际约 46 小时 → 不合规  
> ☐ \[2 分] (c) 还要有 Security Management Unit、每年风险评估、两年审计  
> ☐ \[4 分] (d) 四条改进：IR 计划 + alert roster；证据保全流程 / 外包取证；通报流程符合 12 小时；必开检讨会；备份更频繁（RPO）；演练（tabletop / simulation）
>
> **English**
>
> **(a) NIST phases**
>
> - **Detection & analysis** — *good*: the duty engineer spotted the ransom notes quickly. *Bad*: management was told only ten hours later, and the regulator about 46 hours later; reporting belongs in this phase.
> - **Containment** — *good*: isolating the office network from the signalling system and switching to manual dispatch limited the spread, much like Colonial's proactive shutdown.
> - **Eradication & recovery** — *bad*: servers were reimaged **without preserving evidence** (NIST step 4 comes first), so the root cause may never be found. When six more infected servers appeared, the team correctly looped back to detection and analysis. Recovery from an intact backup was achieved by Tuesday.
> - **Post-incident** — *bad*: no lessons-learned meeting, which is **mandatory for major incidents**, so the plan was not improved.
>
> **(b) Incident or disaster?** A **disaster**: core signalling servers across the system were encrypted and the organisation could not recover quickly. **IR** (contain and eradicate), **DR** (rebuild the signalling systems at the primary site) and **BC** (manual train dispatch is a continuity arrangement) should all have been activated, with the crisis management team handling public communication.
>
> **(c) Ordinance**: as a Category 1 operator, MetroLink must report **serious incidents within 12 hours**. It reported after about **46 hours** → **non-compliant**. It is also required to have a Security Management Unit, annual risk assessments and biennial independent audits.
>
> **(d) Improvements**
>
> 1. A tested **IR plan** with an alert roster so management and the CSIRT are notified immediately.
> 2. An **evidence preservation** procedure (disk images, logs) and a retained external forensics provider.
> 3. A **reporting procedure** that meets the 12-hour requirement, with legal counsel responsible.
> 4. **Mandatory lessons-learned reviews**, more frequent backups to meet the RPO, and regular tabletop / simulation exercises.
>
> **中文解析**
>
> - **(a)** 按四个阶段逐一写「做得好 / 做得差」，最常考的两个坑都在本案：通报属于 D & A；保全证据排在清除之前。
> - **(b)** 用 incident vs disaster 的两个条件判断，再说三份计划怎么同时启动。人工调度本身就是 BC。
> - **(c)** 先算出时间差（周五 22:00 → 周日 20:00 ≈ 46 小时），再对照 12 小时的要求。
> - **(d)** 每条建议对应一个前面找到的问题。
