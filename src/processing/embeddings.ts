export type EmbeddingVector = {
  values: number[];
  modelId: string;
  modelVersion: string;
};

export interface IEmbeddingEngine {
  id: string;
  displayName: string;
  dimension: number;
  runsLocally: boolean;
  embedText(text: string): Promise<EmbeddingVector | undefined>;
  embedBatch(texts: string[]): Promise<Array<EmbeddingVector | undefined>>;
}

export class NoEmbeddingEngine implements IEmbeddingEngine {
  id = "none";
  displayName = "Embeddings disabled";
  dimension = 0;
  runsLocally = true;

  async embedText(_text: string): Promise<undefined> {
    return undefined;
  }

  async embedBatch(texts: string[]): Promise<undefined[]> {
    return texts.map(() => undefined);
  }
}

export class HashEmbeddingEngine implements IEmbeddingEngine {
  id = "hash-embedding";
  displayName = "Local hash embedding";
  dimension: number;
  runsLocally = true;

  constructor(dimension = 64) {
    this.dimension = dimension;
  }

  async embedText(text: string): Promise<EmbeddingVector> {
    return {
      values: normalizeVector(hashTextToVector(text, this.dimension)),
      modelId: this.id,
      modelVersion: "0.1.0"
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
    return Promise.all(texts.map((text) => this.embedText(text)));
  }
}

function hashTextToVector(text: string, dimension: number): number[] {
  const vector = Array.from({ length: dimension }, () => 0);
  const tokens = text.toLocaleLowerCase().match(/[a-z0-9]+/g) ?? [];

  for (const token of tokens) {
    const index = positiveHash(token) % dimension;
    vector[index] = (vector[index] ?? 0) + 1;
  }

  return vector;
}

function positiveHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function normalizeVector(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return values;
  return values.map((value) => value / magnitude);
}
