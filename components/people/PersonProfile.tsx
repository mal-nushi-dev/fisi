import Image from "next/image";
import Link from "next/link";
import type { PersonRelatives, PersonSummary } from "@/lib/gedcom/types";
import type { ArchivePerson } from "@/lib/presentation/types";
import { PersonIdentity } from "@/components/ui/PersonIdentity";
import { Icon } from "@/components/ui/Icon";

function RelativeSection({ title, people }: { title: string; people: PersonSummary[] }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between border-b border-surface-container-highest pb-2">
        <h3 className="font-headline text-2xl">{title}</h3>
        <span className="text-xs text-secondary">{people.length} {people.length === 1 ? "record" : "records"}</span>
      </div>
      {people.length ? <div className="grid gap-2 sm:grid-cols-2">{people.map((person) => (
        <Link key={person.id} href={`/people/${encodeURIComponent(person.id)}`} className="group flex items-center justify-between gap-3 border border-surface-container-highest bg-white p-3 transition-colors hover:bg-surface-container-low">
          <PersonIdentity person={person} compact />
          <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-secondary transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}</div> : <p className="py-3 text-sm text-secondary">No {title.toLowerCase()} recorded in the available archive.</p>}
    </section>
  );
}

function PedigreeColumn({ label, people, currentId }: { label: string; people: PersonSummary[]; currentId: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary">{label}</p>
      <div className="space-y-2">{people.length ? people.map((person) => (
        <Link key={person.id} aria-current={person.id === currentId ? "page" : undefined} href={`/people/${encodeURIComponent(person.id)}`} className={`block border p-3 font-headline text-lg leading-tight ${person.id === currentId ? "border-primary bg-primary text-on-primary" : "border-surface-container-highest bg-white hover:bg-surface-container-low"}`}>
          {person.displayName}
        </Link>
      )) : <p className="border border-dashed border-outline-variant p-3 text-xs text-secondary">No records</p>}</div>
    </div>
  );
}

export function PersonProfile({ person, relatives }: { person: ArchivePerson; relatives: PersonRelatives }) {
  const vitals = [
    ["Birth", person.birth?.date], ["Birthplace", person.birth?.place?.name],
    ["Death", person.death?.date], ["Place of death", person.death?.place?.name],
  ];
  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-xs text-secondary">
        <Link href="/people" className="inline-flex items-center gap-2 hover:text-on-surface"><Icon name="arrow-left" className="h-4 w-4" />People & Index</Link>
        <span className="uppercase tracking-[0.15em]">Record {person.id}</span>
      </div>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-surface-container-highest pb-8">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Biographical Record{person.generation ? ` · Generation ${person.generation}` : ""}</p>
          <h1 className="font-headline text-5xl font-normal leading-[1.08] tracking-tight sm:text-6xl">{person.displayName}</h1>
          <p className="mt-4 font-headline text-xl italic text-secondary">A place in the family’s continuing story.</p>
        </div>
        <Link href={`/tree?person=${encodeURIComponent(person.id)}`} className="inline-flex items-center gap-3 bg-primary px-5 py-3 text-xs font-medium text-on-primary hover:bg-primary-container">View in Tree<Icon name="arrow-right" className="h-4 w-4" /></Link>
      </header>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)] lg:gap-14">
        <aside className="space-y-6" aria-label="Recorded vital information">
          {person.photoUrl ? <div className="relative aspect-[4/3] overflow-hidden border border-surface-container-highest bg-surface-container-low"><Image src={person.photoUrl} alt={`Portrait of ${person.displayName}`} fill sizes="(min-width: 1024px) 420px, 100vw" className="object-contain" /></div> : <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 border border-surface-container-highest bg-surface-container-low text-secondary"><Icon name="person" className="h-16 w-16 opacity-40" /><p className="text-[10px] uppercase tracking-[0.18em]">No portrait available</p></div>}
          <section className="border border-surface-container-highest bg-white p-6">
            <h2 className="mb-5 font-headline text-3xl">Vital records</h2>
            <dl className="space-y-4">{vitals.map(([label, value]) => <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-b border-surface-container-low pb-3"><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{label}</dt><dd className="break-words text-sm">{value || <span className="text-secondary">Not available</span>}</dd></div>)}</dl>
            <p className="mt-5 text-[11px] leading-relaxed text-secondary">{person.isDeceased ? "Death recorded in the archive." : "No death recorded in the archive."}</p>
          </section>
        </aside>
        <div className="space-y-8">
          <section aria-labelledby="family-title" className="space-y-6">
            <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Kinship connections</p><h2 id="family-title" className="font-headline text-4xl">Family & relationships</h2></div>
            <RelativeSection title="Parents" people={relatives.parents} />
            <RelativeSection title="Partners" people={relatives.spouses} />
            <RelativeSection title="Children" people={relatives.children} />
            <RelativeSection title="Siblings" people={relatives.siblings} />
          </section>
          <section className="border-t border-surface-container-highest pt-7" aria-labelledby="pedigree-title">
            <div className="mb-6 flex items-baseline justify-between gap-3"><h2 id="pedigree-title" className="font-headline text-3xl">A view of the lineage</h2><Link href={`/tree?person=${encodeURIComponent(person.id)}`} className="text-xs text-secondary underline underline-offset-4">Explore tree</Link></div>
            <div className="grid gap-5 sm:grid-cols-3"><PedigreeColumn label="Parents" people={relatives.parents} currentId={person.id} /><PedigreeColumn label="This record" people={[person]} currentId={person.id} /><PedigreeColumn label="Children" people={relatives.children} currentId={person.id} /></div>
          </section>
        </div>
      </div>
    </main>
  );
}
