"use client";

import quiz from "./data/lec5-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// ISOM 6200 Lecture 5 drills: claim level, sampling method, routing outcome, ISO result, EDPB step, inventory field (data/lec5-quiz.json).
export function Lec5SortQuiz({ set = "claim" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.claim} />;
}
