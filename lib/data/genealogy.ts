/**
 * @file genealogy.ts
 * @description Data Access Layer (DAL) / Repository for genealogy queries.
 *
 * Architectural Boundary:
 * - UI components and Next.js pages MUST NEVER access raw JSON files or database drivers directly.
 * - All queries for individuals, families, relatives, and search indexes flow through typed functions in this module.
 * - This provides a strict seam: future data storage changes (e.g. SQLite, Postgres) only require modifying this file.
 */

import {
  SanitizedPerson,
  SanitizedFamily,
  GenealogyData,
  SearchEntry,
  PersonRelatives,
  PersonSummary,
} from "../gedcom/types";
import rawGenealogyData from "../../data/generated/genealogy.json";
import rawSearchIndex from "../../data/generated/search-index.json";
import { extractYear } from "../privacy/visibility";

const data = rawGenealogyData as unknown as GenealogyData;
const searchIndex = rawSearchIndex as unknown as SearchEntry[];

/**
 * Retrieves all non-excluded individuals in the genealogy tree.
 *
 * @returns Array of sanitized person objects
 */
export function getAllPeople(): SanitizedPerson[] {
  return Object.values(data.people);
}

/**
 * Retrieves a single person by their unique identifier (e.g. "I33").
 *
 * @param id - Unique person identifier
 * @returns SanitizedPerson or null if not found
 */
export function getPerson(id: string): SanitizedPerson | null {
  return data.people[id] ?? null;
}

/**
 * Returns all person IDs available for static pre-rendering in Next.js `generateStaticParams`.
 *
 * @returns Array of string IDs
 */
export function getAllPersonIds(): string[] {
  return Object.keys(data.people);
}

/**
 * Retrieves a single family record by its family ID (e.g. "F13").
 *
 * @param id - Unique family identifier
 * @returns SanitizedFamily or null if not found
 */
export function getFamily(id: string): SanitizedFamily | null {
  return data.families[id] ?? null;
}

/**
 * Retrieves the full sanitized client search index.
 *
 * @returns Array of SearchEntry items sorted alphabetically
 */
export function getSearchIndex(): SearchEntry[] {
  return searchIndex;
}

/**
 * Converts a SanitizedPerson entity into a compact PersonSummary for navigation cards.
 *
 * @param person - Full sanitized person model
 * @returns Summary object with basic vitals
 */
function toPersonSummary(person: SanitizedPerson): PersonSummary {
  const birthYear = extractYear(person.birth?.date);
  const deathYear = extractYear(person.death?.date);

  return {
    id: person.id,
    displayName: person.displayName,
    sex: person.sex,
    birthYear,
    deathYear,
    isDeceased: person.isDeceased,
    photoUrl: person.photoUrl,
  };
}

/**
 * Resolves immediate family relations for a given person:
 * - Parents (father, mother) from FAMC
 * - Spouses/Partners from FAMS
 * - Children from FAMS
 * - Siblings from FAMC (excluding self)
 *
 * @param personId - Identifier of the subject individual
 * @returns PersonRelatives structure containing resolved relative arrays
 */
export function getRelatives(personId: string): PersonRelatives {
  const person = getPerson(personId);
  const relatives: PersonRelatives = {
    parents: [],
    spouses: [],
    children: [],
    siblings: [],
  };

  if (!person) return relatives;

  // 1. Resolve Parents and Siblings (from parentFamilyId / FAMC)
  if (person.parentFamilyId) {
    const parentFam = getFamily(person.parentFamilyId);
    if (parentFam) {
      if (parentFam.husbandId) {
        const father = getPerson(parentFam.husbandId);
        if (father) relatives.parents.push(toPersonSummary(father));
      }
      if (parentFam.wifeId) {
        const mother = getPerson(parentFam.wifeId);
        if (mother) relatives.parents.push(toPersonSummary(mother));
      }
      for (const childId of parentFam.childIds) {
        if (childId !== person.id) {
          const sibling = getPerson(childId);
          if (sibling) relatives.siblings.push(toPersonSummary(sibling));
        }
      }
    }
  }

  // 2. Resolve Spouses and Children (from spouseFamilyIds / FAMS)
  const seenSpouseIds = new Set<string>();
  const seenChildIds = new Set<string>();

  for (const famId of person.spouseFamilyIds) {
    const fam = getFamily(famId);
    if (!fam) continue;

    // Resolve Spouse / Partner
    const spouseId = fam.husbandId === person.id ? fam.wifeId : fam.husbandId;
    if (spouseId && !seenSpouseIds.has(spouseId)) {
      seenSpouseIds.add(spouseId);
      const spouse = getPerson(spouseId);
      if (spouse) relatives.spouses.push(toPersonSummary(spouse));
    }

    // Resolve Children
    for (const childId of fam.childIds) {
      if (!seenChildIds.has(childId)) {
        seenChildIds.add(childId);
        const child = getPerson(childId);
        if (child) relatives.children.push(toPersonSummary(child));
      }
    }
  }

  return relatives;
}

/**
 * Computes high-level statistics and aggregate metrics for the family tree overview.
 *
 * @returns Summary metrics object
 */
export function getTreeStats() {
  const people = getAllPeople();
  const families = Object.values(data.families);

  const years: number[] = [];
  let photosCount = 0;
  let maleCount = 0;
  let femaleCount = 0;

  for (const p of people) {
    if (p.photoUrl) photosCount++;
    if (p.sex === "M") maleCount++;
    if (p.sex === "F") femaleCount++;

    const bYear = extractYear(p.birth?.date);
    if (bYear) years.push(bYear);
  }

  years.sort((a, b) => a - b);

  return {
    totalPeople: people.length,
    totalFamilies: families.length,
    photosCount,
    maleCount,
    femaleCount,
    earliestBirthYear: years.length > 0 ? years[0] : undefined,
    latestBirthYear: years.length > 0 ? years[years.length - 1] : undefined,
    generatedAt: data.meta.generatedAt,
  };
}
