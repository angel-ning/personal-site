import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, MapPin, MessageCircle } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import { Section } from "@/components/section";
import { NoteRow } from "@/components/note-row";
import { CopyButton } from "@/components/copy-button";
import { education, experience, links, profile, projects, skills } from "@/data/profile";
import { getRecentNotes, getTerms } from "@/lib/content";
import { getDict, isLang, pick, withLang, type Lang } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "en") as Lang;
  const t = getDict(lang);
  const term = getTerms()[0];
  const recent = getRecentNotes(5);

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 transition-colors hover:border-line-strong hover:text-fg";

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      {/* ---------- hero ---------- */}
      <section id="about" className="scroll-mt-20 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="kicker">{profile.role[lang]}</p>
        <h1 className="mt-5 font-serif text-[44px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[68px]">
          {profile.name}
          <span className="ml-3 text-fg-3 italic sm:ml-4">{profile.nickname}</span>
        </h1>
        {lang === "zh" && <p className="mt-3 font-serif text-xl text-fg-3">{profile.nameZh}</p>}
        <p className="mt-7 max-w-[64ch] text-[17px] leading-[1.75] text-fg-2 sm:text-[18px]">{profile.bio[lang]}</p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <a className={chip} href={links.github} target="_blank" rel="noopener noreferrer">
            <GithubIcon size={14} /> GitHub
          </a>
          {links.linkedin && (
            <a className={chip} href={links.linkedin} target="_blank" rel="noopener noreferrer">
              <LinkedinIcon size={14} /> LinkedIn
            </a>
          )}
          <a className={chip} href={`mailto:${links.email}`}>
            <Mail size={14} /> Email
          </a>
          <CopyButton value={links.wechat} copiedLabel={t.copied} title={t.copyWechat} className={chip}>
            <MessageCircle size={14} /> WeChat
          </CopyButton>
          <span className="ml-1 inline-flex items-center gap-1 text-[13px] text-fg-3">
            <MapPin size={13} /> {profile.location[lang]}
          </span>
        </div>
      </section>

      {/* ---------- notes ---------- */}
      {term && (
        <Section
          label={t.home.courses}
          aside={<span className="font-mono text-[12px] text-fg-3">{pick(term.title, lang)}</span>}
        >
          <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {term.courses.map((c) => (
              <li key={c.slug} className="bg-bg">
                <Link href={withLang(lang, c.href)} className="group flex h-full flex-col gap-1 p-5 transition-colors hover:bg-subtle">
                  <span className="flex items-center justify-between font-mono text-[12px] text-fg-3">
                    {c.code}
                    <span>
                      {c.noteCount} {c.noteCount === 1 ? t.notes.noteCount : t.notes.notesCount}
                    </span>
                  </span>
                  <span className="text-[16px] leading-snug text-fg transition-colors group-hover:text-accent">
                    {pick(c.title, lang)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {recent.length > 0 && (
        <Section
          label={t.home.latestNotes}
          aside={
            <Link href={withLang(lang, "/notes/")} className="inline-flex items-center gap-1 text-[13px] text-fg-2 hover:text-accent">
              {t.home.allNotes} <ArrowRight size={13} />
            </Link>
          }
        >
          <ul className="-my-2 divide-y divide-line/70">
            {recent.map((n) => (
              <NoteRow key={n.href} note={n} lang={lang} lead="course" />
            ))}
          </ul>
        </Section>
      )}

      {/* ---------- experience ---------- */}
      <Section label={t.home.experience}>
        <ol className="space-y-10">
          {experience.map((e) => (
            <li key={e.period} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6">
              <div>
                <h3 className="text-[17px] font-medium leading-snug">{e.org[lang]}</h3>
                <p className="mt-0.5 text-[14.5px] text-fg-2">
                  {e.role[lang]} <span className="text-fg-3">· {e.place[lang]}</span>
                </p>
              </div>
              <p className="order-first font-mono text-[12px] text-fg-3 sm:order-none sm:pt-1.5">{e.period}</p>
              <ul className="mt-2 space-y-2 sm:col-span-2">
                {e.points.map((p, i) => (
                  <li key={i} className="relative pl-4 text-[14.5px] leading-[1.7] text-fg-2 before:absolute before:top-[0.8em] before:left-0 before:h-px before:w-2 before:bg-fg-3">
                    {p[lang]}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- projects ---------- */}
      <Section label={t.home.projects}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-medium leading-snug group-hover:text-accent">{p.name[lang]}</h3>
                  {p.href && <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-fg-3 group-hover:text-accent" aria-hidden />}
                </div>
                <p className="mt-1 font-mono text-[11.5px] text-fg-3">{p.meta[lang]}</p>
                <p className="mt-3 text-[14px] leading-[1.7] text-fg-2">{p.desc[lang]}</p>
                <p className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-subtle px-2 py-0.5 font-mono text-[11px] text-fg-2">
                      {tag}
                    </span>
                  ))}
                </p>
              </>
            );
            const cls = "group flex h-full flex-col rounded-xl border border-line p-5 transition-colors";
            return (
              <li key={p.name.en}>
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-line-strong hover:bg-subtle/60`}>
                    {body}
                  </a>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ---------- education + skills ---------- */}
      <Section label={t.home.education}>
        <ol className="space-y-7">
          {education.map((e) => (
            <li key={e.period} className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6">
              <p className="order-first font-mono text-[12px] text-fg-3 sm:order-none sm:pt-1.5">{e.period}</p>
              <div className="sm:row-start-1">
                <h3 className="text-[17px] font-medium leading-snug">{e.school[lang]}</h3>
                <p className="mt-0.5 text-[14.5px] text-fg-2">{e.degree[lang]}</p>
                <p className="mt-1 text-[13.5px] text-fg-3">{e.note[lang]}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section label={t.home.skills}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[110px_minmax(0,1fr)]">
          {skills.map((s) => (
            <div key={s.group.en} className="contents">
              <dt className="text-[14px] text-fg-3">{s.group[lang]}</dt>
              <dd className="-mt-3 text-[14.5px] text-fg sm:mt-0">{s.items}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ---------- contact ---------- */}
      <Section id="contact" label={t.home.contact}>
        <p className="max-w-[48ch] text-[15px] text-fg-2">{t.home.contactBlurb}</p>
        <a
          href={`mailto:${links.email}`}
          className="link-u mt-5 inline-block font-serif text-[26px] tracking-tight sm:text-[34px]"
        >
          {links.email}
        </a>
        <dl className="mt-8 grid max-w-md grid-cols-[90px_minmax(0,1fr)] gap-y-3 text-[14.5px]">
          <dt className="text-fg-3">WeChat</dt>
          <dd>
            <CopyButton value={links.wechat} copiedLabel={t.copied} title={t.copyWechat} className="link-u inline-flex items-baseline gap-2 font-mono text-[14px]">
              {links.wechat}
            </CopyButton>
          </dd>
          <dt className="text-fg-3">GitHub</dt>
          <dd>
            <a className="link-u" href={links.github} target="_blank" rel="noopener noreferrer">
              {links.github.replace("https://", "")}
            </a>
          </dd>
          {links.linkedin && (
            <>
              <dt className="text-fg-3">LinkedIn</dt>
              <dd>
                <a className="link-u" href={links.linkedin} target="_blank" rel="noopener noreferrer">
                  {links.linkedin.replace(/^https:\/\/(www\.)?/, "")}
                </a>
              </dd>
            </>
          )}
        </dl>
      </Section>
    </div>
  );
}
