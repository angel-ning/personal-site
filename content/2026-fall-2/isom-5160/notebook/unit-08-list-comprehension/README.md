---
title:
  en: "Unit 8 · List Comprehensions: Filter and Transform in One Line"
  zh: "第 8 单元 · 列表推导式：一行筛选 / 转换"
summary:
  en: "[expression for item in sequence if condition], how it maps to a normal for loop, the X if cond else Y expression, zip(), and the pass / retry practice."
  zh: "[表达式 for 元素 in 序列 if 条件]、它和普通 for 循环的对应关系、X if 条件 else Y、zip()，附 Practice P2 解答。"
unit: 8
date: 2026-11-06
tags: [Python, List comprehension, Ternary, zip]
---
# Unit 8 · 列表推导式：一行筛选 / 转换

**这一单元学什么**：「从一个列表做出另一个列表」太常见了：把代码全部变大写、挑出大额订单、给每个分数贴标签。列表推导式把 4 行的 for 循环压成 1 行。  
**对应材料**：Day 2 data-structures notebook Section 3（cell 21–27）。

---

## 0. 生词表

| 术语                                      | 大白话                                 | 例子                                            |
| --------------------------------------- | ----------------------------------- | --------------------------------------------- |
| **list comprehension** 列表推导式            | 用一行 `[… for … in …]` 造一个新列表         | `[c.upper() for c in codes]`                  |
| **transform** 转换                        | 每个元素都变一下，长度不变                       | 全部变大写                                         |
| **filter** 筛选                           | 只留下符合条件的，长度可能变短                     | 只留 ≥ 300 的                                    |
| **conditional expression** 条件表达式（三元表达式） | `X if 条件 else Y`：算出 X 或 Y 其中一个**值** | `"HIGH" if a >= 300 else "OK"`                |
| **`zip(a, b)`**                         | 把两个列表按位置配成一对一对                      | `zip([1, 2], ["x", "y"])` → (1, 'x')、(2, 'y') |

---

## 1. 🔴 推导式的三个部分

```
[ 表达式        for 元素 in 序列        if 条件 ]
  c.upper()     for c in codes
  a             for a in amounts       if a >= threshold
  ↑ 要收集什么   ↑ 从哪里一个个拿          ↑（可选）留下哪些
```

**▶ Demo – transform and filter**（Day 2 · cell 23）

```python
# Demo: list comprehension - transform and filter
codes = ["tst", "cwb", "mk"]
upper_codes = [c.upper() for c in codes]
print("upper:", upper_codes)

amounts = [85.0, 310.0, 120.0, 540.0, 299.0]
threshold = 300.0
high_value = [a for a in amounts if a >= threshold]
print("high value:", high_value)
```

| 行 | 代码                                                    | 在做什么                                                                |
| - | ----------------------------------------------------- | ------------------------------------------------------------------- |
| 1 | `# Demo: list comprehension - transform and filter`   | 注释。                                                                 |
| 3 | `upper_codes = [c.upper() for c in codes]`            | **列表推导式**：读法是「对 codes 里的每个 c，算出 `c.upper()`，收集成一个新列表」。原来的 codes 不变。 |
| 8 | `high_value = [a for a in amounts if a >= threshold]` | 带 `if` 的推导式 = **筛选**：只有满足 `a >= threshold` 的 a 才被收进来。               |

运行结果：

```text
upper: ['TST', 'CWB', 'MK']
high value: [310.0, 540.0]
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

读法要**从中间读起**：「对 `amounts` 里的每个 `a`，**如果** `a >= threshold`，就把 `a` 收进新列表」。

它和普通 for 循环一一对应：

**▶ 推导式 = 一个 for 循环的缩写**（我的解答 / 补充 · Section 3（➕ 我写的对照））

```python
amounts = [85.0, 310.0, 120.0, 540.0, 299.0]

high_loop = []
for a in amounts:
    if a >= 300:
        high_loop.append(a)

high_comp = [a for a in amounts if a >= 300]
print(high_loop == high_comp, high_comp)
```

| 行 | 代码                                             | 在做什么                     |
| - | ---------------------------------------------- | ------------------------ |
| 3 | `high_loop = []`                               | 普通写法第 1 步：先准备一个空列表。      |
| 4 | `for a in amounts:`                            | 第 2 步：逐个看。               |
| 5 | `if a >= 300:`                                 | 第 3 步：判断。                |
| 6 | `high_loop.append(a)`                          | 第 4 步：合格的加进去。            |
| 8 | `high_comp = [a for a in amounts if a >= 300]` | 推导式把上面 4 行压成 1 行，结果一模一样。 |
| 9 | `print(high_loop == high_comp, high_comp)`     | `==` 比较两个列表的内容：True。     |

运行结果：

```text
True [310.0, 540.0]
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

