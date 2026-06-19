import { createBgeSmallEnV15EmbeddingEngine, type BgeSmallEnV15ModelOptions } from "./bgeEmbeddings";
import type { IEmbeddingEngine } from "./embeddings";
import { createQwenStructuredExtractionEngine, type QwenStructuredExtractionModelOptions } from "./qwenStructuredExtraction";
import type { IStructuredExtractionEngine } from "./structuredExtraction";

export type LocalModelAsset = {
  id: string;
  fileName: string;
  description: string;
  required: boolean;
  expectedByteLength?: number;
  sha256?: string;
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
  invalidAssetIds: string[];
  assetProblems: Array<{ assetId: string; fileName: string; problem: string }>;
};

export interface ILocalModelAssetStore {
  resolveAsset(asset: LocalModelAsset): Promise<{ uri: string; byteLength?: number } | undefined>;
}

export const BGE_SMALL_EN_V15_ASSET_MANIFEST: LocalModelManifest = {
  id: "bge-small-en-v1.5",
  displayName: "BGE small English v1.5",
  runtime: "onnxruntime-react-native",
  assets: [
    {
      id: "onnx-model",
      fileName: "model.onnx",
      description: "ONNX encoder weights exported for BGE small English v1.5.",
      required: true,
      expectedByteLength: 133093490,
      sha256: "828e1496d7fabb79cfa4dcd84fa38625c0d3d21da474a00f08db0f559940cf35"
    },
    {
      id: "tokenizer-json",
      fileName: "tokenizer.json",
      description: "Tokenizer vocabulary and normalization rules compatible with the ONNX export.",
      required: true,
      expectedByteLength: 711396,
      sha256: "d241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66"
    },
    {
      id: "tokenizer-config",
      fileName: "tokenizer_config.json",
      description: "Tokenizer configuration paired with tokenizer.json.",
      required: true,
      expectedByteLength: 366,
      sha256: "9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3"
    },
    {
      id: "special-tokens-map",
      fileName: "special_tokens_map.json",
      description: "Optional special-token metadata for the BGE tokenizer.",
      required: false,
      expectedByteLength: 125,
      sha256: "b6d346be366a7d1d48332dbc9fdf3bf8960b5d879522b7799ddba59e76237ee3"
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
      required: true,
      expectedByteLength: 491400032,
      sha256: "74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db"
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
  const invalidAssetIds: string[] = [];
  const assetProblems: LocalModelAvailability["assetProblems"] = [];

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

    const byteLengthProblem = validateLocalModelAssetByteLength(asset, resolved.byteLength);
    if (byteLengthProblem) {
      assetProblems.push({ assetId: asset.id, fileName: asset.fileName, problem: byteLengthProblem });
      if (asset.required) invalidAssetIds.push(asset.id);
    }
  }

  return {
    manifest,
    available: missingAssetIds.length === 0 && invalidAssetIds.length === 0,
    assets,
    missingAssetIds,
    invalidAssetIds,
    assetProblems
  };
}

export function findLocalModelAssetByFileName(
  manifests: LocalModelManifest[],
  fileName: string
): { manifest: LocalModelManifest; asset: LocalModelAsset } | undefined {
  const normalizedFileName = fileName.trim().toLocaleLowerCase();
  for (const manifest of manifests) {
    const asset = manifest.assets.find((candidate) => candidate.fileName.toLocaleLowerCase() === normalizedFileName);
    if (asset) return { manifest, asset };
  }
  return undefined;
}

function validateLocalModelAssetByteLength(asset: LocalModelAsset, byteLength: number | undefined): string | undefined {
  if (typeof asset.expectedByteLength !== "number" || typeof byteLength !== "number") return undefined;
  if (asset.expectedByteLength === byteLength) return undefined;
  return `Expected ${asset.expectedByteLength} bytes but found ${byteLength}.`;
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
