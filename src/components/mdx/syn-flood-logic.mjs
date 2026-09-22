// Pure SYN-flood / TCP three-way-handshake logic for <SynFloodLab />, shared with
// scripts/lib/mdx-core.mjs so the exported Markdown table walks the same script.

export const CAPACITY = 5;
export const HALFOPEN_TIMEOUT = 6; // ticks before the server gives up on an unanswered SYN-ACK

export function initialState() {
  return { backlog: [], nextId: 1, tick: 0, log: null };
}

/** A real client completes SYN → SYN-ACK → ACK immediately and occupies one slot. */
export function connectNormal(state) {
  if (state.backlog.length >= CAPACITY) {
    return { ...state, log: { type: "refused" } };
  }
  const entry = { id: state.nextId, kind: "normal", status: "established", createdAt: state.tick };
  return {
    ...state,
    backlog: [...state.backlog, entry],
    nextId: state.nextId + 1,
    log: { type: "established", id: entry.id },
  };
}

/** Attacker sends a SYN with a spoofed source IP; the server's SYN-ACK goes nowhere, so the slot stays half-open. */
export function launchSpoofedSyn(state) {
  if (state.backlog.length >= CAPACITY) {
    return { ...state, log: { type: "queue-full" } };
  }
  const entry = { id: state.nextId, kind: "attack", status: "half-open", createdAt: state.tick };
  return {
    ...state,
    backlog: [...state.backlog, entry],
    nextId: state.nextId + 1,
    log: { type: "half-open", id: entry.id },
  };
}

/** Advance the clock; half-open slots older than HALFOPEN_TIMEOUT are reclaimed, established ones are not. */
export function waitTicks(state, amount = HALFOPEN_TIMEOUT) {
  const t = state.tick + amount;
  const backlog = state.backlog.filter((e) => e.status === "established" || t - e.createdAt < HALFOPEN_TIMEOUT);
  return { ...state, tick: t, backlog, log: { type: "timeout", freedCount: state.backlog.length - backlog.length } };
}

/** The scripted walkthrough used by both the demo's "读取板书" button and the Markdown export. */
export function runScript() {
  const steps = [];
  let s = initialState();
  const record = (action) => steps.push({ action, backlog: s.backlog, log: s.log });

  s = connectNormal(s);
  record("员工电脑正常连接（完成 3-way handshake）");
  for (let i = 0; i < CAPACITY - 1; i++) {
    s = launchSpoofedSyn(s);
    record(`攻击者发送伪造 SYN #${i + 1}`);
  }
  s = connectNormal(s);
  record("又一台员工电脑尝试连接");
  s = waitTicks(s);
  record(`等待 ${HALFOPEN_TIMEOUT} 个 tick（半开连接超时被回收）`);

  return steps;
}
