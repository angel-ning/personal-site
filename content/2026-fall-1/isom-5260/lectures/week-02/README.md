---
title:
  en: "Week 2 · Database Analysis & E-R Diagrams"
  zh: "第 2 周 · 数据库分析与 E-R 图"
summary:
  en: "From enterprise data modeling and SDLC to drawing an E-R diagram: entities, attributes, relationships, cardinality constraints, and a four-pass scanning method for turning a business description into a diagram."
  zh: "从企业数据建模、SDLC 一路推到画 E-R 图：实体、属性、关系、基数约束，以及把业务描述转成图的四轮扫描做题法。"
week: 2
date: 2026-09-08
tags: [ER Diagram, Entity, Cardinality, SDLC, Data Modeling]
---
# 数据库分析与 E-R 图

**ISOM 5260 · Lecture 2 · Week 2**

从「信息系统长什么样」一路推到「怎么画一张 ER 图」，最后附一套以 Assignment 1 为例的四轮扫描做题法。全部图示按 lecture 的记法重绘。

> 优先级标注：🔴 **考点** — 会考的规则与记法 · 🟡 **理解** — 想通了就不用背 · 🟢 **了解** — 知道有这回事

**Part 1 · 数据库开发流程**

## 主线：这节课在讲什么

Lecture 2 前半段看上去是五六个互不相干的话题，其实是一条链子。先把这条链子记住，后面每一节就都有位置可放。

![从三层架构到 ER 图的主线](images/fig-01.svg)

*一句话版本：信息系统最底层是个 DBMS → 这个 DBMS 不能拍脑袋建，要先做企业级数据规划 → 规划出来的项目按 SDLC 或原型法开发 → SDLC 的 Analysis 阶段做概念数据建模 → 概念数据建模的产物就是 E-R 图。*

## 1.1 🟢 三层客户端／服务器架构 3-tier Client/Server Architecture

![三层架构](images/fig-02.svg)

*三层的分工：界面在客户端、逻辑在中间层、数据在企业层。*

> **💼 业务上为什么要分三层**
>
> 如果每台客户端都自己存一份数据，同一个客户的地址在会计那台机器和客服那台机器上会不一样，改了一处另一处不知道。把数据集中到最底层，就只有一个「真相来源」。中间层再把业务逻辑集中起来，改一次规则全公司生效，而不是给每个部门的程序都改一遍。
>
> 这也直接引出课程的问题：既然全公司都靠这一个数据库，它该怎么设计？

## 1.2 🟡 企业数据建模 Enterprise Data Modeling

**目标**：为整个组织的数据画出一张总览图（create an overall picture or explanation of organizational data）。它发生在 **IS planning** 阶段，是**自上而下**（top-down）的，产出往往是若干个待立项的数据库开发项目。

最典型的产物是一张**业务职能 × 数据实体**矩阵：行是业务职能，列是数据实体类型，打 X 表示这个职能会用到这类数据。

| Business Function ＼ Data Entity | Customer | Product | Raw Material | Order | Work Center | Work Order | Invoice | Equipment | Employee |
| ------------------------------- | -------- | ------- | ------------ | ----- | ----------- | ---------- | ------- | --------- | -------- |
| Business Planning               | X        | X       |              |       |             |            |         | X         | X        |
| Product Development             |          | X       | X            |       | X           |            |         | X         |          |
| Materials Management            |          | X       | X            | X     | X           | X          |         | X         |          |
| Order Fulfillment               | X        | X       | X            | X     | X           | X          | X       | X         | X        |
| Order Shipment                  | X        | X       |              | X     | X           |            | X       |           | X        |
| Sales Summarization             | X        | X       |              | X     |             |            | X       |           | X        |
| Production Operations           |          | X       | X            | X     | X           | X          |         | X         | X        |
| Finance and Accounting          | X        | X       | X            | X     | X           |            | X       | X         | X        |

> **💼 这张矩阵在业务上有什么用**
>
> - **定权限**。一眼看出「Finance 需要读 Customer，但 Product Development 不需要」，权限设计有了依据，而不是全公司都给全表读权限。
> - **防重复建库**。Order Fulfillment 几乎用到所有实体——说明它是跨部门的核心流程，不能让它自己单独建一个库，否则会和别的部门的数据打架。
> - **定优先级**。被最多职能引用的实体（Product、Order）就是最该先建、先建好的核心数据。
> - **划项目边界**。某几行几列聚成一块，那一块就可以立成一个独立的数据库开发项目。

## 1.3 🟡 企业模型 vs 项目模型 Enterprise Model vs Project Model

Slides 上只给了一句结论——“The project model refines and expands the relevant part of the enterprise model.”——没给定义。把定义补上：

|     | Enterprise Data Model                                                                                                                          | Project Data Model                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 范围  | 整个组织                                                                                                                                           | 单个项目／单个业务职能                                  |
| 粒度  | 宏观。通常只有**实体名**和主要关系，**不含属性**                                                                                                                   | 细致。所有实体、关系、**属性**、business rules 全都要有        |
| 产生于 | IS planning / Enterprise modeling                                                                                                              | SDLC 的 Analysis 阶段（conceptual data modeling） |
| 用途  | 规划：决定要立哪些项目、边界在哪                                                                                                                               | 建造：直接作为 relational schema 的蓝图                |
| 关系  | 项目模型 = 把企业模型中**相关的那一块**取出来，细化 + 扩展。两者必须保持一致（slides 里 Analysis 阶段有一条就是 “Compare preliminary conceptual data model with enterprise data model”）。 |                                              |

![企业模型与项目模型的关系](images/fig-03.svg)

*左边企业模型只知道「有这些东西、它们相关」；右边项目模型才知道「每个东西具体记什么、怎么关联」。右下角圆角的 ORDER LINE 是 associative entity，第 2.2 节会讲。*

## 1.4 🔴 两条开发路线：SDLC vs 原型法

|        | Systems Development Life Cycle (SDLC) | Prototyping                                             |
| ------ | ------------------------------------- | ------------------------------------------------------- |
| 一句话    | 细致、计划周密的开发过程                          | 快速应用开发 (RAD)                                            |
| 建模投入   | 完整做概念数据建模                             | **cursory attempt** —— 只草草做一遍概念建模                       |
| 数据库何时定 | Analysis / Design 阶段就定下来              | 在做第一版原型的过程中边做边定                                         |
| 节奏     | 周期长、耗时，但**comprehensive**             | 不断出新版本，重复「实现 + 维护」两个动作                                  |
| 代价     | 慢；需求早期就要说清楚                           | 数据模型欠考虑，后期可能推倒重来；原型效率不够时要 convert to operational system |
| 适合     | 需求稳定、跨部门、数据是核心资产（银行核心系统、ERP）          | 需求模糊、要先看到东西才知道要什么（内部工具、创新业务）                            |

> **💼 怎么选**
>
> 看「改错的代价」。核心交易系统上线后改表结构要停机、要迁数据、要改所有下游报表 —— 这种就值得用 SDLC 把时间花在前面。反过来，一个部门内部用的看板，需求本来就是想出来的，用原型法先跑起来再说更划算。

## 1.5 🔴 SDLC 五阶段与对应的数据库活动

SDLC 是个**循环**，不是一条直线：维护阶段发现新需求，又回到规划。每个阶段都有一项（Design 有两项）对应的数据库活动。

![SDLC 五阶段循环及对应的数据库活动](images/fig-04.svg)

*顺时针一圈：Planning → Analysis → Design → Implementation → Maintenance → 回到 Planning。*

| 阶段             | 阶段目的 Purpose                      | 对应的数据库活动                                                                                                                              |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Planning       | 对业务处境形成初步理解，看信息系统能不能解决问题或创造机会     | **Enterprise modeling**：分析现有数据处理、分析各业务职能的数据库需求、论证新建数据库的必要性                                                                            |
| Analysis       | 彻底分析业务处境以确定需求、结构化这些需求、在若干候选功能中做取舍 | **Conceptual data modeling**（见下方展开）                                                                                                   |
| Design         | 把所有信息需求引出并结构化，形成全部技术与组织规格         | **Logical database design**：细化事务、表单、报表等数据库视图，把视图整合进概念模型，确定完整性与安全需求<br />**Physical database design**：面向具体 DBMS 定义、决定数据的物理组织、设计数据库处理程序 |
| Implementation | 写程序、建数据库、测试安装、培训用户、完成文档           | **Database implementation**：编码测试数据库处理程序、完成文档与培训材料、安装数据库并从旧系统转换数据                                                                      |
| Maintenance    | 监控系统的运行与有用性，修复和增强系统               | **Database maintenance**：确保演进中的需求仍被满足、性能调优、修错与恢复被污染的数据库                                                                               |

