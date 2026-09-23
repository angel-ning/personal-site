// Pure logic for <CardinalityLab />: the note's own "只问两个问题" method for reading off
// cardinality symbols. Shared with scripts/lib/mdx-core.mjs for the exported Markdown table.

export function symbolFor(min, max) {
  if (min === "mandatory") return max === "one" ? "‖" : "|<";
  return max === "one" ? "O|" : "O<";
}

export function symbolName(min, max) {
  const m = min === "mandatory" ? "Mandatory" : "Optional";
  const n = max === "one" ? "One" : "Many";
  return `${m} ${n}`;
}
