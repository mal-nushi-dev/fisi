"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface GlobalHeaderProps {
  totalPeople?: number;
  totalFamilies?: number;
}

export function GlobalHeader({
  totalPeople,
  totalFamilies,
}: GlobalHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "01 // OVERVIEW", href: "/" },
    { label: "02 // DIRECTORY", href: "/people" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface-overlay)] backdrop-blur-md border-b border-[var(--border-hairline)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand ID */}
        <Link
          href="/"
          className="font-mono text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[var(--primitive-graphite-900)] hover:text-[var(--primitive-orange-500)] transition-colors flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-none bg-[var(--primitive-orange-500)]" />
          <span>[FISI // GENEALOGY]</span>
        </Link>

        {/* Navigation & Live Metadata */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-mono text-xs uppercase tracking-wider px-2.5 py-1 rounded-sm transition-colors ${
                    isActive
                      ? "bg-white text-[var(--primitive-orange-500)] font-bold border border-[var(--primitive-stone-300)]"
                      : "text-[var(--primitive-graphite-600)] hover:text-[var(--primitive-graphite-900)] hover:bg-[var(--primitive-chalk-200)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {totalPeople !== undefined && (
            <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] text-[var(--primitive-graphite-600)] bg-white px-2 py-1 rounded-sm border border-[var(--primitive-stone-300)] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primitive-emerald-600)]" />
              <span>
                {totalPeople} REC {totalFamilies ? `// ${totalFamilies} FAM` : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
