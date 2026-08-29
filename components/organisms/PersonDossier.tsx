import React from "react";
import { SanitizedPerson } from "@/lib/gedcom/types";
import { PersonAvatar } from "../atoms/PersonAvatar";
import { Badge } from "../atoms/Badge";
import { SectionIndex } from "../atoms/SectionIndex";
import { VitalItem } from "../molecules/VitalItem";

interface PersonDossierProps {
  person: SanitizedPerson;
  className?: string;
}

export function PersonDossier({ person, className = "" }: PersonDossierProps) {
  const hasBirth = Boolean(person.birth?.date || person.birth?.place);
  const hasDeath = Boolean(person.death?.date || person.death?.place);
  const hasVitals = hasBirth || hasDeath;

  return (
    <div
      className={`bg-white border border-[var(--primitive-stone-300)] p-6 rounded-sm space-y-6 ${className}`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between border-b border-[var(--primitive-stone-200)] pb-3">
        <SectionIndex index="01" title="INDIVIDUAL DOSSIER" />
        <span className="font-mono text-xs font-bold text-[var(--primitive-orange-500)]">
          [REC: {person.id}]
        </span>
      </div>

      {/* Portrait & Core Identity */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <PersonAvatar
          photoUrl={person.photoUrl}
          name={person.displayName}
          size="lg"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-sans font-extrabold text-2xl text-[var(--primitive-graphite-900)] tracking-tight">
              {person.displayName}
            </h1>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <Badge
              variant={person.isDeceased ? "deceased" : "living"}
              size="sm"
            >
              {person.isDeceased ? "Deceased" : "Living"}
            </Badge>

            <span className="font-mono text-[11px] text-[var(--primitive-graphite-600)] uppercase">
              {person.sex === "M"
                ? "Male"
                : person.sex === "F"
                ? "Female"
                : "Unrecorded"}
            </span>
          </div>

          {!person.isDeceased && (
            <div className="pt-1">
              <Badge variant="protected" size="sm">
                [LIVING // PROTECTED RECORD]
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Vitals Ledger */}
      <div className="space-y-2 border-t border-[var(--primitive-stone-200)] pt-4">
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primitive-graphite-700)] mb-2">
          VITAL EVENTS &amp; RECORDS
        </div>

        {hasVitals ? (
          <dl className="divide-y divide-[var(--primitive-stone-200)]">
            <VitalItem
              label="BORN"
              date={person.birth?.date}
              place={person.birth?.place?.name}
            />
            <VitalItem
              label="DIED"
              date={person.death?.date}
              place={person.death?.place?.name}
            />
          </dl>
        ) : (
          <div className="p-3 bg-[var(--primitive-chalk-100)] border border-[var(--primitive-stone-200)] rounded-sm font-mono text-xs text-[var(--primitive-graphite-600)]">
            {person.isDeceased
              ? "NO VITAL DATES OR PLACES RECORDED"
              : "VITAL DETAILS WITHHELD PER PRIVACY POLICY"}
          </div>
        )}
      </div>
    </div>
  );
}
