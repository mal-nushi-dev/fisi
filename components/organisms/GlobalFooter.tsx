import React from "react";

export function GlobalFooter() {
  return (
    <footer className="border-t border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-8 mt-16 text-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[var(--primitive-graphite-600)] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--primitive-orange-500)]" />
          <span>FISI FAMILY TREE ARCHIVE &bull; MACFAMILYTREE PIPELINE</span>
        </div>

        <div>
          <span>STATIC EXPORT &bull; REVISION 2026.08</span>
        </div>
      </div>
    </footer>
  );
}
