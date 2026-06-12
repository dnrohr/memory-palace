import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { buildTagClusters } from "../src/visualization/clusters";
import { buildGraphNeighborhood, buildTagGraphData } from "../src/visualization/graph";

const archive: MemoryArchive = {
  exportedAt: "2026-06-11T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "One memory with Maya at old house",
      title: "One",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false
    },
    {
      id: "mem-2",
      rawText: "Two",
      title: "Two",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false
    }
  ],
  tags: [
    {
      id: "tag-1",
      name: "old house",
      normalizedName: "old house",
      type: "place",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      isUserCreated: true
    }
  ],
  memoryTags: [
    {
      memoryId: "mem-1",
      tagId: "tag-1",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: "2026-06-11T00:00:00.000Z"
    },
    {
      memoryId: "mem-2",
      tagId: "tag-1",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: "2026-06-11T00:00:00.000Z"
    }
  ],
  people: [
    {
      id: "person-1",
      displayName: "Maya",
      normalizedName: "maya",
      relationship: "friend",
      createdAt: "2026-06-11T00:00:00.000Z"
    }
  ],
  pets: [],
  places: [
    {
      id: "place-1",
      name: "old house",
      type: "house",
      privacyLevel: "vague"
    }
  ],
  lifePeriods: [],
  processingRuns: []
};

describe("visualization data", () => {
  it("builds tag graph data", () => {
    const graph = buildTagGraphData(archive);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        { id: "memory:mem-1", label: "One", kind: "memory" },
        { id: "tag:tag-1", label: "old house", kind: "tag" },
        { id: "person:person-1", label: "Maya", kind: "person" },
        { id: "place:place-1", label: "old house", kind: "place" }
      ])
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { source: "memory:mem-1", target: "person:person-1", kind: "memory_context" },
        { source: "memory:mem-1", target: "place:place-1", kind: "memory_context" },
        {
          source: "person:person-1",
          target: "place:place-1",
          kind: "context_relation",
          weight: 1,
          label: "1 shared memory"
        }
      ])
    );
  });

  it("builds graph neighborhoods from connected memories and context", () => {
    const graph = buildTagGraphData(archive);
    const neighborhood = buildGraphNeighborhood(graph, "person:person-1", 1);

    expect(neighborhood?.center).toEqual({ id: "person:person-1", label: "Maya", kind: "person" });
    expect(neighborhood?.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(["person:person-1", "memory:mem-1", "place:place-1"])
    );
    expect(neighborhood?.edges.map((edge) => edge.kind)).toEqual(expect.arrayContaining(["memory_context", "context_relation"]));
  });

  it("builds shared-tag clusters", () => {
    expect(buildTagClusters(archive)).toEqual([
      { id: "tag:tag-1", label: "old house", memoryIds: ["mem-1", "mem-2"], basis: "shared_tag" }
    ]);
  });
});
