"use client";

import quiz from "./data/gov-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// "Which one is this?" drills for ISOM 6200 Lecture 1 (AI flow stage, loop mode, risk response, role, learning type, safeguard point).
export function GovSortQuiz({ set = "response" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.response} />;
}