> **📌 Analysis → Conceptual data modeling 具体做七件事**
>
> 1. 确定数据库需求的**范围**（scope）
> 2. 分析所支持业务职能的**整体数据需求**
> 3. 开发**初步**概念数据模型 —— 只含实体和关系
> 4. 把初步模型与**企业数据模型对照**（呼应 1.3 节）
> 5. 开发**详细**概念数据模型 —— 全部实体、关系、**属性**、business rules
> 6. 使其与信息系统的其他模型保持一致
> 7. 把全部概念数据库规格写入 repository

注意第 3 步和第 5 步的差别：先只画实体和关系（相当于企业模型那种粒度），确认无误后再补属性。**Assignment 1 要交的就是第 5 步的产物**。

## 1.6 🟢 用原型法开发数据库

![原型法开发流程](images/fig-05.svg)

*关键在中间那个 Implement ⇄ Revise 的环：原型法不是「做完就完」，而是在这个环里转很多圈；只有当原型本身效率不够时，才向左「转为正式系统」。橙色标注的是每一步对应的数据库活动。*

> **⚠️ 对比时容易混的一点**
>
> 原型法里 **Database maintenance 出现了两次**（Convert 之后一次，Revise 循环里一次）—— 因为它把「实现」和「维护」当成反复执行的动作。SDLC 里这两件事各自只在自己的阶段发生一次。

## 1.7 🟢 参与数据库开发的人

| 角色                             | 他们贡献什么                                 |
| ------------------------------ | -------------------------------------- |
| Business / Systems analysts    | 和管理层、用户一起分析**信息需求**。他们负责把业务语言翻译成需求。    |
| Database analysts              | 专注数据库本身的**需求与设计**。ER 图主要出自这个角色。        |
| Users                          | 提供对自己信息需求的**评估**。business rules 的真正来源。 |
| Programmers                    | 把设计变成可运行的程序。                           |
| Database / Data administrators | 管理数据库的运行、权限、备份、标准。                     |
| Other technical experts        | 系统程序员、网络管理员、测试、技术文档写作。                 |

> **💼 为什么强调「协作」**
>
> 数据库设计的正确与否，判定标准不在技术上而在业务上。「一个 course 能不能有多个 syllabus」这种问题，database analyst 自己是答不了的，只有 user 知道。同理，analyst 画出来的图必须能被 user 读懂并确认 —— 这就是为什么 slides 强调 business rules 要 “express in terms familiar to end users”。开发失败最常见的原因不是技术，是**没人去问那个知道答案的人**。

---

**Part 2 · 实体关系图 E-R Diagram**

## 2.0 🟡 为什么非要画图

Analysis 阶段要产出的是 **business rules**：statements that define or constrain some aspect of the business。它包含两部分——实体类型／属性／关系的**名称与定义**，以及施加在它们身上的**约束**。

问题在于，自然语言写出来的 business rule 是含糊的。看这一句：

> **📌 注意**
>
> Every **student** in the university **must have** a **faculty advisor**.
>
> 红色的三处分别是：**实体名**（student）、**约束**（must have）、**实体名**（faculty advisor）。这已经是一句写得相当规整的 business rule 了，但它仍然没说清：一个 student 能有**几个** advisor？一个 advisor 能带**几个** student？有没有 advisor 一个学生都不带？

同一句话，画成图就没有解释空间了：

![STUDENT has FACULTY ADVISOR](images/fig-06.svg)

*E-R Diagram 就是 business rules 的 graphical representation。*

> **⚠️ 但图不是万能的**
>
> Slides 明确写了：some business rules cannot be represented in E-R diagram; instead they are stated in natural language. 比如「学生一学期最多修 18 学分」「折扣不得超过 30%」这类规则，ER 图上没有地方画。**所以作业里写 assumptions / business rules 的文字说明是答案的一部分，不是附赠品**。

## 2.1 🔴 实体 Entity

**定义**：an entity is a **person, place, object, event, or concept** about which users wish to maintain data. —— 人、地点、物、事件、概念，只要用户想为它保存数据，它就是一个实体。

**命名**：每个实体类型有一个名字，必须是**单数名词**（singular noun）。写 `STUDENT` 不写 `STUDENTS`。

### Entity type vs Entity instance

![实体类型与实体实例](images/fig-07.svg)

*ER 图上画的永远是类型，不是实例。这是下面「什么不能当实体类型」的判据来源。*

### 做题技巧：从描述里找实体

业务描述里的**名词**——尤其是句子的**主语和宾语**——通常就是实体。回到那句话：

Every **student** in the university must have a **faculty advisor**.  
主语 student → 实体；宾语 faculty advisor → 实体；谓语 must have → 关系 + 约束。

### 🔴 什么该是实体类型，什么不该

|     | 规则                                                | 怎么理解                                        |
| --- | ------------------------------------------------- | ------------------------------------------- |
| 该是  | 有**很多个实例**<br />a thing that has many instances   | 只有一个实例的东西不值得建一张表。「本公司」只有一个，不是实体。            |
| 该是  | 由**多个属性**描述<br />described by multiple attributes | 如果只有一个属性，它多半是别人的属性，不是独立实体。                  |
| 该是  | 数据库**确实需要建模**它<br />the database needs to model   | 业务上不关心的东西不进模型，哪怕它客观存在。                      |
| 不该是 | 某个实体类型的**具体实例**                                   | `MICHELLE BRADY` 是 `EMPLOYEE` 的一行数据，不是一个类型。 |
| 不该是 | 数据库系统**生成的输出**（如报表）                               | 见下方展开。                                      |

> **💼 为什么「系统生成的输出」不能是实体类型**
>
> 报表（EXPENSE REPORT）里的每一个数字，都是从已经存在的数据算出来的 —— 每一笔 EXPENSE 都在库里，报表只是把它们按某个条件汇总。把报表也建成一张表，会带来三个具体问题：
>
> - **数据重复**。同一笔支出既在 EXPENSE 里，又在报表里，存了两份。
> - **更新异常**。有人事后修改了一笔支出金额，报表那份不会自动跟着变，两边对不上，而你无法判断哪一份是对的。
> - **没有独立存在性**。报表是「看数据的一种方式」，不是「一件事实」。换一个筛选条件就是另一张报表，难道每换一次就建一张表？
>
> 正确做法：报表在需要时**由查询实时生成**。这和第 2.3 节的 **derived attribute**（派生属性不存，用时算）是**同一个原则在不同尺度上的体现** —— 凡是能从已有数据算出来的，就不要再存一份。

> **⚠️ Concept Check（slides 上的题）**
>
> 四个框里哪些是无效的实体类型？  
> ✗ `PETER LEE, THE TREASURER` —— 具体实例，应该是 `EMPLOYEE` 或 `TREASURER`（类型）。  
> ✗ `EXPENSE REPORT` —— 系统生成的输出，可由 `EXPENSE` 汇总得到。  
> ✓ `ACCOUNT`、`EXPENSE` —— 有效。

## 2.2 🔴 三种实体类型

![强实体、弱实体、关联实体的画法](images/fig-08.svg)

*三种形状必须记牢，画错形状是最容易被扣分的地方。*

### Strong entity type（记法 · 单线矩形）

- **独立存在**（exists independently of other types of entities）
- 有**自己完整的标识符**，用**单下划线**标出

### Weak entity type 弱实体（记法 · 双线矩形 ＋ 双实线关系 ＋ 双下划线）

- **依赖**于某个强实体，这个强实体叫 **identifying owner**
- **没有自己完整的标识符**（does not have a full identifier of its own）
- **实体框和 partial identifier 都用双线**（entity box and partial identifier have double lines）
- 连接它和 owner 的关系叫 **identifying relationship**，用**双实线**画

![弱实体示例 EMPLOYEE carries DEPENDENT](images/fig-09.svg)

*为什么 Dependent Name 只是 partial identifier：两个不同员工的家属都可能叫「张伟」，只有配上 Employee ID 才唯一。*

