"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "theme";

// Runs in <head> before first paint: resolve the stored preference to data-theme.
export const themeScript = `(function(){try{var p=localStorage.getItem('${KEY}')||'system';var m=window.matchMedia('(prefers-color-scheme: dark)');var r=p==='system'?(m.matches?'dark':'light'):p;var d=document.documentElement;d.dataset.theme=r;d.dataset.themePref=p;m.addEventListener('change',function(e){if((d.dataset.themePref||'system')==='system'){d.dataset.theme=e.matches?'dark':'light';window.dispatchEvent(new CustomEvent('site-theme'))}})}catch(e){}})();`;

const storedPref = (): ThemePref => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {}
  return "system";
};

function setThemeAttrs(pref: ThemePref) {
  const d = document.documentElement;
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  d.dataset.themePref = pref;
  d.dataset.theme = pref === "system" ? (dark ? "dark" : "light") : pref;
}

export function applyTheme(pref: ThemePref) {
  setThemeAttrs(pref);
  try {
    localStorage.setItem(KEY, pref);
  } catch {}
  window.dispatchEvent(new CustomEvent("site-theme"));
}

const subscribe = (cb: () => void) => {
  window.addEventListener("site-theme", cb);
  return () => window.removeEventListener("site-theme", cb);
};

const ORDER: ThemePref[] = ["system", "light", "dark"];
const ICON = { system: Monitor, light: Sun, dark: Moon };

export function ThemeToggle({ labels }: { labels: Record<ThemePref, string> & { toggle: string } }) {
  // The head script only runs on full page loads. When a client navigation re-renders
  // <html> (e.g. switching language), restore the theme attributes before paint.
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (!document.documentElement.dataset.theme) {
      setThemeAttrs(storedPref());
      window.dispatchEvent(new CustomEvent("site-theme"));
    }
  }, [pathname]);

  // null on the server; the stored preference once hydrated.
  const pref = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.themePref as ThemePref) || "system",
    () => null,
  );

  const current = pref ?? "system";
  const Icon = ICON[current];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-subtle hover:text-fg"
      aria-label={`${labels.toggle}: ${labels[current]}`}
      title={`${labels.toggle} · ${labels[current]}`}
    >
      <Icon size={17} strokeWidth={1.75} className={pref ? "" : "opacity-0"} />
    </button>
  );
}
