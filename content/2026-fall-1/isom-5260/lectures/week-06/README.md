---
title:
  en: "Week 6 · Transactions & Crash Recovery"
  zh: "第 6 周 · 事务与崩溃恢复"
summary:
  en: "Transactions as a single unit of work and the COMMIT / ROLLBACK contract, the DBMS's read/write view of a transaction, ACID, why recovery needs REDO and UNDO (dirty pages in the buffer pool), logging and the write-ahead logging (WAL) protocol with LSN / pageLSN, REDO and UNDO during crash recovery with compensation log records (CLRs), aborts, checkpoints and the four types of recovery — organised around how each idea is asked in multiple-choice questions, with practice MCQs after every section."
  zh: "事务是一个工作单元、COMMIT / ROLLBACK 的约定，DBMS 眼里的事务（读和写），ACID，恢复为什么需要 REDO 和 UNDO（buffer pool 里的 dirty page），日志与 WAL 协议（LSN / pageLSN），崩溃恢复中的 REDO 与 UNDO（补偿日志 CLR）、正常 abort、checkpoint，以及四种 recovery——全部按选择题的考法整理，每节后面都有 MCQ 练习。"
week: 6
date: 2026-10-10
tags: [Transaction, ACID, WAL, Crash Recovery, REDO, UNDO, Checkpoint, MCQ]
---
# ISOM 5260 Fundamentals of Database Management — Week 6 复习笔记

**主题：事务（transaction）是一个工作单元 · COMMIT / ROLLBACK · ACID · 恢复为什么需要 REDO 和 UNDO · Logging 与 WAL 协议 · LSN / pageLSN · 崩溃恢复：REDO → UNDO（CLR）· 正常 ABORT · Checkpoint · 四种 recovery**

> 优先级标注说明（按考试重要性）：  
> 🔴 **必考核心** — 规则要能直接拿来判断选项  
> 🟡 **需要理解** — 能认出概念、排除干扰项  
> 🟢 **了解即可** — 背景知识
>
> **依据**：课件最后两页（p.34–35）给了期末的形式——这节课没有大题，**只会出现在 10 道 MCQ 里**（每题 1 分，范围是第 4 周到这节课）。所以这份笔记按「MCQ 怎么考」来整理：每一节 = **判断规则** + **常见题干** + **干扰项陷阱** + **随堂练习**，最后是一套综合模拟题。课件用了 13 页（p.16–28）一步步画日志和页面的变化，这部分最容易出「给一段日志，问结果」的题，标 🔴。

> **🎯 期末考试信息（p.34–35）**
>
> | 项目 | 内容                                                                                 |
> | -- | ---------------------------------------------------------------------------------- |
> | 时间 | **2026-10-17（周六）9:30–11:30**，2 小时                                                  |
> | 地点 | Rm 4504（Lift 25–26），Academic Building                                              |
> | 形式 | **Closed-book**；只带笔 / 铅笔 / 橡皮；手机和智能手表关机放包里，包放在教室前面；按指定座位坐；**中途不能去洗手间**             |
> | 范围 | 第 4 周到这节课（课件写的是 week 4 through week 7）                                             |
> | 题型 | **10 道 MCQ（10 分）** · 1 道 normalization（20 分）· 1 道 ER / EER 转关系表（30 分）· SQL 题（40 分） |
>
> 后三类大题对应 [第 4 周](../week-04/)（规范化、ER → 关系）和 [第 5 周](../week-05/)（SQL）。这节课的事务与恢复只会以选择题出现，规则很固定，把下面每节的「判断规则」记住就能拿分。

> **📌 课件编号**
>
> 文件名是 *Lecture 6 Transactions & Crash Recovery*，封面写的是 **Lecture 7**（按上课周数算）。考试范围「week 4 through week 7」里的 week 7 指的就是这节课。网站上沿用文件编号，放在第 6 周。

> **🧠 做这类 MCQ 的三步**
>
> 1. **认出题目考的是哪条规则**：题干出现 *commit acknowledged / survive a crash* → Durability、WAL 规则 2；*partially executed / all or none* → Atomicity；*pageLSN* → REDO 的比较规则；*CLR / NextLSN* → UNDO；*checkpoint* → 忽略 / REDO / UNDO 三分法。
> 2. **套规则**：每一节都有一个「判断规则」或「MCQ 怎么考」框。
> 3. **排干扰项**：本课最常见的干扰项，是把**「事务提交了」**和**「数据页写回磁盘了」**当成同一件事（文末有完整的陷阱清单）。

---

## 0. 核心地图（先建立整体框架）

```
一次用户操作（下单 / 转账）→ 多条 SQL
   → 打包成一个 transaction：BEGIN … COMMIT（成功）/ ROLLBACK（失败，整体撤销）
   → DBMS 只看到「读 / 写了哪些对象」；结局只有 commit / abort，崩溃时没结束的 = abort
   → 要满足 ACID（这节课的机制负责 A 和 D）
   → 难点：更新先发生在内存（buffer pool → dirty page），提交 ≠ 数据页写回磁盘
        ├ 已提交，页面还在内存 → 崩溃就丢 → 需要 REDO（保 Durability）
        └ 未提交，页面已写回盘 → 崩溃后还在 → 需要 UNDO（保 Atomicity）
   → 平时的准备：Logging + WAL
        ① 日志先于对应的数据页上盘   ② <COMMIT> 及之前的日志都上盘，才能确认提交
        LSN（日志编号）· pageLSN（最近一次改这个页面的日志编号）
   → 崩溃后：找到最近的 checkpoint
        → REDO 向前扫（pageLSN < LSN 才重做）
        → UNDO 向后撤（先写 CLR、再改回旧值；NextLSN 指向下一条；撤到 BEGIN 写 TXN-END）
   → 正常 ABORT：先写 <ABORT>，再走同样的 UNDO
   → Checkpoint：限制要重放多少日志；太频繁拖慢运行，太稀疏拖慢恢复
   → 四种 recovery：transaction / crash / media / disaster
```

**一句话**：COMMIT 只保证**日志**已经上盘，不保证**数据页**已经上盘；所以恢复 = 用日志 **REDO** 已提交、但可能还没写回的改动，**UNDO** 没提交、但可能已经写回的改动。

---

## 1. 🟢 DBMS 上的应用与三层架构（p.2–3）

p.2：几乎所有需要「记住状态」的服务（ChatGPT、WhatsApp、Uber、Amazon、Netflix……）都是跑在某种 DBMS 之上的应用。

![A 3-tier Client/Server Architecture](images/page_03.png)

*A 3-tier Client/Server Architecture（Slide 3）*

| 层（Tier）                    | 课件里画了什么                                                                                                                                   | 中文 / 小白解释                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Client tier**            | Browser；平板上写着 No local database                                                                                                           | 用户手里的设备，只负责显示和输入                                 |
| **Application / Web tier** | Application/Web server：A/P、A/R、order processing、inventory control；access and connectivity to DBMS；dynamic Web pages；management of session | 业务逻辑在这一层：把用户的点击变成 SQL（下一节的 `on_tap_buy()` 就跑在这里） |
| **Enterprise tier**        | Enterprise server **with DBMS**：transaction databases containing all organizational data                                                  | 真正存数据、执行事务的地方                                    |

> **💡 小白理解**
>
> 这两页在交代「事务从哪来」：用户在 client 点一下 → application tier 发出好几条 SQL → enterprise tier 的 DBMS 要保证这几条 SQL 作为一个整体成功或失败。

### 随堂练习

**Q1.1 In the 3-tier client/server architecture on slide 3, where does the DBMS that holds the organization's transaction databases run?**

- A. Client tier
- B. Application/Web tier
- C. Enterprise tier
- D. In each user's browser

> **答案：C**
>
> Enterprise tier = enterprise server with DBMS。Application/Web tier 负责业务逻辑和连接 DBMS；client tier 只有浏览器（平板上甚至写明 no local database）。

---

## 2. 🔴 事务：一个工作单元（Transaction，p.4–7、p.10）

### 2.1 一次点击 = 好几条 SQL（p.4–5）

![on\_tap\_buy()：一次「购买」产生三条 SQL，全部成功就 commit，出错就 rollback](images/page_04.png)

*on\_tap\_buy()：一次「购买」产生三条 SQL，全部成功就 commit，出错就 rollback（Slide 4）*

用户点「购买」，应用程序依次执行：

1. `UPDATE Products SET stock = stock - ? …`（扣库存）
2. `UPDATE Accounts SET balance = balance - ? …`（扣余额）
3. `INSERT INTO Orders …`（建订单）

全部成功 → `conn.commit()`；任何一条出错 → `conn.rollback()`。

p.5 的重点一句：出错时要回滚**整个事务**，**不是只回滚失败的那几条**（roll back the entire transaction — not just ones that failed）。

### 2.2 事务 = 要么全做、要么全不做（p.6、p.10）

![A Transaction: A Single Unit of Work——schema 里的 CHECK 约束可能让某条语句失败](images/page_06.png)

*A Transaction: A Single Unit of Work——schema 里的 CHECK 约束可能让某条语句失败（Slide 6）*

| 课件原文                                                                                                                                 | 中文 / 小白解释                                 |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| These SQL statements should run together as a **single unit of work**                                                                | 这几条 SQL 是一个整体                             |
| Either all of them take effect, or none of them do                                                                                   | 要么全部生效，要么一条都不生效                           |
| If an operation fails, stop and inform the caller. **The caller issues ROLLBACK.**                                                   | 某条语句失败时，DBMS 停下来告诉调用者，由**调用者发出 ROLLBACK** |
| A sequence of multiple actions which reflects a **single real-world transition**, and should be executed **as an atomic unit**（p.10） | 一次现实世界的状态变化（转账、一张包含多件商品的订单）对应一个事务         |
| Multiple SQL statements are grouped together as a transaction!（p.10）                                                                 | 用 `BEGIN; … COMMIT;` 把多条 SQL 包起来          |

p.6 的 schema 里有 `stock INTEGER NOT NULL CHECK (stock >= 0)` 和 `balance DECIMAL(12, 2) NOT NULL CHECK (balance >= 0)`——就是第 5 周学的 CHECK 约束。余额不够时，第二条 UPDATE 会因为违反 CHECK 而失败，第一条已经扣掉的库存也必须一起撤销。

### 2.3 COMMIT 与 ROLLBACK：和数据库的约定（p.7）

![Commit & Rollback: Contracts with the Database](images/page_07.png)

*Commit & Rollback: Contracts with the Database（Slide 7）*

| 应用收到的回复                                 | 课件原文                                                                                             | 意味着什么                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------- |
| **Successful commit acknowledgment**    | The transaction's changes are committed and **durable (and will survive a subsequent crash)**    | 收到「提交成功」之后，就算服务器马上崩溃，改动也还在  |
| **Successful rollback acknowledgement** | **None** of the transaction's changes remain — **even if some statements had already succeeded** | 回滚成功后，一条改动都不剩，包括之前已经执行成功的语句 |

> **📌 和第 5 周的联系**
>
> 第 5 周的四类命令里，`COMMIT` / `ROLLBACK` 属于 **TCL（Transaction Control Language）**。这节课讲的是它们背后的约定，以及 DBMS 怎么兑现这个约定（日志 + 恢复）。

> **🎯 MCQ 怎么考**
>
> - 「Which best describes a transaction?」→ 多个动作组成、反映**一次现实世界的状态变化**、作为**原子单位**执行
> - 「第二条语句失败、调用 rollback 之后，数据库里还剩什么？」→ **什么都不剩**，第一条也被撤销
> - 「收到 commit acknowledgment 意味着？」→ 已提交且 **durable，能扛过之后的崩溃**

> **⚠️ 干扰项陷阱**
>
> - ✗「ROLLBACK 只撤销失败的那条语句」→ 撤销整个事务
> - ✗「commit acknowledgment 表示所有数据页都已写回磁盘」→ 只保证 durable，数据页可能还在内存（见 6.4 节 p.23）
> - ✗「语句失败后 DBMS 会跳过它、把其余语句提交」→ 停下来通知调用者，由调用者 ROLLBACK

### 随堂练习

**Q2.1 Which best describes a transaction?**

