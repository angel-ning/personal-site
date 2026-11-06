---
title:
  en: "Unit 10 · Dictionary of Dictionaries: Look Up a Whole Card by ID"
  zh: "第 10 单元 · dict of dicts：按编号查一整张卡片"
summary:
  en: "Outer key → inner dict (inventory, staff), two-bracket access d[outer][inner], looping with .items(), reorder flags with if / elif / else, updating a nested field, the employee practice, and list-of-dicts vs dict-of-dicts."
  zh: "外层键 → 内层 dict（库存、员工）；两层方括号取值；.items() 遍历；补货标记；改嵌套字段；Practice P4 解答；什么时候用 list of dicts、什么时候用 dict of dicts。"
unit: 10
date: 2026-11-06
tags: [Python, dict of dicts, Nested data, Lookup]
---
# Unit 10 · dict of dicts：按编号查一整张卡片

**这一单元学什么**：U9 是「一张表」，要找某一行得从头扫。如果你总是**按编号**找（SKU、员工号、资产标签），就把编号当外层的键：`inventory["VPN Token"]` 一步拿到那张卡片。  
**对应材料**：Day 2 data-structures notebook Section 5（cell 35–41）+ 末尾 Practice questions。

---

## 0. 生词表

| 术语                         | 大白话             | 例子                                     |
| -------------------------- | --------------- | -------------------------------------- |
| **outer key** 外层键          | 用来查的编号 / 名字     | `"VPN Token"`、`"E101"`                 |
| **inner dict** 内层字典        | 这个编号对应的一整张卡片    | `{"stock": 8, "reorder_level": 10, …}` |
| **nested access** 嵌套取值     | 连续两个方括号，一层一层往里走 | `inventory["VPN Token"]["stock"]`      |
| **nested assignment** 嵌套赋值 | 用同样的路径把新值写回去    | `staff["E102"]["years"] = 3`           |

```
inventory ──► {
   "Smart Badge": {stock, reorder_level, unit_cost},
   "VPN Token":   {stock, reorder_level, unit_cost},   ← inventory["VPN Token"]
   "USB-C Cable": {stock, reorder_level, unit_cost},
}
inventory["VPN Token"]["unit_cost"]  → 60.0
```

---

## 1. 🔴 遍历 + 补货标记

**▶ Demo – inventory lookup and reorder flags**（Day 2 · cell 37）

```python
# Demo: dictionary of dictionaries - supply closet
inventory = {
    "Smart Badge": {
        "stock": 25,
        "reorder_level": 20,
        "unit_cost": 40.0,
    },
    "VPN Token": {
        "stock": 8,
        "reorder_level": 10,
        "unit_cost": 60.0,
    },
    "USB-C Cable": {
        "stock": 40,
        "reorder_level": 15,
        "unit_cost": 25.0,
    },
}

print("SKU | stock | flag")
for sku, info in inventory.items():
    stock = info["stock"]
    level = info["reorder_level"]
    if stock < level:
        flag = "REORDER NOW"
    elif stock == level:
        flag = "AT LIMIT"
    else:
        flag = "OK"
    print(f"{sku} | {stock} | {flag}")

print("VPN Token unit cost:", inventory["VPN Token"]["unit_cost"])
```

| 行  | 代码                                                                   | 在做什么                                                                              |
| -- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1  | `# Demo: dictionary of dictionaries - supply closet`                 | 注释：dict 里装 dict = 按「名字」查一整张卡片。                                                    |
| 2  | `inventory = {`                                                      | 外层 dict：键是商品名。                                                                    |
| 3  | `"Smart Badge": {`                                                   | 键 "Smart Badge" 对应的值是**另一个 dict**。                                                |
| 4  | `"stock": 25,`                                                       | 内层 dict：这件商品的各个字段。                                                                |
| 20 | `print("SKU \| stock \| flag")`                                      | 表头。                                                                               |
| 21 | `for sku, info in inventory.items():`                                | `.items()` 给出 (外层键, 内层 dict)：sku 是商品名，info 是那张卡片。                                 |
| 22 | `stock = info["stock"]`                                              | 从卡片里取库存。                                                                          |
| 23 | `level = info["reorder_level"]`                                      | 取补货线。                                                                             |
| 24 | `if stock < level:`                                                  | 低于补货线 → 马上补。                                                                      |
| 26 | `elif stock == level:`                                               | 刚好等于 → 到线了。                                                                       |
| 32 | `print("VPN Token unit cost:", inventory["VPN Token"]["unit_cost"])` | **两层方括号**：先 `inventory["VPN Token"]` 拿到那张卡片（dict），再在卡片上 `["unit_cost"]`。从左往右一层层走。 |

