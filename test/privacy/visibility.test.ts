/**
 * @file visibility.test.ts
 * @description Unit tests for the Privacy and Visibility Engine.
 *
 * Validates date extraction, default policy resolution (living vs. deceased),
 * explicit configuration overrides, individual sanitization, field redaction,
 * coordinate stripping, search index generation, and dataset-level cascading exclusions.
 */

import { describe, it, expect } from "vitest";
import {
  RawPerson,
  RawFamily,
  VisibilityOverrides,
} from "../../lib/gedcom/types";
import {
  extractYear,
  resolvePersonVisibility,
  sanitizePerson,
  sanitizeGenealogy,
} from "../../lib/privacy/visibility";

describe("Privacy & Visibility - Date & Year Extraction (extractYear)", () => {
  /**
   * @test Extraction across diverse GEDCOM date formats.
   * @description Verifies extraction of 4-digit calendar years from standard, approximate, and range date strings.
   */
  it("extracts 4-digit calendar year from standard and approximate date strings", () => {
    expect(extractYear("01 NOV 1952")).toBe(1952);
    expect(extractYear("1969")).toBe(1969);
    expect(extractYear("ABT 1938")).toBe(1938);
    expect(extractYear("BET 1910 AND 1915")).toBe(1910);
    expect(extractYear("MAY 1920")).toBe(1920);
    expect(extractYear("15 JUN 2005")).toBe(2005);
    expect(extractYear("1889")).toBe(1889);
  });

  /**
   * @test Handling of empty, malformed, or missing date strings.
   * @description Verifies that undefined, empty, or non-date text returns undefined.
   */
  it("returns undefined for invalid, non-year, empty, or missing date values", () => {
    expect(extractYear(undefined)).toBeUndefined();
    expect(extractYear("")).toBeUndefined();
    expect(extractYear("   ")).toBeUndefined();
    expect(extractYear("Unknown Date")).toBeUndefined();
    expect(extractYear("Circa Spring")).toBeUndefined();
  });
});

describe("Privacy & Visibility - Default Policy Resolution", () => {
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
   * @test Default masking for living individuals.
   * @description Verifies that living individuals (no recorded death event) have all sensitive fields marked 'hidden'.
   */
  it("defaults all sensitive fields to 'hidden' for living individuals without death event", () => {
    const livingPerson: RawPerson = {
      id: "I1",
      givenName: "John",
      surname: "Doe",
      sex: "M",
      birth: {
        date: "01 JAN 1990",
        place: { name: "Prishtina", latitude: 42.66, longitude: 21.09 },
      },
      photoFile: "john.png",
      spouseFamilyIds: [],
    };

    const vis = resolvePersonVisibility(livingPerson, baseConfig);
    expect(vis.isExcluded).toBe(false);
    expect(vis.isDeceased).toBe(false);
    expect(vis.fieldVisibility.birthDate).toBe("hidden");
    expect(vis.fieldVisibility.birthPlace).toBe("hidden");
    expect(vis.fieldVisibility.deathDate).toBe("hidden");
    expect(vis.fieldVisibility.deathPlace).toBe("hidden");
    expect(vis.fieldVisibility.photo).toBe("hidden");
    expect(vis.fieldVisibility.mapCoordinates).toBe("hidden");
  });

  /**
   * @test Default visibility for deceased individuals.
   * @description Verifies that individuals with an explicit death event have all sensitive fields marked 'visible'.
   */
  it("defaults all sensitive fields to 'visible' for deceased individuals with death event", () => {
    const deceasedPerson: RawPerson = {
      id: "I2",
      givenName: "Jane",
      surname: "Doe",
      sex: "F",
      birth: { date: "1920", place: { name: "Gjakovë" } },
      death: { date: "2000", place: { name: "Prishtina" } },
      photoFile: "jane.png",
      spouseFamilyIds: [],
    };

    const vis = resolvePersonVisibility(deceasedPerson, baseConfig);
    expect(vis.isExcluded).toBe(false);
    expect(vis.isDeceased).toBe(true);
    expect(vis.fieldVisibility.birthDate).toBe("visible");
    expect(vis.fieldVisibility.birthPlace).toBe("visible");
    expect(vis.fieldVisibility.deathDate).toBe("visible");
    expect(vis.fieldVisibility.deathPlace).toBe("visible");
    expect(vis.fieldVisibility.photo).toBe("visible");
    expect(vis.fieldVisibility.mapCoordinates).toBe("visible");
  });

  /**
   * @test Deceased identification with empty death record.
   * @description Verifies that a person with an empty death object (e.g. `death: {}`) is correctly identified as deceased.
   */
  it("recognizes person as deceased when death event is present even if date is unrecorded", () => {
    const personWithEmptyDeath: RawPerson = {
      id: "I3",
      givenName: "Ancestor",
      surname: "Old",
      sex: "M",
      death: {},
      spouseFamilyIds: [],
    };

    const vis = resolvePersonVisibility(personWithEmptyDeath, baseConfig);
    expect(vis.isDeceased).toBe(true);
    expect(vis.fieldVisibility.birthDate).toBe("visible");
  });
});

