#!/usr/bin/env node
// Turn an MDX note into plain Markdown (conversion rules live in scripts/lib/mdx-core.mjs).
//
//   npm run mdx-to-md -- <note dir | index.mdx> [--out file.md] [--no-frontmatter]
//
// Default output is README.md next to index.mdx, so the note reads well on GitHub.
// With --out elsewhere, referenced images are copied into images/ beside the output.
import fs from "node:fs";
import path from "node:path";
import { mdxToMarkdown } from "./lib/mdx-core.mjs";

const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--no-frontmatter") flags.noFrontmatter = true;
  else if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else pos.push(args[i]);
}
if (!pos[0]) {
  console.error("usage: npm run mdx-to-md -- <note dir | index.mdx> [--out file.md] [--no-frontmatter]");
  process.exit(1);
}
const src = path.resolve(fs.statSync(pos[0]).isDirectory() ? path.join(pos[0], "index.mdx") : pos[0]);
const srcDir = path.dirname(src);
const out = path.resolve(flags.out ?? path.join(srcDir, "README.md"));

const raw = fs.readFileSync(src, "utf8");
const fm = raw.match(/^---\n[\s\S]*?\n---\n/)?.[0] ?? "";
const { md, images, generated } = await mdxToMarkdown(raw.slice(fm.length));

// Generated assets (e.g. diagrams) live next to the note so README.md can reference them.
for (const g of generated) {
  fs.mkdirSync(path.dirname(path.join(srcDir, g.path)), { recursive: true });
  fs.writeFileSync(path.join(srcDir, g.path), g.data);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, flags.noFrontmatter ? md : fm + md);

let copied = 0;
if (path.dirname(out) !== srcDir) {
  for (const url of images) {
    if (/^(https?:|data:|\/)/.test(url)) continue;
    const from = path.join(srcDir, decodeURI(url));
    if (!fs.existsSync(from)) {
      console.warn(`  ! missing image: ${url}`);
      continue;
    }
    const to = path.join(path.dirname(out), url);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied++;
  }
}
console.log(`✓ ${path.relative(process.cwd(), out) || out}${copied ? ` (+${copied} images)` : ""}`);
