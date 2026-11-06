"""Run every snippet in snippets_*.py line by line and record what Python does.

Output: src/components/mdx/data/py-traces.json, read by <CodeTrace id="…" /> and by the
README export. Each step = one executed line: which line, the variables after it ran,
and what it printed. Pipeline snippets run against mock_ml.py (canned model outputs),
so the site never needs transformers / torch installed.

    python3 scripts/py-traces/build.py
"""
import ast
import contextlib
import io
import json
import os
import sys
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "src", "components", "mdx", "data", "py-traces.json")
sys.path.insert(0, HERE)

import mock_ml  # noqa: E402
from snippets_basics import SNIPPETS as BASICS  # noqa: E402
from snippets_data import SNIPPETS as DATA  # noqa: E402
from snippets_pipeline import SNIPPETS as PIPE  # noqa: E402

FILENAME = "<snippet>"
HIDDEN = {"__builtins__", "__name__", "__doc__", "__loader__", "__spec__", "__package__"}
MAX_REPR = 160


def short_repr(v):
    r = getattr(v, "__trace_repr__", None)
    r = r() if r else repr(v)
    return r if len(r) <= MAX_REPR else r[: MAX_REPR - 1] + "…"


def type_name(v):
    return getattr(v, "__trace_type__", type(v).__name__)


def snapshot(ns, hide):
    out = []
    for k, v in ns.items():
        if k in HIDDEN or k in hide or k.startswith("_"):
            continue
        if type(v).__name__ in ("module", "function", "builtin_function_or_method", "type") and not hasattr(v, "__trace_type__"):
            continue
        out.append([k, type_name(v), short_repr(v)])
    return out


def statement_spans(code):
    """line -> (first, last) line of the statement it belongs to.

    Python reports line events for every physical line of a multi-line literal, so a
    dict written over 6 lines would look like 6 steps; map them all to the statement.
    For if / for / while only the header counts (its body lines are statements of their own)."""
    owner = {}
    for node in ast.walk(ast.parse(code)):
        if not isinstance(node, ast.stmt):
            continue
        body = getattr(node, "body", None)
        last = body[0].lineno - 1 if body and isinstance(body, list) and isinstance(body[0], ast.stmt) else node.end_lineno
        if isinstance(node, (ast.If, ast.For, ast.While)):
            last = node.body[0].lineno - 1
        for ln in range(node.lineno, max(last, node.lineno) + 1):
            if ln not in owner or owner[ln][0] < node.lineno:
                owner[ln] = (node.lineno, max(last, node.lineno))
    return owner


def header_bodies(code):
    """if / elif / while / for header line -> (kind, first body line, last body line)."""
    out = {}
    for node in ast.walk(ast.parse(code)):
        if isinstance(node, (ast.If, ast.While, ast.For)):
            kind = "for" if isinstance(node, ast.For) else "cond"
            out[node.lineno] = (kind, node.body[0].lineno, node.body[-1].end_lineno)
    return out


def mark_decisions(steps, heads):
    """After running: did each if / while condition hold, did each for get another item?"""
    for i, st in enumerate(steps):
        h = heads.get(st["line"])
        if not h or "error" in st:
            continue
        nxt = steps[i + 1]["line"] if i + 1 < len(steps) else None
        inside = nxt is not None and h[1] <= nxt <= h[2]
        if h[0] == "for":
            st["loop"] = "next" if inside else "done"
        else:
            st["cond"] = inside


def run(snip):
    lines = snip["lines"]
    code = "\n".join(c for c, _ in lines)
    spans = statement_spans(code)
    ns = {"__name__": "__main__"}
    buf = io.StringIO()
    steps = []
    state = {"line": None, "printed": 0}

    hide = set()
    if snip.get("mock"):
        mock_ml.install()
        exec("from transformers import pipeline, set_seed\nfrom IPython.display import Audio, display", ns)
        hide = set(ns)
    if snip.get("setup"):
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compile(snip["setup"], "<setup>", "exec"), ns)

    def flush(error=None):
        if state["line"] is None:
            return
        text = buf.getvalue()
        first, last = spans.get(state["line"], (state["line"], state["line"]))
        steps.append({
            "line": first,
            **({"end": last} if last != first else {}),
            "vars": snapshot(ns, hide),
            "out": text[state["printed"]:],
            **({"error": error} if error else {}),
        })
        state["printed"] = len(text)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FILENAME or frame.f_code.co_name != "<module>":
            return None
        if event == "line":
            ln = spans.get(frame.f_lineno, (frame.f_lineno,))[0]
            # Another physical line of the statement already running: not a new step.
            if ln == state["line"]:
                return tracer
            flush()
            state["line"] = ln
        return tracer

    error = None
    with contextlib.redirect_stdout(buf):
        sys.settrace(tracer)
        try:
            exec(compile(code, FILENAME, "exec"), ns)
        except Exception as e:  # the snippet is allowed to end in an error on purpose
            error = "".join(traceback.format_exception_only(type(e), e)).strip()
        finally:
            sys.settrace(None)
    flush(error)

    mark_decisions(steps, header_bodies(code))

    if error and not snip.get("expect_error"):
        raise SystemExit(f"{snip['id']}: unexpected error {error}")
    if snip.get("expect_error") and not error:
        raise SystemExit(f"{snip['id']}: expected an error")

    return {
        "id": snip["id"],
        "title": snip["title"],
        "source": snip.get("source", ""),
        "mine": bool(snip.get("mine")),
        "mock": bool(snip.get("mock")),
        "setupNote": snip.get("setup_note", ""),
        "code": [c for c, _ in lines],
        "notes": [n for _, n in lines],
        "steps": steps,
    }


def main():
    seen = set()
    traces = {}
    for snip in BASICS + DATA + PIPE:
        if snip["id"] in seen:
            raise SystemExit(f"duplicate id {snip['id']}")
        seen.add(snip["id"])
        traces[snip["id"]] = run(snip)
    with open(OUT, "w", encoding="utf8") as f:
        json.dump(traces, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {len(traces)} traces, {sum(len(t['steps']) for t in traces.values())} steps -> {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()