describe("Privacy & Visibility - Explicit Configuration Overrides", () => {
  const livingPerson: RawPerson = {
    id: "I1",
    givenName: "John",
    surname: "Doe",
    sex: "M",
    birth: { date: "1990", place: { name: "Tirana" } },
    photoFile: "john.png",
    spouseFamilyIds: [],
  };

  /**
   * @test Field-level override precedence.
   * @description Verifies that explicit field overrides in visibility-overrides.json take precedence over living default policy.
   */
  it("applies explicit field overrides taking precedence over living default policy", () => {
    const config: VisibilityOverrides = {
      version: 1,
      defaultPolicy: { sensitiveFields: ["birthDate", "photo"] },
      overrides: {
        I1: {
          fields: {
            birthDate: "visible",
            photo: "visible",
          },
        },
      },
    };

    const vis = resolvePersonVisibility(livingPerson, config);
    expect(vis.fieldVisibility.birthDate).toBe("visible");
    expect(vis.fieldVisibility.photo).toBe("visible");
    expect(vis.fieldVisibility.birthPlace).toBe("hidden");
  });

  /**
   * @test Partial field overrides.
   * @description Verifies that overriding one field leaves non-overridden fields in their default policy state.
   */
  it("preserves default policy state for fields not explicitly overridden", () => {
    const config: VisibilityOverrides = {
      version: 1,
      defaultPolicy: { sensitiveFields: ["photo"] },
      overrides: {
        I1: {
          fields: {
            photo: "visible",
          },
        },
      },
    };

    const vis = resolvePersonVisibility(livingPerson, config);
    expect(vis.fieldVisibility.photo).toBe("visible");
    expect(vis.fieldVisibility.birthDate).toBe("hidden");
    expect(vis.fieldVisibility.birthPlace).toBe("hidden");
    expect(vis.fieldVisibility.mapCoordinates).toBe("hidden");
  });

  /**
   * @test Exclusion override precedence.
   * @description Verifies that `exclude: true` marks isExcluded true and sets all fields to hidden.
   */
  it("flags individual as excluded and hides all fields when exclude: true", () => {
    const config: VisibilityOverrides = {
      version: 1,
      defaultPolicy: { sensitiveFields: [] },
      overrides: {
        I1: {
          exclude: true,
        },
      },
    };

    const vis = resolvePersonVisibility(livingPerson, config);
    expect(vis.isExcluded).toBe(true);
    expect(vis.fieldVisibility.birthDate).toBe("hidden");
    expect(vis.fieldVisibility.photo).toBe("hidden");
  });

  /**
   * @test Empty override object handling.
   * @description Verifies that an override entry without field configurations falls back to default policy safely.
   */
  it("handles empty person override objects gracefully without throwing", () => {
    const config: VisibilityOverrides = {
      version: 1,
      defaultPolicy: { sensitiveFields: [] },
      overrides: {
        I1: {},
      },
    };

    const vis = resolvePersonVisibility(livingPerson, config);
    expect(vis.isExcluded).toBe(false);
    expect(vis.fieldVisibility.birthDate).toBe("hidden");
  });
});

