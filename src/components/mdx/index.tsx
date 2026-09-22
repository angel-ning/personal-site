import type { ReactNode } from "react";
import osi from "./data/osi.json";
import { SwitchLab } from "./switch-lab";
import { FcsDemo } from "./fcs-demo";
import { collisionRows, collisionSvg } from "./collision-map.mjs";

// Components available inside .mdx notes. scripts/mdx-to-md.mjs knows how to turn
// each of them back into plain Markdown — add a case there when adding one here.

const isRelative = (u: string) => !/^(https?:|data:|\/)/i.test(u);

const CALLOUTS = {
  exam: { icon: "🎯", label: "考点" },
  tip: { icon: "💡", label: "小白理解" },
  warn: { icon: "⚠️", label: "踩坑提醒" },
  board: { icon: "✍️", label: "老师板书" },
  extra: { icon: "➕", label: "课外补充" },
  memo: { icon: "🧠", label: "记忆口诀" },
  note: { icon: "📌", label: "注意" },
} as const;
type CalloutType = keyof typeof CALLOUTS;

export function Callout({ type = "note", title, children }: { type?: CalloutType; title?: string; children: ReactNode }) {
  const c = CALLOUTS[type] ?? CALLOUTS.note;
  return (
    <aside className={`callout callout-${type}`}>
      <p className="callout-title">
        <span aria-hidden>{c.icon}</span> {title ?? c.label}
      </p>
      <div className="callout-body">{children}</div>
    </aside>
  );
}

function makeFigure(assetBase: string) {
  return function Figure({
    src,
    alt,
    caption,
    source,
    board,
  }: {
    src: string;
    alt?: string;
    caption?: ReactNode;
    source?: string;
    board?: boolean;
  }) {
    const url = isRelative(src) ? encodeURI(assetBase + src) : src;
    return (
      <figure className={board ? "fig fig-board" : "fig"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt ?? (typeof caption === "string" ? caption : "")} loading="lazy" decoding="async" />
        {(caption || source) && (
          <figcaption>
            {caption}
            {source && <span className="fig-source">{source}</span>}
          </figcaption>
        )}
      </figure>
    );
  };
}

export function QA({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="qa">
      <summary>{q}</summary>
      <div className="qa-body">{children}</div>
    </details>
  );
}

export function LayerStack() {
  const cell = (row: number, col: number, extra?: string) => ({ gridRow: extra ?? String(row), gridColumn: String(col) });
  const heads = ["#", "OSI 层", "做什么", "PDU", "典型设备", "TCP/IP"];
  return (
    <div className="layer-stack-wrap">
      <div className="layer-stack" role="table" aria-label="OSI 7 layers">
        {heads.map((h, c) => (
          <span key={h} className="ls-head" role="columnheader" style={cell(1, c + 1)}>
            {h}
          </span>
        ))}
        {osi.map((l, i) => {
          const row = i + 2;
          const prev = osi[i - 1];
          const span = osi.filter((x) => x.tcpip === l.tcpip).length;
          return [
            <span key={`${l.n}n`} className={`ls-n ls-l${l.n}`} style={cell(row, 1)}>{l.n}</span>,
            <span key={`${l.n}name`} className={`ls-l${l.n}`} style={cell(row, 2)}>
              <b>{l.en}</b>
              <small>{l.zh}</small>
            </span>,
            <span key={`${l.n}role`} className={`ls-l${l.n}`} style={cell(row, 3)}>
              {l.roleZh}
              <small>{l.examples}</small>
            </span>,
            <span key={`${l.n}pdu`} className={`ls-pdu ls-l${l.n}`} style={cell(row, 4)}>{l.pdu}</span>,
            <span key={`${l.n}dev`} className={`ls-dev ls-l${l.n}`} style={cell(row, 5)}>{l.devices}</span>,
            !prev || prev.tcpip !== l.tcpip ? (
              <span key={`${l.n}tcp`} className="ls-tcpip" style={cell(row, 6, `${row} / span ${span}`)}>
                {l.tcpip}
              </span>
            ) : null,
          ];
        })}
      </div>
    </div>
  );
}

export function CollisionMap() {
  return (
    <figure className="collision-map">
      <div className="cm-svg" dangerouslySetInnerHTML={{ __html: collisionSvg }} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>标记</th>
              <th>冲突在哪里发生（Hub）</th>
              <th>交换机怎么防</th>
              <th>位置</th>
            </tr>
          </thead>
          <tbody>
            {collisionRows.map((r) => (
              <tr key={r.mark}>
                <td>
                  <b>{r.mark}</b>
                </td>
                <td>{r.where}</td>
                <td>{r.fix}</td>
                <td className="whitespace-nowrap">{r.place}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function noteComponents(assetBase: string) {
  return { Callout, Figure: makeFigure(assetBase), QA, LayerStack, SwitchLab, FcsDemo, CollisionMap };
}