> **💼 用业务理解弱实体**
>
> 公司的员工福利包含家属保险，所以公司需要记录每位员工**以及他的每一位家属**。但家属的数据在公司系统里没有独立意义 —— 这个员工一旦离职，他家属的记录立刻失去价值，也没有任何其他业务会引用它。同时公司也从不给家属编号（不会有「家属工号」），所以家属只能靠「哪位员工的 + 叫什么名字」来定位。这两点合起来就是弱实体：**存在依赖 owner**，**标识依赖 owner**。

### Associative entity 关联实体（记法 · 圆角矩形）

- 一个 **many-to-many 关系会被转换成一个 associative entity**
- 它成为两个实体类型之间的**桥**（bridge）
- 它**可以有自己的属性**，也**可能有、也可能没有**自己的标识符

![M:N 转换为关联实体](images/fig-10.svg)

*注意转换后两端都变成 mandatory one（一条选课记录必属于一个学生、一门课），而 many 跑到了关联实体这一侧。*

> **💼 为什么「关联实体」真的是一个实体**
>
> 「张三选了 ISOM5260」这件事本身带着属性：**成绩、选课日期、退课状态**。现在问：这个成绩属于谁？
>
> - 放进 STUDENT？不行 —— 张三有很多门课，每门一个成绩，一个学生行放不下。
> - 放进 COURSE？也不行 —— ISOM5260 有很多学生，每人一个成绩。
>
> 这个成绩**只属于「张三 × ISOM5260」这一对组合**。既然存在一类只属于「组合」的属性，那么「组合」本身就是一种值得记录的东西 —— 它有很多个实例（每一次选课就是一个实例），有多个属性，业务上确实要为它保存数据。**三条「该是实体类型」的标准全部满足**。
>
> 还有一个更硬的理由：关系数据库里**没有办法直接实现 M:N**。一行只能存一个值，你无法在 STUDENT 表的一个格子里塞进 40 门课。M:N 落地时必定变成第三张表，associative entity 就是在概念层提前把这张表画出来。

> **📌 三种实体类型速查**
>
> | 类型          | 画法   | 标识符                         | 什么时候用           |
> | ----------- | ---- | --------------------------- | --------------- |
> | Strong      | 单线矩形 | 自有完整标识符，单下划线                | 默认情况            |
> | Weak        | 双线矩形 | partial identifier，**双下划线** | 存在与标识都依赖 owner  |
> | Associative | 圆角矩形 | 可有可无；没有时用两端标识符组合            | 拆解 M:N，或关系本身带属性 |

## 2.3 🔴 属性 Attributes

**定义**：a property or characteristic of an entity **or relationship** type that is of interest to the user. 注意「or relationship」—— 关系本身也可以有属性（见 2.5 节）。

![属性记法总览](images/fig-11.svg)

*六种属性分类的记法。所有特殊标记的存在理由都是一样的：让未来的业务使用变方便。设计时多花的这点心思，是替以后写查询的人省事。*

### ① Required vs Optional（不画在图上）

记录一个人时，有些特性是必须有的（姓名、学号），有些可有可无（MBTI、家庭住址）。这个区分在 slides 里明确说了：**No need to show this distinction directly in E-R diagrams**. 它属于后续做逻辑设计时才落实的东西。

> **⚠️ 这里有个说法要拧清楚**
>
> **Required 的意思是「不允许为空**」（落到 DBMS 上就是 `NOT NULL` 约束），而不是「为空时给个默认值」。反过来 **Optional 才是允许 NULL 的那一类**。这一点和 2.4 节标识符的第一条规则 “will not be null” 是同一件事——标识符必然是 required 的。

### ② Simple / Atomic attribute

不能再被**有意义地**拆分，也不带任何特殊规则的普通属性。`Gender`、`Birth Date`、`Standard Price` 都是。它是默认形态 —— 其余五种都是在它之上加了一条额外的规则。

### ③ Composite attribute 复合属性 ( … )

可以被拆成**有意义的组成部分**（meaningful component parts），用圆括号把组件括起来。

- `Name (First Name, Last Name)`
- `Home Address (Street Address, City, State, Postal Code)`

> **💼 关键在「meaningful」是谁定的**
>
> 电话号码也能拆成一位一位的数字，为什么它不是复合属性？因为**拆开之后每一位数字在业务上没有任何用处**。「有没有意义」不是客观事实，是**设计者根据业务需要做的决定**。
>
> 决策标准只有一条：**未来会不会单独用到某个组件**？
>
> - 会 —— 客服要按姓氏排序、要发「陈先生您好」的邮件；营销要按 City 做区域销售分析。那就拆，标成 composite。
> - 不会 —— 只是为了打印在快递单上整块用。那就当 simple 存一个字符串。
>
> **代价是不对称的**：一开始就拆了，以后想合起来很容易（拼接就行）；一开始没拆，只存了一个 `Name = "陈大文"`，以后想按姓氏统计就**拿不回来了**（谁知道复姓怎么切？外国人的名字怎么办？）。所以拿不准的时候倾向于拆。

### ④ Multivalued attribute 多值属性 { … }

同一个实例上，这个属性**可以同时取多个值**（may take on more than one value for a given instance），用花括号标出。

- `EMPLOYEE {Skills}` —— 一个员工会多项技能
- `COURSE {Available Languages}` —— 一门课有多种授课语言
- `COURSE {Topic}` —— 一门课涵盖多个主题

> **💼 业务上为什么必须标出来**
>
> 假设 HR 系统里有 200 名员工，现在项目组要找「会 Python 且会 SQL」的人。
>
> 如果当初把技能当成一个普通字符串存成 `"Python, SQL, 项目管理"`，你只能用模糊匹配去搜 —— 搜 `%Java%` 会把 `JavaScript` 也搜出来；想统计「公司里会 Python 的有几个人」得先自己切字符串；某个技能改名（`ML` → `Machine Learning`）要逐行改文本。
>
> 标成 `{Skills}` 就等于告诉后面做逻辑设计的人：**这个属性最终要落成一张单独的表**（员工号 + 技能），一行一个技能。那样上面每一个查询都变成一句普通 SQL。同样的道理：Mario Education 的 `{Available Languages}` 标出来，学生才能按「有中文授课」筛课。

### ⑤ Derived attribute 派生属性 \[ … ]

值可以**从其他相关属性算出来**（values can be calculated from related attribute values），用方括号标出。

- `[Years Employed]` ← `Date Employed` 和当前日期
- `[Duration]` ← `Start Time` 和 `End Time`
- `[Number of Years Launched]` ← `First Launch Date`

> **💼 为什么标出来、又为什么不存**
>
> **不存的理由**：`[Years Employed]` 是会随时间自己变的。如果在表里建一列存「3 年」，明年这个值就错了，你得写一个定时任务每天把全表刷一遍 —— 而只要有一次任务失败，数据就和事实不符，且没人会发现。**凡是能算出来的就不要存**，这和 2.1 节「报表不能当实体」是同一条原则。
>
> **标出来的理由**：正因为不存，如果不在 ER 图上标一笔，后面的开发根本不知道业务需要这个值。标成 `[…]` 相当于一条交接说明：「业务上要用这个数，但别给它建列；到时候在查询里算，或者做成视图／计算列。」实际项目里通常就是代码中一个 `getYearsEmployed()` 之类的函数，或者 SQL 里的一句 `DATEDIFF`。

## 2.4 🔴 标识符 Identifiers

**定义**：an attribute (or combination of attributes) that **uniquely identifies individual instances** of an entity type. 可以先粗略地理解成 primary key。

> **💼 业务上为什么非要有标识符**
>
> 没有标识符，你就**无法指认任何一条特定记录**。同名同姓的两个「陈大文」，客服要改其中一个人的电话 —— 改哪一个？更严重的是**没法被别的实体引用**：订单要记录「这张单是谁下的」，它只能存一个值，这个值必须能唯一地指回一个客户。ER 图里所有的关系，落地时都是靠标识符连起来的。**没有标识符，实体之间就无法建立任何关系**。

### 选标识符的三条规则

