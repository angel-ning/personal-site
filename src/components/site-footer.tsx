import { getDict, type Lang } from "@/lib/i18n";
import { links, profile } from "@/data/profile";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-4 py-8 text-[13px] text-fg-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {profile.name}
          <span className="mx-2">·</span>
          {t.footer.built}
        </p>
        <div className="flex gap-4">
          <a className="hover:text-fg" href={links.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {links.linkedin && (
            <a className="hover:text-fg" href={links.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          <a className="hover:text-fg" href={`mailto:${links.email}`}>
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
