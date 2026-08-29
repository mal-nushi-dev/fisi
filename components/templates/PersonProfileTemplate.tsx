import React from "react";
import Link from "next/link";
import { SanitizedPerson, PersonRelatives } from "@/lib/gedcom/types";
import { PersonDossier } from "../organisms/PersonDossier";
import { RelativesGroup } from "../organisms/RelativesGroup";
import { MiniPedigreeChart } from "../organisms/MiniPedigreeChart";

interface PersonProfileTemplateProps {
  person: SanitizedPerson;
  relatives: PersonRelatives;
}

export function PersonProfileTemplate({
  person,
  relatives,
}: PersonProfileTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between font-mono text-xs text-[var(--primitive-graphite-600)]">
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 hover:text-[var(--primitive-orange-500)] transition-colors uppercase font-bold"
        >
          <span>&larr;</span>
          <span>02 // RETURN TO DIRECTORY</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--primitive-stone-400)]">
            RECORD ARCHIVE
          </span>
          <span className="font-bold text-[var(--primitive-orange-500)]">
            [REC: {person.id}]
          </span>
        </div>
      </div>

      {/* Asymmetric 2-Column Swiss Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dossier & Vitals (5 columns on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          <PersonDossier person={person} />
        </div>

        {/* Right Column: Kinship & Pedigree Graph (7 columns on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          <RelativesGroup relatives={relatives} />
          <MiniPedigreeChart person={person} relatives={relatives} />
        </div>
      </div>
    </div>
  );
}
