import React from "react";
import Image from "next/image";

interface PersonAvatarProps {
  photoUrl?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PersonAvatar({
  photoUrl,
  name,
  size = "md",
  className = "",
}: PersonAvatarProps) {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "—";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const initials = getInitials(name);

  const dimensionStyles = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-12 h-12 text-xs",
    lg: "w-20 h-20 text-sm",
    xl: "w-32 h-32 text-base",
  }[size];

  const imagePixelSizes = {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 128,
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 border border-[var(--primitive-stone-300)] bg-[var(--primitive-chalk-200)] text-[var(--primitive-graphite-800)] font-mono font-bold uppercase rounded-sm overflow-hidden select-none ${dimensionStyles} ${className}`}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          width={imagePixelSizes}
          height={imagePixelSizes}
          className="w-full h-full object-cover grayscale contrast-105"
        />
      ) : (
        <span className="tracking-widest opacity-80">[{initials}]</span>
      )}
    </div>
  );
}
