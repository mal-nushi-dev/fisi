"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcut?: boolean;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { onClear, shortcut = false, className = "", ...props }, ref,
) {
  return (
    <div className="relative flex min-w-0 w-full items-center bg-surface-container-lowest shadow-search-float transition-shadow focus-within:ring-1 focus-within:ring-outline">
      <Icon name="search" className="ml-5 mr-3 h-5 w-5 shrink-0 text-outline" />
      <input ref={ref} type="search" autoComplete="off" aria-label="Search family records" {...props} className={`min-w-0 flex-1 border-0 bg-transparent py-4 pr-3 text-sm text-on-surface placeholder:text-outline focus:outline-none sm:text-base ${className}`} />
      {onClear ? (
        <button type="button" aria-label="Clear search" onMouseDown={(event) => event.preventDefault()} onClick={onClear} className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface">
          <Icon name="close" className="h-4 w-4" />
        </button>
      ) : shortcut ? (
        <kbd aria-hidden="true" className="mr-4 hidden border border-surface-container-highest bg-surface-container-low px-2 py-0.5 font-body text-xs text-secondary sm:block">/</kbd>
      ) : null}
    </div>
  );
});
