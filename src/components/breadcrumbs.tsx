import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-[13px] text-fg-3 ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {items.map((c, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight size={13} className="shrink-0 opacity-60" aria-hidden />}
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
        ))}
      </ol>
    </nav>
  );
}
