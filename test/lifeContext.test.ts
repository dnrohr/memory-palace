import { describe, expect, it } from "vitest";
import {
  createLifeContextId,
  deleteLifeContextEntity,
  findLifeContextMatches,
  upsertLifeContextEntity
} from "../src/core/lifeContext";

describe("life context", () => {
  it("matches known people, pets, places, and life periods in memory text", () => {
    const matches = findLifeContextMatches("Patrick and Maya visited the old house during college.", {
      people: [
        {
          id: "person-1",
          displayName: "Maya",
          normalizedName: "maya",
          createdAt: "2026-06-11T00:00:00.000Z"
        }
      ],
      pets: [{ id: "pet-1", name: "Patrick", species: "dog" }],
      places: [{ id: "place-1", name: "old house", type: "house", privacyLevel: "vague" }],
      lifePeriods: [{ id: "period-1", name: "college", datePrecision: "range" }]
    });

    expect(matches).toEqual([
      { id: "person-1", name: "Maya", kind: "person" },
      { id: "pet-1", name: "Patrick", kind: "pet" },
      { id: "place-1", name: "old house", kind: "place" },
      { id: "period-1", name: "college", kind: "life_period" }
    ]);
  });

  it("upserts and deletes life context entities", () => {
    const context = {
      people: [],
      pets: [],
      places: [],
      lifePeriods: []
    };

    const withPerson = upsertLifeContextEntity(context, {
      kind: "person",
      value: {
        id: createLifeContextId("person", "Maya"),
        displayName: "Maya",
        normalizedName: "maya",
        createdAt: "2026-06-11T00:00:00.000Z"
      }
    });

    expect(withPerson.people).toHaveLength(1);
    expect(deleteLifeContextEntity(withPerson, "person", "person_maya").people).toHaveLength(0);
  });
});
