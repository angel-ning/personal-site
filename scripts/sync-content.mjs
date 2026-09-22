#!/usr/bin/env node
// Mirror the servable parts of content/ (HTML notes and images) into public/content/
// so they are served as static files. Markdown and metadata are read at build time instead.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "content");
const to = path.join(root, "public", "content");
const skip = new Set([".md", ".json"]);

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
