"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ChevronDown, ChevronRight } from "lucide-react";
import type { Heading } from "@/lib/markdown";
import type { Crumb } from "./breadcrumbs";
import { useActiveHeading } from "./toc";
import { ExportMenu, type ExportLabels } from "./export-menu";

// Bar pinned under the site header on note pages: where you are (breadcrumbs),
// which section you're reading, a jump menu for every section, and reading progress.
export function NoteBar({
  crumbs,
  headings,
  labels,
  download,
}: {
  crumbs: Crumb[];
  headings: Heading[];
  labels: { onThisPage: string; top: string; export: ExportLabels };
  download: { href: string | null; fileName?: string };
}) {
  const items = useMemo(() => headings.filter((h) => h.depth === 2), [headings]);
  const active = useActiveHeading(items);
  const current = items.find((h) => h.id === active);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const last = crumbs.length - 1;
  return (
    <div className="note-bar sticky top-14 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-11 max-w-[1120px] items-center justify-between gap-3 px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0 text-[13px] text-fg-3">
          <ol className="flex items-center gap-1 whitespace-nowrap">
            {crumbs.map((c, i) => {
              // Phones: course + note. Tablets add the section. Wide screens show the full path.
              // Only the note title truncates; the short links keep their full text.
              const show = i === last || i === last - 2 ? "flex" : i === last - 1 ? "hidden sm:flex" : "hidden lg:flex";
              const firstShown = i === last - 2 ? "hidden lg:block" : "";
              return (
              <li key={i} className={`items-center gap-1 ${show} ${i === last ? "min-w-0" : "shrink-0"}`}>
                {i > 0 && <ChevronRight size={13} className={`shrink-0 opacity-60 ${firstShown}`} aria-hidden />}
                {c.href ? (
                  <Link href={c.href} className="truncate transition-colors hover:text-fg">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate text-fg-2" aria-current="page">
                    {c.label}
                  </span>
                )}
              </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {items.length > 0 && (
            <div ref={menu} className="relative">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex max-w-[46vw] items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[12.5px] text-fg-2 transition-colors hover:border-line-strong hover:text-fg sm:max-w-[320px]"
              >
                <span className="truncate">{current?.text ?? labels.onThisPage}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="absolute top-full right-0 mt-2 max-h-[65vh] w-[min(380px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-lg shadow-black/5">
                  <p className="kicker px-2.5 pt-1 pb-2">{labels.onThisPage}</p>
                  <ol>
                    {items.map((h) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          onClick={() => setOpen(false)}
                          className={`block rounded-lg px-2.5 py-1.5 text-[13.5px] leading-snug transition-colors ${
                            h.id === active ? "bg-accent-wash text-accent" : "text-fg-2 hover:bg-subtle hover:text-fg"
                          }`}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
          <ExportMenu href={download.href} fileName={download.fileName} labels={labels.export} />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title={labels.top}
            aria-label={labels.top}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-3 transition-all hover:bg-subtle hover:text-fg ${progress > 0.02 ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
      <div className="absolute bottom-[-1px] left-0 h-[2px] bg-accent transition-[width] duration-150" style={{ width: `${progress * 100}%` }} aria-hidden />
    </div>
  );
}
