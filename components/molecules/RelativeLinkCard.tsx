import React from "react";
import Link from "next/link";
import { PersonSummary } from "@/lib/gedcom/types";
import { PersonAvatar } from "../atoms/PersonAvatar";
import { Badge } from "../atoms/Badge";

interface RelativeLinkCardProps {
  person: PersonSummary;
  roleLabel?: string;
  className?: string;
}

export function RelativeLinkCard({
  person,
  roleLabel,
  className = "",
}: RelativeLinkCardProps) {
  const yearsText = person.birthYear
    ? person.deathYear
      ? `${person.birthYear} – ${person.deathYear}`
      : `b. ${person.birthYear}`
    : person.deathYear
      ? `d. ${person.deathYear}`
      : null;

  return (
    <Link
      href={`/people/${person.id}`}
      className={`group flex items-center gap-3 p-3 bg-white border border-[var(--primitive-stone-300)] rounded-sm hover:border-[var(--primitive-graphite-900)] transition-all ${className}`}
    >
      <PersonAvatar photoUrl={person.photoUrl} name={person.displayName} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans font-semibold text-sm text-[var(--primitive-graphite-900)] group-hover:text-[var(--primitive-orange-500)] transition-colors truncate">
            {person.displayName}
          </span>
          {roleLabel && (
            <Badge variant="default" size="sm">
              {roleLabel}
            </Badge>
          )}
        </div>

        <div className="font-mono text-[11px] text-[var(--primitive-graphite-600)] flex items-center gap-2 mt-0.5">
          <span>{person.sex === "M" ? "M" : person.sex === "F" ? "F" : "—"}</span>
          {yearsText && <span>&bull;</span>}
          {yearsText && <span className="font-medium text-[var(--primitive-graphite-700)]">{yearsText}</span>}
          <span className="ml-auto text-[10px] text-[var(--primitive-stone-400)]">
            [REC: {person.id}]
          </span>
        </div>
      </div>
    </Link>
  );
}
