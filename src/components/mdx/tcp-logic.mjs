// Pure TCP / UDP transport-layer logic for <TcpHandshakeLab />, <WindowLab /> and <PortLab />,
// shared with scripts/lib/mdx-core.mjs so the exported Markdown tables use the same rules.

// ---------- 3-way handshake + data transfer (Slides 10, 11, 23) ----------

/**
 * Walk a TCP connection: SYN → SYN-ACK → ACK, then optional data segments from the client.
 * Sequence numbers count bytes; SYN consumes one number, so the first data byte is ISN + 1.
 * `dataSizes` are byte counts of client → server data segments; each is ACKed by the server.
 * @param {{ clientIsn: number, serverIsn: number, clientPort?: number, serverPort?: number, dataSizes?: number[] }} opts
 */
export function tcpConversation({ clientIsn, serverIsn, clientPort = 49152, serverPort = 80, dataSizes = [] }) {
  const c = Number(clientIsn);
  const s = Number(serverIsn);
  const rows = [
    { from: "client", flags: "SYN", seq: c, ack: null, len: 0, sport: clientPort, dport: serverPort, why: `客户端随机选 ISN = ${c}，请求建立连接` },
    { from: "server", flags: "SYN, ACK", seq: s, ack: c + 1, len: 0, sport: serverPort, dport: clientPort, why: `服务器选自己的 ISN = ${s}；ACK = ${c} + 1 = ${c + 1}（SYN 占 1 个序号，下一个想收的是 ${c + 1}）` },
    { from: "client", flags: "ACK", seq: c + 1, ack: s + 1, len: 0, sport: clientPort, dport: serverPort, why: `SEQ = 对方刚才确认的 ${c + 1}；ACK = ${s} + 1 = ${s + 1}。连接建立 (ESTABLISHED)` },
  ];
  let seq = c + 1;
  dataSizes.forEach((n, i) => {
    const len = Number(n);
    rows.push({ from: "client", flags: "ACK, Data", seq, ack: s + 1, len, sport: clientPort, dport: serverPort, why: `第 ${i + 1} 段数据 ${len} bytes：字节编号 ${seq} – ${seq + len - 1}` });
    rows.push({ from: "server", flags: "ACK", seq: s + 1, ack: seq + len, len: 0, sport: serverPort, dport: clientPort, why: `期望型确认：ACK = ${seq} + ${len} = ${seq + len}（「前面都收到了，下一个请发 ${seq + len}」）` });
    seq += len;
  });
  return rows;
}

export const HANDSHAKE_PRESETS = [
  { label: "Slide 11（SEQ 200 / 1450）", clientIsn: 200, serverIsn: 1450, dataSizes: [] },
  { label: "板书 p.3（Percy 10 / G.F. 20）", clientIsn: 10, serverIsn: 20, dataSizes: [100, 50] },
];

// ---------- Sliding window + retransmission timer (Slides 12–14, board p.4) ----------

/**
 * Round-based simulation with per-segment numbering (like Slide 23: "I sent #10 … now send #11").
 * Each round the sender fills the window [base, base + window − 1]; the receiver keeps
 * out-of-order segments and replies with one expectational ACK = the next segment it still needs.
 * A segment in `lost` is dropped the first time it is sent. If the ACK does not move past it,
 * its timer expires and the next round retransmits it. With `adaptive`, a timeout halves the
 * window (the slide's "transmission rate should be slowed") and a clean round grows it by 1.
 * @param {{ total?: number, window?: number, lost?: number[], adaptive?: boolean, maxWindow?: number }} opts
 */
export function simulateWindow({ total = 8, window = 3, lost = [], adaptive = false, maxWindow = 6 }) {
  const lostOnce = new Set(lost.map(Number));
  const received = new Set();
  let base = 1;
  let next = 1;
  let win = Math.max(1, Number(window));
  let retransmit = null;
  const rounds = [];

  while (base <= total && rounds.length < 40) {
    const winStart = base;
    const winAtStart = win;
    const sent = [];
    if (retransmit != null) {
      const ok = !received.has(retransmit);
      if (ok) received.add(retransmit);
      sent.push({ n: retransmit, retx: true, arrived: true });
    }
    while (next <= total && next < base + win) {
      const drop = lostOnce.has(next);
      if (drop) lostOnce.delete(next);
      else received.add(next);
      sent.push({ n: next, retx: false, arrived: !drop });
      next++;
    }
    let ack = base;
    while (received.has(ack)) ack++;
    const timeout = ack <= total && ack < next && sent.some((x) => x.n === ack && !x.arrived);
    base = ack;
    retransmit = timeout ? ack : null;
    if (adaptive) win = timeout ? Math.max(1, Math.floor(win / 2)) : Math.min(maxWindow, win + 1);
    rounds.push({ winStart, window: winAtStart, sent, ack, timeout, nextWindow: win });
  }
  return rounds;
}

