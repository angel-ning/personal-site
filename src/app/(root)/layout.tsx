import type { Metadata } from "next";
import { profile } from "@/data/profile";

export const metadata: Metadata = { title: `${profile.name} (${profile.nickname})` };

export default function RootRedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#fbfbf9" }}>{children}</body>
    </html>
  );
}