运行结果：

```text
SKU | stock | flag
Smart Badge | 25 | OK
VPN Token | 8 | REORDER NOW
USB-C Cable | 40 | OK
VPN Token unit cost: 60.0
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

*（网页版此处可以点数据里的任意一个值，自动写出取到它的代码，并逐层说明每一步拿到的是什么）*

**dict of dicts：库存（Day 2 cell 37）**

| 代码                                    | 拿到的是                                                         | 值                                                              |
| ------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `inventory`                           | dict，键：Smart Badge / VPN Token / USB-C Cable → 下一步用 \["键"] 取 | `{'Smart Badge': {'stock': 25, 'reorder_level': 20, 'unit_co…` |
| `inventory["VPN Token"]`              | dict，键：stock / reorder\_level / unit\_cost → 下一步用 \["键"] 取   | `{'stock': 8, 'reorder_level': 10, 'unit_cost': 60.0}`         |
| `inventory["VPN Token"]["unit_cost"]` | float：最终的值                                                   | `60.0`                                                         |

**dict of dicts：员工（Day 2 Practice P4）**

| 代码                      | 拿到的是                                       | 值                                                              |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `staff`                 | dict，键：E100 / E101 / E102 → 下一步用 \["键"] 取  | `{'E100': {'name': 'Ada Chen', 'team': 'network', 'years': 6…` |
| `staff["E101"]`         | dict，键：name / team / years → 下一步用 \["键"] 取 | `{'name': 'Ben Li', 'team': 'endpoint', 'years': 3}`           |
| `staff["E101"]["team"]` | str：最终的值                                   | `'endpoint'`                                                   |

*（网页版此处可以拖动 / 选择变量的值，看 if / elif / else 从上往下哪一支被选中：补货标记（Day 2 cell 37））*

```python
if stock < level:
    ...
elif stock == level:
    ...
else:
    ...
```

| 输入                       | 每个条件  | 走哪一支                   | 结果                   |
| ------------------------ | ----- | ---------------------- | -------------------- |
| `stock = 25, level = 20` | ✗ ✗ ✓ | `else:`                | flag = "OK"          |
| `stock = 8, level = 10`  | ✓ – – | `if stock < level:`    | flag = "REORDER NOW" |
| `stock = 10, level = 10` | ✗ ✓ – | `elif stock == level:` | flag = "AT LIMIT"    |

| 写法                                    | 拿到什么                         |
| ------------------------------------- | ---------------------------- |
| `inventory`                           | 整个外层 dict                    |
| `inventory["VPN Token"]`              | VPN Token 的卡片（内层 dict）       |
| `inventory["VPN Token"]["stock"]`     | 卡片上的 stock：`8`               |
| `for sku, info in inventory.items():` | 每轮：`sku` = 商品名，`info` = 那张卡片 |

---

## 2. 🔴 改嵌套字段

**▶ Demo – update a nested field**（Day 2 · cell 39）

*前一格已经建好 inventory（VPN Token 的 stock 是 8）。*

```python
# Demo: update nested stock after delivery
inventory["VPN Token"]["stock"] = inventory["VPN Token"]["stock"] + 5
print("VPN Token stock now:", inventory["VPN Token"]["stock"])
```

| 行 | 代码                                                                      | 在做什么                                                   |
| - | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| 1 | `# Demo: update nested stock after delivery`                            | 注释：到货 5 个。                                             |
| 2 | `inventory["VPN Token"]["stock"] = inventory["VPN Token"]["stock"] + 5` | 先算右边：读出 8，加 5 = 13；再写回左边那个位置。也可以写成 `… ["stock"] += 5`。 |

运行结果：

```text
VPN Token stock now: 13
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

> **💡 小白理解：先找到抽屉，再改里面的东西**
>
> `inventory["VPN Token"]["stock"] = 13` 读作：在 inventory 柜子里找到「VPN Token」那个抽屉，把抽屉里 stock 那一格换成 13。左边的路径和取值时一模一样，只是放在 `=` 左边。

---

## 3. 练习 P4：员工目录

题目（cell 40）：① 每个员工打印成 `emp_id | name | team | years`；② 按年资加上 `senior`（≥ 5）/ `mid`（≥ 2）/ `junior`；③ 打印 E101 的 team；④ 把 E102 的 years 改成 3。

**▶ Practice P4 – employee directory**（我的解答 / 补充 · Day 2 · cell 41）

```python
staff = {
    "E100": {"name": "Ada Chen", "team": "network", "years": 6},
    "E101": {"name": "Ben Li", "team": "endpoint", "years": 3},
    "E102": {"name": "Cara Ng", "team": "identity", "years": 1},
}

for emp_id, info in staff.items():
    if info["years"] >= 5:
        band = "senior"
    elif info["years"] >= 2:
        band = "mid"
    else:
        band = "junior"
    print(f"{emp_id} | {info['name']} | {info['team']} | {info['years']} | {band}")

print("E101 team:", staff["E101"]["team"])
staff["E102"]["years"] = 3
print("E102 years now:", staff["E102"]["years"])
```

| 行  | 代码                                                                                    | 在做什么                                |
| -- | ------------------------------------------------------------------------------------- | ----------------------------------- |
| 1  | `staff = {`                                                                           | 题目数据。                               |
| 7  | `for emp_id, info in staff.items():`                                                  | 第 1–2 项：emp\_id 是外层键，info 是内层 dict。 |
| 8  | `if info["years"] >= 5:`                                                              | 先判断年资档位……                           |
| 14 | `print(f"{emp_id} \| {info['name']} \| {info['team']} \| {info['years']} \| {band}")` | ……再一起打印在同一行。                        |
| 16 | `print("E101 team:", staff["E101"]["team"])`                                          | 第 3 项：两层取值。                         |
| 17 | `staff["E102"]["years"] = 3`                                                          | 第 4 项：两层赋值，直接改掉原来的 1。               |

运行结果：

```text
E100 | Ada Chen | network | 6 | senior
E101 | Ben Li | endpoint | 3 | mid
E102 | Cara Ng | identity | 1 | junior
E101 team: endpoint
E102 years now: 3
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

---

## 4. 🟡 list of dicts 还是 dict of dicts？

|      | list of dicts（U9） | dict of dicts（U10）           |
| ---- | ----------------- | ---------------------------- |
| 长什么样 | `[{…}, {…}, {…}]` | `{"E100": {…}, "E101": {…}}` |
| 找某一条 | 从头扫，看哪行的 id 对     | `staff["E101"]` 一步到位         |
| 顺序   | 天然有顺序（队列、时间线）     | 主要靠键查                        |
| 重复   | 可以有两条一样的记录        | 键唯一，同一个编号只能有一张卡              |
| 适合   | 告警流、工单队列、模型的输出    | 库存、员工档案、资产清单                 |

---

## 自测

**Day 2 Practice question 5：建一个 assets（dict of dicts，内层 owner、status），打印每个资产标签和 OK / CHECK。**

> ```python
> assets = {
>     "LAP-001": {
>         "owner": "Ada Chen",
>         "status": "active",
>     },
>     "LAP-002": {
>         "owner": "Ben Li",
>         "status": "lost",
>     },
> }
>
> for tag, info in assets.items():
>     if info["status"] == "active":
>         flag = "OK"
>     else:
>         flag = "CHECK"
>     print(f"{tag} | {info['owner']} | {flag}")
> ```

**Day 2 Practice question 7：什么时候用 list of dicts 而不是 dict of dicts？（两句话）**

> 当记录**有先后顺序**、或者**没有唯一编号**、或者主要是**一条条按顺序处理**时（例如告警流、工单队列），用 list of dicts。当你经常**按某个唯一编号直接查**一条记录时（例如按 SKU 查库存），用 dict of dicts。

**inventory\["Webcam"]\["stock"] 会怎样？怎么安全地查？**

> 外层没有 "Webcam" → `KeyError: 'Webcam'`。安全写法：`inventory.get("Webcam", {}).get("stock", 0)`——外层找不到就先给一个空 dict，再在空 dict 上 `.get` 出默认 0。
