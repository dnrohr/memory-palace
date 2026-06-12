import type { MemoryArchive } from "../core/archive";
import { tagsForMemoryArchive } from "../core/archiveOperations";
import { findLifeContextMatches } from "../core/lifeContext";
import type { LifeContextKind } from "../core/types";

export type GraphNode = {
  id: string;
  label: string;
  kind: "memory" | "tag" | "person" | "pet" | "place" | "life_period";
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "memory_tag" | "memory_context" | "context_relation";
  weight?: number;
  label?: string;
};

export type TagGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphNeighborhood = {
  center: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function buildTagGraphData(archive: MemoryArchive): TagGraphData {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const contextCoOccurrences = new Map<string, { source: string; target: string; weight: number }>();

  for (const relationship of archive.lifeContextRelationships ?? []) {
    const source = resolveContextNode(archive, relationship.sourceKind, relationship.sourceId);
    const target = resolveContextNode(archive, relationship.targetKind, relationship.targetId);
    if (!source || !target) continue;
    nodes.set(source.id, source);
    nodes.set(target.id, target);
    edges.push({
      source: source.id,
      target: target.id,
      kind: "context_relation",
      ...(relationship.confidence !== undefined ? { weight: relationship.confidence } : {}),
      label: relationship.label ?? relationship.relationshipType.replace(/_/g, " ")
    });
  }

  for (const memory of archive.memories.filter((item) => !item.deletedAt)) {
    nodes.set(`memory:${memory.id}`, {
      id: `memory:${memory.id}`,
      label: memory.title ?? memory.rawText.slice(0, 48),
      kind: "memory"
    });

    for (const tag of tagsForMemoryArchive(archive, memory.id)) {
      nodes.set(`tag:${tag.id}`, {
        id: `tag:${tag.id}`,
        label: tag.name,
        kind: "tag"
      });
      edges.push({
        source: `memory:${memory.id}`,
        target: `tag:${tag.id}`,
        kind: "memory_tag"
      });
    }

    const contextMatches = findLifeContextMatches(memory.cleanedText ?? memory.rawText, archive);
    for (const match of contextMatches) {
      nodes.set(`${match.kind}:${match.id}`, {
        id: `${match.kind}:${match.id}`,
        label: match.name,
        kind: match.kind
      });
      edges.push({
        source: `memory:${memory.id}`,
        target: `${match.kind}:${match.id}`,
        kind: "memory_context"
      });
    }

    for (let i = 0; i < contextMatches.length; i += 1) {
      for (let j = i + 1; j < contextMatches.length; j += 1) {
        const left = contextMatches[i];
        const right = contextMatches[j];
        if (!left || !right) continue;
        const pair = [`${left.kind}:${left.id}`, `${right.kind}:${right.id}`].sort();
        const key = pair.join(">");
        const existing = contextCoOccurrences.get(key);
        contextCoOccurrences.set(key, {
          source: pair[0]!,
          target: pair[1]!,
          weight: (existing?.weight ?? 0) + 1
        });
      }
    }
  }

  for (const edge of contextCoOccurrences.values()) {
    edges.push({
      source: edge.source,
      target: edge.target,
      kind: "context_relation",
      weight: edge.weight,
      label: `${edge.weight} shared ${edge.weight === 1 ? "memory" : "memories"}`
    });
  }

  return { nodes: [...nodes.values()], edges };
}

function resolveContextNode(archive: MemoryArchive, kind: LifeContextKind, id: string): GraphNode | undefined {
  switch (kind) {
    case "person": {
      const person = archive.people.find((item) => item.id === id);
      return person ? { id: `person:${person.id}`, label: person.displayName, kind } : undefined;
    }
    case "pet": {
      const pet = archive.pets.find((item) => item.id === id);
      return pet ? { id: `pet:${pet.id}`, label: pet.name, kind } : undefined;
    }
    case "place": {
      const place = archive.places.find((item) => item.id === id);
      return place ? { id: `place:${place.id}`, label: place.name, kind } : undefined;
    }
    case "life_period": {
      const lifePeriod = archive.lifePeriods.find((item) => item.id === id);
      return lifePeriod ? { id: `life_period:${lifePeriod.id}`, label: lifePeriod.name, kind } : undefined;
    }
  }
}

export function buildGraphNeighborhood(graph: TagGraphData, centerNodeId: string, maxDepth = 1): GraphNeighborhood | undefined {
  const center = graph.nodes.find((node) => node.id === centerNodeId);
  if (!center) return undefined;

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const visited = new Set([centerNodeId]);
  let frontier = new Set([centerNodeId]);
  const edges: GraphEdge[] = [];

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const nextFrontier = new Set<string>();
    for (const edge of graph.edges) {
      const touchesSource = frontier.has(edge.source);
      const touchesTarget = frontier.has(edge.target);
      if (!touchesSource && !touchesTarget) continue;
      edges.push(edge);
      const neighborId = touchesSource ? edge.target : edge.source;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        nextFrontier.add(neighborId);
      }
    }
    frontier = nextFrontier;
    if (frontier.size === 0) break;
  }

  return {
    center,
    nodes: [...visited].map((id) => nodesById.get(id)).filter((node): node is GraphNode => Boolean(node)),
    edges: dedupeEdges(edges)
  };
}

function dedupeEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.source}>${edge.target}>${edge.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
