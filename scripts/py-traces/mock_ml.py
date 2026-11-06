"""Stand-ins for transformers / torch / IPython.display so the pipeline snippets can be traced
without downloading models. Every output has the same *shape* as the real library returns
(list of dicts, dict, keys and types); the numbers and generated text are illustrative,
except the two SST-2 sentiment results, which come from Pipeline_SampleCode.ipynb's saved outputs."""
import sys
import types

DEFAULT_TASK = {
    "distilbert/distilbert-base-uncased-finetuned-sst-2-english": "text-classification",
}

CLASS_NAME = {
    "text-generation": "TextGenerationPipeline",
    "text-classification": "TextClassificationPipeline",
    "sentiment-analysis": "TextClassificationPipeline",
    "summarization": "SummarizationPipeline",
    "ner": "TokenClassificationPipeline",
    "token-classification": "TokenClassificationPipeline",
    "question-answering": "QuestionAnsweringPipeline",
    "translation_en_to_zh": "TranslationPipeline",
    "translation_en_to_fr": "TranslationPipeline",
    "text-to-speech": "TextToAudioPipeline",
    "zero-shot-classification": "ZeroShotClassificationPipeline",
    "fill-mask": "FillMaskPipeline",
    "automatic-speech-recognition": "AutomaticSpeechRecognitionPipeline",
    "image-to-text": "ImageToTextPipeline",
}

SENTIMENT = {
    "This restaurant is awesome": ("POSITIVE", 0.9998743534088135),  # SampleCode saved output
    "This restaurant is awful": ("NEGATIVE", 0.9997480511665344),  # SampleCode shows 0.9997
}

CONTINUATION = {
    "Once upon a time in a land far, far away": ", the most important thing is to make sure the people of this land, not just those with the greatest potential for prosperity, are not in the hands of the people of this land.",
    "A well-designed security policy should": " be simple enough for every employee to follow, and it should be reviewed every year by the people who use it.",
}


class FakeArray:
    """Prints like a small numpy float32 array; enough for .shape and .squeeze()."""

    def __init__(self, shape):
        self.shape = shape

    def squeeze(self):
        return FakeArray(tuple(d for d in self.shape if d != 1))

    def __repr__(self):
        body = "0.0012, -0.0031, 0.0047, ..., -0.0008, 0.0002, 0.0000"
        return f"array([[{body}]], dtype=float32)" if len(self.shape) == 2 else f"array([{body}], dtype=float32)"

    __trace_type__ = "ndarray"


class Tokenizer:
    mask_token = "[MASK]"
    eos_token_id = 50256

    def __repr__(self):
        return "<Tokenizer>"


