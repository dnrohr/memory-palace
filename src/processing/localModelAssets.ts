import { createBgeSmallEnV15EmbeddingEngine, type BgeSmallEnV15ModelOptions } from "./bgeEmbeddings";
import type { IEmbeddingEngine } from "./embeddings";
import { createQwenStructuredExtractionEngine, type QwenStructuredExtractionModelOptions } from "./qwenStructuredExtraction";
import type { IStructuredExtractionEngine } from "./structuredExtraction";

export type LocalModelAsset = {
  id: string;
  fileName: string;
  description: string;
  required: boolean;
};

export type LocalModelManifest = {
  id: string;
  displayName: string;
  runtime: string;
  assets: LocalModelAsset[];
};

export type ResolvedLocalModelAsset = LocalModelAsset & {
  uri: string;
  byteLength?: number;
};

export type LocalModelAvailability = {
  manifest: LocalModelManifest;
  available: boolean;
  assets: ResolvedLocalModelAsset[];
  missingAssetIds: string[];
};

export interface ILocalModelAssetStore {
  resolveAsset(asset: LocalModelAsset): Promise<{ uri: string; byteLength?: number } | undefined>;
}

export const BGE_SMALL_EN_V15_ASSET_MANIFEST: LocalModelManifest = {
  id: "bge-small-en-v1.5",
  displayName: "BGE small English v1.5",
  runtime: "onnxruntime-react-native or Transformers.js",
  assets: [
    {
      id: "onnx-model",
      fileName: "model.onnx",
      description: "ONNX encoder weights exported for BGE small English v1.5.",
      required: true
    },
    {
      id: "tokenizer-json",
      fileName: "tokenizer.json",
      description: "Tokenizer vocabulary and normalization rules compatible with the ONNX export.",
      required: true
    },
    {
      id: "tokenizer-config",
      fileName: "tokenizer_config.json",
      description: "Tokenizer configuration used by Transformers.js when loading from local files.",
      required: true
    },
    {
      id: "special-tokens-map",
      fileName: "special_tokens_map.json",
      description: "Optional special-token metadata for the BGE tokenizer.",
      required: false
    }
  ]
};

export const QWEN_2_5_0_5B_ASSET_MANIFEST: LocalModelManifest = {
  id: "qwen2.5-0.5b-instruct",
  displayName: "Qwen2.5 0.5B Instruct",
  runtime: "llama.rn",
  assets: [
    {
      id: "gguf-model",
      fileName: "qwen2.5-0.5b-instruct-q4_k_m.gguf",
      description: "Quantized GGUF model file for llama.cpp-compatible local structured extraction.",
      required: true
    },
    {
      id: "json-grammar",
      fileName: "structured-extraction.gbnf",
      description: "Optional grammar that constrains completions to JSON object output.",
      required: false
    }
  ]
};

export async function checkLocalModelAvailability(
  manifest: LocalModelManifest,
  store: ILocalModelAssetStore
): Promise<LocalModelAvailability> {
  const assets: ResolvedLocalModelAsset[] = [];
  const missingAssetIds: string[] = [];

  for (const asset of manifest.assets) {
    const resolved = await store.resolveAsset(asset);
    if (!resolved) {
      if (asset.required) missingAssetIds.push(asset.id);
      continue;
    }

    assets.push({
      ...asset,
      uri: resolved.uri,
      ...(typeof resolved.byteLength === "number" ? { byteLength: resolved.byteLength } : {})
    });
  }

  return {
    manifest,
    available: missingAssetIds.length === 0,
    assets,
    missingAssetIds
  };
}

export async function createBgeEmbeddingEngineFromAssets(
  store: ILocalModelAssetStore,
  loadRuntime: (assets: ResolvedLocalModelAsset[]) => Promise<BgeSmallEnV15ModelOptions>
): Promise<IEmbeddingEngine | undefined> {
  const availability = await checkLocalModelAvailability(BGE_SMALL_EN_V15_ASSET_MANIFEST, store);
  if (!availability.available) return undefined;
  return createBgeSmallEnV15EmbeddingEngine(await loadRuntime(availability.assets));
}

export async function createQwenStructuredExtractionEngineFromAssets(
  store: ILocalModelAssetStore,
  loadRuntime: (assets: ResolvedLocalModelAsset[]) => Promise<QwenStructuredExtractionModelOptions>
): Promise<IStructuredExtractionEngine | undefined> {
  const availability = await checkLocalModelAvailability(QWEN_2_5_0_5B_ASSET_MANIFEST, store);
  if (!availability.available) return undefined;
  return createQwenStructuredExtractionEngine(await loadRuntime(availability.assets));
}
