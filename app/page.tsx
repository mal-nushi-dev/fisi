import { getTreeStats } from "@/lib/data/genealogy";
import { getArchive } from "@/lib/presentation/get-archive";
import { HomeSearch } from "@/components/search/HomeSearch";
import { Statistic } from "@/components/ui/Statistic";

export default function HomePage() {
  const stats = getTreeStats();
  const hasYears = stats.earliestBirthYear !== undefined && stats.latestBirthYear !== undefined;
  const span = hasYears ? `${stats.earliestBirthYear} – ${stats.latestBirthYear}` : "—";
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-4 text-center" aria-labelledby="home-title">
        <h1 id="home-title" className="font-headline text-5xl font-normal leading-[1.08] tracking-tight sm:text-6xl md:text-7xl">Nushi Family Genealogy</h1>
        <p className="mx-auto max-w-xl pt-1 font-headline text-lg italic leading-relaxed text-secondary sm:text-xl">Centralized archival ledger of ancestral records, vital events, and kinship connections across multiple generations.</p>
      </section>
      <div className="mx-auto mt-10 w-full max-w-2xl md:mt-12"><HomeSearch archive={getArchive()} /></div>
      <section aria-label="Archive statistics" className="mt-14 grid grid-cols-2 border-l border-t border-surface-container-highest bg-surface-container-lowest shadow-sm md:mt-16 md:grid-cols-4">
        <Statistic value={stats.totalPeople} label="Total Individuals" detail="Indexed Records" />
        <Statistic value={stats.totalFamilies} label="Family Units" detail="Kinship Connections" />
        <Statistic value={stats.photosCount} label="Archived Photos" detail="Recorded Portraits" />
        <Statistic value={span} label="Recorded Birth Years" detail={hasYears ? `${stats.latestBirthYear! - stats.earliestBirthYear!} Years Spanned` : "Dates Not Available"} />
      </section>
    </main>
  );
}
