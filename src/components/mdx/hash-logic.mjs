// Pure logic for <HashLab /> and <ChainLab /> (ISOM 5280 Lesson 4): a plain-JS SHA-256
// (same output as Node's crypto / the browser's SubtleCrypto, but synchronous so the
// static export can run it too), the avalanche comparison, and a three-block hash chain.

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (x, n) => (x >>> n) | (x << (32 - n));

function utf8(str) {
  return Array.from(new TextEncoder().encode(str));
}

/** SHA-256 of a UTF-8 string, as 64 hex characters. */
export function sha256(str) {
  const bytes = utf8(str);
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const hi = Math.floor(bitLen / 0x100000000);
  const lo = bitLen >>> 0;
  for (const v of [hi, lo]) bytes.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);

  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Array(64);
  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) W[t] = (bytes[i + 4 * t] << 24) | (bytes[i + 4 * t + 1] << 16) | (bytes[i + 4 * t + 2] << 8) | bytes[i + 4 * t + 3];
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + W[t]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }
  return H.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
}

/** Compare two inputs' hashes: how many of the 256 bits and 64 hex characters differ. */
export function avalanche(a, b) {
  const ha = sha256(a);
  const hb = sha256(b);
  let bits = 0;
  let hex = 0;
  for (let i = 0; i < 64; i++) {
    if (ha[i] !== hb[i]) hex++;
    let x = parseInt(ha[i], 16) ^ parseInt(hb[i], 16);
    while (x) {
      bits += x & 1;
      x >>= 1;
    }
  }
  return { ha, hb, bits, hex, same: ha === hb };
}

export const HASH_PRESETS = [
  { a: "Pay Bob $100", b: "Pay Bob $900", note: "金额改了一个数字" },
  { a: "Hi Bob!", b: "Hi Bob.", note: "只改了一个标点" },
  { a: "password123", b: "password123", note: "完全一样的输入" },
];

export const GENESIS = "0".repeat(64);

/** Hash a three-field block the same way for the web lab and the export. */
export const blockHash = (b) => sha256(`${b.prev}|${b.data}`);

/**
 * Re-check a chain after edits. `stored` holds the hash each block was sealed with
 * (stored[i + 1] is block i's sealed hash, which block i + 1 keeps as its Prev Hash).
 * A block whose data changed gets a new hash (changed); every later block's Prev Hash
 * then points at a hash that no longer exists (brokenLink).
 */
export function chainCheck(datas, stored) {
  let seenChange = false;
  return datas.map((data, i) => {
    const prev = stored[i];
    const hash = blockHash({ prev, data });
    const changed = hash !== stored[i + 1];
    const brokenLink = seenChange;
    if (changed) seenChange = true;
    return { i, data, prev, hash, sealed: stored[i + 1], changed, brokenLink };
  });
}

/** The prev-hash values a freshly sealed chain would store. */
export function sealChain(datas) {
  const stored = [GENESIS];
  let prev = GENESIS;
  datas.forEach((data) => {
    prev = blockHash({ prev, data });
    stored.push(prev);
  });
  return stored;
}

export const CHAIN_DATA = ["Alice → Bob 10 BTC", "Bob → Carol 4 BTC", "Carol → Dave 1 BTC"];
