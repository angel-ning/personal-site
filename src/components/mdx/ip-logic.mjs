// Classful IPv4 analysis for <IpAnalyzer />, shared with scripts/mdx-to-md.mjs.
// ISOM 5180 week 2 works with classful addresses only (no subnet masks yet), so the
// network/host split comes from the class alone: A = N.H.H.H, B = N.N.H.H, C = N.N.N.H.

export function parseIp(text) {
  const parts = String(text).trim().split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return octets.every((o) => o >= 0 && o <= 255) ? octets : null;
}

export const IP_PRESETS = ["10.3.4.6", "130.6.8.9", "200.3.9.11", "172.16.1.1", "192.168.1.255", "127.0.0.1", "224.0.0.9"];

export const toBin = (n) => n.toString(2).padStart(8, "0");

const CLASSES = [
  { cls: "A", lead: "0", min: 0, max: 127, netOctets: 1, note: "" },
  { cls: "B", lead: "10", min: 128, max: 191, netOctets: 2, note: "" },
  { cls: "C", lead: "110", min: 192, max: 223, netOctets: 3, note: "" },
  { cls: "D", lead: "1110", min: 224, max: 239, netOctets: 0, note: "Multicast 组播地址，不分 network / host" },
  { cls: "E", lead: "1111", min: 240, max: 255, netOctets: 0, note: "保留给研究 (research) 使用，不分配" },
];

const PRIVATE = [
  { test: (o) => o[0] === 10, range: "10.0.0.0 – 10.255.255.255 (Class A)" },
  { test: (o) => o[0] === 172 && o[1] >= 16 && o[1] <= 31, range: "172.16.0.0 – 172.31.255.255 (Class B)" },
  { test: (o) => o[0] === 192 && o[1] === 168, range: "192.168.0.0 – 192.168.255.255 (Class C)" },
];

/** Returns null for an invalid address. */
export function analyzeIp(text) {
  const o = parseIp(text);
  if (!o) return null;
  const c = CLASSES.find((k) => o[0] >= k.min && o[0] <= k.max);
  const res = { octets: o, binary: o.map(toBin), cls: c.cls, lead: c.lead, netOctets: c.netOctets, note: c.note };
  if (o[0] === 127) res.note = "127.x.x.x 是 loopback（本机回环）地址，用于测试，不能分配给网络";
  if (o[0] === 0) res.note = "0.x.x.x 保留，不能当作普通主机地址";
  const priv = PRIVATE.find((p) => p.test(o));
  res.scope = priv ? "private" : o[0] === 127 ? "loopback" : c.netOctets ? "public" : "special";
  res.privateRange = priv?.range;
  if (o[0] === 0) res.scope = "special";
  // Class D/E, loopback and 0.x.x.x are not ordinary networks: no network/broadcast/host range.
  if (!c.netOctets || o[0] === 127 || o[0] === 0) return res;

  const n = c.netOctets;
  const net = o.map((v, i) => (i < n ? v : 0));
  const bc = o.map((v, i) => (i < n ? v : 255));
  const hostBits = (4 - n) * 8;
  res.pattern = ["N", "N", "N", "N"].map((_, i) => (i < n ? "N" : "H")).join(".");
  res.network = net.join(".");
  res.broadcast = bc.join(".");
  res.firstHost = [...net.slice(0, 3), net[3] + 1].join(".");
  res.lastHost = [...bc.slice(0, 3), bc[3] - 1].join(".");
  res.hostBits = hostBits;
  res.hosts = 2 ** hostBits - 2;
  const isNet = o.join(".") === res.network;
  const isBc = o.join(".") === res.broadcast;
  res.role = isNet ? "network" : isBc ? "broadcast" : "host";
  return res;
}

export const fmtCount = (n) => n.toLocaleString("en-US");
