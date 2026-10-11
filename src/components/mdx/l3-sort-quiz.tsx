"use client";

import quiz from "./data/l3-quiz.json";
import { SortQuizView } from "./sort-quiz";

type SetId = keyof typeof quiz;

// Click-to-classify drills for ISOM 5280 Lesson 3: firewall types, placement, IDPS outcomes and methods, VPN vs proxy, tools, Zero Trust.
export function L3SortQuiz({ set = "fw" }: { set?: SetId }) {
  return <SortQuizView data={quiz[set] ?? quiz.fw} />;
}
