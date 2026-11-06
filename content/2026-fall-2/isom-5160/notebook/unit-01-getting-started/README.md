---
title:
  en: "Unit 1 · Before You Start: Colab, Variables & Objects"
  zh: "第 1 单元 · 开始之前：Colab、变量与对象"
summary:
  en: "How a notebook runs (cells, run order, Run all), what a variable is, the four basic value types, comments, and Python as an object-oriented language — plus a map of all 15 units."
  zh: "notebook 怎么运行（cell、运行顺序、Run all）；变量是什么；四种基本值类型；注释；Python 是面向对象语言。附 15 个单元的总地图。"
unit: 1
date: 2026-10-30
tags: [Python, Colab, Variables, Types, OOP]
---
# Unit 1 · 开始之前：Colab、变量与对象

**这一单元学什么**：在写任何代码之前，先搞懂四件事——notebook 是怎么一格一格跑的、变量是什么、值有哪几种类型、为什么说「Python 里一切都是对象」。  
**对应材料**：`Python_Basics_Day01_student.ipynb` 的开头（Learning objectives、Colab Setup、cell 2 配置格、Section 0 *Python as an OOPL*）。

> **📌 这本「Python 笔记本」怎么用**
>
> - 这里不按「第几周」排，而是按**单元**：一个单元 = 一个知识点，按顺序读，每个单元都假设你读过前面的。
> - 每段代码都配了一个 **逐行运行器**：点「▶ 开始运行」，再一直点「下一步」，就能看到 Python **每执行一行**之后，变量变成了什么、屏幕上多了什么输出。点代码里的任意一行，可以单独看这一行的讲解。
> - 标着「我的解答 / 补充」的代码是我写的（练习答案、补充演示），其余都是老师 notebook 里的原代码。
> - Pipeline 单元（11–15）的运行器用的是**模拟的模型输出**：结构（list / dict / 键名）和真的一样，但分数和生成的文字是示意的，以你在 Colab 里跑出来的为准。
> - 这门课没有考试，标题里的 🔴 = 写作业和期末项目天天要用，🟡 = 要懂，🟢 = 了解。

---

## 0. 总地图：15 个单元

```
Day 1 · Python 基础 (Python_Basics_Day01)
  U1 开始之前：Colab、变量、类型、对象
  U2 print()            —— 把东西显示出来
  U3 f-string           —— 把变量塞进一句话里
  U4 if / elif / else   —— 让程序做选择
  U5 for / while        —— 让程序重复做事

Day 2 · 数据结构 (Python_DataStructures_Day02)
  U6  list / tuple / dict  —— 三种「装很多东西」的容器
  U7  取数据：[0]、[1:3]、["键"]、.get、.items()
  U8  列表推导式            —— 一行代码筛选 / 转换一个列表
  U9  list of dicts        —— 一张表，每行一条记录（告警、工单）
  U10 dict of dicts        —— 按编号查一整张卡片（库存、员工）

Day 2 · Hugging Face Pipelines (Pipelines_Tutorial / SampleCode / UsefulFunctions)
  U11 pipeline 是什么：import、任务 + 模型、CPU / GPU、输出的形状
  U12 文本生成：max_length、do_sample、temperature
  U13 文本分类：情感、NLI、星级、零样本
  U14 其他 NLP 任务：摘要、NER、问答、翻译、填空
  U15 语音与图片：TTS、ASR、看图说话
```

**一句话抓住整条线**：Day 1 学会「存数据、做判断、重复做」，Day 2 学会「把很多数据组织成表」，然后发现 **AI 模型的输出本身就是 list 和 dict**——所以前面学的每一样，在 Pipeline 单元里都会再用一次。

---

## 1. 🟡 Notebook / Colab 是怎么运行的

Jupyter notebook（Colab 是 Google 的在线版）由一个个 **cell（格子）** 组成：

