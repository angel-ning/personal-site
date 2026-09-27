// Pure logic for <FdFinderLab /> and scripts/lib/mdx-core.mjs: checks candidate functional
// dependencies against sample rows. Data can only refute an FD (two rows agree on X but differ
// on Y); a candidate that survives still needs a business-meaning check, recorded per scenario
// in FD_JUDGE.
import { WALK_SCENARIOS } from "./normalize-steps.mjs";

export const FD_SCENARIOS = ["project", "enroll", "order"].map((id) => WALK_SCENARIOS.find((s) => s.id === id));

// Business-meaning verdicts for data-consistent candidates that are NOT real FDs.
export const FD_JUDGE = {
  project: {
    "Date_of_Return→Project_ID": "巧合：样本里每个归还日期只出现在一个项目里，但两个项目完全可以同一天还设备。",
    "Date_of_Return→Project_Name": "巧合：同上，归还日期和项目名没有业务关系。",
    "Location_of_usage→Contact_Person": "巧合：同一个会议室可以给不同项目、不同联系人用。",
    "Location_of_usage→Position": "巧合：地点和职位没有关系。",
  },
  enroll: {
    "StudentName→StudentID": "名字不是标识符：样本里碰巧没重名，但现实中可能有同名的人，所以决定因素用 ID。",
    "StudentName→AdvisorID": "名字不是标识符：样本里碰巧没重名，但现实中可能有同名的人，所以决定因素用 ID。",
    "StudentName→AdvisorName": "名字不是标识符：样本里碰巧没重名，但现实中可能有同名的人，所以决定因素用 ID。",
    "AdvisorName→AdvisorID": "名字不是标识符：样本里碰巧没重名，但现实中可能有同名的人，所以决定因素用 ID。",
    "CourseTitle→CourseID": "课名不是标识符：两门课可以同名（比如不同学期的 Special Topics），决定因素用 CourseID。",
  },
  order: {
    "CustomerName→CustomerID": "名字不是标识符：样本里碰巧没重名，但现实中可能有同名的人，所以决定因素用 ID。",
    "CustomerName→CustomerAddress": "名字不是标识符：样本里碰巧没重名，但现实中可能有同名的人，所以决定因素用 ID。",
    "CustomerAddress→CustomerID": "巧合：同一个地址可以有好几个客户（同一栋楼的两家公司）。",
    "CustomerAddress→CustomerName": "巧合：同上。",
  },
};

/** One row per cell value: spreads multivalued cells like the 1NF step. */
export function flatRows(s) {
  const out = [];
  for (const r of s.rows) {
    const n = Math.max(1, ...r.map((v) => (Array.isArray(v) ? v.length : 1)));
    for (let i = 0; i < n; i++) out.push(r.map((v) => (Array.isArray(v) ? v[i] : v)));
  }
  return out;
}

/** Does det → dep survive the data? Returns { holds, pair: [i, j] | null } (first counterexample rows). */
export function checkFd(cols, rows, det, dep) {
  const di = det.map((c) => cols.indexOf(c));
  const yi = cols.indexOf(dep);
  const seen = new Map();
  for (let i = 0; i < rows.length; i++) {
    const k = JSON.stringify(di.map((j) => rows[i][j]));
    if (!seen.has(k)) { seen.set(k, i); continue; }
    const j = seen.get(k);
    if (rows[j][yi] !== rows[i][yi]) return { holds: false, pair: [j, i] };
  }
  return { holds: true, pair: null };
}

/**
 * The "third layer" sweep: every non-key column as the determinant, against every other column.
 * Returns [{ det, found: [{ col, real, why }] }] where found lists data-consistent candidates.
 */
export function sweepNonKey(s) {
  const rows = flatRows(s);
  const judge = FD_JUDGE[s.id] ?? {};
  return s.cols
    .filter((c) => !s.pk.includes(c))
    .map((x) => {
      const found = s.cols
        .filter((y) => y !== x && checkFd(s.cols, rows, [x], y).holds)
        .map((y) => {
          const real = s.fds.some((fd) => fd.det.length === 1 && fd.det[0] === x && fd.dep.includes(y));
          return { col: y, real, why: real ? "写进 FD 清单，3NF 要拆" : judge[`${x}→${y}`] ?? "样本里碰巧没冲突，按业务含义不成立。" };
        });
      return { det: x, found };
    });
}
