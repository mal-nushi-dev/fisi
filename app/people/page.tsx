/**
 * @file page.tsx
 * @description People directory page rendering the client-side search component.
 */

import { getSearchIndex } from "@/lib/data/genealogy";
import { SearchDirectory } from "@/components/SearchDirectory";

export const metadata = {
  title: "People Directory — Nushi Genealogy",
  description: "Search and browse all individuals in the Nushi family tree.",
};

export default function PeopleDirectoryPage() {
  const searchIndex = getSearchIndex();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          People Directory
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Browse all registered family members or search by name.
        </p>
      </div>

      <SearchDirectory entries={searchIndex} />
    </div>
  );
}
