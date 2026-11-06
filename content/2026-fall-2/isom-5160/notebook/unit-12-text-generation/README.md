---
title:
  en: "Unit 12 · Text Generation: Continuing a Prompt"
  zh: "第 12 单元 · 文本生成：让模型接着写"
summary:
  en: "distilgpt2 on CPU and GPU, max_length vs max_new_tokens, num_return_sequences, do_sample, temperature, set_seed and pad_token_id — with a temperature lab."
  zh: "distilgpt2 在 CPU / GPU 上续写；max_length vs max_new_tokens、num_return_sequences、do_sample、temperature、set_seed、pad_token_id，附 temperature 实验台。"
unit: 12
date: 2026-11-06
tags: [Python, Hugging Face, Text generation, GPT-2, Sampling]
---
# Unit 12 · 文本生成：让模型接着写

**这一单元学什么**：给一个开头（prompt），让 GPT 类模型往下写。重点是生成时那几个参数各管什么。  
**对应材料**：`Pipelines_Tutorial.ipynb` Sections 2–3（cells 7–11）、`Pipeline_SampleCode.ipynb` Section 1、`Pipeline_UsefulFunctions.ipynb` Section 7（cell 20）、课件 Slide 18。

---

## 0. 生词表

| 术语                               | 大白话                                     |
| -------------------------------- | --------------------------------------- |
| **prompt**                       | 给模型的开头 / 指令                             |
| **causal language model** 因果语言模型 | 只看前面的字，预测**下一个** token，一个接一个往下写（GPT 系列） |
| **distilgpt2**                   | GPT-2 的「蒸馏」小号版：更小更快，写得也更差，适合教学          |
| **greedy decoding** 贪心           | 每次都选概率最高的那个 token                       |
| **sampling** 抽样                  | 按概率随机抽一个 token，所以每次结果不同                 |
| **random seed** 随机种子             | 随机数的起点，固定它，「随机」的结果就能复现                  |

---

## 1. 🔴 最基本的续写（CPU）

**▶ Generate text on a CPU**（模型输出为示意 · Tutorial · cell 8 / SampleCode · cell 6）

```python
from transformers import pipeline

# The pipeline bundles model loading, tokenization, and text generation into one callable object.
generator = pipeline("text-generation",
                     model="distilbert/distilgpt2")

prompt = "Once upon a time in a land far, far away"
# max_length includes tokens already present in the prompt.
generated_story = generator(prompt,
                            max_length=150,
                            num_return_sequences=1)

# The pipeline returns a list of dictionaries, one for each requested sequence.
print("Generated Story:")
print(generated_story[0]['generated_text'])
```

| 行  | 代码                                                                                                  | 在做什么                                                                                           |
| -- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1  | `from transformers import pipeline`                                                                 | 拿到 `pipeline` 这个函数。                                                                            |
| 3  | `# The pipeline bundles model loading, tokenization, and text generation into one callable object.` | 注释：pipeline 把「下载模型 → 把文字切成 token → 生成 → 把 token 变回文字」打包成一个可以直接调用的对象。                           |
| 4  | `generator = pipeline("text-generation",`                                                           | 调用 `pipeline(…)`。第 1 个参数是**任务名 (task)**："text-generation" = 续写文字。括号没关，下一行继续。                   |
| 5  | `model="distilbert/distilgpt2")`                                                                    | `model=` 指定用 Hugging Face Hub 上哪个模型（格式：作者/模型名）。返回值是一个**管道对象**，存进 `generator`。第一次运行会下载约 353 MB。 |
| 7  | `prompt = "Once upon a time in a land far, far away"`                                               | **prompt** = 给模型的开头，它负责接着写。                                                                    |
| 8  | `# max_length includes tokens already present in the prompt.`                                       | 注释：max\_length 包括 prompt 本身的 token。                                                            |
| 9  | `generated_story = generator(prompt,`                                                               | 像调用函数一样调用管道对象，第一个参数是输入文字。                                                                      |
| 10 | `max_length=150,`                                                                                   | `max_length=150`：prompt + 续写**总共**最多 150 个 token（大约 100 多个英文单词）。                               |
| 11 | `num_return_sequences=1)`                                                                           | `num_return_sequences=1`：要几个不同版本的续写。返回的 list 就有几个元素。                                           |
| 13 | `# The pipeline returns a list of dictionaries, one for each requested sequence.`                   | 注释：返回「list 里装 dict」，每个版本一个 dict。                                                               |
| 15 | `print(generated_story[0]['generated_text'])`                                                       | `[0]` 取 list 第一个元素（一个 dict），再 `['generated_text']` 取出文字。和 Unit 9 的 `alerts[0]["score"]` 一模一样。  |

