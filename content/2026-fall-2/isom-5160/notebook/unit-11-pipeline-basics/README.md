---
title:
  en: "Unit 11 · What a Hugging Face Pipeline Is"
  zh: "第 11 单元 · Hugging Face pipeline 是什么"
summary:
  en: "Model = structure + weights; where LLMs and Transformers sit; installing packages with %pip; import; pipeline(task, model, device) as a callable object; picking a model on the Hub; CPU vs GPU; and the shapes pipelines return."
  zh: "模型 = 结构 + 权重；LLM 和 Transformer 在哪一圈；%pip 安装；import；pipeline(任务, 模型, 设备) 这个可调用对象；在 Hub 上挑模型；CPU vs GPU；pipeline 返回的数据长什么样。"
unit: 11
date: 2026-11-06
tags: [Python, Hugging Face, transformers, pipeline, import, GPU]
---
# Unit 11 · Hugging Face pipeline 是什么

**这一单元学什么**：用别人训练好的 AI 模型，只要三行代码：`import` → `pipeline(任务, model=…)` → 把文字丢进去。这一单元先把这三行里的每个词讲清楚，后面四个单元再逐个任务展开。  
**对应材料**：`Pipeline_Intro.pdf`（Day 2 课件）Slides 4–20、`Pipelines_Tutorial.ipynb` Section 1、`Pipeline_SampleCode.ipynb` 的两种安装方式、`Pipeline_UsefulFunctions.ipynb` Section 1 Setup。

> **📌 这几个单元的运行器是模拟的**
>
> 真的跑这些代码要下载几百 MB 到几 GB 的模型，网页上做不到。运行器里的 `pipeline` 换成了一个「假的」：返回的**数据结构、键名、类型都和真的一样**，分数和生成的文字是示意值（两条 SST-2 情感结果来自 SampleCode 里老师保存的真实输出）。以你自己在 Colab 里跑出来的为准。

---

## 0. 生词表

| 术语                                  | 大白话                                                 | 例子                                    |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------- |
| **package / library** 包 / 库         | 别人写好、打包发布的一大堆代码，装上就能用                               | `transformers`、`torch`                |
| **`%pip install`**                  | 在 notebook 里安装包的命令（不是 Python 代码，是 notebook 的「魔法命令」） | `%pip install transformers`           |
| **`import`**                        | 把装好的包拿进当前程序                                         | `from transformers import pipeline`   |
| **model** 模型                        | 结构 + 训练好的权重（一大堆数字）                                  | `distilbert/distilgpt2`               |
| **pretrained / finetuned** 预训练 / 微调 | 先在海量数据上学通用能力 / 再在某个任务的数据上专门训练                       | `…-finetuned-sst-2-english`           |
| **Hugging Face Hub**                | 存放几十万个模型的网站 huggingface.co，模型名格式 `作者/模型名`           | `facebook/bart-large-cnn`             |
| **task** 任务                         | 你想让模型做哪类事                                           | `"text-generation"`、`"summarization"` |
| **pipeline**                        | 一个函数：给它任务 + 模型，返回一个**可以直接调用的对象**                    | `generator = pipeline(…)`             |
| **inference** 推理                    | 用训练好的模型对新输入做预测（不是训练）                                | `generator(prompt)`                   |
| **token**                           | 模型处理文字的最小单位，大约是一个词或半个词                              | "Learning" 可能是 1 个 token              |
| **device** 设备                       | 在哪儿算：CPU（`-1`，默认）还是第几块 GPU（`0`）                     | `device=0`                            |

---

## 1. 🟡 先认识：模型、LLM、Transformer

![Model = Structure + Weights；Trained Model = Structure + Optimized Weights。输出类别时附带一个 confidence score](images/page_05.png)

*Model = Structure + Weights；Trained Model = Structure + Optimized Weights。输出类别时附带一个 confidence score（Slide 5）*

| 课件原文                                              | 大白话                                                |
| ------------------------------------------------- | -------------------------------------------------- |
| **Model = Structure + Weights**                   | 模型 = 一张「神经网络的接线图」（结构）+ 每根线上的一个数字（权重）               |
| **Trained Model = Structure + Optimized Weights** | 训练就是用数据把这些数字**调到最好**。下载模型，下载的就是这堆调好的数字（所以动不动几百 MB） |
| **Accuracy / Confidence score**                   | 输出类别时会附带一个分数：模型对自己这个答案有多「确信」                       |

