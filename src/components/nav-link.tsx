"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  match,
  className = "",
  children,
}: {
  href: string;
  match: string | null; // path prefix that marks this link active
  className?: string; // display utilities, defaults to inline-flex
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const active = match != null && pathname.startsWith(match);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`h-9 items-center rounded-full px-3 whitespace-nowrap transition-colors hover:bg-subtle hover:text-fg ${className || "inline-flex"} ${
        active ? "text-fg" : "text-fg-2"
      }`}
    >
      {children}
    </Link>
  );
}
