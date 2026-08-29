/**
 * @file visibility.ts
 * @description Privacy and Visibility Engine for Genealogy data sanitization.
 *
 * 🔒 Privacy Architecture & Security Model:
 * 1. Build-Time Enforcement: Sanitization runs during `npm run build-data` (prebuild).
 *    Redacted fields (birth dates, birth places, map coordinates, private photos) are
 *    physically omitted from the emitted JSON files (`genealogy.json`, `search-index.json`).
 * 2. Zero Runtime Leakage: Because the client bundle only receives the pre-sanitized JSON,
 *    no amount of client-side inspection, DevTools modifications, or reverse engineering
 *    can recover redacted data. The raw GEDCOM never reaches the browser.
 * 3. Default Policy:
 *    - Deceased individuals (`isDeceased: true`) -> sensitive fields default to "visible".
 *    - Living individuals (`isDeceased: false`) -> sensitive fields default to "hidden".
 * 4. Explicit Overrides (`data/visibility-overrides.json`):
 *    - `overrides[id].fields.<field>` -> explicitly overrides default visibility per field.
 *    - `overrides[id].exclude: true` -> completely omits person from all output.
 */

import {
  RawPerson,
  RawFamily,
  SanitizedPerson,
  SanitizedFamily,
  SearchEntry,
  VisibilityOverrides,
  SensitiveField,
  VisibilityState,
  Place,
} from "../gedcom/types";

/**
 * Resolved field-level visibility calculation for a person.
 */
export interface ResolvedPersonVisibility {
  /** If true, person will not appear in the static site or search index */
  isExcluded: boolean;
  /** Explicit or defaulted visibility states per sensitive field */
  fieldVisibility: Record<SensitiveField, VisibilityState>;
  /** Whether the person is considered deceased */
  isDeceased: boolean;
}

/**
 * Extracts a 4-digit calendar year from a variety of GEDCOM date formats.
 *
 * @example
 * extractYear("01 NOV 1952") // => 1952
 * extractYear("1969")        // => 1969
 * extractYear("ABT 1938")    // => 1938
 *
 * @param dateStr - Raw date string
 * @returns Parsed 4-digit year as a number, or undefined
 */
export function extractYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/\b(1\d{3}|20\d{2})\b/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Evaluates the effective visibility for all sensitive fields of a person.
 *
 * Precedence Rule:
 * 1. If person is excluded via `overrides[id].exclude`, person is excluded.
 * 2. Explicit field overrides in `overrides[id].fields` win over default policy.
 * 3. Default policy: visible if person has a recorded death event, hidden otherwise.
 *
 * @param person - Raw parsed person entity
 * @param overridesConfig - Loaded visibility-overrides.json configuration
 * @returns ResolvedPersonVisibility object
 */
export function resolvePersonVisibility(
  person: RawPerson,
  overridesConfig: VisibilityOverrides,
): ResolvedPersonVisibility {
  const personOverride = overridesConfig.overrides?.[person.id];

  if (personOverride?.exclude) {
    return {
      isExcluded: true,
      fieldVisibility: {
        birthDate: "hidden",
        birthPlace: "hidden",
        deathDate: "hidden",
        deathPlace: "hidden",
        photo: "hidden",
        mapCoordinates: "hidden",
      },
      isDeceased: Boolean(person.death),
    };
  }

  const isDeceased = Boolean(person.death);
  // Default rule: sensitive fields visible if deceased, hidden if living
  const defaultVisibility: VisibilityState = isDeceased ? "visible" : "hidden";

  const fieldVisibility: Record<SensitiveField, VisibilityState> = {
    birthDate: personOverride?.fields?.birthDate ?? defaultVisibility,
    birthPlace: personOverride?.fields?.birthPlace ?? defaultVisibility,
    deathDate: personOverride?.fields?.deathDate ?? defaultVisibility,
    deathPlace: personOverride?.fields?.deathPlace ?? defaultVisibility,
    photo: personOverride?.fields?.photo ?? defaultVisibility,
    mapCoordinates: personOverride?.fields?.mapCoordinates ?? defaultVisibility,
  };

  return {
    isExcluded: false,
    fieldVisibility,
    isDeceased,
  };
}

/**
 * Strips latitude and longitude GPS coordinates from a Place object if coordinates are hidden.
 *
 * @param place - Raw place record
 * @param allowCoords - Whether coordinates are authorized for export
 * @returns Sanitized Place or undefined
 */
function sanitizePlace(
  place: Place | undefined,
  allowCoords: boolean,
): Place | undefined {
  if (!place) return undefined;
  const { latitude, longitude, ...rest } = place;
  if (allowCoords) {
    return {
      ...rest,
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
    };
  }
  return rest;
}

/**
 * Applies privacy redaction to an individual person record.
 * Returns null if the person is marked for exclusion.
 *
 * @param person - Raw parsed person entity
 * @param visibility - Resolved field visibility rules
 * @returns SanitizedPerson ready for JSON export, or null if excluded
 */
