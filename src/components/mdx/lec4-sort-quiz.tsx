"use client";

import quiz from "./data/lec4-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// ISOM 6200 Lecture 4 drills: which test view, which IR phase, which control boundary (data/lec4-quiz.json).
export function Lec4SortQuiz({ set = "test" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.test} />;
}
