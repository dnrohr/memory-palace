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
