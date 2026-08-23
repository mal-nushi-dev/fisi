"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchEntry } from "@/lib/gedcom/types";
import { Input } from "../atoms/Input";
import { Button } from "../atoms/Button";
import { SectionIndex } from "../atoms/SectionIndex";

interface HeroSearchHubProps {
  searchIndex: SearchEntry[];
  className?: string;
}

export function HeroSearchHub({
  searchIndex,
  className = "",
}: HeroSearchHubProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredResults = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return searchIndex
      .filter((entry) => {
        const nameMatch = entry.displayName.toLowerCase().includes(q);
        const yearMatch = entry.birthYear ? String(entry.birthYear).includes(q) : false;
        const idMatch = entry.id.toLowerCase().includes(q);
        return nameMatch || yearMatch || idMatch;
      })
      .slice(0, 8);
  }, [query, searchIndex]);

  // Global keyboard shortcut '/' or 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle outside click to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      router.push(`/people/${filteredResults[selectedIndex].id}`);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white border border-[var(--primitive-stone-300)] p-6 sm:p-8 rounded-sm space-y-6 ${className}`}
    >
      {/* Archive Header Banner */}
      <div className="space-y-2 border-b border-[var(--primitive-stone-200)] pb-6">
        <div className="flex items-center justify-between">
          <SectionIndex index="00" title="ARCHIVE ACCESS" />
          <span className="font-mono text-[10px] text-[var(--primitive-orange-500)] font-bold uppercase tracking-wider">
            [SYS // READY]
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--primitive-graphite-900)] font-sans">
          Fisi Family Genealogy
        </h1>

        <p className="text-sm sm:text-base text-[var(--primitive-graphite-700)] max-w-3xl leading-relaxed">
          Centralized family lineage archive and genealogical records ledger. Search
          across multiple generations of vital events, photographs, and kinship relationships.
        </p>
      </div>

      {/* Quick Command Search Bar */}
      <div className="space-y-2">
        <label
          htmlFor="archive-search"
          className="block font-mono text-[11px] uppercase font-bold tracking-wider text-[var(--primitive-graphite-600)]"
        >
          01 // QUICK LOOKUP BY NAME, YEAR, OR ID
        </label>

        <div className="relative">
          <Input
            id="archive-search"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            onClear={() => setQuery("")}
            placeholder="Search e.g. 'Ahmet Nushi', '1920', or 'I33'..."
            shortcut="/"
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

          {/* Autocomplete Dropdown */}
          {isOpen && query.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[var(--primitive-stone-300)] shadow-lg rounded-sm z-30 overflow-hidden">
              {filteredResults.length > 0 ? (
                <div className="divide-y divide-[var(--primitive-stone-200)]">
                  {filteredResults.map((entry, idx) => (
                    <Link
                      key={entry.id}
                      href={`/people/${entry.id}`}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        idx === selectedIndex
                          ? "bg-[var(--primitive-chalk-100)] text-[var(--primitive-orange-500)]"
                          : "text-[var(--primitive-graphite-900)] hover:bg-[var(--primitive-chalk-50)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[var(--primitive-orange-500)]">
                          [{entry.id}]
                        </span>
                        <span className="font-sans font-semibold">
                          {entry.displayName}
                        </span>
                      </div>

                      <div className="font-mono text-xs text-[var(--primitive-graphite-600)] flex items-center gap-2">
                        {entry.birthYear && <span>b. {entry.birthYear}</span>}
                        <span>&rarr;</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center font-mono text-xs text-[var(--primitive-graphite-600)]">
                  NO RECORDS FOUND FOR &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--primitive-stone-200)]">
        <div className="font-mono text-[11px] text-[var(--primitive-graphite-600)] flex items-center gap-2">
          <span>HINT: PRESS</span>
          <kbd className="px-1 py-0.5 bg-[var(--primitive-chalk-200)] border border-[var(--primitive-stone-300)] rounded-sm text-[10px] font-bold">
            /
          </kbd>
          <span>OR</span>
          <kbd className="px-1 py-0.5 bg-[var(--primitive-chalk-200)] border border-[var(--primitive-stone-300)] rounded-sm text-[10px] font-bold">
            ⌘K
          </kbd>
          <span>TO SEARCH ANYTIME</span>
        </div>

        <Button href="/people" variant="primary" size="md">
          <span>02 // BROWSE FULL DIRECTORY</span>
          <span>&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
