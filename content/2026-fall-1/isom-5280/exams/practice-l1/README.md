---
title:
  en: "Practice L1 · Trust, Threat Actors & CIA"
  zh: "练习题 L1 · 数字信任、威胁行为者与 CIA"
summary:
  en: "Exam-style practice for Lesson 1: multiple choice, short questions and a long case question with answer boxes, scoring points for self-marking, and bilingual model answers."
  zh: "第 1 课考试形式练习：选择题、简答题、长题案例，带作答框、得分点自评和双语参考答案。"
week: 1
date: 2026-10-09
tags: [Practice, CIA Triad, Threat Actors, CISO, Cyberport]
---
# 练习题 L1 · 数字信任、威胁行为者与 CIA

**复习页**：[L1 期末复习](../final-l1/)　**总览**：[期末总复习](../final-review/)

> **怎么用**：按考试的样子做——选择题直接点选；简答和长题先在框里**用英文写**，写完再点「查看参考答案」，按得分点勾选自评。写的内容会保存在这个浏览器里，刷新不会丢。  
> 题型和分值参照 Assignment 1：选择题每题 2 分，简答每题 10 分（有字数限制），长题 20 分。

## Section A · Multiple Choice

**1. In the Components of Information Security model, which element ties the three technical pillars together?**

- A. Confidentiality, Integrity and Availability
- B. Policy
- C. Network Security
- D. Firewall

> **答案：B**
>
> *EN:* The CIA triad is the foundation, the three pillars are computer / data / network security, and **policy** is the beam that unifies them under management and governance.
>
> 地基是 CIA，三根柱是三个技术领域，把三根柱绑在一起的横梁是 **Policy**。

**2. Which threat actor deliberately prefers to attract as little attention as possible?**

- A. Hacktivist
- B. Cyber terrorist
- C. Criminal syndicate
- D. Script kiddie

> **答案：C**
>
> *EN:* Criminal syndicates seek illegal financial gain and **want low attention**; hacktivists and cyber terrorists want visibility or fear.
>
> 犯罪集团为了钱，越低调越好赚；Hacktivist 和恐怖分子反而要被看见。

**3. An attacker secretly reads the CEO's emails for months without changing or deleting anything. Which security objective is violated?**

- A. Confidentiality
- B. Integrity
- C. Availability
- D. Nonrepudiation

> **答案：A**
>
> *EN:* Data was disclosed to an unauthorised person but not altered or made unavailable → **Confidentiality**.
>
> 只是「看了」，没有改、也没有让人打不开 → 机密性。

**4. Which of the following was NOT one of the failures the Privacy Commissioner identified in the 2023 Cyberport incident?**

- A. Lack of effective detection measures
- B. Failure to enable multi-factor authentication for remote access
- C. Unnecessary retention of personal data
- D. Failure to encrypt backup tapes

> **答案：D**
>
> *EN:* The five findings were weak detection, no MFA, insufficient audits, a non-specific security policy and unnecessary data retention — backup encryption was not among them.
>
> 五项缺失：检测、MFA、审计、政策、数据保留。没有「备份没加密」这一项。

**5. According to the Deloitte Global Future of Cyber Survey, which source of breaches grew the most between the 3rd and 4th editions?**

- A. Nation-states
- B. Hacktivists
- C. Unintended actions of well-meaning employees
- D. Organized crime

> **答案：C**
>
> *EN:* Unintended actions of well-meaning employees rose from 4% to 13% (more than tripled); nation-states, hacktivists and organised crime all fell.
>
> 善意员工的无意行为 4 → 13，涨了三倍多；其余三项都下降了。

**6. Which of the following is NOT one of the four key functions under the CISO shown in Lesson 1?**

- A. Security Operations Center team
- B. Security Engineering team
- C. Incident Response team
- D. Internal Audit team

