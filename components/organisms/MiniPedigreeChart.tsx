import React from "react";
import Link from "next/link";
import { SanitizedPerson, PersonRelatives } from "@/lib/gedcom/types";
import { SectionIndex } from "../atoms/SectionIndex";

interface MiniPedigreeChartProps {
  person: SanitizedPerson;
  relatives: PersonRelatives;
  className?: string;
}

export function MiniPedigreeChart({
  person,
  relatives,
  className = "",
}: MiniPedigreeChartProps) {
  const hasParents = relatives.parents.length > 0;
  const hasChildren = relatives.children.length > 0;

  return (
    <div
      className={`bg-white border border-[var(--primitive-stone-300)] p-6 rounded-sm space-y-6 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--primitive-stone-200)] pb-3">
        <SectionIndex index="03" title="LINEAGE PEDIGREE GRAPH" />
        <span className="font-mono text-[10px] text-[var(--primitive-graphite-600)] uppercase">
          3-GEN VIEW
        </span>
      </div>

      <div className="space-y-6 overflow-x-auto py-2">
        {/* Tier 1: Parents */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase font-bold text-[var(--primitive-graphite-600)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--primitive-stone-400)]" />
            <span>GEN -1 // PARENTS</span>
          </div>

          {hasParents ? (
            <div className="grid grid-cols-2 gap-2 max-w-lg">
              {relatives.parents.map((p) => (
                <Link
                  key={p.id}
                  href={`/people/${p.id}`}
                  className="p-2.5 bg-[var(--primitive-chalk-50)] hover:bg-white border border-[var(--primitive-stone-300)] hover:border-[var(--primitive-graphite-900)] rounded-sm transition-all text-left group"
                >
                  <div className="font-mono text-[10px] text-[var(--primitive-graphite-600)] uppercase flex justify-between">
                    <span>{p.sex === "M" ? "Father" : p.sex === "F" ? "Mother" : "Parent"}</span>
                    <span>[{p.id}]</span>
                  </div>
                  <div className="font-sans font-bold text-xs text-[var(--primitive-graphite-900)] group-hover:text-[var(--primitive-orange-500)] truncate mt-0.5">
                    {p.displayName}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-2 bg-[var(--primitive-chalk-100)] border border-[var(--primitive-stone-200)] rounded-sm font-mono text-[11px] text-[var(--primitive-graphite-600)] max-w-lg">
              NO ANCESTORS RECORDED IN GEDCOM
            </div>
          )}
        </div>

        {/* Hairline Connector */}
        <div className="w-8 border-l border-b border-[var(--primitive-stone-400)] h-3 ml-4" />

        {/* Tier 2: Subject + Spouse */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase font-bold text-[var(--primitive-orange-500)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--primitive-orange-500)]" />
            <span>GEN 0 // SUBJECT &amp; SPOUSE</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-w-lg">
            {/* Subject Node */}
            <div className="p-3 bg-white border-2 border-[var(--primitive-orange-500)] rounded-sm text-left flex-1 min-w-[200px] shadow-sm">
              <div className="font-mono text-[10px] text-[var(--primitive-orange-500)] font-bold uppercase flex justify-between">
                <span>SUBJECT</span>
                <span>[{person.id}]</span>
              </div>
              <div className="font-sans font-extrabold text-sm text-[var(--primitive-graphite-900)] truncate mt-0.5">
                {person.displayName}
              </div>
            </div>

            {/* Spouses */}
            {relatives.spouses.map((s) => (
              <Link
                key={s.id}
                href={`/people/${s.id}`}
                className="p-3 bg-[var(--primitive-chalk-50)] hover:bg-white border border-[var(--primitive-stone-300)] hover:border-[var(--primitive-graphite-900)] rounded-sm transition-all text-left flex-1 min-w-[180px] group"
              >
                <div className="font-mono text-[10px] text-[var(--primitive-graphite-600)] uppercase flex justify-between">
                  <span>SPOUSE</span>
                  <span>[{s.id}]</span>
                </div>
                <div className="font-sans font-bold text-xs text-[var(--primitive-graphite-900)] group-hover:text-[var(--primitive-orange-500)] truncate mt-0.5">
                  {s.displayName}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Hairline Connector */}
        <div className="w-8 border-l border-b border-[var(--primitive-stone-400)] h-3 ml-4" />

        {/* Tier 3: Children */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase font-bold text-[var(--primitive-graphite-600)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--primitive-stone-400)]" />
            <span>GEN +1 // DESCENDANTS</span>
          </div>

          {hasChildren ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-2xl">
              {relatives.children.map((c) => (
                <Link
                  key={c.id}
                  href={`/people/${c.id}`}
                  className="p-2.5 bg-[var(--primitive-chalk-50)] hover:bg-white border border-[var(--primitive-stone-300)] hover:border-[var(--primitive-graphite-900)] rounded-sm transition-all text-left group"
                >
                  <div className="font-mono text-[10px] text-[var(--primitive-graphite-600)] uppercase flex justify-between">
                    <span>{c.sex === "M" ? "Son" : c.sex === "F" ? "Daughter" : "Child"}</span>
                    <span>[{c.id}]</span>
                  </div>
                  <div className="font-sans font-bold text-xs text-[var(--primitive-graphite-900)] group-hover:text-[var(--primitive-orange-500)] truncate mt-0.5">
                    {c.displayName}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-2 bg-[var(--primitive-chalk-100)] border border-[var(--primitive-stone-200)] rounded-sm font-mono text-[11px] text-[var(--primitive-graphite-600)] max-w-lg">
              NO DIRECT DESCENDANTS RECORDED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
