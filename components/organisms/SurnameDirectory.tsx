import React from "react";
import Link from "next/link";
import { SectionIndex } from "../atoms/SectionIndex";

interface SurnameDirectoryProps {
  surnames: Array<{ surname: string; count: number }>;
  className?: string;
}

export function SurnameDirectory({
  surnames,
  className = "",
}: SurnameDirectoryProps) {
  if (surnames.length === 0) return null;

  return (
    <div
      className={`bg-white border border-[var(--primitive-stone-300)] p-6 rounded-sm space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--primitive-stone-200)] pb-3">
        <SectionIndex index="02" title="SURNAME INDEX" />
        <span className="font-mono text-xs text-[var(--primitive-graphite-600)] uppercase">
          {surnames.length} UNIQUE SURNAMES
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {surnames.map(({ surname, count }) => (
          <Link
            key={surname}
            href={`/people?q=${encodeURIComponent(surname)}`}
            className="group inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 bg-[var(--primitive-chalk-50)] hover:bg-white text-[var(--primitive-graphite-900)] border border-[var(--primitive-stone-300)] hover:border-[var(--primitive-graphite-900)] rounded-sm transition-all"
          >
            <span className="font-bold group-hover:text-[var(--primitive-orange-500)] transition-colors uppercase">
              {surname}
            </span>
            <span className="text-[10px] px-1 py-0.2 bg-[var(--primitive-chalk-200)] text-[var(--primitive-graphite-600)] rounded-sm">
              {count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
