---
title:
  en: "Unit 6 · list, tuple, dict: Three Containers"
  zh: "第 6 单元 · list、tuple、dict：三种容器"
summary:
  en: "Creating lists, tuples and dictionaries; ordered vs keyed; mutable vs immutable (append, item assignment, TypeError); and choosing the right structure for a business record."
  zh: "建 list / tuple / dict；按位置 vs 按键；可变 vs 不可变（append、按键改值、改 tuple 的 TypeError）；按业务场景选结构。"
unit: 6
date: 2026-11-06
tags: [Python, list, tuple, dict, Mutable]
---
# Unit 6 · list、tuple、dict：三种容器

**这一单元学什么**：Day 1 的变量一次只装一个值。真实数据是一堆：一串工单、一组坐标、一张告警卡片。Python 有三种最常用的「容器」来装它们。  
**对应材料**：Day 2 data-structures notebook Section 1（cell 5–11）。

---

## 0. 生词表

| 术语                      | 大白话                           | 例子                        |
| ----------------------- | ----------------------------- | ------------------------- |
| **list** 列表             | 方括号 `[]`，一串**有顺序**的东西，**可以改** | `["TST", "CWB", "MK"]`    |
| **tuple** 元组            | 圆括号 `()`，一串有顺序的东西，**建好就不能改**  | `(22.3, 114.2)`           |
| **dict** 字典（dictionary） | 花括号 `{}`，一对一对的 `键: 值`         | `{"alert_id": "AL-1001"}` |
| **element / item** 元素   | 容器里的一个东西                      | `"TST"`                   |
| **key** 键               | dict 里「冒号左边」的名字，用来查           | `"severity"`              |
| **value** 值             | dict 里「冒号右边」的内容               | `"high"`                  |
| **mutable** 可变          | 建好以后还能改（加、删、换）                | list、dict                 |
| **immutable** 不可变       | 建好以后不能改，只能重新做一个               | tuple、str、int、float       |
| **method** 方法（U1）       | 容器自带的动作                       | `queue.append("T-103")`   |

---

## 1. 🔴 建出这三种容器

**▶ Demo – create list, tuple, and dictionary**（Day 2 · cell 7）

```python
# Demo: create list, tuple, and dictionary
branches = ["TST", "CWB", "MK"]
desk_location = ("Tower A", 12, "A-04")  # building, floor, cubicle - fixed group
alert = {
    "alert_id": "AL-1001",
    "severity": "high",
    "source": "email-gateway",
    "flagged": True,
}

print("list:", branches)
print("tuple:", desk_location)
print("dict:", alert)
print("types:", type(branches).__name__, type(desk_location).__name__, type(alert).__name__)
```

| 行  | 代码                                                                                             | 在做什么                                                                             |
| -- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1  | `# Demo: create list, tuple, and dictionary`                                                   | 注释。                                                                              |
| 2  | `branches = ["TST", "CWB", "MK"]`                                                              | **list 列表**：方括号 `[]`，有顺序，之后可以加 / 改 / 删。                                          |
| 3  | `desk_location = ("Tower A", 12, "A-04")  # building, floor, cubicle - fixed group`            | **tuple 元组**：圆括号 `()`，有顺序，但**建好就不能改**。适合「楼、层、座位」这种固定组合。一个 tuple 里可以混放 str 和 int。 |
| 4  | `alert = {`                                                                                    | **dict 字典**：花括号 `{}`，里面是一对一对的 `键: 值` (key: value)。像一张「字段名 → 内容」的卡片。              |
| 5  | `"alert_id": "AL-1001",`                                                                       | 键 "alert\_id" 对应值 "AL-1001"。每对之间用逗号隔开。                                           |
| 8  | `"flagged": True,`                                                                             | 值可以是任何类型，这里是 bool。最后一对后面的逗号可有可无。                                                 |
| 9  | `}`                                                                                            | 字典到这里结束。上面 6 行其实是**一条**语句，只是为了好读分成多行。                                            |
| 11 | `print("list:", branches)`                                                                     | print 一个 list 会连方括号和引号一起显示。                                                      |
| 14 | `print("types:", type(branches).__name__, type(desk_location).__name__, type(alert).__name__)` | `type(x)` 拿到类，`.__name__` 拿到类的名字（纯文字），所以显示 list tuple dict。                      |

运行结果：

