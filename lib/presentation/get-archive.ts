import { cache } from "react";
import { getAllPeople, getRelatives } from "@/lib/data/genealogy";
import { buildArchiveModel } from "./archive";

/** Server-page entrypoint; client features receive the resulting plain records. */
export const getArchive = cache(() => {
  const people = getAllPeople();
  return buildArchiveModel(people, Object.fromEntries(people.map((person) => [person.id, getRelatives(person.id)])));
});
