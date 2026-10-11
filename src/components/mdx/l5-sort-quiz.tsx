"use client";

import quiz from "./data/l5-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// Click-to-classify drills for ISOM 5280 Lesson 5: AI risk views and limitations, RM process steps, asset types, NIST CSF functions, treatment strategies.
export function L5SortQuiz({ set = "treat" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.treat} />;
}
