import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CourseCard } from "@/components/course-card";
import { getTerm, getTerms } from "@/lib/content";
import { getDict, isLang, pick, withLang, type Lang } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string; term: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => getTerms().map((t) => ({ term: t.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, term } = await params;
  const t = getTerm(term);
  return t ? { title: pick(t.title, isLang(lang) ? lang : "en") } : {};
}

export default async function TermPage({ params }: Props) {
  const { lang: l, term: slug } = await params;
  const lang = (isLang(l) ? l : "en") as Lang;
  const t = getDict(lang);
  const term = getTerm(slug);
  if (!term) notFound();

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <header className="pt-10 pb-10 sm:pt-14 sm:pb-12">
        <Breadcrumbs items={[{ label: t.nav.notes, href: withLang(lang, "/notes/") }, { label: pick(term.title, lang) }]} />
        <h1 className="mt-6 font-serif text-[38px] leading-[1.08] tracking-[-0.02em] sm:text-[50px]">{pick(term.title, lang)}</h1>
        {term.subtitle && <p className="mt-3 text-[15px] text-fg-2">{pick(term.subtitle, lang)}</p>}
      </header>
      <ul className="grid gap-4 border-t border-line pt-8 pb-16 md:grid-cols-2">
        {term.courses.map((c) => (
          <li key={c.slug}>
            <CourseCard course={c} lang={lang} />
          </li>
        ))}
      </ul>
    </div>
  );
}
