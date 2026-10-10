// IPv6 helpers for <Ipv6Lab />, <Eui64Lab /> and <Ipv6SubnetLab />, shared with scripts/mdx-to-md.mjs.
// Follows ISOM 5180 Module 5: Rule 1 (omit leading 0s) and Rule 2 (one "::" for a run of
// all-zero hextets), the unicast / multicast address types, EUI-64 and /48 → /64 subnetting.

const HEX = /^[0-9a-f]{1,4}$/i;
const hex4 = (n) => n.toString(16).toUpperCase().padStart(4, "0");

/** "2001:db8::1/64" → { hextets: [8 numbers], prefix: 64 | null } or { error }. */
export function parseIpv6(text) {
  let s = String(text).trim();
  let prefix = null;
  const slash = s.indexOf("/");
  if (slash >= 0) {
    const p = s.slice(slash + 1);
    if (!/^\d{1,3}$/.test(p) || Number(p) > 128) return { error: "前缀长度要在 0–128 之间" };
    prefix = Number(p);
    s = s.slice(0, slash);
  }
  if (!s) return { error: "请输入一个 IPv6 地址" };
  const dbl = s.split("::");
  if (dbl.length > 2) return { error: "「::」出现了不止一次——地址会有歧义（Slide 7：2001:0DB8::ABCD::1234 是错的）" };
  const side = (part) => (part === "" ? [] : part.split(":"));
  const left = side(dbl[0]);
  const right = dbl.length === 2 ? side(dbl[1]) : [];
  const parts = [...left, ...right];
  const bad = parts.find((p) => !HEX.test(p));
  if (bad !== undefined) return { error: bad === "" ? "多了一个冒号（单个「:」两边都要有数字）" : `「${bad}」不是 1–4 位的十六进制数（只能用 0–9、A–F）` };
  if (dbl.length === 1 && parts.length !== 8) return { error: `没有「::」时必须正好 8 个 hextet，现在有 ${parts.length} 个` };
  if (dbl.length === 2 && parts.length > 7) return { error: "有「::」时最多只能写 7 个 hextet（「::」至少代表一个全 0 的 hextet）" };
  const zeros = 8 - parts.length;
  const hextets = [...left, ...Array(dbl.length === 2 ? zeros : 0).fill("0"), ...right].map((p) => parseInt(p, 16));
  return { hextets, prefix };
}

export const preferred = (h) => h.map(hex4).join(":");
export const omitLeading = (h) => h.map((n) => n.toString(16).toUpperCase()).join(":");

/** Every run of consecutive all-zero hextets: [{ start, len }]. */
export function zeroRuns(h) {
  const runs = [];
  for (let i = 0; i < 8; i++) {
    if (h[i] !== 0) continue;
    let j = i;
    while (j < 8 && h[j] === 0) j++;
    runs.push({ start: i, len: j - i });
    i = j;
  }
  return runs;
}

/** Replace the hextets [start, start + len) with "::" after omitting leading zeros. */
export function compressAt(h, run) {
  const t = h.map((n) => n.toString(16).toUpperCase());
  if (!run) return t.join(":");
  return `${t.slice(0, run.start).join(":")}::${t.slice(run.start + run.len).join(":")}`;
}

/** The compressed form the slides use first: the longest zero run (the first one on a tie). */
export function compress(h) {
  const runs = zeroRuns(h);
  const best = runs.reduce((a, r) => (!a || r.len > a.len ? r : a), null);
  return compressAt(h, best);
}

/** All valid compressed spellings (one per zero run), longest-run choice first. */
export function compressOptions(h) {
  const runs = zeroRuns(h).sort((a, b) => b.len - a.len || a.start - b.start);
  return runs.length ? runs.map((r) => compressAt(h, r)) : [compressAt(h, null)];
}

export const toBig = (h) => h.reduce((acc, n) => (acc << 16n) | BigInt(n), 0n);
export const fromBig = (b) => Array.from({ length: 8 }, (_, i) => Number((b >> BigInt(16 * (7 - i))) & 0xffffn));
const topBits = (h, n) => Number(toBig(h) >> BigInt(128 - n));

