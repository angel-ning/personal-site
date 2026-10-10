---
title:
  en: "Practice L4 · Cryptography & PKI"
  zh: "练习题 L4 · 密码学与 PKI"
summary:
  en: "Exam-style practice for Lesson 4: multiple choice, short questions and a long case question with answer boxes, scoring points for self-marking, and bilingual model answers."
  zh: "第 4 课考试形式练习：选择题、简答题、长题案例，带作答框、得分点自评和双语参考答案。"
week: 4
date: 2026-10-09
tags: [Practice, Cryptography, PKI, DigitalSignature, TLS]
---
# 练习题 L4 · 密码学与 PKI

**复习页**：[L4 期末复习](../final-l4/)　**总览**：[期末总复习](../final-review/)

> **怎么用**：选择题直接点选；简答和长题先在框里**用英文写**，再点「查看参考答案」，按得分点勾选自评。写的内容保存在这个浏览器里。  
> 分值参照 Assignment 1：选择题每题 2 分，简答每题 10 分，长题 20 分。

## Section A · Multiple Choice

**1. Alice wants to send Bob a message that only Bob can read. Which key should she use to encrypt it?**

- A. Alice's private key
- B. Alice's public key
- C. Bob's public key
- D. Bob's private key

> **答案：C**
>
> *EN:* Encrypt with the **recipient's public key**; only the recipient's private key can decrypt it.
>
> 保密用「接收方的公钥」加密，只有接收方的私钥能解。

**2. How many secret keys are needed for 10 people to communicate pairwise using symmetric encryption?**

- A. 10
- B. 20
- C. 45
- D. 100

> **答案：C**
>
> *EN:* n(n − 1) / 2 = 10 × 9 / 2 = **45** — symmetric cryptography does not scale.
>
> n(n−1)/2 = 45。这正是对称加密「不可扩展」的原因。

**3. Which property of a hash function means a tiny change in the message produces a very different hash value?**

- A. One-way
- B. Deterministic
- C. Avalanche effect
- D. Nonrepudiation

> **答案：C**
>
> *EN:* A small change in data → a big change in the hash value (the avalanche effect), so any tampering is obvious.
>
> 数据小改动 → 哈希值大变化，所以篡改一眼就能看出来。

**4. A digital signature on its own provides which of the following?**

- A. Confidentiality only
- B. Integrity and authenticity of the sender
- C. Availability
- D. Proof that the public key belongs to the claimed person

> **答案：B**
>
> *EN:* A signature proves the message was signed with the sender's private key and not altered. Proving key ownership (D) needs a **digital certificate**.
>
> 签名提供完整性 + 真实性；证明公钥属于谁要靠证书。

**5. Which of the following is NOT typically contained in a digital certificate?**

- A. The subject's public key
- B. The CA's digital signature
- C. The validity period
- D. The subject's private key

> **答案：D**
>
> *EN:* The private key is never distributed; a certificate holds the public key, identity, the CA's signature and the validity period.
>
> 私钥永远不外传，证书里放的是公钥。

**6. In a TLS session, which kind of encryption protects the bulk of the web data after the handshake?**

- A. Asymmetric encryption with RSA
- B. Symmetric encryption with a session key
- C. Hashing only
- D. No encryption

> **答案：B**
>
> *EN:* Asymmetric cryptography is used in the handshake; the data itself is encrypted with a fast **symmetric session key** (e.g. AES).
>
> 握手用非对称，传输用对称会话密钥。

**7. Which security goal does a blockchain NOT provide for the transactions in a public ledger?**

- A. Integrity
- B. Data origin authentication
- C. Nonrepudiation
- D. Confidentiality

> **答案：D**
>
> *EN:* Every peer holds a full copy of the ledger, so transactions are visible — blockchain gives integrity, origin authentication and nonrepudiation, not confidentiality.
>
> 账本对所有节点公开，所以不提供机密性。

**8. Why does quantum computing threaten today's public-key encryption such as RSA?**

- A. Quantum computers cannot store keys
- B. A powerful quantum computer could break RSA in minutes rather than millions of years
- C. RSA uses qubits
- D. Quantum computers make hashing reversible for everyone today

