import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  shortcut?: string;
  icon?: React.ReactNode;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", shortcut, icon, onClear, value, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-[var(--primitive-graphite-600)] pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          value={value}
          className={`w-full bg-white text-[var(--primitive-graphite-900)] text-sm placeholder-[var(--primitive-graphite-600)] border border-[var(--primitive-stone-300)] rounded-sm px-3.5 py-2.5 transition-colors focus:outline-none focus:border-[var(--primitive-graphite-900)] focus:ring-1 focus:ring-[var(--primitive-graphite-900)] ${
            icon ? "pl-9" : ""
          } ${shortcut || onClear ? "pr-14" : ""} ${className}`}
          {...props}
        />
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {value && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] font-mono text-[var(--primitive-graphite-600)] hover:text-[var(--primitive-graphite-900)] px-1 py-0.5"
            >
              ✕
            </button>
          )}
          {shortcut && (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-[var(--primitive-graphite-600)] bg-[var(--primitive-chalk-200)] border border-[var(--primitive-stone-300)] rounded-sm">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
