"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { useSearchShortcut } from "@/components/search/useSearchShortcut";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { filterPeople, paginate } from "@/lib/presentation/search";
import type { ArchiveModel, ArchivePerson, DirectoryFilters } from "@/lib/presentation/types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function lifeYears(person: ArchivePerson) {
  if (person.birthYear && person.deathYear) return `${person.birthYear} – ${person.deathYear}`;
  if (person.birthYear) return `Born ${person.birthYear}`;
  if (person.deathYear) return `Died ${person.deathYear}`;
  return "Dates not available";
}

function pageNumbers(page: number, pageCount: number): (number | "gap-before" | "gap-after")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const first = Math.max(2, Math.min(page - 1, pageCount - 3));
  const last = Math.min(pageCount - 1, Math.max(page + 1, 4));
  return [1, ...(first > 2 ? ["gap-before" as const] : []), ...Array.from({ length: last - first + 1 }, (_, index) => first + index), ...(last < pageCount - 1 ? ["gap-after" as const] : []), pageCount];
}

export function PeopleDirectory({ archive }: { archive: ArchiveModel }) {
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(inputRef);

  const requestedStatus = searchParams.get("status");
  const requestedGeneration = searchParams.get("generation") || "all";
  const requestedBranch = searchParams.get("branch") || "all";
  const requestedLetter = (searchParams.get("letter") || "all").toUpperCase();
  const filters: DirectoryFilters = {
    query: searchParams.get("q") || "",
    branch: archive.branches.some((branch) => branch.id === requestedBranch) ? requestedBranch : "all",
    generation: archive.generations.some((generation) => String(generation) === requestedGeneration) ? requestedGeneration : "all",
    status: requestedStatus === "deceased" || requestedStatus === "unrecorded" ? requestedStatus : "all",
    letter: ALPHABET.includes(requestedLetter) ? requestedLetter : "all",
  };
  const filteredPeople = filterPeople(archive.people, filters);
  const requestedPage = Number(searchParams.get("page") || "1");
  const pagination = paginate(filteredPeople, Number.isFinite(requestedPage) ? requestedPage : 1, 10);
  const activeFilters = Boolean(filters.query || filters.branch !== "all" || filters.generation !== "all" || filters.status !== "all" || filters.letter !== "all");
  const branchLabels = new Map(archive.branches.map((branch) => [branch.id, branch.label]));

  function updateParameter(name: string, value: string, replace = false) {
    // Native history integrates with useSearchParams, including browser back/forward.
    // Read the current URL so successive keystrokes never reuse stale parameters.
    const params = new URLSearchParams(window.location.search);
    if (value === "all" || value === "" || (name === "page" && value === "1")) params.delete(name);
    else params.set(name, value);
    if (name !== "page") params.delete("page");
    const href = `${window.location.pathname}${params.size ? `?${params.toString()}` : ""}`;
    if (replace) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
  }

  function resetFilters() {
    window.history.pushState(null, "", window.location.pathname);
  }

  return (
    <div className="space-y-8">
      <header className="max-w-4xl space-y-2">
        <div className="inline-flex flex-wrap items-center gap-2 border border-outline-variant/60 bg-surface-container-high px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">
          <span>Archival register</span><span aria-hidden="true" className="text-outline">·</span><span>{archive.people.length} individual records</span>
        </div>
        <h1 className="font-headline text-4xl font-normal leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">People &amp; Biographical Index</h1>
        <p className="pt-1 font-headline text-lg italic leading-relaxed text-secondary sm:text-xl">A register of {archive.people.length} individuals across {archive.generations.length} generations, ordered by surname and connected by family.</p>
      </header>

      <section aria-label="Search and filter people" className="space-y-4">
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <SearchField
              ref={inputRef}
              aria-label="Search people by name, record ID, or year"
              placeholder="Search a name, record ID, or year…"
              autoComplete="off"
              value={filters.query}
              onChange={(event) => updateParameter("q", event.target.value, true)}
              onClear={filters.query ? () => { updateParameter("q", "", true); inputRef.current?.focus(); } : undefined}
              shortcut={!filters.query}
            />
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:col-span-6">
            <FilterSelect label="Branch" value={filters.branch} onChange={(event) => updateParameter("branch", event.target.value)}>
              <option value="all">All branches</option>
              {archive.branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.label}</option>)}
            </FilterSelect>
            <FilterSelect label="Generation" value={filters.generation} onChange={(event) => updateParameter("generation", event.target.value)}>
              <option value="all">All generations</option>
              {archive.generations.map((generation) => <option value={generation} key={generation}>Generation {generation}</option>)}
            </FilterSelect>
            <FilterSelect label="Vital status" value={filters.status} onChange={(event) => updateParameter("status", event.target.value)}>
              <option value="all">All records</option>
              <option value="deceased">Death recorded</option>
              <option value="unrecorded">No death recorded</option>
            </FilterSelect>
          </div>
        </div>
        <nav aria-label="Filter by surname initial" className="flex items-center gap-3 overflow-x-auto border border-surface-container-highest bg-surface-container-lowest px-3 py-2">
          <span className="shrink-0 border-r border-surface-container-highest pr-3 text-[10px] font-semibold uppercase tracking-widest text-secondary">A–Z Index</span>
          <div className="flex items-center gap-0.5">
            {["all", ...ALPHABET].map((letter) => (
              <button
                type="button"
                key={letter}
                aria-label={letter === "all" ? "All surnames" : `Surnames beginning with ${letter}`}
                aria-pressed={filters.letter === letter}
                onClick={() => updateParameter("letter", letter)}
                className={`min-h-8 min-w-7 shrink-0 px-2 text-xs transition-colors ${filters.letter === letter ? "bg-primary font-semibold text-white" : "text-on-surface hover:bg-surface-container-low"}`}
              >{letter === "all" ? "ALL" : letter}</button>
            ))}
          </div>
        </nav>
        {activeFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
            <span>{filteredPeople.length} {filteredPeople.length === 1 ? "individual matches" : "individuals match"} your filters</span>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 py-1 font-medium text-on-surface underline decoration-outline-variant underline-offset-4 hover:decoration-on-surface"><Icon name="close" className="h-3 w-3" /> Clear all filters</button>
          </div>
        )}
      </section>

      <section aria-label="People register" className="overflow-hidden border border-surface-container-highest bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">Family records sorted by surname, given name, and record ID. Filtered results appear ten per page.</caption>
            <thead>
              <tr className="border-b border-surface-container-highest bg-surface-container-low text-[10px] font-semibold uppercase tracking-wider text-secondary">
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">Ref ID</th>
                <th scope="col" className="px-4 py-3">Full name &amp; vital dates</th>
                <th scope="col" className="hidden px-4 py-3 md:table-cell">Generation &amp; lineage</th>
                <th scope="col" className="hidden px-4 py-3 lg:table-cell">Recorded vitals</th>
                <th scope="col" className="hidden px-4 py-3 lg:table-cell">Kinship</th>
                <th scope="col" className="px-4 py-3 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {pagination.items.map((person) => (
                <tr key={person.id} className="transition-colors hover:bg-surface-container-low/50">
                  <td className="hidden px-4 py-4 font-mono text-[11px] text-secondary sm:table-cell">{person.id}</td>
                  <th scope="row" className="px-4 py-4 text-left font-normal">
                    <Link href={`/people/${encodeURIComponent(person.id)}`} className="font-headline text-xl font-medium leading-tight hover:underline hover:decoration-outline-variant hover:underline-offset-4">{person.displayName}</Link>
                    <div className="mt-1 text-[11px] text-secondary">{lifeYears(person)}</div>
                    <div className="mt-1 text-[10px] text-secondary sm:hidden">{person.id}</div>
                  </th>
                  <td className="hidden max-w-56 px-4 py-4 md:table-cell">
                    <span className="inline-flex bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold">{person.generation !== undefined ? `Gen ${person.generation}` : "Generation unavailable"}</span>
                    <div className="mt-1.5 text-[11px] leading-relaxed text-secondary">{person.id === archive.rootId ? "Ancestry root" : person.branchIds.slice(-1).map((id) => <Link key={id} href={`/tree?branch=${encodeURIComponent(id)}`} className="underline decoration-outline-variant underline-offset-4 hover:text-on-surface">{branchLabels.get(id)} branch</Link>)}</div>
                  </td>
                  <td className="hidden max-w-56 px-4 py-4 lg:table-cell">
                    <div className="text-[11px] leading-relaxed text-secondary">
                      {person.birth?.date || person.birth?.place?.name ? <div><span className="font-medium text-on-surface">Born</span> {[person.birth.date, person.birth.place?.name].filter(Boolean).join(" · ")}</div> : null}
                      {person.death?.date || person.death?.place?.name ? <div className={person.birth?.date || person.birth?.place?.name ? "mt-1" : undefined}><span className="font-medium text-on-surface">Died</span> {[person.death.date, person.death.place?.name].filter(Boolean).join(" · ")}</div> : null}
                      {!person.birth?.date && !person.birth?.place?.name && !person.death?.date && !person.death?.place?.name ? <div>Dates and places unavailable</div> : null}
                    </div>
                    <div className="mt-1.5 text-[10px] text-secondary">{person.isDeceased ? "Death recorded" : "No death recorded"}</div>
                  </td>
                  <td className="hidden px-4 py-4 text-[11px] leading-relaxed text-secondary lg:table-cell">
                    <div>{person.parentIds.length} {person.parentIds.length === 1 ? "parent" : "parents"} · {person.spouseIds.length} {person.spouseIds.length === 1 ? "partner" : "partners"}</div>
                    <div>{person.childIds.length} {person.childIds.length === 1 ? "child" : "children"} · {person.siblingIds.length} {person.siblingIds.length === 1 ? "sibling" : "siblings"}</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/people/${encodeURIComponent(person.id)}`} aria-label={`Inspect ${person.displayName}`} className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap border border-surface-container-highest bg-surface-container-low px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-surface-container-high">Inspect <Icon name="arrow-right" className="h-3.5 w-3.5 text-secondary" /></Link>
                  </td>
                </tr>
              ))}
              {pagination.items.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <h2 className="font-headline text-3xl">No matching individuals</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">Try another spelling, a record ID, or fewer filters to explore the register.</p>
                  <button type="button" onClick={resetFilters} className="mt-5 bg-primary px-4 py-2.5 text-xs font-medium text-white">Show all individuals</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-surface-container-highest bg-surface-container-low px-4 py-3 text-xs sm:flex-row">
          <p role="status" className="text-secondary">Showing <span className="font-medium text-on-surface">{pagination.total ? `${pagination.start}–${pagination.end}` : "0"}</span> of <span className="font-medium text-on-surface">{pagination.total}</span> records</p>
          {pagination.pageCount > 1 && (
            <nav aria-label="Directory pagination" className="flex flex-wrap items-center justify-center gap-1">
              <button type="button" disabled={pagination.page <= 1} onClick={() => updateParameter("page", String(pagination.page - 1))} className="inline-flex min-h-8 items-center gap-1 border border-surface-container-highest bg-surface-container-lowest px-2 py-1 text-secondary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"><Icon name="chevron-left" className="h-3.5 w-3.5" /><span className="hidden sm:inline">Previous</span><span className="sr-only sm:hidden">Previous page</span></button>
              {pageNumbers(pagination.page, pagination.pageCount).map((page) => typeof page === "number" ? (
                <button type="button" key={page} aria-label={`Page ${page}`} aria-current={page === pagination.page ? "page" : undefined} onClick={() => updateParameter("page", String(page))} className={`min-h-8 min-w-8 px-2 py-1 ${page === pagination.page ? "bg-primary font-semibold text-white" : "border border-surface-container-highest bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"}`}>{page}</button>
              ) : <span key={page} aria-hidden="true" className="px-0.5 text-secondary">…</span>)}
              <button type="button" disabled={pagination.page >= pagination.pageCount} onClick={() => updateParameter("page", String(pagination.page + 1))} className="inline-flex min-h-8 items-center gap-1 border border-surface-container-highest bg-surface-container-lowest px-2 py-1 text-secondary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"><span className="hidden sm:inline">Next</span><span className="sr-only sm:hidden">Next page</span><Icon name="chevron-right" className="h-3.5 w-3.5" /></button>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
