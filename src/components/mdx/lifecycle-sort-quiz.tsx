"use client";

import quiz from "./data/lifecycle-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// "Which one is this?" drills for ISOM 6200 Lecture 3 (quality dimension, dataset role, lifecycle owner, guardrail type, agent terms, urgent change / rollback).
export function LifecycleSortQuiz({ set = "quality" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.quality} />;
}