> **答案：D**
>
> *EN:* The four functions are SOC, Security Engineering, Incident Response, and Policy & Compliance. Internal audit is independent of the CISO.
>
> 四个团队是 SOC、安全工程、事件响应、政策与合规。内部审计不在 CISO 之下（它要独立）。

**7. A script kiddie is best described as an attacker who:**

- A. Targets a specific company for espionage over many years
- B. Uses pre-built tools and searches for any vulnerable victim, with no specific target
- C. Attacks infrastructure to create fear
- D. Has legitimate access to the organisation's systems

> **答案：B**
>
> *EN:* Script kiddies rely on ready-made tools without deep knowledge and attack whoever is vulnerable — **no target**. A is a nation-state APT, C a cyber terrorist, D an insider.
>
> 脚本小子用现成工具、不挑目标。A 是国家级 APT，C 是网络恐怖分子，D 是内部人员。

**8. Which three-part framework does Lesson 1 use to describe the government's role in cybersecurity?**

- A. Identify, Protect, Respond
- B. Prevention, Detection, Recovery
- C. People, Process, Technology
- D. Plan, Do, Check, Act

> **答案：B**
>
> *EN:* The slide summarises the government's role (e.g. CSTCB) as **Prevention + Detection + Recovery**.
>
> 课件 p.32：政府角色 = 预防 + 检测 + 恢复。

## Section B · Short Questions

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B1. Using the four dimensions for classifying adversaries, compare a hacktivist with a nation-state actor. Then state which one is more likely to use an Advanced Persistent Threat (APT), and why.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Internal vs external：两者通常都是外部（external）  
> ☐ \[2 分] Sophistication：hacktivist 中低（defacement、DDoS），nation-state 很高（零日、APT）  
> ☐ \[2 分] Resources：hacktivist 有限，nation-state 有国家级预算  
> ☐ \[2 分] Motivation：hacktivist 为政治 / 理念、要被看见；nation-state 为间谍、政治扰乱、军事优势  
> ☐ \[2 分] APT 属于 nation-state，并说明原因（长期、隐蔽、需要资源）
>
> **English**
>
> | Dimension           | Hacktivist                                 | Nation-state actor                                  |
> | ------------------- | ------------------------------------------ | --------------------------------------------------- |
> | Internal / external | Usually external                           | External                                            |
> | Sophistication      | Low to medium — defacement, DDoS, leaks    | Very high — zero-days, custom malware               |
> | Resources           | Limited, volunteer-driven                  | State budgets and teams                             |
> | Motivation          | Political or ideological; wants visibility | Espionage, political disruption, military advantage |
>
> A **nation-state actor** is far more likely to use an APT: long-term, stealthy intrusion needs substantial resources and patience, and its goal is intelligence rather than publicity.
>
> **中文解析**
>
> 按四个维度逐项对比。关键区别在资源和动机：hacktivist 要的是「被看见」，所以手法是公开的篡改网页、DDoS；国家级行为者要的是情报，所以长期潜伏、不出声，这正是 APT 的特征。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B2. Third-party risk is a recurring theme in Lesson 1. Give THREE pieces of evidence from the lesson showing that third-party risk is rising, and suggest TWO ways an organisation can manage it.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 证据 1：Deloitte「trusted third parties」6% → 13%  
> ☐ \[2 分] 证据 2：医管局承包商 / Canvas 平台泄露案例  
> ☐ \[2 分] 证据 3：HKMA——AI、DLT、高性能计算高度依赖外部平台和第三方（或 CISO 报告 third-party risk 29%、Ensign 趋势 4、WEF 供应链相互依赖）  
> ☐ \[2 分] 对策 1（如：选择前做安全尽职调查 / 合同写入安全要求和通报时限）  
> ☐ \[2 分] 对策 2（如：最小权限访问 / 持续监控供应商 / 演练供应商失效情景）
>
> **English**
>
> Evidence:
>
> - Deloitte survey: breaches from **trusted third parties** rose from 6% to 13%.
> - A **Hospital Authority contractor** leaked 56,000+ patients' data, and the **Canvas** platform breach affected 72,571 students and staff in Hong Kong.
> - HKMA: AI, DLT and high-performance computing **depend heavily on external platforms and third parties**.
>
> Management:
>
> - **Due diligence and contracts** — assess vendors before onboarding; require security controls, audit rights and incident-notification deadlines.
> - **Least-privilege access and monitoring** — give vendors only the access they need and monitor their risk continuously.
>
> **中文解析**
>
> 证据可以从三类来源挑：调查数据（Deloitte、CISO 报告 29%）、真实案例（医管局、Canvas）、监管 / 行业报告（HKMA、Ensign、WEF）。对策按「签约前 → 合同 → 接入 → 持续监控 → 应急」任挑两个，每个说清楚做什么。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B3. Why must a CISO be both a business leader and a security expert? Explain why some organisations choose not to have the CISO report to the CIO.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] 安全专家：懂威胁和技术控制，能领导四个安全团队  
> ☐ \[2 分] 商业领导：把安全风险翻译成业务语言，参与战略决策，平衡 usability 和 control  
> ☐ \[2 分] CISO 职责中技术只是三分之一（Policy、Risk management、Technology）  
> ☐ \[2 分] 向 CIO 汇报的利益冲突：CIO 的 KPI 是交付，安全意见可能被压下  
> ☐ \[2 分] 改向 CEO / CRO / COO / CAO 汇报，以保持独立性和话语权
>
> **English**
>
> - As a **security expert**, the CISO must understand threats and controls and lead the SOC, engineering, incident response and compliance teams.
> - As a **business leader**, the CISO must translate cyber risk into business terms, take part in strategic decisions and balance usability against control — technology is only one of the CISO's three areas (policy, risk management, technology).
> - Reporting to the **CIO** can create a **conflict of interest**: the CIO is measured on delivering systems on time, so security concerns that delay a launch may be overridden.
> - Many regulated organisations therefore have the CISO report to the **CEO, CRO, COO or Chief Audit Officer** to keep security **independent** and visible at board level.
>
> **中文解析**
>
> 课件 p.48 的标题就是 *Business leader + Security expert*，小字写了其他汇报对象。答「为什么不向 CIO 汇报」一定要说出**利益冲突**和**独立性**这两个词。

