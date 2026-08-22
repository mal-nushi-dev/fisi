/**
 * @file PersonPhoto.tsx
 * @description Accessible avatar/photo component with automatic SVG placeholder fallback.
 *
 * Privacy & Asset Behavior:
 * - If `photoUrl` is provided (e.g. "/photos/I62.webp"), it renders the optimized WebP asset.
 * - If `photoUrl` is undefined (living/redacted or unphotographed individual),
 *   it seamlessly falls back to `/photo-placeholder.svg`.
 */

import React from "react";

/**
 * Props for PersonPhoto component.
 */
interface PersonPhotoProps {
  /** Relative URL to optimized WebP image (e.g. "/photos/I62.webp") or undefined */
  photoUrl?: string;
  /** Full name of the individual for accessible alt text */
  name: string;
  /** Optional extra CSS classes */
  className?: string;
  /** Display size variant: 'sm' (cards/lists), 'md' (standard), 'lg' (profile page) */
  size?: "sm" | "md" | "lg";
}

export function PersonPhoto({
  photoUrl,
  name,
  className = "",
  size = "md",
}: PersonPhotoProps) {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-full",
    md: "w-24 h-24 sm:w-28 sm:h-28 rounded-lg",
    lg: "w-36 h-36 sm:w-44 sm:h-44 rounded-xl",
  };

  const src = photoUrl || "/photo-placeholder.svg";

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <img
        src={src}
        alt={`Photo of ${name}`}
        className="w-full h-full object-cover object-center"
        loading="lazy"
      />
    </div>
  );
}
