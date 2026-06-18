import { createBgeSmallEnV15EmbeddingEngine, type BgeSmallEnV15ModelOptions, type IOnnxEmbeddingSession } from "../../../src/processing/bgeEmbeddings";
import type { IEmbeddingEngine } from "../../../src/processing/embeddings";
import type { ResolvedLocalModelAsset } from "../../../src/processing/localModelAssets";
import { createWordPieceBgeTokenizerFromTokenizerJson } from "../../../src/processing/wordPieceBgeTokenizer";
import { File } from "expo-file-system";

export async function loadBgeEmbeddingEngineFromAssets(assets: ResolvedLocalModelAsset[]): Promise<IEmbeddingEngine> {
  const options = await loadBgeRuntimeOptionsFromAssets(assets);
  return createBgeSmallEnV15EmbeddingEngine(options);
}

export async function loadBgeRuntimeOptionsFromAssets(assets: ResolvedLocalModelAsset[]): Promise<BgeSmallEnV15ModelOptions> {
  const model = requiredAsset(assets, "onnx-model");
  const tokenizerJson = requiredAsset(assets, "tokenizer-json");
  const { InferenceSession } = await import("onnxruntime-react-native");
  const session = await InferenceSession.create(model.uri);
  const tokenizer = createWordPieceBgeTokenizerFromTokenizerJson(await new File(tokenizerJson.uri).text());

  return {
    tokenizer,
    session: toBgeOnnxSession(session)
  };
}

function toBgeOnnxSession(session: { run(feeds: Record<string, unknown>): Promise<Record<string, { data: unknown; dims: readonly number[] }>> }): IOnnxEmbeddingSession {
  return {
    async run(feeds) {
      const outputs = await session.run(feeds);
      return Object.fromEntries(
        Object.entries(outputs).map(([name, tensor]) => {
          if (!isNumericArrayLike(tensor.data)) {
            throw new Error(`BGE ONNX output "${name}" returned non-numeric tensor data.`);
          }
          return [name, { data: tensor.data, dims: tensor.dims }];
        })
      );
    }
  };
}

function requiredAsset(assets: ResolvedLocalModelAsset[], id: string): ResolvedLocalModelAsset {
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Required BGE asset "${id}" was not resolved.`);
  return asset;
}

function isNumericArrayLike(value: unknown): value is ArrayLike<number> {
  if (!value || typeof value !== "object" || typeof (value as { length?: unknown }).length !== "number") return false;
  const first = (value as ArrayLike<unknown>)[0];
  return first === undefined || typeof first === "number";
}
