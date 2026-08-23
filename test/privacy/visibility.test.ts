/**
 * @file visibility.test.ts
 * @description Unit tests for the Privacy and Visibility Engine.
 *
 * Verifies default privacy rules protecting living individuals (redacting birth,
 * death, photos, and coordinates), default public visibility for deceased individuals,
 * per-person/per-field visibility overrides, and full exclusion cascading across
 * family relationships and search indices.
 */

import { describe, it, expect } from "vitest";
import {
  RawPerson,
  RawFamily,
  VisibilityOverrides,
} from "../../lib/gedcom/types";
import {
  resolvePersonVisibility,
  sanitizePerson,
  sanitizeGenealogy,
} from "../../lib/privacy/visibility";

describe("Privacy & Visibility Engine", () => {
  const livingPerson: RawPerson = {
    id: "I1",
    givenName: "John",
    surname: "Doe",
    sex: "M",
    birth: {
      date: "01 JAN 1990",
      place: {
        name: "New York, USA",
        latitude: 40.7128,
        longitude: -74.006,
      },
    },
    photoFile: "john.png",
    spouseFamilyIds: [],
  };

  const deceasedPerson: RawPerson = {
    id: "I2",
    givenName: "Jane",
    surname: "Doe",
    sex: "F",
    birth: {
      date: "15 MAY 1920",
      place: {
        name: "London, UK",
        latitude: 51.5074,
        longitude: -0.1278,
      },
    },
    death: {
      date: "20 OCT 2000",
      place: {
        name: "London, UK",
      },
    },
    photoFile: "jane.png",
    spouseFamilyIds: [],
  };

  const baseConfig: VisibilityOverrides = {
    version: 1,
    defaultPolicy: {
      sensitiveFields: [
        "birthDate",
        "birthPlace",
        "deathDate",
        "deathPlace",
        "photo",
        "mapCoordinates",
      ],
    },
    overrides: {},
  };

  /**
   * @test Default privacy policy enforcement for living individuals.
   * @description Validates that living individuals (no death record and born < 110 years ago):
   * 1. Have sensitive fields (`birthDate`, `birthPlace`, `photo`, `mapCoordinates`) resolved as `"hidden"`.
   * 2. When sanitized, their `displayName` remains visible, but sensitive fields (`birth`, `photoUrl`)
   *    are stripped (`undefined`), and `isDeceased` is marked `false`.
   */
  it("redacts sensitive fields for living person by default while preserving name", () => {
    const vis = resolvePersonVisibility(livingPerson, baseConfig);
    expect(vis.fieldVisibility.birthDate).toBe("hidden");
    expect(vis.fieldVisibility.birthPlace).toBe("hidden");
    expect(vis.fieldVisibility.photo).toBe("hidden");

    const sanitized = sanitizePerson(livingPerson, vis);
    expect(sanitized).toBeDefined();
    expect(sanitized?.displayName).toBe("John Doe");
    expect(sanitized?.birth).toBeUndefined();
    expect(sanitized?.photoUrl).toBeUndefined();
    expect(sanitized?.isDeceased).toBe(false);
  });

  /**
   * @test Default public visibility policy for deceased individuals.
   * @description Validates that deceased individuals (with explicit death event or born >= 110 years ago):
   * 1. Have all fields resolved as `"visible"`.
   * 2. When sanitized, full biographical details (dates, coordinates, places, photo URLs)
   *    are preserved, and `isDeceased` is marked `true`.
   */
  it("exposes sensitive fields for deceased person by default", () => {
    const vis = resolvePersonVisibility(deceasedPerson, baseConfig);
    expect(vis.fieldVisibility.birthDate).toBe("visible");
    expect(vis.fieldVisibility.birthPlace).toBe("visible");
    expect(vis.fieldVisibility.photo).toBe("visible");

    const sanitized = sanitizePerson(deceasedPerson, vis);
    expect(sanitized).toBeDefined();
    expect(sanitized?.displayName).toBe("Jane Doe");
    expect(sanitized?.birth?.date).toBe("15 MAY 1920");
    expect(sanitized?.birth?.place?.name).toBe("London, UK");
    expect(sanitized?.birth?.place?.latitude).toBe(51.5074);
    expect(sanitized?.death?.date).toBe("20 OCT 2000");
    expect(sanitized?.photoUrl).toBe("/photos/I2.webp");
    expect(sanitized?.isDeceased).toBe(true);
  });

  /**
   * @test Explicit per-individual field override resolution.
   * @description Validates that individual-level field overrides configured in `visibility.json`
   * take precedence over default living-person privacy masking:
   * - Setting `birthDate: "visible"` allows the birth date to be published.
   * - Setting `photo: "visible"` exposes the photo URL while keeping other sensitive fields (e.g. `birthPlace`) hidden.
   */
  it("applies explicit field overrides correctly", () => {
    const configWithOverride: VisibilityOverrides = {
      ...baseConfig,
      overrides: {
        I1: {
          fields: {
            birthDate: "visible",
            photo: "visible",
          },
        },
      },
    };

    const vis = resolvePersonVisibility(livingPerson, configWithOverride);
    expect(vis.fieldVisibility.birthDate).toBe("visible");
    expect(vis.fieldVisibility.birthPlace).toBe("hidden");
    expect(vis.fieldVisibility.photo).toBe("visible");

    const sanitized = sanitizePerson(livingPerson, vis);
    expect(sanitized?.birth?.date).toBe("01 JAN 1990");
    expect(sanitized?.birth?.place).toBeUndefined();
    expect(sanitized?.photoUrl).toBe("/photos/I1.webp");
  });

  /**
   * @test Complete exclusion of an individual from public dataset.
   * @description Verifies that configuring `exclude: true` for an individual (`I1`):
   * 1. Completely removes the individual record from `people` map.
   * 2. Strips the individual from search autocomplete index (`searchIndex`).
   * 3. Cascades removal through family records (`families`), unlinking the person
   *    as husband/wife/child without corrupting the rest of the family unit.
   */
  it("completely excludes a person when exclude: true", () => {
    const configWithExclude: VisibilityOverrides = {
      ...baseConfig,
      overrides: {
        I1: {
          exclude: true,
        },
      },
    };

    const rawFamilies: RawFamily[] = [
      {
        id: "F1",
        husbandId: "I1",
        wifeId: "I2",
        childIds: ["I1"],
      },
    ];

    const result = sanitizeGenealogy(
      [livingPerson, deceasedPerson],
      rawFamilies,
      configWithExclude,
    );
    expect(result.people["I1"]).toBeUndefined();
    expect(result.people["I2"]).toBeDefined();
    expect(result.searchIndex.find((s) => s.id === "I1")).toBeUndefined();
    expect(result.families["F1"]?.husbandId).toBeUndefined();
    expect(result.families["F1"]?.wifeId).toBe("I2");
    expect(result.families["F1"]?.childIds).toEqual([]);
  });
});