> **💼 课件开场的两个问题**
>
> - **A high score isn't the same as being right**：模型对一封邮件给出 0.98 的信心，安全分析师却认为它只是正常的 IT 通知。score 是模型自己的确信程度，**不是**「答对的概率」，更不是「值得采取行动」的依据。
> - **How do you pick a model like a business person?** 除了准确率，还要看：误报（false positive）成本、漏报（false negative）成本、速度（latency）、可解释性。钓鱼邮件过滤漏报代价高，宁可多报；自动封账号误报代价高，宁可少报。

![AI ⊃ ML ⊃ Deep Learning；NLP 和 DL 交叉的地方是 LLM。ChatGPT 是 GPT 的一个具体实现，GPT 建立在 Transformer 架构上](images/page_10.png)

*AI ⊃ ML ⊃ Deep Learning；NLP 和 DL 交叉的地方是 LLM。ChatGPT 是 GPT 的一个具体实现，GPT 建立在 Transformer 架构上（Slide 10）*

![Hugging Face 的 transformers 库：encoder-only（BERT）、decoder-only（GPT-2）、encoder-decoder（T5）](images/page_12.png)

*Hugging Face 的 transformers 库：encoder-only（BERT）、decoder-only（GPT-2）、encoder-decoder（T5）（Slide 12）*

| 架构                  | 代表      | 擅长                  | 本课出现的模型                                                 |
| ------------------- | ------- | ------------------- | ------------------------------------------------------- |
| **encoder-only**    | BERT    | **读懂**：分类、NER、问答、填空 | distilbert-…-sst-2、roberta-large-mnli、bert-base-uncased |
| **decoder-only**    | GPT-2   | **往下写**：续写、对话       | distilgpt2                                              |
| **encoder-decoder** | T5、BART | **读完再写**：摘要、翻译      | bart-large-cnn、opus-mt-en-zh                            |

---

## 2. 🔴 安装包：`%pip install`

三本 notebook 都有一格安装命令，每个新的 Colab 运行时**只需跑一次**：

```python
# Pipelines_Tutorial cell 6
%pip install "transformers>=4.33,<5.0" torch sentencepiece

# Pipeline_SampleCode Option B
%pip -q install "transformers>=4.33,<5.0" torch

# Pipeline_UsefulFunctions cell 7
%pip install --prefer-binary "transformers>=4.33,<5.0" torch sentencepiece pillow soundfile
```

| 部分                          | 意思                                                                    |
| --------------------------- | --------------------------------------------------------------------- |
| `%pip`                      | notebook 的魔法命令（`%` 开头，不是 Python 语法）：把包装进**当前这个 notebook 正在用的** Python |
| `install`                   | 安装                                                                    |
| `"transformers>=4.33,<5.0"` | 版本范围：≥ 4.33 且 < 5.0。锁住大版本，防止将来 5.0 改了用法让代码坏掉。有 `>` `<` 符号必须加引号       |
| `torch`                     | PyTorch，模型真正做矩阵运算的底层                                                  |
| `sentencepiece`             | 一种切 token 的工具，翻译（Marian）和语音模型要用                                       |
| `pillow` / `soundfile`      | 读图片 / 读写音频文件                                                          |
| `-q`                        | quiet：少打印安装过程                                                         |
| `--prefer-binary`           | 优先下载已经编译好的版本，装得快、少出错                                                  |

> **⚠️ Option A 和 Option B 只跑一个**
>
> SampleCode 里两格安装命令效果一样，只是输出多少不同。重复跑不会坏，只是浪费时间。安装输出里那些 `WARNING`（比如没有 HF\_TOKEN、no triton）一般可以忽略。

---

## 3. 🔴 一段 pipeline 代码的五个部分

![Input → Pipeline（Pre-processing → Applying the model → Post-processing）→ Inference；pipeline 由 Task 和 Model 决定](images/page_17.png)

*Input → Pipeline（Pre-processing → Applying the model → Post-processing）→ Inference；pipeline 由 Task 和 Model 决定（Slide 17）*

pipeline 帮你把三件麻烦事包起来：

1. **Pre-processing 预处理**：把文字切成 token，变成模型认识的数字。
2. **Applying the model 套用模型**：把数字送进神经网络算。
3. **Post-processing 后处理**：把模型吐出的数字变回人看得懂的东西（标签 + 分数、文字）。

