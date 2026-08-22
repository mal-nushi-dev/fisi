/**
 * @file layout.tsx
 * @description Global application layout for the Family Tree static site.
 *
 * Privacy & Security:
 * - Emits `<meta name="robots" content="noindex, nofollow" />` to block web search engines.
 * - Provides clean semantic header, navigation, main container, and footer.
 */

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Tree — Nushi Genealogy",
  description: "Private family tree and genealogy archive.",
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
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-slate-800 hover:text-indigo-600 transition"
            >
              🌳 Nushi Genealogy
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-indigo-600 transition py-1">
                Overview
              </Link>
              <Link
                href="/people"
                className="hover:text-indigo-600 transition py-1"
              >
                People Directory
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
          <div className="max-w-5xl mx-auto px-4">
            Private Family Tree Archive &bull; MacFamilyTree GEDCOM Pipeline
          </div>
        </footer>
      </body>
    </html>
  );
}