## Section C · Long Question

> **📌 案例：MegaMart HK（虚构）**
>
> - **3 月 1 日**：攻击者在暗网买到一个**外包 IT 公司员工**的远程桌面账号。该账号有管理员权限，**没有 MFA**。
> - **3 月 1–12 日**：攻击者登录 MegaMart 网络，提权、浏览文件服务器，复制约 200 GB 客户和会员资料。安全团队没有发现异常。
> - **3 月 13 日**：门店收银和网上商店的系统被勒索软件加密，员工看到勒索信，要求 US$2M 比特币，否则公开数据。
> - **3 月 14 日**：公司关停所有系统，聘请外部取证公司。
> - **3 月 23 日**：才向私隐专员公署（PCPD）通报。
> - **4 月 2 日**：勒索团伙在泄露网站公开部分会员资料。调查发现，约 **35%** 受影响会员已经**超过 7 年**没有消费，资料本应删除。
> - **4 月 20 日**：系统全面恢复。公司董事会此前从未讨论过网络安全，安全由 IT 经理兼管。

**\[Long Question · 20 marks] C1. (a) Construct a timeline of the key events and identify the threat vector (4 marks). (b) Classify the adversary using the four dimensions, with rationale (4 marks). (c) Which elements of the CIA triad were affected? (3 marks) (d) Identify the control failures and classify them as technical or management controls (5 marks). (e) Recommend FOUR measures, linking each to a failure (4 marks).**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] (a) 时间线抓住关键事件：入侵 3/1 → 潜伏窃取 → 加密 3/13 → 关停 3/14 → 通报 3/23 → 公开 4/2 → 恢复 4/20  
> ☐ \[2 分] (a) 攻击路径：暗网购买的第三方远程账号、无 MFA；并指出潜伏 12 天未被发现  
> ☐ \[2 分] (b) 四个维度逐项分析  
> ☐ \[2 分] (b) 结论 Criminal syndicate（可能是 RaaS），排除 hacktivist / nation-state  
> ☐ \[3 分] (c) Confidentiality（资料外泄、公开）+ Availability（系统加密停摆），可提 Integrity  
> ☐ \[3 分] (d) 技术控制：无 MFA、无有效检测、第三方账号权限过大  
> ☐ \[2 分] (d) 管理控制：第三方风险管理缺失、数据保留过久、通报延迟、缺乏治理（无 CISO、董事会不讨论）  
> ☐ \[4 分] (e) 四条建议，每条对应一项缺失（MFA、检测、第三方管理 / 最小权限、数据保留政策、设 CISO / 董事会监督、IR 计划含通报时限）
>
> **English**
>
> **(a) Timeline and threat vector**
>
> | Date     | Event                                                                                             | Significance                                            |
> | -------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
> | 1 Mar    | Attacker logs in with a third-party IT contractor's remote-desktop account bought on the dark web | Entry point: **stolen third-party credentials, no MFA** |
> | 1–12 Mar | Privilege escalation, browsing, 200 GB copied                                                     | **12-day dwell time**, no detection                     |
> | 13 Mar   | Systems encrypted; US$2M ransom demand                                                            | Impact; discovered only through the ransom note         |
> | 14 Mar   | All systems shut down; forensic firm hired                                                        | Containment                                             |
> | 23 Mar   | PCPD notified                                                                                     | 10 days after discovery — slow                          |
> | 2 Apr    | Member data published                                                                             | **Double extortion**                                    |
> | 20 Apr   | Full recovery                                                                                     | About 5 weeks of disruption                             |
>
> **(b) Adversary**: external; medium-to-high sophistication (privilege escalation, exfiltration before encryption); organised and resourced, buying access on the dark web (an initial access broker); financially motivated → a **criminal syndicate**, likely a RaaS affiliate. Not a hacktivist (no political cause) or nation-state actor (money, not espionage).
>
> **(c) CIA**: **Confidentiality** — 200 GB of customer data stolen and published; **Availability** — POS and online store unavailable for weeks; integrity was also affected as data was encrypted.
>
> **(d) Control failures**
>
> - *Technical*: no MFA on remote access; no effective detection (12 days unnoticed); an over-privileged third-party admin account.
> - *Management*: no third-party risk management; personal data retained beyond need (35% of affected members); slow regulatory notification; no security governance — no CISO, cyber risk never on the board agenda.
>
> **(e) Recommendations**
>
> 1. Enforce **MFA** on all remote and privileged access → fixes the entry point.
> 2. Deploy **detection and centralised logging** (IDPS / EDR + SIEM) → shortens dwell time.
> 3. Manage **third parties** with due diligence, least-privilege access and contract security clauses → fixes the vendor gap.
> 4. Introduce a **data retention policy** and appoint a **CISO** reporting to the board, with an IR plan setting notification deadlines → fixes governance, exposure and slow reporting.
>
> **中文解析**
>
> - **(a)** 按 7 类事件抓时间线（入侵、潜伏、影响、发现、遏制、通报、恢复）。这题是**供应链入口**，所以要点出账号属于外包公司。分数主要在间隔分析：潜伏 12 天、发现后 10 天才通报。
> - **(b)** 先四个维度，再下结论，并排除其他类型。
> - **(d)** 照 Cyberport 的分法分成技术和管理两类。本案几乎每一项都能在 Cyberport 五项缺失里找到对应（检测、MFA、数据保留、政策 / 治理）。
> - **(e)** 每条建议都要写出它对应哪项缺失，不要只列清单。
