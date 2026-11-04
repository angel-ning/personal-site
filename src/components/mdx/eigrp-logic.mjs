// EIGRP DUAL (ISOM 5190 week 3): for one destination, each neighbor offers a path whose total
// distance = cost of the link to that neighbor + the neighbor's Reported Distance (RD). The lowest
// total is the Feasible Distance (FD) and its neighbor the successor (up to 4 equal ones, slide 14);
// a neighbor whose RD < FD is a feasible successor (slide 15, board p.2 "FD > RD to be FS").
// Pure functions shared by eigrp-lab.tsx and the README export in scripts/lib/mdx-core.mjs.

export const MAX_SUCCESSORS = 4;

export const EIGRP_PRESETS = [
  {
    id: "board",
    label: "板书 p.2：A 去 X.0",
    router: "A",
    dest: "X.0（C 后面的网段）",
    note: "链路 cost 是板书上写的；C 到 X.0 这一段三条路都一样，省略不算。",
    paths: [
      { id: "B", via: "B", link: 1, rd: 2 },
      { id: "D", via: "D", link: 2, rd: 2 },
      { id: "E", via: "E", link: 2, rd: 4 },
    ],
  },
  {
    id: "slide13",
    label: "Slide 13：RTA 去 Network Z",
    router: "RTA",
    dest: "Network Z",
    note: "RD 5 / 5 / 6 是课件气泡里的数；RTA 到三个邻居的链路 cost 是我设的（都设 2）。",
    paths: [
      { id: "RTB", via: "RTB", link: 2, rd: 5 },
      { id: "RTC", via: "RTC", link: 2, rd: 5 },
      { id: "RTX", via: "RTX", link: 2, rd: 6 },
    ],
  },
  {
    id: "slide12",
    label: "Slide 12：170.32.0.0/16",
    router: "Router",
    dest: "170.32.0.0/16",
    note: "括号里是 (总距离 / RD)：2195456 / 2169856 和 2681856 / 2169856；链路 cost = 两数相减。",
    paths: [
      { id: "e0", via: "199.55.32.10（Ethernet0）", link: 25600, rd: 2169856 },
      { id: "s0", via: "200.10.10.5（Serial0）", link: 512000, rd: 2169856 },
    ],
  },
];

const total = (p) => p.link + p.rd;

// Roles relative to a given FD: successor / fs (RD < FD) / nofs (might loop) / down.
function withRoles(paths, fd, successorIds) {
  return paths.map((p) => {
    const t = total(p);
    let role;
    if (p.up === false) role = "down";
    else if (successorIds.includes(p.id)) role = "successor";
    else if (fd !== null && p.rd < fd) role = "fs";
    else role = "nofs";
    return { ...p, total: t, role };
  });
}

// Steady state (all listed paths that are up): FD, successors, feasible successors.
export function dual(paths, maxSucc = MAX_SUCCESSORS) {
  const up = paths.filter((p) => p.up !== false);
  if (!up.length) return { fd: null, successors: [], fs: [], rows: withRoles(paths, null, []) };
  const fd = Math.min(...up.map(total));
  const successors = up.filter((p) => total(p) === fd).slice(0, maxSucc).map((p) => p.id);
  const rows = withRoles(paths, fd, successors);
  return { fd, successors, fs: rows.filter((r) => r.role === "fs").map((r) => r.id), rows };
}

// What DUAL does when the paths marked up:false go down, starting from the all-up state.
export function failover(paths, maxSucc = MAX_SUCCESSORS) {
  const before = dual(paths.map((p) => ({ ...p, up: true })), maxSucc);
  const downIds = paths.filter((p) => p.up === false).map((p) => p.id);
  const lostSucc = before.successors.filter((id) => downIds.includes(id));
  const after = dual(paths, maxSucc);
  if (!downIds.length) return { kind: "none", before, after, steps: [] };
  const name = (id) => paths.find((p) => p.id === id).via;

  if (!lostSucc.length) {
    return { kind: "unaffected", before, after: { ...before, rows: withRoles(paths, before.fd, before.successors) }, steps: [`断的是 ${downIds.map(name).join("、")}，不是 successor，路由表不变（topology table 里少一条备选）。`] };
  }
  const stillSucc = before.successors.filter((id) => !downIds.includes(id));
  if (stillSucc.length) {
    return { kind: "remaining", before, after: { ...before, successors: stillSucc, rows: withRoles(paths, before.fd, stillSucc) }, steps: [`successor ${lostSucc.map(name).join("、")} 断了，但还有同样距离的 successor ${stillSucc.map(name).join("、")}，直接继续用，不用重新计算。`] };
  }
  const fsUp = before.fs.filter((id) => !downIds.includes(id));
  if (fsUp.length) {
    // Local computation: promote the feasible successor with the lowest total distance.
    const best = fsUp.map((id) => paths.find((p) => p.id === id)).sort((a, b) => total(a) - total(b))[0];
    const fd = total(best);
    const promoted = dual(paths.filter((p) => p.up !== false && (p.id === best.id || p.rd < fd)), maxSucc);
    const succ = promoted.successors.filter((id) => id === best.id || before.fs.includes(id));
    return {
      kind: "promote",
      before,
      after: { fd, successors: succ, rows: withRoles(paths, fd, succ), fs: [] },
      promoted: best.id,
      steps: [
        `successor ${lostSucc.map(name).join("、")} 断了。`,
        `topology table 里已经有 feasible successor ${fsUp.map(name).join("、")}（RD < 原来的 FD ${before.fd}），保证无环。`,
        `把 ${best.via} 直接升为 successor（总距离 ${fd}），放进路由表；路由保持 Passive，不用问邻居 → 几乎瞬间收敛。`,
      ],
    };
  }
  const left = paths.filter((p) => p.up !== false);
  if (!left.length) {
    return { kind: "lost", before, after, steps: [`successor ${lostSucc.map(name).join("、")} 断了，也没有别的邻居能到 → 路由进入 Active，问遍邻居都没有答案，最后从路由表删掉。`] };
  }
  return {
    kind: "active",
    before,
    after,
    steps: [
      before.fs.length
        ? `successor ${lostSucc.map(name).join("、")} 断了，feasible successor ${before.fs.map(name).join("、")} 也断了，topology table 里没有能用的备胎。`
        : `successor ${lostSucc.map(name).join("、")} 断了，topology table 里没有 feasible successor。`,
      `剩下的 ${left.map((p) => `${p.via}（RD ${p.rd} ≥ 原 FD ${before.fd}）`).join("、")} 不满足 RD < FD，DUAL 不能保证它们不会绕回自己。`,
      `路由变成 Active：向所有邻居发 Query，等 Reply，重新计算。`,
      `邻居回复后选出新的 successor ${after.successors.map(name).join("、")}（新 FD ${after.fd}），路由回到 Passive。比直接升 FS 慢。`,
    ],
  };
}

export const ROLE_LABEL = { successor: "Successor（进路由表）", fs: "Feasible successor（备胎）", nofs: "不是 FS（可能有环）", down: "链路断了" };
