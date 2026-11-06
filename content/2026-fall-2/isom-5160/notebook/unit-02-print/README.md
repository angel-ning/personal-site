---
title:
  en: "Unit 2 · print(): Showing Values on Screen"
  zh: "第 2 单元 · print()：把东西显示出来"
summary:
  en: "Functions, arguments and keyword arguments through print(): several values on one line, sep and end, and the desk-note practice."
  zh: "用 print() 认识「函数、参数、关键字参数」：一行显示多个值、sep 和 end，附 Practice P1 解答。"
unit: 2
date: 2026-10-30
tags: [Python, print, Functions, Arguments]
---
# Unit 2 · print()：把东西显示出来

**这一单元学什么**：`print()` 是你最先用、也用得最多的东西——调试、看结果、出报表都靠它。借它顺便搞懂三个以后天天见的词：**函数、参数、关键字参数**。  
**对应材料**：Day 1 notebook Section 1（cell 5–11）。

---

## 0. 生词表

| 术语                           | 大白话                                    | 例子                                        |
| ---------------------------- | -------------------------------------- | ----------------------------------------- |
| **function** 函数              | 一个有名字的「功能」，后面加括号 `()` 就是**调用**它（让它去做事） | `print(…)`、`type(…)`、`len(…)`             |
| **argument** 参数              | 调用函数时放进括号里、交给它处理的东西，多个用逗号隔开            | `print("Store:", "Harbour Mart")` 有 2 个参数 |
| **positional argument** 位置参数 | 只写值、靠**位置**区分的参数                       | 上面那两个                                     |
| **keyword argument** 关键字参数   | 写成 `名字=值` 的参数，靠**名字**区分，可选             | `sep=" \| "`、`end=" "`                    |
| **default** 默认值              | 你不写某个关键字参数时，它自动用的值                     | `sep` 默认 `" "`，`end` 默认 `"\n"`            |
| `"\n"` 换行符                   | 一个看不见的字符，意思是「换到下一行」                    | `print("a\nb")` 显示成两行                     |

> **💡 小白理解：函数像自动售货机**
>
> `print` 是机器的名字，括号里的参数是你投进去的东西，机器做完事把结果显示出来。关键字参数像机器上的旋钮：`sep` 调「每样东西之间放什么」，`end` 调「最后补什么」，不碰旋钮就用出厂设置（默认值）。

---

## 1. 🔴 基本用法：一个或多个值

**▶ Demo – basic printing**（Day 1 · cell 7）

```python
# Demo: print messages and values
print("Welcome to ISOM5160")
print("Store:", "Harbour Mart", "Branch:", "TST")
revenue = 12850.5
print("Today revenue (HKD):", revenue)
```

| 行 | 代码                                                  | 在做什么                                             |
| - | --------------------------------------------------- | ------------------------------------------------ |
| 1 | `# Demo: print messages and values`                 | 注释，说明这格在演示什么。                                    |
| 2 | `print("Welcome to ISOM5160")`                      | 最简单的 print：括号里放一个字符串，屏幕上显示它（不带引号）。               |
| 3 | `print("Store:", "Harbour Mart", "Branch:", "TST")` | 放 4 个**参数 (argument)**，用逗号分开。print 默认在它们之间加一个空格。 |
| 4 | `revenue = 12850.5`                                 | 建变量 `revenue`，放一个 float。这一行本身不会显示任何东西。           |
| 5 | `print("Today revenue (HKD):", revenue)`            | 文字和数字可以一起 print：print 会自动把数字转成文字再显示。             |

运行结果：

