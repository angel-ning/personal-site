"use client";

import { useState } from "react";
import { CHAIN_DATA, HASH_PRESETS, avalanche, chainCheck, sealChain } from "./hash-logic.mjs";

// Slide 22: fixed length, same input → same hash, one small change → a completely different hash.
export function HashLab() {
  const [a, setA] = useState(HASH_PRESETS[0].a);
  const [b, setB] = useState(HASH_PRESETS[0].b);
  const r = avalanche(a, b);
  const diff = (h: string, other: string) =>
    [...h].map((ch, i) => (
      <span key={i} style={ch !== other[i] ? { color: "var(--c-exam)" } : undefined}>
        {ch}
      </span>
    ));

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · SHA-256：改一个字，哈希全变
        </span>
      </div>
      <div className="lab-controls">
        {HASH_PRESETS.map((p) => (
          <button key={p.note} type="button" className="lab-btn" onClick={() => (setA(p.a), setB(p.b))}>
            {p.note}
          </button>
        ))}
      </div>
      {[
        ["消息 A", a, setA, r.ha, r.hb],
        ["消息 B", b, setB, r.hb, r.ha],
      ].map(([label, val, set, h, other]) => (
        <div key={label as string} className="mt-3">
          <label className="flex items-center gap-1.5 text-[13px]">
            {label as string}
            <input value={val as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} className="lab-select w-[18em] px-2 py-1 text-[13px]" />
          </label>
          <div className="mt-1 break-all font-mono text-[12px]">{diff(h as string, other as string)}</div>
        </div>
      ))}
      <p className={`lab-decision ${r.same ? "lab-forward" : "lab-flood"}`}>
        <b>{r.same ? "两个哈希完全一样" : `256 位里有 ${r.bits} 位不同（约 ${Math.round((r.bits / 256) * 100)}%），64 个字符里 ${r.hex} 个不同`}</b>
        <span>
          {r.same
            ? "Same data → same hash value：所以 Bob 能用重算比对的方式检查完整性。"
            : "A small change → big change：差不多一半的位都翻了，看不出两条消息「只差一点」，也没法从哈希倒推回去。"}
          不管输入多长，输出永远是 64 个十六进制字符（256 位）。
        </span>
      </p>
    </div>
  );
}

type Block = { i: number; data: string; prev: string; hash: string; changed: boolean; brokenLink: boolean };

// Slide 33: each block keeps the previous block's hash; editing an old block breaks every link after it.
export function ChainLab() {
  const [sealed, setSealed] = useState(() => sealChain(CHAIN_DATA));
  const [datas, setDatas] = useState<string[]>(CHAIN_DATA);
  const blocks: Block[] = chainCheck(datas, sealed);
  const anyBad = blocks.some((b) => b.changed || b.brokenLink);
  const short = (h: string) => `${h.slice(0, 10)}…`;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 改一笔旧交易，看哈希链怎么断
        </span>
      </div>
      <p className="mt-2 text-[13px] text-fg-2">每个 block 的哈希 = SHA-256(Prev Hash + 交易)。试着改第 1 块的金额。</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {blocks.map((b) => (
          <div
            key={b.i}
            className="rounded-lg border p-2 text-[12px]"
            style={{ borderColor: b.changed || b.brokenLink ? "var(--c-exam)" : "var(--c-tip)" }}
          >
            <div className="font-semibold">Block {b.i + 1}</div>
            <div className="mt-1 font-mono">Prev: {short(b.prev)}</div>
            <input
              value={b.data}
              onChange={(e) => setDatas(datas.map((d, j) => (j === b.i ? e.target.value : d)))}
              className="lab-select mt-1 w-full px-1 py-0.5 text-[12px]"
            />
            <div className="mt-1 font-mono">Hash: {short(b.hash)}</div>
            <div className="mt-1" style={{ color: b.changed || b.brokenLink ? "var(--c-exam)" : "var(--c-tip)" }}>
              {b.changed ? "✗ 内容被改，哈希变了" : b.brokenLink ? "✗ Prev Hash 对不上前一块" : "✓ 有效"}
            </div>
          </div>
        ))}
      </div>
      <div className="lab-controls">
        <button type="button" className="lab-btn" onClick={() => setDatas(CHAIN_DATA)}>
          恢复原样
        </button>
        <button type="button" className="lab-btn" onClick={() => setSealed(sealChain(datas))}>
          重新计算整条链（攻击者要做的事）
        </button>
      </div>
      <p className={`lab-decision ${anyBad ? "lab-flood" : "lab-forward"}`}>
        <b>{anyBad ? "链断了：从被改的那块开始，后面全部失效" : "整条链有效"}</b>
        <span>
          想让篡改不被发现，攻击者必须把被改的块和它后面的每一块全部重算，还要让网络里大多数节点都接受他这份账本——而每个节点都有完整副本，这在现实中几乎做不到。
        </span>
      </p>
    </div>
  );
}
