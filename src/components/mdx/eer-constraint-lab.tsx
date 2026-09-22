"use client";

import { useState } from "react";
import { EER_SCENARIOS, constraintInfo, discriminatorName, discriminatorValues } from "./eer-logic.mjs";

type Sub = { name: string; code: string; flag: string };
type Scenario = { id: string; src: string; text: string; super: string; attr: string; subtypes: Sub[]; answer: { total: boolean; overlap: boolean }; why: string };
const SCENARIOS = EER_SCENARIOS as Scenario[];

// Mini EER diagram: supertype box → (single|double) line → circle d/o → subtype boxes with discriminator labels.
function Diagram({ sc, total, overlap }: { sc: Scenario; total: boolean; overlap: boolean }) {
  const W = 520;
  const cx = W / 2;
  const subX = [cx - 130, cx + 130];
  const label = (s: Sub) => (overlap ? `${s.flag}? = "Y"` : `"${s.code}"`);
  return (
    <svg viewBox={`0 0 ${W} 250`} className="eer-svg" role="img" aria-label="EER diagram">
      <rect x={cx - 160} y={10} width={320} height={52} rx={4} className="eer-box" />
      <text x={cx} y={32} textAnchor="middle" className="eer-name">{sc.super}</text>
      <text x={cx} y={51} textAnchor="middle" className="eer-attr">{discriminatorName(sc, overlap)}</text>
      {total ? (
        <>
          <line x1={cx - 3} y1={62} x2={cx - 3} y2={104} className="eer-line" />
          <line x1={cx + 3} y1={62} x2={cx + 3} y2={104} className="eer-line" />
        </>
      ) : (
        <line x1={cx} y1={62} x2={cx} y2={104} className="eer-line" />
      )}
      <circle cx={cx} cy={120} r={16} className="eer-circle" />
      <text x={cx} y={126} textAnchor="middle" className="eer-letter">{overlap ? "o" : "d"}</text>
      <text x={cx + 14} y={90} className="eer-note">{total ? "total（双线）" : "partial（单线）"}</text>
      {!overlap && <text x={cx + 26} y={124} className="eer-note">{`${sc.attr} =`}</text>}
      {sc.subtypes.map((s, i) => {
        const x = subX[i];
        return (
          <g key={s.name}>
            <line x1={cx} y1={136} x2={x} y2={190} className="eer-line" />
            {/* subset symbol ⊂, opening toward the supertype */}
            <path d={`M ${(cx + x) / 2 - 7} ${160} q 7 10 14 0`} className="eer-subset" transform={`rotate(${i === 0 ? 45 : -45} ${(cx + x) / 2} 163)`} />
            <text x={(cx + x) / 2 + (i === 0 ? -14 : 14)} y={168} textAnchor={i === 0 ? "end" : "start"} className="eer-disc">
              {label(s)}
            </text>
            <rect x={x - 95} y={190} width={190} height={40} rx={4} className="eer-box" />
            <text x={x} y={215} textAnchor="middle" className="eer-name">{s.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Two questions → two marks → discriminator form. Try the lecture's scenarios or explore freely.
export function EerConstraintLab() {
  const [scId, setScId] = useState(SCENARIOS[0].id);
  const [total, setTotal] = useState<boolean | null>(null);
  const [overlap, setOverlap] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const sc = SCENARIOS.find((s) => s.id === scId)!;
  const ready = total !== null && overlap !== null;
  const t = total ?? sc.answer.total;
  const o = overlap ?? sc.answer.overlap;
  const info = constraintInfo({ total: t, overlap: o });
  const values = discriminatorValues(sc, { total: t, overlap: o }) as { value: string; meaning: string }[];
  const right = ready && total === sc.answer.total && overlap === sc.answer.overlap;

  const choose = (id: string) => {
    setScId(id);
    setTotal(null);
    setOverlap(null);
    setChecked(false);
  };
  const yn = (v: boolean | null, set: (b: boolean) => void) => (
    <span className="flex gap-1.5">
      {[true, false].map((b) => (
        <button key={String(b)} type="button" onClick={() => { set(b); setChecked(false); }} className={`lab-btn ${v === b ? "lab-btn-on" : ""}`}>
          {b ? "Yes" : "No"}
        </button>
      ))}
    </span>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 两个问题定约束</span>
        <span className="text-[12px] text-fg-3">{sc.src}</span>
      </div>
      <div className="lab-controls">
        {SCENARIOS.map((s) => (
          <button key={s.id} type="button" onClick={() => choose(s.id)} className={`lab-btn ${s.id === scId ? "lab-btn-on" : ""}`}>
            {s.super}
          </button>
        ))}
      </div>
      <p className="lq-item">{sc.text}</p>

      <div className="eer-qs">
        <div>
          <b>Q1</b> 每个 {sc.super} 都必须属于至少一个子类吗？
          {yn(total, setTotal)}
        </div>
        <div>
          <b>Q2</b> 一个 {sc.super} 能同时属于两个子类吗？
          {yn(overlap, setOverlap)}
        </div>
      </div>

      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={!ready} onClick={() => setChecked(true)}>
          检查答案
        </button>
        <button
          type="button"
          className="lab-btn"
          onClick={() => {
            setTotal(sc.answer.total);
            setOverlap(sc.answer.overlap);
            setChecked(true);
          }}
        >
          看答案
        </button>
      </div>

      {checked && (
        <p className={`lab-decision ${right ? "lab-forward" : "lab-flood"}`}>
          <b>{right ? "✓ 两个问题都答对了" : "✗ 再想想"}</b>
          <span>{sc.why}</span>
        </p>
      )}

      {ready && (
        <>
          <Diagram sc={sc} total={t} overlap={o} />
          <table className="lab-table">
            <tbody>
              <tr><th>线</th><td>{info.line}</td></tr>
              <tr><th>圆圈</th><td><b>{info.letter}</b> — {info.rule}</td></tr>
              <tr><th>每个实例属于</th><td>{info.membership}</td></tr>
              <tr><th>Discriminator</th><td>{info.discriminator}<div className="font-mono text-[12.5px] text-fg-2">{discriminatorName(sc, o)}</div></td></tr>
            </tbody>
          </table>
          <table className="lab-table">
            <thead>
              <tr><th>{discriminatorName(sc, o)} 允许的取值</th><th>含义</th></tr>
            </thead>
            <tbody>
              {values.map((v) => (
                <tr key={v.value}><td className="font-mono">{v.value}</td><td>{v.meaning}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
