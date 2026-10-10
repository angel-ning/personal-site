---
title:
  en: "Practice L3 · Protection Tools & Zero Trust"
  zh: "练习题 L3 · 防护工具与 Zero Trust"
summary:
  en: "Exam-style practice for Lesson 3: multiple choice, short questions and a long case question with answer boxes, scoring points for self-marking, and bilingual model answers."
  zh: "第 3 课考试形式练习：选择题、简答题、长题案例，带作答框、得分点自评和双语参考答案。"
week: 3
date: 2026-10-09
tags: [Practice, ZeroTrust, Firewall, DMZ, IDPS, SIEM, SOC]
---
# 练习题 L3 · 防护工具与 Zero Trust

**复习页**：[L3 期末复习](../final-l3/)　**总览**：[期末总复习](../final-review/)

> **怎么用**：选择题直接点选；简答和长题先在框里**用英文写**，再点「查看参考答案」，按得分点勾选自评。写的内容保存在这个浏览器里。  
> 分值参照 Assignment 1：选择题每题 2 分，简答每题 10 分，长题 20 分。

## Section A · Multiple Choice

**1. A user logs in with a password and a security question. Why is this NOT true multi-factor authentication?**

- A. Security questions are too easy to guess
- B. Both factors are something you know
- C. Passwords should never be used
- D. It lacks a biometric factor, which is required for MFA

> **答案：B**
>
> *EN:* MFA requires factors from **different categories** (know / have / are). A password and a security question are both something you know. D is wrong: MFA does not specifically require biometrics.
>
> 两个都属于「你知道的」，同一类别不算 MFA。MFA 不一定要生物识别。

**2. In the access control approaches tree, where does Role-based access control sit?**

- A. Under Discretionary access control
- B. Under Nondiscretionary → Lattice-based, alongside Mandatory
- C. At the same level as Discretionary and Mandatory
- D. Under Mandatory access control

> **答案：B**
>
> *EN:* Nondiscretionary (controlled by the organisation) → Lattice-based → Mandatory and Role-based / Task-based. The tree must not be flattened.
>
> RBAC 和 MAC 都在 Nondiscretionary → Lattice-based 之下，不能拍平成三者并列。

**3. Which firewall type terminates the connection and re-creates it on the user's behalf, so no external packet directly enters the internal network?**

- A. Static packet filtering
- B. Stateful inspection
- C. Application layer proxy firewall
- D. MAC layer firewall

> **答案：C**
>
> *EN:* A proxy firewall splits the connection in two and works at layers 5–7, giving content-level filtering at the cost of speed.
>
> 代理防火墙把连接切成两段，外部的包到 proxy 就终止，工作在 L5–L7。

**4. In a VPN, the slide states that the CIA it must accomplish stands for:**

- A. Confidentiality, Integrity, Availability
- B. Confidentiality, Integrity, Authentication
- C. Control, Inspection, Audit
- D. Certificate, Identity, Access

> **答案：B**
>
> *EN:* For VPNs the “A” is **Authentication** (passwords, keys, digital signatures) — a VPN over the public internet cannot guarantee availability.
>
> VPN 那页的 A 是 Authentication，不是 Availability。

**5. An IDPS raises an alarm about a real event that is not a threat, such as a legitimate vulnerability scan by the IT team. This is:**

- A. False positive
- B. False negative
- C. Noise
- D. True negative

> **答案：C**
>
> *EN:* Noise is an alarm that is **accurate but non-threatening**. A false positive is an alert when no such event occurred at all.
>
> 真实发生但没有威胁 = Noise；False positive 是根本没有发生。

**6. Which IDPS detection method compares traffic against normal protocol profiles supplied by vendors, and is also called deep packet inspection?**

- A. Signature-based
- B. Anomaly-based
- C. Stateful protocol analysis
- D. Stateful packet inspection

> **答案：C**
>
> *EN:* Stateful protocol analysis (DPI) uses vendor protocol profiles. D is a firewall technique, not an IDPS detection method.
>
> SPA 的参照物是厂商提供的协议规范。D 是防火墙技术，名字像但不是同一回事。

**7. Which tool's core value is correlating logs from many devices to reveal an attack chain that no single device can see?**

- A. Honeypot
- B. SIEM
- C. Host-based firewall
- D. VPN

> **答案：B**
>
> *EN:* SIEM collects, normalises and **correlates** logs across the organisation.
>
> SIEM 的核心价值是关联分析。

**8. Which of the following is an organisation (people and processes), not a software platform?**

- A. SIEM
- B. XDR
- C. SOAR
- D. SOC

