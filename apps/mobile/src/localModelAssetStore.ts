import type { ILocalModelAssetStore, LocalModelAsset, LocalModelManifest } from "../../../src/processing/localModelAssets";
import { Platform } from "react-native";

export const LOCAL_MODEL_ROOT_FOLDER = "models";

export class ExpoDocumentLocalModelAssetStore implements ILocalModelAssetStore {
  constructor(private readonly manifest: LocalModelManifest) {}

  async resolveAsset(asset: LocalModelAsset): Promise<{ uri: string; byteLength?: number } | undefined> {
    if (Platform.OS === "web") return undefined;

    const { File, Paths } = await import("expo-file-system");
    const file = new File(Paths.document, LOCAL_MODEL_ROOT_FOLDER, this.manifest.id, asset.fileName);
    if (!file.exists) return undefined;
    return {
      uri: file.uri,
      byteLength: file.size
    };
  }
}

export function localModelDirectoryHint(manifest: LocalModelManifest): string {
  return `${LOCAL_MODEL_ROOT_FOLDER}/${manifest.id}`;
}
