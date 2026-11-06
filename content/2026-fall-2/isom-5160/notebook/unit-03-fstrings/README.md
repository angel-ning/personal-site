---
title:
  en: "Unit 3 · f-strings: Putting Values into Sentences"
  zh: "第 3 单元 · f-string：把变量塞进一句话里"
summary:
  en: "String concatenation vs f-strings, expressions inside braces, and the format spec after the colon (.2f, 03d, widths, %) — with a live format playground and the invoice-line practice."
  zh: "+ 拼接 vs f-string；花括号里放算式和方法；冒号后面的格式（.2f、03d、宽度、%），附格式实验台和 Practice P2 解答。"
unit: 3
date: 2026-10-30
tags: [Python, f-string, Formatting, Strings]
---
# Unit 3 · f-string：把变量塞进一句话里

**这一单元学什么**：业务脚本里大部分输出都是「一句话里夹着几个变量」——订单确认、报表行、告警摘要。f-string 是现在最推荐的写法。  
**对应材料**：Day 1 notebook Section 2（cell 12–18）、文件夹里的 `test_basics.py`（就是 cell 14 单独存成的 .py 文件）。

---

## 0. 生词表

| 术语                                     | 大白话                                       | 例子                           |
| -------------------------------------- | ----------------------------------------- | ---------------------------- |
| **concatenation** 拼接                   | 用 `+` 把几段字符串连成一段                          | `"Customer " + customer`     |
| **f-string**（formatted string literal） | 引号前加 `f`，里面的 `{…}` 会被换成算出来的值              | `f"Hi {name}"`               |
| **placeholder** 占位符 `{}`               | f-string 里的花括号，里面放变量名或算式                  | `{qty}`、`{unit_price * qty}` |
| **expression** 表达式                     | 任何能算出一个值的代码                               | `48.0 * 3`、`product.upper()` |
| **format spec** 格式说明                   | `{值:格式}` 冒号后面那段，决定**怎么显示**（小数几位、补几个 0、多宽） | `{total:.2f}`                |

---

## 1. 🔴 旧写法 `+` vs f-string

**▶ Demo – embed variables**（Day 1 · cell 14）

```python
# Demo: build messages with f-strings
customer = "Ben Li"
order_id = "ORD-2041"
total = 368.0

# Older style (works, but harder to read as messages grow)
legacy = "Customer " + customer + " placed " + order_id
print(legacy)

# Preferred: f-string
msg = f"Customer {customer} placed {order_id} for HKD {total:.2f}"
print(msg)
```

| 行  | 代码                                                                   | 在做什么                                                                                      |
| -- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1  | `# Demo: build messages with f-strings`                              | 注释。                                                                                       |
| 2  | `customer = "Ben Li"`                                                | 三个变量：客户名（str）……                                                                           |
| 3  | `order_id = "ORD-2041"`                                              | ……订单号（str，虽然有数字，但有引号就是文字）……                                                               |
| 4  | `total = 368.0`                                                      | ……金额（float）。                                                                              |
| 6  | `# Older style (works, but harder to read as messages grow)`         | 注释：旧写法，能用，但句子一长就难读。                                                                       |
| 7  | `legacy = "Customer " + customer + " placed " + order_id`            | 用 `+` 把字符串**拼接**起来。注意空格要自己写进引号里，而且 `+` 只能连字符串——连数字会报错（要先 `str(total)`）。                   |
| 8  | `print(legacy)`                                                      | 打印拼好的句子。                                                                                  |
| 10 | `# Preferred: f-string`                                              | 注释：推荐写法 f-string。                                                                         |
| 11 | `msg = f"Customer {customer} placed {order_id} for HKD {total:.2f}"` | 引号前加 `f` = f-string。`{}` 里写变量名，Python 会把值填进去。`{total:.2f}` 里冒号后面是**格式**：`.2f` = 保留 2 位小数。 |
| 12 | `print(msg)`                                                         | 368.0 被显示成 368.00。                                                                        |

运行结果：