运行结果：

```text
Generated Story:
Once upon a time in a land far, far away, the most important thing is to make sure the people of this land, not just those with the greatest potential for prosperity, are not in the hands of the people of this land.
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 参数                     | 管什么                         | 例子里的值                                        |
| ---------------------- | --------------------------- | -------------------------------------------- |
| 第 1 个参数（prompt）        | 开头的文字                       | `"Once upon a time in a land far, far away"` |
| `max_length`           | prompt + 新生成的**总** token 上限 | `150`                                        |
| `num_return_sequences` | 要几个不同版本 → 返回的 list 有几个 dict | `1`                                          |

> **⚠️ SampleCode 输出里的那几行警告**
>
> 老师 SampleCode 保存的输出里有：*Both `max_new_tokens` (=256) and `max_length` (=150) seem to have been set. `max_new_tokens` will take precedence.*——新版 transformers 里模型自带了默认的 `max_new_tokens`，它会**优先于** `max_length`。想精确控制长度，就像 UsefulFunctions 那样直接写 `max_new_tokens=`。还有 *Setting `pad_token_id` to `eos_token_id`*，第 3 节解释。

> **📌 print(generated\_story) vs print(generated\_story\[0]\['generated\_text'])**
>
> SampleCode 直接 `print(generated_story)`，你会看到 `[{'generated_text': '…'}]`——带方括号、花括号、引号，就是整个 list of dicts。Tutorial 多走了两层（`[0]` 再 `['generated_text']`），只打印文字本身，更好读。

---

## 2. 🟡 换到 GPU：只差一个参数

**▶ Generate text on a GPU（只差一个参数）**（模型输出为示意 · Tutorial · cell 10）

```python
from transformers import pipeline

# device=0 selects the first CUDA GPU visible to the current runtime.
generator = pipeline("text-generation",
                     model="distilbert/distilgpt2",
                     device=0)

prompt = "Once upon a time in a land far, far away"
# Keep the same generation settings so the CPU and GPU workflows are comparable.
generated_story = generator(prompt,
                            max_length=150,
                            num_return_sequences=1)

print("Generated Story:")
print(generated_story[0]['generated_text'])
```

| 行 | 代码                                                                                 | 在做什么                                                                 |
| - | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 3 | `# device=0 selects the first CUDA GPU visible to the current runtime.`            | 注释。                                                                  |
| 6 | `device=0)`                                                                        | **唯一的不同**：`device=0` = 放到第 0 块 GPU 上跑。没开 GPU 运行时就会报错（真实环境里；这里的模拟不会）。 |
| 9 | `# Keep the same generation settings so the CPU and GPU workflows are comparable.` | 注释：其他设置不变，方便比较速度。                                                    |

运行结果：

```text
Generated Story:
Once upon a time in a land far, far away, the most important thing is to make sure the people of this land, not just those with the greatest potential for prosperity, are not in the hands of the people of this land.
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

和 CPU 版本**唯一的区别**是 `device=0`。其他设置保持一样，才能公平比较速度。notebook cell 11 留了一个空格让你检查 GPU：

```python
import torch
print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU name:", torch.cuda.get_device_name(0))
```

---

## 3. 🔴 控制「怎么写」：抽样参数

**▶ Text generation with sampling settings**（模型输出为示意 · UsefulFunctions · cell 20）

*Setup 那格已经算好 device = -1（CPU）。*

```python
# Set a seed to make sampling more reproducible for demonstration purposes.
set_seed(42)
text_generator = pipeline(
    "text-generation",
    model="distilbert/distilgpt2",
    device=device,
)

prompt = "A well-designed security policy should"
generated = text_generator(
    prompt,
    max_new_tokens=35,
    do_sample=True,
    temperature=0.8,
    num_return_sequences=1,
    pad_token_id=text_generator.tokenizer.eos_token_id,
)

