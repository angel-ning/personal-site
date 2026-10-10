// SLAAC / DHCPv6 option data for <RaOptionLab />, shared with scripts/mdx-to-md.mjs.
// ISOM 5180 Module 5, Slide 23–27: the router's ICMPv6 Router Advertisement carries one of three options.

export const RA_OPTIONS = [
  {
    id: 1,
    name: "SLAAC only",
    zh: "只用 SLAAC",
    says: "I'm everything you need (Prefix, Prefix-length, Default Gateway)",
    stateful: "Stateless（没有服务器记录谁用了哪个地址）",
    steps: [
      { from: "PC", to: "FF02::2（all-routers）", msg: "① Router Solicitation (RS)", text: "我刚上线，需要地址信息" },
      { from: "R1 的 link-local 地址", to: "FF02::1（all-nodes）", msg: "② Router Advertisement (RA)，Option 1", text: "这是 prefix 和 prefix length，默认网关就是我" },
      { from: "PC 自己", to: "—", msg: "③ 生成 Interface ID", text: "EUI-64（用 MAC）或随机数，拼在 /64 prefix 后面" },
    ],
    source: { prefix: "RA", gateway: "RA（路由器的 link-local 地址）", iid: "主机自己生成（EUI-64 / 随机）", dns: "没有——RA 里不带（课件只讲到这里）" },
  },
  {
    id: 2,
    name: "SLAAC and DHCPv6",
    zh: "SLAAC + 无状态 DHCPv6",
    says: "Here is my information but you need to get other information such as DNS addresses from a DHCPv6 server",
    stateful: "Stateless DHCPv6（地址自己生成，DHCPv6 只给「其他信息」）",
    steps: [
      { from: "PC", to: "FF02::2（all-routers）", msg: "① Router Solicitation (RS)", text: "我需要地址信息" },
      { from: "R1 的 link-local 地址", to: "FF02::1（all-nodes）", msg: "② Router Advertisement (RA)，Option 2", text: "prefix、prefix length、默认网关在这里；其他的去问 DHCPv6 server" },
      { from: "PC 自己", to: "—", msg: "③ 生成 Interface ID", text: "地址仍然用 SLAAC 自己拼出来" },
      { from: "PC", to: "所有 DHCPv6 server", msg: "④ DHCPv6 Solicit", text: "我需要 DNS 等其他信息" },
    ],
    source: { prefix: "RA", gateway: "RA（路由器的 link-local 地址）", iid: "主机自己生成（EUI-64 / 随机）", dns: "DHCPv6 server" },
  },
  {
    id: 3,
    name: "DHCPv6 only",
    zh: "只用有状态 DHCPv6",
    says: "I can't help you. Ask a DHCPv6 server for all your information",
    stateful: "Stateful DHCPv6（服务器分配并记录地址，和 IPv4 DHCP 最像）",
    steps: [
      { from: "PC", to: "FF02::2（all-routers）", msg: "① Router Solicitation (RS)", text: "我需要地址信息" },
      { from: "R1 的 link-local 地址", to: "FF02::1（all-nodes）", msg: "② Router Advertisement (RA)，Option 3", text: "RA 里的信息不要用，全部去问 DHCPv6 server" },
      { from: "PC", to: "所有 DHCPv6 server", msg: "③ DHCPv6 Solicit", text: "请给我全部地址信息" },
    ],
    source: { prefix: "DHCPv6 server", gateway: "DHCPv6 server（课件 Slide 26 的说法）", iid: "DHCPv6 server 分配整个地址", dns: "DHCPv6 server" },
  },
];

export const RA_FIELDS = [
  { key: "prefix", label: "Prefix / prefix length" },
  { key: "gateway", label: "Default gateway" },
  { key: "iid", label: "Interface ID（地址后 64 位）" },
  { key: "dns", label: "DNS server" },
];
