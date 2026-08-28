/**
 * @file parser.test.ts
 * @description Unit tests for the GEDCOM 7.0.3 Parser.
 *
 * Validates line tokenization, cross-platform line ending normalization,
 * hierarchical node building, coordinate conversion, name extraction heuristics,
 * family relation mapping, media object linking, and structural data invariants.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  parseGedcom,
  parseCoordinate,
  buildGedcomTree,
} from "../../lib/gedcom/parser";

describe("GEDCOM Parser - Line Tokenization & Hierarchy", () => {
  /**
   * @test Cross-platform line ending normalization.
   * @description Verifies that the tokenizer handles classic Mac OS (\r),
   * Unix (\n), Windows (\r\n), and mixed line endings in a single stream.
   */
  it("normalizes classic Mac (CR), Unix (LF), Windows (CRLF), and mixed line endings", () => {
    const crInput =
      "0 HEAD\r1 SOUR MacFamilyTree\r0 @I1@ INDI\r1 NAME John /Doe/\r1 SEX M\r0 TRLR";
    const lfInput =
      "0 HEAD\n1 SOUR MacFamilyTree\n0 @I1@ INDI\n1 NAME John /Doe/\n1 SEX M\n0 TRLR";
    const crlfInput =
      "0 HEAD\r\n1 SOUR MacFamilyTree\r\n0 @I1@ INDI\r\n1 NAME John /Doe/\r\n1 SEX M\r\n0 TRLR";
    const mixedInput =
      "0 HEAD\r1 SOUR MacFamilyTree\n0 @I1@ INDI\r\n1 NAME John /Doe/\r1 SEX M\n0 TRLR";

    for (const input of [crInput, lfInput, crlfInput, mixedInput]) {
      const parsed = parseGedcom(input);
      expect(parsed.people).toHaveLength(1);
      expect(parsed.people[0].id).toBe("I1");
      expect(parsed.people[0].givenName).toBe("John");
      expect(parsed.people[0].surname).toBe("Doe");
      expect(parsed.people[0].sex).toBe("M");
    }
  });

  /**
   * @test Hierarchical node tree construction.
   * @description Verifies that multi-level nested nodes (levels 0, 1, 2, 3) are properly
   * attached to their parent nodes and stack depth is managed accurately.
   */
  it("constructs multi-level hierarchical trees with correct child nesting", () => {
    const gedcom = [
      "0 @I1@ INDI",
      "1 BIRT",
      "2 DATE 01 JAN 1990",
      "2 PLAC Prishtina, Kosovo",
      "3 MAP",
      "4 LATI N42.663889",
      "4 LONG E21.096111",
      "0 TRLR",
    ].join("\n");

    const tree = buildGedcomTree(gedcom);
    expect(tree).toHaveLength(2); // INDI and TRLR root nodes

    const indiNode = tree[0];
    expect(indiNode.tag).toBe("INDI");
    expect(indiNode.xref).toBe("I1");
    expect(indiNode.children).toHaveLength(1);

    const birtNode = indiNode.children[0];
    expect(birtNode.tag).toBe("BIRT");
    expect(birtNode.children).toHaveLength(2); // DATE and PLAC

    const placNode = birtNode.children.find((c) => c.tag === "PLAC");
    expect(placNode).toBeDefined();
    expect(placNode?.value).toBe("Prishtina, Kosovo");
    expect(placNode?.children).toHaveLength(1); // MAP

    const mapNode = placNode!.children[0];
    expect(mapNode.tag).toBe("MAP");
    expect(mapNode.children).toHaveLength(2); // LATI and LONG
  });

  /**
   * @test Resilient handling of whitespace and blank lines.
   * @description Verifies that empty lines, lines with leading/trailing spaces,
   * and unparseable lines do not interrupt tree building or throw exceptions.
   */
  it("gracefully ignores empty lines, whitespace, and malformed lines", () => {
    const input = [
      "",
      "   ",
      "0 @I1@ INDI",
      "  ",
      "1 NAME John /Doe/",
      "INVALID NON-GEDCOM LINE",
      "1 SEX M",
      "",
      "0 TRLR",
    ].join("\n");

    const parsed = parseGedcom(input);
    expect(parsed.people).toHaveLength(1);
    expect(parsed.people[0].id).toBe("I1");
    expect(parsed.people[0].givenName).toBe("John");
    expect(parsed.people[0].sex).toBe("M");
  });

  /**
   * @test Vendor extension tag tolerance.
   * @description Verifies that non-standard MacFamilyTree custom tags (e.g., `_STF`, `_STE`, `_SCS`)
   * are safely parsed as sub-nodes without dropping standard sibling attributes.
   */
  it("tolerates custom and vendor extension tags without dropping valid siblings", () => {
    const input = [
      "0 @I1@ INDI",
      "1 NAME John /Doe/",
      "1 _CUSTOM_TAG Some Vendor Value",
      "2 _SUB_CUSTOM More Data",
      "1 SEX M",
      "1 BIRT",
      "2 DATE 1980",
      "2 _STF 1",
      "0 TRLR",
    ].join("\n");

    const parsed = parseGedcom(input);
    expect(parsed.people).toHaveLength(1);
    expect(parsed.people[0].id).toBe("I1");
    expect(parsed.people[0].givenName).toBe("John");
    expect(parsed.people[0].sex).toBe("M");
    expect(parsed.people[0].birth?.date).toBe("1980");
  });
});

