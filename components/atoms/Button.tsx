import React from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "tab";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

interface ButtonAsButtonProps
  extends ButtonBaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  href?: undefined;
  children: React.ReactNode;
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  href: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  href,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-mono uppercase tracking-wider rounded-sm transition-all focus:outline-none focus:ring-1 focus:ring-[var(--primitive-orange-500)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1 gap-1.5",
    md: "text-xs px-4 py-2 gap-2 font-medium",
    lg: "text-sm px-5 py-2.5 gap-2.5 font-bold",
  }[size];

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--accent-signal)] hover:bg-[var(--accent-signal-hover)] text-white border border-[var(--primitive-orange-600)] active:translate-y-[1px]",
    secondary:
      "bg-white hover:bg-[var(--primitive-chalk-50)] text-[var(--primitive-graphite-900)] border border-[var(--primitive-stone-300)] active:translate-y-[1px]",
    outline:
      "bg-transparent hover:bg-white text-[var(--primitive-graphite-800)] border border-[var(--primitive-stone-300)]",
    ghost:
      "bg-transparent hover:bg-[var(--primitive-chalk-200)] text-[var(--primitive-graphite-800)] border border-transparent",
    tab: "bg-[var(--primitive-chalk-200)] hover:bg-white text-[var(--primitive-graphite-700)] border border-[var(--primitive-stone-300)]",
  };

  const combinedStyles = `${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedStyles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedStyles}
      disabled={disabled}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
