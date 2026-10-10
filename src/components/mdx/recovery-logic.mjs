// Write-ahead logging and crash recovery as taught in ISOM 5260 Lecture 6 (slides 19–31):
// update records <T, obj, before, after>, LSN / pageLSN, REDO forward by comparing pageLSN,
// UNDO backward writing CLRs with NextLSN, <TXN-END>, and the checkpoint as the starting point.
// One data page holds A, B, C as on the slides, so the page has a single pageLSN.

export const fmtLsn = (n) => (n == null ? "—" : String(n).padStart(3, "0"));

export function recText(r) {
  switch (r.t) {
    case "checkpoint": return "<CHECKPOINT>";
    case "begin": return `<${r.txn} BEGIN>`;
    case "commit": return `<${r.txn} COMMIT>`;
    case "abort": return `<${r.txn} ABORT>`;
    case "end": return `<${r.txn} TXN-END>`;
    case "update": return `<${r.txn}, ${r.obj}, ${r.before}, ${r.after}>`;
    case "clr": return `<${r.txn}, CLR-${fmtLsn(r.undoOf)}, ${r.obj}, ${r.before}, ${r.after}, NextLSN=${fmtLsn(r.next)}>`;
    default: return "?";
  }
}
export const recLine = (r) => `${fmtLsn(r.lsn)}: ${recText(r)}`;
export const pageText = (p) => `pageLSN ${fmtLsn(p.lsn)} · ${Object.entries(p.vals).map(([k, v]) => `${k}=${v}`).join(", ")}`;

const writes = (r) => r.t === "update" || r.t === "clr";

/** The page as it would be on disk if it was last flushed right after LSN `upTo` (null = never flushed). */
export function pageAt(init, log, upTo) {
  const vals = { ...init };
  let lsn = null;
  for (const r of log) {
    if (upTo == null || r.lsn > upTo) break;
    if (writes(r)) {
      vals[r.obj] = r.after;
      lsn = r.lsn;
    }
  }
  return { lsn, vals };
}

/** Pages the disk could legally hold at the crash: any flush point after the last checkpoint's flush. */
export function flushOptions(init, log) {
  const ck = log.findLast((r) => r.t === "checkpoint");
  const before = ck ? log.filter((r) => writes(r) && r.lsn < ck.lsn) : [];
  const floor = before.length ? before[before.length - 1].lsn : null;
  const later = log.filter((r) => writes(r) && (floor == null || r.lsn > floor)).map((r) => r.lsn);
  return [floor, ...later].map((lsn) => ({ lsn, page: pageAt(init, log, lsn) }));
}

/** What each transaction's fate is at restart (slide 31): ignore / redo (winner) / undo (loser). */
export function txnFates(log) {
  const ck = log.findLast((r) => r.t === "checkpoint");
  const seen = [];
  for (const r of log) if (r.txn && !seen.includes(r.txn)) seen.push(r.txn);
  return seen.map((txn) => {
    const commit = log.find((r) => r.txn === txn && r.t === "commit");
    const end = log.find((r) => r.txn === txn && r.t === "end");
    if (end) return { txn, fate: "ignore", why: `已经有 <${txn} TXN-END>：回滚早就做完了` };
    if (commit && ck && commit.lsn < ck.lsn)
      return { txn, fate: "ignore", why: `在 checkpoint 之前就 COMMIT 了，checkpoint 已经把它的修改 flush 到磁盘` };
    if (commit) return { txn, fate: "redo", why: `有 <${txn} COMMIT>${ck ? "（在 checkpoint 之后）" : ""}：已提交，修改必须保住（Durability）` };
    return { txn, fate: "undo", why: `崩溃前没有 <${txn} COMMIT>：当作 abort，修改必须撤掉（Atomicity）` };
  });
}

export const FATE_LABEL = { ignore: "忽略", redo: "REDO", undo: "UNDO" };
export const PHASE_LABEL = { analysis: "分析", redo: "REDO", undo: "UNDO", abort: "ABORT", done: "完成" };

/** Values a correct recovery must end with: the initial page plus only the committed transactions' updates. */
export function committedState(init, log) {
  const ok = new Set(log.filter((r) => r.t === "commit").map((r) => r.txn));
  const vals = { ...init };
  for (const r of log) if (r.t === "update" && ok.has(r.txn)) vals[r.obj] = r.after;
  return vals;
}

