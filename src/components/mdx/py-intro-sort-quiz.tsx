"use client";

import quiz from "./data/py-intro-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// "Which one is this?" drills for ISOM 5160 Day 1 (AI nesting, ML task types, property vs method, app dev phases).
export function PyIntroSortQuiz({ set = "task" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.task} />;
}
