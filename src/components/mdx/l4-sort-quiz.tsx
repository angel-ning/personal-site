"use client";

import quiz from "./data/l4-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// Click-to-classify drills for ISOM 5280 Lesson 4: problem → crypto tool, which key, which goal, business scenarios.
export function L4SortQuiz({ set = "why" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.why} />;
}