```text
Welcome to ISOM5160
Store: Harbour Mart Branch: TST
Today revenue (HKD): 12850.5
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

要点：

- 参数可以是文字、数字、变量，混在一起也行——print 会自动把数字转成文字。
- 多个参数之间 print **自动加一个空格**，所以 `"Store:"` 后面不用自己加空格。
- 字符串显示时**不带引号**；但如果 print 的是一个 list / dict，里面的字符串会带引号（U6 会看到）。

---

## 2. 🔴 两个旋钮：`sep` 和 `end`

**▶ Demo – separators and end**（Day 1 · cell 9）

```python
# Demo: customise sep and end
print("SKU", "P100", "P200", "P300", sep=" | ")
print("Loading report...", end=" ")
print("done.")
```

| 行 | 代码                                                 | 在做什么                                                     |
| - | -------------------------------------------------- | -------------------------------------------------------- |
| 1 | `# Demo: customise sep and end`                    | 注释：演示 print 的两个可选参数 sep 和 end。                           |
| 2 | `print("SKU", "P100", "P200", "P300", sep=" \| ")` | `sep=` 是**关键字参数 (keyword argument)**：把默认的空格分隔符换成 " \| "。 |
| 3 | `print("Loading report...", end=" ")`              | `end=` 决定 print 最后补什么。默认是换行 `\n`；这里改成一个空格，所以光标停在同一行。     |
| 4 | `print("done.")`                                   | 接着上一行的后面打印，于是两次 print 显示在同一行。                            |

运行结果：

```text
SKU | P100 | P200 | P300
Loading report... done.
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 参数    | 管什么                          | 默认值         | 改了会怎样                                                 |
| ----- | ---------------------------- | ----------- | ----------------------------------------------------- |
| `sep` | separator 分隔符：**参数和参数之间**放什么 | `" "`（一个空格） | `sep=" \| "` → `SKU \| P100 \| P200`；`sep=""` → 紧贴在一起 |
| `end` | 这次 print **最后**补什么           | `"\n"`（换行）  | `end=" "` → 不换行，下一次 print 接在后面                        |

> **⚠️ 关键字参数必须写在最后**
>
> `print(sep=" | ", "SKU", "P100")` 会报 `SyntaxError`：位置参数要放前面，`名字=值` 放后面。

---

## 3. 练习 P1：打印一张值班便条

题目（cell 10）：打印三行——① 标题 `Harbour Mart - Daily Desk Note`；② 收银员 `Ada Chen` 和收银机 `R3` 放在一行；③ 用 `end=" "` 让 `Shift open` 和 `09:00` 显示在同一行。

**▶ Practice P1 – desk note**（我的解答 / 补充 · Day 1 · cell 11）

```python
# Practice P1
print("Harbour Mart - Daily Desk Note")
print("Cashier:", "Ada Chen", "| Register:", "R3")
print("Shift open", end=" ")
print("09:00")
```

| 行 | 代码                                                    | 在做什么                              |
| - | ----------------------------------------------------- | --------------------------------- |
| 2 | `print("Harbour Mart - Daily Desk Note")`             | 第 1 项：标题行，原样打印。                   |
| 3 | `print("Cashier:", "Ada Chen", "\| Register:", "R3")` | 第 2 项：用多个参数放在一行（也可以写成一个字符串）。      |
| 4 | `print("Shift open", end=" ")`                        | 第 3 项：`end=" "` 让下一次 print 接在同一行。 |
| 5 | `print("09:00")`                                      | 接在 "Shift open " 后面显示。            |

运行结果：

```text
Harbour Mart - Daily Desk Note
Cashier: Ada Chen | Register: R3
Shift open 09:00
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

> **📌 第 2 项有很多种写法**
>
> `print("Cashier: Ada Chen | Register: R3")`（一个字符串）、`print("Cashier:", "Ada Chen", "Register:", "R3")`（多个参数），以及 U3 的 f-string，结果都可以。题目只要求「在一行里」。

---

## 自测

**print("A", "B", "C", sep="-") 显示什么？**

> `A-B-C`。三个参数之间用 `-` 隔开，最后照常换行。

**连续两行 print("Hi", end="") 和 print("there") 显示什么？**

> `Hithere`——第一行最后什么都没补（连空格都没有），第二行紧接着显示。

**Day 1 Practice question 1：用 print 在三行里写三件关于你自己的事。**

> 最简单就是三次 print，每次一行：
>
> ```python
> print("Name: Ada")
> print("Programme: MSc ISOM")
> print("Favourite language: Python")
> ```
>
> 也可以一次 print 用 `sep="\n"`：`print("Name: Ada", "Programme: MSc ISOM", "Favourite language: Python", sep="\n")`。