| 规则                                       | 业务上为什么                                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Will not be null<br />不能为空               | 空值无法定位记录。slides 的反问很直白：“Can one’s student ID be \[null]?” —— 学号为空的学生，成绩要记到谁头上？而且如果允许为空，两条都为空的记录就无法区分。                                                                            |
| Will not change in value<br />值不会变       | 标识符一旦改变，**所有引用它的地方都要跟着改** —— 成绩单、缴费记录、图书借阅、每一张外键表。漏改一处就是一条孤儿记录。slides 举的 HKUST 例子正是这个用意：UG student ID = PG student ID = Staff ID，同一个人本科毕业读研、读完留校当职员，**身份换了三次，编号始终不变**，历史记录才能连起来。 |
| No intelligent identifiers<br />不要有含义的编号 | 不要把业务含义编进标识符里。“LSK4066Samuel” 把办公室楼号房号和名字都编了进去 —— 这个人换了办公室、或者改了英文名，编号就必须改，**直接违反第二条**。同理，把入学年份编进学号（`2024001`）看着方便，但学生延毕、转学院时就会产生「事实与编号不符」的尴尬。**标识符的唯一职责是唯一，不是携带信息**。             |

### 标识符的几种形态

**a. Simple identifier** —— 单个属性，单下划线。最常见。

**b. Composite identifier 复合标识符** —— 需要**多个属性组合**才能唯一。两种写法：

![复合标识符的两种写法](images/fig-12.svg)

*实例：CX888, 27-APR-2020 / CX888, 29-MAY-2020 / AC007, 1-AUG-2020。同一个航班号每天飞一班，光靠 Flight Number 区分不开。*

> **📌 Slides 的建议**
>
> Substitute new, simple identifiers for long, composite identifiers. —— 业务理由：复合标识符**每一张引用它的表都要复制这几列**，列多了容易写错连接条件、索引也更大更慢；而且只要其中一个组件的业务规则变了，全部引用都要动。造一个没有含义的 `Flight ID`，反而更稳（顺便也满足了第三条「no intelligent identifiers」）。

**c. Partial identifier 部分标识符** —— **双下划线**。用在两个地方：

- **弱实体**：`DEPENDENT` 的 `Dependent Name`，只在同一个员工范围内唯一，完整标识是 `Employee ID + Dependent Name`。
- **关联实体**：slides 里 `SCHEDULE` 的 `Semester`，完整标识是 `Professor ID + Course ID + Semester`。

两种情况的共同点：**这个属性本身不够唯一，必须借 owner／两端实体的标识符补齐**。完整的那个组合写在框外，标注成 Implicit identifier: …。

> **📌 三种实体各自的标识符要求**
>
> - **Strong entity —— 必须有**完整标识符（单下划线）。
> - **Weak entity** —— 没有完整标识符，只有 partial identifier（双下划线）。
> - **Associative entity** —— slides 原话是 “may or may not have an identifier”：可以有自己的（如 Mario Education 里的 `Class Number`），也可以没有（那就用两端标识符组合成 implicit identifier）。

### 额外一招：给时间相关的数据打时间戳

![时间戳建模](images/fig-13.svg)

*一个多值 + 复合的属性：价格历史有多条，每条由「生效日期 + 价格」构成。想保留「某个时点的价格是多少」，就在复合属性里加一个时间戳，这是建模时间相关数据的标准手法。*

## 2.5 🔴 关系 Relationships

**定义**：a relationship is an **association representing an interaction among the instances** of one or more entity types.

**记法**：两实体之间一条**单实线**，线上写一个**单数动词／动词短语**；连向弱实体时改画**双实线**（identifying relationship）；关系自己的属性用**虚线**挂一个方框上去。

> **💼 业务上为什么关系比实体更要紧**
>
> 实体只回答「公司里有哪些东西」，关系回答「这些东西之间发生了什么」。而业务上真正要问的问题，几乎全是关系问题：**哪个客户下了哪张单？这门课排在哪个教室？这笔支出记在哪个账户**？把实体建对但关系建错，数据是齐的，却答不出任何有用的问题。

### 🔴 命名规则

- 用**动词或动词短语**标注，且是**单数形式**（a verb or verb phrase in singular form）
- 可以是**主动语态也可以是被动语态**（active or passive voice）

> **📌 主动还是被动，由读图方向决定**
>
> ER 图有一条不成文的读法：**从左到右、从上到下**。动词要保证按这个方向读出来是一句通顺的话。
>
> - `CUSTOMER` 在左、`ORDER` 在右 → 用主动：Customer **places** Order
> - `ORDER` 在左、`CUSTOMER` 在右 → 用被动：Order **is placed by** Customer

Slides 上 ORDER–CUSTOMER 那条线两端同时标了 `Places` 和 `Is Placed By`，就是把两个方向都写出来，读者从任一端出发都能读通。

### Relationship type vs Relationship instance

![关系类型与关系实例](images/fig-14.svg)

*Type 是实体类型之间的那条线（画在 ER 图上）；instance 是具体实例之间的连线（存在数据库里）。ER 图永远画 type。*

### 关系也可以有属性 Attributes on Relationships

![关系上的属性](images/fig-15.svg)

*用虚线把属性框挂到关系线上。当这种属性变多，或者关系是 M:N 时，就该把它升格成 associative entity（2.2 节）。*

## 2.6 🔴 基数约束 Cardinality Constraints（重点考点）

基数约束就是 business rules 里那些「能不能」「有几个」的限制被画进图里的样子。它由**两个符号**组成，永远成对出现：

> **📌 内外两个符号，各管一件事**
>
> - **最小基数 = 内侧那个**（inner）：**○** 表示 optional，**|** 表示 mandatory
> - **最大基数 = 外侧那个**（outer，靠近实体框的那个）：**|** 表示 one，**<**（鸡爪）表示 many

![四种基数符号](images/fig-16.svg)

*四种组合。注意鸡爪永远贴着实体框（它是最大基数），圆圈／竖线在外侧靠线中间（最小基数）。*

### 🔴 做题方法：只问两个问题（背这个）

> **📌 From A to B**
>
> 1. **一个 A，可以<u>没有</u> B 吗**？  
>    可以 → 最小基数 optional，画 **○**；不可以 → mandatory，画 **|**
> 2. **一个 A，可以有<u>超过一个</u> B 吗**？  
>    可以 → 最大基数 many，画 **<**；不可以 → one，画 **|**
>
> **答案画在 B 那一端**。问「一个 department 能有几个 employee」，符号就画在 EMPLOYEE 框旁边。然后把 A、B 对调再问一遍，得到另一端的符号。

下面这个互动小测把「只问两个问题」变成真的可以点着练——包括两条「白送规律」（弱实体、关联实体连 owner 那一端）：

*（网页版此处可交互：对每条 business rule 回答两个问题，自动算出基数符号；下表是全部题目和答案）*

| A → B                        | Business rule                                                                 | B 端符号                    | 理由                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| EMPLOYEE → DEPARTMENT        | 每位 EMPLOYEE 必须（must）恰好属于一个 DEPARTMENT——不允许没有部门，也不允许同时属于两个部门。                  | **‖（Mandatory One）**     | 「必须」= 不能没有 → mandatory；「恰好一个」= 不能多个 → one。符号画在 DEPARTMENT 这一端：‖                     |
| DEPARTMENT → EMPLOYEE        | 每个 DEPARTMENT 至少要有一名 EMPLOYEE（不允许是空部门），可以有很多名员工。                              | **\|<（Mandatory Many）** | 「至少一名」= 不能没有 → mandatory；「可以有很多」→ many。符号画在 EMPLOYEE 这一端：\|<                       |
| CUSTOMER → LOYALTY CARD      | 一个 CUSTOMER 注册时可能还没申请 LOYALTY CARD（可选）；如果申请了，一个 customer 只能有一张卡。              | **O\|（Optional One）**    | 「可能还没有」= 可以没有 → optional；「只能有一张」→ one。符号画在 LOYALTY CARD 这一端：O\|                     |
| CUSTOMER → ORDER             | 一个 CUSTOMER 刚注册时可能还没下过 ORDER（可选）；下单之后可以有很多笔订单。                                | **O<（Optional Many）**   | 「可能还没有」= 可以没有 → optional；「可以有很多笔」→ many。符号画在 ORDER 这一端：O<                          |
| DEPENDENT → EMPLOYEE         | DEPENDENT 是弱实体，它的存在依赖 identifying owner EMPLOYEE——每一条 dependent 记录必须恰好属于一位员工。 | **‖（Mandatory One）**     | 白送规律：弱实体连它的 owner，owner 那一端必定 mandatory one（‖）——弱实体靠 owner 才能被识别，必须恰好属于一个 owner。    |
| ENROLLMENT → STUDENT         | ENROLLMENT 是 STUDENT 和 COURSE 之间的关联实体（拆解 M:N 而来）——一条选课记录必须恰好对应一位学生。           | **‖（Mandatory One）**     | 白送规律：关联实体连两端实体，两端那一侧都是 mandatory one（‖）——一条记录必然对应恰好一个 A 和恰好一个 B，「many」已经跑到关联实体那一侧了。 |
| COURSE → PREREQUISITE COURSE | 一门 COURSE 可能没有先修课要求（可选）；有先修要求的课，可能同时要求修过好几门先修课。                               | **O<（Optional Many）**   | 「可能没有」= 可以没有 → optional；「同时要求好几门」→ many。符号画在 PREREQUISITE COURSE 这一端：O<            |
| PROJECT → PROJECT MANAGER    | 公司规定每个 PROJECT 必须指派一位、且只能指派一位 PROJECT MANAGER 负责。                             | **‖（Mandatory One）**     | 「必须指派」= 不能没有 → mandatory；「只能一位」→ one。符号画在 PROJECT MANAGER 这一端：‖                     |

