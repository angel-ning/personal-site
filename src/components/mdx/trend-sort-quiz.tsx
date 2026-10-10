"use client";

import quiz from "./data/ai-trend-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// "Which one is this?" click-to-classify drill for ISOM 5180 Module 6 (ML types, SDN / NFV, ZTNA, IoT layers).
export function TrendSortQuiz({ set = "ml" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.ml} />;
}
