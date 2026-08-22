/**
 * @file parser.ts
 * @description Standalone custom GEDCOM 7.0.3 parser for MacFamilyTree exports.
 *
 * Key Capabilities:
 * - Robust line ending handling: MacFamilyTree exports use classic Mac CR (\r) line endings.
 * - Hierarchical node parsing: Builds an indent/level tree representation.
 * - Custom tag tolerance: Gracefully skips vendor extensions (e.g. `_STF`, `_STE`, `_SCS`).
 * - Media object linkage: Extracts `OBJE` records and links them to individuals.
 * - Coordinate parsing: Converts GEDCOM `LONG` / `LATI` (e.g. "E21.096111", "W83.651389") into decimal numbers.
 */

import { RawPerson, RawFamily, Place, LifeEvent, Sex } from "./types";

/**
 * Internal representation of a single line node in the GEDCOM tree.
 */
export interface GedcomNode {
  /** Hierarchical depth level (0, 1, 2, 3, etc.) */
  level: number;
  /** Optional cross-reference ID without '@' symbols (e.g. "I33", "F13", "71244345") */
  xref?: string;
  /** GEDCOM standard or vendor tag (e.g. "INDI", "FAM", "BIRT", "NAME") */
  tag: string;
  /** Value or payload attached to the line */
  value?: string;
  /** Child sub-nodes nested directly beneath this level */
  children: GedcomNode[];
}

/**
 * Output of the parser before any privacy filters are applied.
 */
export interface ParsedGedcom {
  /** All parsed individuals */
  people: RawPerson[];
  /** All parsed families */
  families: RawFamily[];
  /** Media map of xref ID -> source filename */
  media: Record<string, string>;
}

/**
 * Parses a single raw GEDCOM line into level, xref, tag, and value.
 *
 * @param line - Raw line text from the GEDCOM file
 * @returns Structured object or null if line is empty or whitespace
 */
function parseLine(
  line: string,
): { level: number; xref?: string; tag: string; value?: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Handles standard formats:
  // 0 @I33@ INDI
  // 1 NAME John /Doe/
  // 2 DATE 01 NOV 1952
  // 0 @SUBM1@ SUBM
  const match = trimmed.match(
    /^(\d+)(?:\s+@([^@]+)@)?\s+([A-Za-z0-9_]+)(?:\s+(.*))?$/,
  );
  if (!match) return null;

  const level = parseInt(match[1], 10);
  const xref = match[2];
  const tag = match[3];
  const value = match[4];

  return { level, xref, tag, value };
}

/**
 * Tokenizes GEDCOM string across CR, LF, and CRLF line breaks and constructs a hierarchical node tree.
 *
 * @param content - Full text of the GEDCOM export
 * @returns Array of level 0 root nodes with their nested children
 */
export function buildGedcomTree(content: string): GedcomNode[] {
  const lines = content.split(/\r\n|\r|\n/);
  const rootNodes: GedcomNode[] = [];
  const stack: GedcomNode[] = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;

    const node: GedcomNode = {
      level: parsed.level,
      xref: parsed.xref,
      tag: parsed.tag,
      value: parsed.value,
      children: [],
    };

    if (node.level === 0) {
      rootNodes.push(node);
      stack.length = 0;
      stack[0] = node;
    } else {
      // Find parent at level - 1
      const parent = stack[node.level - 1];
      if (parent) {
        parent.children.push(node);
      }
      stack[node.level] = node;
      // Truncate any deeper levels in stack
      stack.length = node.level + 1;
    }
  }

  return rootNodes;
}

/**
 * Parses coordinate strings in standard GEDCOM format into signed decimal numbers.
 *
 * @example
 * parseCoordinate("N42.663889") // => 42.663889
 * parseCoordinate("S12.345000") // => -12.345
 * parseCoordinate("E20.430833") // => 20.430833
 * parseCoordinate("W83.651389") // => -83.651389
 *
 * @param coordStr - Raw coordinate string
 * @returns Signed float coordinate or undefined if absent or malformed
 */