| 名词                       | 大白话                                    | 你要做什么                    |
| ------------------------ | -------------------------------------- | ------------------------ |
| **code cell** 代码格        | 放 Python 代码的格子，左边有 ▶ 按钮                | 点 ▶（或 Shift + Enter）运行它  |
| **markdown cell** 文字格    | 老师写的说明文字，不是代码                          | 读就好                      |
| **output** 输出            | 代码格下面显示的结果（print 出来的东西、报错信息）           | 对照「Expected output」检查    |
| **kernel / runtime** 运行时 | 后台真正执行 Python 的那台「机器」，它**记得**之前跑过的所有变量 | 卡住或乱了就 Runtime → Restart |
| **Runtime → Run all**    | 从上到下依次运行全部格子                           | 每次打开 notebook 先点它        |

> **⚠️ 最常见的新手坑：运行顺序**
>
> 变量只存在于「已经运行过的格子」里。比如 Day 2 的 cell 9 用到了 cell 7 建的 `alert`——如果你直接跑 cell 9，会报 `NameError: name 'alert' is not defined`。
>
> 解决：从上往下按顺序跑，或者直接 **Runtime → Run all**。反过来，如果你改了上面某一格但没重新运行，下面的格子用的还是**旧值**。

---

## 2. 🔴 变量、`=`、值的类型

### 每个 notebook 开头那一格

老师的三本 notebook 都以这样一格开头（Colab 会把它显示成一个小表单）。它很短，但几乎用到了 Day 1 的所有基本概念：

**▶ Notebook configuration（每个 notebook 开头那格）**（Day 1 · cell 2）

```python
# @title Notebook configuration { display-mode: "form" }
tutorial_focus = "Python basics (Day 1)"  # @param {type:"string"}
learner_name = ""  # @param {type:"string"}
practice_mode = "guided"  # @param ["guided", "challenge"]
show_extra_tips = True  # @param {type:"boolean"}

print("Configuration ready for:", tutorial_focus)
if learner_name.strip():
    print("Learner:", learner_name.strip())
print("Practice mode:", practice_mode)
```

| 行  | 代码                                                                   | 在做什么                                                                                                  |
| -- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1  | `# @title Notebook configuration { display-mode: "form" }`           | `#` 开头 = 注释，Python 完全不看。但 Colab 认得 `# @title`：把这格显示成一个带标题的小表单。                                        |
| 2  | `tutorial_focus = "Python basics (Day 1)"  # @param {type:"string"}` | 建一个**变量** `tutorial_focus`，把一段文字（str，字符串）放进去。`=` 读作「放进」，不是「等于」。后面的 `# @param` 让 Colab 在表单里出现一个可以填字的框。 |
| 3  | `learner_name = ""  # @param {type:"string"}`                        | 变量 `learner_name` 放一个**空字符串** `""`（引号里什么都没有）。你可以在表单里填自己的名字。                                           |
| 4  | `practice_mode = "guided"  # @param ["guided", "challenge"]`         | `# @param [...]` 让表单变成下拉菜单，只能选 guided 或 challenge。                                                    |
| 5  | `show_extra_tips = True  # @param {type:"boolean"}`                  | `True` 是**布尔值** (bool)，只有 True / False 两种，首字母必须大写。表单里会变成一个勾选框。                                        |
| 7  | `print("Configuration ready for:", tutorial_focus)`                  | `print(…)` 把东西显示出来。括号里用逗号隔开两样东西，print 会在中间自动加一个空格。                                                    |
| 8  | `if learner_name.strip():`                                           | `.strip()` 去掉文字两头的空格。空字符串在 if 里算「假」，所以没填名字时，下面那行不会执行。                                                 |
| 9  | `print("Learner:", learner_name.strip())`                            | 前面有 4 个空格 = 这一行属于上面的 if。只有填了名字才会打印。                                                                   |
| 10 | `print("Practice mode:", practice_mode)`                             | 没有缩进 = 不属于 if，无论如何都会执行。                                                                               |

运行结果：