export function sanitizePerson(
  person: RawPerson,
  visibility: ResolvedPersonVisibility,
): SanitizedPerson | null {
  if (visibility.isExcluded) {
    return null;
  }

  const displayName =
    [person.givenName, person.surname].filter(Boolean).join(" ") || person.id;

  const allowBirthDate = visibility.fieldVisibility.birthDate === "visible";
  const allowBirthPlace = visibility.fieldVisibility.birthPlace === "visible";
  const allowDeathDate = visibility.fieldVisibility.deathDate === "visible";
  const allowDeathPlace = visibility.fieldVisibility.deathPlace === "visible";
  const allowCoords = visibility.fieldVisibility.mapCoordinates === "visible";
  const allowPhoto = visibility.fieldVisibility.photo === "visible";

  // Redact birth information
  let birth: SanitizedPerson["birth"] = undefined;
  if (person.birth) {
    const date = allowBirthDate ? person.birth.date : undefined;
    const place = allowBirthPlace
      ? sanitizePlace(person.birth.place, allowCoords)
      : undefined;

    if (date || place) {
      birth = {
        ...(date ? { date } : {}),
        ...(place ? { place } : {}),
      };
    }
  }

  // Redact death information
  let death: SanitizedPerson["death"] = undefined;
  if (person.death) {
    const date = allowDeathDate ? person.death.date : undefined;
    const place = allowDeathPlace
      ? sanitizePlace(person.death.place, allowCoords)
      : undefined;

    if (date || place) {
      death = {
        ...(date ? { date } : {}),
        ...(place ? { place } : {}),
      };
    }
  }

  // Authorize public photo path only if photo is marked visible
  const photoUrl =
    allowPhoto && person.photoFile ? `/photos/${person.id}.webp` : undefined;

  return {
    id: person.id,
    givenName: person.givenName,
    surname: person.surname,
    displayName,
    sex: person.sex,
    isDeceased: visibility.isDeceased,
    ...(birth ? { birth } : {}),
    ...(death ? { death } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(person.parentFamilyId ? { parentFamilyId: person.parentFamilyId } : {}),
    spouseFamilyIds: person.spouseFamilyIds,
  };
}

/**
 * Sanitizes entire genealogy dataset and produces sanitized domain models,
 * client search index, and a map of authorized media files.
 *
 * @param rawPeople - Array of raw parsed individuals
 * @param rawFamilies - Array of raw parsed families
 * @param overridesConfig - Loaded visibility overrides configuration
 * @returns Sanitized datasets and list of authorized photos for processing
 */
export function sanitizeGenealogy(
  rawPeople: RawPerson[],
  rawFamilies: RawFamily[],
  overridesConfig: VisibilityOverrides,
): {
  people: Record<string, SanitizedPerson>;
  families: Record<string, SanitizedFamily>;
  searchIndex: SearchEntry[];
  visiblePhotoMap: Record<
    string,
    { photoFile: string; crop?: RawPerson["photoCrop"] }
  >;
} {
  const people: Record<string, SanitizedPerson> = {};
  const visiblePhotoMap: Record<
    string,
    { photoFile: string; crop?: RawPerson["photoCrop"] }
  > = {};
  const searchEntries: SearchEntry[] = [];
  const excludedPersonIds = new Set<string>();

  for (const rawPerson of rawPeople) {
    const visibility = resolvePersonVisibility(rawPerson, overridesConfig);
    if (visibility.isExcluded) {
      excludedPersonIds.add(rawPerson.id);
      continue;
    }

    const sanitized = sanitizePerson(rawPerson, visibility);
    if (sanitized) {
      people[sanitized.id] = sanitized;

      // Only schedule photo processing if photo field resolved to visible
      if (
        visibility.fieldVisibility.photo === "visible" &&
        rawPerson.photoFile
      ) {
        visiblePhotoMap[rawPerson.id] = {
          photoFile: rawPerson.photoFile,
          crop: rawPerson.photoCrop,
        };
      }

      // Populate search entry with birth year only if birthDate is authorized
      const birthYear =
        visibility.fieldVisibility.birthDate === "visible"
          ? extractYear(rawPerson.birth?.date)
          : undefined;

      searchEntries.push({
        id: sanitized.id,
        displayName: sanitized.displayName,
        ...(birthYear !== undefined ? { birthYear } : {}),
      });
    }
  }

  // Sort search index alphabetically by surname, then given name
  searchEntries.sort((a, b) => {
    const personA = people[a.id];
    const personB = people[b.id];
    const surnameA = personA?.surname || "";
    const surnameB = personB?.surname || "";
    const compareSurname = surnameA.localeCompare(surnameB, undefined, {
      sensitivity: "base",
    });
    if (compareSurname !== 0) return compareSurname;
    const givenA = personA?.givenName || "";
    const givenB = personB?.givenName || "";
    return givenA.localeCompare(givenB, undefined, { sensitivity: "base" });
  });

  // Sanitize family links (strip references to excluded individuals)
  const families: Record<string, SanitizedFamily> = {};
  for (const rawFam of rawFamilies) {
    const husbandId =
      rawFam.husbandId && !excludedPersonIds.has(rawFam.husbandId)
        ? rawFam.husbandId
        : undefined;
    const wifeId =
      rawFam.wifeId && !excludedPersonIds.has(rawFam.wifeId)
        ? rawFam.wifeId
        : undefined;
    const childIds = rawFam.childIds.filter(
      (cid) => !excludedPersonIds.has(cid),
    );

    // If all family members are excluded, drop the family record
    if (!husbandId && !wifeId && childIds.length === 0) {
      continue;
    }

    families[rawFam.id] = {
      id: rawFam.id,
      ...(husbandId ? { husbandId } : {}),
      ...(wifeId ? { wifeId } : {}),
      childIds,
      ...(rawFam.marriage ? { marriage: rawFam.marriage } : {}),
    };
  }

  return {
    people,
    families,
    searchIndex: searchEntries,
    visiblePhotoMap,
  };
}
