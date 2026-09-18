import Image from "next/image";

export interface IdentityPerson {
  displayName: string;
  photoUrl?: string;
  birthYear?: number;
  deathYear?: number;
}

export function PersonIdentity({ person, compact = false }: { person: IdentityPerson; compact?: boolean }) {
  const initials = person.displayName.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("");
  const dates = person.birthYear && person.deathYear
    ? `${person.birthYear} – ${person.deathYear}`
    : person.birthYear ? `Born ${person.birthYear}`
      : person.deathYear ? `Died ${person.deathYear}` : "Dates not available";

  return (
    <div className={`flex min-w-0 items-center ${compact ? "gap-3" : "gap-4"}`}>
      <div className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-surface-container-highest bg-surface-container font-headline text-secondary ${compact ? "h-10 w-10 text-xl" : "h-14 w-14 text-2xl"}`}>
        {person.photoUrl ? (
          <Image src={person.photoUrl} alt="" fill sizes={compact ? "40px" : "56px"} className="object-cover grayscale" />
        ) : <span aria-hidden="true">{initials || "?"}</span>}
      </div>
      <div className="min-w-0">
        <p className={`break-words font-headline font-medium leading-tight text-on-surface ${compact ? "text-xl" : "text-2xl"}`}>{person.displayName}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-secondary">{dates}</p>
      </div>
    </div>
  );
}
