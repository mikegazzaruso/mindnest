import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NestBrain — Your second brain, powered by AI",
  description:
    "NestBrain ingests your documents, articles, and notes — then uses AI to build a living, interconnected knowledge base you can search, query, and think with.",
  openGraph: {
    title: "NestBrain — Your second brain, powered by AI",
    description:
      "Drop in documents, articles, and notes. NestBrain's AI compiles them into a structured, interconnected wiki you can actually think with.",
    url: "https://nestbrain.app",
    siteName: "NestBrain",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NestBrain — Your second brain, powered by AI",
    description: "Drop in documents, articles, and notes. AI builds the wiki.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