```text
list: ['TST', 'CWB', 'MK']
tuple: ('Tower A', 12, 'A-04')
dict: {'alert_id': 'AL-1001', 'severity': 'high', 'source': 'email-gateway', 'flagged': True}
types: list tuple dict
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 类型        | 写法             | 有顺序？               | 能改？          | 典型用途（notebook 原表）  |
| --------- | -------------- | ------------------ | ------------ | ------------------ |
| **list**  | `[...]`        | 是                  | 能（加 / 改 / 删） | 会增减的一串：订单、工单       |
| **tuple** | `(...)`        | 是                  | **不能**       | 固定的一组：坐标、只读记录      |
| **dict**  | `{key: value}` | 按插入顺序（Python 3.7+） | 能            | 按名字 / 编号查：SKU → 库存 |

> **💡 小白理解：三种容器的比喻**
>
> - **list** = 排队的队伍：有先后，可以有人加入、有人离开。
> - **tuple** = 身份证上的出生日期：几个数字固定在一起，不该被改。
> - **dict** = 通讯录：按名字查电话，不关心排第几。

> **📌 多行写法只是为了好读**
>
> `alert = { ... }` 写成 6 行和写成一行完全一样。老师要求嵌套数据**多行缩进**（notebook 末尾的 Self-check 也提到），因为字段一多，一行根本看不清。

---

## 2. 🔴 可变 vs 不可变

**▶ Demo – mutable list vs immutable tuple**（Day 2 · cell 9）

*前面的 cell 已经建好了 alert 字典（severity 是 "high"）。*

```python
# Demo: list can grow; tuple cannot be changed in place
queue = ["T-101", "T-102"]
queue.append("T-103")
print("queue after append:", queue)

coords = (22.3, 114.2)  # lat, lon - treat as fixed
# coords[0] = 22.4  # would raise TypeError: 'tuple' object does not support item assignment
print("coords still:", coords)

# Dict values can be updated by key
alert["severity"] = "critical"
print("updated severity:", alert["severity"])
```

| 行  | 代码                                                                                             | 在做什么                                                                 |
| -- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1  | `# Demo: list can grow; tuple cannot be changed in place`                                      | 注释：list 能变长，tuple 不能改。                                               |
| 2  | `queue = ["T-101", "T-102"]`                                                                   | 两个工单的队列。                                                             |
| 3  | `queue.append("T-103")`                                                                        | `.append(x)` 是 list 的方法：把 x 加到**最后**。它直接改 queue 本身，不需要写 `queue = …`。 |
| 6  | `coords = (22.3, 114.2)  # lat, lon - treat as fixed`                                          | 经纬度用 tuple：不希望被意外改掉。                                                 |
| 7  | `# coords[0] = 22.4  # would raise TypeError: 'tuple' object does not support item assignment` | 这一行被注释掉了（不执行）。如果执行会报 TypeError——下一段演示就是把它真的跑一遍。                      |
| 10 | `# Dict values can be updated by key`                                                          | 注释：字典可以按键改值。                                                         |
| 11 | `alert["severity"] = "critical"`                                                               | `字典[键] = 新值`：把 severity 从 "high" 改成 "critical"。键不存在的话就是**新增**一对。     |
| 12 | `print("updated severity:", alert["severity"])`                                                | `字典[键]` 读出这个键的值。                                                     |

运行结果：

```text
queue after append: ['T-101', 'T-102', 'T-103']
coords still: (22.3, 114.2)
updated severity: critical
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

那行被注释掉的 `coords[0] = 22.4` 真的跑起来是这样的：

**▶ 试一下：改 tuple 会怎样**（我的解答 / 补充 · Day 2 · cell 9 里被注释掉的那行）

```python
coords = (22.3, 114.2)
print(coords[0])
coords[0] = 22.4
print("never printed")
```

| 行 | 代码                       | 在做什么                                                   |
| - | ------------------------ | ------------------------------------------------------ |
| 1 | `coords = (22.3, 114.2)` | 建一个 tuple。                                             |
| 2 | `print(coords[0])`       | **读**可以：`[0]` 取第一个元素。                                  |
| 3 | `coords[0] = 22.4`       | **改**不行：tuple 不可变，Python 停下来报 TypeError，这一行之后的代码都不会执行。 |
| 4 | `print("never printed")` | （不会执行到）                                                |

运行结果：

```text
22.3
Traceback (most recent call last):
  ...
TypeError: 'tuple' object does not support item assignment
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 想做的事  | list                      | tuple         | dict                                |
| ----- | ------------------------- | ------------- | ----------------------------------- |
| 读一个元素 | `queue[0]`                | `coords[0]`   | `alert["severity"]`                 |
| 改一个元素 | `queue[0] = "T-100"` ✓    | ✗ `TypeError` | `alert["severity"] = "critical"` ✓  |
| 加一个元素 | `queue.append("T-103")` ✓ | ✗             | `alert["owner"] = "Ada"` ✓（新键 = 新增） |