![Import part → Creating pipeline object → Input data → Applying pipeline → Output data](images/page_18.png)

*Import part → Creating pipeline object → Input data → Applying pipeline → Output data（Slide 18）*

| 课件标签                         | 代码                                                                            | 用了哪个单元的知识               |
| ---------------------------- | ----------------------------------------------------------------------------- | ----------------------- |
| **Import part**              | `from transformers import pipeline`                                           | 本单元                     |
| **Creating pipeline object** | `generator = pipeline("text-generation", model="distilbert/distilgpt2")`      | 函数调用 + 关键字参数（U2）、变量（U1） |
| **Input data**               | `prompt = "Once upon a time…"`                                                | 字符串变量（U1）               |
| **Applying pipeline**        | `generated_story = generator(prompt, max_length=150, num_return_sequences=1)` | 像调用函数一样调用对象（U2）         |
| **Output data**              | `print(generated_story)`                                                      | 输出是 list of dicts（U9）   |

> **💡 小白理解：pipeline 是一台「组装好的机器」**
>
> `pipeline("text-generation", model=…)` 不是马上生成文字，而是**组装一台续写机器**，存进变量 `generator`。之后 `generator(prompt)` 才是「把原料放进机器」。组装一次（下载模型最慢），可以用很多次。

### `pipeline()` 的参数

| 参数               | 是什么                                      | 不写会怎样                                            |
| ---------------- | ---------------------------------------- | ------------------------------------------------ |
| 第 1 个位置参数 `task` | 任务名字符串                                   | 只给 `model=` 时，pipeline 从模型设置里推断任务（U13 的情感例子就是这样） |
| `model=`         | Hub 上的模型名 `作者/模型名`                       | 用这个任务的**默认模型**，并打印一条警告——项目里一定要写明                 |
| `device=`        | `-1` = CPU，`0` = 第 0 块 GPU               | 默认 CPU                                           |
| 任务专属参数           | 例如 NER 的 `aggregation_strategy="simple"` | 各任务自己的默认                                         |

---

## 4. 🟡 在 Hub 上挑模型

![How to use Pipeline：1. Pick a Task → 2. Pick a Model → 3. Use in Transformers → 4. Copy “high-level” helper](images/page_19.png)

*How to use Pipeline：1. Pick a Task → 2. Pick a Model → 3. Use in Transformers → 4. Copy “high-level” helper（Slide 19）*

1. 到 huggingface.co/models，左边 **Tasks** 里点你要的任务（例如 Text Classification）。
2. 在右边的列表里挑模型：看下载量、更新时间、模型卡说明（训练数据、语言、标签）。
3. 很多模型页面右边有 **Inference** 小框，可以先在网页上试几句。
4. 点 **Use this model → Transformers**，复制第一段「high-level helper」——就是 `pipe = pipeline("…", model="…")` 这一行。

> **💼 选模型时多看一眼的东西**
>
> 模型大小（CPU 跑不跑得动）、语言（英文模型读不懂中文邮件）、训练数据（在电影评论上训练的情感模型，用在安全告警上效果难说）、标签是什么（POSITIVE / NEGATIVE 还是 1–5 stars）。

---

## 5. 🔴 Setup：自动选 CPU 还是 GPU

**▶ Setup – pick CPU or GPU automatically**（模型输出为示意 · UsefulFunctions · cell 8）

```python
import torch
from transformers import pipeline, set_seed
from IPython.display import Audio, display

# Pipelines use the first CUDA GPU when available; otherwise, they run on the CPU.
device = 0 if torch.cuda.is_available() else -1
device_name = "GPU (device 0)" if device == 0 else "CPU"
print(f"Pipeline examples will run on: {device_name}")
```

| 行 | 代码                                                                                   | 在做什么                                                                                                    |
| - | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1 | `import torch`                                                                       | `import 包名` = 把别人写好的工具箱拿进来用。torch (PyTorch) 是模型真正做数学运算的底层库。                                             |
| 2 | `from transformers import pipeline, set_seed`                                        | `from 包 import 名字` = 只拿工具箱里的这两样，之后可以直接写 `pipeline(…)`，不用写 `transformers.pipeline(…)`。                   |
| 3 | `from IPython.display import Audio, display`                                         | notebook 专用：Audio 做播放器，display 把它显示出来。                                                                  |
| 5 | `# Pipelines use the first CUDA GPU when available; otherwise, they run on the CPU.` | 注释：有显卡就用显卡，没有就用 CPU。                                                                                    |
| 6 | `device = 0 if torch.cuda.is_available() else -1`                                    | 三元表达式（Unit 8 学过）：`torch.cuda.is_available()` 返回 True/False。有 GPU → device = 0（第 0 块显卡）；没有 → -1（表示 CPU）。 |
| 7 | `device_name = "GPU (device 0)" if device == 0 else "CPU"`                           | 只是为了打印给人看的名字。                                                                                           |
| 8 | `print(f"Pipeline examples will run on: {device_name}")`                             | Colab 默认是 CPU 运行时，所以这里显示 CPU。                                                                           |