export function parseCoordinate(coordStr?: string): number | undefined {
  if (!coordStr) return undefined;
  const trimmed = coordStr.trim();
  if (!trimmed) return undefined;

  const direction = trimmed.charAt(0).toUpperCase();
  if (direction === "N" || direction === "E") {
    const val = parseFloat(trimmed.slice(1));
    return isNaN(val) ? undefined : val;
  }
  if (direction === "S" || direction === "W") {
    const val = parseFloat(trimmed.slice(1));
    return isNaN(val) ? undefined : -val;
  }

  const direct = parseFloat(trimmed);
  return isNaN(direct) ? undefined : direct;
}

/**
 * Extracts a geographic place from a `PLAC` node, parsing name, translations, and GPS coordinates.
 *
 * @param node - The PLAC GEDCOM node
 * @returns Populated Place object
 */
function parsePlace(node: GedcomNode): Place {
  const name = node.value || "";
  let latitude: number | undefined;
  let longitude: number | undefined;
  let alternateNames: string[] | undefined;

  for (const child of node.children) {
    if (child.tag === "TRAN" && child.value) {
      // TRAN contains comma-separated alternate translations from MacFamilyTree
      alternateNames = child.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (child.tag === "MAP") {
      for (const mapChild of child.children) {
        if (mapChild.tag === "LATI") {
          latitude = parseCoordinate(mapChild.value);
        } else if (mapChild.tag === "LONG") {
          longitude = parseCoordinate(mapChild.value);
        }
      }
    }
  }

  return {
    name,
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(alternateNames && alternateNames.length > 0 ? { alternateNames } : {}),
  };
}

/**
 * Extracts event details (DATE and PLAC) from an event node (e.g. BIRT, DEAT, MARR).
 *
 * @param node - The event GEDCOM node
 * @returns Structured LifeEvent
 */
function parseEvent(node: GedcomNode): LifeEvent {
  let date: string | undefined;
  let place: Place | undefined;

  for (const child of node.children) {
    if (child.tag === "DATE") {
      date = child.value?.trim();
    } else if (child.tag === "PLAC") {
      place = parsePlace(child);
    }
  }

  return {
    ...(date ? { date } : {}),
    ...(place ? { place } : {}),
  };
}

/**
 * Extracts given name and surname from a NAME node or sub-tags (GIVN, SURN).
 *
 * @param node - The NAME GEDCOM node
 * @returns Given name and surname pair
 */
function parseName(node: GedcomNode): { givenName: string; surname: string } {
  let givenName = "";
  let surname = "";

  for (const child of node.children) {
    if (child.tag === "GIVN" && child.value) {
      givenName = child.value.trim();
    } else if (child.tag === "SURN" && child.value) {
      surname = child.value.trim();
    }
  }

  // Fallback to parsing standard GEDCOM "Given /Surname/" slash notation
  if (!givenName && !surname && node.value) {
    const slashMatch = node.value.match(/^(.*?)(?:\/([^\/]*)\/)?$/);
    if (slashMatch) {
      givenName = (slashMatch[1] || "").trim();
      surname = (slashMatch[2] || "").trim();
    }
  }

  return { givenName, surname };
}

/**
 * Main parser entry point: transforms raw GEDCOM export content into normalized domain entities.
 *
 * @param content - Full text string of the GEDCOM export
 * @returns Parsed domain entities (people, families, media map)
 */
export function parseGedcom(content: string): ParsedGedcom {
  const rootNodes = buildGedcomTree(content);

  const media: Record<string, string> = {};
  const rawPeopleNodes: GedcomNode[] = [];
  const rawFamilyNodes: GedcomNode[] = [];

  // Pass 1: Categorize root records into media (OBJE), people (INDI), and families (FAM)
  for (const node of rootNodes) {
    if (node.tag === "OBJE" && node.xref) {
      // 0 @71244345@ OBJE -> 1 FILE 71244345.png
      for (const child of node.children) {
        if (child.tag === "FILE" && child.value) {
          media[node.xref] = child.value.trim();
        }
      }
    } else if (node.tag === "INDI" && node.xref) {
      rawPeopleNodes.push(node);
    } else if (node.tag === "FAM" && node.xref) {
      rawFamilyNodes.push(node);
    }
  }

  // Pass 2: Parse Individuals (INDI)
  const people: RawPerson[] = [];
  for (const node of rawPeopleNodes) {
    const id = node.xref!;
    let givenName = "";
    let surname = "";
    let sex: Sex = "U";
    let birth: LifeEvent | undefined;
    let death: LifeEvent | undefined;
    let photoFile: string | undefined;
    let photoCrop: RawPerson["photoCrop"];
    let parentFamilyId: string | undefined;
    const spouseFamilyIds: string[] = [];

    for (const child of node.children) {
      if (child.tag === "NAME") {
        const typeChild = child.children.find((c) => c.tag === "TYPE");
        const isMarried = typeChild?.value?.toLowerCase() === "married";
        // Preserve primary birth name unless only married name is specified
        if (!givenName || !isMarried) {
          const parsedName = parseName(child);
          if (parsedName.givenName || parsedName.surname) {
            givenName = parsedName.givenName;
            surname = parsedName.surname;
          }
        }
      } else if (child.tag === "SEX") {
        const val = child.value?.trim().toUpperCase();
        sex = val === "M" || val === "F" ? val : "U";
      } else if (child.tag === "BIRT") {
        birth = parseEvent(child);
      } else if (child.tag === "DEAT") {
        death = parseEvent(child);
      } else if (child.tag === "FAMC" && child.value) {
        parentFamilyId = child.value.replace(/@/g, "").trim();
      } else if (child.tag === "FAMS" && child.value) {
        spouseFamilyIds.push(child.value.replace(/@/g, "").trim());
      } else if (child.tag === "OBJE") {
        const objeXref = (child.value || "").replace(/@/g, "").trim();
        if (objeXref && media[objeXref]) {
          photoFile = media[objeXref];
        }
        // Extract optional crop coordinates from MacFamilyTree
        const cropNode = child.children.find((c) => c.tag === "CROP");
        if (cropNode) {
          let top = 0;
          let left = 0;
          let height = 0;
          let width = 0;
          for (const cropChild of cropNode.children) {
            const num = parseInt(cropChild.value || "0", 10);
            if (cropChild.tag === "TOP") top = num;
            if (cropChild.tag === "LEFT") left = num;
            if (cropChild.tag === "HEIGHT") height = num;
            if (cropChild.tag === "WIDTH") width = num;
          }
          if (height > 0 && width > 0) {
            photoCrop = { top, left, height, width };
          }
        }
      }
    }

    people.push({
      id,
      givenName,
      surname,
      sex,
      ...(birth ? { birth } : {}),
      ...(death ? { death } : {}),
      ...(photoFile ? { photoFile } : {}),
      ...(photoCrop ? { photoCrop } : {}),
      ...(parentFamilyId ? { parentFamilyId } : {}),
      spouseFamilyIds,
    });
  }

  // Pass 3: Parse Families (FAM)
  const families: RawFamily[] = [];
  for (const node of rawFamilyNodes) {
    const id = node.xref!;
    let husbandId: string | undefined;
    let wifeId: string | undefined;
    const childIds: string[] = [];
    let marriage: LifeEvent | undefined;

    for (const child of node.children) {
      if (child.tag === "HUSB" && child.value) {
        husbandId = child.value.replace(/@/g, "").trim();
      } else if (child.tag === "WIFE" && child.value) {
        wifeId = child.value.replace(/@/g, "").trim();
      } else if (child.tag === "CHIL" && child.value) {
        childIds.push(child.value.replace(/@/g, "").trim());
      } else if (child.tag === "MARR") {
        marriage = parseEvent(child);
      }
    }

    families.push({
      id,
      ...(husbandId ? { husbandId } : {}),
      ...(wifeId ? { wifeId } : {}),
      childIds,
      ...(marriage ? { marriage } : {}),
    });
  }

  return {
    people,
    families,
    media,
  };
}
