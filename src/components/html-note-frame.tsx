"use client";

import { useEffect, useRef } from "react";

// Standalone HTML notes carry their own styles, so they live in an iframe. Keep the
// note's theme in step with the site (the notes honour data-theme on their <html>).
export function HtmlNoteFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const sync = () => {
      const doc = frame.contentDocument;
      if (!doc?.documentElement) return;
      doc.documentElement.dataset.theme = document.documentElement.dataset.theme ?? "light";
    };
    frame.addEventListener("load", sync);
    window.addEventListener("site-theme", sync);
    sync();
    return () => {
      frame.removeEventListener("load", sync);
      window.removeEventListener("site-theme", sync);
    };
  }, []);

  return <iframe ref={ref} src={src} title={title} className="h-full w-full border-0 bg-bg" />;
}
