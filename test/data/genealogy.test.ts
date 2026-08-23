/**
 * @file genealogy.test.ts
 * @description Unit tests for the Data Access Layer (DAL).
 *
 * Validates that pre-generated static genealogy data is queried accurately,
 * including individual retrieval, relationship graph resolution (spouses,
 * parents, children, siblings), search indices, and aggregate tree statistics.
 */

import { describe, it, expect } from "vitest";
import {
  getAllPeople,
  getPerson,
  getRelatives,
  getSearchIndex,
  getTreeStats,
} from "../../lib/data/genealogy";

describe("Data Access Layer (DAL)", () => {
  /**
   * @test Retrieves complete list of individuals and search index items.
   * @description Verifies that `getAllPeople()` and `getSearchIndex()` return
   * the full set of sanitized individuals (128 records) with corresponding
   * search index entries for fast lookup across the application.
   */
  it("retrieves all people and search index", () => {
    const people = getAllPeople();
    const index = getSearchIndex();

    expect(people.length).toBe(128);
    expect(index.length).toBe(128);
  });

  /**
   * @test Retrieves a specific individual by their unique GEDCOM ID.
   * @description Tests `getPerson(id)` with known identifier `I33`, ensuring
   * the record exists, the ID matches, and the formatted `displayName` is properly resolved.
   */
  it("retrieves a specific person by ID", () => {
    const person = getPerson("I33");
    expect(person).toBeDefined();
    expect(person?.id).toBe("I33");
    expect(person?.displayName).toBe("Shpetim Ramadani");
  });

  /**
   * @test Resolves direct familial relationships for individuals.
   * @description Tests `getRelatives(id)` across multi-generational relationships:
   * 1. Validates spouse and children links for parent individual `I33` (Shpetim) in family `F13`.
   * 2. Validates parents and sibling resolution for child individual `I35` (Deon).
   */
  it("resolves relatives (parents, spouse, children, siblings) correctly", () => {
    // Shpetim (I33) is married to Laura (I32) and has children Deon (I35) and Desea (I34) in F13
    const relatives = getRelatives("I33");
    expect(relatives.spouses.some((s) => s.id === "I32")).toBe(true);
    expect(relatives.children.some((c) => c.id === "I35")).toBe(true);
    expect(relatives.children.some((c) => c.id === "I34")).toBe(true);

    // Deon (I35) has parents Shpetim (I33) and Laura (I32) and sibling Desea (I34)
    const deonRelatives = getRelatives("I35");
    expect(deonRelatives.parents.some((p) => p.id === "I33")).toBe(true);
    expect(deonRelatives.parents.some((p) => p.id === "I32")).toBe(true);
    expect(deonRelatives.siblings.some((s) => s.id === "I34")).toBe(true);
  });

  /**
   * @test Computes aggregate metrics and summary stats for the family tree.
   * @description Verifies `getTreeStats()` accurately aggregates total people count,
   * total family units, presence of photos, and calculation of earliest recorded birth year.
   */
  it("computes tree statistics accurately", () => {
    const stats = getTreeStats();
    expect(stats.totalPeople).toBe(128);
    expect(stats.totalFamilies).toBe(40);
    expect(stats.photosCount).toBeGreaterThanOrEqual(1);
    expect(stats.earliestBirthYear).toBeDefined();
  });
});