```text
Customer Ben Li placed ORD-2041
Customer Ben Li placed ORD-2041 for HKD 368.00
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

|       | `+` 拼接                                                | f-string           |
| ----- | ----------------------------------------------------- | ------------------ |
| 空格    | 要自己写进每段引号里，很容易漏                                       | 就照着句子写             |
| 遇到数字  | **报错**：`"HKD " + 368.0` → `TypeError`，要写 `str(total)` | 自动转换               |
| 控制小数位 | 很麻烦                                                   | `{total:.2f}` 一步到位 |
| 句子一长  | 一堆 `" + "`，很难看出最终长什么样                                 | 读起来就是最终的句子         |

> **📌 test\_basics.py 是什么**
>
> 文件夹里的 `test_basics.py` 就是上面这格代码单独存成的 Python 文件。在终端里运行 `python test_basics.py` 会得到同样两行输出——notebook 的一格和一个 `.py` 文件本质上是一样的东西，只是运行方式不同。

---

## 2. 🔴 花括号里可以放算式和方法

**▶ Demo – expressions inside braces**（Day 1 · cell 16）

```python
# Demo: expressions inside f-string braces
unit_price = 48.0
qty = 3
product = "ceramic mug"

print(f"Line total for {qty} x {product}: HKD {unit_price * qty:.2f}")
print(f"Product label: {product.upper()}")
```

| 行 | 代码                                                                       | 在做什么                                                                      |
| - | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1 | `# Demo: expressions inside f-string braces`                             | 注释：`{}` 里不只能放变量，还能放算式和方法调用。                                               |
| 2 | `unit_price = 48.0`                                                      | 单价（float）。                                                                |
| 3 | `qty = 3`                                                                | 数量（int）。                                                                  |
| 4 | `product = "ceramic mug"`                                                | 商品名（str）。                                                                 |
| 6 | `print(f"Line total for {qty} x {product}: HKD {unit_price * qty:.2f}")` | `{unit_price * qty:.2f}`：先算 48.0 × 3 = 144.0，再按 `.2f` 显示成 144.00。`*` 是乘号。 |
| 7 | `print(f"Product label: {product.upper()}")`                             | `{}` 里调用方法：`product.upper()` 变大写。`product` 本身没被改。                         |

运行结果：

