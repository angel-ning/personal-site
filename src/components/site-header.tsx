import Link from "next/link";
import { getDict, withLang, type Lang } from "@/lib/i18n";
import { profile } from "@/data/profile";
import { ThemeToggle } from "./theme";
import { LangToggle } from "./lang-toggle";
import { NavLink } from "./nav-link";

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={withLang(lang, "/")} className="group flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-serif text-[19px] font-medium tracking-tight">{profile.name}</span>
          <span className="hidden font-serif text-[15px] italic text-fg-3 transition-colors group-hover:text-fg-2 sm:inline">
            {profile.nickname}
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-[14px]">
          <NavLink href={withLang(lang, "/notes/")} match={`/${lang}/notes`}>
            {t.nav.notes}
          </NavLink>
          <NavLink href={withLang(lang, "/#about")} match={null} className="hidden sm:inline-flex">
            {t.nav.about}
          </NavLink>
          <NavLink href={withLang(lang, "/#contact")} match={null} className="hidden sm:inline-flex">
            {t.nav.contact}
          </NavLink>
          <span className="mx-1.5 h-4 w-px bg-line-strong" aria-hidden />
          <LangToggle lang={lang} label={t.langSwitch} title={t.langSwitchLabel} />
          <ThemeToggle labels={t.theme} />
        </nav>
      </div>
    </header>
  );
}
