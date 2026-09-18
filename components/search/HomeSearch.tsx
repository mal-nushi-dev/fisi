"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { matchesPerson, normalizeSearch } from "@/lib/presentation/search";
import type { ArchiveModel, ArchivePerson } from "@/lib/presentation/types";
import { useSearchShortcut } from "./useSearchShortcut";

const RECENT_SEARCHES_KEY = "nushi.archive.recent-searches.v1";

type Suggestion =
  | { kind: "recent"; label: string }
  | { kind: "person"; label: string; person: ArchivePerson; href: string }
  | { kind: "branch"; label: string; href: string };

function lifeYears(person: ArchivePerson) {
  if (person.birthYear && person.deathYear) return `${person.birthYear} – ${person.deathYear}`;
  if (person.birthYear) return `b. ${person.birthYear}`;
  if (person.deathYear) return `d. ${person.deathYear}`;
  return "Dates not available";
}

function kinshipCount(person: ArchivePerson) {
  return new Set([
    ...person.parentIds,
    ...person.spouseIds,
    ...person.childIds,
    ...person.siblingIds,
  ]).size;
}

export function HomeSearch({ archive }: { archive: ArchiveModel }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const hasQuery = normalizeSearch(query).length > 0;
  const results = hasQuery ? archive.people.filter((person) => matchesPerson(person, query)) : [];
  const suggestedPeople = [
    ...archive.people.filter((person) => person.id === archive.rootId),
    ...archive.people.filter((person) => person.id !== archive.rootId),
  ].slice(0, 3);
  const suggestions: Suggestion[] = hasQuery
    ? results.slice(0, 5).map((person) => ({
        kind: "person", label: person.displayName, person,
        href: `/tree?person=${encodeURIComponent(person.id)}`,
      }))
    : [
        ...recentSearches.map((label): Suggestion => ({ kind: "recent", label })),
        ...suggestedPeople.map((person): Suggestion => ({
          kind: "person", label: person.displayName, person,
          href: `/tree?person=${encodeURIComponent(person.id)}`,
        })),
        ...archive.branches.slice(0, 3).map((branch): Suggestion => ({
          kind: "branch", label: branch.label,
          href: `/tree?branch=${encodeURIComponent(branch.id)}`,
        })),
      ];
  const allResultsHref = query.trim() ? `/people?q=${encodeURIComponent(query.trim())}` : "/people";

  useSearchShortcut(inputRef);

  useEffect(() => {
    if (open && activeIndex >= 0) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, listId]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      if (Array.isArray(saved)) {
        setRecentSearches([...new Set(saved.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0))].slice(0, 5));
      }
    } catch {
      // Search remains usable when browser storage is unavailable or malformed.
    }
  }, []);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  function remember(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((entry) => normalizeSearch(entry) !== normalizeSearch(trimmed))].slice(0, 5);
    setRecentSearches(next);
    try { sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  }

  function activate(suggestion: Suggestion) {
    if (suggestion.kind === "recent") {
      setQuery(suggestion.label);
      setActiveIndex(-1);
      setOpen(true);
      inputRef.current?.focus();
      return;
    }
    remember(hasQuery ? query : suggestion.label);
    setOpen(false);
    router.push(suggestion.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => suggestions.length === 0 ? -1 : current < 0
        ? (direction === 1 ? 0 : suggestions.length - 1)
        : (current + direction + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) activate(suggestions[activeIndex]);
      else {
        remember(query);
        setOpen(false);
        router.push(allResultsHref);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function clearQuery() {
    setQuery("");
    setActiveIndex(-1);
    setOpen(true);
    inputRef.current?.focus();
  }

  function renderOption(suggestion: Suggestion, index: number) {
    const isResult = hasQuery && suggestion.kind === "person";
    const className = `block w-full text-left transition-colors ${isResult ? "p-5" : "px-3 py-2.5"} ${activeIndex === index ? "bg-surface-container-low" : "hover:bg-surface-container-low/70"}`;
    const content = isResult ? (
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-headline text-2xl leading-tight tracking-tight">
              {suggestion.person.displayName}
              <span className="ml-2 text-base text-secondary">({lifeYears(suggestion.person)})</span>
            </span>
            {suggestion.person.generation !== undefined && (
              <span className="bg-surface-container-high px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary">
                Generation {suggestion.person.generation}
              </span>
            )}
          </div>
          <span className="mt-1.5 block text-xs leading-relaxed text-secondary">
            {suggestion.person.birth?.place?.name ? `Born in ${suggestion.person.birth.place.name} · ` : ""}
            {suggestion.person.id} · {kinshipCount(suggestion.person)} kinship links
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium">View Lineage <Icon name="arrow-right" className="h-3.5 w-3.5" /></span>
      </div>
    ) : (
      <span className="flex items-center justify-between gap-4 text-xs">
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon name={suggestion.kind === "branch" ? "tree" : suggestion.kind === "recent" ? "search" : "person"} className="h-3.5 w-3.5 shrink-0 text-outline" />
          <span className="truncate font-medium">{suggestion.label}</span>
          {suggestion.kind === "person" && <span className="hidden shrink-0 font-headline text-sm italic text-secondary sm:inline">{lifeYears(suggestion.person)}</span>}
        </span>
        <span className="shrink-0 text-[9px] uppercase tracking-wider text-secondary">{suggestion.kind === "recent" ? "Search again" : suggestion.kind === "branch" ? "Branch" : "Individual"}</span>
      </span>
    );
    const common = {
      id: `${listId}-${index}`,
      role: "option" as const,
      "aria-selected": activeIndex === index,
      tabIndex: -1,
      className,
      onMouseMove: () => setActiveIndex(index),
    };
    return suggestion.kind === "recent" ? (
      <button {...common} key={`recent-${suggestion.label}`} type="button" onClick={() => activate(suggestion)}>{content}</button>
    ) : (
      <Link {...common} key={`${suggestion.kind}-${suggestion.href}`} href={suggestion.href} onClick={() => { remember(hasQuery ? query : suggestion.label); setOpen(false); }}>{content}</Link>
    );
  }

  return (
    <section
      ref={containerRef}
      aria-label="Search the family archive"
      className="relative w-full text-left"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <SearchField
        ref={inputRef}
        aria-label="Search people by name, record ID, or year"
        placeholder="Search a name, record ID, or year…"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onClear={query ? clearQuery : undefined}
        shortcut={!query}
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(34rem,65dvh)] overflow-y-auto border border-surface-container-highest bg-surface-container-lowest shadow-nav-float">
          {hasQuery ? (
            <>
              <div className="border-b border-surface-container-highest bg-surface-container-low px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-secondary" role="status">
                {results.length} {results.length === 1 ? "record" : "records"} found for <strong className="break-words font-semibold text-on-surface">“{query.trim()}”</strong>
              </div>
              {results.length > 0 ? (
                <div id={listId} role="listbox" aria-label="Matching people" className="divide-y divide-surface-container-highest">
                  {suggestions.map(renderOption)}
                </div>
              ) : (
                <div className="p-6 sm:p-8">
                  <h2 className="font-headline text-2xl">No records found</h2>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">Try a given name, surname, record ID, or a year. Only dates available in this archive are searchable.</p>
                  <Link href="/people" className="mt-5 inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-xs font-medium text-white">Browse all individuals <Icon name="arrow-right" className="h-3.5 w-3.5" /></Link>
                  <div id={listId} role="listbox" aria-label="Matching people" />
                </div>
              )}
              {results.length > 0 && (
                <div className="border-t border-surface-container-highest bg-surface px-5 py-3 text-center">
                  <Link href={allResultsHref} onClick={() => remember(query)} className="inline-flex items-center gap-2 text-xs font-medium hover:text-secondary">View all {results.length} results in Directory <Icon name="arrow-right" className="h-3.5 w-3.5" /></Link>
                </div>
              )}
            </>
          ) : (
            <>
              <div id={listId} role="listbox" aria-label="Recent searches and archive suggestions">
                {recentSearches.length > 0 && (
                  <div role="group" aria-label="Recent searches" className="border-b border-surface-container-highest p-4">
                    <div className="mb-2.5 flex items-center justify-between px-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Recent searches</span>
                      <button type="button" className="text-[10px] uppercase tracking-wider text-secondary hover:text-on-surface" onClick={() => {
                        setRecentSearches([]); setActiveIndex(-1);
                        try { sessionStorage.removeItem(RECENT_SEARCHES_KEY); } catch { /* Optional persistence. */ }
                        inputRef.current?.focus();
                      }}>Clear history</button>
                    </div>
                    {suggestions.slice(0, recentSearches.length).map(renderOption)}
                  </div>
                )}
                <div role="group" aria-label="Suggested people" className="border-b border-surface-container-highest p-4">
                  <div className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Discover the archive</div>
                  {suggestions.slice(recentSearches.length, recentSearches.length + suggestedPeople.length).map((suggestion, index) => renderOption(suggestion, index + recentSearches.length))}
                </div>
                {archive.branches.length > 0 && (
                  <div role="group" aria-label="Family branches" className="p-4">
                    <div className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Family branches</div>
                    {suggestions.slice(recentSearches.length + suggestedPeople.length).map((suggestion, index) => renderOption(suggestion, index + recentSearches.length + suggestedPeople.length))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container-highest bg-surface-container-low px-5 py-3 text-[10px] text-secondary">
                <span><kbd className="font-body">↑ ↓</kbd> to navigate <span className="mx-2 text-outline-variant">·</span> <kbd className="font-body">Enter</kbd> to open</span>
                <span><kbd className="font-body">Esc</kbd> to dismiss</span>
              </div>
            </>
          )}
        </div>
      )}
      <p className="mt-4 text-center text-[11px] leading-relaxed text-secondary">Explore individuals, trace a branch, or search by a recorded year.</p>
    </section>
  );
}
