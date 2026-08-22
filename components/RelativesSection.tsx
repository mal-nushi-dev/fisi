/**
 * @file RelativesSection.tsx
 * @description Semantic list of linked immediate relatives (parents, spouses, children, siblings).
 *
 * Wiki-Style Tree Navigation:
 * - Each relative card links directly to `/people/[id]`.
 * - Shows relative's name, relationship tag (Father, Mother, Brother, Daughter, etc.),
 *   vital years (e.g. "b. 1952" or "1900 – 1969"), and thumbnail photo.
 */

import React from "react";
import Link from "next/link";
import { PersonRelatives, PersonSummary } from "@/lib/gedcom/types";
import { PersonPhoto } from "./PersonPhoto";

interface RelativesSectionProps {
  /** Resolved immediate relatives object from getRelatives(id) */
  relatives: PersonRelatives;
}

/**
 * Individual relative navigation card.
 */
function RelativeCard({
  person,
  roleLabel,
}: {
  person: PersonSummary;
  roleLabel?: string;
}) {
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
      className="group flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 transition shadow-sm"
    >
      <PersonPhoto
        photoUrl={person.photoUrl}
        name={person.displayName}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-slate-800 group-hover:text-indigo-600 truncate transition">
            {person.displayName}
          </span>
          {roleLabel && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              {roleLabel}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
          <span>
            {person.sex === "M"
              ? "Male"
              : person.sex === "F"
                ? "Female"
                : "Unknown"}
          </span>
          {yearsText && <span>&bull;</span>}
          {yearsText && <span>{yearsText}</span>}
        </div>
      </div>
    </Link>
  );
}

/**
 * Group of relatives (e.g. Parents, Children).
 */
function RelativeGroup({
  title,
  icon,
  relatives,
  getRole,
}: {
  title: string;
  icon: string;
  relatives: PersonSummary[];
  getRole?: (person: PersonSummary) => string;
}) {
  if (relatives.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        <span>{icon}</span> {title} ({relatives.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {relatives.map((p) => (
          <RelativeCard
            key={p.id}
            person={p}
            roleLabel={getRole ? getRole(p) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function RelativesSection({ relatives }: RelativesSectionProps) {
  const totalRelatives =
    relatives.parents.length +
    relatives.spouses.length +
    relatives.children.length +
    relatives.siblings.length;

  if (totalRelatives === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <span>👥</span> Family Connections
        </h2>
        <p className="text-sm text-slate-500 italic">
          No immediate relatives recorded for this individual.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
        <span>👥</span> Family Connections
      </h2>

      {/* Parents */}
      <RelativeGroup
        title="Parents"
        icon="👨‍👩‍👦"
        relatives={relatives.parents}
        getRole={(p) =>
          p.sex === "M" ? "Father" : p.sex === "F" ? "Mother" : "Parent"
        }
      />

      {/* Spouses / Partners */}
      <RelativeGroup
        title="Spouse / Partner"
        icon="💍"
        relatives={relatives.spouses}
        getRole={() => "Spouse"}
      />

      {/* Children */}
      <RelativeGroup
        title="Children"
        icon="👶"
        relatives={relatives.children}
        getRole={(p) =>
          p.sex === "M" ? "Son" : p.sex === "F" ? "Daughter" : "Child"
        }
      />

      {/* Siblings */}
      <RelativeGroup
        title="Siblings"
        icon="🤝"
        relatives={relatives.siblings}
        getRole={(p) =>
          p.sex === "M" ? "Brother" : p.sex === "F" ? "Sister" : "Sibling"
        }
      />
    </div>
  );
}
