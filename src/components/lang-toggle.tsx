"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang, label, title }: { lang: Lang; label: string; title: string }) {
  const pathname = usePathname() || `/${lang}/`;
  const other: Lang = lang === "en" ? "zh" : "en";
  const href = pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${other}`);

  return (
    <Link
      href={href}
      hrefLang={other === "zh" ? "zh-CN" : "en"}
      onClick={() => {
        try {
          localStorage.setItem("lang", other);
        } catch {}
      }}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-[13px] font-medium text-fg-2 transition-colors hover:bg-subtle hover:text-fg"
      aria-label={title}
      title={title}
    >
      {label}
    </Link>
  );
}
