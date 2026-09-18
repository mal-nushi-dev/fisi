import type { PersonRelatives, SanitizedPerson } from "@/lib/gedcom/types";
import { extractYear } from "@/lib/privacy/visibility";
import type { ArchiveModel, ArchivePerson } from "./types";

const compareIds = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

export function descendantIds(people: readonly ArchivePerson[], rootId: string): string[] {
  const byId = new Map(people.map((person) => [person.id, person]));
  const seen = new Set<string>([rootId]);
  const found: string[] = [];
  const pending = [...(byId.get(rootId)?.childIds ?? [])];
  while (pending.length) {
    const id = pending.pop()!;
    if (seen.has(id) || !byId.has(id)) continue;
    seen.add(id);
    found.push(id);
    pending.push(...byId.get(id)!.childIds);
  }
  return found.sort(compareIds);
}

/** Build a display model exclusively from already-sanitized accessors. */
export function buildArchiveModel(
  records: readonly SanitizedPerson[],
  relatives: Record<string, PersonRelatives>,
): ArchiveModel {
  const validIds = new Set(records.map((person) => person.id));
  const people: ArchivePerson[] = records.map((person) => {
    const links = relatives[person.id];
    const ids = (items: { id: string }[] = []) => [...new Set(items.map((item) => item.id))]
      .filter((id) => id !== person.id && validIds.has(id)).sort(compareIds);
    return {
      ...person,
      birthYear: extractYear(person.birth?.date),
      deathYear: extractYear(person.death?.date),
      parentIds: ids(links?.parents),
      spouseIds: ids(links?.spouses),
      childIds: ids(links?.children),
      siblingIds: ids(links?.siblings),
      branchIds: [],
    };
  });
  const byId = new Map(people.map((person) => [person.id, person]));

  // A recorded relationship may only appear on one side of a partial export.
  for (const person of people) {
    for (const parentId of person.parentIds) {
      const parent = byId.get(parentId)!;
      if (!parent.childIds.includes(person.id)) parent.childIds.push(person.id);
    }
    for (const childId of person.childIds) {
      const child = byId.get(childId)!;
      if (!child.parentIds.includes(person.id)) child.parentIds.push(person.id);
    }
    for (const spouseId of person.spouseIds) {
      const spouse = byId.get(spouseId)!;
      if (!spouse.spouseIds.includes(person.id)) spouse.spouseIds.push(person.id);
    }
  }

  const descendants = new Map(people.map((person) => [person.id, descendantIds(people, person.id)]));
  function depth(id: string, path = new Set<string>()): number {
    if (path.has(id)) return 0;
    const nextPath = new Set(path).add(id);
    return 1 + Math.max(0, ...(byId.get(id)?.childIds ?? []).map((child) => depth(child, nextPath)));
  }
  const roots = people.filter((person) => !person.parentIds.length);
  const rankedRoots = [...(roots.length ? roots : people)].sort((a, b) =>
    descendants.get(b.id)!.length - descendants.get(a.id)!.length ||
    depth(b.id) - depth(a.id) || compareIds(a.id, b.id));

  // Keep partners in the same display generation. This does not infer birth dates.
  const groupFor = new Map<string, string>();
  for (const person of people) {
    if (groupFor.has(person.id)) continue;
    const pending = [person.id];
    while (pending.length) {
      const id = pending.pop()!;
      if (groupFor.has(id)) continue;
      groupFor.set(id, person.id);
      pending.push(...byId.get(id)!.spouseIds);
    }
  }
  const groupIds = [...new Set(groupFor.values())];
  const parents = new Map(groupIds.map((id) => [id, new Set<string>()]));
  const children = new Map(groupIds.map((id) => [id, new Set<string>()]));
  for (const person of people) {
    const group = groupFor.get(person.id)!;
    for (const parentId of person.parentIds) {
      const parentGroup = groupFor.get(parentId)!;
      if (parentGroup === group) continue;
      parents.get(group)!.add(parentGroup);
      children.get(parentGroup)!.add(group);
    }
  }
  const pendingParents = new Map(groupIds.map((id) => [id, parents.get(id)!.size]));
  const generations = new Map<string, number>();
  const queue = groupIds.filter((id) => !pendingParents.get(id));
  queue.forEach((id) => generations.set(id, 1));
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    for (const child of children.get(id)!) {
      generations.set(child, Math.max(generations.get(child) ?? 1, generations.get(id)! + 1));
      pendingParents.set(child, pendingParents.get(child)! - 1);
      if (pendingParents.get(child) === 0) queue.push(child);
    }
  }
  for (const person of people) {
    const group = groupFor.get(person.id)!;
    person.generation = pendingParents.get(group) === 0 ? generations.get(group) : undefined;
  }

  const branchKeys = new Set<string>();
  const branches = [...people].filter((person) => person.childIds.length).sort((a, b) =>
    descendants.get(b.id)!.length - descendants.get(a.id)!.length || compareIds(a.id, b.id)
  ).flatMap((person) => {
    const members = new Set([person.id, ...descendants.get(person.id)!]);
    for (const id of [...members]) byId.get(id)!.spouseIds.forEach((spouse) => members.add(spouse));
    const personIds = [...members].sort(compareIds);
    const key = personIds.join("|");
    if (branchKeys.has(key)) return [];
    branchKeys.add(key);
    return [{ id: person.id, label: person.displayName, personIds }];
  });
  for (const branch of branches) {
    branch.personIds.forEach((id) => byId.get(id)!.branchIds.push(branch.id));
  }
  const labelCounts = new Map<string, number>();
  branches.forEach((branch) => labelCounts.set(branch.label, (labelCounts.get(branch.label) ?? 0) + 1));
  branches.forEach((branch) => {
    if (labelCounts.get(branch.label)! > 1) branch.label = `${branch.label} · ${branch.id}`;
  });
  people.sort((a, b) => (a.surname || a.givenName).localeCompare(b.surname || b.givenName, "en") ||
    a.givenName.localeCompare(b.givenName, "en") || compareIds(a.id, b.id));
  return {
    people,
    branches,
    rootId: rankedRoots[0]?.id,
    generations: [...new Set(people.flatMap((person) => person.generation ? [person.generation] : []))].sort((a, b) => a - b),
  };
}
