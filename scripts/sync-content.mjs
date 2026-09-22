#!/usr/bin/env node
// Mirror the servable parts of content/ (HTML notes and images) into public/content/
// so they are served as static files. Markdown and metadata are read at build time instead.
//
// Also builds a download bundle for every Markdown / MDX note:
//   public/content/<term>/<course>/<type>/<slug>/<course>-<type>-<slug>.zip
// containing the note as plain Markdown plus the images it references.
// (src/lib/content.ts → noteDownload() must produce the same file name.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { zipSync, strToU8 } from "fflate";
import { mdxToMarkdown } from "./lib/mdx-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "content");
const to = path.join(root, "public", "content");
const skip = new Set([".md", ".mdx", ".json"]);

fs.rmSync(to, { recursive: true, force: true });
let n = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs);
    else if (!skip.has(path.extname(e.name).toLowerCase())) {
      const out = path.join(to, path.relative(from, abs));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.copyFileSync(abs, out);
      n++;
    }
  }
})(from);
console.log(`synced ${n} content files → public/content`);

// ---------- download bundles ----------
const isLocal = (u) => !/^(https?:|data:|mailto:|#|\/)/i.test(u);

// Image references in plain Markdown: ![alt](src) and <img src="...">.
function markdownImages(md) {
  const refs = [];
  for (const m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) refs.push(m[1]);
  for (const m of md.matchAll(/<img[^>]*?\ssrc="([^"]+)"/g)) refs.push(m[1]);
  return [...new Set(refs)].filter(isLocal);
}

const pick = (v) => (v && typeof v === "object" ? (v.zh ?? v.en) : v);

async function bundle(noteDir, rel) {
  const [, course, type, slug] = rel.split(path.sep);
  const mdx = path.join(noteDir, "index.mdx");
  const mdFile = path.join(noteDir, "index.md");
  const file = fs.existsSync(mdx) ? mdx : fs.existsSync(mdFile) ? mdFile : null;
  if (!file) return false;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  if (data.draft) return false;
  let md, images, generated;
  if (file === mdx) ({ md, images, generated } = await mdxToMarkdown(content));
  else ({ md, images, generated } = { md: content, images: markdownImages(content), generated: [] });

  // A short header so the file stands on its own once it leaves the site.
  const title = pick(data.title);
  if (title && !/^#\s/m.test(md.slice(0, 400))) md = `# ${title}\n\n${md}`;

  const name = `${course}-${type}-${slug}`;
  const files = { [`${name}/${name}.md`]: strToU8(md.replace(/^\s+/, "")) };
  for (const url of images) {
    if (!isLocal(url)) continue;
    const clean = decodeURI(url.split(/[?#]/)[0]);
    const abs = path.join(noteDir, clean);
    if (fs.existsSync(abs)) files[`${name}/${clean}`] = [fs.readFileSync(abs), { level: 0 }];
    else console.warn(`  ! ${rel}: missing image ${url}`);
  }
  for (const g of generated) files[`${name}/${g.path}`] = strToU8(g.data);

  const outDir = path.join(to, rel);
  fs.mkdirSync(outDir, { recursive: true });
  // PNGs are already compressed, so images are stored (level 0) and only text is deflated.
  fs.writeFileSync(path.join(outDir, `${name}.zip`), zipSync(files, { level: 6 }));
  return true;
}

let b = 0;
for (const term of fs.readdirSync(from, { withFileTypes: true })) {
  if (!term.isDirectory() || term.name.startsWith(".")) continue;
  for (const course of fs.readdirSync(path.join(from, term.name), { withFileTypes: true })) {
    if (!course.isDirectory()) continue;
    for (const type of fs.readdirSync(path.join(from, term.name, course.name), { withFileTypes: true })) {
      if (!type.isDirectory()) continue;
      for (const slug of fs.readdirSync(path.join(from, term.name, course.name, type.name), { withFileTypes: true })) {
        if (!slug.isDirectory() || slug.name.startsWith(".") || slug.name.startsWith("_")) continue;
        const rel = path.join(term.name, course.name, type.name, slug.name);
        if (await bundle(path.join(from, rel), rel)) b++;
      }
    }
  }
}
console.log(`built ${b} note downloads (.zip)`);
