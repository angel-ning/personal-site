---
title:
  en: "Unit 9 · List of Dictionaries: A Table of Records"
  zh: "第 9 单元 · list of dicts：一张「每行一条记录」的表"
summary:
  en: "Records as dicts inside a list (alerts, tickets), row['field'] inside a loop, if / elif labelling per row, collecting ids with a comprehension or append, and the ticket-list practice."
  zh: "list 里装 dict（告警、工单）；循环里用 row['字段']；逐行 if / elif 定级；用推导式或 append 收集 id，附 Practice P3 解答。"
unit: 9
date: 2026-11-06
tags: [Python, list of dicts, Nested data, Records]
---
# Unit 9 · list of dicts：一张「每行一条记录」的表

**这一单元学什么**：把 U6–U8 组合起来——一个 list，里面每个元素是一个 dict。这就是 Excel 表格在 Python 里的样子：**list = 整张表，每个 dict = 一行，dict 的键 = 列名**。  
**对应材料**：Day 2 data-structures notebook Section 4（cell 28–34）。

> **🎯 为什么这一单元特别重要**
>
> U11–U15 的 Hugging Face pipeline，绝大多数返回的就是 **list of dicts**：`[{'label': 'POSITIVE', 'score': 0.9998}]`。这一单元的取值方法，就是之后读懂 AI 模型输出的方法。

---

## 0. 生词表

| 术语                | 大白话                             | 例子                                        |
| ----------------- | ------------------------------- | ----------------------------------------- |
| **record** 记录 / 行 | 一个 dict，描述一件东西（一条告警、一张工单）       | `{"alert_id": "AL-2001", "score": 92, …}` |
| **field** 字段 / 列  | dict 的一个键                       | `"score"`                                 |
| **nested** 嵌套     | 容器里面再装容器                        | list 里装 dict                              |
| **row**           | notebook 里习惯给循环变量起的名字，表示「当前这一行」 | `for row in alerts:`                      |

```
alerts  ──►  [  {alert_id, subject, score, channel},   ← alerts[0]
                {alert_id, subject, score, channel},   ← alerts[1]
                {alert_id, subject, score, channel}  ] ← alerts[2]

alerts[0]            → 第一行（一整个 dict）
alerts[0]["score"]   → 第一行的 score 这一格 → 92
```

---

## 1. 🔴 逐行处理：循环 + 按键取 + if 定级

**▶ Demo – walk phishing-like alert rows**（Day 2 · cell 30）

```python
# Demo: list of dictionaries - IT security alerts
alerts = [
    {
        "alert_id": "AL-2001",
        "subject": "Urgent wire transfer request",
        "score": 92,
        "channel": "email",
    },
    {
        "alert_id": "AL-2002",
        "subject": "Password reset notice",
        "score": 55,
        "channel": "email",
    },
    {
        "alert_id": "AL-2003",
        "subject": "Unusual VPN login",
        "score": 78,
        "channel": "vpn",
    },
]

print("Alert queue for security analyst:")
for row in alerts:
    score = row["score"]
    if score >= 90:
        flag = "CRITICAL"
    elif score >= 70:
        flag = "REVIEW"
    else:
        flag = "MONITOR"
    print(f"{row['alert_id']} | {flag} | {row['channel']} | {row['subject']}")
```

| 行  | 代码                                                                              | 在做什么                                                               |
| -- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1  | `# Demo: list of dictionaries - IT security alerts`                             | 注释：list 里装 dict = 一张「表格」，每个 dict 是一行。                              |
| 2  | `alerts = [`                                                                    | 外层是 list（方括号）。                                                     |
| 3  | `{`                                                                             | 第 1 行记录（一个 dict）开始。                                                |
| 8  | `},`                                                                            | 第 1 行结束，逗号隔开下一行。                                                   |
| 21 | `]`                                                                             | 整个 alerts 到这里才建完——上面 20 行是一条语句。                                    |
| 24 | `for row in alerts:`                                                            | 遍历 list：每次 `row` 是**一整个 dict**（一行记录）。                              |
| 25 | `score = row["score"]`                                                          | 从这一行里按键取分数，存进 score 方便后面用。                                         |
| 26 | `if score >= 90:`                                                               | 按分数分级：先看最高的门槛。                                                     |
| 32 | `print(f"{row['alert_id']} \| {flag} \| {row['channel']} \| {row['subject']}")` | f-string 外面用双引号，`{}` 里的键就用**单引号** `row['alert_id']`，不然引号会提前把字符串关掉。 |

