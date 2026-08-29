import React from "react";
import Link from "next/link";
import { PersonAvatar } from "../atoms/PersonAvatar";
import { Badge } from "../atoms/Badge";

export interface DirectoryPersonItem {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  sex: "M" | "F" | "U";
  birthYear?: number;
  deathYear?: number;
  isDeceased: boolean;
  photoUrl?: string;
}

interface PersonCardProps {
  person: DirectoryPersonItem;
  className?: string;
}

export function PersonCard({ person, className = "" }: PersonCardProps) {
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
      className={`group relative flex flex-col justify-between p-4 bg-white border border-[var(--primitive-stone-300)] rounded-sm hover:border-[var(--primitive-graphite-900)] transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        <PersonAvatar
          photoUrl={person.photoUrl}
          name={person.displayName}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-mono text-[10px] font-bold text-[var(--primitive-orange-500)] tracking-wider">
              [REC: {person.id}]
            </span>
            <Badge
              variant={person.isDeceased ? "deceased" : "living"}
              size="sm"
            >
              {person.isDeceased ? "Deceased" : "Living"}
            </Badge>
          </div>

          <h3 className="font-sans font-bold text-sm text-[var(--primitive-graphite-900)] group-hover:text-[var(--primitive-orange-500)] transition-colors truncate">
            {person.displayName}
          </h3>

          <div className="font-mono text-[11px] text-[var(--primitive-graphite-600)] mt-1 flex items-center gap-1.5">
            <span>{person.sex === "M" ? "Male" : person.sex === "F" ? "Female" : "—"}</span>
            {yearsText && <span>&bull;</span>}
            {yearsText && <span className="font-medium text-[var(--primitive-graphite-800)]">{yearsText}</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[var(--primitive-stone-200)] flex items-center justify-between font-mono text-[10px] text-[var(--primitive-graphite-600)]">
        <span>VIEW PROFILE</span>
        <span className="group-hover:translate-x-0.5 transition-transform text-[var(--primitive-orange-500)]">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
