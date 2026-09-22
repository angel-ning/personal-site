export const LANGS = ["en", "zh"] as const;
export type Lang = (typeof LANGS)[number];
export type L10n = Record<Lang, string>;

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

export const htmlLang: Record<Lang, string> = { en: "en", zh: "zh-CN" };

const dict = {
  nav: {
    home: { en: "Home", zh: "首页" },
    notes: { en: "Notes", zh: "笔记" },
    about: { en: "About", zh: "关于" },
    contact: { en: "Contact", zh: "联系" },
  },
  theme: {
    light: { en: "Light", zh: "浅色" },
    dark: { en: "Dark", zh: "深色" },
    system: { en: "System", zh: "跟随系统" },
    toggle: { en: "Switch theme", zh: "切换主题" },
  },
  langSwitch: { en: "中文", zh: "EN" },
  langSwitchLabel: { en: "切换到中文", zh: "Switch to English" },
  home: {
    now: { en: "Currently", zh: "现在" },
    latestNotes: { en: "Latest notes", zh: "最近的笔记" },
    allNotes: { en: "All notes", zh: "全部笔记" },
    experience: { en: "Experience", zh: "工作经历" },
    projects: { en: "Selected projects", zh: "项目" },
    education: { en: "Education", zh: "教育背景" },
    skills: { en: "Skills", zh: "技能" },
    contact: { en: "Get in touch", zh: "联系我" },
    contactBlurb: {
      en: "Happy to talk about security, AI agents, or anything in these notes.",
      zh: "欢迎聊安全、AI Agent，或者笔记里的任何内容。",
    },
    courses: { en: "This term", zh: "本学期课程" },
  },
  notes: {
    title: { en: "Notes", zh: "学习笔记" },
    intro: {
      en: "Study notes from my MSc at HKUST, organized by term and course. Written for exam prep — bilingual terminology, key slides, and what is likely to be tested.",
      zh: "在港科大读硕士期间的课程笔记，按学期和课程整理。以备考为导向：中英对照术语、关键课件截图、标注考试重点。",
    },
    notesCount: { en: "notes", zh: "篇笔记" },
    noteCount: { en: "note", zh: "篇笔记" },
    empty: { en: "No notes yet.", zh: "还没有笔记。" },
    week: { en: "Week", zh: "第" },
    weekSuffix: { en: "", zh: "周" },
    onThisPage: { en: "On this page", zh: "本页目录" },
    backToTop: { en: "Back to top", zh: "回到顶部" },
    prev: { en: "Previous", zh: "上一篇" },
    next: { en: "Next", zh: "下一篇" },
    openRaw: { en: "Open full page", zh: "新窗口打开" },
    backTo: { en: "Back to", zh: "返回" },
    instructor: { en: "Instructor", zh: "授课" },
    updated: { en: "Updated", zh: "更新于" },
    contentLangNote: {
      en: "Notes are written in Chinese with English terminology.",
      zh: "笔记以中文为主，术语保留英文原文。",
    },
  },
  footer: {
    built: { en: "Built with Next.js", zh: "使用 Next.js 构建" },
  },
  copied: { en: "Copied", zh: "已复制" },
  copyWechat: { en: "Copy WeChat ID", zh: "复制微信号" },
} as const;

type Dict = typeof dict;
type Resolve<T> = T extends { en: string; zh: string } ? string : { [K in keyof T]: Resolve<T[K]> };

function resolve<T>(node: T, lang: Lang): Resolve<T> {
  if (node && typeof node === "object" && "en" in node && "zh" in node) {
    return (node as unknown as L10n)[lang] as Resolve<T>;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as object)) out[k] = resolve(v, lang);
  return out as Resolve<T>;
}

const cacheByLang: Partial<Record<Lang, Resolve<Dict>>> = {};
export const getDict = (lang: Lang) => (cacheByLang[lang] ??= resolve(dict, lang));

export const pick = (v: L10n | undefined, lang: Lang) => v?.[lang] ?? "";

export const weekLabel = (week: number, lang: Lang) =>
  lang === "zh" ? `第 ${week} 周` : `Week ${String(week).padStart(2, "0")}`;

export function formatDate(iso: string | undefined, lang: Lang) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (lang === "zh") return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const withLang = (lang: Lang, href: string) => `/${lang}${href.startsWith("/") ? href : `/${href}`}`;