运行结果：

```text
Pipeline examples will run on: CPU
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 写法                          | 意思                                                                         |
| --------------------------- | -------------------------------------------------------------------------- |
| `torch.cuda.is_available()` | 有没有可用的 NVIDIA 显卡（CUDA 是 NVIDIA 显卡的计算平台）→ True / False                      |
| `0 if … else -1`            | U8 的条件表达式：有 GPU 用 0，没有用 -1                                                 |
| Colab 换 GPU                 | **Runtime → Change runtime type → Hardware accelerator: GPU**，然后要重新跑 Setup |

GPU 能同时做大量乘法，大模型、批量输入时快很多；小模型、几句话，CPU 也够用。

---

## 6. 🔴 pipeline 的输出长什么样

UsefulFunctions 的 *Learning objectives and workflow* 表总结了三种输出模式：

| 输出                | 意思                             | 怎么取                        |
| ----------------- | ------------------------------ | -------------------------- |
| `[{...}]`         | 一个或多个结果 dict 组成的 list，分类和生成最常见 | `out[0]["label"]`          |
| `{...}`           | 单个结构化结果，问答、零样本、语音常见            | `result["answer"]`         |
| `label` + `score` | 预测的类别 + 模型的信心，**分数不保证正确**      | `f"{out[0]['score']:.4f}"` |

点一点下面各种 pipeline 的输出，体会「先看最外层是 list 还是 dict」：

*（网页版此处可以点数据里的任意一个值，自动写出取到它的代码，并逐层说明每一步拿到的是什么）*

**情感分析，一句话 → 还是 list（SampleCode cell 9）**

| 代码                | 拿到的是                                 | 值                                                      |
| ----------------- | ------------------------------------ | ------------------------------------------------------ |
| `out`             | list，1 个元素 → 下一步用 \[位置] 取            | `[{'label': 'POSITIVE', 'score': 0.9998743534088135}]` |
| `out[0]`          | dict，键：label / score → 下一步用 \["键"] 取 | `{'label': 'POSITIVE', 'score': 0.9998743534088135}`   |
| `out[0]["label"]` | str：最终的值                             | `'POSITIVE'`                                           |

**情感分析，传 list → 一条一个 dict（SampleCode cell 11）**

| 代码                | 拿到的是                                 | 值                                                              |
| ----------------- | ------------------------------------ | -------------------------------------------------------------- |
| `out`             | list，2 个元素 → 下一步用 \[位置] 取            | `[{'label': 'POSITIVE', 'score': 0.9998743534088135}, {'labe…` |
| `out[1]`          | dict，键：label / score → 下一步用 \["键"] 取 | `{'label': 'NEGATIVE', 'score': 0.9997480511665344}`           |
| `out[1]["score"]` | float：最终的值                           | `0.9997480511665344`                                           |

**文本生成（Tutorial cell 8）**

| 代码                                     | 拿到的是                                   | 值                                                              |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `generated_story`                      | list，1 个元素 → 下一步用 \[位置] 取              | `[{'generated_text': 'Once upon a time in a land far, far aw…` |
| `generated_story[0]`                   | dict，键：generated\_text → 下一步用 \["键"] 取 | `{'generated_text': 'Once upon a time in a land far, far awa…` |
| `generated_story[0]["generated_text"]` | str：最终的值                               | `'Once upon a time in a land far, far away, the most importa…` |

**问答 → 一个 dict，没有 \[0]（Tutorial cell 24）**

| 代码                 | 拿到的是                                                | 值                                                              |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------- |
| `result`           | dict，键：score / start / end / answer → 下一步用 \["键"] 取 | `{'score': 0.6824, 'start': 89, 'end': 112, 'answer': 'Artif…` |
| `result["answer"]` | str：最终的值                                            | `'Artificial Intelligence'`                                    |

**零样本分类 → dict 里两个平行 list（UsefulFunctions cell 24）**

| 代码                            | 拿到的是                                              | 值                                                              |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `classification`              | dict，键：sequence / labels / scores → 下一步用 \["键"] 取 | `{'sequence': 'Employees received emails requesting urgent p…` |
| `classification["labels"]`    | list，4 个元素 → 下一步用 \[位置] 取                         | `['phishing', 'malware', 'data backup', 'physical security']`  |
| `classification["labels"][0]` | str：最终的值                                          | `'phishing'`                                                   |

**NER（aggregation\_strategy="simple"）（UsefulFunctions cell 12）**

| 代码                    | 拿到的是                                                              | 值                                                              |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `entities`            | list，3 个元素 → 下一步用 \[位置] 取                                         | `[{'entity_group': 'PER', 'score': 0.9991, 'word': 'Alice Ch…` |
| `entities[1]`         | dict，键：entity\_group / score / word / start / end → 下一步用 \["键"] 取 | `{'entity_group': 'ORG', 'score': 0.9987, 'word': 'Microsoft…` |
| `entities[1]["word"]` | str：最终的值                                                          | `'Microsoft'`                                                  |

**语音合成 → dict（Tutorial cell 30）**

| 代码                               | 拿到的是                                          | 值                                                              |
| -------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `speech_output`                  | dict，键：audio / sampling\_rate → 下一步用 \["键"] 取 | `{'audio': '<array, shape (1, 87296)>', 'sampling_rate': 160…` |
| `speech_output["sampling_rate"]` | int：最终的值                                      | `16000`                                                        |

*（网页版此处是点选练习：这个 pipeline 返回什么形状？第一步该怎么取？；下表是全部题目和答案）*

| 题目                                                               | 答案                         | 理由                                                           |
| ---------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `sentiment pipe("This restaurant is awesome")（只传一句）`             | **list of dicts → 先 \[0]** | 即使只有一句也返回 list：out\[0]\["label"]                             |
| `text-generation generator(prompt, num_return_sequences=1)`      | **list of dicts → 先 \[0]** | 每个版本一个 dict：generated\_story\[0]\["generated\_text"]         |
| `question-answering qa(question=…, context=…)`                   | **一个 dict → 直接 \["键"]**    | 直接 result\["answer"]，写 result\[0] 会 KeyError                 |
| `zero-shot-classification zero_shot(ticket, candidate_labels=…)` | **一个 dict → 直接 \["键"]**    | 一个 dict，里面 labels 和 scores 是两个平行 list                        |
| `text-to-speech tts(text)`                                       | **一个 dict → 直接 \["键"]**    | speech\_output\["audio"] 和 speech\_output\["sampling\_rate"] |
| `ner_pipeline("Deep Learning (DL) represents …")（句子里没有人名地名）`     | **可能是空 list \[]**          | 没有 PER / ORG / LOC / MISC 实体时返回 \[]，for 循环一次也不跑，不会报错         |
| `summarizer(article, max_length=80)`                             | **list of dicts → 先 \[0]** | summary\[0]\["summary\_text"]                                |
| `translation_pipeline(text, max_length=512)`                     | **list of dicts → 先 \[0]** | translated\_text\[0]\["translation\_text"]                   |

> **🧠 拿到陌生输出的三步**
>
> 1. 先 `print(out)` 整个看一眼；
> 2. 最外层是 `[` 就先 `[0]`，是 `{` 就直接 `["键"]`；
> 3. 不知道有什么键就 `print(out[0].keys())`。

---

## 自测

**from transformers import pipeline 和 import transformers 有什么区别？**

> 前者只拿 `pipeline` 这一个名字，之后直接写 `pipeline(…)`；后者拿整个包，之后要写 `transformers.pipeline(…)`。效果一样，前者更短。

**为什么 pipeline("text-generation", model=…) 这一行最慢，而 generator(prompt) 相对快？**

> 第一行要**下载模型权重**（distilgpt2 约 353 MB）并加载进内存；之后每次调用只是做推理。所以组装一次、重复使用，不要在循环里每次都重新 `pipeline(…)`。

**设置了 device=0，但运行时报和 CUDA 有关的错误，最可能是什么原因？**

> 当前运行时没有 GPU。去 Runtime → Change runtime type 选 GPU，或者删掉 `device=0` / 改成 `device=-1` 用 CPU。
