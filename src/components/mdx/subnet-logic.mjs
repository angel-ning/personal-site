// Classful subnetting (ISOM 5180 Module 4) for <SubnetLab /> and <SubnetPlanner />, shared with
// scripts/lib/mdx-core.mjs. Follows the slides: subnet bits are borrowed from the leftmost host
// bits, all 2^n subnets are usable (Slides 16–18 use Net 0 … Net 7), hosts per subnet = 2^h − 2.
import { parseIp, toBin } from "./ip-logic.mjs";

export { parseIp, toBin };

const CLASS_BITS = { A: 8, B: 16, C: 24 };
// Slide 24: at most 22 subnet bits in Class A, 14 in Class B — i.e. leave at least 2 host bits.
export const MAX_BORROW = { A: 22, B: 14, C: 6 };

export function classOf(o) {
  if (o[0] >= 1 && o[0] <= 126) return "A";
  if (o[0] >= 128 && o[0] <= 191) return "B";
  if (o[0] >= 192 && o[0] <= 223) return "C";
  return null;
}

const toInt = (o) => ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
const toOctets = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
export const dotted = (n) => toOctets(n >>> 0).join(".");
const maskInt = (prefix) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);

/** Mask for a prefix length: dotted decimal and binary octets. */
export function maskOf(prefix) {
  const m = maskInt(prefix);
  return { prefix, dotted: dotted(m), binary: toOctets(m).map(toBin) };
}

/**
 * Subnet a classful network by borrowing `borrow` bits.
 * Returns null when the address is not Class A/B/C or `borrow` is out of range.
 * `subnet(i)` lists subnet i; `locate(ip)` finds the subnet an address belongs to (ANDing).
 */
export function subnetPlan(address, borrow) {
  const o = parseIp(address);
  if (!o) return null;
  const cls = classOf(o);
  if (!cls) return null;
  const b = Number(borrow);
  if (!Number.isInteger(b) || b < 0 || b > MAX_BORROW[cls]) return null;
  const netBits = CLASS_BITS[cls];
  const prefix = netBits + b;
  const hostBits = 32 - prefix;
  const base = (toInt(o) & maskInt(netBits)) >>> 0;
  const size = 2 ** hostBits;
  const subnet = (i) => {
    const net = base + i * size;
    return {
      i,
      subnetBits: b ? i.toString(2).padStart(b, "0") : "",
      network: dotted(net),
      first: dotted(net + 1),
      last: dotted(net + size - 2),
      broadcast: dotted(net + size - 1),
    };
  };
  return {
    cls,
    classNetwork: dotted(base),
    netBits,
    borrow: b,
    prefix,
    hostBits,
    mask: maskOf(prefix),
    defaultMask: maskOf(netBits),
    subnets: 2 ** b,
    hostsPerSubnet: size - 2,
    blockSize: size,
    // Which octet changes from one subnet to the next, and by how much (the "magic number").
    step: stepOf(prefix),
    subnet,
    locate(ip) {
      const a = parseIp(ip);
      if (!a || ((toInt(a) & maskInt(netBits)) >>> 0) !== base) return null;
      const ai = toInt(a);
      const net = (ai & maskInt(prefix)) >>> 0;
      const s = subnet((net - base) / size);
      const role = ai === net ? "network" : ai === net + size - 1 ? "broadcast" : "host";
      return { ...s, role, ipBinary: a.map(toBin), netBinary: toOctets(net).map(toBin) };
    },
  };
}

function stepOf(prefix) {
  if (prefix >= 32) return null;
  const octet = Math.floor(prefix / 8) - (prefix % 8 === 0 ? 1 : 0);
  const bitsInOctet = prefix - octet * 8;
  return { octet: octet + 1, value: 2 ** (8 - bitsInOctet) };
}

/**
 * Board / Slide 23 style: which numbers of borrowed bits satisfy both requirements?
 * Needs 2^b ≥ subnets and 2^(hostBits − b) − 2 ≥ hosts.
 */
export function planOptions(cls, subnetsNeeded, hostsNeeded) {
  const total = 32 - CLASS_BITS[cls];
  const s = Math.max(1, Number(subnetsNeeded) || 1);
  const h = Math.max(1, Number(hostsNeeded) || 1);
  let minBorrow = 0;
  while (2 ** minBorrow < s) minBorrow++;
  let minHostBits = 2;
  while (2 ** minHostBits - 2 < h) minHostBits++;
  const rows = [];
  for (let b = Math.max(0, minBorrow - 1); b <= Math.min(MAX_BORROW[cls], minBorrow + 3); b++) {
    const hb = total - b;
    rows.push({ borrow: b, subnets: 2 ** b, hostBits: hb, hosts: 2 ** hb - 2, prefix: CLASS_BITS[cls] + b, okSubnets: 2 ** b >= s, okHosts: 2 ** hb - 2 >= h });
  }
  const maxBorrow = total - minHostBits;
  return { total, minBorrow, minHostBits, maxBorrow, feasible: minBorrow <= maxBorrow, rows };
}

export const SUBNET_PRESETS = [
  { label: "板书 p.2：192.168.10.0 借 3 位", address: "192.168.10.0", borrow: 3, probe: "192.168.10.195" },
  { label: "板书 p.4：192.15.22.0 借 4 位", address: "192.15.22.0", borrow: 4, probe: "192.15.22.36" },
  { label: "板书 p.5：130.12.0.0 借 6 位", address: "130.12.0.0", borrow: 6, probe: "130.12.108.5" },
  { label: "板书 p.6：130.12.0.0 借 10 位", address: "130.12.0.0", borrow: 10, probe: "130.12.5.130" },
  { label: "Slide 25：197.15.22.0 借 3 位", address: "197.15.22.0", borrow: 3, probe: "197.15.22.131" },
];

export const PLAN_PRESETS = [
  { label: "Slide 23 #1", cls: "B", subnets: 200, hosts: 200 },
  { label: "Slide 23 #2", cls: "C", subnets: 5, hosts: 15 },
  { label: "Slide 23 #3", cls: "B", subnets: 12, hosts: 3000 },
  { label: "Slide 23 #4", cls: "B", subnets: 100, hosts: 100 },
  { label: "板书 ① 200.1.1.0", cls: "C", subnets: 7, hosts: 1 },
  { label: "板书 ② 172.16.0.0", cls: "B", subnets: 100, hosts: 200 },
  { label: "板书 ③ 178.13.0.0", cls: "B", subnets: 79, hosts: 220 },
];