print(generated[0]["generated_text"])
```

| 行  | 代码                                                                            | 在做什么                                                                                |
| -- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1  | `# Set a seed to make sampling more reproducible for demonstration purposes.` | 注释。                                                                                 |
| 2  | `set_seed(42)`                                                                | 固定**随机种子**：抽样有随机性，种子一样，每次跑出来的结果就一样（方便上课对答案）。42 只是习惯用的数字。                            |
| 3  | `text_generator = pipeline(`                                                  | 参数多的时候，常见写法是每个参数一行，结尾留逗号。                                                           |
| 4  | `"text-generation",`                                                          | 任务名。                                                                                |
| 5  | `model="distilbert/distilgpt2",`                                              | 模型。                                                                                 |
| 6  | `device=device,`                                                              | 左边 `device=` 是**参数名**，右边 `device` 是我们上面算好的**变量**。名字相同只是巧合。                          |
| 11 | `prompt,`                                                                     | 输入（位置参数，放第一个）。                                                                      |
| 12 | `max_new_tokens=35,`                                                          | `max_new_tokens`：**只数新生成的** token，最多 35 个。比 max\_length 更直观，推荐用这个。                  |
| 13 | `do_sample=True,`                                                             | `do_sample=True`：按概率**抽样**选下一个词（有变化）；False 就每次都选概率最高的那个（贪心，容易重复）。                   |
| 14 | `temperature=0.8,`                                                            | `temperature`：抽样的「大胆程度」。< 1 更保守、更像高概率词；> 1 更随机、更有创意也更容易胡说。只在 do\_sample=True 时起作用。 |
| 16 | `pad_token_id=text_generator.tokenizer.eos_token_id,`                         | 技术细节：GPT-2 没有专门的「填充」token，就借用「结束」token（编号 50256）。加上这一行可以消掉一条警告。`对象.属性.属性` 一层层往里取。   |
| 19 | `print(generated[0]["generated_text"])`                                       | 同样是 list → dict → 文字。                                                               |

运行结果：

```text
A well-designed security policy should be simple enough for every employee to follow, and it should be reviewed every year by the people who use it.
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 参数                           | 管什么              | 小白解释                                     |
| ---------------------------- | ---------------- | ---------------------------------------- |
| `max_new_tokens=35`          | **只数新生成的** token | 比 `max_length` 直观：不管 prompt 多长，都再写 35 个  |
| `do_sample=True`             | 抽样 vs 贪心         | False：每次选最可能的词，稳定但容易重复绕圈；True：按概率抽，有变化   |
| `temperature=0.8`            | 抽样有多「大胆」         | < 1 保守，> 1 天马行空；只在 `do_sample=True` 时有用 |
| `num_return_sequences=1`     | 版本数              | 抽样时设 3，就会得到 3 个不同的续写                     |
| `pad_token_id=…eos_token_id` | 填充用哪个 token      | GPT-2 没有专门的填充 token，借用「结束」token，消掉警告     |
| `set_seed(42)`               | 固定随机种子           | 同样的种子 + 同样的设置 → 同样的结果，方便对答案              |

*（网页版此处可以切换 do\_sample、拖动 temperature；prompt = "A well-designed security policy should"，分数是示意值。do\_sample=False 时永远选第一名 " be"）*

| 下一个 token    | temperature=0.5 | temperature=1 | temperature=1.5 |
| ------------ | --------------- | ------------- | --------------- |
| `" be"`      | 75.7%           | 50.4%         | 39.4%           |
| `" include"` | 15.3%           | 22.7%         | 23.1%           |
| `" protect"` | 6.9%            | 15.2%         | 17.7%           |
| `" always"`  | 1.7%            | 7.5%          | 11.1%           |
| `" never"`   | 0.4%            | 3.7%          | 7.0%            |
| `" banana"`  | 0.0%            | 0.5%          | 1.7%            |

> **💼 生成的内容不能直接用**
>
> notebook 反复提醒：生成的文字可能**不准确、重复、不合适**。UsefulFunctions 原话：*do not treat generated text as approved policy*。在业务里它只能是草稿，要有人审。

---

## 自测

**num\_return\_sequences=3 时，generated\_story 有几个元素？怎么打印第二个版本？**

> 3 个 dict。`print(generated_story[1]["generated_text"])`（第二个是位置 1）。也可以 `for g in generated_story: print(g["generated_text"])` 全部打印。

**do\_sample=False 时，改 temperature 有用吗？**

> 没用。不抽样时每一步都选概率最高的 token，温度只影响「抽样时的概率分布」。（新版 transformers 还会提醒你这个参数被忽略了。）

**prompt 有 10 个 token，max\_length=15，最多会生成几个新 token？如果改成 max\_new\_tokens=15 呢？**

> `max_length=15` → 最多 5 个新 token（总数 15 包括 prompt 的 10 个）；`max_new_tokens=15` → 最多 15 个新 token。
