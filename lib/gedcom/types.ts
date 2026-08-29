/**
 * @file types.ts
 * @description Core domain and privacy type definitions for the Genealogy pipeline.
 *
 * Architecture Decoupling:
 * - Domain entities represent clean genealogical models independent of the raw GEDCOM schema.
 * - Privacy types model the build-time redaction rules and field-level visibility states.
 */

/** Biological or recorded sex representation */
export type Sex = "M" | "F" | "U";

/** Geographic location with optional GPS coordinates and alternate localized names */
export interface Place {
  /** Canonical name of the place (e.g. "Gjakovë, Kosovo") */
  name: string;
  /** Latitude coordinate in decimal degrees (e.g. 42.380278) */
  latitude?: number;
  /** Longitude coordinate in decimal degrees (e.g. 20.430833) */
  longitude?: number;
  /** Translated or alternate historical place names (from GEDCOM TRAN tags) */
  alternateNames?: string[];
}

/** Life event such as birth, death, marriage, or residence */
export interface LifeEvent {
  /** Event date string as recorded in GEDCOM (e.g. "01 NOV 1952" or "1969") */
  date?: string;
  /** Place where the event occurred */
  place?: Place;
}

/**
 * Raw individual record directly parsed from GEDCOM prior to privacy sanitization.
 * Contains unredacted dates, places, and private photo references.
 */
export interface RawPerson {
  /** GEDCOM xref identifier without '@' delimiters (e.g. "I33" or "93741100") */
  id: string;
  /** Given name / first name */
  givenName: string;
  /** Family name / surname */
  surname: string;
  /** Recorded sex ('M', 'F', or 'U') */
  sex: Sex;
  /** Raw birth event details */
  birth?: LifeEvent;
  /** Raw death event details */
  death?: LifeEvent;
  /** Source photo filename in the media folder (e.g. "1728220.png") */
  photoFile?: string;
  /** MacFamilyTree crop bounding box if defined */
  photoCrop?: {
    top: number;
    left: number;
    height: number;
    width: number;
  };
  /** Family ID where this person is recorded as a child (FAMC) */
  parentFamilyId?: string;
  /** Family IDs where this person is recorded as a spouse/parent (FAMS) */
  spouseFamilyIds: string[];
}

/**
 * Raw family unit directly parsed from GEDCOM.
 */
export interface RawFamily {
  /** GEDCOM family xref identifier (e.g. "F13") */
  id: string;
  /** Person ID of the husband/father */
  husbandId?: string;
  /** Person ID of the wife/mother */
  wifeId?: string;
  /** Array of child Person IDs belonging to this family */
  childIds: string[];
  /** Marriage event details */
  marriage?: LifeEvent;
}

/**
 * Sensitive fields subject to build-time privacy redaction policies.
 */
export type SensitiveField =
  | "birthDate"
  | "birthPlace"
  | "deathDate"
  | "deathPlace"
  | "photo"
  | "mapCoordinates";

/** Visibility override state */
export type VisibilityState = "visible" | "hidden";

/**
 * Per-person privacy override configuration entry in data/visibility-overrides.json
 */
export interface PersonOverride {
  /** Specific field overrides taking precedence over living/deceased defaults */
  fields?: Partial<Record<SensitiveField, VisibilityState>>;
  /** If true, person is completely omitted from the generated site and JSON */
  exclude?: boolean;
  /** Human-readable explanation for this override */
  note?: string;
}

/**
 * Root schema for data/visibility-overrides.json
 */
export interface VisibilityOverrides {
  /** Schema version */
  version: number;
  /** Global default policy definitions */
  defaultPolicy: {
    sensitiveFields: SensitiveField[];
  };
  /** Map of Person ID -> privacy override rules */
  overrides: Record<string, PersonOverride>;
}

/**
 * Sanitized individual entity safe for static generation and public client bundles.
 * All redacted fields are completely removed at build time.
 */
export interface SanitizedPerson {
  /** Unique person ID (e.g. "I33") */
  id: string;
  /** Given name */
  givenName: string;
  /** Surname */
  surname: string;
  /** Full combined display name */
  displayName: string;
  /** Biological or recorded sex */
  sex: Sex;
  /** Whether the person is deceased */
  isDeceased: boolean;
  /** Redacted birth event (only populated if authorized by privacy policy) */
  birth?: {
    date?: string;
    place?: Place;
  };
  /** Redacted death event (only populated if authorized by privacy policy) */
  death?: {
    date?: string;
    place?: Place;
  };
  /** Public URL to optimized WebP image (e.g. "/photos/I62.webp") if visible */
  photoUrl?: string;
  /** Parent family xref ID */
  parentFamilyId?: string;
  /** Spouse/partner family xref IDs */
  spouseFamilyIds: string[];
}

/**
 * Sanitized family unit with references to non-excluded individuals.
 */
export interface SanitizedFamily {
  /** Family ID (e.g. "F13") */
  id: string;
  /** Husband Person ID */
  husbandId?: string;
  /** Wife Person ID */
  wifeId?: string;
  /** Array of child Person IDs */
  childIds: string[];
  /** Sanitized marriage details */
  marriage?: {
    date?: string;
    place?: Place;
  };
}

/**
 * Compact search entry for client-side instant filtering.
 * Never includes redacted birth years.
 */
export interface SearchEntry {
  /** Person identifier linking to /people/[id] */
  id: string;
  /** Full display name */
  displayName: string;
  /** Sanitized birth year (only included if birthDate is visible) */
  birthYear?: number;
}

/**
 * Schema of the pre-built data/generated/genealogy.json file.
 */
export interface GenealogyData {
  /** Map of Person ID -> SanitizedPerson */
  people: Record<string, SanitizedPerson>;
  /** Map of Family ID -> SanitizedFamily */
  families: Record<string, SanitizedFamily>;
  /** Pipeline generation metadata */
  meta: {
    generatedAt: string;
    totalPeople: number;
    totalFamilies: number;
  };
}

/**
 * Summary representation of a person for relative link cards.
 */
export interface PersonSummary {
  id: string;
  displayName: string;
  sex: Sex;
  birthYear?: number;
  deathYear?: number;
  isDeceased: boolean;
  photoUrl?: string;
}

/**
 * Resolved immediate family relations for a person.
 */
export interface PersonRelatives {
  parents: PersonSummary[];
  spouses: PersonSummary[];
  children: PersonSummary[];
  siblings: PersonSummary[];
}
