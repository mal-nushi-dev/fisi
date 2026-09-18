import { describe, expect, it } from "vitest";
import { filterPeople, matchesPerson, paginate } from "@/lib/presentation/search";
import type { DirectoryFilters } from "@/lib/presentation/types";
import { archiveFixture } from "./fixtures";

const filters: DirectoryFilters = { query: "", branch: "all", generation: "all", status: "all", letter: "all" };
const archive = archiveFixture([
  { id: "I2", givenName: "Éva", surname: "Álpha", displayName: "Éva Álpha", children: ["I3"], birth: { date: "ABT 1920" }, isDeceased: true },
  { id: "I3", givenName: "Beta", surname: "", displayName: "Beta", death: { date: "1987" }, isDeceased: true },
  { id: "I10", givenName: "Eva", surname: "Alpha", displayName: "Eva Alpha" },
]);

describe("archive browsing", () => {
  it("matches names with accents, IDs and available birth or death years", () => {
    expect(filterPeople(archive.people, { ...filters, query: " eva " }).map((p) => p.id)).toEqual(["I10", "I2"]);
    expect(filterPeople(archive.people, { ...filters, query: "i3" }).map((p) => p.id)).toEqual(["I3"]);
    expect(filterPeople(archive.people, { ...filters, query: "1920" }).map((p) => p.id)).toEqual(["I2"]);
    expect(filterPeople(archive.people, { ...filters, query: "1987" }).map((p) => p.id)).toEqual(["I3"]);
    expect(matchesPerson(archive.people.find((p) => p.id === "I10")!, "1920")).toBe(false);
  });
  it("combines branch, generation, status, query and surname initial filters", () => {
    expect(filterPeople(archive.people, { query: "beta", branch: "I2", generation: "2", status: "deceased", letter: "B" }).map((p) => p.id)).toEqual(["I3"]);
    expect(filterPeople(archive.people, { ...filters, status: "unrecorded" }).map((p) => p.id)).toEqual(["I10"]);
    expect(filterPeople(archive.people, { ...filters, query: "no-such-name" })).toEqual([]);
  });
  it("orders equal names by numeric ID without mutating input", () => {
    const records = archiveFixture([{ id: "I10", givenName: "Same" }, { id: "I2", givenName: "Same" }]).people.reverse();
    const original = records.map((p) => p.id);
    expect(filterPeople(records, filters).map((p) => p.id)).toEqual(["I2", "I10"]);
    expect(records.map((p) => p.id)).toEqual(original);
  });
  it("paginates ten at a time and clamps invalid pages", () => {
    const records = Array.from({ length: 23 }, (_, index) => index);
    expect(paginate(records, 2)).toMatchObject({ items: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], page: 2, pageCount: 3, start: 11, end: 20 });
    expect(paginate(records, 999)).toMatchObject({ page: 3, start: 21, end: 23 });
    expect(paginate(records, NaN).page).toBe(1);
    expect(paginate(records, -4).page).toBe(1);
    expect(paginate([], 9)).toMatchObject({ items: [], total: 0, start: 0, end: 0, page: 1 });
  });
});
