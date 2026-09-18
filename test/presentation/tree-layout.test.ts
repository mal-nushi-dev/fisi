import { describe, expect, it } from "vitest";
import { createTreeLayout, getBranchPersonIds } from "@/lib/presentation/tree-layout";
import { buildArchiveModel } from "@/lib/presentation/archive";
import { getAllPeople, getRelatives } from "@/lib/data/genealogy";
import { archiveFixture } from "./fixtures";

describe("family tree layout", () => {
  it("groups partners by family and links single-parent families", () => {
    const archive = archiveFixture([
      { id: "A", spouses: ["B"], spouseFamilyIds: ["F1"] },
      { id: "B", spouseFamilyIds: ["F1"] },
      { id: "C", parents: ["A", "B"], parentFamilyId: "F1", spouseFamilyIds: ["F2"] },
      { id: "D", parents: ["C"], parentFamilyId: "F2" },
    ]);
    const layout = createTreeLayout(archive.people);
    expect(layout.nodes.find((node) => node.id === "family:F1")?.personIds).toEqual(["A", "B"]);
    expect(layout.nodes.find((node) => node.id === "family:F2")?.personIds).toEqual(["C"]);
    expect(layout.edges.map((edge) => [edge.source, edge.target])).toEqual([["family:F1", "family:F2"], ["family:F2", "person:D"]]);
  });

  it("preserves identity across multiple unions without linking the wrong parents", () => {
    const archive = archiveFixture([
      { id: "A", spouses: ["B", "C"], spouseFamilyIds: ["F1", "F2"] },
      { id: "B", spouseFamilyIds: ["F1"] }, { id: "C", spouseFamilyIds: ["F2"] },
      { id: "D", parents: ["A", "B"], parentFamilyId: "F1" },
      { id: "E", parents: ["A", "C"], parentFamilyId: "F2" },
    ]);
    const layout = createTreeLayout(archive.people);
    expect(layout.nodes.filter((node) => node.personIds.includes("A"))).toHaveLength(2);
    expect(layout.edges.find((edge) => edge.target === "person:D")?.source).toBe("family:F1");
    expect(layout.edges.find((edge) => edge.target === "person:E")?.source).toBe("family:F2");
    expect(getBranchPersonIds(archive.people, "D")).toEqual(new Set(["D"]));
  });

  it("lays out every available archive person without overlap or mutation", () => {
    const records = getAllPeople();
    const archive = buildArchiveModel(records, Object.fromEntries(records.map((person) => [person.id, getRelatives(person.id)])));
    const before = JSON.stringify(archive);
    const layout = createTreeLayout(archive.people);
    expect(new Set(layout.nodes.flatMap((node) => node.personIds))).toEqual(new Set(records.map((person) => person.id)));
    expect(layout.columns.map((column) => column.generation)).toEqual(archive.generations);
    expect(JSON.stringify(archive)).toBe(before);
    for (const node of layout.nodes) {
      expect([node.x, node.y, node.width, node.height].every(Number.isFinite)).toBe(true);
      expect(node.x + node.width).toBeLessThanOrEqual(layout.width);
      expect(node.y + node.height).toBeLessThanOrEqual(layout.height);
      for (const other of layout.nodes.filter((other) => other.id !== node.id)) {
        expect(node.x + node.width <= other.x || other.x + other.width <= node.x || node.y + node.height <= other.y || other.y + other.height <= node.y).toBe(true);
      }
    }
  });

  it("handles cycles, absent relatives, and empty branches", () => {
    const archive = archiveFixture([{ id: "A", children: ["B", "missing"] }, { id: "B", children: ["A"] }]);
    const layout = createTreeLayout(archive.people);
    expect(layout.nodes).toHaveLength(2);
    expect(layout.edges.every((edge) => !edge.path.includes("NaN"))).toBe(true);
    expect(getBranchPersonIds(archive.people, "A")).toEqual(new Set(["A", "B"]));
    expect(createTreeLayout([]).nodes).toEqual([]);
  });
});
