/**
 * @file layout.tsx
 * @description Global application layout for the Family Tree static site.
 * Configured with Swiss & OCR-B typography fallback stack and Design Token Architecture.
 */

import type { Metadata } from "next";
import { getTreeStats } from "@/lib/data/genealogy";
import { BaseLayout } from "@/components/templates/BaseLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fisi Genealogy — Family Archive",
  description: "Private family tree archive and genealogical records ledger.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = getTreeStats();

  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="antialiased min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
        <BaseLayout
          totalPeople={stats.totalPeople}
          totalFamilies={stats.totalFamilies}
        >
          {children}
        </BaseLayout>
      </body>
    </html>
  );
}