```text
Configuration ready for: Python basics (Day 1)
Practice mode: guided
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

### 生词表

| 术语                    | 大白话                                                   | 例子                           |
| --------------------- | ----------------------------------------------------- | ---------------------------- |
| **variable** 变量       | 一个**贴了名字的盒子**，里面放一个值。之后用名字就能拿到值                       | `revenue = 12850.5`          |
| **assignment** 赋值 `=` | 把右边的值**放进**左边的盒子。读作「放进」，**不是数学的等于**（比较相等要用 `==`，U4 讲） | `fee = 25.0`                 |
| **reassign** 重新赋值     | 再写一次 `名字 = 新值`，旧值被覆盖                                  | `fee = 0.0` 之后又 `fee = 25.0` |
| **comment** 注释 `#`    | `#` 后面到行尾都是写给人看的，Python 跳过                            | `# Demo: ...`                |
| **value** 值           | 数据本身：一个数字、一段文字……                                      | `48.0`、`"HKUST"`             |
| **type** 类型           | 值属于哪一类，决定了它能做什么运算                                     | `int`、`float`、`str`、`bool`   |

### 四种基本类型

| 类型      | 全称 / 中文                | 长什么样                          | 常见用途          |
| ------- | ---------------------- | ----------------------------- | ------------- |
| `int`   | integer 整数             | `3`、`820`、`-5`                | 数量、积分、年资      |
| `float` | floating-point 浮点数（小数） | `48.0`、`12850.5`              | 金额、分数、概率      |
| `str`   | string 字符串（文字）         | `"TST"`、`'Ada Chen'`、`""`（空的） | 名字、编号、状态、整段邮件 |
| `bool`  | boolean 布尔值            | `True`、`False`（首字母大写）         | 是不是会员、有没有被标记  |

> **💡 小白理解：引号决定一切**
>
> `368.0` 是数字，`"368.0"` 是文字。文字长得再像数字也不能拿来做加减，`"368.0" + 1` 会报错。订单号 `"ORD-2041"`、分店代码 `"TST"` 都要加引号；单引号 `'…'` 和双引号 `"…"` 效果一样，前后配对就行。

> **🧠 变量命名规则**
>
> - 只能用字母、数字、下划线，**不能以数字开头**：`order_total` ✓，`2nd_order` ✗
> - 区分大小写：`Total` 和 `total` 是两个不同的变量
> - Python 习惯用 **snake\_case**（小写 + 下划线）：`unit_price`、`batches_left`
> - 起有意义的名字：`basket` 比 `x` 好读得多

---

## 3. 🟡 Python 是面向对象语言（OOPL）

notebook Section 0 只要求一句话的理解：**Python 里每个值都是一个「对象」(object)，它属于某个「类」(class)**。类像一张「设计图」，对象是照着设计图做出来的具体东西。

| 术语               | 大白话                        | 例子                          |
| ---------------- | -------------------------- | --------------------------- |
| **class** 类      | 一种东西的设计图 / 类别              | `str`（所有字符串的设计图）            |
| **object** 对象    | 按设计图做出来的一个具体的值             | `"HKUST"` 是一个 `str` 对象      |
| **method** 方法    | 对象自带的「动作」，写法 `对象.方法()`     | `"ada".upper()` → `'ADA'`   |
| **attribute** 属性 | 对象身上的一个数据，写法 `对象.属性`（没有括号） | U15 会见到 `audio_array.shape` |

**▶ 一切都是对象：看看值的「类型」**（我的解答 / 补充 · Day 1 · Section 0（➕ 我写的演示））

```python
school = "HKUST"
year = 2026
price = 48.5
is_open = True
print(type(school), type(year), type(price), type(is_open))
print(school.lower())
print(school)
```

