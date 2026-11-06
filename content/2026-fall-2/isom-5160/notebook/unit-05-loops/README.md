---
title:
  en: "Unit 5 · for and while: Repeating Work"
  zh: "第 5 单元 · for 与 while：让程序重复做事"
summary:
  en: "for loops over a list, range(start, stop, step), while loops and the infinite-loop trap, for + if as a filter, the loop practices and all Day 1 closing questions."
  zh: "for 遍历列表、range(start, stop, step)、while 循环和死循环陷阱、for + if 筛选，附 Practice P4 和 Day 1 收尾练习全部解答。"
unit: 5
date: 2026-10-30
tags: [Python, for, while, range, Loops]
---
# Unit 5 · for 与 while：让程序重复做事

**这一单元学什么**：同一件事要对很多东西做（每家分店、每笔订单、每条告警），就用循环。`for` = 「对每一个……」，`while` = 「只要……就继续」。  
**对应材料**：Day 1 notebook Section 4（cell 28–38）+ 末尾 Practice questions。

---

## 0. 生词表

| 术语                     | 大白话                            | 例子                                |
| ---------------------- | ------------------------------ | --------------------------------- |
| **loop** 循环            | 重复执行一块代码                       |                                   |
| **iteration** 迭代 / 一轮  | 循环体执行的「一次」                     | 4 家分店 = 4 轮                       |
| **loop variable** 循环变量 | `for` 后面那个名字，每一轮自动换成下一个元素      | `for code in branches:` 里的 `code` |
| **sequence** 序列        | 能一个一个往外拿东西的数据：list、str、range…… | `["TST", "CWB"]`                  |
| **loop body** 循环体      | 循环下面缩进的那几行                     |                                   |
| **counter** 计数器        | 用来记「还剩几次 / 第几次」的变量             | `batches_left`                    |
| **infinite loop** 死循环  | 条件永远是 True，停不下来                | 忘了 `batches_left - 1`             |

---

## 1. 🔴 `for`：对列表里的每一个……

**▶ Demo – for over a short list**（Day 1 · cell 30）

```python
# Demo: for-loop over branch codes
branches = ["TST", "CWB", "MK", "ST"]

print("Open branches today:")
for code in branches:
    print(f" - {code}")
```

| 行 | 代码                                      | 在做什么                                                                           |
| - | --------------------------------------- | ------------------------------------------------------------------------------ |
| 1 | `# Demo: for-loop over branch codes`    | 注释。                                                                            |
| 2 | `branches = ["TST", "CWB", "MK", "ST"]` | 一个**列表 (list)**：方括号里放 4 个字符串，有顺序。                                              |
| 4 | `print("Open branches today:")`         | 循环开始前先打印标题（只打一次）。                                                              |
| 5 | `for code in branches:`                 | `for 变量 in 序列:` = 把列表里的东西**一个一个**拿出来，每次放进 `code`，再执行下面缩进的代码。`code` 这个名字是你自己起的。 |
| 6 | `print(f" - {code}")`                   | 循环体：每拿出一个就打印一次。一共执行 4 次。                                                       |

运行结果：

```text
Open branches today:
 - TST
 - CWB
 - MK
 - ST
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

读法：「对 `branches` 里的**每一个** `code`，执行一次 `print(...)`」。`code` 是你自己起的名字，起成 `branch` 也完全一样——但最好起一个说明「这是什么」的名字。

> **💡 小白理解：发传单**
>
> `for code in branches:` 就像「把这叠传单（列表）一张一张拿起来（code），每拿一张就做一次缩进里的事」。拿完了，循环自动结束，不用你管什么时候停。

---

## 2. 🔴 `range()`：重复固定次数

**▶ Demo – for with range**（Day 1 · cell 32）

```python
# Demo: countdown-style range (business: queue tickets)
print("Issuing queue tickets:")
for n in range(1, 6):
    print(f"Ticket Q-{n:03d}")
```

| 行 | 代码                                                        | 在做什么                                                |
| - | --------------------------------------------------------- | --------------------------------------------------- |
| 1 | `# Demo: countdown-style range (business: queue tickets)` | 注释。                                                 |
| 3 | `for n in range(1, 6):`                                   | `range(1, 6)` 产生 1, 2, 3, 4, 5——**包含开头 1，不包含结尾 6**。 |
| 4 | `print(f"Ticket Q-{n:03d}")`                              | `:03d` = 整数 (d)，至少 3 位，不够的前面补 0。所以 1 显示成 001。       |

