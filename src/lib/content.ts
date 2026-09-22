import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type { L10n } from "./i18n";

// content/<term>/<course>/<type>/<slug>/index.{md,mdx,html}
//   term.json   → { title, subtitle?, order? }
//   course.json → { code, title, instructor?, description? }
//   notes carry metadata as Markdown/MDX frontmatter, or meta.json next to index.html.

const CONTENT_DIR = path.join(process.cwd(), "content");

// Known section types, in display order. Any other folder name still works.
const SECTION_ORDER = ["lectures", "labs", "tutorials", "assignments", "readings", "projects", "exams"];
const SECTION_LABELS: Record<string, L10n> = {
  lectures: { en: "Lectures", zh: "课堂笔记" },
  labs: { en: "Labs", zh: "实验" },
  tutorials: { en: "Tutorials", zh: "习题课" },
  assignments: { en: "Assignments", zh: "作业" },
  readings: { en: "Readings", zh: "阅读" },
  projects: { en: "Projects", zh: "项目" },
  exams: { en: "Exam Prep", zh: "考试复习" },
};

export type Note = {
  term: string;
  course: string;
  type: string;
  slug: string;
  format: "md" | "mdx" | "html";
  title: L10n;
  summary?: L10n;
  week?: number;
  date?: string;
  tags: string[];
  courseCode: string;
  href: string; // site path without the /<lang> prefix
};

export type Section = { type: string; label: L10n; notes: Note[] };

export type Course = {
  term: string;
  slug: string;
  code: string;
  title: L10n;
  instructor?: string;
  description?: L10n;
  sections: Section[];
  noteCount: number;
  href: string;
};

export type Term = {
  slug: string;
  title: L10n;
  subtitle?: L10n;
  order: number;
  courses: Course[];
  href: string;
};

const l10n = (v: unknown, fallback: string): L10n => {
  if (typeof v === "string") return { en: v, zh: v };
  if (v && typeof v === "object") {
    const o = v as Partial<L10n>;
    return { en: o.en ?? o.zh ?? fallback, zh: o.zh ?? o.en ?? fallback };
  }
  return { en: fallback, zh: fallback };
};

const readJson = (file: string): Record<string, unknown> =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};

const dirs = (p: string) =>
  fs.existsSync(p)
    ? fs
        .readdirSync(p, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
        .map((e) => e.name)
    : [];

const titleCase = (s: string) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const toDate = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "string" ? v : undefined;

function readNote(term: string, course: string, courseCode: string, type: string, slug: string): Note | null {
  const dir = path.join(CONTENT_DIR, term, course, type, slug);
  const mdxFile = path.join(dir, "index.mdx");
  const mdFile = path.join(dir, "index.md");
  const htmlFile = path.join(dir, "index.html");
  let format: Note["format"];
  let meta: Record<string, unknown> = readJson(path.join(dir, "meta.json"));
  if (fs.existsSync(mdxFile)) {
    format = "mdx";
    meta = { ...meta, ...matter(fs.readFileSync(mdxFile, "utf8")).data };
  } else if (fs.existsSync(mdFile)) {
    format = "md";
    meta = { ...meta, ...matter(fs.readFileSync(mdFile, "utf8")).data };
  } else if (fs.existsSync(htmlFile)) {
    format = "html";
  } else return null;
  if (meta.draft) return null;

  return {
    term,
    course,
    type,
    slug,
    format,
    title: l10n(meta.title, titleCase(slug)),
    summary: meta.summary ? l10n(meta.summary, "") : undefined,
    week: typeof meta.week === "number" ? meta.week : undefined,
    date: toDate(meta.date),
    tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
    courseCode,
    href: `/notes/${term}/${course}/${type}/${slug}/`,
  };
}

const byWeek = (a: Note, b: Note) =>
  (a.week ?? 999) - (b.week ?? 999) || (a.date ?? "").localeCompare(b.date ?? "") || a.slug.localeCompare(b.slug);

const sectionRank = (t: string) => {
  const i = SECTION_ORDER.indexOf(t);
  return i === -1 ? SECTION_ORDER.length : i;
};

export const getTerms = cache((): Term[] => {
  return dirs(CONTENT_DIR)
    .map((term) => {
      const tMeta = readJson(path.join(CONTENT_DIR, term, "term.json"));
      const courses = dirs(path.join(CONTENT_DIR, term))
        .map((course): Course => {
          const cMeta = readJson(path.join(CONTENT_DIR, term, course, "course.json"));
          const code = (cMeta.code as string) ?? course.toUpperCase();
          const sections = dirs(path.join(CONTENT_DIR, term, course))
            .sort((a, b) => sectionRank(a) - sectionRank(b) || a.localeCompare(b))
            .map((type) => ({
              type,
              label: SECTION_LABELS[type] ?? { en: titleCase(type), zh: titleCase(type) },
              notes: dirs(path.join(CONTENT_DIR, term, course, type))
                .map((slug) => readNote(term, course, code, type, slug))
                .filter((n): n is Note => n !== null)
                .sort(byWeek),
            }))
            .filter((s) => s.notes.length > 0);
          return {
            term,
            slug: course,
            code,
            title: l10n(cMeta.title, code),
            instructor: cMeta.instructor as string | undefined,
            description: cMeta.description ? l10n(cMeta.description, "") : undefined,
            sections,
            noteCount: sections.reduce((n, s) => n + s.notes.length, 0),
            href: `/notes/${term}/${course}/`,
          };
        })
        .sort((a, b) => a.code.localeCompare(b.code));
      return {
        slug: term,
        title: l10n(tMeta.title, titleCase(term)),
        subtitle: tMeta.subtitle ? l10n(tMeta.subtitle, "") : undefined,
        order: typeof tMeta.order === "number" ? tMeta.order : 0,
        courses,
        href: `/notes/${term}/`,
      };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug) || b.order - a.order);
});

export const getTerm = (slug: string) => getTerms().find((t) => t.slug === slug);

export const getCourse = (term: string, course: string) =>
  getTerm(term)?.courses.find((c) => c.slug === course);

export const getAllNotes = (): Note[] =>
  getTerms().flatMap((t) => t.courses.flatMap((c) => c.sections.flatMap((s) => s.notes)));

export const getRecentNotes = (n: number) =>
  [...getAllNotes()].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, n);

export function getNote(term: string, course: string, type: string, slug: string) {
  const c = getCourse(term, course);
  const section = c?.sections.find((s) => s.type === type);
  const idx = section?.notes.findIndex((n) => n.slug === slug) ?? -1;
  if (!c || !section || idx < 0) return null;
  return {
    note: section.notes[idx],
    course: c,
    section,
    prev: section.notes[idx - 1] ?? null,
    next: section.notes[idx + 1] ?? null,
  };
}

export const noteSourcePath = (n: Note) =>
  path.join(CONTENT_DIR, n.term, n.course, n.type, n.slug, `index.${n.format}`);

// Public URL of a file that sync-content copied into public/content.
export const noteAssetBase = (n: Note) => `/content/${n.term}/${n.course}/${n.type}/${n.slug}/`;
