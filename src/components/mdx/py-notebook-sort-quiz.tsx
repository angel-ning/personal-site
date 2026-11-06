"use client";

import quiz from "./data/py-notebook-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// "Which one is this?" drills for the ISOM 5160 Python notebook (data structure, error type, pipeline task, output shape).
export function PyNotebookSortQuiz({ set = "struct" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.struct} />;
}
