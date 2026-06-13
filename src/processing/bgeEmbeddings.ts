import { LocalModelEmbeddingEngine, type ILocalEmbeddingModel } from "./embeddings";

export const BGE_SMALL_EN_V15_MODEL = {
  id: "bge-small-en-v1.5",
  displayName: "BGE small English v1.5",
  version: "1.5",
  dimension: 384,
  provider: "BAAI",
  runtime: "onnxruntime-react-native",
  queryPrefix: "Represent this sentence for searching relevant passages: ",
  passagePrefix: ""
} as const;

export type BgeTokenizedBatch = {
  inputIds: number[][];
  attentionMask: number[][];
  tokenTypeIds?: number[][];
};

export interface IBgeTokenizer {
  tokenize(texts: string[]): Promise<BgeTokenizedBatch>;
}

export type OnnxTensorLike = {
  data: ArrayLike<number>;
  dims: readonly number[];
};

export interface IOnnxEmbeddingSession {
  run(feeds: Record<string, unknown>): Promise<Record<string, OnnxTensorLike>>;
}

export type BgeSmallEnV15ModelOptions = {
  tokenizer: IBgeTokenizer;
  session: IOnnxEmbeddingSession;
  outputName?: string;
};

export class BgeSmallEnV15OnnxModel implements ILocalEmbeddingModel {
  id = BGE_SMALL_EN_V15_MODEL.id;
  displayName = BGE_SMALL_EN_V15_MODEL.displayName;
  version = BGE_SMALL_EN_V15_MODEL.version;
  dimension = BGE_SMALL_EN_V15_MODEL.dimension;

  constructor(private readonly options: BgeSmallEnV15ModelOptions) {}

  async embed(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text]);
    return embedding ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const preparedTexts = texts.map((text) => toPassageInput(text));
    const tokenized = await this.options.tokenizer.tokenize(preparedTexts);
    const outputs = await this.options.session.run(toOnnxFeeds(tokenized));
    const output = selectEmbeddingOutput(outputs, this.options.outputName);
    return meanPoolTokenEmbeddings(output, tokenized.attentionMask);
  }
}

export class BgeSmallEnV15EmbeddingEngine extends LocalModelEmbeddingEngine {
  constructor(model: BgeSmallEnV15OnnxModel) {
    super(model);
  }

  async embedQuery(query: string) {
    return this.embedText(toQueryInput(query));
  }
}

export function createBgeSmallEnV15EmbeddingEngine(options: BgeSmallEnV15ModelOptions): BgeSmallEnV15EmbeddingEngine {
  return new BgeSmallEnV15EmbeddingEngine(new BgeSmallEnV15OnnxModel(options));
}

export function toQueryInput(query: string): string {
  return `${BGE_SMALL_EN_V15_MODEL.queryPrefix}${query.trim()}`;
}

export function toPassageInput(text: string): string {
  return `${BGE_SMALL_EN_V15_MODEL.passagePrefix}${text.trim()}`;
}

export function meanPoolTokenEmbeddings(output: OnnxTensorLike, attentionMask: number[][]): number[][] {
  const [batchSize, tokenCount, dimension] = output.dims;
  if (!batchSize || !tokenCount || !dimension || output.dims.length !== 3) {
    throw new Error("BGE embedding output must be a [batch, tokens, dimension] tensor.");
  }
  if (dimension !== BGE_SMALL_EN_V15_MODEL.dimension) {
    throw new Error(`BGE embedding output returned ${dimension} dimensions; expected ${BGE_SMALL_EN_V15_MODEL.dimension}.`);
  }
  if (attentionMask.length !== batchSize) {
    throw new Error("BGE attention mask batch size does not match model output.");
  }

  const embeddings: number[][] = [];
  for (let batchIndex = 0; batchIndex < batchSize; batchIndex += 1) {
    const mask = attentionMask[batchIndex] ?? [];
    const pooled = Array.from({ length: dimension }, () => 0);
    let visibleTokenCount = 0;

    for (let tokenIndex = 0; tokenIndex < tokenCount; tokenIndex += 1) {
      if (!mask[tokenIndex]) continue;
      visibleTokenCount += 1;
      for (let dimensionIndex = 0; dimensionIndex < dimension; dimensionIndex += 1) {
        const offset = batchIndex * tokenCount * dimension + tokenIndex * dimension + dimensionIndex;
        pooled[dimensionIndex] = (pooled[dimensionIndex] ?? 0) + Number(output.data[offset] ?? 0);
      }
    }

    if (visibleTokenCount === 0) {
      embeddings.push(pooled);
      continue;
    }
    embeddings.push(pooled.map((value) => value / visibleTokenCount));
  }

  return embeddings;
}

function toOnnxFeeds(tokenized: BgeTokenizedBatch): Record<string, unknown> {
  return {
    input_ids: tokenized.inputIds,
    attention_mask: tokenized.attentionMask,
    ...(tokenized.tokenTypeIds ? { token_type_ids: tokenized.tokenTypeIds } : {})
  };
}

function selectEmbeddingOutput(outputs: Record<string, OnnxTensorLike>, outputName?: string): OnnxTensorLike {
  if (outputName) {
    const output = outputs[outputName];
    if (!output) throw new Error(`BGE ONNX output "${outputName}" was not returned.`);
    return output;
  }

  const [firstOutput] = Object.values(outputs);
  if (!firstOutput) throw new Error("BGE ONNX session did not return any outputs.");
  return firstOutput;
}
