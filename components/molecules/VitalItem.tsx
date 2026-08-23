import React from "react";

interface VitalItemProps {
  label: string;
  date?: string;
  place?: string;
  note?: string;
  className?: string;
}

export function VitalItem({
  label,
  date,
  place,
  note,
  className = "",
}: VitalItemProps) {
  if (!date && !place && !note) return null;

  return (
    <div
      className={`border-t border-[var(--primitive-stone-200)] py-3 first:border-t-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 ${className}`}
    >
      <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primitive-graphite-600)] shrink-0 min-w-[100px]">
        {label} //
      </dt>
      <dd className="text-right sm:text-left flex-1 text-sm text-[var(--primitive-graphite-900)]">
        {date && <span className="font-semibold">{date}</span>}
        {date && place && <span className="mx-1.5 text-[var(--primitive-stone-400)]">&bull;</span>}
        {place && <span className="text-[var(--primitive-graphite-700)]">{place}</span>}
        {note && (
          <div className="mt-0.5 text-xs text-[var(--primitive-graphite-600)] font-mono">
            {note}
          </div>
        )}
      </dd>
    </div>
  );
}
