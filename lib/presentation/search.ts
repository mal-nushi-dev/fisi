import type { ArchivePerson, DirectoryFilters } from "./types";

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("en");
}

export function matchesPerson(person: ArchivePerson, query: string): boolean {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [person.displayName, person.id, person.birthYear?.toString(), person.deathYear?.toString()]
    .some((value) => value !== undefined && normalizeSearch(value).includes(normalized));
}

export function filterPeople(people: readonly ArchivePerson[], filters: DirectoryFilters): ArchivePerson[] {
  return people.filter((person) => {
    if (!matchesPerson(person, filters.query)) return false;
    if (filters.branch !== "all" && !person.branchIds.includes(filters.branch)) return false;
    if (filters.generation !== "all" && String(person.generation) !== filters.generation) return false;
    if (filters.status === "deceased" && !person.isDeceased) return false;
    if (filters.status === "unrecorded" && person.isDeceased) return false;
    if (filters.letter !== "all" && !normalizeSearch(person.surname || person.givenName || person.displayName)
      .startsWith(normalizeSearch(filters.letter))) return false;
    return true;
  }).sort((a, b) => (a.surname || a.givenName).localeCompare(b.surname || b.givenName, "en") ||
    a.givenName.localeCompare(b.givenName, "en") || a.id.localeCompare(b.id, "en", { numeric: true }));
}

export function paginate<T>(items: readonly T[], requestedPage: number, pageSize = 10) {
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10;
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const offset = (page - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    page,
    pageCount,
    total: items.length,
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + size, items.length),
  };
}
