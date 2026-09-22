import "server-only";
import fs from "node:fs";
import matter from "gray-matter";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import { rehypeNote, type Heading } from "./markdown";
import { noteComponents } from "@/components/mdx";

// Compile an MDX note at build time. Markdown syntax goes through the same
// rehype pass as .md notes (image paths, heading ids, table wrappers); JSX tags
// resolve to the components in src/components/mdx.
export async function renderMdxFile(file: string, assetBase: string) {
  const { content } = matter(fs.readFileSync(file, "utf8"));
  const headings: Heading[] = [];
  const { default: Content } = await evaluate(content, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkBreaks],
    rehypePlugins: [rehypeSlug, [rehypeNote, { assetBase, headings }]],
  });
  return { content: <Content components={noteComponents(assetBase)} />, headings };
}