| Slides 上的例子                                                    | 问答          | 结论                                   |
| -------------------------------------------------------------- | ----------- | ------------------------------------ |
| 对任一 **department**：<br />能没有 employee 吗？能有多于一个 employee 吗？     | 不能没有；能有多个   | EMPLOYEE 端 = **mandatory many**（一对多） |
| 对任一 **employee**：<br />能不属于任何 department 吗？能属于多个 department 吗？ | 能不属于；不能属于多个 | DEPARTMENT 端 = **optional one**（零到一） |

> **⚠️ 题目没给基数怎么办**
>
> 业务描述里经常只说清一个方向。这时**必须自己做假设，并明确写出来**（clearly stated）。写法：先引用原文说明哪一半是给定的，再说明你假设了另一半是什么、为什么。**不写假设 = 默认扣分；写了假设 = 就算和标准答案不同也能拿分**。

> **📌 两条必须记住的规律**
>
> - **弱实体连强实体时，强实体那一端必定是 mandatory one（‖**）。因为弱实体没有完整标识符，它必须靠 owner 才能被识别 —— 每一个弱实体实例必须**恰好**属于一个 owner，不能没有、也不能有两个。
> - **关联实体连两端实体时，两端也都是 mandatory one**。同理：一条选课记录必然对应恰好一个学生和恰好一门课。「many」跑到了关联实体那一侧。

> **⚠️ 最小基数不一定只有 0 和 1**
>
> Slides 上 `PROFESSOR — is qualified — COURSE` 那张图，在 PROFESSOR 端的竖线下面直接写了一个数字 **2**，表示「一门课至少要有 2 位有资格的教授」。**最小基数可以是任意数字，直接标在符号旁边**。

## 2.7 🔴 关系的度 Degree of a Relationship

**定义**：degree 是**参与这个关系的实体类型的个数**（the number of entity types that participate in it）。

### Unary（Degree 1）—— 一元／递归关系

同一个实体类型自己和自己发生关系。画法是一条从实体框出去又回到自己身上的线。

![三种一元关系](images/fig-17.svg)

*Slides 用的 M:N 例子是车轮：「Sporty Rim」既是由「Rim Body + Japan Wheel Cap」组成的成品，又是「Race Wheel」和「Snow Racing Wheel」的组件。*

> **💼 为什么一元关系在业务上很重要**
>
> 如果不认识一元关系，看到「员工和经理」你会本能地建**两张表**：EMPLOYEE 和 MANAGER。后果是：
>
> - 经理本身也是员工，他的姓名、工号、薪资在两张表里各存一份 —— **数据重复**。
> - 一个员工升职当经理，你要在 EMPLOYEE 里改状态，还要在 MANAGER 里插一行；他离职时又要两边删 —— **迟早不一致**。
> - 层级只能有两层。总监管经理、经理管员工，难道再建一张 DIRECTOR 表？
>
> 用一元关系，只有一张 EMPLOYEE 表，自己引用自己，**层级要多深有多深**。同样的道理适用于：物料清单（零件由零件组成）、组织架构、评论的回复、账户的推荐人关系。

### Binary（Degree 2）

两个实体类型之间的关系，最常见的形态。Mario Education 那份作业里除了一元关系之外全是二元关系。

### Ternary（Degree 3）—— 三元关系

![三元关系 supplies](images/fig-18.svg)

*三条腿交汇于一点，属性挂在交汇点上。*

> **💼 为什么不能拆成三个二元关系**
>
> 看上去可以拆成 Vendor–Part、Vendor–Warehouse、Part–Warehouse 三条二元关系，但那样**会永久丢失信息**：
>
> - 你知道「X 供 C」「X 供货给 Y」「C 存在 Y」，但**无法确定这三条说的是同一笔安排**。X 可能供 C 给别的仓库，同时供别的零件给 Y。
> - 更要命的是 `Unit Cost` **无处安放**。单价是「X 供 C 到 Y」这一个三元组合才有的，放进任何一条二元关系都是错的。
>
> **判据**：当一个事实必须三个实体**同时到场**才成立，它就是三元关系，不能拆。

### 三元关系落地：转成 associative entity

![三元关系转为关联实体](images/fig-19.svg)

*三条腿都连到圆角矩形上。每条腿在父实体那一端是 one（一条供货安排只对应一个供应商／零件／仓库），在关联实体那一端是 many。属性终于有了合法的家。*

## 2.8 🟡 同两个实体之间的多重关系

![多重关系](images/fig-20.svg)

*同样是 EMPLOYEE 和 DEPARTMENT，works in 和 manages 是两条完全独立的关系，基数也不同（每个部门有很多员工，但只有一位经理）。左边的 supervises 则是 EMPLOYEE 的一元关系。*

**不能合并成一条线**。「张三在市场部工作」和「张三管理市场部」是两件不同的事实，合成一条线就分不清一个部门的 50 个员工里谁是经理。业务上要问「谁是市场部负责人」，就必须有独立的 `manages`。

---

**Part 3 · 做题技巧：四轮扫描法**

ER 图**只有四种元素**：entity、attribute、relationship、cardinality。做题就是拿着这四个筐，把业务描述**从头到尾扫四遍**，每遍只找一种东西。一遍找一种，比一句一句边读边画要稳得多——因为后面的句子经常会改写前面的判断。

![四轮扫描法](images/fig-21.svg)

*第 0 步：先通读一遍，不动笔。目的只有一个——知道总共有哪些东西，以及哪几句话其实在讲同一个东西。*

### 在卷面上做标记

四种元素用四种标记，扫完一轮就多一层标记。扫完四轮，整张纸就是一张 ER 图的草稿：

> **📌 标记示例（取自 Assignment 1）**
>
> ME wants to store details of 【**course**】. Relevant details include 〔**course id**〕, 〔**name**〕, 〔**description**〕, 〔**available languages**〕, 〔**first launch date**〕 and 〔**number of years launched**〕.
>
> Each 【**course**】 ⟨**must**⟩ be *categorized* under one 【**level**】. A level can have ⟨**many**⟩ different courses, but some level newly created ⟨**may not**⟩ have any course associated yet.
>
> Each time a 【**course**】 is *scheduled* in one or more 【**venues**】, ME makes an entry in 【**class schedule**】. Class schedule data includes 〔**class number**〕, 〔**date**〕, 〔**start time**〕, 〔**end time**〕, and 〔**duration**〕.
>
> 【**方框**】 = entity · 〔**黄底**〕 = attribute · *波浪线* = 动词 → relationship · ⟨**圈起来**⟩ = must / may / many → cardinality

## 3.1 第一轮：找 Entity

**动作**：圈出所有名词，尤其是句子的主语和宾语；对每个候选用 2.1 节的三条标准筛一遍（有很多实例／有多个属性／业务确实要记）；留下来的再判类型。

### 判 strong 还是 weak

> **📌 weak 的两个信号，通常同时出现**
>
> 1. **措辞上有存在依赖**。找 “only when…”、“as long as…”、“if X is removed, this is meaningless” 这类限定。  
>    Assignment 原文：“*ME would like to keep data about the video … **only when the courses are still offered by ME***.” —— 这句话就是在说 VIDEO 的存在依赖 COURSE。
> 2. **题目没给它独立 ID**。其他实体都给了 course id、venue id、hashtag id，唯独 video 只给了 video name 和 video file。**出题人漏给 ID，往往就是在暗示这是弱实体**。

**画法**：双线矩形，标识属性用**双下划线**（partial identifier），连向 owner 的线画**双实线**。

### 判 associative——这一步最容易判错

