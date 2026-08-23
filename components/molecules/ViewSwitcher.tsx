import React from "react";

export type ViewMode = "table" | "grid";

interface ViewSwitcherProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewSwitcher({
  mode,
  onChange,
  className = "",
}: ViewSwitcherProps) {
  return (
    <div
      className={`inline-flex items-center p-0.5 bg-[var(--primitive-chalk-200)] border border-[var(--primitive-stone-300)] rounded-sm ${className}`}
      role="group"
      aria-label="View format switcher"
    >
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
          mode === "table"
            ? "bg-white text-[var(--primitive-graphite-900)] font-bold shadow-sm border border-[var(--primitive-stone-300)]"
            : "text-[var(--primitive-graphite-600)] hover:text-[var(--primitive-graphite-900)] border border-transparent"
        }`}
      >
        <span>☷</span>
        <span>01 // Table</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
          mode === "grid"
            ? "bg-white text-[var(--primitive-graphite-900)] font-bold shadow-sm border border-[var(--primitive-stone-300)]"
            : "text-[var(--primitive-graphite-600)] hover:text-[var(--primitive-graphite-900)] border border-transparent"
        }`}
      >
        <span>▦</span>
        <span>02 // Grid</span>
      </button>
    </div>
  );
}