> **💡 什么时候用推导式，什么时候用普通循环**
>
> notebook 原话：*keep them readable — long logic still belongs in a normal for loop*。一个条件、一个简单转换 → 推导式；要 print、要多个 if / elif、要改别的变量 → 普通 for 循环。

---

## 2. 🔴 两种 `if` 放的位置不一样

**▶ Demo – comprehension with if / else expression**（Day 2 · cell 25）

```python
# Demo: label each amount as HIGH or OK
amounts = [85.0, 310.0, 120.0, 540.0]
labels = ["HIGH" if a >= 300 else "OK" for a in amounts]
for amount, label in zip(amounts, labels):
    print(f"HKD {amount:.2f} -> {label}")
```

| 行 | 代码                                                         | 在做什么                                                                                         |
| - | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1 | `# Demo: label each amount as HIGH or OK`                  | 注释。                                                                                          |
| 3 | `labels = ["HIGH" if a >= 300 else "OK" for a in amounts]` | `X if 条件 else Y` 是一个**会算出值的表达式**（三元表达式）：条件成立得 X，否则得 Y。放在 for 前面 = 每个元素都变成一个标签，**不会过滤**，长度不变。 |
| 4 | `for amount, label in zip(amounts, labels):`               | `zip(a, b)` 把两个列表**按位置配对**：(85.0, 'OK')、(310.0, 'HIGH')……然后拆进 amount 和 label。                |

运行结果：

```text
HKD 85.00 -> OK
HKD 310.00 -> HIGH
HKD 120.00 -> OK
HKD 540.00 -> HIGH
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 写法                                                | `if` 在哪             | 作用            | 结果长度 |
| ------------------------------------------------- | ------------------- | ------------- | ---- |
| `[a for a in amounts if a >= 300]`                | **最后**              | 筛选：不符合的**扔掉** | 可能变短 |
| `["HIGH" if a >= 300 else "OK" for a in amounts]` | **for 前面**，必须带 else | 每个都变成两种值之一    | 不变   |

> **🎯 最容易写错**
>
> `[a for a in amounts if a >= 300 else 0]` 是 **SyntaxError**：放在最后的 if 是过滤器，不能带 else。要「每个都给个值」，就把 `if … else …` 挪到 for 前面。

> **➕ zip 一次走两个列表**
>
> `zip(amounts, labels)` 每一轮给出一对 `(金额, 标签)`。两个列表长度不一样时，`zip` 按**短的**那个停。U13 会用它把「输入的评论」和「模型的结果」配对显示。

---

## 3. 练习 P2：及格名单和标签

**▶ Practice P2 – list comprehension**（我的解答 / 补充 · Day 2 · cell 27）

```python
scores = [72, 45, 88, 60, 51, 91]

passed = [s for s in scores if s >= 60]
flags = ["PASS" if s >= 60 else "RETRY" for s in scores]
print("passed:", passed)
print("flags:", flags)
```

| 行 | 代码                                                         | 在做什么                                          |
| - | ---------------------------------------------------------- | --------------------------------------------- |
| 1 | `scores = [72, 45, 88, 60, 51, 91]`                        | 题目数据。                                         |
| 3 | `passed = [s for s in scores if s >= 60]`                  | 第 1 项：筛选 → `if` 写在**最后**。60 本身也算 pass（>=）。    |
| 4 | `flags = ["PASS" if s >= 60 else "RETRY" for s in scores]` | 第 2 项：每个都要一个标签 → `if … else …` 写在 **for 前面**。 |

运行结果：

```text
passed: [72, 88, 60, 91]
flags: ['PASS', 'RETRY', 'PASS', 'PASS', 'RETRY', 'PASS']
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

---

## 自测

**Day 2 Practice question 3：latencies = \[12, 48, 5, 90, 33]，用推导式做出严格大于 30 的列表。**

> ```python
> latencies = [12, 48, 5, 90, 33]
> slow = [x for x in latencies if x > 30]
> print(slow)   # [48, 90, 33]
> ```

**\[len(s) for s in \["TST", "CWB", "MK"]] 的结果是？**

> `[3, 3, 2]`。转换型推导式：每个字符串换成它的长度。

**把 prices = \[19, 55, 120] 全部打 9 折，保留原来的顺序，用一行写。**

> `discounted = [p * 0.9 for p in prices]` → `[17.1, 49.5, 108.0]`。换别的数字时，浮点数偶尔会显示成 `0.30000000000000004` 这种（电脑存小数的误差），打印时用 `:.2f` 格式化即可。
