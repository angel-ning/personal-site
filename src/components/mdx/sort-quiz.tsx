"use client";

import { useMemo, useState } from "react";

export type SortQuizData = {
  title: string;
  options: { id: string; label: string }[];
  items: { q: string; a: string; why: string }[];
};

// Deterministic shuffle (same order on server and client, so no hydration mismatch). The data files are
// often written in answer order (A, B, C, A, B, C…), which makes the drill guessable; shuffling fixes
// every quiz that uses this view. "重新做" moves to the next seed, so a retry gets a new order.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function shuffled<T>(xs: T[], seed: number) {
  const out = xs.slice();
  let x = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = (x >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Among a few seeded shuffles, keep the one whose answer sequence is least predictable: fewest
// repeats of the previous answer and of the answer one option-cycle back.
function quizOrder(items: SortQuizData["items"], key: string, round: number, nOpts: number) {
  let best = items;
  let bestScore = Infinity;
  for (let k = 0; k < 12; k++) {
    const cand = shuffled(items, hash(`${key}#${round}#${k}`));
    let score = 0;
    for (let i = 1; i < cand.length; i++) {
      if (cand[i].a === cand[i - 1].a) score += 1;
      if (i >= nOpts && cand[i].a === cand[i - nOpts].a) score += 1;
    }
    if (score < bestScore) [best, bestScore] = [cand, score];
  }
  return best;
}

// "Which one is this?" click-to-classify drill: pick an option per item, see right / wrong and why.
export function SortQuizView({ data }: { data: SortQuizData }) {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [round, setRound] = useState(0);
  const items = useMemo(() => quizOrder(data.items, data.title, round, data.options.length), [data, round]);
  const answered = Object.keys(picks).length;
  const right = items.filter((it, i) => picks[i] === it.a).length;
  const label = (id: string) => data.options.find((o) => o.id === id)?.label ?? id;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · {data.title}
        </span>
        <span className="font-mono text-[12px] text-fg-3">
          {right} / {answered} 对 · 共 {items.length} 题
        </span>
      </div>
      <ol className="csq-list">
        {items.map((it, i) => {
          const p = picks[i];
          return (
            <li key={`${round}-${i}`} className="csq-item">
              <span>{it.q}</span>
              <div className="csq-opts">
                {data.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    disabled={!!p}
                    className={`lab-btn ${p && o.id === it.a ? "csq-right" : p === o.id ? "csq-wrong" : ""}`}
                    onClick={() => setPicks({ ...picks, [i]: o.id })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {p && (
                <p className={`csq-why ${p === it.a ? "csq-ok" : "csq-no"}`}>
                  <b>{p === it.a ? "✓" : `✗ 是 ${label(it.a)}`}</b> {it.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {answered > 0 && (
        <button type="button" className="mcq-retry" onClick={() => {
            setPicks({});
            setRound((r) => r + 1);
          }}>
          重新做
        </button>
      )}
    </div>
  );
}
