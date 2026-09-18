"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const links = [
  { href: "/", label: "Home" },
  { href: "/tree", label: "Interactive Tree" },
  { href: "/people", label: "People & Index" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className={`relative z-40 w-full px-4 pt-5 sm:px-6 md:pt-6 lg:px-8 ${pathname === "/tree" ? "pb-5" : ""}`}>
      <a href="#main-content" className="sr-only z-50 bg-primary px-4 py-3 text-sm text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" aria-label="Nushi Archives & Genealogy home" className="group flex shrink-0 flex-col items-start" onClick={() => setMenuOpen(false)}>
          <span className="font-headline text-2xl font-semibold uppercase tracking-wider transition-colors group-hover:text-secondary">Nushi</span>
          <span className="mt-0.5 font-label text-[9px] font-medium uppercase tracking-[0.28em] text-secondary">Archives &amp; Genealogy</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center border border-surface-container-highest bg-surface-container-lowest/95 p-1.5 shadow-nav-float md:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={`px-4 py-2 text-xs font-medium transition-colors ${isActive(href) ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container-low hover:text-on-surface"}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/tree" className="editorial-button hidden sm:inline-flex">
            Explore Lineage <Icon name="arrow-right" className="h-3.5 w-3.5 text-secondary" />
          </Link>
          <button ref={menuButton} type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center border border-surface-container-highest bg-surface-container-lowest text-on-surface md:hidden">
            <Icon name={menuOpen ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="mt-4 grid border border-surface-container-highest bg-surface-container-lowest p-2 shadow-panel-float md:hidden">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} onClick={() => setMenuOpen(false)} className={`px-4 py-3.5 text-sm font-medium ${isActive(href) ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container-low hover:text-on-surface"}`}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