> **⚠️ 「跟两个实体都有关系」不能当判据**
>
> COURSE 同时连着 LEVEL、SYLLABUS、VIDEO、CLASS SCHEDULE、HASHTAG，连了五个，但它是**强实体**。「连了两个」只是关联实体的表象，不是它的定义。

> **📌 真正的判据（三条，命中任意一条即可）**
>
> 1. **它的每一个实例，本身就是「A 的某一个 × B 的某一个」这个配对**。  
>    反过来检验：*把两端任意一端删掉，这条记录还有意义吗*？ 一条 class schedule 记录，如果没有课程，或者没有场地，它就什么都不是 → 它是配对本身 → associative。  
>    对照：一门 course 就算还没排课、还没配 hashtag，它依然是一门课 → 不是配对 → strong。
> 2. **它带的属性只属于这个配对**，塞进任何一端都塞不下（2.2 节的成绩例子）。
> 3. **描述里出现了 M:N**。“Some courses may use multiple hashtags” + “the same hashtag can be used … for one course” —— 两个方向都是 many，这条 M:N 必须落成一个关联实体。
>
> **还有一个语感上的信号**：描述里出现「每当 A 发生 B，系统就<u>记一条</u>」这种句式。“*Each time a course is scheduled in one or more venues, ME **makes an entry in** class schedule*.” —— “makes an entry” 直接告诉你：这条记录是由「课程 × 场地」这个动作产生的。

**画法**：圆角矩形。

### Assignment 1 的判定结果

| 候选               | 判定              | 依据                                                                                                           |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| COURSE           | Strong          | 有 course id，独立存在                                                                                             |
| DIFFICULTY LEVEL | Strong          | 有 Level ID；“some level … may not have any course associated yet” 说明它离开 course 也存在                            |
| HASHTAG          | Strong          | 有 hashtag id；“the hashtags are stored in the database” 是独立存储                                                 |
| SYLLABUS         | Strong          | 有 syllabi ID；“Not all syllabi … are currently followed” 说明没有课也能存在                                            |
| TEACHING VENUE   | Strong          | 有 Venue id；“some teaching venues may be scheduled with no class”                                             |
| VIDEO            | **Weak**        | “only when the courses are still offered” + 没给独立 ID                                                          |
| CLASS SCHEDULE   | **Associative** | “Each time a course is scheduled in one or more venues, ME makes an entry in class schedule” —— 由「课程 × 场地」产生 |
| HASHTAG USAGE    | **Associative** | course 与 hashtag 是 M:N；且 social media platform 是**关系**的属性，无处可放                                               |

> **💼 为什么 SOCIAL MEDIA PLATFORM 不是一个独立实体**
>
> 题目原话是 “***One attribute of the relationship** between course and hashtag is the social media platforms using the hashtag*.” —— 它自己就说了这是**关系的属性**。如果把它建成独立实体，它就变成了「平台清单表」（Facebook、Instagram 各一行），而实际要记的是「A 课程的 B 标签发在 C 平台上」这个三元组合。这正是判据②：属性只属于配对。

## 3.2 第二轮：找 Attribute

题目通常会把每个实体的属性一次性列清楚（“Relevant details include…”、“Its attributes include…”、“…are basic data of…”）。这一轮的重点**不是找，而是分类**。

要画在图上的只有**五类**——required / optional 不画（2.3 节）。按下面的顺序问，第一个命中就是答案：

| 顺序 | 问句                | 是 → 分类      | 记法             |
| -- | ----------------- | ----------- | -------------- |
| 1  | 它能唯一确定这个实体的一个实例吗？ | Identifier  | 下划线（见下）        |
| 2  | 同一个实例上，它能同时有多个值吗？ | Multivalued | { Attr }      |
| 3  | 它能拆成**有意义**的组件吗？  | Composite   | Attr (1, 2, 3) |
| 4  | 它能由别的属性算出来吗？      | Derived     | \[ Attr ]      |
| 5  | 以上都不是             | Simple      | 无标记            |

> **⚠️ 第 4 问经常要靠自己发现**
>
> 题目**不会**告诉你「number of years launched 是算出来的」。它只是把它和 first launch date 并排列在一起。你要自己看出这两者的关系，做出假设并写明：“*Number of years launched is derived from first launch date and the current date; it is not stored*.” 同一句里的 `start time / end time / duration` 也是同一个套路。**这两处是这份作业里最容易整份丢掉的分**。

### 标识符的三种形态怎么判

| 形态        | 记法                    | 判法                                                                                                                  |
| --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Simple    | 单下划线                  | 单独一个属性就能唯一确定实例。`Course ID`、`Venue ID`、`Level ID` —— 名字里带 ID 的基本都是。                                                  |
| Composite | 两个都加单下划线<br />（或另造一个） | 单独任何一个都不够，两个合起来才唯一。slides 的 FLIGHT：`Flight Number` 每天重复、`Flight Date` 每天几百班，各自都不唯一，合起来才唯一。**Assignment 1 里没有这种情况**。 |
| Partial   | 双下划线                  | 它只在**某个父实体范围内**唯一，必须借父实体的 ID 才能补齐。                                                                                  |

> **⚠️ 修正一条常见的误记**
>
> 「**weak entity 一定有 partial identifier」——对**。弱实体按定义就没有完整标识符。
>
> 「**associative entity 一定有 partial identifier」——不对**。Slides 原话是 “It may have its own attributes, and **may or may not have an identifier**.” 三种情况都存在：
>
> - **有自己完整的 identifier** → **单**下划线。Assignment 1 的 `CLASS SCHEDULE` 就是这种，题目给了 `class number`。
> - **只有 partial identifier** → **双**下划线。slides 的 `SCHEDULE`，`Semester` 只在同一对「教授 × 课程」内唯一。
> - **什么标识属性都没有** → 框里不写，只在框外注明 Implicit identifier: A ID + B ID。slides 的 `Completion` 就是这种。
>
> **判断问句**：这个属性<u>单独拿出来</u>，能不能在全表范围内唯一？能 → 单下划线；不能、但配上两端 ID 就能 → 双下划线；根本没有这么一个属性 → 只写 implicit identifier。

### Assignment 1 的属性分类

| 实体               | 属性与分类                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COURSE           | <u>Course ID</u> · Name · Description · **{Available Languages}**（“like English, Chinese and French” 明示多值）· First Launch Date · **\[Number of Years Launched]**（自己看出的派生） |
| DIFFICULTY LEVEL | <u>Level ID</u> · Name · Target Student Group · **Study Coordinator (First Name, Last Name**)（“including the first name and last name” 明示复合）· Enquiry Phone Number        |
| HASHTAG          | <u>Hashtag ID</u> · Description · Text                                                                                                                                    |
| VIDEO            | **Video Name**（双下划线，partial）· Video File<br />Implicit identifier: Course ID + Video Name                                                                                 |
| SYLLABUS         | <u>Syllabi ID</u> · Text · Designer Name · Designer Notes                                                                                                                 |
| TEACHING VENUE   | <u>Venue ID</u> · Address · Capacity · Coordinating Person · Telephone                                                                                                    |
| CLASS SCHEDULE   | <u>Class Number</u>（单下划线，题目给了完整 ID）· Date · Start Time · End Time · **\[Duration]**                                                                                       |
| HASHTAG USAGE    | **Social Media Name**（双下划线，partial）<br />Implicit identifier: Course ID + Hashtag ID + Social Media Name                                                                  |

## 3.3 第三轮：找 Relationship

**动作**：在描述里找**动词**——它把两个已经圈出来的实体连在一起。找到一个就画一条线，并把那个动词直接抄上去。

Assignment 1 里的动词几乎是明写的：`categorized under`、`be associated to`、`be offered with`、`is following`、`is scheduled in`、`is using`。

> **📌 标签三条规矩**
>
> - 动词或动词短语，**单数形式**
> - 主动、被动都行，但要保证**从左到右、从上到下**读出来通顺
> - 关联实体两侧的连线，按 slides 的画法**可以不标动词**（slide 35、43 都是空的）

> **💼 反过来用：从动词发现关联实体**
>
> 你在第一轮如果漏判了，第三轮找动词时还有一次机会。“*Some teaching venues may be **scheduled** with no class while some other teaching venues are **scheduled** with multiple classes*.” —— 同一个动词 `schedule` 既连着 course 又连着 venue，而 `class schedule` 这个名词本身又被给了一整套属性。**一个动词被名词化、还带着自己的属性，它就是关联实体**。

