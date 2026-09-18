import { Suspense } from "react";
import { PeopleDirectory } from "@/components/people/PeopleDirectory";
import { getArchive } from "@/lib/presentation/get-archive";

export const metadata = { title: "People & Biographical Index", description: "Browse people, generations, and branches in the Nushi family archive." };

export default function PeoplePage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <Suspense fallback={<p className="py-16 text-center text-secondary">Opening the people index…</p>}>
        <PeopleDirectory archive={getArchive()} />
      </Suspense>
    </main>
  );
}
