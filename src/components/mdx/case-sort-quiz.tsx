"use client";

import quiz from "./data/case-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// ISOM 5100 case drills: sort implementation challenges into Structure / Complexity / People / Process.
export function CaseSortQuiz({ set = "otis" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.otis} />;
}