/**
 * Run recovery step by step.
 * crash = true: restart after a crash — analysis, REDO from the last checkpoint, UNDO of losers.
 * crash = false: normal-operation abort of `abortTxn` (slide 28) on the in-memory page.
 * Each step: { phase, lsn?, title, detail, ask?: { q, options, answer }, page, logLen, newLsn? }.
 * The log only grows, so a step's view of it is log.slice(0, logLen).
 */
export function recover({ init, log: input, page: start, crash = true, abortTxn }) {
  const log = input.map((r) => ({ ...r }));
  const page = { lsn: start.lsn, vals: { ...start.vals } };
  const steps = [];
  const push = (s) => steps.push({ ...s, page: { lsn: page.lsn, vals: { ...page.vals } }, logLen: log.length });
  let next = (log.length ? log[log.length - 1].lsn : 0) + 1;
  const append = (r) => {
    const rec = { lsn: next++, ...r };
    log.push(rec);
    return rec;
  };
  const byLsn = (lsn) => log.find((r) => r.lsn === lsn);
  // NextLSN of a CLR = the transaction's previous BEGIN / update record before the one being undone.
  const prevOf = (txn, lsn) => [...log].reverse().find((r) => r.txn === txn && r.lsn < lsn && (r.t === "update" || r.t === "begin"))?.lsn;

  let losers = [];
  const fates = crash ? txnFates(log) : [];

  if (crash) {
    const ck = log.findLast((r) => r.t === "checkpoint");
    push({
      phase: "analysis",
      lsn: ck?.lsn,
      title: ck ? `从日志末尾往上找到最近的 <CHECKPOINT>（${fmtLsn(ck.lsn)}），从这里开始` : "日志里没有 checkpoint，只能从头开始",
      detail: ck
        ? "checkpoint 时所有 dirty page 都已 flush 到磁盘，所以它之前已经提交的事务不用再管（p.29、p.31）。"
        : "没有 checkpoint 就得重放整个日志——这正是 p.29 说要做 checkpoint 的原因。",
    });
    for (const f of fates) {
      push({
        phase: "analysis",
        txn: f.txn,
        title: `${f.txn} → ${FATE_LABEL[f.fate]}`,
        detail: f.why,
        ask: { q: `${f.txn} 在恢复时怎么处理？`, options: ["忽略", "REDO", "UNDO"], answer: FATE_LABEL[f.fate] },
      });
    }
    losers = fates.filter((f) => f.fate === "undo").map((f) => f.txn);

    const from = ck ? ck.lsn : log[0]?.lsn ?? 0;
    const original = log.length;
    for (let i = 0; i < original; i++) {
      const r = log[i];
      if (r.lsn < from || !writes(r)) continue;
      const already = page.lsn != null && page.lsn >= r.lsn;
      const was = page.lsn;
      if (!already) {
        page.vals[r.obj] = r.after;
        page.lsn = r.lsn;
      }
      push({
        phase: "redo",
        lsn: r.lsn,
        changed: already ? null : r.obj,
        title: already
          ? `${fmtLsn(r.lsn)} 跳过：pageLSN ${fmtLsn(was)} ≥ ${fmtLsn(r.lsn)}`
          : `${fmtLsn(r.lsn)} 重做：pageLSN ${fmtLsn(was)} < ${fmtLsn(r.lsn)} → ${r.obj} = ${r.after}，pageLSN 改成 ${fmtLsn(r.lsn)}`,
        detail: already
          ? "这条修改已经在磁盘页面上了，什么都不做（p.24）。"
          : `把 after-image 写回页面${r.t === "clr" ? "。CLR 也要 redo——它是 redo-only 的记录（p.27）" : ""}${losers.includes(r.txn) && r.t === "update" ? `。${r.txn} 没提交也照样先 redo，后面的 UNDO 阶段再把它撤掉（p.24 最后一条）` : ""}。`,
        ask: { q: `${recLine(r)}：磁盘页面 pageLSN = ${fmtLsn(was)}。这条要？`, options: ["跳过", "重做"], answer: already ? "跳过" : "重做" },
      });
    }
  } else {
    losers = [abortTxn];
    const ab = append({ t: "abort", txn: abortTxn });
    push({
      phase: "abort",
      lsn: ab.lsn,
      title: `${abortTxn} 在正常运行中请求 abort：先写 ${recLine(ab)}`,
      detail: "没有崩溃，所以没有分析和 REDO；接下来用和崩溃恢复一样的 UNDO 步骤倒着撤销（p.28）。",
      newLsn: ab.lsn,
    });
  }

  // UNDO: always take the largest pending LSN among the losers, walking backwards.
  const pending = {};
  for (const txn of losers) {
    const last = [...log].reverse().find((r) => r.txn === txn && r.t !== "abort");
    if (last?.t === "clr") {
      pending[txn] = last.next;
      push({
        phase: "undo",
        lsn: last.lsn,
        title: `${txn} 最后一条是 CLR-${fmtLsn(last.undoOf)}：${fmtLsn(last.undoOf)} 已经撤销过，直接跳到 NextLSN = ${fmtLsn(last.next)}`,
        detail: "CLR 是 redo-only 的，永远不会被 undo；NextLSN 告诉我们下一条该撤销哪条，避免重复撤销（p.25、p.27）。",
        ask: {
          q: `${txn} 的最后一条记录是 ${recText(last)}。UNDO 从哪里继续？`,
          options: [`再撤销一次 ${fmtLsn(last.undoOf)}`, `从 ${fmtLsn(last.next)} 继续`],
          answer: `从 ${fmtLsn(last.next)} 继续`,
        },
      });
    } else if (last) {
      pending[txn] = last.lsn;
    }
  }
  if (losers.length === 0 && crash) {
    push({ phase: "undo", title: "没有未提交的事务，UNDO 阶段什么都不用做", detail: "所有事务要么已提交（REDO 保住了），要么在 checkpoint 之前就结束了。" });
  }
  while (Object.keys(pending).length) {
    const txn = Object.keys(pending).reduce((a, b) => (pending[a] >= pending[b] ? a : b));
    const r = byLsn(pending[txn]);
    if (!r || r.t === "begin") {
      const end = append({ t: "end", txn });
      delete pending[txn];
      push({
        phase: "undo",
        lsn: r?.lsn,
        title: `倒着走到 <${txn} BEGIN>：写 ${recLine(end)}`,
        detail: `${txn} 的所有修改都已撤销，并且每个撤销动作都记成了 CLR（p.26）。`,
        newLsn: end.lsn,
        ask: { q: `${txn} 倒着撤销到了 <${txn} BEGIN>，接下来写什么？`, options: [`<${txn} COMMIT>`, `<${txn} TXN-END>`, `<${txn} ABORT>`], answer: `<${txn} TXN-END>` },
      });
      continue;
    }
    if (r.t !== "update") {
      pending[txn] = prevOf(txn, r.lsn);
      continue;
    }
    const clr = append({ t: "clr", txn, undoOf: r.lsn, obj: r.obj, before: r.after, after: r.before, next: prevOf(txn, r.lsn) });
    page.vals[r.obj] = r.before;
    page.lsn = clr.lsn;
    pending[txn] = clr.next;
    push({
      phase: "undo",
      lsn: r.lsn,
      changed: r.obj,
      newLsn: clr.lsn,
      title: `撤销 ${fmtLsn(r.lsn)}：先写 ${recLine(clr)}，再把 ${r.obj} 改回 ${r.before}`,
      detail: `顺序是「先写 CLR，再改页面」（p.25）。CLR 里的 before / after 和原记录正好对调；NextLSN = ${fmtLsn(clr.next)} 是 ${txn} 下一条要处理的记录。`,
      ask: { q: `撤销 ${recLine(r)}，${r.obj} 要恢复成？`, options: [String(r.after), String(r.before)], answer: String(r.before) },
    });
  }

  const want = committedState(init, log);
  const ok = Object.keys(want).every((k) => want[k] === page.vals[k]);
  push({
    phase: "done",
    title: `完成：${Object.entries(page.vals).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    detail: ok
      ? "和「只保留已提交事务的修改」完全一致：已提交的都在（Durability），没提交的一点不剩（Atomicity）。"
      : "⚠ 和只保留已提交事务的结果不一致，检查一下日志。",
  });
  return { steps, log, fates, ok };
}

// ---------- presets (slide numbers from Lecture 6) ----------
const T1_T2 = [
  { lsn: 16, t: "checkpoint" },
  { lsn: 17, t: "begin", txn: "T1" },
  { lsn: 18, t: "update", txn: "T1", obj: "A", before: 1, after: 8 },
  { lsn: 19, t: "update", txn: "T1", obj: "B", before: 5, after: 9 },
  { lsn: 20, t: "commit", txn: "T1" },
  { lsn: 21, t: "begin", txn: "T2" },
  { lsn: 22, t: "update", txn: "T2", obj: "A", before: 8, after: 6 },
  { lsn: 23, t: "update", txn: "T2", obj: "C", before: 7, after: 4 },
];

export const RECOVERY_PRESETS = [
  {
    id: "redo",
    label: "p.24 只要 REDO",
    source: "Slide 21–24",
    init: { A: 1, B: 5, C: 7 },
    log: T1_T2.slice(0, 5),
    crash: true,
    flushed: 18,
    intro: "T1 已提交（<COMMIT> 已上盘），但崩溃时磁盘页面只写到了 018：A=8 在盘上，B=9 还没写回。",
  },
  {
    id: "undo",
    label: "p.25–26 REDO + UNDO",
    source: "Slide 25–26",
    init: { A: 1, B: 5, C: 7 },
    log: T1_T2,
    crash: true,
    flushed: 18,
    intro: "T1 提交之后 T2 开始，改了 A 和 C，还没提交就崩溃了。磁盘页面同样只写到 018（我的设定，课件这页只画了日志）。",
  },
  {
    id: "recrash",
    label: "p.27 恢复途中又崩溃",
    source: "Slide 27",
    init: { A: 1, B: 5, C: 7 },
    log: [...T1_T2, { lsn: 24, t: "clr", txn: "T2", undoOf: 23, obj: "C", before: 4, after: 7, next: 22 }],
    crash: true,
    flushed: 18,
    intro: "上一个恢复刚写完 024（CLR-023）又崩溃了。重启后：REDO 会把 CLR 也重做一遍，UNDO 顺着 NextLSN=022 接着做，不会重复撤销 023。",
  },
  {
    id: "abort",
    label: "p.28 正常运行时 ABORT",
    source: "Slide 28",
    init: { A: 1, B: 5, C: 7 },
    log: T1_T2,
    crash: false,
    abortTxn: "T2",
    intro: "没有崩溃：T2 改完 A 和 C 之后自己请求 abort（比如程序 ROLLBACK）。页面就是 buffer pool 里的当前页面。",
  },
  {
    id: "ckpt",
    label: "p.31 Checkpoint：T1 / T2 / T3",
    source: "Slide 29–31",
    init: { A: 1, B: 4 },
    log: [
      { lsn: 1, t: "begin", txn: "T1" },
      { lsn: 2, t: "update", txn: "T1", obj: "A", before: 1, after: 2 },
      { lsn: 3, t: "commit", txn: "T1" },
      { lsn: 4, t: "begin", txn: "T2" },
      { lsn: 5, t: "update", txn: "T2", obj: "A", before: 2, after: 3 },
      { lsn: 6, t: "begin", txn: "T3" },
      { lsn: 7, t: "checkpoint" },
      { lsn: 8, t: "update", txn: "T2", obj: "B", before: 4, after: 5 },
      { lsn: 9, t: "commit", txn: "T2" },
      { lsn: 10, t: "update", txn: "T3", obj: "A", before: 3, after: 4 },
    ],
    crash: true,
    flushed: 5,
    intro: "课件这页的日志没有编号，001–010 是我加的。checkpoint 已经把 005 之前的修改 flush 到盘，崩溃时磁盘页面默认停在 005。",
  },
];

/** Start a preset: the page recovery begins with (disk page after a crash, in-memory page for an abort). */
export function presetStart(preset, flushed = preset.flushed) {
  if (!preset.crash) return pageAt(preset.init, preset.log, preset.log[preset.log.length - 1].lsn);
  return pageAt(preset.init, preset.log, flushed);
}

// ---------- normal operation under WAL (slides 19–23) ----------
// T1: BEGIN, Write(A = 8), Write(B = 9), COMMIT, starting after <CHECKPOINT> 016 with A=1, B=5, C=7.
export const WAL_INIT = { A: 1, B: 5, C: 7 };
export const WAL_OPS = [
  { label: "BEGIN", rec: { t: "begin", txn: "T1" } },
  { label: "Write(A): A = 8", rec: { t: "update", txn: "T1", obj: "A", before: 1, after: 8 } },
  { label: "Write(B): B = 9", rec: { t: "update", txn: "T1", obj: "B", before: 5, after: 9 } },
  { label: "COMMIT", rec: { t: "commit", txn: "T1" } },
];

export function walInit() {
  return {
    pos: 0,
    log: [{ lsn: 16, t: "checkpoint" }],
    flushedLsn: 16,
    mem: { lsn: null, vals: { ...WAL_INIT } },
    disk: { lsn: null, vals: { ...WAL_INIT } },
    acked: false,
    crashed: null,
    msg: null,
  };
}

const lastLsn = (log) => log[log.length - 1].lsn;

/** One user action on the normal-operation lab. Returns the new state; state.msg explains what happened. */
export function walAct(s, action) {
  if (s.crashed && action !== "reset") return s;
  const st = { ...s, log: [...s.log], mem: { ...s.mem, vals: { ...s.mem.vals } }, disk: { ...s.disk, vals: { ...s.disk.vals } } };
  if (action === "reset") return walInit();

  if (action === "next") {
    const op = WAL_OPS[st.pos];
    if (!op) return { ...st, msg: { kind: "info", text: "T1 的操作都做完了。" } };
    const rec = { lsn: lastLsn(st.log) + 1, ...op.rec };
    st.log.push(rec);
    st.pos += 1;
    if (rec.t === "update") {
      st.mem.vals[rec.obj] = rec.after;
      st.mem.lsn = rec.lsn;
      return { ...st, msg: { kind: "ok", text: `先把 ${recLine(rec)} 放进内存的 WAL buffer，再改 buffer pool 里的页面：${rec.obj}=${rec.after}，pageLSN=${fmtLsn(rec.lsn)}。磁盘上的数据文件还没变——这就是 dirty page（p.15、p.22）。` } };
    }
    if (rec.t === "commit")
      return { ...st, msg: { kind: "ok", text: `${recLine(rec)} 进了 WAL buffer。按 WAL 规则，要等日志 flush 到 ${fmtLsn(rec.lsn)} 之后才能告诉用户「提交成功」（p.20、p.23）。` } };
    return { ...st, msg: { kind: "ok", text: `${recLine(rec)} 放进内存的 WAL buffer，标记 T1 开始（p.19）。` } };
  }

  if (action === "flushLog") {
    const to = lastLsn(st.log);
    if (to === st.flushedLsn) return { ...st, msg: { kind: "info", text: "WAL buffer 里没有新记录，磁盘日志已经是最新的。" } };
    const from = st.flushedLsn;
    st.flushedLsn = to;
    return { ...st, msg: { kind: "ok", text: `日志 ${fmtLsn(from + 1)}–${fmtLsn(to)} 顺序写到磁盘（log file）。顺序追加写很快，这也是先写日志的好处。` } };
  }

  if (action === "flushPage") {
    if (st.mem.lsn == null || st.mem.lsn === st.disk.lsn)
      return { ...st, msg: { kind: "info", text: "页面没有被改过（不是 dirty page），不用写回。" } };
    if (st.mem.lsn > st.flushedLsn)
      return {
        ...st,
        msg: {
          kind: "block",
          text: `✗ 违反 WAL 规则 1：页面 pageLSN = ${fmtLsn(st.mem.lsn)}，但磁盘日志只到 ${fmtLsn(st.flushedLsn)}。日志记录必须先于对应的数据写到磁盘（p.20），否则崩溃后盘上有修改、却没有 before value 可以 UNDO。先按「Flush 日志」。`,
        },
      };
    st.disk = { lsn: st.mem.lsn, vals: { ...st.mem.vals } };
    const committed = st.log.some((r) => r.t === "commit" && r.lsn <= st.flushedLsn);
    return {
      ...st,
      msg: {
        kind: "ok",
        text: committed
          ? `页面写回数据文件（pageLSN ${fmtLsn(st.disk.lsn)}），这个页面不再是 dirty page。`
          : `页面写回数据文件（pageLSN ${fmtLsn(st.disk.lsn)}）——T1 还没提交，它的修改却已经在盘上了。这就是 p.17 的情况：如果现在崩溃，恢复时必须 UNDO。`,
      },
    };
  }

  if (action === "ack") {
    const commit = st.log.find((r) => r.t === "commit");
    if (!commit) return { ...st, msg: { kind: "block", text: "T1 还没执行 COMMIT，不能告诉用户「提交成功」。" } };
    if (st.flushedLsn < commit.lsn)
      return {
        ...st,
        msg: {
          kind: "block",
          text: `✗ 违反 WAL 规则 2：<T1 COMMIT>（${fmtLsn(commit.lsn)}）还在内存的 WAL buffer 里。只有包括 <COMMIT> 在内的所有日志都上盘之后，才能确认提交（p.20）。先按「Flush 日志」——真实的 DBMS 在 COMMIT 时会自动做这一步（p.23）。`,
        },
      };
    st.acked = true;
    return {
      ...st,
      msg: {
        kind: "ok",
        text: `告诉用户「提交成功」。磁盘数据页面${st.disk.lsn === st.mem.lsn ? "也已经是最新的" : `还是旧的（pageLSN ${fmtLsn(st.disk.lsn)}）`}，但恢复 T1 需要的一切都在磁盘日志里，可以放心返回（p.23）。`,
      },
    };
  }

  if (action === "crash") {
    const durable = st.log.filter((r) => r.lsn <= st.flushedLsn);
    const lost = st.log.filter((r) => r.lsn > st.flushedLsn);
    const result = recover({ init: WAL_INIT, log: durable, page: st.disk, crash: true });
    const t1 = result.fates.find((f) => f.txn === "T1");
    const final = result.steps[result.steps.length - 1].page.vals;
    const kept = final.A === 8 && final.B === 9;
    const verdict = st.acked
      ? kept
        ? "用户收到过「提交成功」，恢复后 A=8、B=9 都在 ✓ Durability"
        : "⚠ 用户收到过「提交成功」，修改却丢了"
      : kept
        ? "用户还没收到确认，但 <COMMIT> 已经上盘，所以 T1 算提交成功 ✓"
        : "用户没收到「提交成功」，T1 的修改一点不剩 ✓ Atomicity";
    return {
      ...st,
      crashed: { durable, lost, result, t1, final, verdict },
      msg: {
        kind: "info",
        text: `💥 崩溃：内存里的 WAL buffer 和 buffer pool 全部丢失${lost.length ? `（丢了 ${lost.map((r) => fmtLsn(r.lsn)).join("、")}）` : ""}。重启后只能靠磁盘日志和磁盘页面恢复。`,
      },
    };
  }
  return st;
}

/** Scripted demos for slides 16 and 17. */
export const WAL_DEMOS = [
  { id: "p16", label: "演示 p.16：提交了，页面还在内存 → 崩溃", actions: ["next", "next", "next", "next", "flushLog", "ack", "crash"] },
  { id: "p17", label: "演示 p.17：没提交，页面已经写回磁盘 → 崩溃", actions: ["next", "next", "flushLog", "flushPage", "crash"] },
  { id: "rules", label: "演示：违反 WAL 两条规则会被拦下", actions: ["next", "next", "flushPage", "next", "next", "ack"] },
];

export function runWal(actions) {
  let s = walInit();
  const trail = [];
  for (const a of actions) {
    s = walAct(s, a);
    trail.push({ action: a, msg: s.msg, state: s });
  }
  return { state: s, trail };
}

export const WAL_ACTION_LABEL = {
  next: "T1 下一步",
  flushLog: "Flush 日志",
  flushPage: "Flush 数据页",
  ack: "回复用户：提交成功",
  crash: "💥 崩溃",
};