class FakePipeline:
    def __init__(self, task, model, device):
        self.task = task
        self.model = model
        self.device = device
        self.tokenizer = Tokenizer()
        self.__trace_type__ = CLASS_NAME.get(task, "Pipeline")

    def __trace_repr__(self):
        where = "cpu" if self.device in (None, -1) else f"cuda:{self.device}"
        return f"<{self.__trace_type__} task='{self.task}' model='{self.model}' device={where}>"

    def __call__(self, inputs=None, **kw):
        t = self.task
        if isinstance(inputs, list):
            outs = [self._one(x, kw) for x in inputs]
            # Classification flattens a batch to one dict per input; generation keeps a list per input.
            if t in ("text-classification", "sentiment-analysis"):
                outs = [o[0] if isinstance(o, list) else o for o in outs]
            return outs
        if t == "question-answering":
            return self._qa(kw["question"], kw["context"])
        return self._one(inputs, kw)

    # One input → the structure the real pipeline returns for a single item.
    def _one(self, x, kw):
        t, m = self.task, self.model
        if t == "text-generation":
            n = kw.get("num_return_sequences", 1)
            return [{"generated_text": x + CONTINUATION.get(x, " ...")} for _ in range(n)]
        if t in ("text-classification", "sentiment-analysis"):
            if "mnli" in m and isinstance(x, dict):
                ok = "excellent" in x["text"]
                return {"label": "ENTAILMENT" if ok else "CONTRADICTION", "score": 0.9712 if ok else 0.9905}
            if "nlptown" in m:
                return [{"label": "5 stars", "score": 0.4127}]
            label, score = SENTIMENT.get(x, ("POSITIVE", 0.9998))
            return [{"label": label, "score": score}]
        if t == "summarization":
            if "distilbart" in m:
                text = " Organisations should identify critical assets, assess likely threats and rehearse incident-response procedures . Executive support ensures security priorities receive adequate resources ."
            else:
                text = "Deep Learning (DL) is a highly promising approach to developing applications in Artificial Intelligence (AI). It can train on large, unstructured historical datasets and predict outcomes accurately."
            return [{"summary_text": text}]
        if t in ("ner", "token-classification"):
            if kw.get("aggregation_strategy") or "Alice" in x:
                out = []
                for word, group, score in (("Alice Chen", "PER", 0.9991), ("Microsoft", "ORG", 0.9987), ("Paris", "LOC", 0.9995)):
                    s = x.find(word)
                    out.append({"entity_group": group, "score": score, "word": word, "start": s, "end": s + len(word)})
                return out
            return []
        if t.startswith("translation"):
            zh = "深度学习(DL)是开发人工智能(AI)应用的一种非常有前途的方法。"
            fr = "La formation de sensibilisation à la sécurité aide les employés à reconnaître les tentatives d'hameçonnage."
            return [{"translation_text": zh if t.endswith("zh") else fr}]
        if t == "text-to-speech":
            return {"audio": FakeArray((1, 87296)), "sampling_rate": 16000}
        if t == "zero-shot-classification":
            labels = kw["candidate_labels"]
            scores = [0.9132, 0.0511, 0.0219, 0.0138][: len(labels)]
            return {"sequence": x, "labels": labels, "scores": scores}
        if t == "fill-mask":
            words = [("important", 0.4471), ("essential", 0.1838), ("critical", 0.0912)][: kw.get("top_k", 5)]
            return [{"score": s, "token": 2590 + i, "token_str": w, "sequence": x.replace("[MASK]", w).lower()} for i, (w, s) in enumerate(words)]
        if t == "automatic-speech-recognition":
            return {"text": " (the transcribed words of the speech clip appear here)"}
        if t == "image-to-text":
            return [{"generated_text": "two cats laying on a couch with remote controls "}]
        raise ValueError(f"mock has no output for task {t}")

    def _qa(self, question, context):
        answer = "Artificial Intelligence" if "AI" in question else "roles, escalation paths, and communication procedures"
        start = context.find(answer)
        return {"score": 0.6824 if "AI" in question else 0.8731, "start": start, "end": start + len(answer), "answer": answer}


def pipeline(task=None, model=None, device=None, **kw):
    return FakePipeline(task or DEFAULT_TASK.get(model, "text-classification"), model, device)


def set_seed(n):
    return None


class Audio:
    def __init__(self, data=None, rate=None, url=None):
        self.rate, self.url = rate, url

    def __repr__(self):
        return "<IPython.lib.display.Audio object>"

    __trace_type__ = "Audio"


def display(obj):
    print("[▶ notebook 里这里会出现一个音频播放器]" if isinstance(obj, Audio) else repr(obj))


def install():
    tf = types.ModuleType("transformers")
    tf.pipeline, tf.set_seed = pipeline, set_seed
    torch = types.ModuleType("torch")
    torch.cuda = types.SimpleNamespace(is_available=lambda: False, get_device_name=lambda i: "Tesla T4")
    ipy = types.ModuleType("IPython")
    ipy_display = types.ModuleType("IPython.display")
    ipy_display.Audio, ipy_display.display = Audio, display
    ipy.display = ipy_display
    sys.modules.update({"transformers": tf, "torch": torch, "IPython": ipy, "IPython.display": ipy_display})
