import { createBgeSmallEnV15EmbeddingEngine, type BgeSmallEnV15ModelOptions, type IOnnxEmbeddingSession } from "../../../src/processing/bgeEmbeddings";
import type { IEmbeddingEngine } from "../../../src/processing/embeddings";
import type { ResolvedLocalModelAsset } from "../../../src/processing/localModelAssets";
import { createTransformersJsBgeTokenizer } from "../../../src/processing/transformersBgeTokenizer";

export async function loadBgeEmbeddingEngineFromAssets(assets: ResolvedLocalModelAsset[]): Promise<IEmbeddingEngine> {
  const options = await loadBgeRuntimeOptionsFromAssets(assets);
  return createBgeSmallEnV15EmbeddingEngine(options);
}

export async function loadBgeRuntimeOptionsFromAssets(assets: ResolvedLocalModelAsset[]): Promise<BgeSmallEnV15ModelOptions> {
  const model = requiredAsset(assets, "onnx-model");
  const tokenizerJson = requiredAsset(assets, "tokenizer-json");
  const tokenizerDirectory = parentUri(tokenizerJson.uri);
  const [{ InferenceSession }, { AutoTokenizer }] = await Promise.all([
    import("onnxruntime-react-native"),
    import("@huggingface/transformers")
  ]);
  const session = await InferenceSession.create(model.uri);
  const tokenizer = await AutoTokenizer.from_pretrained(tokenizerDirectory, {
    local_files_only: true
  });

  return {
    tokenizer: createTransformersJsBgeTokenizer(tokenizer),
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

function parentUri(uri: string): string {
  const normalized = uri.endsWith("/") ? uri.slice(0, -1) : uri;
  const separatorIndex = normalized.lastIndexOf("/");
  if (separatorIndex < 0) return normalized;
  return normalized.slice(0, separatorIndex + 1);
}

function isNumericArrayLike(value: unknown): value is ArrayLike<number> {
  if (!value || typeof value !== "object" || typeof (value as { length?: unknown }).length !== "number") return false;
  const first = (value as ArrayLike<unknown>)[0];
  return first === undefined || typeof first === "number";
}