| 关系                              | 来源动词        | 说明                                                            |
| ------------------------------- | ----------- | ------------------------------------------------------------- |
| DIFFICULTY LEVEL — COURSE       | categorizes | “Each course must be **categorized** under one level”         |
| COURSE — VIDEO                  | is offered  | “Each course may be **offered** with videos”；双实线（identifying） |
| COURSE — SYLLABUS               | follows     | “Each course is **following** one and only one syllabus”      |
| COURSE — CLASS SCHEDULE         | —           | 关联实体两侧，按 slides 可不标动词                                         |
| CLASS SCHEDULE — TEACHING VENUE | —           |                                                               |
| COURSE — HASHTAG USAGE          | —           | 同上                                                            |
| HASHTAG — HASHTAG USAGE         | —           |                                                               |

## 3.4 🔴 第四轮：定 Cardinality（最难也最值钱）

不要一上来就一条一条问。先用**两条白送的规律**把能确定的填掉，剩下的才需要动脑。

> **📌 Step 1 · 两条白送的规律**
>
> - **弱实体**连它的 owner：**owner 那一端必定 mandatory one（‖**）。因为弱实体靠 owner 才能被识别，必须恰好属于一个 owner。  
>   → COURSE — VIDEO：COURSE 端直接填 ‖。
> - **关联实体**连两端实体：**两端实体那一侧都是 mandatory one（‖**）。一条记录必然对应恰好一个 A 和恰好一个 B。  
>   → CLASS SCHEDULE 两条线的 COURSE 端和 VENUE 端、HASHTAG USAGE 两条线的 COURSE 端和 HASHTAG 端，全部填 ‖。

光这一步，Assignment 1 的 14 个端点里就填掉了 **5 个**，一个问题都没问。

> **📌 Step 2 · M:N 转成关联实体时，符号怎么搬**
>
> 关联实体那一侧的符号**不是新想的，是从原来的 M:N 搬过来的**，而且是**交叉**搬：原来贴着 B 的符号，搬到关联实体**靠 A 的那一侧**。

![M:N 转关联实体时基数符号的搬移](images/fig-22.svg)

*验算：转换前「贴 COURSE 的 O<」回答的是一个员工修几门课 = 0..M；转换后它变成一个员工有几条 completion 记录 = 0..M —— 同一句话。另一侧同理。*

> **📌 Step 3 · 剩下的，每一端问两个问题**
>
> 1. 一个 A，可以**没有** B 吗？ → 有 **○**，没有 **|**（最小基数，内侧）
> 2. 一个 A，可以有**多于一个** B 吗？ → 可以 **<**，不可以 **|**（最大基数，外侧）
>
> 答案画在 **B 那一端**。然后把 A、B 对调，再问一遍。

> **💼 Step 4 · 答案只能从描述里推，推不出就 assume**
>
> 关键词往往就藏在一个词里：`must`／`only one` → mandatory / one；`may`／`not all`／`some … may not` → optional；`many`／`multiple` → many。所以第一轮做标记时，把这些词圈出来是有用的。
>
> 找不到任何一句能支持的，就**做假设并明确写出来**。写法：先引用原文说明哪一半是给定的，再说明你假设了另一半是什么、为什么。

| 端点                               | 符号  | 来源                                                                                       |
| -------------------------------- | --- | ---------------------------------------------------------------------------------------- |
| COURSE → DIFFICULTY LEVEL        | ‖   | “**must** be categorized under **one** level”                                            |
| DIFFICULTY LEVEL → COURSE        | O< | “can have **many**… some level **may not** have any course”                              |
| COURSE → VIDEO                   | O< | “**may** be offered with video**s**… **Not all** courses are offered”                    |
| VIDEO → COURSE                   | ‖   | Step 1 白送（弱实体）                                                                           |
| CLASS SCHEDULE → COURSE          | ‖   | Step 1 白送 ＋ “a class can be scheduled for **only one** course”                           |
| COURSE → CLASS SCHEDULE          | O< | “**may** be scheduled with **many** classes”                                             |
| CLASS SCHEDULE → TEACHING VENUE  | ‖   | Step 1 白送 ＋ “**must** be using **only one** teaching venue”                              |
| TEACHING VENUE → CLASS SCHEDULE  | O< | “some venues **may be scheduled with no class**… others… **multiple** classes”           |
| HASHTAG USAGE → COURSE / HASHTAG | ‖ ‖ | Step 1 白送（关联实体）                                                                          |
| COURSE → HASHTAG USAGE           | O< | “**may** be associated… some courses may use **multiple** hashtags”                      |
| HASHTAG → HASHTAG USAGE          | O< | “the **same** hashtag can be used on **different** social media platform for one course” |
| SYLLABUS → COURSE                | ‖   | “**one and only one** syllabus”                                                          |
| ❌ COURSE → SYLLABUS              | O\| | 最小值来自 “**Not all** syllabi… are currently followed”；**最大值全文无明文 → 必须 assume**             |

> **⚠️ 这份作业唯一需要基数假设的地方**
>
> 题目说了「每门课恰好跟一份 syllabus」和「有些 syllabus 没被任何课使用」，但**从没说过一份 syllabus 能不能同时被多门课使用**。两个方向都讲得通：
>
> - **假设最多一门课**（→ `O|`，1:1）：每门课的结构和进度都不同，syllabus 是为这门课单独写的。
> - **假设可以多门课**（→ `O<`，1:M）：ME 有一份通用大纲模板，同一级别的多门课共用。
>
> **两种都能拿分，前提是写出来**。可以直接抄这个句式：  
> The description states that each course follows exactly one syllabus, and that some syllabi are not currently followed by any course. It does not state whether one syllabus may be shared by several courses. I assume a syllabus can be followed by **at most one** course, so the COURSE end of *follows* is optional one and the relationship is 1:1.

## 3.5 交卷前

