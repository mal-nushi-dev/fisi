import React from "react";
import { SectionIndex } from "../atoms/SectionIndex";

interface MetricTileProps {
  index: string;
  value: string | number;
  label: string;
  subtext?: string;
  className?: string;
}

export function MetricTile({
  index,
  value,
  label,
  subtext,
  className = "",
}: MetricTileProps) {
  return (
    <div
      className={`bg-white border border-[var(--primitive-stone-300)] p-5 rounded-sm flex flex-col justify-between transition-colors hover:border-[var(--primitive-graphite-900)] ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <SectionIndex index={index} />
        <span className="w-1.5 h-1.5 rounded-none bg-[var(--primitive-stone-400)]" />
      </div>

      <div>
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--primitive-graphite-900)] font-sans">
          {value}
        </div>
        <div className="mt-1 font-mono text-xs uppercase font-medium tracking-wider text-[var(--primitive-graphite-600)]">
          {label}
        </div>
        {subtext && (
          <div className="mt-0.5 font-mono text-[10px] text-[var(--primitive-graphite-600)] truncate">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
