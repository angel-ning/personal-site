import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Course } from "@/lib/content";
import { pick, withLang, type Lang } from "@/lib/i18n";

export function CourseCard({ course, lang }: { course: Course; lang: Lang }) {
  return (
    <Link
      href={withLang(lang, course.href)}
      className="group flex h-full flex-col rounded-xl border border-line bg-bg p-5 transition-colors hover:border-line-strong hover:bg-subtle/60 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] tracking-wide text-fg-3">{course.code}</span>
        <ArrowUpRight size={16} className="text-fg-3 transition-colors group-hover:text-accent" aria-hidden />
      </div>
      <h3 className="mt-3 font-serif text-[23px] leading-tight tracking-[-0.01em] transition-colors group-hover:text-accent">
        {pick(course.title, lang)}
      </h3>
      {course.instructor && <p className="mt-1.5 text-[13px] text-fg-3">{course.instructor}</p>}
      {course.description && (
        <p className="mt-3 text-[14px] leading-[1.7] text-fg-2">{pick(course.description, lang)}</p>
      )}
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5 font-mono text-[11.5px] text-fg-3">
        {course.sections.length === 0 ? (
          <span>—</span>
        ) : (
          course.sections.map((s) => (
            <span key={s.type}>
              {pick(s.label, lang)} <span className="text-fg-2">{s.notes.length}</span>
            </span>
          ))
        )}
      </div>
    </Link>
  );
}
