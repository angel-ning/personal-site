// SEQ / ACK ladder diagram for the "illustrate the sequence and acknowledgment numbers" drawing
// question (ISOM 5180 Module 3, Slides 10–14 and 23): two initial sequence numbers, a window size,
// then the handshake, each window of data segments and the expectational ACK that answers it.
// Shared by <SeqAckLab /> and scripts/lib/mdx-core.mjs. Round structure (window, lost segment,
// timeout, retransmission) comes from simulateWindow() so it matches <WindowLab />.
import { simulateWindow } from "./tcp-logic.mjs";

/**
 * @param {{ aIsn: number, bIsn: number, window: number, total: number, unit: "segment" | "byte", size?: number, lost?: number[], a?: string, b?: string }} o
 * unit "segment": every data segment uses one number (Slide 23: "I sent #10 … now send #11").
 * unit "byte": every byte is numbered; a segment of `size` bytes advances SEQ by `size`.
 * Returns { events, rounds, firstData, lastAck }. Each event: { from, to, flags, seq, ack, len, segment?, lost?, retx?, round?, note }.
 */
export function seqAckLadder({ aIsn, bIsn, window, total, unit = "segment", size = 100, lost = [], a = "A", b = "B" }) {
  const A = Number(aIsn);
  const B = Number(bIsn);
  const step = unit === "byte" ? Number(size) : 1;
  const first = A + 1; // SYN uses one number, so data starts at ISN + 1
  const seqOf = (n) => first + (n - 1) * step;
  const events = [
    { from: a, to: b, flags: "SYN", seq: A, ack: null, len: 0, note: `${a} 选 ISN = ${A}` },
    { from: b, to: a, flags: "SYN, ACK", seq: B, ack: A + 1, len: 0, note: `${b} 选 ISN = ${B}；ACK = ${A} + 1` },
    { from: a, to: b, flags: "ACK", seq: A + 1, ack: B + 1, len: 0, note: `ACK = ${B} + 1；连接建立` },
  ];
  const rounds = simulateWindow({ total: Number(total), window: Number(window), lost: lost.map(Number) });
  rounds.forEach((r, ri) => {
    r.sent.forEach((x) => {
      events.push({
        from: a,
        to: b,
        flags: "Data",
        seq: seqOf(x.n),
        ack: B + 1,
        len: unit === "byte" ? step : 1,
        segment: x.n,
        lost: !x.arrived,
        retx: x.retx,
        round: ri,
        note: `${x.retx ? "重传" : "第"} ${x.n} 段${unit === "byte" ? `：字节 ${seqOf(x.n)} – ${seqOf(x.n) + step - 1}` : ""}${x.arrived ? "" : "（丢失）"}`,
      });
    });
    const ackVal = seqOf(r.ack);
    events.push({
      from: b,
      to: a,
      flags: "ACK",
      seq: B + 1,
      ack: ackVal,
      len: 0,
      round: ri,
      timeout: r.timeout,
      note: r.timeout
        ? `ACK = ${ackVal}：还在等第 ${r.ack} 段（期望型确认只能报最前面缺的那一段）→ ${a} 的计时器到期，重传`
        : r.ack > Number(total)
          ? `ACK = ${ackVal}：全部收到`
          : `ACK = ${ackVal}：前面都收到了，下一个要 ${ackVal}（窗口往前滑）`,
    });
  });
  return { events, rounds, firstData: first, lastAck: seqOf(Number(total) + 1), step };
}

export const SEQACK_PRESETS = [
  { label: "板书 p.3：Percy 10 / G.f. 20，窗口 3，每段 100 bytes", aIsn: 10, bIsn: 20, window: 3, total: 6, unit: "byte", size: 100, lost: [], a: "Percy", b: "G.f." },
  { label: "按段编号：ISN 100 / 300，窗口 2，共 6 段", aIsn: 100, bIsn: 300, window: 2, total: 6, unit: "segment", size: 1, lost: [], a: "A", b: "B" },
  { label: "停等：窗口 1，共 3 段", aIsn: 100, bIsn: 300, window: 1, total: 3, unit: "segment", size: 1, lost: [], a: "A", b: "B" },
  { label: "第 4 段丢失：窗口 3，每段 500 bytes", aIsn: 1000, bIsn: 5000, window: 3, total: 6, unit: "byte", size: 500, lost: [4], a: "Client", b: "Server" },
  { label: "预测卷 B4：ISN 500 / 4000，窗口 3，每段 200 bytes，第 5 段丢失", aIsn: 500, bIsn: 4000, window: 3, total: 6, unit: "byte", size: 200, lost: [5], a: "A", b: "B" },
];

