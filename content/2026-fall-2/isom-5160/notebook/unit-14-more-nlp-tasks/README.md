---
title:
  en: "Unit 14 · More NLP Pipelines: Summarize, NER, QA, Translate, Fill-mask"
  zh: "第 14 单元 · 更多 NLP 任务：摘要、NER、问答、翻译、填空"
summary:
  en: "Summarization (max_length / min_length / do_sample), NER with and without aggregation_strategy, extractive question answering with question= and context=, translation task names, fill-mask with tokenizer.mask_token, top_k and enumerate."
  zh: "摘要（max_length / min_length / do_sample）、NER 和 aggregation_strategy、抽取式问答（question= / context=）、翻译任务名、填空（tokenizer.mask_token、top_k、enumerate）。"
unit: 14
date: 2026-11-06
tags: [Python, Hugging Face, Summarization, NER, Question answering, Translation, Fill-mask]
---
# Unit 14 · 更多 NLP 任务：摘要、NER、问答、翻译、填空

**这一单元学什么**：同一套 `pipeline(任务, model=…)` → 调用 → 取结果，换五种任务。每种任务只需要记三件事：**任务名、特有的参数、结果的键名**。  
**对应材料**：`Pipelines_Tutorial.ipynb` Sections 5–8（cells 19–26）、`Pipeline_UsefulFunctions.ipynb` Sections 3–6 和 8。

---

## 0. 一张表看完五个任务

| 任务名                                | 做什么          | 特有参数                                  | 结果形状 → 取值                                                          |
| ---------------------------------- | ------------ | ------------------------------------- | ------------------------------------------------------------------ |
| `"summarization"`                  | 长文 → 短文（改写式） | `max_length`、`min_length`、`do_sample` | list of dicts → `summary[0]["summary_text"]`                       |
| `"ner"` / `"token-classification"` | 找出人名、组织、地名   | `aggregation_strategy="simple"`       | list of dicts（可能是 `[]`）→ `entity["word"]`、`entity["entity_group"]` |
| `"question-answering"`             | 从给定文章里找答案    | `question=`、`context=`                | **一个 dict** → `result["answer"]`                                   |
| `"translation_en_to_zh"` 等         | 翻译           | `max_length`                          | list of dicts → `out[0]["translation_text"]`                       |
| `"fill-mask"`                      | 猜被遮住的词       | `top_k`                               | list of dicts → `s["token_str"]`                                   |

---

## 1. 🔴 摘要 Summarization

**▶ Summarization (BART)**（模型输出为示意 · Tutorial · cell 20）

```python
from transformers import pipeline

# BART is an encoder-decoder model designed for abstractive summarization.
summarizer = pipeline("summarization",
                      model="facebook/bart-large-cnn")

article = """
Deep Learning (DL) represents a highly promising approach to
developing applications in Artificial Intelligence (AI).
Its capacity to effectively train on large, unstructured
historical datasets and accurately predict outcomes positions
it as an exceptionally valuable tool across various business
domains, including finance, marketing, customer service, and
information security.
"""

# Restrict the generated summary to at most 80 tokens.
summary = summarizer(article,
                     max_length=80)

print("Original Article:")
print(article)
print("\nGenerated Summary:")
print(summary[0]['summary_text'])
```

| 行  | 代码                                                                           | 在做什么                                                    |
| -- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| 3  | `# BART is an encoder-decoder model designed for abstractive summarization.` | 注释：**abstractive**（生成式）摘要 = 用自己的话重写，不是从原文挑句子。           |
| 5  | `model="facebook/bart-large-cnn")`                                           | 在 CNN 新闻数据上训练的摘要模型（约 1.6 GB）。                           |
| 7  | `article = """`                                                              | 多行字符串，放要摘要的文章。                                          |
| 19 | `max_length=80)`                                                             | `max_length=80`：摘要最多 80 个 token。还可以加 `min_length=` 设下限。 |
| 23 | `print("\nGenerated Summary:")`                                              | 开头的 `\n` 先换一行。                                          |
| 24 | `print(summary[0]['summary_text'])`                                          | 结果的键叫 summary\_text（每种任务的键名不同，要看文档或先 print 整个结果）。       |

