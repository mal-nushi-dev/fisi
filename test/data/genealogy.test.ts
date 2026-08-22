/**
 * @file genealogy.test.ts
 * @description Unit tests for Data Access Layer (DAL) queries.
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
  it("retrieves all people and search index", () => {
    const people = getAllPeople();
    const index = getSearchIndex();

    expect(people.length).toBe(128);
    expect(index.length).toBe(128);
  });

  it("retrieves a specific person by ID", () => {
    const person = getPerson("I33");
    expect(person).toBeDefined();
    expect(person?.id).toBe("I33");
    expect(person?.displayName).toBe("Shpetim Ramadani");
  });

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

  it("computes tree statistics accurately", () => {
    const stats = getTreeStats();
    expect(stats.totalPeople).toBe(128);
    expect(stats.totalFamilies).toBe(40);
    expect(stats.photosCount).toBeGreaterThanOrEqual(1);
    expect(stats.earliestBirthYear).toBeDefined();
  });
});