> **答案：D**
>
> *EN:* The Security Operations Centre is a team with processes that runs SIEM, XDR and SOAR.
>
> SOC 是组织，不是软件。

**9. Defence in depth is defined as multiple, \_\_\_\_\_\_\_\_ and overlapping security controls protecting critical assets.**

- A. expensive
- B. independent
- C. identical
- D. automated

> **答案：B**
>
> *EN:* Layers must be **independent** — different mechanisms — so one bypass does not defeat them all.
>
> 三个形容词：multiple、independent、overlapping。

**10. Which is the main purpose of a honeypot?**

- A. Block all inbound traffic
- B. Encrypt data at rest
- C. Divert attackers from critical systems and collect information about their activity
- D. Provide remote access for staff

> **答案：C**
>
> *EN:* Honeypots divert, collect information and delay attackers; any access to them is suspicious by definition.
>
> 蜜罐三目的：Divert、Collect、Delay。

## Section B · Short Questions

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B1. Distinguish authentication from authorization. Then explain the difference between role-based and task-based access control, and state which better supports least privilege.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Authentication = 验证你是谁（密码、MFA），先做  
> ☐ \[2 分] Authorization = 决定你能做什么（权限：if / when / from where / how），后做  
> ☐ \[2 分] RBAC：按岗位角色授权，较粗、较静态，好管理  
> ☐ \[2 分] TBAC：按当前任务授权，任务结束就收回，较细、动态  
> ☐ \[2 分] TBAC 更符合最小权限，因为权限不会长期堆积
>
> **English**
>
> - **Authentication** verifies **who you are** (passwords, tokens, biometrics, MFA); it comes first.
> - **Authorization** decides **what you may do** — the permissions a subject has on an object: if, when, from where and how it may be used.
> - **Role-based** access control grants permissions by job role; it is coarse and fairly static but easy to manage when staff move roles.
> - **Task-based** access control grants permissions for the task currently being performed and removes them when the task ends.
> - **Task-based** supports least privilege better, because permissions do not accumulate over time.
>
> **中文解析**
>
> 课件 p.9 右边特别用箭头标出 Role-based vs Task-based，说明这是考点。认证和授权是两个先后步骤，都属于 Access Control。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B2. Compare stateless (static) packet filtering with stateful inspection firewalls. Explain why a stateless firewall is vulnerable to spoofing.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Stateless：逐包独立、只看包头（IP / 端口 / 协议），静态规则，快  
> ☐ \[2 分] Stateful：用 state table 跟踪连接 + ruleset，查看内容，更安全  
> ☐ \[2 分] 代价：Stateful 要维护状态表，资源和性能开销更大  
> ☐ \[2 分] Stateless 分不清已有连接 / 新连接 / 野包（has no way of knowing）  
> ☐ \[2 分] 所以要永久开放高位端口给回包，攻击者伪造源地址就能进来
>
> **English**
>
> - A **stateless** firewall checks each packet **in isolation** against static rules on header fields (IP, port, protocol) — fast but context-blind.
> - A **stateful** firewall tracks connections in a **state table** plus a ruleset and examines packet content; return traffic is accepted only if it matches an existing entry — far more secure.
> - The cost is **extra processing and memory** to maintain the state table; under heavy load it can become a bottleneck.
> - A stateless firewall **has no way of knowing** whether a packet belongs to an existing connection, starts a new one or is a rogue packet.
> - To let replies in, it must **permanently open high ports** (above 1023), so an attacker who forges the source address and port can slip packets through.
>
> **中文解析**
>
> p.20 的讨论表四个维度：traffic filtering、context awareness、resources usage、performance impact。「易被 spoofing」要说到规则表第 1 条（永久开放高位端口）才算答到点上。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B3. Explain the difference between an IDS and an IPS. Why is a false positive more dangerous for an active IPS than for a passive IDS?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] IDS（passive）：分析、告警、等管理员处理，不干预流量，旁路部署  
> ☐ \[2 分] IPS（active）：自动响应，串接部署  
> ☐ \[2 分] IPS 的动作：断开会话、封锁来源、改防火墙规则、替换恶意内容  
> ☐ \[2 分] IDS 误报只是浪费分析师时间  
> ☐ \[2 分] IPS 误报会真的阻断正常业务（业务中断 = 影响 availability）
>
> **English**
>
> - An **IDS** (passive) analyses and **reports**, generating alarms; it does not interfere with traffic and waits for the administrator. It sits **out of band**.
> - An **IPS** (active) **automatically initiates responses** — terminating sessions, blocking the source, modifying firewall rules or replacing malicious content. It sits **inline**.
> - A false positive on an IDS only **wastes analyst time**.
> - A false positive on an IPS **blocks legitimate traffic or sessions**, disrupting the business and harming availability — the control itself causes the outage.
>
> **中文解析**
>
> IDS 和 IPS 常是同一套软件，区别在部署位置和是否允许它动手。误报对 IPS 更危险，是因为它会真的动手。

