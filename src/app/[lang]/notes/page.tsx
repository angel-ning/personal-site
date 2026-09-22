import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { getTerms } from "@/lib/content";
import { getDict, isLang, pick, withLang, type Lang } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDict(isLang(lang) ? lang : "en").notes.title };
}

export default async function NotesIndex({ params }: Props) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "en") as Lang;
  const t = getDict(lang);
  const terms = getTerms();

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <header className="pt-14 pb-10 sm:pt-20 sm:pb-14">
        <p className="kicker">{t.nav.notes}</p>
        <h1 className="mt-4 font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">{t.notes.title}</h1>
        <p className="mt-5 max-w-[62ch] text-[16.5px] leading-[1.75] text-fg-2">{t.notes.intro}</p>
      </header>

      {terms.length === 0 && <p className="pb-20 text-fg-3">{t.notes.empty}</p>}

      {terms.map((term) => (
        <section key={term.slug} className="border-t border-line pt-8 pb-14">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[20px] font-medium tracking-tight">
              <Link href={withLang(lang, term.href)} className="hover:text-accent">
                {pick(term.title, lang)}
              </Link>
            </h2>
            {term.subtitle && <p className="text-[13.5px] text-fg-3">{pick(term.subtitle, lang)}</p>}
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {term.courses.map((c) => (
              <li key={c.slug}>
                <CourseCard course={c} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
