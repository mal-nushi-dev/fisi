/**
 * @file page.tsx
 * @description People directory page rendering the dual-view Swiss ledger and grid (DirectoryTemplate).
 */

import React, { Suspense } from "react";
import { getAllPeople } from "@/lib/data/genealogy";
import { extractYear } from "@/lib/privacy/visibility";
import { DirectoryPersonItem } from "@/components/molecules/PersonCard";
import { DirectoryTemplate } from "@/components/templates/DirectoryTemplate";

export const metadata = {
  title: "People Directory — Fisi Genealogy",
  description: "Search and browse all verified individuals in the Fisi family archive.",
};

export default function PeopleDirectoryPage() {
  const people = getAllPeople();

  const directoryItems: DirectoryPersonItem[] = people.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    givenName: p.givenName,
    surname: p.surname,
    sex: p.sex,
    birthYear: extractYear(p.birth?.date),
    deathYear: extractYear(p.death?.date),
    isDeceased: p.isDeceased,
    photoUrl: p.photoUrl,
  }));

  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[var(--primitive-stone-300)] p-12 text-center rounded-sm font-mono text-xs text-[var(--primitive-graphite-600)]">
          LOADING ARCHIVE DIRECTORY...
        </div>
      }
    >
      <DirectoryTemplate people={directoryItems} />
    </Suspense>
  );
}
