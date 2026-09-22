import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NoteRow } from "@/components/note-row";
import { getCourse, getTerms } from "@/lib/content";
import { getDict, isLang, pick, withLang, type Lang } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string; term: string; course: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  getTerms().flatMap((t) => t.courses.map((c) => ({ term: t.slug, course: c.slug })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, term, course } = await params;
  const c = getCourse(term, course);
  return c ? { title: `${c.code} ${pick(c.title, isLang(lang) ? lang : "en")}` } : {};
}

export default async function CoursePage({ params }: Props) {
  const { lang: l, term: termSlug, course: slug } = await params;
  const lang = (isLang(l) ? l : "en") as Lang;
  const t = getDict(lang);
  const term = getTerms().find((x) => x.slug === termSlug);
  const course = getCourse(termSlug, slug);
  if (!term || !course) notFound();

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <header className="pt-10 pb-10 sm:pt-14 sm:pb-12">
        <Breadcrumbs
          items={[
            { label: t.nav.notes, href: withLang(lang, "/notes/") },
            { label: pick(term.title, lang), href: withLang(lang, term.href) },
            { label: course.code },
          ]}
        />
        <p className="mt-8 font-mono text-[13px] tracking-wide text-fg-3">{course.code}</p>
        <h1 className="mt-2 font-serif text-[38px] leading-[1.08] tracking-[-0.02em] sm:text-[52px]">{pick(course.title, lang)}</h1>
        {course.description && (
          <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.75] text-fg-2">{pick(course.description, lang)}</p>
        )}
        {course.instructor && (
          <p className="mt-4 text-[13.5px] text-fg-3">
            {t.notes.instructor} · <span className="text-fg-2">{course.instructor}</span>
          </p>
        )}
      </header>

      {course.sections.length === 0 && <p className="border-t border-line py-12 text-fg-3">{t.notes.empty}</p>}

      {course.sections.map((s) => (
        <section
          key={s.type}
          id={s.type}
          className="grid scroll-mt-20 gap-4 border-t border-line py-10 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10"
        >
          <h2 className="flex items-baseline gap-2 md:block">
            <span className="kicker">{pick(s.label, lang)}</span>
            <span className="font-mono text-[12px] text-fg-3 md:mt-2 md:block">{s.notes.length}</span>
          </h2>
          <ul className="-my-3 divide-y divide-line/70">
            {s.notes.map((n) => (
              <NoteRow key={n.slug} note={n} lang={lang} />
            ))}
          </ul>
        </section>
      ))}
      <div className="pb-10" />
    </div>
  );
}
