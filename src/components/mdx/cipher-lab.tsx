"use client";

import { useState } from "react";
import { CIPHER_PRESETS, transposition, vigenere } from "./cipher-logic.mjs";

type Step = { p: string; k: string; shift: number; c: string };

// Try the slide's two classical ciphers: Vigenère (substitution, p.6) and Caesar block (transposition, p.7).
export function CipherLab() {
  const [mode, setMode] = useState<"vigenere" | "transposition">("vigenere");
  const [plain, setPlain] = useState(CIPHER_PRESETS.vigenere.plain);
  const [key, setKey] = useState(CIPHER_PRESETS.vigenere.key);
  const [size, setSize] = useState(5);
  const v = vigenere(plain, key);
  const t = transposition(plain, size);

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 换字母 vs 换位置
        </span>
      </div>
      <div className="lab-controls">
        <button type="button" className={`lab-btn ${mode === "vigenere" ? "lab-btn-on" : ""}`} onClick={() => setMode("vigenere")}>
          Substitution：Vigenère（p.6）
        </button>
        <button type="button" className={`lab-btn ${mode === "transposition" ? "lab-btn-on" : ""}`} onClick={() => setMode("transposition")}>
          Transposition：Caesar block（p.7）
        </button>
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          明文
          <input value={plain} onChange={(e) => setPlain(e.target.value)} className="lab-select w-[16em] px-2 py-1 text-[13px]" />
        </label>
        {mode === "vigenere" ? (
          <label className="flex items-center gap-1.5 text-[13px]">
            密钥
            <input value={key} onChange={(e) => setKey(e.target.value)} className="lab-select w-[8em] px-2 py-1 text-[13px]" />
          </label>
        ) : (
          <label className="flex items-center gap-1.5 text-[13px]">
            方阵边长（密钥）
            <input type="number" min={2} max={8} value={size} onChange={(e) => setSize(Number(e.target.value))} className="lab-select w-[4em] px-2 py-1 text-[13px]" />
          </label>
        )}
      </div>

      {mode === "vigenere" ? (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="lab-table font-mono">
              <tbody>
                <tr>
                  <th>明文</th>
                  {v.steps.map((s: Step, i: number) => (
                    <td key={i}>{s.p}</td>
                  ))}
                </tr>
                <tr>
                  <th>密钥</th>
                  {v.steps.map((s: Step, i: number) => (
                    <td key={i}>{s.k}</td>
                  ))}
                </tr>
                <tr>
                  <th>右移</th>
                  {v.steps.map((s: Step, i: number) => (
                    <td key={i}>{s.shift}</td>
                  ))}
                </tr>
                <tr className="lab-hot">
                  <th>密文</th>
                  {v.steps.map((s: Step, i: number) => (
                    <td key={i}>{s.c}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="lab-decision lab-forward">
            <b>密文：{v.cipher || "（输入明文和密钥）"}</b>
            <span>每个字母按对应的密钥字母右移（A=0、B=1 … Z=25），密钥不够长就重复使用。换的是「字母是什么」，位置不变。</span>
          </p>
        </>
      ) : (
        <>
          <div className="mt-3 inline-grid gap-1 font-mono text-[14px]" style={{ gridTemplateColumns: `repeat(${t.n}, 1.8em)` }}>
            {t.grid.flatMap((row: string[], r: number) =>
              row.map((ch, c) => (
                <span key={`${r}-${c}`} className="rounded border text-center" style={{ borderColor: "var(--line)" }}>
                  {ch}
                </span>
              )),
            )}
          </div>
          <p className="lab-decision lab-forward">
            <b>密文：{t.cipher}</b>
            <span>明文（空格写成 _）一列一列竖着填进 {t.n}×{t.n} 方阵，再一行一行横着读出来。字母本身没变，只换了位置。</span>
          </p>
          {t.overflow && <p className="lab-decision lab-flood"><b>明文太长</b><span>超出方阵的部分没有放进去，把方阵调大一点。</span></p>}
        </>
      )}
    </div>
  );
}

