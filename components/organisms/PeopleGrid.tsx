import React from "react";
import { DirectoryPersonItem, PersonCard } from "../molecules/PersonCard";

interface PeopleGridProps {
  people: DirectoryPersonItem[];
  className?: string;
}

export function PeopleGrid({ people, className = "" }: PeopleGridProps) {
  if (people.length === 0) {
    return (
      <div className="bg-white border border-[var(--primitive-stone-300)] p-12 text-center rounded-sm font-mono text-sm text-[var(--primitive-graphite-600)]">
        NO RECORDS MATCH YOUR SEARCH CRITERIA.
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 ${className}`}
    >
      {people.map((person) => (
        <PersonCard key={person.id} person={person} />
      ))}
    </div>
  );
}
