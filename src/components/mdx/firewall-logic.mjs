// Pure evaluator for <FirewallRuleLab />: replays the note's own static packet-filtering
// rule table (p.18) top-down, first match wins — same logic a real stateless firewall runs.

function matchAddr(pattern, ip) {
  if (pattern === "any") return true;
  if (pattern === "10.10.10.x") return ip.startsWith("10.10.10.");
  return pattern === ip;
}

function matchPort(pattern, port) {
  if (pattern === "any") return true;
  if (pattern === ">1023") return port > 1023;
  return Number(pattern) === port;
}

/** Evaluate a packet {srcIp, dstIp, dstPort} against the rule table; first match wins. */
export function evaluate(rules, packet) {
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (matchAddr(r.src, packet.srcIp) && matchAddr(r.dst, packet.dstIp) && matchPort(r.dstPort, packet.dstPort)) {
      return { index: i, rule: r };
    }
  }
  return null;
}

export const PRESETS = [
  { label: "外部 → 内网高位端口（回包）", srcIp: "203.0.113.5", dstIp: "10.10.10.55", dstPort: 51234 },
  { label: "外部直连防火墙本机", srcIp: "203.0.113.5", dstIp: "10.10.10.1", dstPort: 22 },
  { label: "内网主机访问外网", srcIp: "10.10.10.20", dstIp: "8.8.8.8", dstPort: 443 },
  { label: "外部发邮件到 SMTP 服务器", srcIp: "203.0.113.5", dstIp: "10.10.10.6", dstPort: 25 },
  { label: "外部用 POP3 连邮件服务器", srcIp: "203.0.113.5", dstIp: "10.10.10.6", dstPort: 110 },
  { label: "外部 ping 内网主机", srcIp: "203.0.113.5", dstIp: "10.10.10.20", dstPort: 7 },
  { label: "内网之间 Telnet", srcIp: "10.10.10.30", dstIp: "10.10.10.40", dstPort: 23 },
  { label: "外部对内网发起 Telnet", srcIp: "203.0.113.5", dstIp: "10.10.10.30", dstPort: 23 },
  { label: "外部访问 DMZ 的 Web 服务器", srcIp: "203.0.113.5", dstIp: "10.10.10.4", dstPort: 80 },
  { label: "DMZ 代理服务器访问内网", srcIp: "10.10.10.4", dstIp: "10.10.10.8", dstPort: 80 },
  { label: "外部试图直连内网（绕过 DMZ）", srcIp: "203.0.113.5", dstIp: "10.10.10.8", dstPort: 80 },
];
