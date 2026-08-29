import React from "react";

interface SurnameChipProps {
  surname: string;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SurnameChip({
  surname,
  count,
  isActive = false,
  onClick,
  className = "",
}: SurnameChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-sm border transition-all cursor-pointer ${
        isActive
          ? "bg-[var(--primitive-orange-500)] text-white border-[var(--primitive-orange-600)] font-bold shadow-none"
          : "bg-white hover:bg-[var(--primitive-chalk-50)] text-[var(--primitive-graphite-900)] border-[var(--primitive-stone-300)] hover:border-[var(--primitive-graphite-900)]"
      } ${className}`}
    >
      <span className="uppercase">{surname}</span>
      <span
        className={`text-[10px] px-1 py-0.2 rounded-sm ${
          isActive
            ? "bg-white/20 text-white"
            : "bg-[var(--primitive-chalk-200)] text-[var(--primitive-graphite-600)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