- A. A single SQL statement that modifies data
- B. A sequence of actions that reflects one real-world transition and is executed as an atomic unit
- C. Any SELECT query that reads more than one table
- D. A backup copy of the database taken at one point in time

> **答案：B**
>
> p.10 的定义。A 是常见误解：一个事务可以有很多条 SQL（p.4 的购买就有三条），原子性说的是这一整组。

**Q2.2 In on\_tap\_buy(), the stock UPDATE succeeds, the balance UPDATE violates CHECK (balance >= 0), and the code calls conn.rollback(). What remains in the database from this purchase?**

- A. The stock reduction only
- B. The stock reduction and the new order row
- C. Nothing — the stock reduction is undone as well
- D. A negative balance, but no order row

> **答案：C**
>
> p.5、p.7：回滚整个事务，包括已经成功的第一条。D 也不对：违反 CHECK 的那条语句本身就不会生效，余额不会变成负数。

**Q2.3 The application receives a successful commit acknowledgment. Which statement is guaranteed?**

- A. All modified data pages have already been written to the database file
- B. The changes can still be undone by calling rollback()
- C. The changes are visible only to the current user
- D. The changes are committed and durable — they will survive a subsequent crash

> **答案：D**
>
> p.7 原话。A 是本课最大的陷阱：提交时数据页可以还在内存（p.23），durable 靠的是日志已经上盘。B：提交之后再 rollback 撤不掉。

**Q2.4 According to slide 6, what should happen when one statement inside BEGIN … COMMIT fails?**

- A. The DBMS stops and informs the caller; the caller issues ROLLBACK
- B. The DBMS skips the failed statement and commits the rest
- C. The DBMS keeps retrying the statement until it succeeds
- D. The caller re-runs only the failed statement and then commits

> **答案：A**
>
> p.6 左边的大括号：If an operation fails, stop and inform the caller. The caller issues ROLLBACK.

---

## 3. 🟡 DBMS 眼里的事务与事务的结局（p.8、p.11–12）

### 3.1 事务既是概念，也是一套实现（p.8）

| 课件原文                                                                                    | 中文                      |
| --------------------------------------------------------------------------------------- | ----------------------- |
| Major component of database management systems                                          | DBMS 的核心组成部分            |
| Both **a concept** for allowing users to specify correct behavior                       | 一个**概念**：让用户说明「怎样才算正确」  |
| And **a set of implementations** for allowing a system to achieve that correct behavior | 一套**实现**：让系统真的做到        |
| in the face of **concurrency and failure**                                              | 在**并发**和**故障**面前也要做到    |
| Critical for most applications; arguably more so than SQL                               | 对大多数应用来说，可以说比 SQL 本身还重要 |

### 3.2 DBMS 只看得到读和写（p.11）