四轮扫完，最后按[附录 B 的十二条清单](#trap)过一遍。另外三件容易被忘的事：

- **非基数的建模判断也要写进 assumptions**。「VIDEO 视为弱实体」「CLASS SCHEDULE 与 HASHTAG USAGE 视为关联实体」「Number of Years Launched 与 Duration 为派生属性，不入库」—— 这些是你的判断，不是题目给的，写出来才算数。
- **题目里自相矛盾的地方要点出来**。“scheduled in **one or more** venues” 和 “A given class schedule must be using **only one** teaching venue” 表面冲突，要说明你按后者理解：一门课在多个场地上课时，每个场地各生成一条 class schedule 记录。
- **图里画不下的规则，用文字补**。Slides 明说了 some business rules cannot be represented in E-R diagram —— 文字说明是答案的一部分。

> **📌 四轮扫描一句话版**
>
> **①** 圈名词定实体，用「存在依赖 + 没给 ID」判弱实体，用「这条记录是不是一个配对」判关联实体 → **②** 每个属性按「唯一 / 多值 / 可拆 / 可算 / 都不是」五问归类，标识符按「单独够不够唯一」决定单双下划线 → **③** 找动词连线，单数形式，主被动看读图方向 → **④** 先填弱实体和关联实体白送的 ‖，再对剩下每一端问两个问题，答不出来的写成 assumption。

---

**附录 A · 记法总表**

| 画法             | 含义                       | 要点                                              |
| -------------- | ------------------------ | ----------------------------------------------- |
| 单线矩形           | Strong entity            | 独立存在，有自己完整的标识符                                  |
| 双线矩形           | Weak entity              | 依赖 identifying owner；框和 partial identifier 都是双线 |
| 圆角矩形           | Associative entity       | M:N 拆解而来；可有可无自己的标识符                             |
| 单实线            | 普通关系                     | 用单数动词／动词短语标注                                    |
| 双实线            | Identifying relationship | 连接弱实体与它的 owner                                  |
| 虚线 + 方框        | Relationship attribute   | 属性挂在关系线上                                        |
| Attribute      | Identifier               | 单下划线                                            |
| Attribute（双线）  | Partial identifier       | 双下划线；弱实体与部分关联实体用                                |
| Attribute      | Simple attribute         | 无标记                                             |
| Attr (1, 2, 3) | Composite attribute      | 圆括号列出有意义的组件                                     |
| {Attr}        | Multivalued attribute    | 花括号                                             |
| \[Attr]        | Derived attribute        | 方括号；不入库，用时计算                                    |
| ‖              | Mandatory one            | 内 mandatory + 外 one                             |
| \|<           | Mandatory many           | 内 mandatory + 外 many                            |
| O\|            | Optional one             | 内 optional + 外 one                              |
| O<            | Optional many            | 内 optional + 外 many                             |
| 符号旁数字          | 具体的最小基数                  | 如 `2` 表示「至少两个」                                  |

> **⚠️ 记法是会变的**
>
> Slides 最后一页专门放了一张 **MS Visio** 的图并说明：different modeling software tools may have different notation for the same constructs。Visio 里用**虚线**区分 non-identifying relationship，而本课程的记法里普通关系一律**单实线**、双实线才表示 identifying。**考试和作业一律按上面这张表**。

---

**附录 B · 易错清单**

画完一张 ER 图，照这个单子过一遍。

| ✓  | 检查项                                                                 |
| -- | ------------------------------------------------------------------- |
| 01 | 实体名是**单数名词**，且是**类型**不是**实例**（没有 `PETER LEE` 这种）。                   |
| 02 | 没有把**系统生成的输出**（报表、汇总）建成实体。                                          |
| 03 | 每个强实体都有**单下划线**的标识符；弱实体和用 partial identifier 的关联实体是**双下划线**。        |
| 04 | 三种实体**形状**画对了：单线矩形 / 双线矩形 / 圆角矩形。                                   |
| 05 | 弱实体那条线是**双实线**；其余关系是**单实线**（不要画虚线）。                                 |
| 06 | 弱实体 / 关联实体连向父实体那一端是 **mandatory one（‖**）。                           |
| 07 | 没有留下未拆解的 **M:N**（或者刻意保留并说明）；关系上的属性有地方放。                             |
| 08 | 多值属性 `{}`、派生属性 `[]`、复合属性 `()` 都标了 —— 这三个最常漏。                        |
| 09 | 每条**普通**关系线都有单数动词标签，且主动／被动符合「从左到右、从上到下」的读法。（关联实体两侧的连线按 slides 可以不标） |
| 10 | **每一端**都有一对基数符号 —— 内侧管最小、外侧管最大，两个都不能少。                              |
| 11 | 题目没说清的基数，写成了**明确的 assumption**，并引用了原文说明哪一半是给定的。                     |
| 12 | 无法用图表达的 business rule（如「一学期最多 18 学分」）用**文字**补充说明。                   |

> **📌 一分钟回顾**
>
> 信息系统三层 → 底层是 DBMS → 先做企业数据建模决定立哪些项目 → 项目按 SDLC 或原型法开发 → SDLC 的 **Analysis** 阶段做 conceptual data modeling → 产物是 **E-R 图** → ER 图 = 实体（强／弱／关联）+ 属性（六种记法）+ 关系（动词 + 一对基数符号）→ 图画不下的规则，用文字写成 assumptions。

---

## 模拟自测题（自我检查用，不代表真实考题）

**Enterprise Data Model 和 Project Data Model 有什么区别？**

> **范围**：Enterprise Model 覆盖整个组织，Project Model 只覆盖单个项目/业务职能。**粒度**：Enterprise Model 宏观，通常只有实体名和主要关系、不含属性；Project Model 细致，所有实体、关系、**属性**、business rules 全都要有。**关系**：Project Model = 把 Enterprise Model 中相关的那一块取出来细化 + 扩展，两者必须保持一致。

**为什么「系统生成的输出」（如报表）不能建成一个实体类型？**

> 报表里的每个数字都是从已存在的数据算出来的——把报表也建成表会带来三个问题：① **数据重复**（同一笔数据存了两份）；② **更新异常**（原始数据改了，报表那份不会自动跟着变）；③ **没有独立存在性**（报表只是「看数据的一种方式」，换个筛选条件就是另一张报表）。正确做法是报表在需要时由查询实时生成——这和 derived attribute「不存、用时算」是同一个原则。

**强实体、弱实体、关联实体分别怎么画？各自的标识符要求是什么？**

> **Strong entity**：单线矩形，有自己完整的标识符（单下划线）。**Weak entity**：双线矩形，没有完整标识符，只有 partial identifier（双下划线），连向 owner 的线画双实线。**Associative entity**：圆角矩形，"may or may not have an identifier"——可以有自己完整的标识符（单下划线），也可以只有 partial identifier（双下划线），也可以完全没有（用两端标识符组合成 implicit identifier）。

**判断一个候选实体是不是 associative entity，真正的判据是什么？「它跟两个实体都有关系」算不算判据？**

> 「跟两个实体都有关系」**不能**当判据——COURSE 同时连着 LEVEL、SYLLABUS、VIDEO 等五个实体，但它是强实体。真正的判据（命中任意一条即可）：① 它的每一个实例本身就是「A 的某一个 × B 的某一个」这个配对，把任意一端删掉这条记录就没有意义；② 它带的属性只属于这个配对，塞进任何一端都塞不下；③ 描述里出现了 M:N 关系，M:N 必须落成一个关联实体（因为关系数据库没法直接实现 M:N）。

**Multivalued、Composite、Derived 三种属性分别怎么标记？为什么派生属性「标出来但不存」？**

> **Multivalued（多值）** 用花括号 `{Attr}`，同一实例可以同时取多个值（如 `EMPLOYEE {Skills}`）。**Composite（复合）** 用圆括号 `Attr (a, b, c)`，可以拆成有意义的组件（如 `Name (First, Last)`）。**Derived（派生）** 用方括号 `[Attr]`，值可以从其他属性算出来（如 `[Years Employed]`）。不存的理由：派生值会随时间自动变化，存一份很快就会过期、且没人会发现算错；标出来的理由：不标的话后面开发根本不知道业务需要这个值，标出来相当于交接说明「用时再算，别建列」。

**选标识符的三条规则是什么？为什么「有含义的编号」（intelligent identifier）是个坏主意？**

> 三条规则：① **Will not be null**——空值无法定位记录；② **Will not change in value**——标识符一旦改变，所有引用它的地方都要跟着改，漏改一处就是孤儿记录；③ **No intelligent identifiers**——不要把业务含义编进标识符里。有含义的编号是坏主意，因为一旦编码依据的业务事实变了（换了办公室、入学延毕），编号就必须跟着改，直接违反第二条「值不会变」。标识符唯一的职责是唯一，不是携带信息。

**判断基数约束的「两个问题法」是什么？「弱实体连 owner」「关联实体连两端实体」这两条白送规律分别怎么用？**

> 两个问题（答案画在 B 那一端）：① 一个 A 可以没有 B 吗？可以 → optional（○）；不可以 → mandatory（|）。② 一个 A 可以有多于一个 B 吗？可以 → many（鸡爪）；不可以 → one（|）。两条白送规律：弱实体连它的 owner，owner 那一端必定 **mandatory one（‖）**（弱实体必须恰好属于一个 owner 才能被识别）；关联实体连两端实体，两端那一侧都是 **mandatory one（‖）**（一条记录必然对应恰好一个 A 和恰好一个 B，"many" 已经跑到关联实体那一侧了）。

**Unary、Binary、Ternary 关系分别是什么？为什么三元关系不能拆成三个二元关系？**

> **Unary（一元/递归）**：同一实体类型自己和自己发生关系（如 EMPLOYEE 的 manages）。**Binary（二元）**：两个实体类型之间的关系，最常见。**Ternary（三元）**：三个实体类型同时参与才成立的关系。三元关系不能拆成三个二元关系，因为拆开会永久丢失信息——你知道「X 供 C」「X 供货给 Y」「C 存在 Y」，但无法确定这三条说的是不是同一笔安排；而且像 `Unit Cost` 这种只属于「X 供 C 到 Y」这个三元组合的属性，放进任何一条二元关系里都无处安放。

**四轮扫描法的四轮分别找什么？为什么要分开扫，而不是边读边画？**

> 第一轮找 **Entity**（圈名词，尤其主语宾语，按三条标准筛：有很多实例/由多个属性描述/数据库确实需要建模）；第二轮找 **Attribute**（按五问分类：能唯一确定实例吗→identifier；能同时多个值吗→multivalued；能拆成有意义组件吗→composite；能算出来吗→derived；都不是→simple）；第三轮找 **Relationship**（找动词，单数形式，主被动看读图方向）；第四轮定 **Cardinality**（先用白送规律填掉弱实体/关联实体的一端，剩下每端问两个问题）。分开扫比边读边画稳，是因为后面的句子经常会改写前面的判断——一遍只找一种东西，不会被后续信息打乱已经做的判断。

---
