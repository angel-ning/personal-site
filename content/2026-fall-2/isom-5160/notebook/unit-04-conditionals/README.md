---
title:
  en: "Unit 4 · if / elif / else: Making Decisions"
  zh: "第 4 单元 · if / elif / else：让程序做选择"
summary:
  en: "Conditions, comparison operators, indentation, if / else, elif chains where only the first True branch runs, and and / or / not — with a branch lab and the order-status practice."
  zh: "条件和比较运算符、缩进、if / else、只走第一个 True 的 elif 链、and / or / not，附分支实验台和 Practice P3 解答。"
unit: 4
date: 2026-10-30
tags: [Python, if, Conditionals, Boolean]
---
# Unit 4 · if / elif / else：让程序做选择

**这一单元学什么**：商业规则几乎都是「如果……就……否则……」：满额免运费、按积分分等级、按分数给告警定级。`if` 就是把这些规则写成代码。  
**对应材料**：Day 1 notebook Section 3（cell 19–27）。

---

## 0. 生词表

| 术语                            | 大白话                                | 例子                            |
| ----------------------------- | ---------------------------------- | ----------------------------- |
| **condition** 条件              | 一个算出来是 `True` 或 `False` 的表达式       | `basket >= 300`               |
| **comparison operator** 比较运算符 | 比大小、比相等的符号，结果是 bool                | 见下表                           |
| **branch** 分支                 | if / elif / else 下面各自那一块代码，只会走其中一块 |                               |
| **indentation** 缩进            | 行首的 4 个空格。**缩进的行属于上面那个冒号**         | `    fee = 25.0`              |
| **block** 代码块                 | 缩进相同、连在一起的几行                       | if 下面的两行                      |
| **logical operator** 逻辑运算符    | `and`、`or`、`not`，把几个条件组合起来         | `is_member and basket >= 400` |

| 运算符         | 意思           | 例子 → 结果                |
| ----------- | ------------ | ---------------------- |
| `==`        | 等于（**两个**等号） | `status == "paid"`     |
| `!=`        | 不等于          | `status != "paid"`     |
| `>` / `<`   | 大于 / 小于      | `820 > 1000` → `False` |
| `>=` / `<=` | 大于等于 / 小于等于  | `300 >= 300` → `True`  |

> **⚠️ = 和 == 是两回事**
>
> `=` 是**赋值**（放进盒子），`==` 是**比较**（问「是不是相等」）。`if status = "paid":` 会直接 `SyntaxError`。

---

## 1. 🔴 if / else：二选一

**▶ Demo – shipping rule (if / else)**（Day 1 · cell 21）

```python
# Demo: if / else for a shipping rule
basket = 275.0
fee = 0.0

if basket >= 300:
    fee = 0.0
    print("Free shipping applied")
else:
    fee = 25.0
    print(f"Shipping fee: HKD {fee:.2f}")

print(f"Payable total: HKD {basket + fee:.2f}")
```

| 行  | 代码                                                | 在做什么                                                                       |
| -- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| 1  | `# Demo: if / else for a shipping rule`           | 注释：满 300 免运费，否则收 25。                                                       |
| 2  | `basket = 275.0`                                  | 购物篮金额。改成 300 或更多再想想结果会怎样。                                                  |
| 3  | `fee = 0.0`                                       | 先给运费一个初始值。                                                                 |
| 5  | `if basket >= 300:`                               | `>=` 是「大于等于」。`275.0 >= 300` 算出来是 False，所以跳过下面缩进的两行，直接去 else。行末的冒号 `:` 不能漏。 |
| 6  | `fee = 0.0`                                       | （条件为 True 才执行）                                                             |
| 7  | `print("Free shipping applied")`                  | （条件为 True 才执行）                                                             |
| 8  | `else:`                                           | 上面条件不成立时走这里。else 后面不写条件。                                                   |
| 9  | `fee = 25.0`                                      | 运费改成 25.0——变量可以被重新赋值，旧值被覆盖。                                                |
| 10 | `print(f"Shipping fee: HKD {fee:.2f}")`           | 打印运费。                                                                      |
| 12 | `print(f"Payable total: HKD {basket + fee:.2f}")` | 没有缩进 = if/else 结束之后，一定会执行。275 + 25 = 300。                                  |

运行结果：

```text
Shipping fee: HKD 25.00
Payable total: HKD 300.00
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

格式要点：

1. `if 条件:`——**行末冒号**不能漏。
2. 下面属于它的行**缩进 4 个空格**（Colab 按 Tab 会自动插 4 个空格）。
3. `else:` 不写条件，和 `if` 对齐。
4. 缩进回到最左边 = if / else 结束，之后的代码无论如何都会执行（最后那行 `Payable total`）。

*（网页版此处可以拖动 / 选择变量的值，看 if / elif / else 从上往下哪一支被选中：运费规则（Day 1 cell 21））*

```python
if basket >= 300:
    ...
