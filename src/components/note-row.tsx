import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Note } from "@/lib/content";
import { formatDate, pick, weekLabel, withLang, type Lang } from "@/lib/i18n";

// One line in a list of notes. `lead` picks what goes in the left column.
export function NoteRow({ note, lang, lead = "week" }: { note: Note; lang: Lang; lead?: "week" | "course" }) {
  const leadText =
    lead === "course" ? note.courseCode : note.week != null ? weekLabel(note.week, lang) : "—";
  return (
    <li>
      <Link
        href={withLang(lang, note.href)}
        className="group -mx-3 grid grid-cols-[88px_minmax(0,1fr)_auto] items-baseline gap-x-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-subtle sm:grid-cols-[104px_minmax(0,1fr)_auto]"
      >
        <span className="font-mono text-[12px] text-fg-3">{leadText}</span>
        <span className="min-w-0">
          <span className="block text-[15.5px] leading-snug text-fg transition-colors group-hover:text-accent">
            {pick(note.title, lang)}
          </span>
          {note.summary && <span className="mt-1 block text-[13.5px] text-fg-2">{pick(note.summary, lang)}</span>}
        </span>
        <span className="flex items-center gap-2 font-mono text-[12px] text-fg-3">
          <span className="hidden sm:inline">{formatDate(note.date, lang)}</span>
          <ArrowUpRight
            size={15}
            className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden
          />
        </span>
      </Link>
    </li>
  );
}
