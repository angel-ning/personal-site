// ISOM 5260 week 3: EER supertype/subtype constraints and hierarchy inheritance.
// Shared by <EerConstraintLab />, <HierarchyExplorer /> and scripts/lib/mdx-core.mjs.

/**
 * The two questions decide everything.
 * total:   Q1 must every supertype instance belong to at least one subtype?
 * overlap: Q2 can an instance belong to two or more subtypes at once?
 */
export function constraintInfo({ total, overlap }) {
  const line = total ? "双线 ‖ Total specialization" : "单线 │ Partial specialization";
  const letter = overlap ? "o" : "d";
  const rule = overlap ? "Overlap rule" : "Disjoint rule";
  const membership = total ? (overlap ? "1 个或多个子类" : "恰好 1 个子类") : overlap ? "0、1 或多个子类" : "0 或 1 个子类";
  const discriminator = overlap
    ? "Composite attribute：每个子类一个 Boolean 组成部分 (Y/N)"
    : "Simple attribute：一个值指明是哪个子类";
  return { line, letter, rule, membership, discriminator };
}

/** Allowed discriminator values for a scenario, respecting both constraints. */
export function discriminatorValues(sc, { total, overlap }) {
  if (!overlap) {
    const vals = sc.subtypes.map((t) => ({ value: `"${t.code}"`, meaning: `→ ${t.name}` }));
    if (!total) vals.push({ value: "空 / 其他值", meaning: "不属于任何子类（partial 才允许）" });
    return vals;
  }
  const n = sc.subtypes.length;
  const out = [];
  for (let mask = (1 << n) - 1; mask >= 0; mask--) {
    if (mask === 0 && total) continue;
    const yn = sc.subtypes.map((_, i) => (mask & (1 << (n - 1 - i)) ? "Y" : "N"));
    const names = sc.subtypes.filter((_, i) => yn[i] === "Y").map((t) => t.name);
    out.push({ value: `(${yn.join(", ")})`, meaning: names.length ? `→ ${names.join(" + ")}` : "不属于任何子类（partial 才允许）" });
  }
  return out;
}

export function discriminatorName(sc, overlap) {
  return overlap ? `${sc.attr} (${sc.subtypes.map((t) => `${t.flag}?`).join(", ")})` : sc.attr;
}

export const EER_SCENARIOS = [
  {
    id: "patient",
    src: "课件 p.15 / p.17 / p.20",
    text: "PATIENT 分为 OUTPATIENT 和 RESIDENT PATIENT。每个病人一定是其中一种，但不可能既是门诊病人又是住院病人。",
    super: "PATIENT",
    attr: "Patient Type",
    subtypes: [
      { name: "OUTPATIENT", code: "O", flag: "Outpatient" },
      { name: "RESIDENT PATIENT", code: "R", flag: "Resident" },
    ],
    answer: { total: true, overlap: false },
    why: "病人必是其一 → total；不能两者都是 → disjoint",
  },
  {
    id: "vehicle",
    src: "课件 p.16",
    text: "VEHICLE 分为 CAR 和 TRUCK。摩托车也是 VEHICLE，但它没有独有属性，所以不画成子类；一辆车不会既是轿车又是卡车。",
    super: "VEHICLE",
    attr: "Vehicle Type",
    subtypes: [
      { name: "CAR", code: "C", flag: "Car" },
      { name: "TRUCK", code: "T", flag: "Truck" },
    ],
    answer: { total: false, overlap: false },
    why: "摩托车哪个子类都不属于 → partial；不能同时是两种 → disjoint",
  },
  {
    id: "part",
    src: "课件 p.18 / p.20",
    text: "PART 分为 MANUFACTURED PART 和 PURCHASED PART。每个零件至少是其中一种，Circuit Board 这类零件既自制又外购。",
    super: "PART",
    attr: "Part Type",
    subtypes: [
      { name: "MANUFACTURED PART", code: "M", flag: "Manufactured" },
      { name: "PURCHASED PART", code: "P", flag: "Purchased" },
    ],
    answer: { total: true, overlap: true },
    why: "至少是一种 → total；可以两种都是 → overlap",
  },
  {
    id: "account",
    src: "自测题 3",
    text: "银行的 ACCOUNT 分为 SAVINGS 和 CHECKING。每个账户必须是其中一种，且不能同时是两种。",
    super: "ACCOUNT",
    attr: "Account Type",
    subtypes: [
      { name: "SAVINGS", code: "S", flag: "Savings" },
      { name: "CHECKING", code: "C", flag: "Checking" },
    ],
    answer: { total: true, overlap: false },
    why: "必须是一种 → total；不能两种都是 → disjoint",
  },
  {
    id: "employee",
    src: "自测题 4",
    text: "EMPLOYEE 可以是 MANAGER、ENGINEER，也可以两者都是，还有些员工两者都不是。",
    super: "EMPLOYEE",
    attr: "Employee Type",
    subtypes: [
      { name: "MANAGER", code: "M", flag: "Manager" },
      { name: "ENGINEER", code: "E", flag: "Engineer" },
    ],
    answer: { total: false, overlap: true },
    why: "有人两者都不是 → partial；可以两者都是 → overlap",
  },
];

// ---------- hierarchy (slides p.22) ----------
export const HIERARCHY = {
  PERSON: { parent: null, attrs: ["SSN", "Name", "Address", "Gender", "Date Of Birth"], split: "‖ o" },
  EMPLOYEE: { parent: "PERSON", attrs: ["Salary", "Date Hired"], split: "‖ d" },
  ALUMNUS: { parent: "PERSON", attrs: ["{Degree (Year, Designation, Date)}"] },
  STUDENT: { parent: "PERSON", attrs: ["Major Dept"], split: "‖ d" },
  FACULTY: { parent: "EMPLOYEE", attrs: ["Rank"] },
  STAFF: { parent: "EMPLOYEE", attrs: ["Position"] },
  "GRADUATE STUDENT": { parent: "STUDENT", attrs: ["Test Score"] },
  "UNDERGRAD STUDENT": { parent: "STUDENT", attrs: ["Class Standing"] },
};

/** Path from an entity up to the root, each with the attributes defined there. */
export function inheritance(name) {
  const chain = [];
  for (let n = name; n; n = HIERARCHY[n].parent) chain.push({ entity: n, attrs: HIERARCHY[n].attrs });
  return chain;
}

export const childrenOf = (name) => Object.keys(HIERARCHY).filter((k) => HIERARCHY[k].parent === name);
