import React from "react";
import { DirectoryPersonItem } from "../molecules/PersonCard";
import { PersonRow } from "../molecules/PersonRow";

interface PeopleTableProps {
  people: DirectoryPersonItem[];
  className?: string;
}

export function PeopleTable({ people, className = "" }: PeopleTableProps) {
  if (people.length === 0) {
    return (
      <div className="bg-white border border-[var(--primitive-stone-300)] p-12 text-center rounded-sm font-mono text-sm text-[var(--primitive-graphite-600)]">
        NO RECORDS MATCH YOUR SEARCH CRITERIA.
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[var(--primitive-stone-300)] rounded-sm overflow-hidden overflow-x-auto ${className}`}
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[var(--primitive-chalk-100)] border-b border-[var(--primitive-stone-300)] font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primitive-graphite-700)]">
            <th className="px-4 py-3 min-w-[80px]">REC ID</th>
            <th className="px-4 py-3 min-w-[220px]">INDIVIDUAL NAME</th>
            <th className="px-4 py-3 min-w-[80px]">SEX</th>
            <th className="px-4 py-3 min-w-[140px]">LIFESPAN</th>
            <th className="px-4 py-3 min-w-[100px]">STATUS</th>
            <th className="px-4 py-3 text-right min-w-[80px]">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--primitive-stone-200)]">
          {people.map((person) => (
            <PersonRow key={person.id} person={person} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
