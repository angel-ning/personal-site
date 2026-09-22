import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { Toc } from "@/components/toc";
import { NoteBar } from "@/components/note-bar";
import { HtmlNoteFrame } from "@/components/html-note-frame";
import { getAllNotes, getNote, getTerm, noteAssetBase, noteDownload, noteSourcePath, type Note } from "@/lib/content";
import { renderMarkdownFile } from "@/lib/markdown";
import { renderMdxFile } from "@/lib/mdx";
import { formatDate, getDict, isLang, pick, weekLabel, withLang, type Lang } from "@/lib/i18n";

type Params = { lang: string; term: string; course: string; type: string; slug: string };
type Props = { params: Promise<Params> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  getAllNotes().map((n) => ({ term: n.term, course: n.course, type: n.type, slug: n.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, term, course, type, slug } = await params;
  const found = getNote(term, course, type, slug);
  if (!found) return {};
  const l = isLang(lang) ? lang : "en";
  return { title: `${pick(found.note.title, l)} · ${found.course.code}` };
}

function PrevNext({ prev, next, lang }: { prev: Note | null; next: Note | null; lang: Lang }) {
  const t = getDict(lang);
  if (!prev && !next) return null;
  const card = "group flex flex-col gap-1 rounded-xl border border-line p-4 transition-colors hover:border-line-strong hover:bg-subtle/60";
  return (
    <nav className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
      {prev ? (
        <Link href={withLang(lang, prev.href)} className={card}>
          <span className="flex items-center gap-1 text-[12px] text-fg-3">
            <ArrowLeft size={13} /> {t.notes.prev}
          </span>
          <span className="text-[15px] group-hover:text-accent">{pick(prev.title, lang)}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={withLang(lang, next.href)} className={`${card} sm:items-end sm:text-right`}>
          <span className="flex items-center gap-1 text-[12px] text-fg-3">
            {t.notes.next} <ArrowRight size={13} />
          </span>
          <span className="text-[15px] group-hover:text-accent">{pick(next.title, lang)}</span>
        </Link>
      )}
    </nav>
  );
}

export default async function NotePage({ params }: Props) {
  const { lang: l, term: termSlug, course, type, slug } = await params;
  const lang = (isLang(l) ? l : "en") as Lang;
  const t = getDict(lang);
  const found = getNote(termSlug, course, type, slug);
  const term = getTerm(termSlug);
  if (!found || !term) notFound();
  const { note, section, prev, next } = found;

  const crumbs: Crumb[] = [
    { label: t.nav.notes, href: withLang(lang, "/notes/") },
    { label: pick(term.title, lang), href: withLang(lang, term.href) },
    { label: found.course.code, href: withLang(lang, found.course.href) },
    { label: pick(section.label, lang), href: withLang(lang, `${found.course.href}#${section.type}`) },
  ];
  const meta = [note.week != null ? weekLabel(note.week, lang) : null, note.date ? `${t.notes.updated} ${formatDate(note.date, lang)}` : null]
    .filter(Boolean)
    .join("  ·  ");

  // ---------- standalone HTML note: full-height reader under the site header ----------
  if (note.format === "html") {
    const src = `${noteAssetBase(note)}index.html`;
    const iconBtn = "inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-subtle hover:text-fg";
    return (
      <div className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col bg-bg">
        <div className="border-b border-line">
          <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <div className="min-w-0">
              <Breadcrumbs items={crumbs} className="hidden sm:block" />
              <h1 className="truncate text-[14px] font-medium sm:mt-0.5">{pick(note.title, lang)}</h1>
            </div>
            <div className="flex shrink-0 items-center">
              {prev && (
                <Link href={withLang(lang, prev.href)} className={iconBtn} title={`${t.notes.prev}: ${pick(prev.title, lang)}`}>
                  <ArrowLeft size={16} />
                </Link>
              )}
              {next && (
                <Link href={withLang(lang, next.href)} className={iconBtn} title={`${t.notes.next}: ${pick(next.title, lang)}`}>
                  <ArrowRight size={16} />
                </Link>
              )}
              <a href={src} target="_blank" rel="noopener" className={iconBtn} title={t.notes.openRaw}>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <HtmlNoteFrame src={src} title={pick(note.title, lang)} />
        </div>
      </div>
    );
  }

  // ---------- Markdown / MDX note ----------
  const rendered =
    note.format === "mdx"
      ? await renderMdxFile(noteSourcePath(note), noteAssetBase(note))
      : await renderMarkdownFile(noteSourcePath(note), noteAssetBase(note));
  const { headings } = rendered;

  return (
    <>
      <NoteBar
        crumbs={[...crumbs, { label: pick(note.title, lang) }]}
        headings={headings}
        labels={{
          onThisPage: t.notes.onThisPage,
          top: t.notes.backToTop,
          export: { export: t.notes.export, md: t.notes.exportMd, mdHint: t.notes.exportMdHint, pdf: t.notes.exportPdf, pdfHint: t.notes.exportPdfHint },
        }}
        download={{ href: noteDownload(note), fileName: `${found.course.code.replace(/\s+/g, "")}-${note.slug}.zip` }}
      />
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_220px]">
          <article className="mx-auto w-full max-w-[740px] min-w-0 pt-10 pb-20 sm:pt-14">
            <header className="border-b border-line pb-8">
              <p className="font-mono text-[12.5px] tracking-wide text-fg-3">{found.course.code}</p>
              <h1 className="mt-2 font-serif text-[32px] leading-[1.15] tracking-[-0.015em] sm:text-[42px]">{pick(note.title, lang)}</h1>
              {meta && <p className="mt-4 font-mono text-[12px] whitespace-pre text-fg-3">{meta}</p>}
              {lang === "en" && <p className="mt-2 text-[13px] text-fg-3 italic">{t.notes.contentLangNote}</p>}
            </header>

            {"html" in rendered ? (
              <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: rendered.html }} />
            ) : (
              <div className="prose mt-8">{rendered.content}</div>
            )}
            <div className="no-print">
            <PrevNext prev={prev} next={next} lang={lang} />
          </div>
          </article>

          <aside className="no-print hidden xl:block">
            <div className="sticky top-32 max-h-[calc(100dvh-10rem)] overflow-y-auto pt-14 pb-8">
              <Toc headings={headings} title={t.notes.onThisPage} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