![The DBMS's Abstract View of Transactions——第 3、6 步不会被 transaction manager 看到](images/page_11.png)

*The DBMS's Abstract View of Transactions——第 3、6 步不会被 transaction manager 看到（Slide 11）*

- **Transaction manager** 控制事务的执行；它眼里的事务（txn）是：
  - **a sequence of reads and writes of database objects**（对数据库对象的一串读和写）
  - **batch of work that must commit or abort as an atomic unit**（必须整体 commit 或 abort 的一批工作）
- **Program logic is invisible to DBMS!** 从数据库读出来的数据可以拿去做任意计算，但 DBMS 只看到从数据库读出、写回数据库的数据。

转账的 8 步里，`3. A = A − 100` 和 `6. B = B + 100` 是程序里的计算，**DBMS 看不到**；它只看到 `Read(A)`、`Write(A)`、`Read(B)`、`Write(B)` 以及 `BEGIN` / `COMMIT`。

### 3.3 事务的两种结局，以及崩溃怎么算（p.12）

![Transaction Outcomes & Crash Handling](images/page_12.png)

*Transaction Outcomes & Crash Handling（Slide 12）*

| 情况               | 结局                                | 恢复后              |
| ---------------- | --------------------------------- | ---------------- |
| 做完所有动作后提交（T1、T3） | **Commit**                        | 效果必须 **durable** |
| 做了一部分之后中止（T2）    | **Abort**                         | 效果**不能留下**       |
| 崩溃时还在运行（T4）      | **recovery treats it as aborted** | 效果**不能留下**       |

> **🎯 MCQ 怎么考**
>
> - 「哪几步 DBMS 看不到？」→ 程序里的**计算**（A = A − 100），不是 Read / Write
> - 「崩溃时正在跑的事务，恢复后怎样？」→ **当作 aborted**；不会接着执行，也不会被当作提交
> - p.12 的图：哪些要 durable → **T1、T3**；哪些不能留 → **T2、T4**

### 3.4 🟢 插曲：数据库领域的图灵奖（p.9）

| 年份   | 得主                  | 贡献                                         |
| ---- | ------------------- | ------------------------------------------ |
| 1973 | Charles Bachman     | 开发 Integrated Data Store（IDS），奠定现代数据库管理的框架 |
| 1981 | Edgar Codd          | 提出**关系模型**（第 1 周的关系、第 4 周的关系表都来自他）         |
| 1998 | **Jim Gray**        | **Transaction processing（事务处理）**——这节课的主题   |
| 2014 | Michael Stonebraker | 开发并商业化关系数据库系统                              |

### 随堂练习

**Q3.1 In the transfer on slide 11 (BEGIN, Read(A), A = A − 100, Write(A), Read(B), B = B + 100, Write(B), COMMIT), which steps are NOT seen by the DBMS transaction manager?**

- A. Read(A) and Read(B)
- B. Write(A) and Write(B)
- C. A = A − 100 and B = B + 100
- D. BEGIN and COMMIT

> **答案：C**
>
> Program logic is invisible to DBMS：DBMS 只看到读写数据库对象，以及事务的开始和提交（p.11 粉色箭头指的就是第 3、6 步）。

**Q3.2 The system crashes while T4 is still running — it has neither committed nor aborted. How does recovery treat T4?**

- A. As aborted: its effects must not remain
- B. As committed, because some of its writes already reached disk
- C. It is resumed from the step where it stopped
- D. It is ignored: whatever reached disk stays

> **答案：A**
>
> p.12：If system crashes while a txn is in progress, recovery treats it as aborted. B、D 正是 UNDO 要防止的情况：写到盘上的半截改动必须撤掉。

**Q3.3 On slide 12, T1 and T3 committed, T2 aborted, and T4 was running at the crash. Whose effects must be durable after recovery?**

- A. T1 only
- B. T1 and T3
- C. T1, T3 and T4
- D. All four transactions

> **答案：B**
>
> The effects of T1 & T3 should be durable. The effects of T2 & T4 must not remain.

**Q3.4 Which Turing Award winner on slide 9 is recognised for transaction processing?**

- A. Charles Bachman
- B. Edgar Codd
- C. Michael Stonebraker
- D. Jim Gray

> **答案：D**
>
> Jim Gray（1998）。Bachman = IDS，Codd = 关系模型，Stonebraker = 开发并商业化关系数据库系统。

---

## 4. 🔴 ACID（p.13–14）

![High-level Properties of Transactions: ACID](images/page_13.png)

*High-level Properties of Transactions: ACID（Slide 13）*

| 字母                  | 课件原文                                                                               | 中文 / 小白解释                                         | 这门课里靠什么保证                       |
| ------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------- |
| **A**tomicity 原子性   | All actions in the txn happen, or none happen                                      | 全做或全不做，不能停在一半                                     | **UNDO**（用日志里的 before value 撤销） |
| **C**onsistency 一致性 | If each txn is consistent and the DB starts consistent, then it ends up consistent | 起点一致 + 每个事务本身正确 → 终点一致（例如 CHECK 约束成立、A + B 的总额不变） | 完整性约束 + 事务逻辑本身正确                |
| **I**solation 隔离性   | Execution of one txn is isolated from that of other txns                           | 多个事务同时跑，互不干扰，看不到别人的中间状态                           | 并发控制（这节课没有展开）                   |
| **D**urability 持久性  | If a txn commits, its effects persist (i.e., durable on disk)                      | 提交了就不会丢，崩溃也不会                                     | **WAL + REDO**                  |

![Atomicity & Durability：转账在第 4 步之后、第 7 步之前失败，钱就「丢」了](images/page_14.png)

*Atomicity & Durability：转账在第 4 步之后、第 7 步之前失败，钱就「丢」了（Slide 14）*

p.14 用转账讲 A 和 D：

- **Atomicity**：如果事务在第 4 步（`Write(A)`）之后、第 7 步（`Write(B)`）之前失败，A 的 100 元已经扣了、B 还没加——钱「丢了」。DBMS 必须保证部分执行的事务的更新不被反映出来，也就是要 **rollback the changes**。
- **Durability**：用户一旦听到事务完成，就可以放心——这 100 元确实从 A 转到了 B，之后的任何故障都不会改变这一点。

> **💡 小白类比**
>
> - **A** = 网购下单：扣钱和生成订单要么都发生，要么都不发生
> - **C** = 记账规则：任何时候账都要平
> - **I** = 柜台办业务：每个人办的时候都像柜台只为他一个人服务
> - **D** = 收据：拿到收据之后，银行系统重启也不会把这笔账弄丢

> **⚠️ 干扰项陷阱**
>
> - Isolation 讲的是**并发**（多个事务同时跑），不是故障；故障之后「不丢」是 Durability，「不留半截」是 Atomicity
> - Atomicity 不等于「只有一条 SQL」。一个事务可以有很多条 SQL，原子性说的是这一整组
> - **REDO ↔ Durability，UNDO ↔ Atomicity**，这一对最容易被故意配反（p.16–17）

*（网页版此处是点选练习：这对应 ACID 的哪一条？（Slide 13–14）；下表是全部题目和答案）*

| 情景                                                                          | 答案              | 理由                                                                      |
| --------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| 转账做到一半（A 已经扣钱、B 还没加钱）系统崩溃，重启后 A 的扣款必须被撤销                                    | **Atomicity**   | 部分执行的事务不能留下痕迹：all or nothing（p.14：fails after step 4 and before step 7） |
| 用户已经收到「转账成功」，随后服务器断电；重启后这笔转账仍然在                                             | **Durability**  | 已提交事务的效果必须扛过故障（p.14：rest easy that the $100 were transferred）           |
| p.6 的下单：扣库存、扣余额、插订单三条语句，要么全部生效，要么全部不生效                                      | **Atomicity**   | Either all of them take effect, or none of them do —— 这就是 atomicity 的定义 |
| Successful rollback acknowledgement：哪怕有几条语句已经执行成功，事务的改动也一条都不留               | **Atomicity**   | 回滚是整个事务回滚，不是只撤失败的那条（p.5、p.7）                                            |
| Successful commit acknowledgment：事务的改动已提交，并且能扛过之后的崩溃                        | **Durability**  | p.7：committed and durable (and will survive a subsequent crash)         |
| 两个人同时操作同一个账户，每个事务执行时都像数据库里只有它自己一样                                           | **Isolation**   | 一个事务的执行与其他事务隔离开（p.13）。这节课只给了定义，靠并发控制实现                                  |
| 一个事务执行到一半时，其他事务看不到它的中间结果（比如 A 已扣、B 未加的那一刻）                                  | **Isolation**   | 看不到别人未完成的中间状态 = 隔离                                                      |
| 每个事务本身逻辑正确、数据库起点一致，那么执行完之后数据库仍然一致（例如 A + B 的总额不变、CHECK (balance >= 0) 不被违反） | **Consistency** | p.13 的 consistency 定义：consistent in → consistent out                    |
| 崩溃恢复需要 REDO，是为了满足哪一条？                                                       | **Durability**  | 已提交但页面还在内存就崩溃了，要靠 REDO 把改动补回来（p.16：Required by durability）              |
| 崩溃恢复需要 UNDO，是为了满足哪一条？                                                       | **Atomicity**   | 未提交的页面可能已经被写回磁盘，要靠 UNDO 撤掉（p.17：Required by atomicity）                  |

### 随堂练习

**Q4.1 A transfer debits account A, then the system crashes before account B is credited. After recovery, A shows its original balance. Which property does this demonstrate?**

- A. Consistency
- B. Atomicity
- C. Isolation
- D. Durability

> **答案：B**
>
> 部分执行的事务被撤销 = all or none，就是 p.14 第 4 步之后、第 7 步之前失败的例子。

**Q4.2 Which pairing of ACID property and recovery action is correct (slides 16–17)?**

- A. Durability needs UNDO; atomicity needs REDO
- B. Isolation needs REDO; consistency needs UNDO
- C. Durability needs REDO; atomicity needs UNDO
- D. REDO and UNDO both exist for isolation

> **答案：C**
>
> p.16：REDO — Required by durability；p.17：UNDO — Required by atomicity。A 是故意配反的选项。

**Q4.3 'If each txn is consistent and the DB starts consistent, then it ends up consistent.' This is the definition of:**

- A. Consistency
- B. Atomicity
- C. Isolation
- D. Durability

> **答案：A**
>
> p.13 原文。

**Q4.4 Which ACID property is mainly about transactions running at the same time, rather than about failures?**

- A. Atomicity
- B. Consistency
- C. Durability
- D. Isolation

> **答案：D**
>
> Isolation：一个事务的执行与其他事务隔离开，靠并发控制实现。A 和 D 靠这节课的日志与恢复实现。

---

## 5. 🔴 为什么恢复需要 REDO 和 UNDO（p.15–18）

### 5.1 更新先发生在内存（p.15）

![Updates First Happen in Memory——改的是 buffer pool 里的 page #2，磁盘上的数据文件还没变](images/page_15.png)

*Updates First Happen in Memory——改的是 buffer pool 里的 page #2，磁盘上的数据文件还没变（Slide 15）*

这是 [第 1 周](../week-01/) buffer pool 的复习（那一周有可以操作的 BufferPoolLab）：

- 数据库的主存储在**非易失（non-volatile）**的磁盘上，但磁盘比内存慢
- 所以用**易失（volatile）**的内存加速：先把 page 读进 buffer pool，**在内存里改**
- 在内存里改了 page，**不会立刻**更新磁盘上的数据文件
- **Dirty page**：在内存里改过、但改动还没写回磁盘数据文件的 page

### 5.2 两种危险的情况

![Why Recovery Needs REDO：事务已经提交，改过的页面还只在内存里](images/page_16.png)

*Why Recovery Needs REDO：事务已经提交，改过的页面还只在内存里（Slide 16）*

![Why Recovery Needs UNDO：事务还没提交，改过的页面已经被写回磁盘](images/page_17.png)

*Why Recovery Needs UNDO：事务还没提交，改过的页面已经被写回磁盘（Slide 17）*

|          | 课件   | 发生了什么                                                  | 崩溃后的问题                   | 要做                           | 为了             |
| -------- | ---- | ------------------------------------------------------ | ------------------------ | ---------------------------- | -------------- |
| **情况 1** | p.16 | 事务**已提交**（已经告诉了用户），dirty page **还只在内存**                | 内存一丢，已提交的改动没了            | **REDO**（restore the change） | **Durability** |
| **情况 2** | p.17 | 事务**还没提交**，buffer manager 为了腾地方，已经把页面 **flush 并踢出**到磁盘 | 事务 abort 或系统崩溃后，半截改动留在盘上 | **UNDO**（remove the change）  | **Atomicity**  |

把「事务提交了没有」和「页面写回了没有」交叉一下，就是四种情况：

|                 | 页面还在内存（没写回）          | 页面已写回磁盘               |
| --------------- | -------------------- | --------------------- |
| **已提交**         | ⚠ 崩溃会丢 → **REDO**    | ✓ 没问题                 |
| **没提交 / abort** | ✓ 内存丢了反而没事（盘上本来就是旧值） | ⚠ 盘上留了半截改动 → **UNDO** |

### 5.3 恢复要做的两部分工作（p.18）

- **Committing a transaction and writing its modified pages to disk are related, but distinct, events.**（提交事务和把页面写回磁盘相关，但是两件不同的事）
- 恢复机制要做到：**保住已提交的改动，去掉未提交的改动**。这需要两部分工作：
  1. **正常运行时**的准备，让系统将来能恢复 → 第 6 节 Logging / WAL
  2. **故障之后**的恢复，让数据库回到满足 atomicity 和 durability 的状态 → 第 7–8 节 REDO / UNDO

> **➕ 课外补充 🟢：STEAL / NO-FORCE**
>
> 教科书（如 CMU 15-445）给这两种情况起了名字：
>
> - **NO-FORCE**：提交时**不强制**把页面写回磁盘 → 才会出现 p.16 → 需要 REDO
> - **STEAL**：允许把**未提交**事务改过的页面写回磁盘（它的 frame 被别的页面「偷走」）→ 才会出现 p.17 → 需要 UNDO
>
> 大多数 DBMS 选 STEAL + NO-FORCE，平时运行最快，代价是恢复时 REDO 和 UNDO 都要做。课件没有出现这两个词，选项里看到能认出来就行。

> **🎯 MCQ 怎么考**
>
> 判断规则：**看「事务提交了没有」和「页面写回了没有」**——提交了但没写回 → REDO / Durability；没提交但已写回 → UNDO / Atomicity。

### 随堂练习

**Q5.1 What is a dirty page?**

- A. A page that contains invalid or corrupted data
- B. A page on disk that has been read but not modified
- C. A page modified in memory whose changes have not yet been written back to the database file
- D. A page that belongs to an aborted transaction

> **答案：C**
>
> p.15 的定义。dirty 指「内存和磁盘不一致」，和数据对不对无关。

**Q5.2 T1 commits and the user is told so, but T1's modified page is still only in the buffer pool when the system crashes. Which recovery action is needed, and for which property?**

- A. UNDO, for atomicity
- B. REDO, for durability
- C. REDO, for atomicity
- D. None — losing it is acceptable because it was only in memory

> **答案：B**
>
> p.16 的情况：Once the DBMS has told somebody that a transaction committed, the changes must be durable → REDO。

**Q5.3 Before T2 commits, the buffer manager writes T2's modified page to disk to make room for another page. Then the system crashes. What must recovery do?**

- A. UNDO T2's change, for atomicity
- B. REDO T2's change, for durability
- C. Keep the change, because it is already on disk
- D. Nothing, because T2 never committed

> **答案：A**
>
> p.17 的情况。D 是陷阱：正因为 T2 没提交，已经写到盘上的改动才必须撤掉。

**Q5.4 Which statement about committing a transaction and writing its pages to disk is TRUE?**

- A. They are the same event
- B. A page may be written to disk only after its transaction commits
- C. Committing forces every modified page to disk immediately
- D. They are related but distinct events

> **答案：D**
>
> p.18 原话。B 被 p.17 否定（没提交也可能被写回），C 被 p.16 否定（提交了页面也可能还在内存）。

---

## 6. 🔴 准备工作：Logging 与 WAL 协议（p.19–23）

### 6.1 日志里记什么（p.19）

![Preparation: Logging——更新记录 &lt;T1, A, 1, 8> 里 1 是 before value、8 是 after value](images/page_19.png)

*Preparation: Logging——更新记录 &lt;T1, A, 1, 8> 里 1 是 before value、8 是 after value（Slide 19）*

把事务的动作**按顺序（sequentially）**记到日志里，以便将来 REDO / UNDO。对每个事务：

| 什么时候 | 写什么                                                               | 例子                              |
| ---- | ----------------------------------------------------------------- | ------------------------------- |
| 事务开始 | `<BEGIN>` 记录，标记起点                                                 | `<T1 BEGIN>`                    |
| 每次更新 | 更新记录 **`<Transaction Id, Object Id, Before Value, After Value>`** | `<T1, A, 1, 8>`：T1 把 A 从 1 改成 8 |
| 事务提交 | `<COMMIT>` 记录                                                     | `<T1 COMMIT>`                   |

- **Logging happens before actual update**：先写日志，再改数据
- **Logging is handled transparently by the DBMS**：日志由 DBMS 自动处理，应用程序和 SQL 里看不到

| 字段                   | 恢复时干什么用          |
| -------------------- | ---------------- |
| **Before value**（旧值） | **UNDO** 时把数据改回去 |
| **After value**（新值）  | **REDO** 时把改动补上  |

后面还会出现的日志记录：`<ABORT>`（p.28）、CLR（p.25）、`<TXN-END>`（p.26）、`<CHECKPOINT>`（p.29）。完整列表见文末的速查表。

### 6.2 🔴🔴 WAL 协议（Write-Ahead Logging，p.20）

![Write-Ahead Logging (WAL) Protocol](images/page_20.png)

*Write-Ahead Logging (WAL) Protocol（Slide 20）*

| 课件原文                                                                                                                      | 中文                                             | 保证了什么                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| The DBMS stages every log record for a txn in an **in-memory log buffer**                                                 | 日志记录先放在内存里的 **WAL buffer**                     | —                                                    |
| Log contains enough information to perform the necessary undo and redo actions                                            | 日志里的信息足够做 undo 和 redo                          | —                                                    |
| ① A log record must be written to disk **before** the corresponding data is written to disk                               | **规则 1**：日志记录必须**先于**对应的数据写到磁盘                 | 数据页上了盘，就一定有日志（before value）可以拿来 UNDO → **Atomicity** |
| ② A txn's commit is acknowledged **only after** all its log records (including the `<COMMIT>` record) are written to disk | **规则 2**：包括 `<COMMIT>` 在内的**所有日志都上盘之后**，才能确认提交 | 用户听到「提交成功」时，REDO 需要的信息已经在盘上 → **Durability**         |

> **🧠 记忆口诀**
>
> **Write-Ahead** = 日志「先行」：**日志先上盘，数据后上盘；COMMIT 上了盘，才能说成功。**

### 6.3 LSN 与 pageLSN（p.21）

![① &lt;T1 BEGIN> 和 &lt;T1, A, 1, 8> 进入 WAL buffer；每个数据页都带一个 pageLSN](images/page_21.png)

*① &lt;T1 BEGIN> 和 &lt;T1, A, 1, 8> 进入 WAL buffer；每个数据页都带一个 pageLSN（Slide 21）*

| 术语                           | 课件原文                                                                                               | 中文                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **LSN**（Log Sequence Number） | Unique and monotonically increasing                                                                | 每条日志的编号，**唯一、单调递增**（017、018、019……） |
| **pageLSN**                  | Each data page contains a pageLSN: the LSN of the **most recent** log record that updated the page | 每个数据页里记着「**最近一次**修改我的那条日志」的 LSN    |

pageLSN 的用处：恢复时比较「页面上的 pageLSN」和「日志记录的 LSN」，就知道这条修改是不是已经在页面里了（第 7 节）。

### 6.4 T1 走一遍：提交时数据页还没上盘（p.21–23）

![② Write(A)：buffer pool 里的页面变成 A=8、pageLSN 018；磁盘上还是 A=1](images/page_22.png)

*② Write(A)：buffer pool 里的页面变成 A=8、pageLSN 018；磁盘上还是 A=1（Slide 22）*

![COMMIT：&lt;COMMIT> 写进 log buffer，并保证它之前的日志全部 flush 到磁盘——这时就可以告诉用户成功了](images/page_23.png)

*COMMIT：&lt;COMMIT> 写进 log buffer，并保证它之前的日志全部 flush 到磁盘——这时就可以告诉用户成功了（Slide 23）*

| 步骤             | WAL buffer（内存）                       | Buffer pool 页面（内存）  | 磁盘上的日志              | 磁盘上的数据页              |
| -------------- | ------------------------------------ | ------------------- | ------------------- | -------------------- |
| 开始             | —                                    | A=1, B=5, C=7       | …016 `<CHECKPOINT>` | A=1, B=5, C=7        |
| BEGIN、Write(A) | 017 `<T1 BEGIN>`、018 `<T1, A, 1, 8>` | **A=8**，pageLSN 018 | 不变                  | 不变                   |
| Write(B)       | + 019 `<T1, B, 5, 9>`                | **B=9**，pageLSN 019 | 不变                  | 不变                   |
| COMMIT         | + 020 `<T1 COMMIT>` → **flush**      | 不变                  | **016–020 全部上盘**    | **还是 A=1, B=5**（没关系） |

p.23 的两句关键话：**Txn result is now safe to return to application/user.** **Everything we need to restore T1 is in the durable log!** ——数据页还没写回也能确认提交，因为日志里有 after value，崩溃了可以 REDO。

### 6.5 自己试：什么时候 flush、什么时候回复用户

下面的实验按 p.21–23 的设定：T1 要做 BEGIN、Write(A)、Write(B)、COMMIT。由你决定什么时候 **Flush 日志**、什么时候 **Flush 数据页**、什么时候**回复用户**、什么时候**崩溃**。违反 WAL 的操作会被拦下，并说明违反了哪一条；崩溃之后会自动用第 7–8 节的算法恢复，并检查结果是否满足 Atomicity / Durability。最上面三个按钮分别演示 p.16、p.17 的情况和两条 WAL 规则。

*（网页版此处可以自己一步步执行 T1，决定什么时候 flush 日志、flush 数据页、回复用户、崩溃；违反 WAL 的操作会被拦下。下面是三个演示的结果）*

**演示 p.16：提交了，页面还在内存 → 崩溃**

| # | 操作        | 结果                                                                                                                  |
| - | --------- | ------------------------------------------------------------------------------------------------------------------- |
| 1 | T1 下一步    | 017: &lt;T1 BEGIN> 放进内存的 WAL buffer，标记 T1 开始（p.19）。                                                                   |
| 2 | T1 下一步    | 先把 018: &lt;T1, A, 1, 8> 放进内存的 WAL buffer，再改 buffer pool 里的页面：A=8，pageLSN=018。磁盘上的数据文件还没变——这就是 dirty page（p.15、p.22）。 |
| 3 | T1 下一步    | 先把 019: &lt;T1, B, 5, 9> 放进内存的 WAL buffer，再改 buffer pool 里的页面：B=9，pageLSN=019。磁盘上的数据文件还没变——这就是 dirty page（p.15、p.22）。 |
| 4 | T1 下一步    | 020: &lt;T1 COMMIT> 进了 WAL buffer。按 WAL 规则，要等日志 flush 到 020 之后才能告诉用户「提交成功」（p.20、p.23）。                                |
| 5 | Flush 日志  | 日志 017–020 顺序写到磁盘（log file）。顺序追加写很快，这也是先写日志的好处。                                                                     |
| 6 | 回复用户：提交成功 | 告诉用户「提交成功」。磁盘数据页面还是旧的（pageLSN —），但恢复 T1 需要的一切都在磁盘日志里，可以放心返回（p.23）。                                                  |
| 7 | 💥 崩溃     | 💥 崩溃：内存里的 WAL buffer 和 buffer pool 全部丢失。重启后只能靠磁盘日志和磁盘页面恢复。                                                         |

**重启后恢复：**用户收到过「提交成功」，恢复后 A=8、B=9 都在 ✓ Durability。

【分析】从日志末尾往上找到最近的 &lt;CHECKPOINT>（016），从这里开始 → 【分析】T1 → REDO → 【REDO】018 重做：pageLSN — < 018 → A = 8，pageLSN 改成 018 → 【REDO】019 重做：pageLSN 018 < 019 → B = 9，pageLSN 改成 019 → 【UNDO】没有未提交的事务，UNDO 阶段什么都不用做 → 【完成】完成：A=8, B=9, C=7

**演示 p.17：没提交，页面已经写回磁盘 → 崩溃**

| # | 操作        | 结果                                                                                                                  |
| - | --------- | ------------------------------------------------------------------------------------------------------------------- |
| 1 | T1 下一步    | 017: &lt;T1 BEGIN> 放进内存的 WAL buffer，标记 T1 开始（p.19）。                                                                   |
| 2 | T1 下一步    | 先把 018: &lt;T1, A, 1, 8> 放进内存的 WAL buffer，再改 buffer pool 里的页面：A=8，pageLSN=018。磁盘上的数据文件还没变——这就是 dirty page（p.15、p.22）。 |
| 3 | Flush 日志  | 日志 017–018 顺序写到磁盘（log file）。顺序追加写很快，这也是先写日志的好处。                                                                     |
| 4 | Flush 数据页 | 页面写回数据文件（pageLSN 018）——T1 还没提交，它的修改却已经在盘上了。这就是 p.17 的情况：如果现在崩溃，恢复时必须 UNDO。                                          |
| 5 | 💥 崩溃     | 💥 崩溃：内存里的 WAL buffer 和 buffer pool 全部丢失。重启后只能靠磁盘日志和磁盘页面恢复。                                                         |

**重启后恢复：**用户没收到「提交成功」，T1 的修改一点不剩 ✓ Atomicity。

【分析】从日志末尾往上找到最近的 &lt;CHECKPOINT>（016），从这里开始 → 【分析】T1 → UNDO → 【REDO】018 跳过：pageLSN 018 ≥ 018 → 【UNDO】撤销 018：先写 019: &lt;T1, CLR-018, A, 8, 1, NextLSN=017>，再把 A 改回 1 → 【UNDO】倒着走到 &lt;T1 BEGIN>：写 020: &lt;T1 TXN-END> → 【完成】完成：A=1, B=5, C=7

**演示：违反 WAL 两条规则会被拦下**

| # | 操作        | 结果                                                                                                                                         |
| - | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | T1 下一步    | 017: &lt;T1 BEGIN> 放进内存的 WAL buffer，标记 T1 开始（p.19）。                                                                                          |
| 2 | T1 下一步    | 先把 018: &lt;T1, A, 1, 8> 放进内存的 WAL buffer，再改 buffer pool 里的页面：A=8，pageLSN=018。磁盘上的数据文件还没变——这就是 dirty page（p.15、p.22）。                        |
| 3 | Flush 数据页 | ✗ 违反 WAL 规则 1：页面 pageLSN = 018，但磁盘日志只到 016。日志记录必须先于对应的数据写到磁盘（p.20），否则崩溃后盘上有修改、却没有 before value 可以 UNDO。先按「Flush 日志」。                       |
| 4 | T1 下一步    | 先把 019: &lt;T1, B, 5, 9> 放进内存的 WAL buffer，再改 buffer pool 里的页面：B=9，pageLSN=019。磁盘上的数据文件还没变——这就是 dirty page（p.15、p.22）。                        |
| 5 | T1 下一步    | 020: &lt;T1 COMMIT> 进了 WAL buffer。按 WAL 规则，要等日志 flush 到 020 之后才能告诉用户「提交成功」（p.20、p.23）。                                                       |
| 6 | 回复用户：提交成功 | ✗ 违反 WAL 规则 2：&lt;T1 COMMIT>（020）还在内存的 WAL buffer 里。只有包括 &lt;COMMIT> 在内的所有日志都上盘之后，才能确认提交（p.20）。先按「Flush 日志」——真实的 DBMS 在 COMMIT 时会自动做这一步（p.23）。 |

> **🎯 MCQ 怎么考**
>
> - 「Under WAL, which must happen first?」→ **对应的日志记录上盘**（先于数据页）
> - 「When can the commit be acknowledged?」→ 包括 `<COMMIT>` 在内的**所有日志**都上盘之后（**不需要**数据页上盘）
> - 「Which sequence violates WAL?」→ 找「数据页比它的日志先上盘」或「`<COMMIT>` 还没上盘就回复用户」的那个
> - 「What is pageLSN?」→ **最近一次**修改这个页面的日志记录的 LSN
> - 「before value 用来做什么？」→ UNDO；after value → REDO

> **⚠️ 干扰项陷阱**
>
> - ✗「提交时必须把事务所有的 dirty page 写回磁盘」→ WAL 只要求**日志**上盘
> - ✗「`<COMMIT>` 放进内存的 log buffer 就可以确认」→ 必须**写到磁盘**
> - ✗「先写数据、后写日志」→ 正好反了
> - ✗「pageLSN 是第一次修改这个页面的 LSN」→ 是**最近一次**
> - ✗「LSN 可以重复使用」→ 唯一且单调递增
> - ✗「日志只记 after value」→ before 和 after 都记（before 用来 UNDO）

### 随堂练习

**Q6.1 What does an update log record contain (slide 19)?**

- A. &lt;Transaction Id, Object Id, Before Value, After Value>
- B. &lt;Transaction Id, After Value>
- C. &lt;Object Id, Before Value>
- D. &lt;Page Id, full SQL statement text>

> **答案：A**
>
> before value 给 UNDO 用，after value 给 REDO 用，所以两个都要记；还要知道是哪个事务、改了哪个对象。

**Q6.2 Under the WAL protocol, which must reach disk first?**

- A. The modified data page
- B. The log record that describes the modification
- C. The commit acknowledgment
- D. The next &lt;CHECKPOINT> record

> **答案：B**
>
> p.20：A log record must be written to disk before the corresponding data is written to disk。这就是 write-ahead 的意思。

**Q6.3 When may the DBMS acknowledge T1's commit to the application?**

- A. As soon as &lt;T1 COMMIT> is placed in the in-memory log buffer
- B. Only after all of T1's dirty pages are written to the database file
- C. Only after all of T1's log records, including &lt;T1 COMMIT>, are written to disk
- D. Only after the next checkpoint completes

> **答案：C**
>
> p.20 第二条规则。A 少了「写到磁盘」；B 把日志换成了数据页——提交不需要数据页上盘（p.23）。

**Q6.4 Which statement about LSN and pageLSN is TRUE?**

- A. An LSN can be reused once its transaction commits
- B. pageLSN is the LSN of the first log record that updated the page
- C. pageLSN is kept only in the log, not in the data page
- D. LSNs are unique and monotonically increasing; pageLSN is the LSN of the most recent log record that updated the page

> **答案：D**
>
> p.21：LSN unique and monotonically increasing；Each data page contains a pageLSN（存在数据页里）= the LSN of the most recent log record that updated the page。

**Q6.5 Right after T1's commit is acknowledged on slide 23, the database file on disk still holds A=1, B=5. Is that acceptable?**

- A. No — WAL requires the data pages to be flushed at commit
- B. Yes — the durable log has everything needed to redo T1
- C. No — T1 must now be rolled back
- D. Yes — A and B are not part of T1

> **答案：B**
>
> p.23：Everything we need to restore T1 is in the durable log! 崩溃了就用日志里的 after value REDO。

---

## 7. 🔴 崩溃恢复（一）：REDO（p.24）

![REDO During Crash Recovery：pageLSN = 018，只需要重做 019](images/page_24.png)

*REDO During Crash Recovery：pageLSN = 018，只需要重做 019（Slide 24）*

**判断规则**：

1. 从日志里一个合适的位置（例如 **checkpoint**）开始，**向前（forward）**扫描
2. 对每一条更新记录：
   - **pageLSN ≥ 记录的 LSN** → 这条修改已经在磁盘页面上了 → **什么都不做**
   - **pageLSN < 记录的 LSN** → 应用日志里的 **after-image（after value）**，并把 **pageLSN 设成这条记录的 LSN**
3. 之后的 **UNDO 阶段**再去掉没提交的事务的影响

p.24 的例子：磁盘页面 pageLSN = 018，A=8、B=5、C=7。

- 018 `<T1, A, 1, 8>`：018 ≥ 018 → 跳过（A=8 已经在盘上）
- 019 `<T1, B, 5, 9>`：018 < 019 → **B = 9**，pageLSN 改成 019（课件：Only redo this）

> **📌 REDO 重做的是「所有」更新记录**
>
> p.24 的规则是 *For each update log record*——**不分事务有没有提交**，只看 pageLSN。没提交的事务的更新也会先被 redo，再由 UNDO 阶段撤掉（下一节例子里 T2 的 022、023 就是这样）。
>
> 但如果题目问的是**事务层面**「哪些事务需要 redo」（p.31 的问法），答案是**已提交的**事务。两种问法要分清：
>
> - 记录层面：pageLSN < LSN 就重做
> - 事务层面：已提交（在 checkpoint 之后）→ REDO；没提交 → UNDO

下面一步步走 p.24 的例子。勾选「每一步先自己判断」时，每一步会先问你，再揭晓答案。可以把「崩溃时磁盘页面最后一次写回」改成「从没写回」或「019 之后」，看哪些记录需要 redo——不管磁盘停在哪里，恢复后的结果都一样。

*（网页版此处可以逐步走恢复过程、每一步先自己判断，还可以改「崩溃时磁盘页面写到哪里」；下面是课件设定下的完整步骤）*

**p.24 只要 REDO（Slide 21–24）**：T1 已提交（&lt;COMMIT> 已上盘），但崩溃时磁盘页面只写到了 018：A=8 在盘上，B=9 还没写回。

日志：016: &lt;CHECKPOINT>；017: &lt;T1 BEGIN>；018: &lt;T1, A, 1, 8>；019: &lt;T1, B, 5, 9>；020: &lt;T1 COMMIT> → CRASH

崩溃时磁盘页面：pageLSN 018 · A=8, B=5, C=7

| # | 阶段   | 发生了什么                                            | 之后的页面                       |
| - | ---- | ------------------------------------------------ | --------------------------- |
| 1 | 分析   | 从日志末尾往上找到最近的 &lt;CHECKPOINT>（016），从这里开始            | pageLSN 018 · A=8, B=5, C=7 |
| 2 | 分析   | T1 → REDO                                        | pageLSN 018 · A=8, B=5, C=7 |
| 3 | REDO | 018 跳过：pageLSN 018 ≥ 018                         | pageLSN 018 · A=8, B=5, C=7 |
| 4 | REDO | 019 重做：pageLSN 018 < 019 → B = 9，pageLSN 改成 019 | pageLSN 019 · A=8, B=9, C=7 |
| 5 | UNDO | 没有未提交的事务，UNDO 阶段什么都不用做                           | pageLSN 019 · A=8, B=9, C=7 |
| 6 | 完成   | 完成：A=8, B=9, C=7                                 | pageLSN 019 · A=8, B=9, C=7 |

> **🎯 MCQ 怎么考**
>
> - 「pageLSN = 40，这个页面的更新记录 LSN 是 35、42、47，哪些要重做？」→ **42 和 47**（只重做比 pageLSN 大的）
> - 「REDO 往哪个方向扫、从哪开始？」→ **向前**，从 **checkpoint** 这类合适的位置开始
> - 「REDO 写进页面的是哪个值？」→ **after value**，同时更新 pageLSN

### 随堂练习

**Q7.1 During REDO, a log record has LSN 019 and the page on disk has pageLSN 018. What happens?**

- A. Skip the record
- B. Write the before value into the page
- C. Write the after value into the page and set pageLSN to 019
- D. Write a CLR for the record

> **答案：C**
>
> pageLSN 018 < 019 → 这条改动还没在盘上 → apply the logged after-image，并 set pageLSN to log record's LSN（p.24）。

**Q7.2 In which direction does REDO scan the log, and from where?**

- A. Backward, from the end of the log
- B. Forward, from an appropriate point such as a checkpoint
- C. Forward, always from the very first record ever written
- D. Backward, from the last checkpoint

> **答案：B**
>
> p.24：Start from an appropriate point in the log (for example, a checkpoint), and scan the log forward。C 正是 checkpoint 要避免的「重放整个日志」。

**Q7.3 During REDO, the DBMS finds an update record of a transaction that never committed, and pageLSN is smaller than its LSN. According to slide 24, what does REDO do?**

- A. Applies it; the later UNDO phase removes the effects of transactions that did not commit
- B. Skips it, because the transaction did not commit
- C. Writes a CLR for it immediately
- D. Stops recovery and reports an error

> **答案：A**
>
> REDO 只看 pageLSN，不看事务有没有提交；p.24 最后一条：A later UNDO phase removes the effects of txns that did not commit。

---

## 8. 🔴 崩溃恢复（二）：UNDO 与 CLR（p.25–28）

### 8.1 UNDO 的步骤（p.25–26）

![UNDO During Crash Recovery：先写 CLR，再恢复旧值](images/page_25.png)

*UNDO During Crash Recovery：先写 CLR，再恢复旧值（Slide 25）*

**判断规则**：

1. 回滚每一个**没有 `<COMMIT>` 记录**的事务
2. 从它**最近的 LSN** 开始，**向后（backward）**处理每一条要撤销的更新记录：
   - **先**写一条**补偿日志记录 CLR（compensation log record）**，记下这个回滚动作
   - **再**把受影响页面上的值**恢复成旧值（old value）**
3. 倒着走到这个事务的 `<BEGIN>` 时，写一条 **`<TXN-END>`**

**CLR 怎么读**（p.25 的例子）：

```
023: <T2, C, 7, 4>                          ← 原来的更新：C 从 7 改成 4
024: <T2, CLR-023, C, 4, 7, NextLSN=022>    ← 撤销它的 CLR
```

| CLR 的部分       | 意思                                                            |
| ------------- | ------------------------------------------------------------- |
| `024`         | 这条 CLR 自己的 LSN                                                |
| `CLR-023`     | 它撤销的是 023 那条记录                                                |
| `C, 4, 7`     | C 从 4 改回 7——**before / after 和原记录正好对调**                       |
| `NextLSN=022` | **The LSN of the next log record to be undone**：这个事务下一条要撤销的记录 |

![撤销到 &lt;T2 BEGIN> 时写 &lt;T2 TXN-END>；所有回滚动作都记成了 CLR](images/page_26.png)

*撤销到 &lt;T2 BEGIN> 时写 &lt;T2 TXN-END>；所有回滚动作都记成了 CLR（Slide 26）*

p.26 的完整结果（重启、做完 REDO 之后）：

```
021: <T2 BEGIN>
022: <T2, A, 8, 6>
023: <T2, C, 7, 4>
                                          ← CRASH!（上面是崩溃前的日志，下面是 UNDO 写的）
024: <T2, CLR-023, C, 4, 7, NextLSN=022>
025: <T2, CLR-022, A, 6, 8, NextLSN=021>
026: <T2 TXN-END>
```

### 8.2 为什么回滚动作也要记日志？（p.26 提问，p.27 回答）

![恢复到一半又崩溃：CLR 在下一次 REDO 中会被重做，但永远不会被撤销](images/page_27.png)

*恢复到一半又崩溃：CLR 在下一次 REDO 中会被重做，但永远不会被撤销（Slide 27）*

情景：恢复刚写完 024（CLR-023）又崩溃了。下一次重启时：

- **REDO 阶段**：CLR 和普通更新一样，按 pageLSN 规则**在需要时被重做**（CLRs are redone if needed during the REDO phase）
- **UNDO 阶段**：T2 最后一条是 CLR-023，它的 **NextLSN = 022** → 直接从 022 继续撤销，**不会再撤销一次 023**
- **CLRs are redo-only; they are never undone.**（CLR 只会被重做，永远不会被撤销）

所以记 CLR 的意义是：**恢复本身也可能被打断**。有了 CLR，已经做过的撤销不会丢，也不会被重复做。

### 8.3 正常运行中的 ABORT 也用同一套（p.28）

![CLRs also applies during ABORT：先写 &lt;ABORT>，再倒着撤销](images/page_28.png)

*CLRs also applies during ABORT：先写 &lt;ABORT>，再倒着撤销（Slide 28）*

|       | 崩溃恢复中的 UNDO（p.25–26）                       | 正常运行中的 ABORT（p.28）                                          |
| ----- | ------------------------------------------ | ----------------------------------------------------------- |
| 什么时候  | 重启时发现没有 `<COMMIT>` 的事务                     | 事务请求 abort（例如程序 ROLLBACK）                                   |
| 第一步   | （先做完 REDO）                                 | **先写 `<ABORT>`** 记录                                         |
| 撤销    | 倒着处理每条更新：先写 CLR，再恢复旧值                      | 同左（analyze the txn's updates in **reverse order**）          |
| 结束    | `<TXN-END>`                                | `<TXN-END>`                                                 |
| 课件的日志 | 024 CLR-023、025 CLR-022、026 `<T2 TXN-END>` | 024 `<T2 ABORT>`、025 CLR-023、026 CLR-022、027 `<T2 TXN-END>` |

### 8.4 自己走一遍

三个场景：**p.25–26**（T1 已提交、T2 没提交就崩溃）、**p.27**（恢复写完 CLR-023 又崩溃）、**p.28**（没有崩溃，T2 自己 abort）。前两个场景里「磁盘页面停在 018」是我的设定（课件这几页只画了日志），可以自己改。

*（网页版此处可以逐步走恢复过程、每一步先自己判断，还可以改「崩溃时磁盘页面写到哪里」；下面是课件设定下的完整步骤）*

**p.25–26 REDO + UNDO（Slide 25–26）**：T1 提交之后 T2 开始，改了 A 和 C，还没提交就崩溃了。磁盘页面同样只写到 018（我的设定，课件这页只画了日志）。

日志：016: &lt;CHECKPOINT>；017: &lt;T1 BEGIN>；018: &lt;T1, A, 1, 8>；019: &lt;T1, B, 5, 9>；020: &lt;T1 COMMIT>；021: &lt;T2 BEGIN>；022: &lt;T2, A, 8, 6>；023: &lt;T2, C, 7, 4> → CRASH

崩溃时磁盘页面：pageLSN 018 · A=8, B=5, C=7

| #  | 阶段   | 发生了什么                                                         | 之后的页面                       |
| -- | ---- | ------------------------------------------------------------- | --------------------------- |
| 1  | 分析   | 从日志末尾往上找到最近的 &lt;CHECKPOINT>（016），从这里开始                         | pageLSN 018 · A=8, B=5, C=7 |
| 2  | 分析   | T1 → REDO                                                     | pageLSN 018 · A=8, B=5, C=7 |
| 3  | 分析   | T2 → UNDO                                                     | pageLSN 018 · A=8, B=5, C=7 |
| 4  | REDO | 018 跳过：pageLSN 018 ≥ 018                                      | pageLSN 018 · A=8, B=5, C=7 |
| 5  | REDO | 019 重做：pageLSN 018 < 019 → B = 9，pageLSN 改成 019              | pageLSN 019 · A=8, B=9, C=7 |
| 6  | REDO | 022 重做：pageLSN 019 < 022 → A = 6，pageLSN 改成 022              | pageLSN 022 · A=6, B=9, C=7 |
| 7  | REDO | 023 重做：pageLSN 022 < 023 → C = 4，pageLSN 改成 023              | pageLSN 023 · A=6, B=9, C=4 |
| 8  | UNDO | 撤销 023：先写 024: &lt;T2, CLR-023, C, 4, 7, NextLSN=022>，再把 C 改回 7 | pageLSN 024 · A=6, B=9, C=7 |
| 9  | UNDO | 撤销 022：先写 025: &lt;T2, CLR-022, A, 6, 8, NextLSN=021>，再把 A 改回 8 | pageLSN 025 · A=8, B=9, C=7 |
| 10 | UNDO | 倒着走到 &lt;T2 BEGIN>：写 026: &lt;T2 TXN-END>                         | pageLSN 025 · A=8, B=9, C=7 |
| 11 | 完成   | 完成：A=8, B=9, C=7                                              | pageLSN 025 · A=8, B=9, C=7 |

**p.27 恢复途中又崩溃（Slide 27）**：上一个恢复刚写完 024（CLR-023）又崩溃了。重启后：REDO 会把 CLR 也重做一遍，UNDO 顺着 NextLSN=022 接着做，不会重复撤销 023。

日志：016: &lt;CHECKPOINT>；017: &lt;T1 BEGIN>；018: &lt;T1, A, 1, 8>；019: &lt;T1, B, 5, 9>；020: &lt;T1 COMMIT>；021: &lt;T2 BEGIN>；022: &lt;T2, A, 8, 6>；023: &lt;T2, C, 7, 4>；024: &lt;T2, CLR-023, C, 4, 7, NextLSN=022> → CRASH

崩溃时磁盘页面：pageLSN 018 · A=8, B=5, C=7

| #  | 阶段   | 发生了什么                                                         | 之后的页面                       |
| -- | ---- | ------------------------------------------------------------- | --------------------------- |
| 1  | 分析   | 从日志末尾往上找到最近的 &lt;CHECKPOINT>（016），从这里开始                         | pageLSN 018 · A=8, B=5, C=7 |
| 2  | 分析   | T1 → REDO                                                     | pageLSN 018 · A=8, B=5, C=7 |
| 3  | 分析   | T2 → UNDO                                                     | pageLSN 018 · A=8, B=5, C=7 |
| 4  | REDO | 018 跳过：pageLSN 018 ≥ 018                                      | pageLSN 018 · A=8, B=5, C=7 |
| 5  | REDO | 019 重做：pageLSN 018 < 019 → B = 9，pageLSN 改成 019              | pageLSN 019 · A=8, B=9, C=7 |
| 6  | REDO | 022 重做：pageLSN 019 < 022 → A = 6，pageLSN 改成 022              | pageLSN 022 · A=6, B=9, C=7 |
| 7  | REDO | 023 重做：pageLSN 022 < 023 → C = 4，pageLSN 改成 023              | pageLSN 023 · A=6, B=9, C=4 |
| 8  | REDO | 024 重做：pageLSN 023 < 024 → C = 7，pageLSN 改成 024              | pageLSN 024 · A=6, B=9, C=7 |
| 9  | UNDO | T2 最后一条是 CLR-023：023 已经撤销过，直接跳到 NextLSN = 022                 | pageLSN 024 · A=6, B=9, C=7 |
| 10 | UNDO | 撤销 022：先写 025: &lt;T2, CLR-022, A, 6, 8, NextLSN=021>，再把 A 改回 8 | pageLSN 025 · A=8, B=9, C=7 |
| 11 | UNDO | 倒着走到 &lt;T2 BEGIN>：写 026: &lt;T2 TXN-END>                         | pageLSN 025 · A=8, B=9, C=7 |
| 12 | 完成   | 完成：A=8, B=9, C=7                                              | pageLSN 025 · A=8, B=9, C=7 |

**p.28 正常运行时 ABORT（Slide 28）**：没有崩溃：T2 改完 A 和 C 之后自己请求 abort（比如程序 ROLLBACK）。页面就是 buffer pool 里的当前页面。

日志：016: &lt;CHECKPOINT>；017: &lt;T1 BEGIN>；018: &lt;T1, A, 1, 8>；019: &lt;T1, B, 5, 9>；020: &lt;T1 COMMIT>；021: &lt;T2 BEGIN>；022: &lt;T2, A, 8, 6>；023: &lt;T2, C, 7, 4>

内存里的页面：pageLSN 023 · A=6, B=9, C=4

| # | 阶段    | 发生了什么                                                         | 之后的页面                       |
| - | ----- | ------------------------------------------------------------- | --------------------------- |
| 1 | ABORT | T2 在正常运行中请求 abort：先写 024: &lt;T2 ABORT>                         | pageLSN 023 · A=6, B=9, C=4 |
| 2 | UNDO  | 撤销 023：先写 025: &lt;T2, CLR-023, C, 4, 7, NextLSN=022>，再把 C 改回 7 | pageLSN 025 · A=6, B=9, C=7 |
| 3 | UNDO  | 撤销 022：先写 026: &lt;T2, CLR-022, A, 6, 8, NextLSN=021>，再把 A 改回 8 | pageLSN 026 · A=8, B=9, C=7 |
| 4 | UNDO  | 倒着走到 &lt;T2 BEGIN>：写 027: &lt;T2 TXN-END>                         | pageLSN 026 · A=8, B=9, C=7 |
| 5 | 完成    | 完成：A=8, B=9, C=7                                              | pageLSN 026 · A=8, B=9, C=7 |

> **🎯 MCQ 怎么考**
>
> - 「UNDO 时先做什么？」→ **先写 CLR，再恢复旧值**
> - 「NextLSN 是什么？」→ **下一条要被撤销的日志记录**的 LSN（不是 CLR 自己的 LSN，也不是它撤销的那条）
> - 「撤销到 BEGIN 时写什么？」→ **`<TXN-END>`**
> - 「为什么要记 CLR？」→ 恢复中再崩溃时，CLR 会在 REDO 阶段被重做；**CLR redo-only，never undone**
> - 「正常 abort 第一条写什么？」→ **`<ABORT>`**

> **⚠️ 干扰项陷阱**
>
> - ✗「先恢复旧值，再写 CLR」→ 顺序反了（和 WAL「先日志、后数据」是同一个思路）
> - ✗「UNDO 从 BEGIN 开始往后撤」→ 从**最近的 LSN** 开始**倒着**撤
> - ✗「CLR 在之后的恢复中可能被 undo」→ **永远不会**
> - ✗「UNDO 写回的是 after value」→ 写回的是 **before value（旧值）**
> - ✗「UNDO 处理有 `<COMMIT>` 的事务」→ 处理的是**没有** `<COMMIT>` 的

*（网页版此处是点选练习：恢复时这个情况要 REDO、UNDO，还是不用处理？（Slide 16–31）；下表是全部题目和答案）*

| 情景                                                          | 答案       | 理由                                                                              |
| ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| T1 已经 COMMIT 并告诉了用户，但它改过的 dirty page 还只在 buffer pool 里，系统崩溃 | **REDO** | p.16：已提交的改动没上盘，崩溃后要用日志里的 after value 补回来（durability）                            |
| T2 还没 COMMIT，buffer manager 为了腾地方把它改过的页面 flush 到磁盘，随后崩溃     | **UNDO** | p.17：未提交的改动已经在盘上了，要用 before value 撤掉（atomicity）                                 |
| T1 在最后一个 &lt;CHECKPOINT> 之前就 COMMIT 了                         | **不用处理** | p.31：checkpoint 已经把它的修改 flush 到磁盘，恢复时直接忽略                                       |
| T2 在 checkpoint 之前开始，在 checkpoint 之后 COMMIT，然后系统崩溃          | **REDO** | p.31：committed after checkpoint → need to redo T2                               |
| T3 在 checkpoint 之前开始，直到崩溃都没有 COMMIT                         | **UNDO** | p.31：did not commit before the crash → need to undo T3（崩溃中的事务一律当作 aborted，p.12） |
| 正常运行中（没有崩溃），程序发出 ROLLBACK                                   | **UNDO** | p.28：先写 &lt;ABORT>，然后用同样的 UNDO 步骤倒着撤销，写 CLR，最后 &lt;TXN-END>                         |
| REDO 阶段扫到 019: &lt;T1, B, 5, 9>，磁盘页面的 pageLSN = 018           | **REDO** | p.24：pageLSN < 记录的 LSN → 这条修改还没上盘，应用 after value（B = 9），pageLSN 改成 019         |
| REDO 阶段扫到 018: &lt;T1, A, 1, 8>，磁盘页面的 pageLSN = 018           | **不用处理** | p.24：pageLSN ≥ 记录的 LSN → 已经反映在盘上，什么都不做                                          |
| REDO 阶段扫到一条 CLR，磁盘页面的 pageLSN 比它小                           | **REDO** | p.27：CLR 在之后的恢复中照样会被 redo（CLRs are redo-only）                                   |
| UNDO 阶段倒着走，遇到这个事务之前写的一条 CLR                                 | **不用处理** | p.27：CLR 永远不会被 undo；顺着它的 NextLSN 跳到下一条要撤销的记录                                    |

### 随堂练习

**Q8.1 During UNDO, for each update record to be undone, what is the correct order?**

- A. Restore the old value, then write a CLR
- B. Write a CLR, then restore the old value
- C. Write &lt;TXN-END>, then restore the old value
- D. Write the after value, then write &lt;COMMIT>

> **答案：B**
>
> p.25：First, write a compensation log record (CLR)… Then, restore the update's old value。

**Q8.2 In 024: &lt;T2, CLR-023, C, 4, 7, NextLSN=022>, what does NextLSN=022 mean?**

- A. The LSN of this CLR
- B. The LSN of the record this CLR undoes
- C. The LSN of the next log record to be undone
- D. The pageLSN after this undo

> **答案：C**
>
> A 是 024，B 是 023（写在 CLR-023 里）。NextLSN 告诉恢复程序：T2 接下来该撤销 022。

**Q8.3 When the backward traversal for T2 reaches &lt;T2 BEGIN>, the DBMS writes:**

- A. &lt;T2 COMMIT>
- B. &lt;T2 ABORT>
- C. &lt;CHECKPOINT>
- D. &lt;T2 TXN-END>

> **答案：D**
>
> p.26：Once the BEGIN record for the txn is reached during the backward traversal, write a TXN-END record。B 是正常 abort 一开始写的记录（p.28），不是结束时写的。

**Q8.4 Why are rollback actions logged as CLRs?**

- A. If the system crashes again during recovery, CLRs are redone in the next REDO phase, so finished undo work is neither lost nor repeated; CLRs are never undone
- B. So that CLRs can be undone later if the transaction is resumed
- C. Because CLRs replace the original update records, which are then deleted
- D. To keep the log shorter

> **答案：A**
>
> p.27 回答了 p.26 的问题。原记录不会被删除（C），CLR 永远不被 undo（B），日志反而变长了（D）。

**Q8.5 A transaction aborts during normal operation (no crash). What is written to the log first?**

- A. A CLR for its most recent update
- B. &lt;TXN-END>
- C. &lt;ABORT>
- D. &lt;COMMIT>

> **答案：C**
>
> p.28：When an abort is requested, first write an ABORT record to the log，然后才倒着写 CLR，最后 TXN-END。

---

## 9. 🔴 Checkpoint（p.29–32）

### 9.1 为什么要 checkpoint（p.29）

![Checkpoints：WAL 会无限增长，崩溃后从头重放太慢](images/page_29.png)

*Checkpoints：WAL 会无限增长，崩溃后从头重放太慢（Slide 29）*

| 课件原文                                                                                      | 中文                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------------- |
| The DBMS's WAL will grow forever                                                          | 日志只会越来越长                              |
| After a crash, the DBMS must replay the entire log, which will take a long time           | 没有 checkpoint，崩溃后要重放整个日志，非常慢          |
| The DBMS periodically takes a **checkpoint** where it **flushes all buffers out to disk** | 定期做 checkpoint：把所有缓冲区（dirty page）写回磁盘 |
| This provides a **hint on how far back it needs to replay** the WAL after a crash         | 告诉恢复程序：往回重放到这里就够了                     |
| **Truncate the WAL** up to a certain safe point in time                                   | 可以把安全点之前的日志截掉                         |

### 9.2 阻塞式 / 一致性 checkpoint 的五步（p.30）

![Blocking/Consistent Checkpoint Protocol](images/page_30.png)

*Blocking/Consistent Checkpoint Protocol（Slide 30）*

The DBMS **halts everything** when it takes a checkpoint to ensure a consistent snapshot:

1. **Halt** the start of any new txns（不让新事务开始）
2. **Wait** until all active txns finish executing (commit or abort)（等正在跑的事务结束）
3. **Flush** all dirty buffer-pool pages to disk, with WAL protocol enforced（把所有 dirty page 写回磁盘，照样遵守 WAL）
4. **Write** a `<CHECKPOINT>` entry to WAL and flush to disk（写 checkpoint 记录并上盘）
5. **Resume** txn processing（恢复处理事务）

> **🧠 记忆口诀**
>
> **停（新的）→ 等（旧的）→ 刷（脏页）→ 记（CHECKPOINT）→ 继续。** 第 2 步是**等**活动事务自己结束，**不是**把它们 abort 掉。

### 9.3 Checkpoint in action（p.31）

![Checkpoints in Action：T1 忽略、T2 redo、T3 undo](images/page_31.png)

*Checkpoints in Action：T1 忽略、T2 redo、T3 undo（Slide 31）*

```
<T1 BEGIN>
<T1, A, 1, 2>
<T1 COMMIT>
<T2 BEGIN>
<T2, A, 2, 3>
<T3 BEGIN>
<CHECKPOINT>
<T2, B, 4, 5>
<T2 COMMIT>
<T3, A, 3, 4>
        ← CRASH!
```

**判断规则**：从日志**底部往上**找到最近的 `<CHECKPOINT>`，以它为分析的起点：

| 事务 | 情况                                       | 恢复时                            |
| -- | ---------------------------------------- | ------------------------------ |
| T1 | 在 checkpoint **之前**就 COMMIT 了            | **忽略**（checkpoint 已经把它的修改写回磁盘） |
| T2 | checkpoint 之前开始，checkpoint **之后** COMMIT | **REDO**                       |
| T3 | 崩溃前**没有** COMMIT                         | **UNDO**                       |

> **⚠️ 课件里的一个小矛盾**
>
> 按 p.30 的阻塞式协议，做 checkpoint 时要**等所有活动事务结束**，所以不应该有事务「跨过」checkpoint；但 p.29 / p.31 的例子里，T2、T3 在 checkpoint 时都还没结束。考试按 **p.31 的判断规则**做题就行：checkpoint 之前提交的忽略，之后提交的 redo，没提交的 undo。（真实系统多用不需要停顿的 fuzzy checkpoint，所以会有跨过 checkpoint 的事务。）

下面按 p.31 的日志走一遍（日志编号 001–010 是我加的，课件这页没有编号）：

*（网页版此处可以逐步走恢复过程、每一步先自己判断，还可以改「崩溃时磁盘页面写到哪里」；下面是课件设定下的完整步骤）*

**p.31 Checkpoint：T1 / T2 / T3（Slide 29–31）**：课件这页的日志没有编号，001–010 是我加的。checkpoint 已经把 005 之前的修改 flush 到盘，崩溃时磁盘页面默认停在 005。

日志：001: &lt;T1 BEGIN>；002: &lt;T1, A, 1, 2>；003: &lt;T1 COMMIT>；004: &lt;T2 BEGIN>；005: &lt;T2, A, 2, 3>；006: &lt;T3 BEGIN>；007: &lt;CHECKPOINT>；008: &lt;T2, B, 4, 5>；009: &lt;T2 COMMIT>；010: &lt;T3, A, 3, 4> → CRASH

崩溃时磁盘页面：pageLSN 005 · A=3, B=4

| # | 阶段   | 发生了什么                                                         | 之后的页面                  |
| - | ---- | ------------------------------------------------------------- | ---------------------- |
| 1 | 分析   | 从日志末尾往上找到最近的 &lt;CHECKPOINT>（007），从这里开始                         | pageLSN 005 · A=3, B=4 |
| 2 | 分析   | T1 → 忽略                                                       | pageLSN 005 · A=3, B=4 |
| 3 | 分析   | T2 → REDO                                                     | pageLSN 005 · A=3, B=4 |
| 4 | 分析   | T3 → UNDO                                                     | pageLSN 005 · A=3, B=4 |
| 5 | REDO | 008 重做：pageLSN 005 < 008 → B = 5，pageLSN 改成 008              | pageLSN 008 · A=3, B=5 |
| 6 | REDO | 010 重做：pageLSN 008 < 010 → A = 4，pageLSN 改成 010              | pageLSN 010 · A=4, B=5 |
| 7 | UNDO | 撤销 010：先写 011: &lt;T3, CLR-010, A, 4, 3, NextLSN=006>，再把 A 改回 3 | pageLSN 011 · A=3, B=5 |
| 8 | UNDO | 倒着走到 &lt;T3 BEGIN>：写 012: &lt;T3 TXN-END>                         | pageLSN 011 · A=3, B=5 |
| 9 | 完成   | 完成：A=3, B=5                                                   | pageLSN 011 · A=3, B=5 |

### 9.4 Checkpoint 做多频繁（p.32）

| 太频繁                                                    | 太稀疏                                             |
| ------------------------------------------------------ | ----------------------------------------------- |
| **Runtime performance degrades**：系统花太多时间 flush buffers | Checkpoint 本身又大又慢；**recovery time much longer** |

→ 这是一个 **tunable option（可调参数）**，取决于应用对**恢复时间**的要求。

> **💼 业务视角**
>
> 用业务语言说：checkpoint 间隔是在「平时的运行效率」和「出事后多快能恢复」之间做取舍。停机一分钟损失很大的系统（交易、支付）宁可平时多花一点 I/O，也要把恢复时间压短。

> **🎯 MCQ 怎么考**
>
> - 「为什么要 checkpoint？」→ 限制崩溃后要重放的日志、可以截断 WAL（**不是**为了加快查询）
> - 「哪一项不是阻塞式 checkpoint 的步骤？」→ 常见假选项：*abort all active transactions*、*allow new transactions to start*
> - 「给一段带 CHECKPOINT 的日志，哪些 redo / undo / 忽略？」→ 用上面的三分法
> - 「checkpoint 太频繁会怎样？」→ **运行时性能下降**；太稀疏 → **恢复时间变长**

### 随堂练习

**Q9.1 Why does a DBMS take checkpoints?**

- A. To limit how much of the WAL must be replayed after a crash, and to allow the WAL to be truncated
- B. To make normal SELECT queries faster
- C. To replace logging, so update records are no longer needed
- D. To lock all users out until the next backup

> **答案：A**
>
> p.29：provides a hint on how far back it needs to replay the WAL；truncate the WAL up to a certain safe point。

**Q9.2 Which is NOT a step of the blocking/consistent checkpoint protocol (slide 30)?**

- A. Halt the start of any new transactions
- B. Wait until all active transactions commit or abort
- C. Flush all dirty buffer-pool pages to disk, with WAL enforced
- D. Abort all active transactions immediately

> **答案：D**
>
> 协议是**等**活动事务结束（commit or abort），不会主动把它们 abort 掉。

**Q9.3 Using the WAL on slide 31, which is correct?**

- A. Redo T1 and T2; undo T3
- B. Ignore T1; redo T2; undo T3
- C. Ignore T1 and T2; undo T3
- D. Ignore T1; undo T2 and T3

> **答案：B**
>
> T1 在 checkpoint 之前提交 → 忽略；T2 在 checkpoint 之后提交 → redo；T3 没提交 → undo。T2 虽然在 checkpoint 之前就开始了，但它是在 checkpoint 之后才提交的，所以要 redo。

**Q9.4 What is the main cost of taking checkpoints too frequently?**

- A. Recovery time becomes much longer
- B. The WAL grows without bound
- C. Runtime performance degrades because the system spends too much time flushing buffers
- D. Committed transactions may be lost

> **答案：C**
>
> p.32。A 是 checkpoint **太稀疏**的后果；B 是**不做** checkpoint 的问题（p.29）。

---

## 10. 🟡 四种 Recovery（p.33）

![Different Types of Recovery](images/page_33.png)

*Different Types of Recovery（Slide 33）*

| 类型                                  | 什么时候需要（课件原文）                                                                                                  | 典型做法（课件原文）                                                                                                       | 中文一句话                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Transaction recovery / rollback** | A transaction is aborted, e.g., because of an **error, deadlock, or explicit rollback request**               | Undo that transaction's changes; **the DBMS continues operating**                                                | 只撤一个事务，系统照常运行                       |
| **Crash recovery**                  | The DBMS/server crashes; **volatile state is lost**, but the **data files and recovery log remain available** | Use the log to recover missing updates and undo incomplete transactions                                          | 内存丢了，盘还在 → 用日志 REDO + UNDO（第 7–8 节） |
| **Media recovery**                  | **Database files are lost or damaged**, e.g., because of a storage failure                                    | **Restore affected files from a backup, then apply available recovery logs** to reach the desired recovery point | 盘坏了 → 备份还原 + 重放日志                   |
| **Disaster recovery**               | A major disruption makes the **primary site or environment unavailable**                                      | Restore service using a **remote replica or backups and replacement infrastructure**                             | 整个机房 / 地区不可用 → 异地副本                 |

> **🧠 记忆口诀**
>
> 按「丢了多少」从小到大：**一个事务 → 内存 → 磁盘文件 → 整个站点**。

> **⚠️ 干扰项陷阱**
>
> - Media recovery **不能只靠日志**：数据文件都没了，要先从**备份**还原，再重放日志
> - Crash recovery **不需要备份**：数据文件和日志都还在
> - Transaction recovery 时 **DBMS 不停机**

*（网页版此处是点选练习：这属于哪种 recovery？（Slide 33）；下表是全部题目和答案）*

| 情景                                                    | 答案                       | 理由                                                                                             |
| ----------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| 两个事务互相等待对方的锁（deadlock），DBMS 选中 T5 中止掉                 | **Transaction recovery** | 单个事务被 abort（课件原文就举了 deadlock）：撤销它的改动，DBMS 继续运行                                                 |
| 下单时余额不够，UPDATE 违反了 CHECK (balance >= 0)，程序执行 ROLLBACK | **Transaction recovery** | error / explicit rollback request → 只撤销这一个事务                                                   |
| 用户在 App 上点「取消订单」，事务被显式回滚，数据库照常服务                      | **Transaction recovery** | explicit rollback request；the DBMS continues operating                                         |
| 数据库服务器突然断电，内存里的东西全没了，但磁盘上的数据文件和日志都完好                  | **Crash recovery**       | volatile state is lost, but the data files and recovery log remain available → 用日志 REDO / UNDO |
| 操作系统 kernel panic，DBMS 进程被强制结束后重启                     | **Crash recovery**       | DBMS / server crashes，盘上东西都在 → crash recovery                                                  |
| 存数据文件的那块硬盘坏了，数据文件读不出来；日志放在另一块盘上                       | **Media recovery**       | database files are lost or damaged → 先从备份还原文件，再重放日志到需要的恢复点                                     |
| 先从昨晚的备份还原数据文件，再应用之后的日志，恢复到今天上午 10 点                   | **Media recovery**       | restore from a backup, then apply available recovery logs to reach the desired recovery point  |
| 洪水让整个主数据中心停摆，切换到另一个城市的副本继续服务                          | **Disaster recovery**    | primary site unavailable → 用 remote replica 或备份加替代的基础设施恢复服务                                    |
| 云厂商整个 region 不可用，在另一个 region 用备份重建数据库                 | **Disaster recovery**    | 整个环境不可用，靠异地备份 + replacement infrastructure                                                     |

### 随堂练习

**Q10.1 The database server loses power. The data files and the recovery log on disk are intact. Which type of recovery is needed?**

- A. Transaction recovery
- B. Crash recovery
- C. Media recovery
- D. Disaster recovery

> **答案：B**
>
> volatile state is lost, but the data files and recovery log remain available → crash recovery。

**Q10.2 A storage failure destroys the database files. What is the typical response?**

- A. Undo incomplete transactions using the log only
- B. Simply restart the DBMS
- C. Fail over to a remote site, because the primary site is unavailable
- D. Restore the files from a backup, then apply the available recovery logs

> **答案：D**
>
> Media recovery。A、B 是 crash recovery 的做法（文件还在才行）；C 是 disaster recovery（整个站点不可用）。

---

## 🔴 综合速查表

| 术语                  | 全称 / 原文                                          | 一句话                                                           | 页      |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------- | ------ |
| txn                 | Transaction                                      | 一次现实世界的状态变化，作为原子单位执行的一串动作                                     | 10     |
| Commit ack          | Successful commit acknowledgment                 | 已提交且 durable，能扛过之后的崩溃                                         | 7      |
| Rollback ack        | Successful rollback acknowledgement              | 一条改动都不剩，包括已经成功的语句                                             | 7      |
| Transaction manager | —                                                | 把事务看成对数据库对象的读和写；看不到程序逻辑                                       | 11     |
| ACID                | Atomicity · Consistency · Isolation · Durability | 全做或全不做 · 一致进一致出 · 互不干扰 · 提交了就不丢                               | 13     |
| Dirty page          | —                                                | 内存里改过、还没写回磁盘数据文件的 page                                        | 15     |
| REDO                | —                                                | 补上已提交但没写回的改动，为了 **Durability**                                | 16, 24 |
| UNDO                | —                                                | 去掉没提交却已写回的改动，为了 **Atomicity**                                 | 17, 25 |
| Update log record   | `<Txn Id, Object Id, Before, After>`             | before 用来 UNDO，after 用来 REDO                                  | 19     |
| WAL                 | Write-Ahead Logging                              | ① 日志先于数据上盘 ② `<COMMIT>` 及之前的日志上盘才确认提交                         | 20     |
| WAL buffer          | In-memory log buffer                             | 日志先放在内存里，再 flush 到盘                                           | 20     |
| LSN                 | Log Sequence Number                              | 日志编号，唯一、单调递增                                                  | 21     |
| pageLSN             | —                                                | 最近一次修改这个页面的日志的 LSN，存在数据页里                                     | 21     |
| REDO 规则             | —                                                | 向前扫；pageLSN ≥ LSN 跳过，pageLSN < LSN 写 after value 并更新 pageLSN | 24     |
| CLR                 | Compensation Log Record                          | 记录一个回滚动作；redo-only，永不 undo                                    | 25, 27 |
| NextLSN             | —                                                | CLR 里「下一条要撤销的记录」的 LSN                                         | 25     |
| TXN-END             | `<TXN-END>`                                      | 倒着撤销到 BEGIN 之后写，表示这个事务彻底结束                                    | 26     |
| ABORT               | `<ABORT>`                                        | 正常运行中 abort 时第一条写的记录                                          | 28     |
| Checkpoint          | `<CHECKPOINT>`                                   | 把 dirty page 全部写回；崩溃后从这里开始分析，可以截断之前的日志                        | 29–31  |
| Blocking checkpoint | Blocking / Consistent Checkpoint                 | 停新事务 → 等活动事务 → 刷脏页 → 写 CHECKPOINT → 继续                        | 30     |
| 四种 recovery         | Transaction / Crash / Media / Disaster           | 一个事务 / 内存 / 磁盘文件 / 整个站点                                       | 33     |

日志记录一览：

| 记录                                        | 什么时候写                    |
| ----------------------------------------- | ------------------------ |
| `<T BEGIN>`                               | 事务开始                     |
| `<T, X, before, after>`                   | 每次更新（先于真正的更新）            |
| `<T COMMIT>`                              | 提交；它和之前的日志都上盘后才能确认提交     |
| `<T ABORT>`                               | 正常运行中请求 abort            |
| `<T, CLR-n, X, before, after, NextLSN=m>` | UNDO 时撤销第 n 条，下一条要撤销的是 m |
| `<T TXN-END>`                             | 撤销到 BEGIN 之后             |
| `<CHECKPOINT>`                            | checkpoint 做完            |

---

## 🔴 MCQ 高频陷阱清单（看到就是错的）

| ✗ 错误说法                                 | ✓ 正确版本                                 | 页      |
| -------------------------------------- | -------------------------------------- | ------ |
| ROLLBACK 只撤销失败的那条语句                    | 撤销整个事务，包括已经成功的语句                       | 5, 7   |
| 收到 commit acknowledgment 表示数据页都已写回磁盘   | 表示 durable：日志已上盘，数据页可能还在内存             | 7, 23  |
| DBMS 看得到 A = A − 100 这样的计算             | 只看得到读和写                                | 11     |
| 崩溃时正在运行的事务，恢复后会接着执行                    | 当作 aborted，效果不能留下                      | 12     |
| REDO 是为了 Atomicity，UNDO 是为了 Durability | 反了：REDO ↔ Durability，UNDO ↔ Atomicity  | 16–17  |
| 未提交事务改过的页面不会被写到磁盘                      | buffer manager 可能为了腾地方把它写回（所以才需要 UNDO） | 17     |
| 先写数据页，再写日志                             | 日志先于对应的数据上盘                            | 20     |
| `<COMMIT>` 进了内存的 log buffer 就能确认提交     | 必须写到磁盘                                 | 20, 23 |
| pageLSN = 第一次修改这个页面的 LSN               | 最近一次                                   | 21     |
| REDO 时 pageLSN ≥ LSN 也要重做              | 只有 pageLSN < LSN 才重做                  | 24     |
| REDO 向后扫、UNDO 向前扫                      | REDO 向前（forward），UNDO 向后（backward）     | 24–25  |
| UNDO 先恢复旧值、再写 CLR                      | 先写 CLR，再恢复旧值                           | 25     |
| NextLSN 是这条 CLR 自己的 LSN                | 是下一条要撤销的记录的 LSN                        | 25     |
| CLR 在之后的恢复中可能被 undo                    | CLR redo-only，永不 undo                  | 27     |
| checkpoint 之前提交的事务，崩溃后也要 redo          | 忽略                                     | 31     |
| 阻塞式 checkpoint 会 abort 所有活动事务          | 等它们 commit 或 abort                     | 30     |
| checkpoint 越频繁越好                       | 太频繁拖慢运行，太稀疏拖慢恢复；是可调参数                  | 32     |
| Media recovery 只靠日志就行                  | 先从备份还原，再应用日志                           | 33     |

---

## 模拟自测题（综合）

这几题把多节内容放在一起，接近「给一段日志、问结果」的考法。M1–M3 用下面这段日志：

```
<T1 BEGIN>
<T1, X, 10, 20>
<T2 BEGIN>
<T1 COMMIT>
<CHECKPOINT>
<T3 BEGIN>
<T2, Y, 5, 7>
<T3, X, 20, 30>
<T3 COMMIT>
<T4 BEGIN>
<T4, Y, 7, 9>
        ← CRASH!
```

**M1. Using the log above, which is correct?**

- A. Redo T1 and T3; undo T2 and T4
- B. Ignore T1; redo T3; undo T2 and T4
- C. Ignore T1; redo T2 and T3; undo T4
- D. Ignore T1 and T2; redo T3; undo T4

> **答案：B**
>
> T1 在 checkpoint 之前提交 → 忽略；T3 在 checkpoint 之后提交 → redo；T2、T4 崩溃前都没有 COMMIT → undo。C、D 的陷阱：T2 在 checkpoint 之前就开始了，但「什么时候开始」不重要，要看**有没有 COMMIT**。

**M2. After recovery completes, what are the values of X and Y?**

- A. X = 30, Y = 9
- B. X = 20, Y = 5
- C. X = 30, Y = 5
- D. X = 30, Y = 7

> **答案：C**
>
> X：T1（10 → 20）和 T3（20 → 30）都提交了 → 30。Y：T2（5 → 7）和 T4（7 → 9）都要撤销 → 回到最初的 5。D 是撤销顺序弄反的结果：先撤 T2（Y = 5）再撤 T4（Y = 7）就错了，见 M3。

**M3. During the UNDO phase for this log, which update is undone first?**

- A. &lt;T3, X, 20, 30>
- B. &lt;T2, Y, 5, 7>
- C. &lt;T1, X, 10, 20>
- D. &lt;T4, Y, 7, 9>

> **答案：D**
>
> **我的解答**（课件只演示了一个要撤销的事务）：UNDO 从最近的 LSN 开始**倒着**撤，所以先撤日志里最后一条要撤的 `<T4, Y, 7, 9>`（Y 回到 7），再撤 `<T2, Y, 5, 7>`（Y 回到 5）。T1、T3 已提交，永远不会被 undo。上面 RecoveryLab 里的 UNDO 也是按这个顺序做的。

**M4. A page on disk has pageLSN = 40. During REDO, the log holds update records for this page with LSNs 35, 42 and 47. Which records are applied?**

- A. 35 only
- B. 35, 42 and 47
- C. 42 and 47
- D. None, because the page is already on disk

> **答案：C**
>
> 只有 pageLSN < LSN 的才重做：40 < 42、40 < 47；35 ≤ 40 说明已经在页面里了。每重做一条，pageLSN 跟着变成 42、47。

**M5. Which statement about the log record &lt;T5, CLR-031, B, 12, 9, NextLSN=027> is TRUE?**

- A. It undoes record 031 (B goes from 12 back to 9), and record 027 is the next record of T5 to undo
- B. It undoes record 027
- C. B was 9 before this undo and is set to 12
- D. It will be undone if the system crashes again during recovery

> **答案：A**
>
> 照 p.25 的格式读：CLR-031 = 撤销 031；`B, 12, 9` = B 从 12 改回 9（所以 031 原本是 `<T5, B, 9, 12>`）；NextLSN = 下一条要撤的。D：CLR 永远不会被 undo。

**M6. The system crashes again right after 024: &lt;T2, CLR-023, C, 4, 7, NextLSN=022> is written (slide 27). On restart, what does the UNDO phase do for T2?**

- A. Undo 023 again, then 022
- B. Continue from 022 (following NextLSN), then write &lt;T2 TXN-END>
- C. Undo the CLR 024 first, then 023 and 022
- D. Nothing — T2 is now treated as committed

> **答案：B**
>
> p.27：REDO 阶段先把 CLR 024 重做（如果需要），UNDO 阶段顺着 NextLSN = 022 继续，写 025 CLR-022，再写 026 TXN-END。023 不会被撤两次，CLR 也不会被撤销。

**M7. For transaction T: (i) T's update log record reaches disk; (ii) T's modified data page reaches disk; (iii) &lt;T COMMIT> reaches disk; (iv) the commit is acknowledged to the user. Which sequence violates WAL?**

- A. i, iii, iv, ii
- B. i, ii, iii, iv
- C. ii, i, iii, iv
- D. i, iii, ii, iv

> **答案：C**
>
> C 让数据页比它的日志先上盘，违反规则 1。A：数据页在确认之后才写回，完全合法（p.23 就是这样）。B：没提交时页面先上盘也合法（p.17 的情况，日志已经先上盘了）。

**M8. A user sees 'Purchase committed'. One second later the server crashes; the modified data pages were never written to the database file. After restart:**

- A. The purchase is lost, because its pages were never written
- B. The purchase is partially present
- C. The user must resubmit the purchase
- D. The purchase is present, because REDO reapplies it from the durable log

> **答案：D**
>
> 能显示 committed，说明 `<COMMIT>` 和之前的日志都已经上盘（WAL 规则 2），REDO 会用 after value 把改动补回来——这就是 durability。

**M9. Which statement about checkpoints is FALSE?**

- A. Transactions that committed before the last checkpoint must be redone after a crash
- B. A checkpoint provides a hint on how far back the WAL must be replayed
- C. Waiting a long time between checkpoints makes recovery much longer
- D. Checkpoint frequency is a tunable option

> **答案：A**
>
> checkpoint 之前提交的事务的修改已经被 flush 到盘，恢复时忽略（p.31 的 T1）。B、C、D 都是课件原话。

**M10. Why does an update log record store the before value?**

- A. To support REDO
- B. To support UNDO
- C. To compute the pageLSN
- D. To decide when to take a checkpoint

> **答案：B**
>
> UNDO 要把数据改回旧值；REDO 用的是 after value。

**M11. As taught in this lecture, which mechanism lets a DBMS guarantee atomicity and durability despite crashes?**

- A. Indexes on the primary key
- B. GRANT and REVOKE
- C. Write-ahead logging with REDO / UNDO recovery
- D. Normalizing tables to 3NF

> **答案：C**
>
> 其他选项来自前几周（索引、DCL、规范化），和故障恢复无关，是典型的「跨章节」干扰项。

**M12. The DBMS transaction manager views a transaction as:**

- A. A sequence of reads and writes of database objects that must commit or abort as an atomic unit
- B. The application's source code, including its calculations
- C. A single SQL statement
- D. A set of tables locked for the whole session

> **答案：A**
>
> p.11。B 正好相反：program logic is invisible to DBMS。

**M13. An earthquake makes the primary data center unavailable; service is restored from a replica in another city. This is:**

- A. Media recovery
- B. Crash recovery
- C. Transaction recovery
- D. Disaster recovery

> **答案：D**
>
> primary site unavailable + remote replica → disaster recovery（p.33）。

**M14. During normal operation, the application calls ROLLBACK for T7, which has three update records. Which log records are appended for T7, in order?**

- A. &lt;T7 ABORT>, three CLRs in reverse order of the updates, &lt;T7 TXN-END>
- B. Three CLRs in the original order of the updates, then &lt;T7 ABORT>
- C. &lt;T7 TXN-END>, then &lt;T7 ABORT>
- D. &lt;T7 COMMIT>, three CLRs, &lt;T7 TXN-END>

> **答案：A**
>
> p.28：先写 ABORT，再倒着（reverse order）为每条更新写 CLR，最后 TXN-END。
