// Pure logic for <StatefulLab />: the same packets judged by a stateless packet filter
// (static rules, no memory) and by a stateful inspection firewall (rules + state table).
// Inside host 10.0.0.5 browses a website; an attacker tries to sneak packets in.

export const AMY = "10.0.0.5";
export const WEB = "93.184.216.34";
export const ATTACKER = "198.51.100.66";

export const PACKETS = {
  req: { label: "Amy 访问网站（发出请求）", dir: "out", src: `${AMY}:50000`, dst: `${WEB}:443`, flag: "SYN" },
  reply: { label: "网站回包", dir: "in", src: `${WEB}:443`, dst: `${AMY}:50000`, flag: "ACK" },
  spoof: { label: "攻击者伪造「回包」（源端口写 443）", dir: "in", src: `${ATTACKER}:443`, dst: `${AMY}:50001`, flag: "ACK" },
  ssh: { label: "外部直接连 Amy 的 SSH", dir: "in", src: `${ATTACKER}:51515`, dst: `${AMY}:22`, flag: "SYN" },
  close: { label: "Amy 关闭连接", dir: "out", src: `${AMY}:50000`, dst: `${WEB}:443`, flag: "FIN" },
};

// Order used in the note's walkthrough: the late reply after FIN shows the "closed hole".
export const DEMO = ["req", "reply", "spoof", "ssh", "close", "reply"];

const port = (hp) => Number(hp.split(":")[1]);

// Stateless rule table: outbound HTTPS allowed; to let replies in, every inbound packet
// from port 443 to a high port has to be allowed permanently.
export const STATELESS_RULES = [
  { id: 1, text: "出站：内网 any → 外部 any:443 → Allow" },
  { id: 2, text: "入站：外部 any:443 → 内网 any:>1023 → Allow（为了让回包进来）" },
  { id: 3, text: "其他一律 Deny" },
];

export function statelessDecide(pkt) {
  if (pkt.dir === "out" && port(pkt.dst) === 443) return { allow: true, rule: 1, why: "出站 443，命中第 1 条" };
  if (pkt.dir === "in" && port(pkt.src) === 443 && port(pkt.dst) > 1023)
    return { allow: true, rule: 2, why: "源端口 443、目的端口 > 1023，命中第 2 条——它只看包头，分不清是不是真的回包" };
  return { allow: false, rule: 3, why: "前两条都不匹配，落到 Deny" };
}

const key = (local, remote) => `${local} ↔ ${remote}`;

/** Replay a packet sequence through the stateful firewall; returns one step per packet with the table after it. */
export function runStateful(ids) {
  const table = [];
  return ids.map((id) => {
    const pkt = PACKETS[id];
    let allow;
    let why;
    if (pkt.dir === "out") {
      const k = key(pkt.src, pkt.dst);
      allow = port(pkt.dst) === 443;
      if (pkt.flag === "FIN") {
        const i = table.indexOf(k);
        if (i >= 0) table.splice(i, 1);
        why = i >= 0 ? "出站允许；连接结束，从 state table 删掉这一条" : "出站允许；表里本来就没有这条连接";
      } else if (!table.includes(k)) {
        table.push(k);
        why = "查规则：出站 443 允许 → 放行，并在 state table 登记这条连接";
      } else {
        why = "属于已登记的连接，放行";
      }
    } else {
      const k = key(pkt.dst, pkt.src);
      allow = table.includes(k);
      why = allow ? `state table 里有「${k}」→ 是 Amy 自己发起的连接的回包，放行` : "state table 里没有对应的连接 → 不是任何人请求过的包，丢弃";
    }
    return { id, pkt, stateless: statelessDecide(pkt), stateful: { allow, why }, table: [...table] };
  });
}