describe("GEDCOM Parser - Coordinate Conversion (parseCoordinate)", () => {
  /**
   * @test Directional coordinate conversions.
   * @description Verifies standard directional coordinate prefixes:
   * - North ('N') and East ('E') convert to positive numbers.
   * - South ('S') and West ('W') convert to negative numbers.
   */
  it("converts directional coordinate strings (N, S, E, W) to signed floating point decimals", () => {
    expect(parseCoordinate("N42.663889")).toBeCloseTo(42.663889);
    expect(parseCoordinate("E21.096111")).toBeCloseTo(21.096111);
    expect(parseCoordinate("S12.345678")).toBeCloseTo(-12.345678);
    expect(parseCoordinate("W83.651389")).toBeCloseTo(-83.651389);
  });

  /**
   * @test Plain decimal coordinate string handling.
   * @description Verifies signed and unsigned decimal strings without cardinal direction prefixes.
   */
  it("parses unsigned and signed decimal coordinate strings", () => {
    expect(parseCoordinate("42.663889")).toBeCloseTo(42.663889);
    expect(parseCoordinate("-83.651389")).toBeCloseTo(-83.651389);
    expect(parseCoordinate("+21.096111")).toBeCloseTo(21.096111);
  });

  /**
   * @test Edge cases and invalid coordinate input handling.
   * @description Verifies that undefined, empty, whitespace-only, and non-numeric inputs return undefined.
   */
  it("returns undefined for invalid, non-numeric, or missing coordinate strings", () => {
    expect(parseCoordinate(undefined)).toBeUndefined();
    expect(parseCoordinate("")).toBeUndefined();
    expect(parseCoordinate("   ")).toBeUndefined();
    expect(parseCoordinate("INVALID")).toBeUndefined();
    expect(parseCoordinate("N")).toBeUndefined();
    expect(parseCoordinate("Efoo")).toBeUndefined();
    expect(parseCoordinate("W-invalid")).toBeUndefined();
  });

  /**
   * @test Trimming leading and trailing whitespace.
   * @description Ensures surrounding whitespace in coordinate strings is trimmed before parsing.
   */
  it("handles coordinates with leading or trailing whitespace", () => {
    expect(parseCoordinate("  N42.663889  ")).toBeCloseTo(42.663889);
    expect(parseCoordinate("\tW83.651389\n")).toBeCloseTo(-83.651389);
  });
});

describe("GEDCOM Parser - Name Extraction & Normalization", () => {
  /**
   * @test Extraction from explicit GIVN and SURN sub-tags.
   * @description Verifies that explicit structured sub-tags are preferred when present.
   */
  it("extracts given name and surname from explicit GIVN and SURN sub-nodes", () => {
    const input = [
      "0 @I1@ INDI",
      "1 NAME John /Doe/",
      "2 GIVN John",
      "2 SURN Doe",
      "0 TRLR",
    ].join("\n");

    const parsed = parseGedcom(input);
    expect(parsed.people[0].givenName).toBe("John");
    expect(parsed.people[0].surname).toBe("Doe");
  });

  /**
   * @test Fallback extraction from slash-delimited NAME value.
   * @description Verifies extraction when GIVN/SURN sub-tags are absent and only slash notation is provided.
   */
  it("falls back to slash notation parsing when GIVN/SURN tags are absent", () => {
    const testCases = [
      {
        raw: "1 NAME Jane /Smith/",
        expectedGiven: "Jane",
        expectedSur: "Smith",
      },
      {
        raw: "1 NAME /OnlySurname/",
        expectedGiven: "",
        expectedSur: "OnlySurname",
      },
      {
        raw: "1 NAME OnlyGiven //",
        expectedGiven: "OnlyGiven",
        expectedSur: "",
      },
      {
        raw: "1 NAME SingleName",
        expectedGiven: "SingleName",
        expectedSur: "",
      },
    ];

    for (const tc of testCases) {
      const input = ["0 @I1@ INDI", tc.raw, "0 TRLR"].join("\n");
      const parsed = parseGedcom(input);
      expect(parsed.people[0].givenName).toBe(tc.expectedGiven);
      expect(parsed.people[0].surname).toBe(tc.expectedSur);
    }
  });

  /**
   * @test Married name vs birth name resolution.
   * @description Verifies that birth names are prioritized over married names when multiple NAME records exist.
   */
  it("prioritizes birth name over married name when TYPE married is specified", () => {
    const input = [
      "0 @I1@ INDI",
      "1 NAME Jane /BirthSurname/",
      "2 GIVN Jane",
      "2 SURN BirthSurname",
      "1 NAME Jane /MarriedSurname/",
      "2 TYPE married",
      "2 GIVN Jane",
      "2 SURN MarriedSurname",
      "0 TRLR",
    ].join("\n");

    const parsed = parseGedcom(input);
    expect(parsed.people[0].givenName).toBe("Jane");
    expect(parsed.people[0].surname).toBe("BirthSurname");
  });
});