> **⚠️ append 不用再赋值**
>
> `queue.append("T-103")` 直接改掉 `queue` 本身。如果写成 `queue = queue.append("T-103")`，`append` 的返回值是 `None`，`queue` 反而变成了 `None`。这和 U1 的 `str.upper()`（返回新值、原来的不变）正好相反——**可变对象的方法通常直接改自己**。

---

## 3. 🔴 按场景选结构

**▶ Demo – choose the structure that matches the job**（Day 2 · cell 11）

```python
# Demo: choose the structure that matches the job
open_tickets = ["INC-21", "INC-22", "INC-24"]          # list - will grow / shrink
price_pair = ("USB-C Hub", 189.0)                     # tuple - fixed pair
employees = {                                         # dict - lookup by key
    "E100": "Ada Chen",
    "E101": "Ben Li",
    "E102": "Cara Ng",
}

print("Next ticket:", open_tickets[0])
print("Product:", price_pair[0], "| HKD", price_pair[1])
print("Analyst for E101:", employees["E101"])
```

| 行  | 代码                                                                                   | 在做什么                                |
| -- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| 1  | `# Demo: choose the structure that matches the job`                                  | 注释。                                 |
| 2  | `open_tickets = ["INC-21", "INC-22", "INC-24"]          # list - will grow / shrink` | 会增减的队列 → list。                      |
| 3  | `price_pair = ("USB-C Hub", 189.0)                     # tuple - fixed pair`         | 固定的（商品, 价格）一对 → tuple。              |
| 4  | `employees = {                                         # dict - lookup by key`       | 按员工编号查名字 → dict。                    |
| 10 | `print("Next ticket:", open_tickets[0])`                                             | list 按**位置**取：`[0]` 是第一个。           |
| 11 | `print("Product:", price_pair[0], "\| HKD", price_pair[1])`                          | tuple 也按位置取：`[0]` 商品名，`[1]` 价格。     |
| 12 | `print("Analyst for E101:", employees["E101"])`                                      | dict 按**键**取：不用知道它排第几，直接用 "E101" 查。 |

运行结果：

```text
Next ticket: INC-21
Product: USB-C Hub | HKD 189.0
Analyst for E101: Ben Li
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

*（网页版此处是点选练习：选哪种数据结构最合适？（Day 2 Section 1）；下表是全部题目和答案）*

| 题目                                   | 答案            | 理由                                          |
| ------------------------------------ | ------------- | ------------------------------------------- |
| `一串还在增加的工单号，要按先后顺序处理`                | **list \[ ]** | 有顺序、会增减 → list（append / remove）             |
| `办公室固定的 GPS 坐标 (22.3, 114.2)`        | **tuple ( )** | 一组固定、不该被改动的值 → tuple（不可变，改了会 TypeError）     |
| `按 SKU 快速查单价：P100 → 48.0`            | **dict { }** | 按名字 / 编号查东西 → dict 的 key: value             |
| `一封告警的各个字段：alert_id、severity、source` | **dict { }** | 「字段名 → 内容」的一张卡片 → dict                      |
| `一个函数要返回 (商品名, 价格) 这一对，调用方只读不改`      | **tuple ( )** | 固定的一对值，只读 → tuple                           |
| `今天所有订单金额，之后要算总和、筛选大单`               | **list \[ ]** | 同类数据一串，按顺序遍历 → list                         |
| `员工编号 → 员工资料（名字、团队、年资）`              | **dict { }** | 外层按编号查 → dict；资料本身也是 dict，所以是 dict of dicts |

---

## 自测

**Day 2 Practice question 1：为下面三种需求选结构并说理由：(a) 固定的 GPS 坐标 (b) 不断增长的工单号队列 (c) SKU → 单价查询**

> (a) **tuple**：一组固定的值，不该被改，误改会直接报错保护你；(b) **list**：有顺序、要 `append` 新工单；(c) **dict**：按 SKU 这个键直接查价格，不用知道它排第几。

**type(desk\_location).\_\_name\_\_ 为什么显示 tuple，而 print(type(desk\_location)) 显示 &lt;class 'tuple'>？**

> `type(x)` 拿到的是「类」这个对象本身，print 它会显示 `<class 'tuple'>`；`.__name__` 是类的一个属性，里面存着名字这段纯文字 `'tuple'`。

**一个 dict 里同一个键写两次会怎样？例如 {"a": 1, "a": 2}**

> 不报错，后写的覆盖前面的：结果是 `{'a': 2}`。dict 的键是唯一的。
