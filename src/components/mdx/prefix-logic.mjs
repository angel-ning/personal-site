// Longest prefix match (ISOM 5190 Lab 2, pp.15–22): compare the destination with each route bit by bit
// for the route's prefix length; every route whose first <prefix> bits agree matches, the longest wins.
// Pure functions shared by prefix-lab.tsx and the README export in scripts/lib/mdx-core.mjs.

import { ipToInt, maskBits } from "./routing-logic.mjs";

export const toBin = (ip) => {
  const n = ipToInt(ip);
  return [24, 16, 8, 0].map((s) => ((n >>> s) & 255).toString(2).padStart(8, "0")).join(".");
};

// Bits 0..31 of an address, without the dots.
const bits = (ip) => toBin(ip).replace(/\./g, "");

export function matchRoute(dest, r) {
  const d = bits(dest);
  const n = bits(r.net);
  let mismatch = null;
  for (let i = 0; i < r.prefix; i++) if (d[i] !== n[i]) { mismatch = i; break; }
  return { hit: mismatch === null, mismatch };
}

export function longestMatch(routes, dest) {
  if (ipToInt(dest) === null) return { ok: false, error: "不是合法的 IPv4 地址" };
  const bad = routes.find((r) => ipToInt(r.net) === null || !(r.prefix >= 0 && r.prefix <= 32));
  if (bad) return { ok: false, error: `路由 ${bad.id} 写得不对` };
  const rows = routes.map((r) => ({ ...r, ...matchRoute(dest, r), netBin: toBin(r.net), hostBits: (ipToInt(r.net) & ~maskBits(r.prefix)) >>> 0 }));
  const hits = rows.filter((r) => r.hit);
  const best = hits.length ? Math.max(...hits.map((r) => r.prefix)) : null;
  return { ok: true, destBin: toBin(dest), rows, winner: hits.find((r) => r.prefix === best)?.id ?? null };
}

export const PREFIX_SETS = {
  lab: {
    label: "Lab p.16–20：去 172.16.0.10",
    routes: [
      { id: "Route 1", net: "172.16.0.0", prefix: 12, out: "Serial2/0" },
      { id: "Route 2", net: "172.16.0.0", prefix: 18, out: "Serial3/0" },
      { id: "Route 3", net: "172.16.0.0", prefix: 26, out: "Serial4/0" },
      { id: "Route 4", net: "172.16.0.0", prefix: 29, out: "Serial2/0" },
    ],
    dests: ["172.16.0.10"],
  },
  exercise: {
    label: "Lab p.22 Exercise：六个地址各走哪条",
    routes: [
      { id: "A", net: "172.17.128.0", prefix: 17 },
      { id: "B", net: "172.17.128.0", prefix: 19 },
      { id: "C", net: "172.17.160.0", prefix: 19 },
      { id: "D", net: "0.0.0.0", prefix: 0, out: "默认路由" },
    ],
    dests: ["172.17.90.83", "172.17.165.91", "172.17.124.36", "172.17.169.20", "172.17.155.116", "172.17.193.140"],
  },
};
