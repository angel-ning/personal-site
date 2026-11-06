---
title:
  en: "Unit 7 · Getting Data Out: Index, Slice, Key, .items()"
  zh: "第 7 单元 · 把数据取出来：索引、切片、键、.items()"
summary:
  en: "Zero-based and negative indexes, slices that exclude the end, d[key] vs d.get(key, default), and looping over lists and dict views with .keys() / .values() / .items() — with a slicing lab and the access drills."
  zh: "从 0 开始的索引和负索引、不含终点的切片、d[键] vs d.get(键, 默认)、用 .keys() / .values() / .items() 遍历，附切片实验台和 Practice P1 解答。"
unit: 7
date: 2026-11-06
tags: [Python, Indexing, Slicing, dict.get, items]
---
# Unit 7 · 把数据取出来：索引、切片、键、.items()

**这一单元学什么**：装进容器以后，要会**取**：取第几个、取一段、按名字取、一个一个全部取。这是 Day 2 后面所有内容（包括 AI 模型的输出）的基础。  
**对应材料**：Day 2 data-structures notebook Section 2（cell 12–20）。

---

## 0. 生词表

| 术语                       | 大白话                                                 | 例子                                     |
| ------------------------ | --------------------------------------------------- | -------------------------------------- |
| **index** 索引 / 位置        | 元素排第几，**从 0 开始数**                                   | `skus[0]` 是第一个                         |
| **negative index** 负索引   | 从后往前数，`-1` 是最后一个                                    | `skus[-1]`                             |
| **slice** 切片             | 取一段，`[开始:结束]`，**不含结束**                              | `skus[1:4]`                            |
| **`KeyError`**           | 用方括号取一个不存在的键                                        | `ticket["category"]`                   |
| **`.get(key, default)`** | 安全地取：没有这个键就返回默认值                                    | `ticket.get("category", "unassigned")` |
| **view** 视图              | `.keys()` / `.values()` / `.items()` 返回的东西，可以拿来 for |                                        |
| **unpacking** 拆包         | `for a, b in …` 把一对值拆进两个变量                          | `for level, count in d.items():`       |

---

## 1. 🔴 list / tuple：按位置取

**▶ Demo – indexing and slicing**（Day 2 · cell 14）

```python
# Demo: indexing and slicing
skus = ["P100", "P200", "P300", "P400", "P500"]
regions = ("HK", "SZ", "GZ")

print("first sku:", skus[0])
print("last sku:", skus[-1])
print("middle slice:", skus[1:4])
print("first two regions:", regions[:2])
```

| 行 | 代码                                                | 在做什么                                                                       |
| - | ------------------------------------------------- | -------------------------------------------------------------------------- |
| 1 | `# Demo: indexing and slicing`                    | 注释。                                                                        |
| 2 | `skus = ["P100", "P200", "P300", "P400", "P500"]` | 5 个元素，位置编号是 0 1 2 3 4。                                                     |
| 5 | `print("first sku:", skus[0])`                    | **索引 (index) 从 0 开始**：`[0]` 是第一个。                                          |
| 6 | `print("last sku:", skus[-1])`                    | 负数从后往前数：`[-1]` 是最后一个，`[-2]` 是倒数第二个。                                        |
| 7 | `print("middle slice:", skus[1:4])`               | **切片 (slice)** `[a:b]`：从位置 a 开始，到 b **之前**停（不含 b）。所以是位置 1、2、3。结果还是一个 list。 |
| 8 | `print("first two regions:", regions[:2])`        | 冒号前不写 = 从头开始。`[:2]` = 位置 0、1。tuple 切出来还是 tuple。                            |

运行结果：

