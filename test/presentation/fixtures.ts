import type { PersonRelatives, SanitizedPerson } from "@/lib/gedcom/types";
import { buildArchiveModel } from "@/lib/presentation/archive";

type Input = { id: string; parents?: string[]; spouses?: string[]; children?: string[] } & Partial<SanitizedPerson>;

export function archiveFixture(inputs: Input[]) {
  const records: SanitizedPerson[] = inputs.map(({ parents: _parents, spouses: _spouses, children: _children, ...record }) => ({
    givenName: record.id, surname: "Family", displayName: `${record.id} Family`, sex: "U", isDeceased: false,
    spouseFamilyIds: [], ...record,
  }));
  const summary = (id: string) => records.find((person) => person.id === id) ?? { id, displayName: id, sex: "U" as const, isDeceased: false };
  const relatives: Record<string, PersonRelatives> = Object.fromEntries(inputs.map((input) => [input.id, {
    parents: (input.parents ?? []).map(summary), spouses: (input.spouses ?? []).map(summary),
    children: (input.children ?? []).map(summary), siblings: [],
  }]));
  return buildArchiveModel(records, relatives);
}
