#!/usr/bin/env node
// Copy a note (Markdown, MDX or standalone HTML) from anywhere on disk into content/.
//
//   npm run add-note -- <source file> <term>/<course>/<type>/<slug> [--week N] [--zh "中文标题"] [--en "English title"]
//
// Markdown / MDX: only images the note actually references are copied, into ./images/,
// and the links are rewritten (including <Figure src="..."> in MDX). HTML: the file is copied as index.html together with
// any local src/href assets it references.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else pos.push(args[i]);
}
const [src, dest] = pos;
if (!src || !dest || dest.split("/").length !== 4) {
  console.error('usage: npm run add-note -- <file.md|file.mdx|file.html> <term>/<course>/<type>/<slug> [--week N] [--zh ".."] [--en ".."]');
  process.exit(1);
}

const srcAbs = path.resolve(src);
const srcDir = path.dirname(srcAbs);
const outDir = path.join(root, "content", dest);
fs.mkdirSync(outDir, { recursive: true });
const ext = path.extname(srcAbs).toLowerCase();
const today = fs.statSync(srcAbs).mtime.toISOString().slice(0, 10);
const isRemote = (u) => /^(https?:|data:|mailto:|#|\/\/)/i.test(u);

function copyAsset(ref) {
  const clean = decodeURI(ref.split(/[?#]/)[0]);
  const from = path.resolve(srcDir, clean);
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) {
    console.warn(`  ! missing asset: ${ref}`);
    return null;
  }
  const name = path.basename(from).replace(/\s+/g, "-");
  fs.mkdirSync(path.join(outDir, "images"), { recursive: true });
  fs.copyFileSync(from, path.join(outDir, "images", name));
  return `images/${name}`;
}

const title = flags.en || flags.zh ? { en: flags.en ?? flags.zh, zh: flags.zh ?? flags.en } : null;

if (ext === ".md" || ext === ".mdx") {
  let md = fs.readFileSync(srcAbs, "utf8");
  let copied = 0;
  md = md.replace(/!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (m, alt, ref, rest) => {
    if (isRemote(ref)) return m;
    const to = copyAsset(ref);
    if (!to) return m;
    copied++;
    return `![${alt}](${to}${rest})`;
  });
  md = md.replace(/<(img|Figure)\b([^>]*?)\bsrc="([^"]+)"/g, (m, tag, pre, ref) => {
    if (isRemote(ref)) return m;
    const to = copyAsset(ref);
    if (!to) return m;
    copied++;
    return `<${tag}${pre}src="${to}"`;
  });
  if (!md.startsWith("---")) {
    const h1 = md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(srcAbs, ext);
    const t = title ?? { en: h1, zh: h1 };
    const fm = [
      "---",
      "title:",
      `  en: ${JSON.stringify(t.en)}`,
      `  zh: ${JSON.stringify(t.zh)}`,
      flags.week ? `week: ${flags.week}` : null,
      `date: ${today}`,
      "---",
      "",
    ].filter((l) => l !== null);
    md = fm.join("\n") + md;
  }
  fs.writeFileSync(path.join(outDir, `index${ext}`), md);
  console.log(`✓ ${dest}/index${ext} (${copied} images)`);
} else if (ext === ".html" || ext === ".htm") {
  let html = fs.readFileSync(srcAbs, "utf8");
  html = html.replace(/(src|href)="([^"]+)"/g, (m, attr, ref) => {
    if (isRemote(ref) || !/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(ref.split(/[?#]/)[0])) return m;
    const to = copyAsset(ref);
    return to ? `${attr}="${to}"` : m;
  });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  const metaPath = path.join(outDir, "meta.json");
  if (!fs.existsSync(metaPath)) {
    const t = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? path.basename(srcAbs, ext);
    const meta = { title: title ?? { en: t, zh: t }, ...(flags.week ? { week: Number(flags.week) } : {}), date: today };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
  }
  console.log(`✓ ${dest}/index.html`);
} else {
  console.error("Only .md, .mdx and .html notes are supported.");
  process.exit(1);
}