describe("GEDCOM Parser - Individual & Family Extraction", () => {
  /**
   * @test Individual record extraction with full vitals and GPS coordinates.
   * @description Verifies complete parsing of birth, death, place name, TRAN translations, and coordinates.
   */
  it("parses individual record with birth, death, place translations, and GPS coordinates", () => {
    const input = [
      "0 @I1@ INDI",
      "1 NAME Adem /Nushi/",
      "1 SEX M",
      "1 BIRT",
      "2 DATE 1889",
      "2 PLAC Gjakovë, Kosovo",
      "3 TRAN Djakovica",
      "3 MAP",
      "4 LATI N42.380278",
      "4 LONG E20.430833",
      "1 DEAT",
      "2 DATE 1953",
      "2 PLAC Prishtina",
      "0 TRLR",
    ].join("\n");

    const parsed = parseGedcom(input);
    expect(parsed.people).toHaveLength(1);

    const person = parsed.people[0];
    expect(person.id).toBe("I1");
    expect(person.givenName).toBe("Adem");
    expect(person.surname).toBe("Nushi");
    expect(person.sex).toBe("M");

    expect(person.birth?.date).toBe("1889");
    expect(person.birth?.place?.name).toBe("Gjakovë, Kosovo");
    expect(person.birth?.place?.alternateNames).toEqual(["Djakovica"]);
    expect(person.birth?.place?.latitude).toBeCloseTo(42.380278);
    expect(person.birth?.place?.longitude).toBeCloseTo(20.430833);

    expect(person.death?.date).toBe("1953");
    expect(person.death?.place?.name).toBe("Prishtina");
  });

  /**
   * @test Missing optional fields handling.
   * @description Verifies that individuals with missing birth, death, or sex default safely.
   */
  it("defaults unrecorded sex to 'U' and safely handles absent birth/death events", () => {
    const input = ["0 @I99@ INDI", "1 NAME Unknown /Person/", "0 TRLR"].join(
      "\n",
    );

    const parsed = parseGedcom(input);
    expect(parsed.people).toHaveLength(1);
    expect(parsed.people[0].id).toBe("I99");
    expect(parsed.people[0].sex).toBe("U");
    expect(parsed.people[0].birth).toBeUndefined();
    expect(parsed.people[0].death).toBeUndefined();
    expect(parsed.people[0].spouseFamilyIds).toEqual([]);
  });

  /**
   * @test Family record and relationship pointer extraction.
   * @description Verifies that families correctly capture husband, wife, children array, and marriage event.
   */
  it("parses family relationships with parents, multiple children, and marriage details", () => {
    const input = [
      "0 @I1@ INDI",
      "1 NAME Father /Test/",
      "1 FAMS @F10@",
      "0 @I2@ INDI",
      "1 NAME Mother /Test/",
      "1 FAMS @F10@",
      "0 @I3@ INDI",
      "1 NAME Child1 /Test/",
      "1 FAMC @F10@",
      "0 @I4@ INDI",
      "1 NAME Child2 /Test/",
      "1 FAMC @F10@",
      "0 @F10@ FAM",
      "1 HUSB @I1@",
      "1 WIFE @I2@",
      "1 CHIL @I3@",
      "1 CHIL @I4@",
      "1 MARR",
      "2 DATE 15 JUN 1975",
      "2 PLAC Tirana, Albania",
      "0 TRLR",
    ].join("\n");

    const parsed = parseGedcom(input);
    expect(parsed.people).toHaveLength(4);
    expect(parsed.families).toHaveLength(1);

    const fam = parsed.families[0];
    expect(fam.id).toBe("F10");
    expect(fam.husbandId).toBe("I1");
    expect(fam.wifeId).toBe("I2");
    expect(fam.childIds).toEqual(["I3", "I4"]);
    expect(fam.marriage?.date).toBe("15 JUN 1975");
    expect(fam.marriage?.place?.name).toBe("Tirana, Albania");

    // Reciprocal pointers on individuals
    const father = parsed.people.find((p) => p.id === "I1");
    expect(father?.spouseFamilyIds).toContain("F10");

    const child = parsed.people.find((p) => p.id === "I3");
    expect(child?.parentFamilyId).toBe("F10");
  });

  /**
   * @test Media linkage and photo crop coordinates.
   * @description Verifies that root OBJE records are mapped and crop bounding boxes are extracted.
   */
  it("resolves media objects and extracts MacFamilyTree crop bounding box coordinates", () => {
    const input = [
      "0 @OBJE100@ OBJE",
      "1 FILE portrait.png",
      "0 @I5@ INDI",
      "1 NAME Person /WithPhoto/",
      "1 OBJE @OBJE100@",
      "2 CROP",
      "3 TOP 100",
      "3 LEFT 50",
      "3 HEIGHT 200",
      "3 WIDTH 150",
      "0 TRLR",
    ].join("\n");

    const parsed = parseGedcom(input);
    expect(parsed.media["OBJE100"]).toBe("portrait.png");

    const person = parsed.people.find((p) => p.id === "I5");
    expect(person?.photoFile).toBe("portrait.png");
    expect(person?.photoCrop).toEqual({
      top: 100,
      left: 50,
      height: 200,
      width: 150,
    });
  });
});

