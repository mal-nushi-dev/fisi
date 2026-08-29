import React from "react";
import Link from "next/link";
import { PersonAvatar } from "../atoms/PersonAvatar";
import { Badge } from "../atoms/Badge";
import { DirectoryPersonItem } from "./PersonCard";

interface PersonRowProps {
  person: DirectoryPersonItem;
  className?: string;
}

export function PersonRow({ person, className = "" }: PersonRowProps) {
  const yearsText = person.birthYear
    ? person.deathYear
      ? `${person.birthYear} – ${person.deathYear}`
      : `b. ${person.birthYear}`
    : person.deathYear
      ? `d. ${person.deathYear}`
      : "—";

  return (
    <tr
      className={`group border-b border-[var(--primitive-stone-200)] hover:bg-[var(--primitive-chalk-50)] transition-colors ${className}`}
    >
      {/* Record ID */}
      <td className="px-4 py-3 font-mono text-xs font-bold text-[var(--primitive-orange-500)] whitespace-nowrap">
        <Link href={`/people/${person.id}`} className="hover:underline">
          {person.id}
        </Link>
      </td>

      {/* Person Name & Thumbnail */}
      <td className="px-4 py-3">
        <Link
          href={`/people/${person.id}`}
          className="flex items-center gap-3 group-hover:text-[var(--primitive-orange-500)] transition-colors"
        >
          <PersonAvatar
            photoUrl={person.photoUrl}
            name={person.displayName}
            size="sm"
          />
          <span className="font-sans font-bold text-sm text-[var(--primitive-graphite-900)] group-hover:text-[var(--primitive-orange-500)]">
            {person.displayName}
          </span>
        </Link>
      </td>

      {/* Sex */}
      <td className="px-4 py-3 font-mono text-xs text-[var(--primitive-graphite-700)] whitespace-nowrap">
        {person.sex === "M" ? "Male" : person.sex === "F" ? "Female" : "—"}
      </td>

      {/* Lifespan */}
      <td className="px-4 py-3 font-mono text-xs text-[var(--primitive-graphite-800)] whitespace-nowrap">
        {yearsText}
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge
          variant={person.isDeceased ? "deceased" : "living"}
          size="sm"
        >
          {person.isDeceased ? "Deceased" : "Living"}
        </Badge>
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <Link
          href={`/people/${person.id}`}
          className="font-mono text-[11px] font-bold text-[var(--primitive-graphite-600)] group-hover:text-[var(--primitive-orange-500)] transition-colors uppercase tracking-wider inline-flex items-center gap-1"
        >
          <span>Open</span>
          <span>&rarr;</span>
        </Link>
      </td>
    </tr>
  );
}
