"use client";

import quiz from "./data/routing-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// ISOM 5190 week 1 drills: which kind of route / which class of routing protocol / IGP or EGP.
export function RoutingSortQuiz({ set = "route" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.route} />;
}
