import React from "react";

export type BadgeVariant =
  | "default"
  | "id"
  | "signal"
  | "living"
  | "deceased"
  | "protected"
  | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "default",
  className = "",
  size = "sm",
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-mono font-medium uppercase tracking-wider rounded-sm transition-colors border";

  const sizeStyles =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 leading-none"
      : "text-xs px-2 py-1 leading-tight";

  const variantStyles: Record<BadgeVariant, string> = {
    default:
      "bg-[var(--primitive-chalk-200)] text-[var(--primitive-graphite-800)] border-[var(--primitive-stone-300)]",
    id: "bg-white text-[var(--primitive-graphite-900)] border-[var(--primitive-stone-300)] font-bold",
    signal:
      "bg-[var(--primitive-orange-500)] text-white border-[var(--primitive-orange-600)] font-bold",
    living:
      "bg-[var(--status-living-bg)] text-[var(--status-living-text)] border-emerald-200",
    deceased:
      "bg-[var(--status-deceased-bg)] text-[var(--status-deceased-text)] border-[var(--primitive-stone-300)]",
    protected:
      "bg-[var(--status-protected-bg)] text-[var(--status-protected-text)] border-amber-200",
    outline:
      "bg-transparent text-[var(--primitive-graphite-700)] border-[var(--primitive-stone-300)]",
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
