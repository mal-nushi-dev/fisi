import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-surface-container-highest px-4 py-6 text-[11px] text-secondary sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p>Mal Nushi <span className="ml-1">{new Date().getFullYear()}</span></p>
        <nav aria-label="Footer navigation" className="flex items-center gap-6">
          <Link href="/tree" className="transition-colors hover:text-on-surface">Interactive Tree</Link>
          <Link href="/people" className="transition-colors hover:text-on-surface">People &amp; Index</Link>
        </nav>
      </div>
    </footer>
  );
}