export const TYPE_INFO = {
  unspecified: { en: "Unspecified address", zh: "未指定地址", range: "::/128", like: "IPv4 的 0.0.0.0", note: "全 0，只能当源地址——设备还没有正式地址时用（Slide 13）" },
  loopback: { en: "Loopback", zh: "回环地址", range: "::1/128", like: "IPv4 的 127.0.0.1", note: "发给自己，ping ::1 测试本机 TCP/IP；不能配到物理接口上（Slide 13）" },
  "all-nodes": { en: "Assigned multicast · All-nodes", zh: "所有节点组播", range: "FF02::1", like: "IPv4 广播 255.255.255.255", note: "链路上所有 IPv6 设备都会加入，效果等同 IPv4 broadcast（Slide 38）" },
  "all-routers": { en: "Assigned multicast · All-routers", zh: "所有路由器组播", range: "FF02::2", like: "—", note: "所有 IPv6 路由器加入（敲了 ipv6 unicast-routing 之后）；主机发 RS 就发到这里（Slide 38）" },
  "solicited-node": { en: "Solicited-node multicast", zh: "被请求节点组播", range: "FF02::1:FF00:0/104", like: "代替 ARP 广播", note: "由单播地址最右 24 位自动生成，只有最后 24 位相同的设备才会收（Slide 40–41）" },
  multicast: { en: "Multicast", zh: "组播地址", range: "FF00::/8", like: "IPv4 Class D 224.0.0.0/4", note: "发给一组设备；IPv6 没有 broadcast（Slide 37）" },
  "link-local": { en: "Link-local unicast", zh: "链路本地地址", range: "FE80::/10", like: "IPv4 的 169.254.x.x（课外）", note: "每个接口必须有；只在本链路有效，路由器不转发（Slide 15–16）" },
  "unique-local": { en: "Unique local unicast", zh: "唯一本地地址", range: "FC00::/7", like: "IPv4 私有地址 10/172.16/192.168", note: "站点内部用，不在 Internet 上路由（Slide 14）" },
  "ipv4-embedded": { en: "IPv4 embedded", zh: "内嵌 IPv4 地址", range: "::FFFF:0:0/96 等", like: "—", note: "IPv4 → IPv6 过渡用（Slide 14）" },
  global: { en: "Global unicast (GUA)", zh: "全球单播地址", range: "2000::/3", like: "IPv4 公网地址", note: "全球唯一、可以在 Internet 上路由；目前只分配开头 001 的地址（Slide 17–18）" },
  other: { en: "Reserved / not assigned", zh: "保留 / 尚未分配", range: "—", like: "—", note: "不属于课件讲的任何一类（目前只分配 2000::/3 的全球单播）" },
};

export function classify(h) {
  const big = toBig(h);
  if (big === 0n) return "unspecified";
  if (big === 1n) return "loopback";
  if (h[0] >> 8 === 0xff) {
    if (big === toBig([0xff02, 0, 0, 0, 0, 0, 0, 1])) return "all-nodes";
    if (big === toBig([0xff02, 0, 0, 0, 0, 0, 0, 2])) return "all-routers";
    if (h[0] === 0xff02 && h[5] === 1 && h[6] >> 8 === 0xff && h.slice(1, 5).every((n) => n === 0)) return "solicited-node";
    return "multicast";
  }
  if (topBits(h, 10) === 0b1111111010) return "link-local";
  if (topBits(h, 7) === 0b1111110) return "unique-local";
  if (h.slice(0, 5).every((n) => n === 0) && h[5] === 0xffff) return "ipv4-embedded";
  if (topBits(h, 3) === 0b001) return "global";
  return "other";
}

/** FF02::1:FF + the right-most 24 bits of a unicast address. */
export function solicitedNode(h) {
  return [0xff02, 0, 0, 0, 0, 1, 0xff00 | (h[6] & 0xff), h[7]];
}

export const IPV6_PRESETS = [
  "2001:0DB8:0000:1111:0000:0000:0000:0200",
  "2001:0DB8:0000:0000:ABCD:0000:0000:0100",
  "FE80:0000:0000:0000:0123:4567:89AB:CDEF",
  "2001:DB8:ACAD:1::10/64",
  "FD00:AB::1",
  "::1",
  "FF02::1",
  "2001:DB8::ABCD::1234",
];

export function analyzeIpv6(text) {
  const p = parseIpv6(text);
  if (p.error) return p;
  const h = p.hextets;
  const type = classify(h);
  const res = {
    hextets: h,
    prefix: p.prefix,
    preferred: preferred(h),
    omitted: omitLeading(h),
    compressed: compress(h),
    options: compressOptions(h),
    runs: zeroRuns(h),
    type,
    info: TYPE_INFO[type],
    binaryFirst: h[0].toString(2).padStart(16, "0"),
  };
  if (type === "global" || type === "link-local" || type === "unique-local") {
    res.solicited = compress(solicitedNode(h));
  }
  if (type === "global") {
    res.parts = {
      routing: compress([...h.slice(0, 3), 0, 0, 0, 0, 0]) + "/48",
      subnet: hex4(h[3]),
      iid: h.slice(4).map(hex4).join(":"),
    };
  }
  return res;
}