| 行 | 代码                                                            | 在做什么                                                              |
| - | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1 | `school = "HKUST"`                                            | 建变量 `school`，放进字符串 "HKUST"。引号表示「这是一段文字」。                          |
| 2 | `year = 2026`                                                 | 没有引号的数字是**整数** (int)。                                             |
| 3 | `price = 48.5`                                                | 带小数点的数字是**浮点数** (float)。                                          |
| 4 | `is_open = True`                                              | 布尔值 (bool)：True 或 False。                                          |
| 5 | `print(type(school), type(year), type(price), type(is_open))` | `type(x)` 告诉你 x 属于哪个**类 (class)**。每个值都是某个类做出来的**对象 (object)**。    |
| 6 | `print(school.lower())`                                       | 对象自带的动作叫**方法 (method)**，写法是 `对象.方法()`。`lower()` 把字母变小写，返回一个新的字符串。 |
| 7 | `print(school)`                                               | 原来的 `school` 没变——字符串是**不可变** (immutable) 的，方法只会给你一个新值。            |

运行结果：

```text
<class 'str'> <class 'int'> <class 'float'> <class 'bool'>
hkust
HKUST
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

> **⚠️ 方法后面的括号不能忘**
>
> `school.lower()` 才是「执行这个动作」；写成 `school.lower`（没有括号）不会报错，但你拿到的是「这个方法本身」而不是结果。第 1 周笔记里的 str 小实验演示过这个坑。

Day 4 会自己写类（`class`），现在只要会**用**别人的对象就够了。

---

## 4. 🟢 读懂报错信息

代码出错时 Python 会打印一段 **Traceback**。新手只看**最后一行**就够了：`错误类型: 说明`。先认识一下名字，U7 末尾有点选练习。

| 错误类型               | 大白话                | 最常见原因                        |
| ------------------ | ------------------ | ---------------------------- |
| `SyntaxError`      | 语法写错了，Python 根本看不懂 | 漏了冒号 `:`、引号没配对、`if x = 1`    |
| `IndentationError` | 缩进不对               | if / for 下面那行没有缩进            |
| `NameError`        | 不认识这个名字            | 拼错变量名；没先运行定义它的那格；`true` 写成小写 |
| `TypeError`        | 类型不对，不能这样操作        | `"Total: " + 368.0`；改 tuple  |
| `KeyError`         | 字典里没有这个键           | `ticket["category"]`         |
| `IndexError`       | 位置越界               | 只有 2 个元素却取 `[2]`             |
| `ValueError`       | 类型对但值不合法           | `f"{3.5:03d}"`（`d` 只给整数用）    |

---

## 自测

*（网页版此处是点选练习：这个值是什么类型？；下表是全部题目和答案）*

| 题目                   | 答案        | 理由                                            |
| -------------------- | --------- | --------------------------------------------- |
| `42`                 | **int**   | 没有小数点、没有引号的整数                                 |
| `368.0`              | **float** | 有小数点就是 float，哪怕小数部分是 0                        |
| `"368.0"`            | **str**   | 有引号就是文字，长得像数字也不能直接做加减                         |
| `True`               | **bool**  | 首字母大写的 True / False 是布尔值；写成 true 会报 NameError |
| `"ORD-2041"`         | **str**   | 订单号要用引号包起来                                    |
| `3 * 48.0`           | **float** | int 和 float 一起算，结果是 float（144.0）              |
| `basket >= 300`      | **bool**  | 比较的结果只有 True / False，所以可以放进 if                |
| `f"HKD {total:.2f}"` | **str**   | f-string 算出来的是一段文字，不再是数字                      |

**learner\_name 是空字符串时，为什么 if learner\_name.strip(): 下面那行不会执行？**

> `if` 会把条件当成「真 / 假」来看。空字符串 `""` 被当成**假**，有内容的字符串被当成**真**。`.strip()` 先去掉两头空格，所以只填了空格也算没填。

**为什么从中间某一格开始运行经常报 NameError？**

> 变量只存在于已经运行过的格子里。中间那格用到的变量是在上面某格定义的，没先跑那一格，Python 就不认识这个名字。用 **Runtime → Run all** 从头跑。

**一句话说出 class 和 object 的区别（Day 1 Practice question 8）**

> class 是设计图（比如 `str` 规定了所有字符串长什么样、能做什么），object 是按设计图做出来的一个具体的值（比如 `"HKUST"`）。
