"use client";

import { useState, type ReactNode } from "react";

export function CopyButton({
  value,
  copiedLabel,
  className,
  title,
  children,
}: {
  value: string;
  copiedLabel: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={title}
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {}
      }}
    >
      {children}
      <span aria-live="polite" className={`text-accent transition-opacity ${copied ? "opacity-100" : "opacity-0"}`}>
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}
