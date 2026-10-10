// "Determining Subnet Mask Size" (ISOM 5180 Module 4, Slide 25) for <MaskSizeLab />, shared with
// scripts/lib/mdx-core.mjs. Two directions:
//   requirements (subnets, hosts) → which prefixes work  (2^s ≥ subnets, 2^h − 2 ≥ hosts)
//   address + mask → Network | Subnet | Host fields → subnet number, subnet address, broadcast
import { parseIp } from "./ip-logic.mjs";
import { subnetPlan, planOptions, classOf } from "./subnet-logic.mjs";
import { readMask, maskOctets, toBits } from "./binary-logic.mjs";

export const CLASS_BITS = { A: 8, B: 16, C: 24 };

/** Every prefix from the class default + 1 to /30 (at least 2 host bits). */
export function prefixRows(cls) {
  const base = CLASS_BITS[cls];
  const rows = [];
  for (let p = base + 1; p <= 30; p++) {
    const s = p - base;
    const h = 32 - p;
    const octet = Math.ceil(p / 8); // the octet that holds the last 1 of the mask
    const m = maskOctets(p);
    rows.push({ prefix: p, mask: m.join("."), borrow: s, subnets: 2 ** s, hostBits: h, hosts: 2 ** h - 2, octet, block: 256 - m[octet - 1] });
  }
  return rows;
}

/** Which rows satisfy the requirements; min = fewest bits that give enough subnets, max = most bits that still leave enough hosts. */
export function fitRequirements(cls, subnets, hosts) {
  const p = planOptions(cls, Math.max(1, Number(subnets) || 1), Math.max(1, Number(hosts) || 1));
  const base = CLASS_BITS[cls];
  return {
    total: p.total,
    minBorrow: p.minBorrow,
    minHostBits: p.minHostBits,
    maxBorrow: p.maxBorrow,
    feasible: p.feasible,
    minPrefix: base + p.minBorrow,
    maxPrefix: base + p.maxBorrow,
  };
}

/**
 * Split an address with a mask into Network | Subnet | Host fields (Slide 25) and locate its subnet.
 * Returns null for an invalid address / mask, a non A–C class, or a mask shorter than the class default.
 */
export function fieldSplit(ipText, maskText) {
  const o = parseIp(ipText);
  const prefix = readMask(maskText);
  if (!o || prefix == null) return null;
  const cls = classOf(o);
  if (!cls) return null;
  const base = CLASS_BITS[cls];
  if (prefix < base || prefix > 30) return { error: prefix < base ? `/${prefix} 比 Class ${cls} 的默认 /${base} 还短，不是「借位」的子网掩码` : "/31、/32 没有可用主机" };
  const borrow = prefix - base;
  const plan = subnetPlan(ipText, borrow);
  const hit = plan.locate(ipText);
  const bits = o.map(toBits).join("");
  const roles = [...bits].map((_, i) => (i < base ? "N" : i < prefix ? "S" : "H"));
  return {
    cls,
    base,
    prefix,
    borrow,
    hostBits: 32 - prefix,
    subnets: 2 ** borrow,
    hosts: 2 ** (32 - prefix) - 2,
    mask: plan.mask.dotted,
    defaultMask: plan.defaultMask.dotted,
    block: plan.step,
    bits,
    roles,
    subnetBits: bits.slice(base, prefix),
    subnetNumber: hit.i,
    network: hit.network,
    broadcast: hit.broadcast,
    first: hit.first,
    last: hit.last,
    role: hit.role,
  };
}

export const NEED_PRESETS = [
  { label: "SubnetQuestions Q1：200.1.1.0，7 个网络，主机最多", cls: "C", subnets: 7, hosts: 2, pick: "min" },
  { label: "Q2：172.16.0.0，100 个子网 × 200 台", cls: "B", subnets: 100, hosts: 200, pick: "any" },
  { label: "Q3：178.13.0.0，79 个子网，最大 220 台", cls: "B", subnets: 79, hosts: 220, pick: "any" },
  { label: "Slide 23 #2：5 个子网 × 15 台", cls: "C", subnets: 5, hosts: 15, pick: "any" },
  { label: "预测卷 B6：135.20.0.0，90 个子网，最大 500 台", cls: "B", subnets: 90, hosts: 500, pick: "any" },
  { label: "做不到的例子：9 个子网 × 26 台（Class C）", cls: "C", subnets: 9, hosts: 26, pick: "any" },
];

export const SPLIT_PRESETS = [
  { ip: "197.15.22.131", mask: "255.255.255.224", note: "Slide 25" },
  { ip: "192.5.12.135", mask: "255.255.255.224", note: "SubnetQuestions Q4" },
  { ip: "172.16.2.120", mask: "255.255.255.0", note: "Slide 27" },
  { ip: "130.12.108.5", mask: "255.255.252.0", note: "M4 板书 p.1 ③" },
  { ip: "130.12.5.130", mask: "255.255.255.192", note: "M4 板书 p.1 ④" },
  { ip: "10.1.77.200", mask: "255.255.240.0", note: "Class A /20" },
];