```text
first sku: P100
last sku: P500
middle slice: ['P200', 'P300', 'P400']
first two regions: ('HK', 'SZ')
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

*（网页版此处可以自己输入 \[i] / \[a:b:c]，格子会高亮被取到的位置；skus = \['P100', 'P200', 'P300', 'P400', 'P500']）*

| 写法           | 结果                                         | 说明             |
| ------------ | ------------------------------------------ | -------------- |
| `skus[0]`    | `'P100'`                                   | 第一个            |
| `skus[-1]`   | `'P500'`                                   | 最后一个           |
| `skus[1:4]`  | `['P200', 'P300', 'P400']`                 | 位置 1、2、3（4 不含） |
| `skus[:2]`   | `['P100', 'P200']`                         | 从头取 2 个        |
| `skus[2:]`   | `['P300', 'P400', 'P500']`                 | 从位置 2 到最后      |
| `skus[-2:]`  | `['P400', 'P500']`                         | 最后 2 个         |
| `skus[::2]`  | `['P100', 'P300', 'P500']`                 | 每隔一个取一个        |
| `skus[::-1]` | `['P500', 'P400', 'P300', 'P200', 'P100']` | 倒过来            |
| `skus[5]`    | IndexError: list index out of range        | 越界：报错          |
| `skus[1:99]` | `['P200', 'P300', 'P400', 'P500']`         | 切片越界不报错        |

> **🧠 三条规则**
>
> 1. **从 0 开始**：第二个是 `[1]`，第 n 个是 `[n-1]`。
> 2. **负数从后数**：`[-1]` 最后一个，`[-2]` 倒数第二个，不用知道长度。
> 3. **切片含头不含尾**：`[1:3]` = 位置 1、2。冒号一边不写 = 一直到头 / 到尾。

| 写法                    | 意思                | 结果类型                                  |
| --------------------- | ----------------- | ------------------------------------- |
| `seq[i]`              | 第 i 个元素           | 元素本身（这里是 str）                         |
| `seq[a:b]`            | 位置 a 到 b-1        | 和原来一样的容器（list 切出 list，tuple 切出 tuple） |
| `seq[:b]` / `seq[a:]` | 从头到 b-1 / 从 a 到最后 | 同上                                    |
| `seq[::-1]`           | 倒过来（第三个数是步长）      | 同上                                    |

> **⚠️ 索引越界会报错，切片越界不会**
>
> `skus[5]`（只有 0–4）→ `IndexError: list index out of range`；`skus[1:99]` 不报错，只是取到最后为止。

---

## 2. 🔴 dict：按键取，`[]` vs `.get()`

**▶ Demo – dictionary keys and safe get**（Day 2 · cell 16）

```python
# Demo: dict key access
ticket = {
    "ticket_id": "INC-88",
    "priority": "medium",
    "owner": "Ada Chen",
}

print("id:", ticket["ticket_id"])
print("priority:", ticket.get("priority"))
print("category (missing):", ticket.get("category", "unassigned"))
```

| 行  | 代码                                                                   | 在做什么                                                             |
| -- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1  | `# Demo: dict key access`                                            | 注释。                                                              |
| 2  | `ticket = {`                                                         | 一张工单。                                                            |
| 8  | `print("id:", ticket["ticket_id"])`                                  | 方括号取值：键必须存在，否则报 KeyError。                                        |
| 9  | `print("priority:", ticket.get("priority"))`                         | `.get(键)` 也能取值，效果一样。                                             |
| 10 | `print("category (missing):", ticket.get("category", "unassigned"))` | `.get(键, 默认值)`：键不存在时**不报错**，返回你给的默认值 "unassigned"。字典本身不会因此多出这个键。 |

运行结果：

```text
id: INC-88
priority: medium
category (missing): unassigned
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

对比一下键不存在时两种写法的差别：

**▶ 试一下：方括号取一个不存在的键**（我的解答 / 补充 · 对照 cell 16）

```python
ticket = {"ticket_id": "INC-88", "priority": "medium"}
print(ticket.get("category", "unassigned"))
print(ticket["category"])
```

| 行 | 代码                                                       | 在做什么                      |
| - | -------------------------------------------------------- | ------------------------- |
| 1 | `ticket = {"ticket_id": "INC-88", "priority": "medium"}` | 没有 "category" 这个键。        |
| 2 | `print(ticket.get("category", "unassigned"))`            | `.get` 安全：返回默认值。          |
| 3 | `print(ticket["category"])`                              | 方括号不安全：直接报 KeyError，程序停下。 |

运行结果：

```text
unassigned
Traceback (most recent call last):
  ...
