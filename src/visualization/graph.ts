import type { MemoryArchive } from "../core/archive";
import { tagsForMemoryArchive } from "../core/archiveOperations";

export type GraphNode = {
  id: string;
  label: string;
  kind: "memory" | "tag";
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "memory_tag";
};

export type TagGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function buildTagGraphData(archive: MemoryArchive): TagGraphData {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

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
  }

  return { nodes: [...nodes.values()], edges };
}