## Section C · Long Question

> **📌 案例：HarbourBank（虚构）**
>
> HarbourBank 是一家中型银行，现在的网络是：
>
> - 一台边界防火墙，规则最后一条是 Any / Any / Any / Any / **Allow**，前面列了一些要封的端口；
> - 网上银行服务器和内部的客户数据库在**同一个网段**；
> - 员工远程办公用 VPN，只要用户名和密码；
> - 没有 IDS，各台服务器的日志分别保存在本机，没人看；
> - 所有 IT 员工都有域管理员权限，方便处理问题。
>
> 董事会要求 CISO 提出改进方案，预算有限。

**\[Long Question · 20 marks] C1. (a) Identify FOUR weaknesses in HarbourBank's current design and the security principle each violates (8 marks). (b) Propose a redesigned architecture and set of controls, explaining how they apply Zero Trust and defence in depth (8 marks). (c) Under a limited budget, which TWO improvements would you prioritise first, and why? (4 marks)**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] (a) 最后一条 Allow → 违反 Fail-safe defaults（应默认拒绝）  
> ☐ \[2 分] (a) 网银服务器和数据库同一网段 → 没有 DMZ，违反 defense in depth  
> ☐ \[2 分] (a) VPN 只有密码 → 没有 MFA，违反 never trust, always verify  
> ☐ \[2 分] (a) 人人都是域管理员 / 没有检测和集中日志 → 违反 least privilege / assume breach  
> ☐ \[2 分] (b) Screened subnet（DMZ）：网银放 DMZ，内外两道路由器 / 防火墙，规则默认拒绝  
> ☐ \[2 分] (b) MFA + RBAC / PAM，管理员权限按需、可审计  
> ☐ \[2 分] (b) IDPS / EDR + SIEM 集中日志与关联分析；SOC 或外包 SOC 响应  
> ☐ \[2 分] (b) 点名 Zero Trust 三原则和 defense in depth（多重、独立、重叠）  
> ☐ \[4 分] (c) 两项优先（如 VPN 加 MFA + 规则改默认拒绝 / 收回管理员权限），理由：成本低、直接挡住最常见攻击（63% 入侵来自凭证）
>
> **English**
>
> **(a) Weaknesses**
>
> 1. Last rule **Any-Any-Allow** — the firewall is default-allow and relies on a blacklist → violates **fail-safe defaults**.
> 2. Online banking server and customer database on the **same segment** — no DMZ; compromising the public server exposes the data → violates **defence in depth**.
> 3. **VPN with password only** — stolen credentials give full remote access → violates **never trust, always verify** (no MFA).
> 4. **All IT staff are domain admins** and there is **no IDS or central logging** → violates **least privilege** and **assume breach**: an attacker could move laterally unnoticed.
>
> **(b) Redesign**
>
> - **Screened subnet architecture**: move the online-banking servers into a **DMZ** between an external and an internal filtering router / firewall; the internet can reach only the DMZ, and the DMZ reaches the database only through specific, proxied rules.
> - Rewrite firewall rules as an allow-list ending in **default deny**, kept **simple and auditable**.
> - **MFA** on the VPN and all privileged access; **RBAC** with **PAM** so admin rights are granted just in time and recorded.
> - **NIDS / HIDS or EDR** with logs sent to a **SIEM** for correlation; a SOC (or SOC-as-a-Service) responds using playbooks.
> - This applies **Zero Trust** (verify every access, least privilege, assume breach) and **defence in depth** — multiple, independent, overlapping layers.
>
> **(c) Priorities**
>
> 1. **MFA on the VPN** — cheap and blocks the most common entry route (63% of intrusions use compromised credentials).
> 2. **Default-deny firewall rules and removing standing domain-admin rights** — low cost, sharply reduces exposure and lateral movement.  
>    (Then the DMZ and SIEM as budget allows.)
>
> **中文解析**
>
> - **(a)** 每个弱点都要配一条原则，原则从 p.60 四条策略和 Zero Trust 三原则里找，这是 L3 的核心。
> - **(b)** 用 Screened subnet 的结构 + 课件的工具，最后一定要点名 Zero Trust 和 defence in depth。
> - **(c)** 预算有限时，先做便宜但效果大的（MFA、默认拒绝、最小权限），再做贵的（SIEM、SOAR）。
