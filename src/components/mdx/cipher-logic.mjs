// Pure logic for <CipherLab /> and <KeyCountLab /> (ISOM 5280 Lesson 4):
// the slide's Vigenère square (p.6) and Caesar-block transposition (p.7), plus key counts.

const A = "A".charCodeAt(0);
const letters = (s) => s.toUpperCase().replace(/[^A-Z]/g, "");

/** Vigenère: shift each plaintext letter by the matching key letter (A = 0 … Z = 25). Non-letters are dropped, as on the slide. */
export function vigenere(plain, key) {
  const p = letters(plain);
  const k = letters(key);
  if (!p || !k) return { plain: p, keyStream: "", cipher: "", steps: [] };
  const steps = [...p].map((ch, i) => {
    const kc = k[i % k.length];
    const shift = kc.charCodeAt(0) - A;
    const out = String.fromCharCode(((ch.charCodeAt(0) - A + shift) % 26) + A);
    return { p: ch, k: kc, shift, c: out };
  });
  return { plain: p, keyStream: steps.map((s) => s.k).join(""), cipher: steps.map((s) => s.c).join(""), steps };
}

/** Caesar block (p.7): spaces become "_", the text is written down the columns of an n×n square and read across the rows. */
export function transposition(plain, size = 5) {
  const text = plain.toUpperCase().replace(/ /g, "_").replace(/[^A-Z_]/g, "");
  const n = Math.max(2, Math.min(8, size));
  const cap = n * n;
  const used = text.slice(0, cap);
  const grid = Array.from({ length: n }, () => Array(n).fill("_"));
  [...used].forEach((ch, i) => {
    grid[i % n][Math.floor(i / n)] = ch;
  });
  const cipher = grid.map((r) => r.join("")).join("");
  return { text: used, overflow: text.length > cap, grid, cipher, n };
}

export const CIPHER_PRESETS = {
  vigenere: { plain: "SACK GAUL SPARE NO ONE", key: "ITALY", expect: "ATCVEINLDNIKEYMWGE" },
  transposition: { plain: "SACK GAUL SPARE NO ONE", size: 5, expect: "SGS_NAAPNECUAO_KLR____EO_" },
};

/** Keys needed so that every pair among n parties can talk privately. */
export function keyCount(n) {
  const k = Math.max(2, Math.floor(n));
  return { n: k, symmetric: (k * (k - 1)) / 2, asymmetric: 2 * k, pairs: k };
}

export const KEY_COUNT_PRESETS = [2, 5, 10, 100, 1000];
