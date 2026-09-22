"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";

export type ExportLabels = { export: string; md: string; mdHint: string; pdf: string; pdfHint: string };

// Get every lazy image loaded and every <details> open, force the light theme,
// then open the browser's print dialog (where the reader picks "Save as PDF").
async function printNote() {
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme");
  const closed = [...document.querySelectorAll<HTMLDetailsElement>("details:not([open])")];
  closed.forEach((d) => (d.open = true));
  root.setAttribute("data-theme", "light");

  const imgs = [...document.querySelectorAll<HTMLImageElement>(".prose img")];
  imgs.forEach((img) => (img.loading = "eager"));
  await Promise.all(
    imgs
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
  );

  const restore = () => {
    closed.forEach((d) => (d.open = false));
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  };
  window.addEventListener("afterprint", restore, { once: true });
  window.print();
}

export function ExportMenu({ href, fileName, labels }: { href: string | null; fileName?: string; labels: ExportLabels }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-subtle";
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={labels.export}
        aria-label={labels.export}
        className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12.5px] text-fg-2 transition-colors hover:bg-subtle hover:text-fg"
      >
        <Download size={15} />
        <span className="hidden sm:inline">{labels.export}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-[min(280px,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5">
          {href && (
            <a href={href} download={fileName} onClick={() => setOpen(false)} className={item}>
              <FileText size={16} className="mt-0.5 shrink-0 text-fg-3" />
              <span>
                <span className="block text-[13.5px]">{labels.md}</span>
                <span className="block text-[12px] text-fg-3">{labels.mdHint}</span>
              </span>
            </a>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setOpen(false);
              setBusy(true);
              try {
                await printNote();
              } finally {
                setBusy(false);
              }
            }}
            className={item}
          >
            <Printer size={16} className="mt-0.5 shrink-0 text-fg-3" />
            <span>
              <span className="block text-[13.5px]">{labels.pdf}</span>
              <span className="block text-[12px] text-fg-3">{labels.pdfHint}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