KeyError: 'category'
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

|       | `d["key"]`          | `d.get("key")` | `d.get("key", 默认)` |
| ----- | ------------------- | -------------- | ------------------ |
| 键存在   | 返回值                 | 返回值            | 返回值                |
| 键不存在  | **`KeyError`，程序停下** | 返回 `None`      | 返回你给的默认值           |
| 什么时候用 | 你确定一定有这个键           | 可能没有，没有就算了     | 可能没有，要一个兜底值        |

> **💼 业务视角：为什么要 .get**
>
> 真实数据经常缺字段：有的工单没填 category，有的告警没有 owner。用 `.get("category", "unassigned")` 让程序继续跑下去，而不是处理到第 300 条时因为一个缺失字段整个崩掉。

---

## 3. 🔴 用 for 把东西全部走一遍

**▶ Demo – for loops; .items() / .keys() / .values()**（Day 2 · cell 18）

```python
# Demo: looping over list and dict views
channels = ["email", "vpn", "endpoint"]

print("Channels to review:")
for ch in channels:
    print(f" - {ch}")

severity_counts = {
    "low": 12,
    "medium": 7,
    "high": 3,
}

print("Keys:", list(severity_counts.keys()))
print("Values:", list(severity_counts.values()))
print("Items:")
for level, count in severity_counts.items():
    print(f"  {level}: {count}")
```

| 行  | 代码                                                 | 在做什么                                                                               |
| -- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1  | `# Demo: looping over list and dict views`         | 注释。                                                                                |
| 5  | `for ch in channels:`                              | 遍历 list：每次拿一个元素放进 `ch`。                                                            |
| 8  | `severity_counts = {`                              | 一个「等级 → 数量」的字典。                                                                    |
| 14 | `print("Keys:", list(severity_counts.keys()))`     | `.keys()` 拿到所有键；外面包 `list(…)` 是为了显示得像普通列表。                                         |
| 15 | `print("Values:", list(severity_counts.values()))` | `.values()` 拿到所有值。                                                                 |
| 17 | `for level, count in severity_counts.items():`     | `.items()` 一次给你**一对** (键, 值)。`for level, count in …` 把这一对拆开，分别放进两个变量。这是遍历字典最常用的写法。 |

运行结果：

```text
Channels to review:
 - email
 - vpn
 - endpoint
Keys: ['low', 'medium', 'high']
Values: [12, 7, 3]
Items:
  low: 12
  medium: 7
  high: 3
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 写法                                   | 每一轮拿到     | 用在            |
| ------------------------------------ | --------- | ------------- |
| `for x in my_list:`                  | 一个元素      | list / tuple  |
| `for k in d:` 或 `for k in d.keys():` | 一个键       | 只要键           |
| `for v in d.values():`               | 一个值       | 只要值（比如加总）     |
| `for k, v in d.items():`             | 一对 (键, 值) | **最常用**：键和值都要 |

> **💡 小白理解：.items() 给的是一对**
>
> `severity_counts.items()` 里面是 `('low', 12)`、`('medium', 7)`、`('high', 3)` 这样的**一对一对**（每对是个 tuple）。`for level, count in …` 把每一对拆开：左边给 `level`，右边给 `count`。

---

## 4. 练习 P1：取数据小练习

**▶ Practice P1 – access drills**（我的解答 / 补充 · Day 2 · cell 20）

```python
catalog = ["Notebook Set", "Desk Lamp", "USB-C Hub", "Webcam"]
branches = ["TST", "CWB", "MK", "ST"]
case = {"ticket_id": "INC-42", "owner": "Ben Li", "priority": "high"}

print("second product:", catalog[1])
print("last branch:", branches[-1])
print("middle products:", catalog[1:3])
print("owner:", case["owner"])
print("status:", case.get("status", "open"))
for key, value in case.items():
    print(f"{key} -> {value}")
