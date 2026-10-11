// Pure logic for <VpnModeLab />: what each observer can read under VPN transport mode,
// tunnel mode, and — for contrast — an application proxy (which is not a VPN at all).

const AMY = "203.0.113.7";
const AMY_VPN = "10.8.0.5";
const GW = "198.51.100.1";
const SRV = "198.51.100.20";
const DATA = "GET /payroll/2026-10.xlsx";

export const MODES = {
  transport: {
    label: "Transport mode",
    story: "Amy 在咖啡店，用 transport mode 连公司服务器（课件 p.28：Remote Access to Office）",
    packets: [
      {
        title: "Amy → 公司服务器（端到端，没有中转）",
        layers: [
          { part: "IP header", value: `${AMY} → ${SRV}`, enc: false },
          { part: "Payload", value: DATA, enc: true },
        ],
      },
    ],
    observers: {
      path: {
        label: "咖啡店 Wi-Fi / 运营商",
        sees: [`发送者 ${AMY}（Amy）`, `目的地 ${SRV}——具体是哪一台公司服务器`, "什么时间、传了多少数据"],
        hidden: ["内容（payload 被加密）"],
      },
      server: {
        label: "公司服务器",
        sees: [`发送者 ${AMY}`, `内容：${DATA}（自己解密）`],
        hidden: [],
      },
    },
    sender: `${AMY}（Amy 本人）`,
  },
  tunnel: {
    label: "Tunnel mode",
    story: "同一个请求换成 tunnel mode：整个原始包加密，外面再套一个发往 VPN 网关的新 header",
    packets: [
      {
        title: "互联网上：Amy → VPN 网关",
        layers: [
          { part: "新 IP header", value: `${AMY} → ${GW}（网关）`, enc: false },
          { part: "原 IP header", value: `${AMY_VPN} → ${SRV}`, enc: true },
          { part: "Payload", value: DATA, enc: true },
        ],
      },
      {
        title: "网关之后：拆掉外层、解密，原包原样送进内网",
        layers: [
          { part: "原 IP header", value: `${AMY_VPN} → ${SRV}`, enc: false },
          { part: "Payload", value: DATA, enc: false },
        ],
      },
    ],
    observers: {
      path: {
        label: "咖啡店 Wi-Fi / 运营商",
        sees: [`发送者 ${AMY}（Amy）`, `目的地 ${GW}——只知道她在连公司的 VPN 网关`, "什么时间、传了多少数据"],
        hidden: ["她在访问内网里的哪一台服务器（原 header 被加密）", "内容", `她的 VPN 内网地址 ${AMY_VPN}`],
      },
      inside: {
        label: "公司内网（网关之后）",
        sees: [`${AMY_VPN} → ${SRV}`, `内容：${DATA}`],
        hidden: [],
      },
      server: {
        label: "公司服务器",
        sees: [`发送者 ${AMY_VPN}——就像 Amy 人在公司内网里`, `内容：${DATA}`],
        hidden: [],
      },
    },
    sender: `${AMY_VPN}（Amy，VPN 分配的内网地址）`,
  },
  proxy: {
    label: "对照：Proxy（不是 VPN）",
    story: "Amy 在公司里上网，所有请求都经过公司的 proxy（课件 p.21：websites see the proxy's IP）",
    packets: [
      {
        title: "连接 ①：Amy → Proxy（到这里就结束）",
        layers: [
          { part: "IP header", value: "10.0.0.5 → 10.0.0.1（proxy）", enc: false },
          { part: "Payload", value: "GET http://example.com/report.pdf", enc: false },
        ],
      },
      {
        title: "连接 ②：Proxy 读懂请求后，用自己的身份重新发起",
        layers: [
          { part: "IP header", value: "198.51.100.2（proxy）→ 93.184.216.34", enc: false },
          { part: "Payload", value: "GET http://example.com/report.pdf", enc: false },
        ],
      },
    ],
    observers: {
      path: {
        label: "公司外的互联网",
        sees: ["发送者是 proxy 198.51.100.2", "内容（proxy 本身不加密）"],
        hidden: ["真正发请求的是 Amy（10.0.0.5）"],
      },
      inside: {
        label: "Proxy 自己",
        sees: ["谁（Amy）、访问哪个网址、下载什么文件——它就是要看内容才能过滤"],
        hidden: [],
      },
      server: {
        label: "网站",
        sees: ["发送者 198.51.100.2（proxy）"],
        hidden: ["Amy 的真实 IP"],
      },
    },
    sender: "198.51.100.2（proxy，不是 Amy）",
  },
};

export const MODE_IDS = Object.keys(MODES);

export function vpnView(mode, observer) {
  const m = MODES[mode] ?? MODES.transport;
  const ob = m.observers[observer] ?? m.observers.path;
  return { ...m, observer: ob };
}
