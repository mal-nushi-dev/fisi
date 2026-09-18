import dagre from "@dagrejs/dagre";
import type { ArchivePerson } from "./types";

const CARD_WIDTH = 268;
const ROW_HEIGHT = 88;
const COLUMN_GAP = 132;
const MARGIN = 48;
const HEADER_HEIGHT = 100;

export interface TreeNode {
  id: string;
  familyId?: string;
  personIds: string[];
  generation?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  personIds: string[];
  path: string;
}

export interface TreeColumn {
  generation?: number;
  x: number;
  width: number;
  personCount: number;
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  columns: TreeColumn[];
  width: number;
  height: number;
}

const compareIds = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

/** Includes descendants and their recorded partners, without following partners' other children. */
export function getBranchPersonIds(people: ArchivePerson[], ancestorId: string): Set<string> {
  const byId = new Map(people.map((person) => [person.id, person]));
  const descendants = new Set<string>();
  const pending = [ancestorId];
  while (pending.length) {
    const id = pending.pop()!;
    const person = byId.get(id);
    if (!person || descendants.has(id)) continue;
    descendants.add(id);
    pending.push(...person.childIds);
  }
  const result = new Set(descendants);
  for (const id of descendants) {
    for (const spouseId of byId.get(id)!.spouseIds) {
      if (byId.has(spouseId)) result.add(spouseId);
    }
  }
  return result;
}

/**
 * Family references keep unions distinct when one person has multiple partners.
 * Dagre orders connected cards; explicit generations align the editorial columns.
 * The input is sanitized presentation data and is never mutated.
 */
export function createTreeLayout(people: ArchivePerson[]): TreeLayout {
  if (!people.length) return { nodes: [], edges: [], columns: [], width: 480, height: 320 };
  const byId = new Map(people.map((person) => [person.id, person]));
  const nodesById = new Map<string, TreeNode>();
  const personNodes = new Map<string, string[]>();
  for (const person of [...people].sort((a, b) => compareIds(a.id, b.id))) {
    const familyIds = [...new Set(person.spouseFamilyIds)].sort(compareIds);
    const memberships = familyIds.length ? familyIds.map((id) => `family:${id}`) : [`person:${person.id}`];
    personNodes.set(person.id, memberships);
    memberships.forEach((id, index) => {
      const node = nodesById.get(id) ?? {
        id,
        familyId: familyIds[index],
        personIds: [],
        x: 0, y: 0, width: CARD_WIDTH, height: 0,
      };
      node.personIds.push(person.id);
      nodesById.set(id, node);
    });
  }
  const nodes = [...nodesById.values()];
  for (const node of nodes) {
    const generations = node.personIds.flatMap((id) => {
      const generation = byId.get(id)?.generation;
      return generation === undefined ? [] : [generation];
    });
    node.generation = generations.length ? Math.min(...generations) : undefined;
    node.height = 40 + node.personIds.length * ROW_HEIGHT;
  }

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "LR", nodesep: 32, ranksep: COLUMN_GAP, marginx: MARGIN, marginy: MARGIN, acyclicer: "greedy" });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of nodes) graph.setNode(node.id, { width: node.width, height: node.height });

  const edgesById = new Map<string, TreeEdge>();
  for (const child of people) {
    const familyNode = child.parentFamilyId ? nodesById.get(`family:${child.parentFamilyId}`) : undefined;
    const sourceIds = familyNode
      ? [familyNode.id]
      : child.parentIds.flatMap((parentId) => personNodes.get(parentId) ?? []);
    for (const source of new Set(sourceIds)) {
      for (const target of personNodes.get(child.id) ?? []) {
        if (source === target) continue;
        const id = `${source}->${target}`;
        const previous = edgesById.get(id);
        const parentIds = nodesById.get(source)!.personIds.filter((id) => child.parentIds.includes(id));
        const personIds = [...new Set([...(previous?.personIds ?? []), ...parentIds, child.id])];
        edgesById.set(id, { id, source, target, personIds, path: "" });
        graph.setEdge(source, target);
      }
    }
  }
  dagre.layout(graph);

  const generations = [...new Set(nodes.map((node) => node.generation))].sort((a, b) => (a ?? Infinity) - (b ?? Infinity));
  const columns: TreeColumn[] = generations.map((generation, index) => ({
    generation,
    x: MARGIN + index * (CARD_WIDTH + COLUMN_GAP),
    width: CARD_WIDTH,
    personCount: new Set(nodes.filter((node) => node.generation === generation).flatMap((node) => node.personIds)).size,
  }));
  let bottom = HEADER_HEIGHT;
  for (const column of columns) {
    let nextY = HEADER_HEIGHT;
    const columnNodes = nodes.filter((node) => node.generation === column.generation).sort((a, b) => graph.node(a.id).y - graph.node(b.id).y || compareIds(a.id, b.id));
    for (const node of columnNodes) {
      node.x = column.x;
      node.y = Math.max(nextY, graph.node(node.id).y - node.height / 2 + HEADER_HEIGHT);
      nextY = node.y + node.height + 32;
      bottom = Math.max(bottom, node.y + node.height);
    }
  }

  const edges = [...edgesById.values()];
  let outsideLane = bottom + 16;
  for (const edge of edges) {
    const source = nodesById.get(edge.source)!;
    const target = nodesById.get(edge.target)!;
    const sx = source.x + source.width;
    const sy = source.y + source.height / 2;
    const tx = target.x;
    const ty = target.y + target.height / 2;
    if (tx > sx) {
      const middle = sx + (tx - sx) / 2;
      edge.path = `M ${sx} ${sy} H ${middle} V ${ty} H ${tx}`;
    } else {
      // Malformed cycles and cross-generation unions remain visible, routed outside cards.
      outsideLane += 12;
      edge.path = `M ${sx} ${sy} H ${sx + 24} V ${outsideLane} H ${tx - 24} V ${ty} H ${tx}`;
    }
  }
  return {
    nodes, edges, columns,
    width: MARGIN * 2 + columns.length * CARD_WIDTH + Math.max(0, columns.length - 1) * COLUMN_GAP,
    height: Math.max(bottom, outsideLane) + MARGIN,
  };
}
