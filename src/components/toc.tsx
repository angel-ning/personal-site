"use client";

import { useEffect, useMemo, useState } from "react";
import type { Heading } from "@/lib/markdown";

// Id of the h2 currently at the top of the viewport (below the sticky header + note bar).
export function useActiveHeading(items: Heading[]) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const els = items.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const onScroll = () => {
      const y = 130;
      let current = els[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top - y <= 0) current = el.id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return active;
}

// Sticky "On this page" list that tracks the section currently in view.
export function Toc({ headings, title }: { headings: Heading[]; title: string }) {
  const items = useMemo(() => headings.filter((h) => h.depth === 2), [headings]);
  const active = useActiveHeading(items);

  if (!items.length) return null;
  return (
    <nav aria-label={title} className="text-[13px] leading-snug">
      <p className="kicker mb-3">{title}</p>
      <ol className="space-y-px border-l border-line">
        {items.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`-ml-px block border-l py-1.5 pl-3.5 transition-colors ${
                active === h.id ? "border-accent text-fg" : "border-transparent text-fg-3 hover:text-fg-2"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
