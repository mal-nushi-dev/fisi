import { Suspense } from "react";
import { TreeExplorer } from "@/components/tree/TreeExplorer";
import { getArchive } from "@/lib/presentation/get-archive";

export const metadata = { title: "Interactive Tree", description: "Explore generations and kinship connections in the Nushi family tree." };

export default function TreePage() {
  return (
    <main id="main-content" className="flex w-full flex-1 flex-col">
      <Suspense fallback={<p className="py-24 text-center text-secondary">Opening the family tree…</p>}>
        <TreeExplorer archive={getArchive()} />
      </Suspense>
    </main>
  );
}
