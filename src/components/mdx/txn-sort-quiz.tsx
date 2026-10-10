"use client";

import quiz from "./data/txn-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// Click-to-classify drills for ISOM 5260 Week 6: ACID property, REDO vs UNDO, type of recovery (slide 33).
export function TxnSortQuiz({ set = "acid" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.acid} />;
}