运行结果：

```text
Original Article:

Deep Learning (DL) represents a highly promising approach to
developing applications in Artificial Intelligence (AI).
Its capacity to effectively train on large, unstructured
historical datasets and accurately predict outcomes positions
it as an exceptionally valuable tool across various business
domains, including finance, marketing, customer service, and
information security.


Generated Summary:
Deep Learning (DL) is a highly promising approach to developing applications in Artificial Intelligence (AI). It can train on large, unstructured historical datasets and predict outcomes accurately.
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

**▶ Summarization (DistilBART, with min\_length / do\_sample)**（模型输出为示意 · UsefulFunctions · cell 16）

*Setup 那格已经算好 device = -1（CPU）。*

```python
summarizer = pipeline(
    "summarization",
    model="sshleifer/distilbart-cnn-12-6",
    device=device,
)

article = (
    "Cybersecurity management combines technical controls with governance, risk assessment, "
    "policy, and human behaviour. Organisations should identify critical assets, assess likely "
    "threats, establish accountability, and rehearse incident-response procedures. Regular "
    "testing helps teams detect gaps before a disruptive event occurs, while executive support "
    "ensures that security priorities receive adequate resources."
)
summary = summarizer(article, max_length=60, min_length=20, do_sample=False)

print("Generated summary:")
print(summary[0]["summary_text"])
```

| 行  | 代码                                                                             | 在做什么                                                        |
| -- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 3  | `model="sshleifer/distilbart-cnn-12-6",`                                       | DistilBART：BART 的「蒸馏」小号版，Colab CPU 更跑得动。                    |
| 7  | `article = (`                                                                  | 另一种写长字符串的方法：括号里放几段字符串，Python 会**自动把相邻的字符串接起来**。每段末尾的空格要自己留。 |
| 14 | `summary = summarizer(article, max_length=60, min_length=20, do_sample=False)` | 长度在 20–60 token 之间；`do_sample=False` = 不抽样，每次结果一样。          |

运行结果：

```text
Generated summary:
 Organisations should identify critical assets, assess likely threats and rehearse incident-response procedures . Executive support ensures security priorities receive adequate resources .
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 参数                | 意思                   |
| ----------------- | -------------------- |
| `max_length`      | 摘要最多几个 token         |
| `min_length`      | 摘要最少几个 token（防止只写半句） |
| `do_sample=False` | 不抽样，同样输入每次结果一样（U12）  |

> **⚠️ abstractive 摘要会改写，也可能写错**
>
> notebook 的 Warning：摘要可能**换说法、漏掉细节、甚至加入原文没有的内容**。学术、专业或安全相关材料，用之前要和原文对照。

> **➕ 两种写长字符串的方法**
>
> Tutorial 用三引号 `"""…"""`（里面的换行会保留）；UsefulFunctions 用**括号里放几段相邻的字符串**，Python 会自动把它们接成一段（不会多出换行，但每段末尾的空格要自己留）。

---

## 2. 🔴 命名实体识别 NER

**▶ Named entity recognition (token level)**（模型输出为示意 · Tutorial · cell 22）

```python
from transformers import pipeline

# This Finetuned model labels tokens with entity types learned from the CoNLL-2003 dataset.
ner_pipeline = pipeline("ner",
                        model="dbmdz/bert-large-cased-finetuned-conll03-english")

text = """
Deep Learning (DL) represents a highly promising approach to developing
applications in Artificial Intelligence (AI).
"""

entities = ner_pipeline(text)

# Each result describes a detected token, its entity label, and the model score.
print("Named Entities:")
for entity in entities:
    print(f"Entity: {entity['word']}, Label: {entity['entity']}, Score: {entity['score']:.4f}")
```

| 行  | 代码                                                                                            | 在做什么                                                                            |
| -- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 3  | `# This Finetuned model labels tokens with entity types learned from the CoNLL-2003 dataset.` | 注释：CoNLL-2003 只有四类实体：PER 人、ORG 组织、LOC 地点、MISC 其他。                               |
| 4  | `ner_pipeline = pipeline("ner",`                                                              | 任务名 "ner"（和 "token-classification" 是同一个任务）。                                     |
| 5  | `model="dbmdz/bert-large-cased-finetuned-conll03-english")`                                   | 大号 BERT（约 1.3 GB）。cased = 区分大小写，对人名地名很重要。                                       |
| 12 | `entities = ner_pipeline(text)`                                                               | 返回 list，每个元素是一个被标注的 token。这句话里没有人名、公司、地名，所以很可能是**空列表** `[]`（notebook 的说明也这么提醒）。 |
| 16 | `for entity in entities:`                                                                     | 空列表 → 循环体一次都不执行，不会报错。                                                           |
| 17 | `print(f"Entity: {entity['word']}, Label: {entity['entity']}, Score: {entity['score']:.4f}")` | （不分组时）每个结果的键是 word / entity / score / index / start / end。                      |

运行结果：

```text
Named Entities:
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

**▶ NER with aggregation\_strategy="simple"**（模型输出为示意 · UsefulFunctions · cell 12）

*Setup 那格已经算好 device = -1（CPU）。*

```python
# aggregation_strategy="simple" combines subword tokens into complete entity spans.
ner = pipeline(
    "token-classification",
    model="dbmdz/bert-large-cased-finetuned-conll03-english",
    aggregation_strategy="simple",
    device=device,
)

ner_text = "Alice Chen from Microsoft visited Paris on Monday."
entities = ner(ner_text)

for entity in entities:
    print(
        f"Entity: {entity['word']!r} | Group: {entity['entity_group']} | "
        f"Score: {entity['score']:.4f}"
    )
```

| 行  | 代码                                                                                    | 在做什么                                                                           |
| -- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1  | `# aggregation_strategy="simple" combines subword tokens into complete entity spans.` | 注释：模型内部会把词切成小块（subword），比如 Microsoft → Micro + ##soft。simple 会把它们**合并回完整的实体**。 |
| 5  | `aggregation_strategy="simple",`                                                      | 合并之后，键名从 `entity` 变成 **\`entity\_group\`**。                                    |
| 9  | `ner_text = "Alice Chen from Microsoft visited Paris on Monday."`                     | 有人名、公司、城市的句子。                                                                  |
| 13 | `print(`                                                                              | print 的参数太长，拆成多行。                                                              |
| 14 | `f"Entity: {entity['word']!r} \| Group: {entity['entity_group']} \| "`                | `!r` = 用 repr 显示，字符串会带上引号，方便看清有没有多余空格。                                         |
| 15 | `f"Score: {entity['score']:.4f}"`                                                     | 两个 f-string 挨着写，会被自动接成一个。                                                      |

运行结果：

```text
Entity: 'Alice Chen' | Group: PER | Score: 0.9991
Entity: 'Microsoft' | Group: ORG | Score: 0.9987
Entity: 'Paris' | Group: LOC | Score: 0.9995
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

*（网页版此处可以点数据里的任意一个值，自动写出取到它的代码，并逐层说明每一步拿到的是什么）*

**NER（aggregation\_strategy="simple"）（UsefulFunctions cell 12）**

| 代码                    | 拿到的是                                                              | 值                                                              |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `entities`            | list，3 个元素 → 下一步用 \[位置] 取                                         | `[{'entity_group': 'PER', 'score': 0.9991, 'word': 'Alice Ch…` |
| `entities[1]`         | dict，键：entity\_group / score / word / start / end → 下一步用 \["键"] 取 | `{'entity_group': 'ORG', 'score': 0.9987, 'word': 'Microsoft…` |
| `entities[1]["word"]` | str：最终的值                                                          | `'Microsoft'`                                                  |

|       | 不合并（Tutorial）                        | `aggregation_strategy="simple"`（UsefulFunctions） |
| ----- | ------------------------------------ | ------------------------------------------------ |
| 一个结果是 | 一个 **token**（可能是半个词，例如 `##soft`）     | 一个**完整实体**（`Microsoft`）                          |
| 标签的键名 | `entity`，值像 `I-ORG`、`B-PER`          | `entity_group`，值像 `ORG`、`PER`                    |
| 其他键   | `score`、`index`、`word`、`start`、`end` | `score`、`word`、`start`、`end`                     |

CoNLL-2003 只有四类：**PER** 人、**ORG** 组织、**LOC** 地点、**MISC** 其他。所以 Tutorial 那句关于深度学习的话很可能返回空列表——「Deep Learning」不属于这四类。

> **📌 {entity\['word']!r} 的 !r**
>
> `!r` 让 f-string 用 `repr()` 显示值：字符串会带引号，例如 `'Alice Chen'`。好处是能看清前后有没有多余的空格或奇怪字符。

---

## 3. 🔴 抽取式问答 Question answering

**▶ Extractive question answering**（模型输出为示意 · Tutorial · cell 24）

```python
from transformers import pipeline

# This Finetuned model is trained on SQuAD-style question-and-answer examples.
qa_pipeline = pipeline("question-answering",
                       model="distilbert-base-cased-distilled-squad")

context = """
Deep Learning (DL) represents a highly promising approach to developing
applications in Artificial Intelligence (AI).
"""

question = "What is AI?"

# Pass the question and the source passage using the task-specific keyword arguments.
result = qa_pipeline(question=question, context=context)

answer = result["answer"]
score = result["score"]

print(f"Question: {question}")
print(f"Answer: {answer}")
print(f"Confidence Score: {score:.4f}")
```

| 行  | 代码                                                                                      | 在做什么                                                         |
| -- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 3  | `# This Finetuned model is trained on SQuAD-style question-and-answer examples.`        | 注释：SQuAD = 「给一段文章 + 一个问题，答案是文章里的一段」的数据集。                     |
| 7  | `context = """`                                                                         | **context** = 答案必须从这里面找。                                     |
| 14 | `# Pass the question and the source passage using the task-specific keyword arguments.` | 注释：用关键字参数传入。                                                 |
| 15 | `result = qa_pipeline(question=question, context=context)`                              | `question=` 和 `context=` 是这个任务规定的参数名。返回**一个 dict**（不是 list）。 |
| 17 | `answer = result["answer"]`                                                             | 直接按键取，**不需要** `[0]`。                                         |
| 21 | `print(f"Answer: {answer}")`                                                            | 答案是原文里的一段——**extractive**（抽取式），模型不会自己编新句子。                   |

运行结果：

```text
Question: What is AI?
Answer: Artificial Intelligence
Confidence Score: 0.6824
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

**▶ Question answering on a policy sentence**（模型输出为示意 · UsefulFunctions · cell 14）

*Setup 那格已经算好 device = -1（CPU）。*

```python
qa = pipeline(
    "question-answering",
    model="distilbert-base-cased-distilled-squad",
    device=device,
)

context = (
    "A cybersecurity incident-response plan defines roles, escalation paths, and "
    "communication procedures before an incident occurs."
)
question = "What does an incident-response plan define?"
answer = qa(question=question, context=context)

print(f"Question: {question}")
print(f"Answer: {answer['answer']}")
print(f"Score: {answer['score']:.4f}")
```

| 行  | 代码                                                | 在做什么                      |
| -- | ------------------------------------------------- | ------------------------- |
| 7  | `context = (`                                     | 括号里两段字符串自动接成一段。           |
| 12 | `answer = qa(question=question, context=context)` | 变量名叫 answer，但它是整个结果 dict。 |
| 15 | `print(f"Answer: {answer['answer']}")`            | dict 里的 'answer' 键才是答案文字。 |

运行结果：

```text
Question: What does an incident-response plan define?
Answer: roles, escalation paths, and communication procedures
Score: 0.8731
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

*（网页版此处可以点数据里的任意一个值，自动写出取到它的代码，并逐层说明每一步拿到的是什么）*

**问答 → 一个 dict，没有 \[0]（Tutorial cell 24）**

| 代码                 | 拿到的是                                                | 值                                                              |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------- |
| `result`           | dict，键：score / start / end / answer → 下一步用 \["键"] 取 | `{'score': 0.6824, 'start': 89, 'end': 112, 'answer': 'Artif…` |
| `result["answer"]` | str：最终的值                                            | `'Artificial Intelligence'`                                    |

| 键               | 意思                             |
| --------------- | ------------------------------ |
| `answer`        | 答案文字——一定是 context 里**原样**的一段   |
| `score`         | 模型的信心                          |
| `start` / `end` | 答案在 context 里的起止位置（字符位置，从 0 数） |

> **🎯 问答返回的是 dict，不是 list**
>
> `result["answer"]`，**不要** `result[0]`。这和分类、生成不一样，最容易写错。

> **💼 extractive 的好处和局限**
>
> 好处：答案一定出自你给的文字，不会凭空编（适合「问公司政策」）。局限：context 里根本没答案时，它**照样会挑一段**给你，分数也不一定低（notebook Tip：把 score 当排序信号，要人工核对）。UsefulFunctions Try it Q3 要你各写一个「答得出」和「答不出」的问题对比一下。

---

## 4. 🟡 翻译 Translation

**▶ English-to-Chinese translation**（模型输出为示意 · Tutorial · cell 26）

```python
from transformers import pipeline

# The task name identifies English-to-Chinese machine translation.
translation_pipeline = pipeline("translation_en_to_zh",
                                model="Helsinki-NLP/opus-mt-en-zh")

text_to_translate = """
Deep Learning (DL) represents a highly promising approach to developing
applications in Artificial Intelligence (AI).
"""

# Limit the maximum number of tokens in the translated sequence.
translated_text = translation_pipeline(text_to_translate, max_length=512)

print("Original Text (English):")
print(text_to_translate)
print("\nTranslated Text (Chinese):")
print(translated_text[0]['translation_text'])
```

| 行  | 代码                                                                          | 在做什么                                          |
| -- | --------------------------------------------------------------------------- | --------------------------------------------- |
| 3  | `# The task name identifies English-to-Chinese machine translation.`        | 注释：任务名里写明了语言方向。                               |
| 4  | `translation_pipeline = pipeline("translation_en_to_zh",`                   | `translation_<源>_to_<目标>`。                    |
| 5  | `model="Helsinki-NLP/opus-mt-en-zh")`                                       | Helsinki 大学的 MarianMT 小模型，需要 sentencepiece 包。 |
| 13 | `translated_text = translation_pipeline(text_to_translate, max_length=512)` | 译文最多 512 个 token。                             |
| 18 | `print(translated_text[0]['translation_text'])`                             | 键名 translation\_text。                         |

运行结果：

```text
Original Text (English):

Deep Learning (DL) represents a highly promising approach to developing
applications in Artificial Intelligence (AI).


Translated Text (Chinese):
深度学习(DL)是开发人工智能(AI)应用的一种非常有前途的方法。
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

**▶ English-to-French translation**（模型输出为示意 · UsefulFunctions · cell 18）

*Setup 那格已经算好 device = -1（CPU）。*

```python
translator = pipeline(
    "translation_en_to_fr",
    model="Helsinki-NLP/opus-mt-en-fr",
    device=device,
)

english_text = "Security awareness training helps employees recognise phishing attempts."
translation = translator(english_text, max_length=100)

print(f"English: {english_text}")
print(f"French: {translation[0]['translation_text']}")
```

| 行 | 代码                        | 在做什么           |
| - | ------------------------- | -------------- |
| 2 | `"translation_en_to_fr",` | 换个方向只要换任务名和模型。 |

运行结果：

```text
English: Security awareness training helps employees recognise phishing attempts.
French: La formation de sensibilisation à la sécurité aide les employés à reconnaître les tentatives d'hameçonnage.
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

任务名格式是 `translation_<源语言>_to_<目标语言>`，模型要和方向配对（`opus-mt-en-zh` 只能英译中）。Helsinki-NLP 的 MarianMT 模型需要 `sentencepiece` 包。notebook 提醒：中文输出可能是简体或繁体；技术、法律、安全术语发布前要人工审核。

---

## 5. 🟢 填空 Fill-mask

**▶ Fill-mask (BERT)**（模型输出为示意 · UsefulFunctions · cell 22）

*Setup 那格已经算好 device = -1（CPU）。*

```python
fill_mask = pipeline("fill-mask", model="bert-base-uncased", device=device)

masked_text = f"Cybersecurity is {fill_mask.tokenizer.mask_token} for modern organisations."
suggestions = fill_mask(masked_text, top_k=3)

print(f"Masked text: {masked_text}")
for rank, suggestion in enumerate(suggestions, start=1):
    print(f"{rank}. {suggestion['token_str']!r} (score={suggestion['score']:.4f})")
```

| 行 | 代码                                                                                             | 在做什么                                                                    |
| - | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1 | `fill_mask = pipeline("fill-mask", model="bert-base-uncased", device=device)`                  | **填空**任务：BERT 训练时就是在做「遮住一个词，猜它是什么」。                                     |
| 3 | `masked_text = f"Cybersecurity is {fill_mask.tokenizer.mask_token} for modern organisations."` | 每个模型的「空格」记号不一样（BERT 是 `[MASK]`），所以从 `tokenizer.mask_token` 读出来，而不是自己写死。 |
| 4 | `suggestions = fill_mask(masked_text, top_k=3)`                                                | `top_k=3`：给出最可能的 3 个词。返回 list of dicts。                                 |
| 7 | `for rank, suggestion in enumerate(suggestions, start=1):`                                     | `enumerate` 在遍历时顺便给个编号；`start=1` 让编号从 1 开始（默认从 0）。                      |
| 8 | `print(f"{rank}. {suggestion['token_str']!r} (score={suggestion['score']:.4f})")`              | token\_str 是猜的词。                                                        |

运行结果：

```text
Masked text: Cybersecurity is [MASK] for modern organisations.
1. 'important' (score=0.4471)
2. 'essential' (score=0.1838)
3. 'critical' (score=0.0912)
```

*（网页版可以点「下一步」一行一行运行，看每一步之后的变量表和输出）*

| 写法                                | 意思                                                                 |
| --------------------------------- | ------------------------------------------------------------------ |
| `fill_mask.tokenizer.mask_token`  | 这个模型的「空格」记号。BERT 是 `[MASK]`，RoBERTa 是 `<mask>`，所以从 tokenizer 读，不写死 |
| `top_k=3`                         | 返回最可能的 3 个候选                                                       |
| `enumerate(suggestions, start=1)` | 遍历时顺便给编号 1、2、3（U5 的 for + 一个计数器的简写）                                |
| 结果的键                              | `token_str` 猜的词、`score` 分数、`sequence` 填好后的整句、`token` 词表编号          |

用途是探索「模型觉得这里最可能是什么词」，**不是**事实来源。

---

## 自测

**问答结果 result = {'score': 0.8731, 'start': 47, 'end': 100, 'answer': '...'}，context\[47:100] 是什么？**

> 就是 `result["answer"]` 那段文字——`start` / `end` 是切片位置（U7：含头不含尾），所以 `context[result["start"]:result["end"]] == result["answer"]`。

**NER 返回 \[]，for entity in entities: 会报错吗？**

> 不会。空列表的 for 循环一次都不执行，直接跳过。所以程序「没报错但什么都没打印」时，先 `print(entities)` 看看是不是空的。

**要把英文告警翻成法文，任务名和模型分别填什么？**

> `pipeline("translation_en_to_fr", model="Helsinki-NLP/opus-mt-en-fr")`，结果用 `translation[0]["translation_text"]` 取。
