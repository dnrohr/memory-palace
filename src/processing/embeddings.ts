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

export interface IQueryEmbeddingEngine extends IEmbeddingEngine {
  embedQuery(query: string): Promise<EmbeddingVector | undefined>;
}

export interface ILocalEmbeddingModel {
  id: string;
  displayName: string;
  version: string;
  dimension: number;
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
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

export class LocalModelEmbeddingEngine implements IEmbeddingEngine {
  id: string;
  displayName: string;
  dimension: number;
  runsLocally = true;

  constructor(private readonly model: ILocalEmbeddingModel) {
    this.id = `local-model-embedding-${model.id}`;
    this.displayName = model.displayName;
    this.dimension = model.dimension;
  }

  async embedText(text: string): Promise<EmbeddingVector> {
    return this.toEmbeddingVector(await this.model.embed(text));
  }

  async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
    const vectors = this.model.embedBatch ? await this.model.embedBatch(texts) : await Promise.all(texts.map((text) => this.model.embed(text)));
    return vectors.map((values) => this.toEmbeddingVector(values));
  }

  private toEmbeddingVector(values: number[]): EmbeddingVector {
    if (values.length !== this.dimension) {
      throw new Error(`Local embedding model returned ${values.length} dimensions; expected ${this.dimension}.`);
    }
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error("Local embedding model returned a non-finite value.");
    }
    return {
      values: normalizeVector(values),
      modelId: this.id,
      modelVersion: this.model.version
    };
  }
}

export async function embedSearchQuery(engine: IEmbeddingEngine, query: string): Promise<EmbeddingVector | undefined> {
  return isQueryEmbeddingEngine(engine) ? engine.embedQuery(query) : engine.embedText(query);
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

function isQueryEmbeddingEngine(engine: IEmbeddingEngine): engine is IQueryEmbeddingEngine {
  return typeof (engine as Partial<IQueryEmbeddingEngine>).embedQuery === "function";
}
