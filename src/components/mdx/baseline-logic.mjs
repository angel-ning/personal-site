// One synthetic week of hourly traffic for <BaselineLab />, shared with scripts/mdx-to-md.mjs.
// ISOM 5180 Module 6, Slide 5–9: a static "if traffic > threshold" rule versus an AI baseline that
// knows the weekly seasonality (Monday-morning peak) and re-baselines itself after a business change.

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOURS = 168;

// Learned "normal" for an hour of the week (what the model saw in past weeks).
export function seasonal(t) {
  const d = Math.floor(t / 24);
  const h = t % 24;
  if (d >= 5) return h >= 10 && h <= 18 ? 20 : 8;
  if (d === 0 && (h === 9 || h === 10)) return 95; // weekly all-hands / logins: a known business trend
  if (h < 7) return 10;
  if (h <= 8) return 30;
  if (h <= 17) return 60;
  if (h <= 20) return 30;
  return 15;
}

const noise = (t) => ((t * 37 + 11) % 11) - 5;
const isNight = (h) => h <= 6 || h >= 21;

export const SCENARIOS = [
  { id: "night", label: "周二 02:00 有账号在凌晨大量拉数据", kind: "attack", why: "UEBA 例子（Slide 8）：量不算大，但对凌晨 2 点来说极不正常" },
  { id: "shift", label: "周四起改成 24 小时轮班", kind: "benign", why: "业务变化（Slide 5）：夜里流量变多，但这是正常的新常态" },
  { id: "trickle", label: "周五起每小时偷偷外传一点点数据", kind: "attack", why: "Trickle exfiltration（Slide 9 / 18）：每次量很小，混在正常流量里" },
];

const SHIFT_START = 3 * 24; // Thursday 00:00
const ADAPT_AFTER = 6; // hours of consistent new behaviour before the baseline self-corrects

/** Simulate the week. `on` is a Set (or array) of scenario ids. */
export function simulate(on, threshold) {
  const s = new Set(on);
  const points = [];
  let shiftSeen = 0;
  for (let t = 0; t < HOURS; t++) {
    const d = Math.floor(t / 24);
    const h = t % 24;
    let expected = seasonal(t);
    let value = expected + noise(t);
    let attack = null;
    let benignChange = false;
    if (s.has("shift") && t >= SHIFT_START && isNight(h)) {
      value = 50 + noise(t);
      benignChange = true;
      if (shiftSeen >= ADAPT_AFTER) expected = 50;
      shiftSeen++;
    }
    const base = value;
    if (s.has("night") && d === 1 && (h === 2 || h === 3)) {
      value += 45;
      attack = "night";
    }
    if (s.has("trickle") && d >= 4) {
      value += 3;
      attack = "trickle";
    }
    const band = Math.max(12, expected * 0.25);
    const staticAlert = value > threshold;
    const aiAlert = Math.abs(value - expected) > band;
    // An alert only "catches" the attack if it would not have fired without the attack's extra traffic.
    const staticHit = !!attack && staticAlert && !(base > threshold);
    const aiHit = !!attack && aiAlert && !(Math.abs(base - expected) > band);
    points.push({
      t,
      d,
      h,
      value,
      expected,
      band,
      attack,
      benignChange,
      staticAlert,
      aiAlert,
      staticHit,
      aiHit,
    });
  }
  return { points, summary: { static: tally(points, "static", s), ai: tally(points, "ai", s) } };
}

function tally(points, kind, s) {
  const alerts = points.filter((p) => p[`${kind}Alert`]);
  const fp = alerts.filter((p) => !p[`${kind}Hit`]).length;
  const events = SCENARIOS.filter((x) => x.kind === "attack" && s.has(x.id)).map((x) => ({
    id: x.id,
    caught: points.some((p) => p.attack === x.id && p[`${kind}Hit`]),
  }));
  return { alerts: alerts.length, fp, events };
}

export const fmtHour = (t) => `${DAYS[Math.floor(t / 24)]} ${String(t % 24).padStart(2, "0")}:00`;

export const BASELINE_PRESETS = [
  { label: "规则阈值 80", threshold: 80 },
  { label: "为了抓凌晨那次把阈值调到 40", threshold: 40 },
];
