/**
 * @file genealogy.test.ts
 * @description Unit tests for the Data Access Layer (DAL).
 *
 * Validates repository query contracts, non-happy-path fallbacks (null on missing IDs),
 * search index integrity, relationship graph traversal invariants (reciprocal parent-child,
 * spouses, and siblings), and tree summary metric consistency.
 */

import { describe, it, expect } from "vitest";
import {
  getAllPeople,
  getPerson,
  getAllPersonIds,
  getFamily,
  getRelatives,
  getSearchIndex,
  getTreeStats,
} from "../../lib/data/genealogy";

describe("Data Access Layer - Individual Repository Contract", () => {
  /**
   * @test Retrieval of all people.
   * @description Verifies that getAllPeople returns non-empty collection of valid sanitized person records.
   */
  it("retrieves complete list of sanitized individuals satisfying schema invariants", () => {
    const people = getAllPeople();
    expect(people.length).toBeGreaterThan(0);

    for (const p of people) {
      expect(p.id).toBeTruthy();
      expect(p.displayName).toBeTruthy();
      expect(["M", "F", "U"]).toContain(p.sex);
      expect(typeof p.isDeceased).toBe("boolean");
      expect(Array.isArray(p.spouseFamilyIds)).toBe(true);
    }
  });

  /**
   * @test Individual lookup by ID and missing ID fallback.
   * @description Verifies that getPerson returns the matching person for valid ID, and null for non-existent ID.
   */
  it("returns person entity for existing ID, and null for non-existent ID without throwing", () => {
    const all = getAllPeople();
    const firstPerson = all[0];
    expect(firstPerson).toBeDefined();

    const retrieved = getPerson(firstPerson.id);
    expect(retrieved).toEqual(firstPerson);

    const nonExistent = getPerson("NON_EXISTENT_ID_9999");
    expect(nonExistent).toBeNull();
  });

  /**
   * @test ID list consistency.
   * @description Verifies that getAllPersonIds matches the ID set of getAllPeople 1-to-1.
   */
  it("returns person ID array that exactly matches getAllPeople collection", () => {
    const ids = getAllPersonIds();
    const people = getAllPeople();

    expect(ids.length).toBe(people.length);
    const peopleIdSet = new Set(people.map((p) => p.id));
    for (const id of ids) {
      expect(peopleIdSet.has(id)).toBe(true);
    }
  });
});

describe("Data Access Layer - Family & Search Index Contract", () => {
  /**
   * @test Family retrieval by ID and missing ID fallback.
   * @description Verifies getFamily returns the family for valid ID, and null for invalid ID.
   */
  it("retrieves family record for valid ID and returns null for unknown ID", () => {
    const people = getAllPeople();
    const personWithFamily = people.find((p) => p.parentFamilyId);
    expect(personWithFamily).toBeDefined();

    const family = getFamily(personWithFamily!.parentFamilyId!);
    expect(family).toBeDefined();
    expect(family?.id).toBe(personWithFamily!.parentFamilyId);
    expect(Array.isArray(family?.childIds)).toBe(true);

    const missingFam = getFamily("NON_EXISTENT_FAMILY_XYZ");
    expect(missingFam).toBeNull();
  });

  /**
   * @test Search index consistency.
   * @description Verifies that all entries in the search index refer to existing people in the tree.
   */
  it("ensures every search index entry references a valid person in the dataset", () => {
    const index = getSearchIndex();
    const people = getAllPeople();
    const peopleMap = new Map(people.map((p) => [p.id, p]));

    expect(index.length).toBe(people.length);

    for (const entry of index) {
      const person = peopleMap.get(entry.id);
      expect(person).toBeDefined();
      expect(entry.displayName).toBe(person?.displayName);
      if (entry.birthYear !== undefined) {
        expect(entry.birthYear).toBeGreaterThan(1700);
        expect(entry.birthYear).toBeLessThan(2100);
      }
    }
  });
});