> **答案：B**
>
> *EN:* Qubits in superposition perform many computations at once, potentially breaking RSA quickly — so organisations should plan post-quantum migration now.
>
> 量子计算机可能几分钟破解 RSA，所以现在就要规划 PQC 迁移。

## Section B · Short Questions

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B1. State the FOUR fundamental goals of cryptography and, for each, name the cryptographic tool from Lesson 4 that achieves it.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Confidentiality → 加密（对称 / 非对称）  
> ☐ \[3 分] Integrity → 哈希（message digest）/ 数字签名  
> ☐ \[3 分] Authentication → 数字签名 + 数字证书 / CA  
> ☐ \[2 分] Nonrepudiation → 数字签名（私钥只有发送方持有）
>
> **English**
>
> - **Confidentiality** — only authorised parties can read data → **encryption** (symmetric for bulk data, asymmetric for key exchange).
> - **Integrity** — data has not been altered → **hashing** (message digest), strengthened by **digital signatures**.
> - **Authentication** — the parties are who they claim to be → **digital signatures** plus **digital certificates** issued by a CA (PKI).
> - **Nonrepudiation** — a sender cannot later deny a transaction → **digital signatures**, because only the sender holds the private key.
>
> **中文解析**
>
> 课件 p.28 明确列了四个目标，第四个的例子是网购交易「事后不能否认」。每个目标配一个工具，答案就有结构了。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B2. Describe step by step how Bob verifies a digitally signed message from Alice that comes with her digital certificate.**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Alice：哈希消息得到摘要，用自己的私钥加密摘要 = 签名，连同消息和证书一起发  
> ☐ \[2 分] Bob 先验证证书：是否由受信任的 CA 签发、是否在有效期  
> ☐ \[2 分] 从证书取出 Alice 的公钥，解开签名得到原摘要  
> ☐ \[2 分] Bob 自己重算收到消息的哈希  
> ☐ \[2 分] 两个摘要一致 → 消息未被改且确实来自 Alice；不一致 → 拒绝
>
> **English**
>
> 1. Alice hashes the message to get a **digest** and encrypts the digest with **her private key** — this is the **digital signature**. She sends the message, signature and **certificate**.
> 2. Bob checks the **certificate**: it must be signed by a **trusted CA** and be within its **validity period**.
> 3. Bob takes **Alice's public key** from the certificate and decrypts the signature to recover the original digest.
> 4. Bob **hashes the received message** himself.
> 5. If the two digests **match**, the message is unaltered and came from Alice; if not, he rejects it.
>
> **中文解析**
>
> 顺序很重要：**先验证书，再验签名**。证书不可信的话，后面的数学验证再正确也没用（攻击者可以用自己的密钥对冒充）。

**\[Short Question · 10 marks · 每点 25 词内 / max 25 words per point] B3. Identify the risks, challenges and best practices in using cryptography described in Lesson 4. Why is key management more important than the choice of algorithm?**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] Risks：密钥被盗、内部威胁、算法过时（量子）  
> ☐ \[2 分] Challenges：安全与易用的平衡、系统集成  
> ☐ \[2 分] Best practices：强健的密钥管理、分层防御、定期审计、用户教育  
> ☐ \[4 分] 密钥比算法重要：强算法 + 被偷 / 管理不善的密钥 = 没用；攻击者通常偷钥匙而不是破解算法
>
> **English**
>
> - **Risks**: key theft, insider threats and cryptographic algorithm obsolescence (e.g. quantum computing).
> - **Challenges**: balancing security and usability, and system integration.
> - **Best practices**: strong key management, layered security, regular audits and user education.
> - **Why keys matter more**: encryption strength depends on both the algorithm and the key, and the slide stresses the **key is more important**. A strong, public algorithm like AES is useless if the key is stolen, too short or poorly managed — attackers steal keys rather than break algorithms.
>
> **中文解析**
>
> 课件 p.36「Encryption + Key determine the strength (Key more important)」，p.40 三行风险、挑战、最佳实践。

## Section C · Long Question