else:
    ...
```

| 输入               | 每个条件 | 走哪一支                | 结果                                                |
| ---------------- | ---- | ------------------- | ------------------------------------------------- |
| `basket = 275.0` | ✗ ✓  | `else:`             | Shipping fee: HKD 25.00；Payable total: HKD 300.00 |
| `basket = 300.0` | ✓ –  | `if basket >= 300:` | Free shipping applied；Payable total: HKD 300.00   |
| `basket = 420.0` | ✓ –  | `if basket >= 300:` | Free shipping applied；Payable total: HKD 420.00   |

---

## 2. 🔴 if / elif / else：多选一，**只走第一个 True**

**▶ Demo – membership tier (if / elif / else)**（Day 1 · cell 23）

```python
# Demo: membership tier from points
points = 820

if points >= 1000:
    tier = "Gold"
elif points >= 500:
    tier = "Silver"
elif points >= 100:
    tier = "Bronze"
else:
    tier = "Guest"

print(f"Points {points} -> tier {tier}")
```

| 行  | 代码                                         | 在做什么                                                                                |
| -- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| 1  | `# Demo: membership tier from points`      | 注释：按积分分等级。                                                                          |
| 2  | `points = 820`                             | 积分。                                                                                 |
| 4  | `if points >= 1000:`                       | 第 1 关：820 >= 1000？False，往下看。                                                        |
| 6  | `elif points >= 500:`                      | `elif` = else if「否则如果」。820 >= 500？True！执行它下面的行，然后**整串 if 结束**，后面的 elif / else 都不看了。 |
| 7  | `tier = "Silver"`                          | tier 变成 "Silver"。                                                                   |
| 8  | `elif points >= 100:`                      | 820 也 >= 100，但因为上一关已经命中，这一关根本不会被检查。                                                 |
| 13 | `print(f"Points {points} -> tier {tier}")` | 打印结果。顺序很重要：如果把 >= 100 放第一个，820 会被判成 Bronze。                                         |

运行结果：

```text
Points 820 -> tier Silver
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

*（网页版此处可以拖动 / 选择变量的值，看 if / elif / else 从上往下哪一支被选中：会员等级（Day 1 cell 23））*

```python
if points >= 1000:
    ...
elif points >= 500:
    ...
elif points >= 100:
    ...
else:
    ...
```

| 输入              | 每个条件    | 走哪一支                  | 结果              |
| --------------- | ------- | --------------------- | --------------- |
| `points = 1000` | ✓ – – – | `if points >= 1000:`  | tier = "Gold"   |
| `points = 820`  | ✗ ✓ – – | `elif points >= 500:` | tier = "Silver" |
| `points = 500`  | ✗ ✓ – – | `elif points >= 500:` | tier = "Silver" |
| `points = 99`   | ✗ ✗ ✗ ✓ | `else:`               | tier = "Guest"  |

> **🎯 项目里最容易错：门槛的顺序**
>
> Python 从上往下**一个一个问**，第一个 `True` 就进去，**后面的全部跳过**。所以多个门槛要**从严到宽**写（`>= 1000` → `>= 500` → `>= 100`）。如果把 `points >= 100` 写在第一个，820 分会被判成 Bronze。
>
> 自测时一定要试**边界值**：刚好 1000、刚好 500、499……（notebook 末尾的 Self-check 也这么要求）。

---

## 3. 🔴 组合条件：`and` / `or` / `not`

**▶ Demo – combine conditions (and / or / not)**（Day 1 · cell 25）

```python
# Demo: compound condition for a discount flag
is_member = True
basket = 420.0

if is_member and basket >= 400:
    print("Member promo unlocked")
elif not is_member and basket >= 600:
    print("Guest high-spend promo unlocked")
else:
    print("No promo this visit")
```

| 行 | 代码                                               | 在做什么                                                               |
| - | ------------------------------------------------ | ------------------------------------------------------------------ |
| 1 | `# Demo: compound condition for a discount flag` | 注释：组合条件。                                                           |
| 2 | `is_member = True`                               | 是不是会员（bool）。                                                       |
| 3 | `basket = 420.0`                                 | 消费金额。                                                              |
| 5 | `if is_member and basket >= 400:`                | `and` = 两边**都**为 True 才是 True。True and (420 >= 400 → True) → True。 |
| 6 | `print("Member promo unlocked")`                 | 所以打印这一行，后面的 elif / else 不再看。                                       |
| 7 | `elif not is_member and basket >= 600:`          | `not` 把 True/False 反过来。非会员且满 600 才走这里。                             |

运行结果：

