// ISOM 5260 week 1: tiny relational algebra + buffer pool simulator.
// Shared by <RelAlgebraLab />, <BufferPoolLab /> and scripts/lib/mdx-core.mjs (Markdown export).

// ---------- relational algebra on the lecture's tables (slides p.24–33) ----------
export const ARTIST = {
  name: "Artist",
  cols: ["ArtistID", "ArtistName", "Year", "Country"],
  rows: [
    [101, "Wu-Tang Clan", 1992, "USA"],
    [102, "Warren G", 1990, "USA"],
    [103, "GZA", 1990, "USA"],
  ],
};
export const ALBUM = {
  name: "Album",
  cols: ["AlbumID", "AlbumName", "ReleaseYear"],
  rows: [
    [11, "Enter the Wu-Tang", 1993],
    [22, "St.Ides Mix Tape", 1994],
    [33, "Liquid Swords", 1995],
  ],
};
export const ARTIST_ALBUM = {
  name: "ArtistAlbum",
  cols: ["ArtistID", "AlbumID"],
  rows: [
    [101, 11],
    [101, 22],
    [103, 22],
    [102, 22],
  ],
};

/** σ: keep rows where col == value. */
export function select(rel, col, value) {
  const i = rel.cols.indexOf(col);
  return { ...rel, rows: rel.rows.filter((r) => String(r[i]) === String(value)) };
}

/** Π: keep (and reorder to) the given columns. */
export function project(rel, cols) {
  const idx = cols.map((c) => rel.cols.indexOf(c));
  return { ...rel, cols, rows: rel.rows.map((r) => idx.map((i) => r[i])) };
}

/** Natural join on all shared column names. */
export function join(a, b) {
  const shared = a.cols.filter((c) => b.cols.includes(c));
  const extra = b.cols.filter((c) => !shared.includes(c));
  const rows = [];
  for (const ra of a.rows)
    for (const rb of b.rows)
      if (shared.every((c) => ra[a.cols.indexOf(c)] === rb[b.cols.indexOf(c)]))
        rows.push([...ra, ...extra.map((c) => rb[b.cols.indexOf(c)])]);
  return { name: `${a.name} ⋈ ${b.name}`, cols: [...a.cols, ...extra], rows };
}

/**
 * Build a query from lab settings.
 * s = { joinAlbums: bool, where: "" | "Col=Value", cols: string[] (empty = all) }
 * Returns { expr, result, source, keptRows (indexes into source), keptCols }.
 */
export function runQuery(s) {
  const source = s.joinAlbums ? join(join(ARTIST, ARTIST_ALBUM), ALBUM) : ARTIST;
  let rel = source;
  let expr = s.joinAlbums ? "Artist ⋈ ArtistAlbum ⋈ Album" : "Artist";
  let keptRows = source.rows.map((_, i) => i);
  if (s.where) {
    const [col, val] = s.where.split("=");
    const i = source.cols.indexOf(col);
    keptRows = keptRows.filter((r) => String(source.rows[r][i]) === val);
    rel = select(rel, col, val);
    expr = `σ ${col}=${val} (${expr})`;
  }
  // Π keeps the columns in the order they were asked for (projection can reorder attributes).
  const cols = s.cols?.length ? s.cols.filter((c) => source.cols.includes(c)) : source.cols;
  if (s.cols?.length) {
    rel = project(rel, cols);
    expr = `Π ${cols.join(", ")} (${expr})`;
  }
  return { expr, result: rel, source, keptRows, keptCols: cols };
}

// ---------- buffer pool (slides p.52–55) ----------
export const POOL_FRAMES = 3;
export const DISK_PAGES = [1, 2, 3, 4, 5, 6];

/** state = { frames: [{ page, dirty, used }], clock, writes, reads } */
export const emptyPool = () => ({ frames: [], clock: 0, reads: 0, writes: 0 });

/**
 * Apply one request from the execution engine: { op: "get" | "update" | "flush", page }.
 * Evicts the least recently used frame when full; dirty victims are written back first.
 * Returns { state, steps: [{ layer, text }] } describing what each layer did.
 */
export function poolStep(state, req) {
  const s = { ...state, frames: state.frames.map((f) => ({ ...f })), clock: state.clock + 1 };
  const steps = [];
  if (req.op === "flush") {
    const dirty = s.frames.filter((f) => f.dirty);
    if (!dirty.length) steps.push({ layer: "buffer", text: "没有 dirty page，不需要写回" });
    for (const f of dirty) {
      f.dirty = false;
      s.writes++;
      steps.push({ layer: "disk", text: `把 page ${f.page} 写回磁盘（dirty → clean）` });
    }
    return { state: s, steps };
  }
  const verb = req.op === "update" ? "Update" : "Get";
  steps.push({ layer: "exec", text: `Execution engine：${verb} Page #${req.page}` });
  let frame = s.frames.find((f) => f.page === req.page);
  if (frame) {
    steps.push({ layer: "buffer", text: `命中 (hit)：page ${req.page} 已在 buffer pool，不用读磁盘` });
  } else {
    steps.push({ layer: "buffer", text: `未命中 (miss)：page ${req.page} 不在内存` });
    if (s.frames.length >= POOL_FRAMES) {
      const victim = s.frames.reduce((a, b) => (a.used <= b.used ? a : b));
      if (victim.dirty) {
        s.writes++;
        steps.push({ layer: "disk", text: `frame 满了，要踢出 page ${victim.page}；它是 dirty，先写回磁盘` });
      } else {
        steps.push({ layer: "buffer", text: `frame 满了，踢出最久没用的 page ${victim.page}（clean，直接丢掉）` });
      }
      s.frames = s.frames.filter((f) => f !== victim);
    }
    s.reads++;
    steps.push({ layer: "disk", text: `disk manager 从 database file 读出 page ${req.page}，放进空 frame` });
    frame = { page: req.page, dirty: false, used: s.clock };
    s.frames.push(frame);
  }
  frame.used = s.clock;
  if (req.op === "update") {
    frame.dirty = true;
    steps.push({ layer: "buffer", text: `在内存副本上修改 page ${req.page} → 标记为 dirty（还没写回磁盘）` });
  }
  return { state: s, steps };
}

export const POOL_SCRIPT = [
  { op: "get", page: 2 },
  { op: "update", page: 2 },
  { op: "get", page: 5 },
  { op: "get", page: 1 },
  { op: "get", page: 6 },
  { op: "get", page: 5 },
  { op: "update", page: 5 },
  { op: "flush" },
];
