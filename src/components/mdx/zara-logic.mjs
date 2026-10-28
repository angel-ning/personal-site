// Zara (ISOM 5100 week 1): cost of the store IT upgrade (case Exhibit 13, slide 8) and the
// in-store network trade-off (slide 12). Shared by <ZaraCostLab /> and scripts/mdx-to-md.mjs.

export const OS = {
  windows: { label: "Windows", once: 140, annual: 30 },
  unix: { label: "Unix", once: 160, annual: 25 },
  linux: { label: "Linux", once: 0, annual: 80 }, // service contract €10–150; midpoint
};

// Programming hours (Exhibit 13). Features build on each other, so each scope includes the previous ones.
export const SCOPES = [
  { id: "port", label: "只移植到新 OS", hours: 15000 },
  { id: "same", label: "+ 本店库存查询", hours: 18000 },
  { id: "other", label: "+ 他店库存查询", hours: 19000 },
  { id: "transfer", label: "+ 店间调货", hours: 20000 },
];

export const ZARA = {
  terminalCost: 5000,
  router: 180,
  wifiCard: 50,
  internet: 240, // annual, per store
  progDay: 450,
  installDay: 2000,
  installHours: 16,
  wifiHours: 8,
  trainHours: 8,
};

// x = { stores, terminals, os, scope, wireless, perTerminal, support }
//   perTerminal: read the €5,000 terminal and €50 card as per terminal (true) or per store (slide 8 reading)
//   support:     ongoing IT support per store per year — the number the slide calls the swing factor
export function upgradeCost(x) {
  const z = ZARA;
  const os = OS[x.os];
  const units = x.perTerminal ? x.terminals : 1;
  const perStoreHw = units * z.terminalCost + (x.wireless ? z.router + units * z.wifiCard : 0);
  const scope = SCOPES.find((s) => s.id === x.scope);
  const storeHours = z.installHours + (x.wireless ? z.wifiHours : 0) + (x.scope === "port" ? 0 : z.trainHours);
  const lines = [
    { label: "Hardware", calc: `${x.stores} × €${perStoreHw.toLocaleString()}`, once: x.stores * perStoreHw, annual: 0 },
    { label: "OS license", calc: `${x.stores} × ${x.terminals} × €${os.once}`, once: x.stores * x.terminals * os.once, annual: 0 },
    {
      label: "OS 维护 + 网络",
      calc: `${x.stores} × (${x.terminals} × €${os.annual}${x.wireless ? ` + €${z.internet}` : ""})`,
      once: 0,
      annual: x.stores * (x.terminals * os.annual + (x.wireless ? z.internet : 0)),
    },
    { label: "Programming", calc: `${scope.hours.toLocaleString()} h ÷ 8 × €${z.progDay}`, once: (scope.hours / 8) * z.progDay, annual: 0 },
    { label: "Installation / training", calc: `${x.stores} × (${storeHours} h ÷ 8) × €${z.installDay.toLocaleString()}`, once: x.stores * (storeHours / 8) * z.installDay, annual: 0 },
    { label: "IT support（自己假设）", calc: `${x.stores} × €${x.support.toLocaleString()}`, once: 0, annual: x.stores * x.support },
  ];
  const once = lines.reduce((s, l) => s + l.once, 0);
  const annual = lines.reduce((s, l) => s + l.annual, 0);
  return { lines, once, annual };
}

// Slide 12: floppy-disk hassle ≈ 15 min a day per store × wage, against IT support for the network.
export function networkTradeoff({ stores, minutes, wage, support }) {
  const benefit = stores * (minutes / 60) * wage * 360;
  const cost = stores * support;
  return { benefit, cost, net: benefit - cost };
}

export const UPGRADE_PRESETS = [
  {
    id: "slide",
    label: "课件 p.8 的算法",
    note: "550 家店，Windows，移植 + 三个新功能，装无线网络；€5,000 和 €50 按每家店一份算（课件的读法）。不含持续 IT 支持。",
    x: { stores: 550, terminals: 5, os: "windows", scope: "transfer", wireless: true, perTerminal: false, support: 0 },
  },
  {
    id: "perterm",
    label: "硬件按每台终端算",
    note: "Exhibit 13 写的是「平均每家店 5 台终端」，如果 €5,000 和 €50 是每台终端的价格，硬件成本会变成约 5 倍。",
    x: { stores: 550, terminals: 5, os: "windows", scope: "transfer", wireless: true, perTerminal: true, support: 0 },
  },
  {
    id: "support",
    label: "加上 IT 支持（我的假设）",
    note: "假设每家店每年需要 €5,000 的 IT 支持（示意数字，案例没给）。Zara 一天开一家新店，这笔钱会跟着店数一起涨。",
    x: { stores: 550, terminals: 5, os: "windows", scope: "transfer", wireless: true, perTerminal: false, support: 5000 },
  },
];

export const fmtEur = (n) => {
  const s = n < 0 ? "−" : "";
  const a = Math.abs(n);
  return a >= 1e6 ? `${s}€${(a / 1e6).toFixed(2)}M` : `${s}€${Math.round(a / 1000)}K`;
};
