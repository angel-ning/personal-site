// Pure switching logic for <SwitchLab />, shared with scripts/mdx-to-md.mjs so the
// exported Markdown table is computed by the same rules the web demo runs.

export const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fmtMin = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

/** Drop entries that have not been refreshed within `agingMinutes`. */
export function age(table, now, agingMinutes) {
  return table.filter((e) => now - e.time < agingMinutes);
}

/**
 * One frame arrives at the switch.
 * table: [{ mac, port, time }]  (time in minutes)
 * returns { table, learned: "new" | "refresh", decision: "flood" | "forward" | "filter", outPorts, inPort }
 */
export function switchFrame(lab, table, srcId, dstId, now) {
  const host = (id) => lab.hosts.find((h) => h.id === id);
  const src = host(srcId);
  const dst = host(dstId);
  const inPort = src.port;

  const existing = table.find((e) => e.mac === src.mac);
  const learned = existing ? "refresh" : "new";
  const next = existing
    ? table.map((e) => (e.mac === src.mac ? { ...e, port: inPort, time: now } : e))
    : [...table, { mac: src.mac, port: inPort, time: now }];

  const hit = next.find((e) => e.mac === dst.mac);
  let decision, outPorts;
  if (!hit) {
    decision = "flood";
    outPorts = lab.ports.filter((p) => p !== inPort);
  } else if (hit.port === inPort) {
    decision = "filter";
    outPorts = [];
  } else {
    decision = "forward";
    outPorts = [hit.port];
  }
  return { table: next, learned, decision, outPorts, inPort };
}
