/**
 * @file parser.test.ts
 * @description Unit tests for GEDCOM 7.0.3 parser.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { parseGedcom, parseCoordinate } from "../../lib/gedcom/parser";

describe("GEDCOM Parser", () => {
  it("handles coordinate conversions properly", () => {
    expect(parseCoordinate("E21.096111")).toBeCloseTo(21.096111);
    expect(parseCoordinate("W83.651389")).toBeCloseTo(-83.651389);
    expect(parseCoordinate("N42.663889")).toBeCloseTo(42.663889);
    expect(parseCoordinate("S12.345678")).toBeCloseTo(-12.345678);
    expect(parseCoordinate(undefined)).toBeUndefined();
    expect(parseCoordinate("")).toBeUndefined();
  });

  it("handles CR, LF, and CRLF line endings", () => {
    const sampleCR =
      "0 HEAD\r1 SOUR Test\r0 @I1@ INDI\r1 NAME Test /Person/\r2 GIVN Test\r2 SURN Person\r1 SEX M\r0 TRLR";
    const parsed = parseGedcom(sampleCR);
    expect(parsed.people).toHaveLength(1);
    expect(parsed.people[0].id).toBe("I1");
    expect(parsed.people[0].givenName).toBe("Test");
    expect(parsed.people[0].surname).toBe("Person");
    expect(parsed.people[0].sex).toBe("M");
  });

  it("parses actual Nushi-Genealogy.ged file with 128 individuals, 40 families, and 5 media objects", () => {
    const gedcomPath = path.join(
      process.cwd(),
      "Nushi-Genealogy",
      "Nushi-Genealogy.ged",
    );
    const content = fs.readFileSync(gedcomPath, "utf8");
    const result = parseGedcom(content);

    expect(result.people).toHaveLength(128);
    expect(result.families).toHaveLength(40);
    expect(Object.keys(result.media)).toHaveLength(5);

    // Verify a specific individual, e.g., I33 (Shpetim Ramadani)
    const i33 = result.people.find((p) => p.id === "I33");
    expect(i33).toBeDefined();
    expect(i33?.givenName).toBe("Shpetim");
    expect(i33?.surname).toBe("Ramadani");
    expect(i33?.sex).toBe("M");
    expect(i33?.spouseFamilyIds).toContain("F13");

    // Verify an individual with birth date, death date, and coordinates, e.g. I7 (Adem Nushi)
    const i7 = result.people.find((p) => p.id === "I7");
    expect(i7).toBeDefined();
    expect(i7?.givenName).toBe("Adem");
    expect(i7?.surname).toBe("Nushi");
    expect(i7?.birth?.date).toBe("1889");
    expect(i7?.death?.date).toBe("1953");
    expect(i7?.birth?.place?.latitude).toBeCloseTo(42.380278);
    expect(i7?.birth?.place?.longitude).toBeCloseTo(20.430833);

    // Verify media links, e.g. I62 (Refik Nushi) has OBJE 71244345
    const i62 = result.people.find((p) => p.id === "I62");
    expect(i62?.photoFile).toBe("71244345.png");
    expect(i62?.photoCrop).toEqual({
      top: 300,
      left: 54,
      height: 131,
      width: 101,
    });
  });
});
