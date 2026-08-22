/**
 * @file visibility.test.ts
 * @description Unit tests for Privacy and Visibility Engine.
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