> **📌 案例：PayQuick（虚构）**
>
> PayQuick 是一家香港电子钱包公司，准备上线手机 App。技术团队目前的方案：
>
> - App 与服务器之间用 **HTTP** 通信，「因为 HTTPS 会拖慢速度」；
> - 用户密码用 MD5 直接哈希后存进数据库，没有加盐；
> - 转账指令没有任何签名，客服经常遇到客户声称「这笔不是我转的」；
> - 合作商户收到的付款通知由 PayQuick 用一把**所有商户共享的对称密钥**加密。

**\[Long Question · 20 marks] C1. (a) For each of the four design choices, explain the security weakness and which cryptographic goal it fails (8 marks). (b) Recommend a redesign using PKI and hybrid cryptography, explaining the role of each component (8 marks). (c) Explain to PayQuick's board the business value of PKI (4 marks).**

*（网页版此处有作答框：先自己写，再点开参考答案，按得分点自评）*

> **得分点 / Scoring points**
>
> ☐ \[2 分] (a) HTTP 明文 → 可被嗅探 / 中间人，失去机密性和完整性  
> ☐ \[2 分] (a) 不加盐的哈希 → 彩虹表可反查，密码保护失败（机密性）  
> ☐ \[2 分] (a) 转账无签名 → 无法证明是谁发的，失去不可抵赖 / 真实性  
> ☐ \[2 分] (a) 共享对称密钥 → 一家商户泄露全部失效、无法区分商户、不可扩展  
> ☐ \[2 分] (b) HTTPS / TLS：CA 证书验证服务器 + 非对称协商会话密钥 + 对称加密传输  
> ☐ \[2 分] (b) 密码改用加盐哈希（慢哈希）  
> ☐ \[2 分] (b) 每个用户 / 设备有密钥对，用私钥签转账（可用 passkey），服务器用公钥验证  
> ☐ \[2 分] (b) 每个商户用自己的证书 / 公钥，或单独的会话密钥  
> ☐ \[4 分] (c) 信任与身份验证、机密性与完整性、不可抵赖减少纠纷、可规模化、可吊销管理、合规（如 PCI DSS）
>
> **English**
>
> **(a) Weaknesses**
>
> 1. **HTTP** sends data in plain text → sniffing and man-in-the-middle attacks; fails **confidentiality and integrity**. TLS overhead is small because bulk data uses fast symmetric encryption.
> 2. **Unsalted MD5 hashes** → identical passwords share hashes and rainbow tables can reverse them; fails password **confidentiality**.
> 3. **Unsigned transfer instructions** → no proof of who sent them, so customers can deny transactions; fails **authentication and nonrepudiation**.
> 4. **One symmetric key shared by all merchants** → one leak exposes every merchant, merchants cannot be distinguished, keys are hard to rotate; fails **confidentiality and authentication** and does not scale.
>
> **(b) Redesign**
>
> - **HTTPS / TLS** for all app traffic: the server presents a **CA-signed certificate** (authentication), an **asymmetric** handshake (RSA / ECDH) negotiates a **session key**, and **symmetric AES** encrypts the data (speed), with hash-based integrity checks.
> - Store passwords as **salted, slow hashes**.
> - Give each customer device a **key pair** (e.g. passkeys): transfers are **signed with the private key** on the device and verified with the public key on the server → nonrepudiation.
> - Give each merchant its **own certificate / public key**, so notifications are encrypted or signed per merchant and keys can be **revoked** individually.
>
> **(c) Business value of PKI**  
> PKI lets PayQuick **establish trust at scale** with millions of customers and merchants it has never met: customers can verify they are talking to the real PayQuick, data stays confidential and intact, signed transfers **end “it wasn't me” disputes** (nonrepudiation), compromised keys can be revoked, and it supports regulatory expectations such as PCI DSS.
>
> **中文解析**
>
> - **(a)** 每个设计都说清两件事：弱点是什么，丢掉了四个目标中的哪一个。
> - **(b)** 按 Hybrid 的分工讲：证书负责身份，非对称负责交换密钥，对称负责传输，签名负责不可抵赖。
> - **(c)** 面向董事会，用业务语言讲：信任、减少纠纷、合规、可规模化。