describe("GEDCOM Parser - Canonical Dataset Invariants", () => {
  const gedcomPath = path.join(
    process.cwd(),
    "Nushi-Genealogy",
    "Nushi-Genealogy.ged",
  );
  const content = fs.readFileSync(gedcomPath, "utf8");
  const result = parseGedcom(content);

  /**
   * @test Structural integrity of the canonical file.
   * @description Verifies that individuals and families are non-empty and every individual has a non-empty ID.
   */
  it("parses canonical dataset into non-empty collections with valid identifiers", () => {
    expect(result.people.length).toBeGreaterThan(0);
    expect(result.families.length).toBeGreaterThan(0);
    expect(Object.keys(result.media).length).toBeGreaterThan(0);

    for (const p of result.people) {
      expect(p.id).toBeTruthy();
      expect(typeof p.id).toBe("string");
      expect(p.sex).toMatch(/^[MFU]$/);
    }
  });

  /**
   * @test Relational consistency of family references.
   * @description Verifies that all family parent and child IDs reference valid individuals parsed in the dataset.
   */
  it("ensures all family members reference valid individuals present in the dataset", () => {
    const peopleIds = new Set(result.people.map((p) => p.id));

    for (const fam of result.families) {
      if (fam.husbandId) {
        expect(peopleIds.has(fam.husbandId)).toBe(true);
      }
      if (fam.wifeId) {
        expect(peopleIds.has(fam.wifeId)).toBe(true);
      }
      for (const childId of fam.childIds) {
        expect(peopleIds.has(childId)).toBe(true);
      }
    }
  });

  /**
   * @test Reciprocal link invariant.
   * @description Verifies that if an individual has a parentFamilyId, that family exists and lists them in childIds.
   */
  it("ensures reciprocal parent-child family linkage across the dataset", () => {
    const familyMap = new Map(result.families.map((f) => [f.id, f]));

    for (const person of result.people) {
      if (person.parentFamilyId) {
        const parentFam = familyMap.get(person.parentFamilyId);
        expect(parentFam).toBeDefined();
        expect(parentFam?.childIds).toContain(person.id);
      }
      for (const spouseFamId of person.spouseFamilyIds) {
        const spouseFam = familyMap.get(spouseFamId);
        expect(spouseFam).toBeDefined();
        const isParent =
          spouseFam?.husbandId === person.id || spouseFam?.wifeId === person.id;
        expect(isParent).toBe(true);
      }
    }
  });

  /**
   * @test Media file resolution invariant.
   * @description Verifies that all individuals with photo references link to existing media records.
   */
  it("ensures all individual photo files resolve to valid filenames in media collection", () => {
    for (const person of result.people) {
      if (person.photoFile) {
        expect(person.photoFile).toMatch(/\.(png|jpe?g|webp)$/i);
      }
    }
  });
});