```

| 行  | 代码                                                               | 在做什么                                   |
| -- | ---------------------------------------------------------------- | -------------------------------------- |
| 1  | `catalog = ["Notebook Set", "Desk Lamp", "USB-C Hub", "Webcam"]` | 题目给的数据。                                |
| 5  | `print("second product:", catalog[1])`                           | 第 1 项：**第二个**是位置 1（不是 2）。              |
| 6  | `print("last branch:", branches[-1])`                            | 最后一个用 -1，不用数长度。                        |
| 7  | `print("middle products:", catalog[1:3])`                        | 第 2 项：中间两个 = 位置 1、2，所以写 `[1:3]`（3 不含）。 |
| 8  | `print("owner:", case["owner"])`                                 | 第 3 项：按键取。                             |
| 9  | `print("status:", case.get("status", "open"))`                   | 没有 status 键 → `.get` 返回默认 "open"。      |
| 10 | `for key, value in case.items():`                                | 第 4 项：遍历每一对。                           |

运行结果：

```text
second product: Desk Lamp
last branch: ST
middle products: ['Desk Lamp', 'USB-C Hub']
owner: Ben Li
status: open
ticket_id -> INC-42
owner -> Ben Li
priority -> high
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

输出和题目给的 **Expected output** 一字不差。

---

## 自测

*（网页版此处是点选练习：这行代码会报什么错？；下表是全部题目和答案）*

| 题目                                                  | 答案                   | 理由                                                                |
| --------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| `if status = "paid":`                               | **SyntaxError**      | 比较要用两个等号 ==；一个 = 是赋值，不能写在 if 里                                    |
| `print(revnue)    # 前面定义的是 revenue`                 | **NameError**        | 拼错变量名 = Python 不认识这个名字                                            |
| `"Total: " + 368.0`                                 | **TypeError**        | str 和 float 不能直接用 + 拼。改成 f"Total: {total}" 或 str(total)          |
| `coords = (22.3, 114.2); coords[0] = 22.4`          | **TypeError**        | tuple 不可变：'tuple' object does not support item assignment         |
| `ticket["category"]    # ticket 里没有这个键`             | **KeyError**         | 方括号取不存在的键 → KeyError；用 ticket.get("category", "unassigned") 就不会报错 |
| `skus = ["P100", "P200"]; skus[2]`                  | **IndexError**       | 只有位置 0、1；位置 2 越界。切片 skus\[0:5] 越界却不会报错                            |
| `if basket >= 300: ⏎ print("Free")    # print 没有缩进` | **IndentationError** | 冒号后面那一行必须缩进（通常 4 个空格）                                             |
| `true    # 想写布尔值`                                   | **NameError**        | Python 的布尔值是 True（大写 T），小写 true 会被当成一个没定义的变量名                     |
| `for code in 42: ⏎     print(code)`                 | **TypeError**        | for 只能遍历「序列」（list、str、range…）。整数不能遍历：'int' object is not iterable |

**Day 2 Practice question 2：ports = \["443", "22", "80", "8080"]，meta = {"host": "gw01", "zone": "dmz"}，打印前三个端口和 zone。**

> ```python
> ports = ["443", "22", "80", "8080"]
> meta = {"host": "gw01", "zone": "dmz"}
>
> print(ports[:3])        # ['443', '22', '80']
> print(meta["zone"])     # dmz
> ```

**Day 2 Practice question 6：用任意一个 dict，通过 for 和 .items() 打印 key: value 报告。**

> ```python
> case = {"ticket_id": "INC-42", "owner": "Ben Li", "priority": "high"}
> for key, value in case.items():
>     print(f"{key}: {value}")
> ```

**skus = \["P100", "P200", "P300", "P400", "P500"]，skus\[-3:-1] 是什么？**

> `['P300', 'P400']`。-3 是 P300，-1 是 P500，但切片不含终点，所以停在 P400。
