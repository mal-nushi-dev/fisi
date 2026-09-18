import Link from "next/link";
import type { ArchivePerson } from "@/lib/presentation/types";
import { Icon } from "@/components/ui/Icon";
import { PersonIdentity } from "@/components/ui/PersonIdentity";

interface PersonInspectorProps {
  person: ArchivePerson;
  peopleById: Map<string, ArchivePerson>;
  collapsed: boolean;
  onCollapse: () => void;
  onClose: () => void;
  onFocusBranch: () => void;
  onSelect: (id: string) => void;
}

export function PersonInspector({ person, peopleById, collapsed, onCollapse, onClose, onFocusBranch, onSelect }: PersonInspectorProps) {
  const relations = [
    { label: "Parents", ids: person.parentIds },
    { label: "Partners", ids: person.spouseIds },
    { label: "Children", ids: person.childIds },
    { label: "Siblings", ids: person.siblingIds },
  ];
  return (
    <aside aria-label={`Person inspector: ${person.displayName}`} className="absolute bottom-3 left-3 right-3 z-20 max-h-[70%] overflow-y-auto border border-outline-variant bg-surface-container-lowest shadow-search-float md:bottom-auto md:left-auto md:right-5 md:top-5 md:w-[310px] md:max-h-[calc(100%-40px)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-5 py-3">
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">Person inspector</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onCollapse} aria-label={collapsed ? "Expand inspector" : "Collapse inspector"} aria-expanded={!collapsed} className="p-2 text-secondary hover:bg-surface-container-low">
            <Icon name={collapsed ? "chevron-up" : "chevron-down"} className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close inspector" className="p-2 text-secondary hover:bg-surface-container-low">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="px-5 py-5">
        <PersonIdentity person={person} />
        {!collapsed && (
          <>
            <p className="mt-4 text-[10px] uppercase tracking-wider text-secondary">ID {person.id} <span className="mx-2" aria-hidden="true">·</span> {person.generation ? `Generation ${person.generation}` : "Generation unassigned"}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-outline-variant py-5 text-xs">
              <div>
                <dt className="mb-1 text-[9px] uppercase tracking-[0.15em] text-secondary">Birth</dt>
                <dd>{person.birth?.date || "Not available"}</dd>
                {person.birth?.place?.name && <dd className="mt-1 text-secondary">{person.birth.place.name}</dd>}
              </div>
              <div>
                <dt className="mb-1 text-[9px] uppercase tracking-[0.15em] text-secondary">Death</dt>
                <dd>{person.death?.date || (person.isDeceased ? "Death recorded" : "No death recorded")}</dd>
                {person.death?.place?.name && <dd className="mt-1 text-secondary">{person.death.place.name}</dd>}
              </div>
            </dl>
            <div className="space-y-4 py-5">
              {relations.map(({ label, ids }) => {
                const relatives = ids.flatMap((id) => peopleById.get(id) ?? []);
                if (!relatives.length) return null;
                return (
                  <div key={label}>
                    <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-secondary">{label} <span className="ml-1">{relatives.length}</span></h3>
                    <div className="flex flex-col items-start gap-2">
                      {relatives.map((relative) => (
                        <button key={relative.id} type="button" onClick={() => onSelect(relative.id)} className="text-left font-headline text-lg leading-tight underline decoration-outline-variant underline-offset-4 hover:decoration-primary">{relative.displayName}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href={`/people/${encodeURIComponent(person.id)}`} className="flex w-full items-center justify-between bg-primary px-4 py-3 text-xs font-medium text-white hover:bg-on-surface">
              View full profile <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
            <button type="button" onClick={onFocusBranch} className="mt-2 flex w-full items-center justify-center gap-2 border border-outline-variant px-4 py-3 text-xs hover:bg-surface-container-low">
              <Icon name="tree" className="h-4 w-4" /> Focus this branch
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