export const WINDOW_PRESETS = [
  { label: "没有丢包，窗口 3", total: 8, window: 3, lost: [] },
  { label: "窗口 1（停等）", total: 4, window: 1, lost: [] },
  { label: "第 4 段丢失，窗口 3", total: 8, window: 3, lost: [4] },
];

// ---------- Port numbers (Slides 15–22) ----------

export const WELL_KNOWN = [
  { port: 20, proto: "TCP", app: "FTP data" },
  { port: 21, proto: "TCP", app: "FTP control" },
  { port: 22, proto: "TCP", app: "SSH（课外）" },
  { port: 23, proto: "TCP", app: "Telnet" },
  { port: 25, proto: "TCP", app: "SMTP（发邮件）" },
  { port: 53, proto: "TCP, UDP", app: "DNS" },
  { port: 67, proto: "UDP", app: "DHCP server（Module 2）" },
  { port: 68, proto: "UDP", app: "DHCP client（Module 2）" },
  { port: 69, proto: "UDP", app: "TFTP (Trivial FTP)" },
  { port: 80, proto: "TCP", app: "HTTP (WWW)" },
  { port: 110, proto: "TCP", app: "POP3（收邮件）" },
  { port: 161, proto: "UDP", app: "SNMP（网管）" },
  { port: 443, proto: "TCP", app: "HTTPS（课外）" },
];

/** Which IANA range a port falls in, and who normally uses it. */
export function classifyPort(value) {
  const p = Number(value);
  if (!Number.isInteger(p) || p < 0 || p > 65535) return null;
  const known = WELL_KNOWN.find((w) => w.port === p) ?? null;
  if (p <= 1023)
    return { port: p, range: "well-known", label: "Well-known port（0 – 1023）", who: "服务器 (server) 固定使用；由 IANA 管理，客户端事先就知道", known };
  if (p <= 49151)
    return { port: p, range: "registered", label: "Registered port（1024 – 49151）", who: "用户自己安装的应用；没被服务器占用时，也可以被客户端临时拿来当源端口", known };
  return { port: p, range: "dynamic", label: "Dynamic / private port（49152 – 65535）", who: "动态分配给客户端应用，每个连接一个，用完就释放", known };
}

export const PORT_PRESETS = [21, 53, 80, 161, 3389, 49152, 65535];

/**
 * Board p.5: one client (IP-1 / MAC-1) opens connections to servers on the same LAN.
 * Every new client connection takes the next free dynamic port starting at 49152;
 * the server side always uses its well-known port. Replies swap every (S, D) pair.
 */
export const SERVERS = [
  { id: "UST", name: "UST web server", ip: "IP-2", mac: "MAC-2", port: 80, proto: "TCP" },
  { id: "FB", name: "FB web server", ip: "IP-3", mac: "MAC-3", port: 80, proto: "TCP" },
];
export const CLIENT = { ip: "IP-1", mac: "MAC-1" };

export function openConnections(serverIds, firstPort = 49152) {
  return serverIds.map((id, i) => {
    const sv = SERVERS.find((x) => x.id === id);
    const cport = firstPort + i;
    return {
      n: i + 1,
      server: sv,
      cport,
      request: { ip: [CLIENT.ip, sv.ip], mac: [CLIENT.mac, sv.mac], port: [cport, sv.port] },
      reply: { ip: [sv.ip, CLIENT.ip], mac: [sv.mac, CLIENT.mac], port: [sv.port, cport] },
    };
  });
}

/** Demultiplexing at the client: which open connection (browser window) gets a segment with this destination port? */
export function demux(conns, dport) {
  return conns.find((c) => c.cport === Number(dport)) ?? null;
}

// ---------- TCP vs UDP (Slides 25–27) ----------

export const APP_TRANSPORT = [
  { app: "HTTP / Web", t: "TCP", why: "网页必须完整、有序，丢一块就错" },
  { app: "FTP 传文件", t: "TCP", why: "文件差一个字节都不行" },
  { app: "SMTP 邮件", t: "TCP", why: "邮件内容必须完整" },
  { app: "Telnet 远程登录", t: "TCP", why: "每个按键都不能丢、不能乱序" },
  { app: "DNS 查询", t: "UDP", why: "一问一答、很小，丢了重问一次比握手更快（区域传送等大数据用 TCP 53）" },
  { app: "DHCP", t: "UDP", why: "客户端还没有 IP，没法建立 TCP 连接，只能广播" },
  { app: "SNMP 网管", t: "UDP", why: "频繁的小查询，开销要低" },
  { app: "TFTP", t: "UDP", why: "Trivial = 简化版 FTP，不要 TCP 的开销" },
  { app: "VoIP 网络电话", t: "UDP", why: "实时：迟到的声音没用，宁可丢也不要重传" },
  { app: "IPTV / 直播", t: "UDP", why: "实时流媒体，要快不要重传" },
];