运行结果：

```text
Issuing queue tickets:
Ticket Q-001
Ticket Q-002
Ticket Q-003
Ticket Q-004
Ticket Q-005
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 写法                 | 产生的数          | 记法             |
| ------------------ | ------------- | -------------- |
| `range(5)`         | 0, 1, 2, 3, 4 | 从 0 开始，正好 5 个  |
| `range(1, 6)`      | 1, 2, 3, 4, 5 | **包含开头、不包含结尾** |
| `range(0, 10, 2)`  | 0, 2, 4, 6, 8 | 第 3 个参数是步长     |
| `range(10, 0, -3)` | 10, 7, 4, 1   | 步长为负 = 倒数      |

*（网页版此处可以自己输入 range 的参数）*

| 写法                 | list(range(...))  | 说明                  |
| ------------------ | ----------------- | ------------------- |
| `range(5)`         | `[0, 1, 2, 3, 4]` | 0 到 4               |
| `range(1, 6)`      | `[1, 2, 3, 4, 5]` | Day 1 cell 32：1 到 5 |
| `range(0, 10, 2)`  | `[0, 2, 4, 6, 8]` | 步长 2                |
| `range(10, 0, -3)` | `[10, 7, 4, 1]`   | 倒数                  |
| `range(3, 3)`      | `[]`              | 空的                  |

> **🧠 口诀：含头不含尾**
>
> `range(a, b)` 和 U7 的切片 `[a:b]` 是同一个规则：**从 a 开始，到 b 之前停**。想要 1 到 5，就写 `range(1, 6)`。

---

## 3. 🔴 `while`：只要条件成立就继续

**▶ Demo – light while loop**（Day 1 · cell 34）

```python
# Demo: while-loop counter for restock batches
batches_left = 3

while batches_left > 0:
    print(f"Processing restock batch... ({batches_left} left)")
    batches_left = batches_left - 1

print("All restock batches done")
```

| 行 | 代码                                               | 在做什么                                                       |
| - | ------------------------------------------------ | ---------------------------------------------------------- |
| 1 | `# Demo: while-loop counter for restock batches` | 注释。                                                        |
| 2 | `batches_left = 3`                               | 计数器，从 3 开始。                                                |
| 4 | `while batches_left > 0:`                        | `while 条件:` = 只要条件是 True 就一直重复。每一轮开始前都重新检查一次。              |
| 6 | `batches_left = batches_left - 1`                | **关键**：每轮减 1。先算右边（3 − 1 = 2），再放回左边。没有这一行，条件永远是 True → 死循环。 |
| 8 | `print("All restock batches done")`              | batches\_left 变成 0 时 `0 > 0` 是 False，跳出循环，执行这一行。           |

运行结果：

```text
Processing restock batch... (3 left)
Processing restock batch... (2 left)
Processing restock batch... (1 left)
All restock batches done
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

`for` 和 `while` 怎么选：

|       | `for`              | `while`                        |
| ----- | ------------------ | ------------------------------ |
| 什么时候停 | 序列走完自动停            | 条件变 False 才停                   |
| 适合    | 「对每一个……」：已知要处理哪些东西 | 「直到……为止」：不知道要几轮（存够钱、用户输入正确、重试） |
| 风险    | 几乎没有               | **忘了更新变量 → 死循环**               |

> **⚠️ 死循环怎么办**
>
> 如果 while 一直停不下来（输出一直在刷），在 Colab 里点那一格左边的 ■ 停止按钮，或 **Runtime → Interrupt execution**。然后检查循环体里有没有改变条件里的变量。

---

## 4. 🔴 `for` + `if`：边走边筛

**▶ Demo – for + if together**（Day 1 · cell 36）

```python
# Demo: flag high-value orders in a small list of totals
order_totals = [85.0, 310.0, 120.0, 540.0, 299.0]
threshold = 300.0

print(f"Orders at or above HKD {threshold:.0f}:")
for amount in order_totals:
    if amount >= threshold:
        print(f"  review: HKD {amount:.2f}")
