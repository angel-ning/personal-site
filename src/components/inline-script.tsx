"use client";

// A script that runs during HTML parsing (before paint). On the client React only sees it
// as inert text/plain, which avoids the "script tag while rendering" warning.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