```text
Member promo unlocked
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 运算符       | 什么时候是 True         | 例子               |
| --------- | ------------------ | ---------------- |
| `A and B` | A、B **都**是 True    | 是会员 **并且** 满 400 |
| `A or B`  | A、B **至少一个**是 True | 是学生 **或者** 未满 18 |
| `not A`   | A 是 False          | 不是会员             |

*（网页版此处可以拖动 / 选择变量的值，看 if / elif / else 从上往下哪一支被选中：组合条件 and / not（Day 1 cell 25））*

```python
if is_member and basket >= 400:
    ...
elif not is_member and basket >= 600:
    ...
else:
    ...
```

| 输入                                  | 每个条件  | 走哪一支                                    | 结果                              |
| ----------------------------------- | ----- | --------------------------------------- | ------------------------------- |
| `is_member = True, basket = 420.0`  | ✓ – – | `if is_member and basket >= 400:`       | Member promo unlocked           |
| `is_member = True, basket = 380.0`  | ✗ ✗ ✓ | `else:`                                 | No promo this visit             |
| `is_member = False, basket = 650.0` | ✗ ✓ – | `elif not is_member and basket >= 600:` | Guest high-spend promo unlocked |
| `is_member = False, basket = 420.0` | ✗ ✗ ✓ | `else:`                                 | No promo this visit             |

> **💡 小白理解：括号让规则更好读**
>
> `not is_member and basket >= 600` 的意思是 `(not is_member) and (basket >= 600)`。不确定先算哪个时，**自己加括号**，效果一样，读起来更清楚。

---

## 4. 练习 P3：订单状态标签

题目（cell 26）：`"paid"` → `Ready to ship`；`"pending"` → `Awaiting payment`；`"cancelled"` → `Do not ship`；其他 → `Unknown status - check with supervisor`。

**▶ Practice P3 – order status label**（我的解答 / 补充 · Day 1 · cell 27）

```python
status = "pending"  # try: "paid", "cancelled", "refund"

if status == "paid":
    print("Ready to ship")
elif status == "pending":
    print("Awaiting payment")
elif status == "cancelled":
    print("Do not ship")
else:
    print("Unknown status - check with supervisor")
```

| 行 | 代码                                                         | 在做什么                                                                          |
| - | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1 | `status = "pending"  # try: "paid", "cancelled", "refund"` | 要判断的状态。                                                                       |
| 3 | `if status == "paid":`                                     | `==` 是「比较是否相等」（两个等号）。一个 `=` 是赋值，写错会报 SyntaxError。"pending" == "paid" → False。 |
| 5 | `elif status == "pending":`                                | "pending" == "pending" → True，命中。                                             |
| 6 | `print("Awaiting payment")`                                | 打印，然后整串结束。                                                                    |
| 9 | `else:`                                                    | 其他任何值（比如 "refund"）都走这里。                                                       |

运行结果：

```text
Awaiting payment
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

*（网页版此处可以拖动 / 选择变量的值，看 if / elif / else 从上往下哪一支被选中：订单状态（Day 1 Practice P3））*

```python
if status == "paid":
    ...
elif status == "pending":
    ...
elif status == "cancelled":
    ...
else:
    ...
```

| 输入                     | 每个条件    | 走哪一支                          | 结果                                     |
| ---------------------- | ------- | ----------------------------- | -------------------------------------- |
| `status = 'paid'`      | ✓ – – – | `if status == "paid":`        | Ready to ship                          |
| `status = 'pending'`   | ✗ ✓ – – | `elif status == "pending":`   | Awaiting payment                       |
| `status = 'cancelled'` | ✗ ✗ ✓ – | `elif status == "cancelled":` | Do not ship                            |
| `status = 'Paid'`      | ✗ ✗ ✗ ✓ | `else:`                       | Unknown status - check with supervisor |

> **⚠️ 字符串比较区分大小写**
>
> `"Paid" == "paid"` 是 `False`，所以 `"Paid"` 会掉进 else。真实数据里常先统一大小写：`if status.lower() == "paid":`。

---

## 自测

**Day 1 Practice question 3：给定 age 和 is\_student，学生或未满 18 打印 Student rate，否则 Standard rate。**

> ```python
> age = 20
> is_student = True
>
> if is_student or age < 18:
>     print("Student rate")
> else:
>     print("Standard rate")
> ```
>
> 「或」→ `or`。边界：`age = 18` 且不是学生 → `18 < 18` 是 False → Standard rate。

**Day 1 Practice question 4：用你自己的门槛改写积分等级，并用 f-string 打印。**

> ```python
> points = 2600
>
> if points >= 5000:
>     tier = "Platinum"
> elif points >= 2000:
>     tier = "Gold"
> elif points >= 800:
>     tier = "Silver"
> else:
>     tier = "Member"
>
> print(f"Points {points} -> tier {tier}")
> ```
>
> 关键是门槛**从大到小**排。

**下面这段打印什么？score = 70; if score > 70: print("A") elif score >= 70: print("B") else: print("C")**

> `B`。`70 > 70` 是 False；`70 >= 70` 是 True。`>` 和 `>=` 在边界上结果不同。