describe("Data Access Layer - Relationship Graph Resolution & Invariants", () => {
  /**
   * @test Reciprocal parent-child relationship resolution.
   * @description Verifies that if person A has parent B, then person B has child A in getRelatives.
   */
  it("maintains reciprocal parent-child relationship invariants across relatives query", () => {
    const people = getAllPeople();
    const childWithParents = people.find(
      (p) => p.parentFamilyId && getRelatives(p.id).parents.length > 0,
    );
    expect(childWithParents).toBeDefined();

    const childRelatives = getRelatives(childWithParents!.id);
    expect(childRelatives.parents.length).toBeGreaterThan(0);

    for (const parentSummary of childRelatives.parents) {
      const parentRelatives = getRelatives(parentSummary.id);
      const childFound = parentRelatives.children.some(
        (c) => c.id === childWithParents!.id,
      );
      expect(childFound).toBe(true);
    }
  });

  /**
   * @test Reciprocal spouse resolution.
   * @description Verifies that if person A lists B as a spouse, B lists A as a spouse.
   */
  it("maintains reciprocal spouse relationship invariants", () => {
    const people = getAllPeople();
    const personWithSpouse = people.find(
      (p) => getRelatives(p.id).spouses.length > 0,
    );
    expect(personWithSpouse).toBeDefined();

    const relatives = getRelatives(personWithSpouse!.id);
    for (const spouseSummary of relatives.spouses) {
      const spouseRelatives = getRelatives(spouseSummary.id);
      const reciprocalFound = spouseRelatives.spouses.some(
        (s) => s.id === personWithSpouse!.id,
      );
      expect(reciprocalFound).toBe(true);
    }
  });

  /**
   * @test Sibling relationship resolution.
   * @description Verifies that siblings share the same parent family and exclude the subject person themselves.
   */
  it("resolves siblings correctly while excluding the subject individual", () => {
    const people = getAllPeople();
    const personWithSiblings = people.find(
      (p) => getRelatives(p.id).siblings.length > 0,
    );

    if (personWithSiblings) {
      const relatives = getRelatives(personWithSiblings.id);
      // Self must not appear in siblings list
      expect(
        relatives.siblings.every((s) => s.id !== personWithSiblings.id),
      ).toBe(true);

      for (const sib of relatives.siblings) {
        const sibRelatives = getRelatives(sib.id);
        expect(
          sibRelatives.siblings.some((s) => s.id === personWithSiblings.id),
        ).toBe(true);
      }
    }
  });

  /**
   * @test Graceful fallback for non-existent individual.
   * @description Verifies getRelatives returns empty arrays for an unknown person ID without throwing.
   */
  it("returns empty relationship arrays when querying an unknown person ID", () => {
    const relatives = getRelatives("NON_EXISTENT_ID");
    expect(relatives.parents).toEqual([]);
    expect(relatives.spouses).toEqual([]);
    expect(relatives.children).toEqual([]);
    expect(relatives.siblings).toEqual([]);
  });
});

describe("Data Access Layer - Tree Aggregate Statistics Invariants", () => {
  /**
   * @test Consistency of aggregate tree metrics.
   * @description Verifies that computed tree statistics are mathematically consistent with the underlying dataset.
   */
  it("computes aggregate statistics that satisfy mathematical invariants", () => {
    const stats = getTreeStats();
    const people = getAllPeople();

    // Total people must match exact collection length
    expect(stats.totalPeople).toBe(people.length);
    expect(stats.totalFamilies).toBeGreaterThan(0);

    // Photos count must be non-negative and not exceed total people
    expect(stats.photosCount).toBeGreaterThanOrEqual(0);
    expect(stats.photosCount).toBeLessThanOrEqual(stats.totalPeople);

    // Gender counts must sum to <= total people (since sex can be 'U')
    expect(stats.maleCount + stats.femaleCount).toBeLessThanOrEqual(
      stats.totalPeople,
    );

    // Earliest birth year must be <= latest birth year if both exist
    if (stats.earliestBirthYear && stats.latestBirthYear) {
      expect(stats.earliestBirthYear).toBeLessThanOrEqual(
        stats.latestBirthYear,
      );
    }
  });
});