describe("Privacy & Visibility - Person Record Sanitization (sanitizePerson)", () => {
  const livingRaw: RawPerson = {
    id: "I10",
    givenName: "Deon",
    surname: "Ramadani",
    sex: "M",
    birth: {
      date: "15 APR 2010",
      place: {
        name: "Prishtina, Kosovo",
        latitude: 42.663889,
        longitude: 21.096111,
      },
    },
    photoFile: "deon.png",
    parentFamilyId: "F13",
    spouseFamilyIds: [],
  };

  /**
   * @test Excluded individual sanitization.
   * @description Verifies that sanitizePerson returns null when the visibility specifies isExcluded: true.
   */
  it("returns null for excluded individuals", () => {
    const excludedVis = {
      isExcluded: true,
      fieldVisibility: {
        birthDate: "hidden" as const,
        birthPlace: "hidden" as const,
        deathDate: "hidden" as const,
        deathPlace: "hidden" as const,
        photo: "hidden" as const,
        mapCoordinates: "hidden" as const,
      },
      isDeceased: false,
    };

    const result = sanitizePerson(livingRaw, excludedVis);
    expect(result).toBeNull();
  });

  /**
   * @test Display name construction fallbacks.
   * @description Verifies display name formatting for given+surname, given only, surname only, or fallback to ID.
   */
  it("constructs display name accurately across all name component combinations", () => {
    const vis = {
      isExcluded: false,
      fieldVisibility: {
        birthDate: "hidden" as const,
        birthPlace: "hidden" as const,
        deathDate: "hidden" as const,
        deathPlace: "hidden" as const,
        photo: "hidden" as const,
        mapCoordinates: "hidden" as const,
      },
      isDeceased: false,
    };

    const both = sanitizePerson(
      { ...livingRaw, givenName: "A", surname: "B" },
      vis,
    );
    expect(both?.displayName).toBe("A B");

    const givenOnly = sanitizePerson(
      { ...livingRaw, givenName: "A", surname: "" },
      vis,
    );
    expect(givenOnly?.displayName).toBe("A");

    const surOnly = sanitizePerson(
      { ...livingRaw, givenName: "", surname: "B" },
      vis,
    );
    expect(surOnly?.displayName).toBe("B");

    const neither = sanitizePerson(
      { ...livingRaw, givenName: "", surname: "", id: "I99" },
      vis,
    );
    expect(neither?.displayName).toBe("I99");
  });

  /**
   * @test Coordinate stripping from place objects.
   * @description Verifies that latitude and longitude are removed when mapCoordinates is hidden, but place name is kept.
   */
  it("strips GPS coordinates while preserving place name when mapCoordinates is hidden", () => {
    const vis = {
      isExcluded: false,
      fieldVisibility: {
        birthDate: "visible" as const,
        birthPlace: "visible" as const,
        deathDate: "hidden" as const,
        deathPlace: "hidden" as const,
        photo: "hidden" as const,
        mapCoordinates: "hidden" as const, // Coordinates forbidden
      },
      isDeceased: false,
    };

    const sanitized = sanitizePerson(livingRaw, vis);
    expect(sanitized?.birth?.date).toBe("15 APR 2010");
    expect(sanitized?.birth?.place?.name).toBe("Prishtina, Kosovo");
    expect(sanitized?.birth?.place?.latitude).toBeUndefined();
    expect(sanitized?.birth?.place?.longitude).toBeUndefined();
  });

  /**
   * @test Photo URL authorization.
   * @description Verifies that /photos/${id}.webp is generated only when photo visibility is authorized.
   */
  it("generates photo URL only when photo visibility is authorized and source photo exists", () => {
    const hiddenPhotoVis = {
      isExcluded: false,
      fieldVisibility: {
        birthDate: "hidden" as const,
        birthPlace: "hidden" as const,
        deathDate: "hidden" as const,
        deathPlace: "hidden" as const,
        photo: "hidden" as const,
        mapCoordinates: "hidden" as const,
      },
      isDeceased: false,
    };

    const visiblePhotoVis = {
      ...hiddenPhotoVis,
      fieldVisibility: {
        ...hiddenPhotoVis.fieldVisibility,
        photo: "visible" as const,
      },
    };

    const sanitizedHidden = sanitizePerson(livingRaw, hiddenPhotoVis);
    expect(sanitizedHidden?.photoUrl).toBeUndefined();

    const sanitizedVisible = sanitizePerson(livingRaw, visiblePhotoVis);
    expect(sanitizedVisible?.photoUrl).toBe("/photos/I10.webp");
  });

  /**
   * @test Total redaction of empty event blocks.
   * @description Verifies that birth/death objects are completely undefined when both date and place are hidden.
   */
  it("completely omits birth and death event objects if all sub-fields are redacted", () => {
    const allHiddenVis = {
      isExcluded: false,
      fieldVisibility: {
        birthDate: "hidden" as const,
        birthPlace: "hidden" as const,
        deathDate: "hidden" as const,
        deathPlace: "hidden" as const,
        photo: "hidden" as const,
        mapCoordinates: "hidden" as const,
      },
      isDeceased: false,
    };

    const sanitized = sanitizePerson(livingRaw, allHiddenVis);
    expect(sanitized?.birth).toBeUndefined();
    expect(sanitized?.death).toBeUndefined();
  });
});

