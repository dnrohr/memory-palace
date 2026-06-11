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

export type LifeContextEntity =
  | { kind: "person"; value: Person }
  | { kind: "pet"; value: Pet }
  | { kind: "place"; value: Place }
  | { kind: "life_period"; value: LifePeriod };

export function upsertLifeContextEntity(context: LifeContext, entity: LifeContextEntity): LifeContext {
  switch (entity.kind) {
    case "person":
      return { ...context, people: upsertById(context.people, entity.value) };
    case "pet":
      return { ...context, pets: upsertById(context.pets, entity.value) };
    case "place":
      return { ...context, places: upsertById(context.places, entity.value) };
    case "life_period":
      return { ...context, lifePeriods: upsertById(context.lifePeriods, entity.value) };
  }
}

export function deleteLifeContextEntity(context: LifeContext, kind: LifeContextEntity["kind"], id: string): LifeContext {
  switch (kind) {
    case "person":
      return { ...context, people: context.people.filter((item) => item.id !== id) };
    case "pet":
      return { ...context, pets: context.pets.filter((item) => item.id !== id) };
    case "place":
      return { ...context, places: context.places.filter((item) => item.id !== id) };
    case "life_period":
      return { ...context, lifePeriods: context.lifePeriods.filter((item) => item.id !== id) };
  }
}

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

export function createLifeContextId(prefix: LifeContextEntity["kind"], name: string): string {
  const slug = normalize(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `${prefix}_${slug || Date.now().toString(36)}`;
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

function upsertById<T extends { id: string }>(items: T[], value: T): T[] {
  const index = items.findIndex((item) => item.id === value.id);
  if (index < 0) return [...items, value];
  return items.map((item) => (item.id === value.id ? value : item));
}
