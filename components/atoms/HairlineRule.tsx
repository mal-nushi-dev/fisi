import React from "react";

interface HairlineRuleProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function HairlineRule({
  className = "",
  orientation = "horizontal",
}: HairlineRuleProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`inline-block w-[1px] self-stretch bg-[var(--border-hairline)] ${className}`}
      />
    );
  }

  return (
    <hr
      className={`border-0 border-t border-[var(--border-hairline)] w-full my-4 ${className}`}
    />
  );
}
