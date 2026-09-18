import type { SanitizedPerson } from "@/lib/gedcom/types";

/** UI-only records. Relationships contain only IDs present in the sanitized archive. */
export interface ArchivePerson extends SanitizedPerson {
  birthYear?: number;
  deathYear?: number;
  parentIds: string[];
  spouseIds: string[];
  childIds: string[];
  siblingIds: string[];
  generation?: number;
  branchIds: string[];
}

export interface ArchiveBranch {
  id: string;
  label: string;
  personIds: string[];
}

export interface ArchiveModel {
  people: ArchivePerson[];
  branches: ArchiveBranch[];
  rootId?: string;
  generations: number[];
}

export interface DirectoryFilters {
  query: string;
  branch: string;
  generation: string;
  status: "all" | "deceased" | "unrecorded";
  letter: string;
}