describe("Privacy & Visibility - Full Dataset Sanitization (sanitizeGenealogy)", () => {
  const p1: RawPerson = {
    id: "I1",
    givenName: "Adem",
    surname: "Nushi",
    sex: "M",
    birth: { date: "1889", place: { name: "Gjakovë" } },
    death: { date: "1953" },
    photoFile: "adem.png",
    spouseFamilyIds: ["F1"],
  };

  const p2: RawPerson = {
    id: "I2",
    givenName: "Living",
    surname: "Child",
    sex: "M",
    birth: { date: "2015" },
    parentFamilyId: "F1",
    spouseFamilyIds: [],
  };

  const p3: RawPerson = {
    id: "I3",
    givenName: "Excluded",
    surname: "Person",
    sex: "F",
    spouseFamilyIds: ["F2"],
  };

  const f1: RawFamily = {
    id: "F1",
    husbandId: "I1",
    childIds: ["I2"],
  };

  const f2: RawFamily = {
    id: "F2",
    wifeId: "I3",
    childIds: [],
  };

  const configWithExclude: VisibilityOverrides = {
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
    overrides: {
      I3: {
        exclude: true,
      },
    },
  };

  /**
   * @test Search index generation and alphabetical sorting.
   * @description Verifies that search index includes birth year only for authorized persons and is sorted by surname then given name.
   */
  it("generates search index sorted alphabetically by surname then given name with redacted birth years", () => {
    const result = sanitizeGenealogy([p1, p2, p3], [f1, f2], configWithExclude);

    // I3 is excluded, so only I1 and I2 exist in search index
    expect(result.searchIndex).toHaveLength(2);

    // Child (living, birthDate hidden) has no birthYear in search index
    const childEntry = result.searchIndex.find((s) => s.id === "I2");
    expect(childEntry?.birthYear).toBeUndefined();

    // Adem (deceased, birthDate visible) has birthYear 1889
    const ademEntry = result.searchIndex.find((s) => s.id === "I1");
    expect(ademEntry?.birthYear).toBe(1889);

    // Sorted by surname: "Child" comes before "Nushi"
    expect(result.searchIndex[0].id).toBe("I2");
    expect(result.searchIndex[1].id).toBe("I1");
  });

  /**
   * @test Cascading exclusion removal.
   * @description Verifies that an excluded person is removed from people map, search index, and family records.
   */
  it("cascades exclusion by pruning individual from people, search index, and family relationships", () => {
    const result = sanitizeGenealogy([p1, p2, p3], [f1, f2], configWithExclude);

    expect(result.people["I3"]).toBeUndefined();
    expect(result.searchIndex.find((s) => s.id === "I3")).toBeUndefined();
    expect(result.visiblePhotoMap["I3"]).toBeUndefined();

    // F2 had only I3 as a member; since I3 is excluded, F2 is completely pruned
    expect(result.families["F2"]).toBeUndefined();

    // F1 remains intact
    expect(result.families["F1"]).toBeDefined();
    expect(result.families["F1"].husbandId).toBe("I1");
    expect(result.families["F1"].childIds).toEqual(["I2"]);
  });

  /**
   * @test Authorized visible photo map.
   * @description Verifies that visiblePhotoMap contains only photos for individuals with visible photo authorization.
   */
  it("schedules only authorized visible photos in visiblePhotoMap", () => {
    const result = sanitizeGenealogy([p1, p2, p3], [f1, f2], configWithExclude);

    // p1 is deceased (photo visible) and has adem.png
    expect(result.visiblePhotoMap["I1"]).toEqual({
      photoFile: "adem.png",
      crop: undefined,
    });

    // p2 has no photoFile, p3 is excluded
    expect(result.visiblePhotoMap["I2"]).toBeUndefined();
    expect(result.visiblePhotoMap["I3"]).toBeUndefined();
  });
});
