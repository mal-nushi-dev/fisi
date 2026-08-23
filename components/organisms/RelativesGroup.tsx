import React from "react";
import { PersonRelatives } from "@/lib/gedcom/types";
import { RelativeLinkCard } from "../molecules/RelativeLinkCard";
import { SectionIndex } from "../atoms/SectionIndex";

interface RelativesGroupProps {
  relatives: PersonRelatives;
  className?: string;
}

export function RelativesGroup({
  relatives,
  className = "",
}: RelativesGroupProps) {
  const hasParents = relatives.parents.length > 0;
  const hasSpouses = relatives.spouses.length > 0;
  const hasChildren = relatives.children.length > 0;
  const hasSiblings = relatives.siblings.length > 0;
  const hasAny = hasParents || hasSpouses || hasChildren || hasSiblings;

  if (!hasAny) {
    return (
      <div
        className={`bg-white border border-[var(--primitive-stone-300)] p-6 rounded-sm space-y-3 ${className}`}
      >
        <SectionIndex index="02" title="IMMEDIATE FAMILY KINSHIP" />
        <p className="font-mono text-xs text-[var(--primitive-graphite-600)] italic">
          NO IMMEDIATE RELATIVES RECORDED IN THE ARCHIVE FOR THIS INDIVIDUAL.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[var(--primitive-stone-300)] p-6 rounded-sm space-y-6 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--primitive-stone-200)] pb-3">
        <SectionIndex index="02" title="IMMEDIATE FAMILY KINSHIP" />
        <span className="font-mono text-xs text-[var(--primitive-graphite-600)] uppercase">
          {relatives.parents.length +
            relatives.spouses.length +
            relatives.children.length +
            relatives.siblings.length}{" "}
          CONNECTED RECORDS
        </span>
      </div>

      {/* Parents */}
      {hasParents && (
        <div className="space-y-2">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primitive-graphite-700)] flex items-center justify-between">
            <span>PARENTS ({relatives.parents.length})</span>
            <span className="text-[10px] text-[var(--primitive-stone-400)]">ASCENDANT</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relatives.parents.map((parent) => (
              <RelativeLinkCard
                key={parent.id}
                person={parent}
                roleLabel={
                  parent.sex === "M"
                    ? "FATHER"
                    : parent.sex === "F"
                    ? "MOTHER"
                    : "PARENT"
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Spouses & Partners */}
      {hasSpouses && (
        <div className="space-y-2">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primitive-graphite-700)] flex items-center justify-between">
            <span>SPOUSE / PARTNER ({relatives.spouses.length})</span>
            <span className="text-[10px] text-[var(--primitive-stone-400)]">MARRIAGE</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relatives.spouses.map((spouse) => (
              <RelativeLinkCard
                key={spouse.id}
                person={spouse}
                roleLabel="SPOUSE"
              />
            ))}
          </div>
        </div>
      )}

      {/* Children */}
      {hasChildren && (
        <div className="space-y-2">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primitive-graphite-700)] flex items-center justify-between">
            <span>CHILDREN ({relatives.children.length})</span>
            <span className="text-[10px] text-[var(--primitive-stone-400)]">DESCENDANT</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relatives.children.map((child) => (
              <RelativeLinkCard
                key={child.id}
                person={child}
                roleLabel={
                  child.sex === "M"
                    ? "SON"
                    : child.sex === "F"
                    ? "DAUGHTER"
                    : "CHILD"
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Siblings */}
      {hasSiblings && (
        <div className="space-y-2">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primitive-graphite-700)] flex items-center justify-between">
            <span>SIBLINGS ({relatives.siblings.length})</span>
            <span className="text-[10px] text-[var(--primitive-stone-400)]">COLLATERAL</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relatives.siblings.map((sibling) => (
              <RelativeLinkCard
                key={sibling.id}
                person={sibling}
                roleLabel={
                  sibling.sex === "M"
                    ? "BROTHER"
                    : sibling.sex === "F"
                    ? "SISTER"
                    : "SIBLING"
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
