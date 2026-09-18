import { describe, expect, it } from "vitest";
import { descendantIds } from "@/lib/presentation/archive";
import { archiveFixture } from "./fixtures";

describe("archive presentation model", () => {
  it("aligns partners with ancestry generations and derives branches without dates", () => {
    const archive = archiveFixture([
      { id: "I1", spouseFamilyIds: ["F1"] },
      { id: "I2", parents: ["I1"], spouses: ["I10"], parentFamilyId: "F1", spouseFamilyIds: ["F2"] },
      { id: "I10", spouseFamilyIds: ["F2"] },
      { id: "I3", parents: ["I2", "I10"], parentFamilyId: "F2" },
    ]);
    expect(archive.rootId).toBe("I1");
    expect(archive.generations).toEqual([1, 2, 3]);
    expect(archive.people.find((p) => p.id === "I10")?.generation).toBe(2);
    expect(archive.branches.find((branch) => branch.id === "I2")?.personIds).toEqual(["I2", "I3", "I10"]);
    expect(archive.people.every((p) => p.birthYear === undefined && p.birth === undefined)).toBe(true);
  });

  it("selects roots by descendant count, depth, then numeric ID", () => {
    const archive = archiveFixture([
      { id: "I10", children: ["I11", "I12"] }, { id: "I11" }, { id: "I12" },
      { id: "I2", children: ["I3"] }, { id: "I3", children: ["I4"] }, { id: "I4" },
    ]);
    expect(archive.rootId).toBe("I2");
    expect(archiveFixture([{ id: "I10" }, { id: "I2" }]).rootId).toBe("I2");
  });

  it("counts shared descendants once and includes spouses without their unrelated children", () => {
    const archive = archiveFixture([
      { id: "A", children: ["B", "C"] }, { id: "B", children: ["D"] },
      { id: "C", children: ["D"] }, { id: "D", spouses: ["E"] },
      { id: "E", children: ["F"] }, { id: "F" },
    ]);
    expect(descendantIds(archive.people, "A")).toEqual(["B", "C", "D"]);
    expect(archive.branches.find((b) => b.id === "A")?.personIds).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("tolerates missing, repeated, and self references", () => {
    const archive = archiveFixture([{ id: "A", parents: ["missing", "A"], spouses: ["missing"], children: ["B", "B"] }, { id: "B" }]);
    const person = archive.people.find((p) => p.id === "A")!;
    expect(person.parentIds).toEqual([]);
    expect(person.spouseIds).toEqual([]);
    expect(person.childIds).toEqual(["B"]);
    expect(archive.people.find((p) => p.id === "B")?.parentIds).toEqual(["A"]);
  });

  it("terminates cycles without manufacturing a generation", () => {
    const archive = archiveFixture([{ id: "A", children: ["B"] }, { id: "B", children: ["A"] }]);
    expect(descendantIds(archive.people, "A")).toEqual(["B"]);
    expect(archive.generations).toEqual([]);
    expect(archive.people.every((p) => p.generation === undefined)).toBe(true);
  });

  it("handles an empty archive", () => {
    expect(archiveFixture([])).toEqual({ people: [], branches: [], generations: [], rootId: undefined });
  });
});
