// Binary quick-reference helpers for <BinaryLab /> and <MaskSizeLab /> (ISOM 5180 final, open book),
// shared with scripts/lib/mdx-core.mjs.
import { parseIp } from "./ip-logic.mjs";

export const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
export const toBits = (n) => Number(n).toString(2).padStart(8, "0");
export const toHex = (n) => Number(n).toString(16).toUpperCase().padStart(2, "0");

/** Read "200", "11001000", "1100 1000" or "0xC8" as one octet (0–255); null if invalid. */
export function readOctet(text) {
  const t = String(text ?? "").trim().replace(/\s+/g, "");
  if (/^0x[0-9a-f]{1,2}$/i.test(t)) return parseInt(t.slice(2), 16);
  if (/^[01]{8}$/.test(t)) return parseInt(t, 2);
  if (/^\d{1,3}$/.test(t) && Number(t) <= 255) return Number(t);
  return null;
}

/** Which weights add up to n (200 → [128, 64, 8]). */
export const decompose = (n) => WEIGHTS.filter((w, i) => toBits(n)[i] === "1");

/** First octet → class, from its leading bits. */
export function classOfFirst(n) {
  if (n < 128) return { cls: "A", lead: "0" };
  if (n < 192) return { cls: "B", lead: "10" };
  if (n < 224) return { cls: "C", lead: "110" };
  if (n < 240) return { cls: "D", lead: "1110" };
  return { cls: "E", lead: "1111" };
}

/** If n is a valid mask octet (1s then 0s): how many 1s and the block size 256 − n. */
export function maskOctetInfo(n) {
  const b = toBits(n);
  if (!/^1*0*$/.test(b)) return null;
  const ones = b.indexOf("0") === -1 ? 8 : b.indexOf("0");
  return { ones, block: 256 - n };
}

/** "255.255.255.224", "/27" or "27" → prefix length; null if not a contiguous mask. */
export function readMask(text) {
  const t = String(text ?? "").trim();
  const m = t.match(/^\/?(\d{1,2})$/);
  if (m) return Number(m[1]) <= 32 ? Number(m[1]) : null;
  const o = parseIp(t);
  if (!o) return null;
  const bits = o.map(toBits).join("");
  if (!/^1*0*$/.test(bits)) return null;
  return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
}

export const maskOctets = (prefix) => [0, 1, 2, 3].map((i) => {
  const ones = Math.max(0, Math.min(8, prefix - i * 8));
  return ones === 0 ? 0 : 256 - 2 ** (8 - ones);
});

/** Address AND mask, octet by octet, plus the broadcast (host bits set to 1). */
export function andTable(ipText, maskText) {
  const ip = parseIp(ipText);
  const prefix = readMask(maskText);
  if (!ip || prefix == null) return null;
  const mask = maskOctets(prefix);
  const net = ip.map((o, i) => o & mask[i]);
  const bc = net.map((o, i) => o | (255 - mask[i]));
  // the "interesting" octet: the one holding the mask's last 1 bit (/27 → 4th, /24 → 3rd, /20 → 3rd)
  const focus = Math.max(0, Math.ceil(prefix / 8) - 1);
  return { ip, mask, prefix, net, bc, focus };
}

export const BINARY_PRESETS = ["200", "172", "135", "224", "11000000", "0xC8"];
export const AND_PRESETS = [
  { ip: "192.168.10.65", mask: "255.255.255.224", note: "Slide 26" },
  { ip: "192.5.12.135", mask: "255.255.255.224", note: "SubnetQuestions Q4" },
  { ip: "172.16.2.120", mask: "255.255.255.0", note: "Slide 27" },
  { ip: "10.1.77.200", mask: "255.255.240.0", note: "第 4 周自测题" },
  { ip: "135.20.37.9", mask: "/23", note: "预测卷 B6" },
];
