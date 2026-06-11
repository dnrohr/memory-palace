import type { LifePeriod, Person, Pet, Place } from "./types";

export type LifeContext = {
  people: Person[];
  pets: Pet[];
  places: Place[];
  lifePeriods: LifePeriod[];
};

export type LifeContextMatch = {
  id: string;
  name: string;
  kind: "person" | "pet" | "place" | "life_period";
};

export function findLifeContextMatches(text: string, context: LifeContext): LifeContextMatch[] {
  const normalizedText = normalize(text);
  const matches: LifeContextMatch[] = [];

  for (const person of context.people) {
    if (containsName(normalizedText, person.displayName)) {
      matches.push({ id: person.id, name: person.displayName, kind: "person" });
    }
  }

  for (const pet of context.pets) {
    if (containsName(normalizedText, pet.name)) {
      matches.push({ id: pet.id, name: pet.name, kind: "pet" });
    }
  }

  for (const place of context.places) {
    if (containsName(normalizedText, place.name)) {
      matches.push({ id: place.id, name: place.name, kind: "place" });
    }
  }

  for (const lifePeriod of context.lifePeriods) {
    if (containsName(normalizedText, lifePeriod.name)) {
      matches.push({ id: lifePeriod.id, name: lifePeriod.name, kind: "life_period" });
    }
  }

  return matches;
}

function containsName(normalizedText: string, name: string): boolean {
  const normalizedName = normalize(name);
  return new RegExp(`\\b${escapeRegExp(normalizedName)}\\b`, "i").test(normalizedText);
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

