import "server-only";
import fs from "node:fs";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";

export type Heading = { id: string; text: string; depth: 2 | 3 };

const isRelative = (u: string) => !/^(https?:|data:|mailto:|#|\/)/i.test(u);

// Resolve relative image URLs against the note's public folder, lazy-load images,
// wrap tables for horizontal scroll, and drop the leading H1 (the page renders its own title).
export function rehypeNote(opts: { assetBase: string; headings: Heading[] }) {
  return (tree: Root) => {
    const first = tree.children.find((n) => n.type === "element");
    if (first && first.type === "element" && first.tagName === "h1") {
      tree.children.splice(tree.children.indexOf(first), 1);
    }

    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName === "img") {
        const src = String(node.properties.src ?? "");
        if (src && isRelative(src)) node.properties.src = encodeURI(opts.assetBase + src);
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
      }
      if (node.tagName === "a") {
        const href = String(node.properties.href ?? "");
        if (/^https?:/i.test(href)) {
          node.properties.target = "_blank";
          node.properties.rel = ["noopener", "noreferrer"];
        }
      }
      if ((node.tagName === "h2" || node.tagName === "h3") && node.properties.id) {
        opts.headings.push({
          id: String(node.properties.id),
          text: toString(node).trim(),
          depth: node.tagName === "h2" ? 2 : 3,
        });
      }
      if (node.tagName === "table" && parent && typeof index === "number") {
        const isInlineHtml = node.properties.style != null; // hand-styled relation diagrams
        parent.children[index] = {
          type: "element",
          tagName: "div",
          properties: { className: [isInlineHtml ? "table-inline" : "table-wrap"] },
          children: [node],
        };
        return SKIP;
      }
    });
  };
}

export async function renderMarkdownFile(file: string, assetBase: string) {
  const { content } = matter(fs.readFileSync(file, "utf8"));
  const headings: Heading[] = [];
  const out = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeNote, { assetBase, headings })
    .use(rehypeStringify)
    .process(content);
  return { html: String(out), headings };
}
