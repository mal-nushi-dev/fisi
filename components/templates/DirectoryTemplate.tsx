"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DirectoryPersonItem } from "../molecules/PersonCard";
import { ViewMode, ViewSwitcher } from "../molecules/ViewSwitcher";
import { Input } from "../atoms/Input";
import { SectionIndex } from "../atoms/SectionIndex";
import { PeopleTable } from "../organisms/PeopleTable";
import { PeopleGrid } from "../organisms/PeopleGrid";

interface DirectoryTemplateProps {
  people: DirectoryPersonItem[];
}

export function DirectoryTemplate({ people }: DirectoryTemplateProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<"all" | "living" | "deceased" | "photos">("all");
  const [sortKey, setSortKey] = useState<"name" | "id" | "year">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setQuery(q);
    }
  }, [searchParams]);

  const filteredPeople = useMemo(() => {
    let result = [...people];

    // Filter by query (name, year, or ID)
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = p.displayName.toLowerCase().includes(q);
        const idMatch = p.id.toLowerCase().includes(q);
        const yearMatch =
          (p.birthYear && String(p.birthYear).includes(q)) ||
          (p.deathYear && String(p.deathYear).includes(q));
        return nameMatch || idMatch || yearMatch;
      });
    }

    // Filter by status
    if (statusFilter === "living") {
      result = result.filter((p) => !p.isDeceased);
    } else if (statusFilter === "deceased") {
      result = result.filter((p) => p.isDeceased);
    } else if (statusFilter === "photos") {
      result = result.filter((p) => Boolean(p.photoUrl));
    }

    // Sort
    result.sort((a, b) => {
      if (sortKey === "id") {
        const numA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
        return sortOrder === "asc" ? numA - numB : numB - numA;
      } else if (sortKey === "year") {
        const yearA = a.birthYear || (sortOrder === "asc" ? 9999 : -9999);
        const yearB = b.birthYear || (sortOrder === "asc" ? 9999 : -9999);
        return sortOrder === "asc" ? yearA - yearB : yearB - yearA;
      } else {
        return sortOrder === "asc"
          ? a.displayName.localeCompare(b.displayName)
          : b.displayName.localeCompare(a.displayName);
      }
    });

    return result;
  }, [people, query, statusFilter, sortKey, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Directory Page Header */}
      <div className="bg-white border border-[var(--primitive-stone-300)] p-6 rounded-sm space-y-2">
        <div className="flex items-center justify-between">
          <SectionIndex index="02" title="DIRECTORY LEDGER" />
          <span className="font-mono text-xs font-bold text-[var(--primitive-orange-500)]">
            [{filteredPeople.length} OF {people.length} RECORDS]
          </span>
        </div>

        <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-[var(--primitive-graphite-900)] tracking-tight">
          People Directory
        </h1>

        <p className="text-sm text-[var(--primitive-graphite-700)]">
          Search and browse all verified individuals across the genealogical archive.
        </p>
      </div>

      {/* Control Bar: Search + Filter Pills + View Switcher */}
      <div className="bg-white border border-[var(--primitive-stone-300)] p-4 rounded-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 max-w-lg">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
              placeholder="Filter by name, year, or record ID..."
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            <ViewSwitcher mode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Filter Facets & Sorters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--primitive-stone-200)] font-mono text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[var(--primitive-graphite-600)] uppercase mr-1">
              STATUS:
            </span>
            {(
              [
                { id: "all", label: "ALL" },
                { id: "living", label: "LIVING" },
                { id: "deceased", label: "DECEASED" },
                { id: "photos", label: "PHOTOS ONLY" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-sm border uppercase tracking-wider transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[var(--primitive-graphite-900)] text-white border-[var(--primitive-graphite-900)] font-bold"
                    : "bg-[var(--primitive-chalk-50)] hover:bg-white text-[var(--primitive-graphite-700)] border-[var(--primitive-stone-300)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--primitive-graphite-600)] uppercase">
              SORT:
            </span>
            <select
              value={`${sortKey}-${sortOrder}`}
              onChange={(e) => {
                const [key, order] = e.target.value.split("-") as [
                  "name" | "id" | "year",
                  "asc" | "desc"
                ];
                setSortKey(key);
                setSortOrder(order);
              }}
              className="bg-white border border-[var(--primitive-stone-300)] rounded-sm px-2 py-1 text-xs text-[var(--primitive-graphite-900)] font-mono focus:outline-none focus:border-[var(--primitive-graphite-900)]"
            >
              <option value="name-asc">Name (A &rarr; Z)</option>
              <option value="name-desc">Name (Z &rarr; A)</option>
              <option value="id-asc">Record ID (Asc)</option>
              <option value="id-desc">Record ID (Desc)</option>
              <option value="year-asc">Birth Year (Oldest First)</option>
              <option value="year-desc">Birth Year (Newest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Render Table or Grid */}
      {viewMode === "table" ? (
        <PeopleTable people={filteredPeople} />
      ) : (
        <PeopleGrid people={filteredPeople} />
      )}
    </div>
  );
}
