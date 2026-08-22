/**
 * @file SearchDirectory.tsx
 * @description Fast, client-side filtering component for the people directory.
 *
 * Search Architecture:
 * - Instant filtering over pre-built static search entries.
 * - Substring matching across first name and surname.
 * - Shows birth year `(b. YYYY)` only if authorized by the privacy engine.
 * - Requires zero network requests after initial page load.
 */

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SearchEntry } from "@/lib/gedcom/types";

interface SearchDirectoryProps {
  /** Array of pre-sanitized search entries */
  entries: SearchEntry[];
}

export function SearchDirectory({ entries }: SearchDirectoryProps) {
  const [query, setQuery] = useState("");

  // Real-time substring filter
  const filteredEntries = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return entries;
    return entries.filter((entry) =>
      entry.displayName.toLowerCase().includes(trimmed),
    );
  }, [entries, query]);

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by first name or surname..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition text-sm sm:text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results Header Summary */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 px-1">
        <span>
          {query.trim()
            ? `Found ${filteredEntries.length} ${
                filteredEntries.length === 1 ? "person" : "people"
              } matching "${query.trim()}"`
            : `Total: ${entries.length} individuals`}
        </span>
      </div>

      {/* Results List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <span className="text-3xl mb-2 block">🔍</span>
          <p className="text-slate-700 font-medium">No matches found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try checking spelling or searching by first name or last name only.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {filteredEntries.map((person) => (
            <Link
              key={person.id}
              href={`/people/${person.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-indigo-50/50 transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base text-slate-400 group-hover:text-indigo-500 transition">
                  👤
                </span>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition">
                  {person.displayName}
                </span>
              </div>
              {person.birthYear !== undefined && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  b. {person.birthYear}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
