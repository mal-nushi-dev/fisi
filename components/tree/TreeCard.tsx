import type { ArchivePerson } from "@/lib/presentation/types";
import type { TreeNode } from "@/lib/presentation/tree-layout";
import { PersonIdentity } from "@/components/ui/PersonIdentity";

interface TreeCardProps {
  node: TreeNode;
  peopleById: Map<string, ArchivePerson>;
  rootId?: string;
  selectedId?: string;
  onSelect: (id: string) => void;
  onFocus: (node: TreeNode) => void;
}

export function TreeCard({ node, peopleById, rootId, selectedId, onSelect, onFocus }: TreeCardProps) {
  const isRoot = rootId !== undefined && node.personIds.includes(rootId);
  const isSelected = selectedId !== undefined && node.personIds.includes(selectedId);
  return (
    <div
      className={`absolute bg-surface-container-lowest shadow-search-float ${isSelected || isRoot ? "border border-primary" : "border border-outline-variant"}`}
      style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
      data-tree-node={node.id}
    >
      <div className={`flex h-[39px] items-center justify-between border-b border-outline-variant px-3 text-[9px] font-semibold uppercase tracking-[0.16em] ${isRoot ? "bg-primary text-white" : "bg-surface-container-low text-secondary"}`}>
        <span>{isRoot ? "Ancestry root" : node.personIds.length > 1 ? "Recorded partners" : "Individual record"}</span>
        <span>{node.personIds.length > 1 ? `${node.personIds.length} people` : "01"}</span>
      </div>
      {node.personIds.map((id) => {
        const person = peopleById.get(id)!;
        return (
          <button
            key={id}
            type="button"
            aria-label={`Inspect ${person.displayName}, ID ${person.id}`}
            aria-pressed={selectedId === id}
            className={`flex h-[88px] w-full items-center border-b border-outline-variant/60 px-3 text-left last:border-b-0 hover:bg-surface-container-low focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selectedId === id ? "bg-secondary-container" : ""}`}
            onClick={() => onSelect(id)}
            onFocus={() => onFocus(node)}
          >
            <div className="min-w-0 w-full">
              <PersonIdentity person={person} compact />
              <span className="mt-1 block text-[9px] tracking-wider text-secondary">ID {person.id}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
