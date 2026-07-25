import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SquirrelNote",
  description:
    "A note-taking app connected to Granola and Claude, backed by Supabase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