```text
Line total for 3 x ceramic mug: HKD 144.00
Product label: CERAMIC MUG
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

> **⚠️ f-string 里的引号**
>
> 花括号里如果要写字符串（比如字典的键），引号要和外面的**不一样**：外面 `f"…"`，里面就用 `'…'`，例如 `f"{row['alert_id']}"`。U9 会大量用到。

---

## 3. 🔴 冒号后面的格式说明

`{值:格式}`——冒号**前面**是要显示什么，冒号**后面**是怎么显示。最常用的几个：

| 格式                    | 读法                                | `x = 368.0`                     | 用在哪                |
| --------------------- | --------------------------------- | ------------------------------- | ------------------ |
| `.2f`                 | **f** = fixed-point 小数，`.2` = 2 位 | `368.00`                        | 金额（notebook 里出现最多） |
| `.0f`                 | 不要小数，四舍五入                         | `368`                           | 门槛、整数金额            |
| `.4f`                 | 4 位小数                             | `368.0000`                      | 模型 score（U13）      |
| `,.2f`                | `,` = 千分位                         | `368.00`（12850.5 → `12,850.50`） | 大金额报表              |
| `03d`                 | **d** = 整数，宽 3，前面补 `0`            | （只能用于 int：`7` → `007`）          | 编号 `Q-001`（U5）     |
| `>10` / `<10` / `^10` | 宽 10，靠右 / 靠左 / 居中                 | `    368.0`                     | 对齐表格列              |
| `.1%`                 | 乘 100 加 %，1 位小数                   | （0.9132 → `91.3%`）              | 概率、占比              |

试一试——自己换值和格式，特别是故意试试 `d` 配 float 会怎样：

*（网页版此处可以自己输入值和格式；下表是三个例子在常用格式下的结果，两边的 | 是为了看清空格）*

| 格式         | 说明                 | x = 368.0                                                      | x = 7            | x = 'TST'                                                    |
| ---------- | ------------------ | -------------------------------------------------------------- | ---------------- | ------------------------------------------------------------ |
| `{x}`      | 不写格式：和 print(x) 一样 | `\|368.0\|`                                                    | `\|7\|`          | `\|TST\|`                                                    |
| `{x:.2f}`  | 保留 2 位小数（钱最常用）     | `\|368.00\|`                                                   | `\|7.00\|`       | ValueError: Unknown format code 'f' for object of type 'str' |
| `{x:.0f}`  | 不要小数（四舍五入）         | `\|368\|`                                                      | `\|7\|`          | ValueError: Unknown format code 'f' for object of type 'str' |
| `{x:,.2f}` | 千分位逗号 + 2 位小数      | `\|368.00\|`                                                   | `\|7.00\|`       | ValueError: Unknown format code 'f' for object of type 'str' |
| `{x:03d}`  | 整数，至少 3 位，前面补 0    | ValueError: Unknown format code 'd' for object of type 'float' | `\|007\|`        | ValueError: Unknown format code 'd' for object of type 'str' |
| `{x:>10}`  | 宽 10，靠右（前面补空格）     | `\|     368.0\|`                                               | `\|         7\|` | `\|       TST\|`                                             |
| `{x:<10}`  | 宽 10，靠左            | `\|368.0     \|`                                               | `\|7         \|` | `\|TST       \|`                                             |
| `{x:^10}`  | 宽 10，居中            | `\|  368.0   \|`                                               | `\|    7     \|` | `\|   TST    \|`                                             |
| `{x:.1%}`  | 乘 100 显示成百分比，1 位小数 | `\|36800.0%\|`                                                 | `\|700.0%\|`     | ValueError: Unknown format code '%' for object of type 'str' |
| `{x:.4f}`  | 4 位小数（模型 score 常用） | `\|368.0000\|`                                                 | `\|7.0000\|`     | ValueError: Unknown format code 'f' for object of type 'str' |
| `{x:d}`    | 按整数显示（float 会报错）   | ValueError: Unknown format code 'd' for object of type 'float' | `\|7\|`          | ValueError: Unknown format code 'd' for object of type 'str' |

> **🧠 口诀**
>
> **冒号之后看字母**：`f` 小数、`d` 整数、`%` 百分比；**点后数字是位数**，**点前数字是宽度**，宽度前面的 `0` 是「拿 0 补位」。

---

## 4. 练习 P2：发票行

题目（cell 17）：用变量拼出 `Invoice INV-88 | Widget Pro x 4 | HKD 516.00`，金额两位小数。

**▶ Practice P2 – invoice line**（我的解答 / 补充 · Day 1 · cell 18）

```python
# Practice P2
invoice_no = "INV-88"
item = "Widget Pro"
units = 4
price = 129.0

print(f"Invoice {invoice_no} | {item} x {units} | HKD {units * price:.2f}")
```

| 行 | 代码                                                                              | 在做什么                                                                |
| - | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2 | `invoice_no = "INV-88"`                                                         | 题目给好的四个变量。                                                          |
| 7 | `print(f"Invoice {invoice_no} \| {item} x {units} \| HKD {units * price:.2f}")` | 一个 f-string 搞定：`\|` 只是普通字符；金额 = 4 × 129.0 = 516.0，`.2f` 显示成 516.00。 |

运行结果：

```text
Invoice INV-88 | Widget Pro x 4 | HKD 516.00
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

---

## 自测

**Day 1 Practice question 2：写一个 f-string，嵌入店名和 float 类型的 sales，两位小数，例如 Harbour Mart sales: HKD 15230.50**

> ```python
> store = "Harbour Mart"
> sales = 15230.5
> print(f"{store} sales: HKD {sales:.2f}")
> ```
>
> `15230.5` 用 `.2f` 显示成 `15230.50`。想要千分位就写 `{sales:,.2f}` → `15,230.50`。

**price = 129.0，print("HKD " + price) 会怎样？怎么改？**

> `TypeError: can only concatenate str (not "float") to str`——`+` 只能连字符串。改成 `print(f"HKD {price}")` 或 `print("HKD " + str(price))`。

**f"{n:03d}" 里，n = 42 和 n = 1234 分别显示什么？**

> `042` 和 `1234`。`3` 是**最少**宽度：不够就补 0，超过也不会截断。
