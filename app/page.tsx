/**
 * @file page.tsx
 * @description Home overview page rendering the Functional Command Hub (HomeTemplate).
 */

import { getTreeStats, getSearchIndex, getAllPeople } from "@/lib/data/genealogy";
import { HomeTemplate } from "@/components/templates/HomeTemplate";

export default function HomePage() {
  const stats = getTreeStats();
  const searchIndex = getSearchIndex();
  const allPeople = getAllPeople();

  // Compute surname breakdown sorted by occurrence count
  const surnameMap = new Map<string, number>();
  for (const p of allPeople) {
    if (p.surname && p.surname.trim()) {
      const s = p.surname.trim();
      surnameMap.set(s, (surnameMap.get(s) || 0) + 1);
    }
  }

  const surnames = Array.from(surnameMap.entries())
    .map(([surname, count]) => ({ surname, count }))
    .sort((a, b) => b.count - a.count || a.surname.localeCompare(b.surname));

  return (
    <HomeTemplate
      stats={stats}
      searchIndex={searchIndex}
      surnames={surnames}
    />
  );
}
