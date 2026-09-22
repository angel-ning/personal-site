import type { ReactNode } from "react";

// Editorial two-column section: small label on the left, content on the right.
export function Section({
  id,
  label,
  aside,
  children,
}: {
  id?: string;
  label: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-20 gap-5 border-t border-line py-12 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 md:py-14">
      <div className="flex items-baseline justify-between md:block">
        <h2 className="kicker pt-[3px]">{label}</h2>
        {aside && <div className="md:mt-3">{aside}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
