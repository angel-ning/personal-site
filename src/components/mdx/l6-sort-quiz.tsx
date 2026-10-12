"use client";

import quiz from "./data/l6-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// Click-to-classify drills for ISOM 5280 Lesson 6: which plan, which BIA metric, which test, who leads.
export function L6SortQuiz({ set = "plan" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.plan} />;
}