运行结果：

```text
Alert queue for security analyst:
AL-2001 | CRITICAL | email | Urgent wire transfer request
AL-2002 | MONITOR | email | Password reset notice
AL-2003 | REVIEW | vpn | Unusual VPN login
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

先点点看数据，体会「先 `[位置]` 取一行，再 `["键"]` 取一格」：

*（网页版此处可以点数据里的任意一个值，自动写出取到它的代码，并逐层说明每一步拿到的是什么）*

**list of dicts：告警（Day 2 cell 30）**

| 代码                   | 拿到的是                                                         | 值                                                              |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `alerts`             | list，3 个元素 → 下一步用 \[位置] 取                                    | `[{'alert_id': 'AL-2001', 'subject': 'Urgent wire transfer r…` |
| `alerts[2]`          | dict，键：alert\_id / subject / score / channel → 下一步用 \["键"] 取 | `{'alert_id': 'AL-2003', 'subject': 'Unusual VPN login', 'sc…` |
| `alerts[2]["score"]` | int：最终的值                                                     | `78`                                                           |

*（网页版此处可以拖动 / 选择变量的值，看 if / elif / else 从上往下哪一支被选中：告警分级（Day 2 cell 30））*

```python
if score >= 90:
    ...
elif score >= 70:
    ...
else:
    ...
```

| 输入           | 每个条件  | 走哪一支                | 结果                |
| ------------ | ----- | ------------------- | ----------------- |
| `score = 92` | ✓ – – | `if score >= 90:`   | flag = "CRITICAL" |
| `score = 78` | ✗ ✓ – | `elif score >= 70:` | flag = "REVIEW"   |
| `score = 70` | ✗ ✓ – | `elif score >= 70:` | flag = "REVIEW"   |
| `score = 55` | ✗ ✗ ✓ | `else:`             | flag = "MONITOR"  |

> **⚠️ f-string 里的引号要错开**
>
> `print(f"{row['alert_id']} | {flag}")`——外面用双引号，花括号里的键就要用单引号。如果写成 `f"{row["alert_id"]}"`，在 Python 3.11 及以前会报 `SyntaxError`（3.12 起才允许）。Colab 现在的版本能跑，但你的代码以后可能在别的环境运行，统一错开最保险。

---

## 2. 🔴 筛选行、收集某一列

**▶ Demo – filter rows and collect ids**（Day 2 · cell 32）

*前一格已经建好 alerts（3 行，分数 92 / 55 / 78）。*

```python
# Demo: collect high-score alert ids
high_ids = [row["alert_id"] for row in alerts if row["score"] >= 70]
print("ids to escalate:", high_ids)

email_only = []
for row in alerts:
    if row["channel"] == "email":
        email_only.append(row["alert_id"])
print("email channel:", email_only)
```

| 行 | 代码                                                                     | 在做什么                                      |
| - | ---------------------------------------------------------------------- | ----------------------------------------- |
| 1 | `# Demo: collect high-score alert ids`                                 | 注释。                                       |
| 2 | `high_ids = [row["alert_id"] for row in alerts if row["score"] >= 70]` | 推导式版：对每一行 row，如果分数 >= 70，就收集它的 alert\_id。 |
| 5 | `email_only = []`                                                      | 循环版：先建空列表。                                |
| 7 | `if row["channel"] == "email":`                                        | 比较字符串用 `==`。                              |
| 8 | `email_only.append(row["alert_id"])`                                   | 符合就把 id 加进去。                              |

运行结果：

```text
ids to escalate: ['AL-2001', 'AL-2003']
email channel: ['AL-2001', 'AL-2002']
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

两种写法完全等价，回顾 U8：

| 推导式                                                         | 普通循环                                        |
| ----------------------------------------------------------- | ------------------------------------------- |
| `[row["alert_id"] for row in alerts if row["score"] >= 70]` | 空列表 → for → if → `.append(row["alert_id"])` |

---

## 3. 练习 P3：工单列表

题目（cell 33）：① 每张工单打印成 `ticket_id | priority | owner`；② 按 priority 打印提示：high → `handle today`，medium → `handle this week`，其他 → `backlog`；③ 收集所有 high 工单的 owner。

**▶ Practice P3 – ticket list**（我的解答 / 补充 · Day 2 · cell 34）

```python
tickets = [
    {"ticket_id": "INC-31", "priority": "high", "owner": "Ada Chen"},
    {"ticket_id": "INC-32", "priority": "low", "owner": "Ben Li"},
    {"ticket_id": "INC-33", "priority": "medium", "owner": "Cara Ng"},
    {"ticket_id": "INC-34", "priority": "high", "owner": "Ada Chen"},
]

for t in tickets:
    print(f"{t['ticket_id']} | {t['priority']} | {t['owner']}")
    if t["priority"] == "high":
        hint = "handle today"
    elif t["priority"] == "medium":
        hint = "handle this week"
    else:
        hint = "backlog"
    print(f"  hint: {hint}")

high_owners = [t["owner"] for t in tickets if t["priority"] == "high"]
print("high_owners:", high_owners)
```

| 行  | 代码                                                                       | 在做什么                             |
| -- | ------------------------------------------------------------------------ | -------------------------------- |
| 1  | `tickets = [`                                                            | 题目数据（为了短一点，每个 dict 写在一行，效果一样）。   |
| 8  | `for t in tickets:`                                                      | 第 1–2 项：逐行处理。                    |
| 9  | `print(f"{t['ticket_id']} \| {t['priority']} \| {t['owner']}")`          | 打印三个字段。                          |
| 10 | `if t["priority"] == "high":`                                            | 按 priority 给提示。                  |
| 16 | `print(f"  hint: {hint}")`                                               | 前面两个空格是题目要求的缩进效果（在字符串里）。         |
| 18 | `high_owners = [t["owner"] for t in tickets if t["priority"] == "high"]` | 第 3 项：推导式收集 owner。同一个人出现两次就会收两次。 |

运行结果：

```text
INC-31 | high | Ada Chen
  hint: handle today
INC-32 | low | Ben Li
  hint: backlog
INC-33 | medium | Cara Ng
  hint: handle this week
INC-34 | high | Ada Chen
  hint: handle today
high_owners: ['Ada Chen', 'Ada Chen']
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

和 Expected output 一字不差。注意 `high_owners` 里 `Ada Chen` 出现了两次——列表会保留重复值（要去重的话可以用 `set`，以后会学）。

---

## 自测

**Day 2 Practice question 4：建 2–3 行告警（alert\_id、score、channel），循环中只打印 score >= 80 的行。**

> ```python
> alerts = [
>     {
>         "alert_id": "AL-3001",
>         "score": 91,
>         "channel": "email",
>     },
>     {
>         "alert_id": "AL-3002",
>         "score": 64,
>         "channel": "vpn",
>     },
>     {
>         "alert_id": "AL-3003",
>         "score": 80,
>         "channel": "endpoint",
>     },
> ]
>
> for row in alerts:
>     if row["score"] >= 80:
>         print(f"{row['alert_id']} | {row['score']} | {row['channel']}")
> ```
>
> 输出 AL-3001 和 AL-3003（80 刚好在边界上，`>=` 包含它）。

**alerts\[1]\["subject"] 是什么？alerts\["subject"] 呢？**

> `alerts[1]["subject"]` 是 `'Password reset notice'`。`alerts["subject"]` 会报 `TypeError: list indices must be integers or slices, not str`——`alerts` 是 list，第一步只能用位置取。

**怎么算出所有告警的平均分？**

> ```python
> scores = [row["score"] for row in alerts]
> print(sum(scores) / len(scores))
> ```
>
> 先用推导式取出 score 这一列，再用内置函数 `sum()` 求和、`len()` 数个数。
