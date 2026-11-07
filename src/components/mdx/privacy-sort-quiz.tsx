"use client";

import quiz from "./data/privacy-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// "Which one is this?" drills for ISOM 6200 Lecture 2 (reference type, data role, disclosure path, PCPD area).
export function PrivacySortQuiz({ set = "ref" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.ref} />;
}
