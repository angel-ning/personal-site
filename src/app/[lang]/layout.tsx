import { InlineScript } from "@/components/inline-script";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { fontVars } from "../fonts";
import { themeScript } from "@/components/theme";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LANGS, htmlLang, isLang } from "@/lib/i18n";
import { profile } from "@/data/profile";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const title = `${profile.name} (${profile.nickname})`;
  return {
    title: { default: title, template: `%s · ${profile.name}` },
    description: profile.role[lang],
    alternates: { languages: { en: "/en/", "zh-CN": "/zh/" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1012" },
  ],
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={htmlLang[lang]} className={fontVars} suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader lang={lang} />
        <main className="flex-1">{children}</main>
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
