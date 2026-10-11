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

// Slide 36 (Table 10-5, Whitman): brute force needs up to 2^k guesses for a k-bit key.
// The table's times assume one 2020-era desktop CPU doing about 5.85 × 10^11 guesses a second.
export const GUESSES_PER_SECOND = 65536 / 0.000000112;
const YEAR = 365 * 24 * 3600;

function humanTime(sec) {
  if (sec < 1) return `${sec.toPrecision(3)} 秒`;
  if (sec < 3600) return `${(sec / 60).toPrecision(3)} 分钟`;
  if (sec < 86400 * 2) return `${(sec / 3600).toPrecision(3)} 小时`;
  if (sec < YEAR) return `${(sec / 86400).toPrecision(3)} 天`;
  const y = sec / YEAR;
  return y < 1e6 ? `${Math.round(y).toLocaleString("en-US")} 年` : `${y.toExponential(2)} 年`;
}

/** Brute-force effort for a k-bit key: maximum guesses and the max / average time at the table's speed. */
export function keyStrength(bits) {
  const k = Math.max(1, Math.min(1024, Math.floor(bits)));
  const guesses = 2 ** k;
  const max = guesses / GUESSES_PER_SECOND;
  return { k, guesses, guessesText: k <= 64 ? (2n ** BigInt(k)).toLocaleString("en-US") : guesses.toExponential(2), max: humanTime(max), avg: humanTime(max / 2) };
}

export const KEY_STRENGTH_PRESETS = [16, 32, 56, 64, 128, 256];