const FONT = `system-ui,-apple-system,'PingFang SC','Hiragino Sans GB',sans-serif`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Label text of one arrow; `hide` replaces the numbers with blanks for practice. */
export function arrowLabel(e, hide = false) {
  const n = (v) => (hide ? "___" : String(v));
  const parts = [e.flags === "Data" ? (e.retx ? "Data（重传）" : "Data") : e.flags, `SEQ=${n(e.seq)}`];
  if (e.ack != null) parts.push(`ACK=${n(e.ack)}`);
  return parts.join("  ");
}

/** Ladder (time-sequence) diagram as SVG. */
export function ladderSvg(ladder, { a = "A", b = "B", hide = false } = {}) {
  const W = 560;
  const xa = 90;
  const xb = W - 90;
  const top = 56;
  const gap = 34;
  const ev = ladder.events;
  const H = top + ev.length * gap + 30;
  const out = [];
  out.push(`<text x="${xa}" y="24" text-anchor="middle" class="sq-who">${esc(a)}</text><text x="${xb}" y="24" text-anchor="middle" class="sq-who">${esc(b)}</text>`);
  out.push(`<line x1="${xa}" y1="34" x2="${xa}" y2="${H - 12}" class="sq-life"/><line x1="${xb}" y1="34" x2="${xb}" y2="${H - 12}" class="sq-life"/>`);
  // window brackets: consecutive data events of the same round on A's side
  const byRound = {};
  ev.forEach((e, i) => {
    if (e.flags === "Data") (byRound[e.round] ??= []).push(i);
  });
  Object.entries(byRound).forEach(([, idx]) => {
    const y1 = top + idx[0] * gap - 6;
    const y2 = top + idx[idx.length - 1] * gap + 14;
    out.push(`<path d="M${xa - 14},${y1} h-6 V${y2} h6" class="sq-win"/>`);
    out.push(`<text x="${xa - 26}" y="${(y1 + y2) / 2 + 4}" text-anchor="end" class="sq-wt">${idx.length} 段</text>`);
  });
  ev.forEach((e, i) => {
    const y = top + i * gap;
    const fromA = e.from === a;
    const x1 = fromA ? xa : xb;
    const x2full = fromA ? xb : xa;
    const x2 = e.lost ? x1 + (x2full - x1) * 0.62 : x2full;
    const y2 = y + (e.lost ? 14 * 0.62 : 14);
    const cls = e.flags === "Data" ? "sq-data" : e.flags === "ACK" && e.round != null ? "sq-ack" : "sq-hs";
    out.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y2.toFixed(1)}" class="sq-arrow ${cls}" ${e.lost ? "" : `marker-end="url(#sq-head)"`}/>`);
    if (e.lost) out.push(`<text x="${x2}" y="${(y2 + 5).toFixed(1)}" text-anchor="middle" class="sq-x">✕</text>`);
    out.push(`<text x="${W / 2}" y="${y - 4}" text-anchor="middle" class="sq-lab ${cls}-t">${esc(arrowLabel(e, hide))}</text>`);
    if (e.timeout) out.push(`<text x="${xa - 8}" y="${y + gap - 6}" text-anchor="end" class="sq-to">⏰ 超时</text>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TCP SEQ / ACK 时序图">
<defs><marker id="sq-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="sq-headp"/></marker></defs>
<style>
.sq-who{font:600 13px ${FONT};fill:var(--fg,#1b1b1f)}
.sq-life{stroke:var(--line-strong,#cfccc4);stroke-width:2}
.sq-arrow{stroke-width:1.5}
.sq-hs{stroke:var(--accent,#1f4e8c)}
.sq-data{stroke:var(--fg-2,#56565e)}
.sq-ack{stroke:var(--c-tip,#067647)}
.sq-headp{fill:var(--fg-3,#8b8b93)}
.sq-lab{font:600 11px ui-monospace,Menlo,monospace}
.sq-hs-t{fill:var(--accent,#1f4e8c)}
.sq-data-t{fill:var(--fg-2,#56565e)}
.sq-ack-t{fill:var(--c-tip,#067647)}
.sq-x{font:700 13px ${FONT};fill:var(--c-exam,#b42318)}
.sq-win{stroke:var(--c-board,#5b4bc4);stroke-width:1.4;fill:none}
.sq-wt{font:600 10.5px ${FONT};fill:var(--c-board,#5b4bc4)}
.sq-to{font:600 10.5px ${FONT};fill:var(--c-exam,#b42318)}
</style>
${out.join("\n")}
</svg>`;
}
