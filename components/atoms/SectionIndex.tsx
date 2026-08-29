import React from "react";

interface SectionIndexProps {
  index: string; // e.g. "01", "02", "REC"
  title?: string;
  className?: string;
}

export function SectionIndex({
  index,
  title,
  className = "",
}: SectionIndexProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primitive-graphite-600)] ${className}`}
    >
      <span className="text-[var(--primitive-orange-500)]">{index} //</span>
      {title && <span className="text-[var(--primitive-graphite-900)]">{title}</span>}
    </div>
  );
}
