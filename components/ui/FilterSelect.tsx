import type { SelectHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";

export interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function FilterSelect({ label, className = "", children, ...props }: FilterSelectProps) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="editorial-label">{label}</span>
      <span className="relative block">
        <select {...props} className={`min-h-11 w-full appearance-none border border-surface-container-highest bg-surface-container-lowest py-2.5 pl-3 pr-9 text-xs text-on-surface transition-colors hover:border-outline ${className}`}>
          {children}
        </select>
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary" />
      </span>
    </label>
  );
}