```

| 行 | 代码                                                         | 在做什么                        |
| - | ---------------------------------------------------------- | --------------------------- |
| 1 | `# Demo: flag high-value orders in a small list of totals` | 注释：循环里放判断 = 筛选。             |
| 2 | `order_totals = [85.0, 310.0, 120.0, 540.0, 299.0]`        | 5 笔订单金额。                    |
| 3 | `threshold = 300.0`                                        | 门槛。把数字放进变量，以后改门槛只改这一处。      |
| 5 | `print(f"Orders at or above HKD {threshold:.0f}:")`        | `.0f` = 不要小数，300.0 显示成 300。 |
| 6 | `for amount in order_totals:`                              | 逐个取出金额。                     |
| 7 | `if amount >= threshold:`                                  | 缩进了一层：每一轮都判断一次。             |
| 8 | `print(f"  review: HKD {amount:.2f}")`                     | 缩进了两层：属于 if，只有达标的金额才打印。     |

运行结果：

```text
Orders at or above HKD 300:
  review: HKD 310.00
  review: HKD 540.00
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

这是 Day 1 最重要的组合，Day 2 会一直用：**循环负责「每一个」，if 负责「哪些」**。注意两层缩进：`if` 属于 `for`，`print` 属于 `if`。

---

## 5. 练习 P4：两个小循环

题目（cell 37）：① 用 `for` 把 `catalog` 每个商品打印成 `Item: <name>`；② 用 `while` 打印 `Attempt 1`、`Attempt 2`、`Attempt 3`。

**▶ Practice P4 – loop practices**（我的解答 / 补充 · Day 1 · cell 38）

```python
catalog = ["Notebook Set", "USB-C Hub", "Desk Lamp"]

for name in catalog:
    print(f"Item: {name}")

attempt = 1
while attempt <= 3:
    print(f"Attempt {attempt}")
    attempt += 1
```

| 行 | 代码                                                     | 在做什么                                |
| - | ------------------------------------------------------ | ----------------------------------- |
| 1 | `catalog = ["Notebook Set", "USB-C Hub", "Desk Lamp"]` | 题目给的商品列表。                           |
| 3 | `for name in catalog:`                                 | 第 1 项：for 逐个取商品名。                   |
| 6 | `attempt = 1`                                          | 第 2 项：计数器从 1 开始。                    |
| 7 | `while attempt <= 3:`                                  | `<=` 小于等于：1、2、3 都成立，4 不成立。          |
| 9 | `attempt += 1`                                         | `+=` 是 `attempt = attempt + 1` 的简写。 |

运行结果：

```text
Item: Notebook Set
Item: USB-C Hub
Item: Desk Lamp
Attempt 1
Attempt 2
Attempt 3
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

> **📌 第 2 项也可以用 for**
>
> `for attempt in range(1, 4): print(f"Attempt {attempt}")` 更短也不会死循环。题目指定用 while 是为了练习「自己维护计数器」。

---

## Day 1 收尾练习（notebook 末尾 Practice questions）

Q1–Q4 和 Q8 的答案分别在 U2、U3、U4、U1 的自测里。下面是循环相关的三题。

**Q5：names = \["Ada", "Ben", "Cara"]，每个人打印 Hello, &lt;name>!**

> ```python
> names = ["Ada", "Ben", "Cara"]
> for name in names:
>     print(f"Hello, {name}!")
> ```

**Q6：balance 从 0 开始，每轮加 200，直到 balance >= 1000，每轮打印余额。**

> ```python
> balance = 0
> while balance < 1000:
>     balance = balance + 200
>     print(f"Balance: {balance}")
> ```
>
> 输出 200、400、600、800、1000。注意条件写的是「**还没到**目标就继续」：`balance < 1000`。如果先 print 再加，最后一行会是 800（自己跑一下对比）。

**Q7：prices = \[19, 55, 120, 8, 77]，只打印严格大于 50 的价格。**

> ```python
> prices = [19, 55, 120, 8, 77]
> for price in prices:
>     if price > 50:
>         print(price)
> ```
>
> 输出 55、120、77。「严格大于」→ `>`，不是 `>=`。

**for i in range(3): 下面的代码会执行几次？i 依次是什么？**

> 3 次，`i` 依次是 0、1、2。
