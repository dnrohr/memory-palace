import { createBgeSmallEnV15EmbeddingEngine, type BgeSmallEnV15ModelOptions, type IOnnxEmbeddingSession } from "../../../src/processing/bgeEmbeddings";
import type { IEmbeddingEngine } from "../../../src/processing/embeddings";
import type { ResolvedLocalModelAsset } from "../../../src/processing/localModelAssets";
import { createWordPieceBgeTokenizerFromTokenizerJson } from "../../../src/processing/wordPieceBgeTokenizer";
import { File } from "expo-file-system";
import { NativeModules, Platform } from "react-native";

export async function loadBgeEmbeddingEngineFromAssets(assets: ResolvedLocalModelAsset[]): Promise<IEmbeddingEngine> {
  const options = await loadBgeRuntimeOptionsFromAssets(assets);
  return createBgeSmallEnV15EmbeddingEngine(options);
}

export async function loadBgeRuntimeOptionsFromAssets(assets: ResolvedLocalModelAsset[]): Promise<BgeSmallEnV15ModelOptions> {
  const model = requiredAsset(assets, "onnx-model");
  const tokenizerJson = requiredAsset(assets, "tokenizer-json");
  assertOnnxRuntimeNativeModuleAvailable();
  const { InferenceSession, Tensor } = await import("onnxruntime-react-native");
  const session = await InferenceSession.create(model.uri);
  const tokenizer = createWordPieceBgeTokenizerFromTokenizerJson(await new File(tokenizerJson.uri).text());

  return {
    tokenizer,
    session: toBgeOnnxSession(session, Tensor)
  };
}

function toBgeOnnxSession(
  session: { run(feeds: Record<string, unknown>): Promise<Record<string, { data: unknown; dims: readonly number[] }>> },
  Tensor: new (type: "int64", data: readonly number[], dims?: readonly number[]) => unknown
): IOnnxEmbeddingSession {
  return {
    async run(feeds) {
      const outputs = await session.run(toNativeBgeFeeds(feeds, Tensor));
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

function toNativeBgeFeeds(
  feeds: Record<string, unknown>,
  Tensor: new (type: "int64", data: readonly number[], dims?: readonly number[]) => unknown
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(feeds).map(([name, value]) => {
      return [name, toInt64Tensor(name, toNumberRows(name, value), Tensor)];
    })
  );
}

function toInt64Tensor(
  name: string,
  rows: number[][],
  Tensor: new (type: "int64", data: readonly number[], dims?: readonly number[]) => unknown
): unknown {
  const tokenCount = rows[0]?.length ?? 0;
  if (!rows.length || !tokenCount) {
    throw new Error(`BGE ONNX input "${name}" must contain at least one token.`);
  }
  if (rows.some((row) => row.length !== tokenCount)) {
    throw new Error(`BGE ONNX input "${name}" rows must all have the same token length.`);
  }
  return new Tensor("int64", rows.flat(), [rows.length, tokenCount]);
}

function toNumberRows(name: string, value: unknown): number[][] {
  if (!Array.isArray(value) || value.some((row) => !Array.isArray(row) || row.some((token) => typeof token !== "number"))) {
    throw new Error(`BGE ONNX input "${name}" must be a two-dimensional number array.`);
  }
  return value;
}

function assertOnnxRuntimeNativeModuleAvailable(): void {
  if (Platform.OS === "web") {
    throw new Error("BGE native runtime loading requires iOS or Android.");
  }
  if (!NativeModules.Onnxruntime) {
    throw new Error("ONNX Runtime native module is unavailable; rebuild the app with onnxruntime-react-native linked.");
  }
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
