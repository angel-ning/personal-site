// Pure normalization logic for <NormalizationLab />: classifies a functional dependency as
// full / partial / transitive purely from the table's primary key, following the course's own
// mnemonic — "部分看主键的一部分，传递看非键" (p.40 Main Takeaway). Shared with
// scripts/lib/mdx-core.mjs so the exported Markdown table uses the same rule.

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const isSubsetOf = (a, b) => a.every((x) => b.includes(x));

/** kind: "full" | "partial" | "transitive" */
export function classifyFd(pk, det) {
  if (isSubsetOf(det, pk)) return sameSet(det, pk) ? "full" : "partial";
  return "transitive";
}

export const KIND_LABEL = {
  full: "Full（依赖整个主键 / 非键属性 → 非键属性的正常依赖）",
  partial: "Partial（只依赖复合主键的一部分，违反 2NF）",
  transitive: "Transitive（决定因素本身不是主键，违反 3NF）",
};

export function fdText(fd) {
  return `${fd.det.join(", ")} → ${fd.dep.join(", ")}`;
}