// ---------- EUI-64 (Slide 28–30) ----------

/** Accepts FC:99:47:75:CE:E0, fc-99-47-75-ce-e0, fc99.4775.cee0 or fc994775cee0. */
export function parseMac(text) {
  const s = String(text).trim().replace(/[:.\-\s]/g, "");
  if (!/^[0-9a-f]{12}$/i.test(s)) return null;
  return Array.from({ length: 6 }, (_, i) => parseInt(s.slice(i * 2, i * 2 + 2), 16));
}

const hx2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");
const bin8 = (n) => n.toString(2).padStart(8, "0");

export function eui64(macText, prefixText = "2001:DB8:ACAD:1::") {
  const m = parseMac(macText);
  if (!m) return null;
  const flipped = m[0] ^ 0x02;
  const bytes = [flipped, m[1], m[2], 0xff, 0xfe, m[3], m[4], m[5]];
  const iid = [0, 2, 4, 6].map((i) => (bytes[i] << 8) | bytes[i + 1]);
  const pre = parseIpv6(prefixText);
  const net = pre.error ? null : pre.hextets.slice(0, 4);
  return {
    mac: m.map(hx2).join(":"),
    oui: m.slice(0, 3).map(hx2),
    device: m.slice(3).map(hx2),
    firstBefore: bin8(m[0]),
    firstAfter: bin8(flipped),
    ulWas: (m[0] >> 1) & 1,
    flippedHex: hx2(flipped),
    bytes: bytes.map(hx2),
    iid: iid.map(hex4).join(":"),
    linkLocal: compress([0xfe80, 0, 0, 0, ...iid]),
    global: net ? compress([...net, ...iid]) + "/64" : null,
    globalPrefix: net ? compress([...net, 0, 0, 0, 0]) + "/64" : null,
  };
}

export const EUI_PRESETS = [
  { label: "Slide 29", mac: "FC:99:47:75:CE:E0", prefix: "2001:DB8:ACAD:1::" },
  { label: "Slide 30 · R1 G0/0", mac: "fc99.4775.c3e0", prefix: "2001:DB8:ACAD:1::" },
  { label: "U/L 位本来是 1", mac: "02:00:5E:10:00:01", prefix: "2001:DB8:ACAD:2::" },
];

// ---------- Subnetting (Slide 42–45) ----------

/** Split a /48 (or any) block into /newPrefix subnets; `subnet(i)` and `locate(addr)` like the IPv4 lab. */
export function ipv6SubnetPlan(blockText, newPrefix) {
  const p = parseIpv6(blockText);
  if (p.error) return p;
  const base = p.prefix ?? 48;
  if (newPrefix <= base || newPrefix > 128) return { error: `新前缀要比 /${base} 长` };
  const keep = (b, n) => (n === 0 ? 0n : (b >> BigInt(128 - n)) << BigInt(128 - n));
  const block = keep(toBig(p.hextets), base);
  const bits = newPrefix - base;
  const count = 1n << BigInt(bits);
  const step = 1n << BigInt(128 - newPrefix);
  const subnet = (i) => {
    const net = block + BigInt(i) * step;
    return { i: BigInt(i), id: (BigInt(i)).toString(16).toUpperCase(), network: compress(fromBig(net)) + `/${newPrefix}`, preferred: preferred(fromBig(net)) };
  };
  return {
    block: compress(fromBig(block)) + `/${base}`,
    base,
    newPrefix,
    bits,
    count,
    iidBits: 128 - newPrefix,
    nibble: bits % 4 === 0,
    subnet,
    last: subnet(count - 1n),
    locate(text) {
      const a = parseIpv6(text);
      if (a.error) return null;
      const big = toBig(a.hextets);
      if (keep(big, base) !== block) return { outside: true };
      const net = keep(big, newPrefix);
      return { outside: false, i: (net - block) / step, network: compress(fromBig(net)) + `/${newPrefix}` };
    },
  };
}

export const SUBNET6_PRESETS = [
  { label: "/48 → /64（Slide 43）", block: "2001:DB8:ACAD::/48", prefix: 64, probe: "2001:DB8:ACAD:3::1" },
  { label: "/48 → /68 进 Interface ID（Slide 45）", block: "2001:DB8:ACAD::/48", prefix: 68, probe: "2001:DB8:ACAD:FFFF:F000::9" },
  { label: "/48 → /52", block: "2001:DB8:ACAD::/48", prefix: 52, probe: "2001:DB8:ACAD:A123::1" },
];

export const fmtBig = (n) => n.toLocaleString("en-US");
