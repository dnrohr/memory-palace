import {
  findLocalModelAssetByFileName,
  type ILocalModelAssetStore,
  type LocalModelAsset,
  type LocalModelManifest
} from "../../../src/processing/localModelAssets";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export const LOCAL_MODEL_ROOT_FOLDER = "models";

export type ImportedLocalModelFile = {
  manifestId: string;
  fileName: string;
  byteLength?: number;
};

export type LocalModelImportResult = {
  imported: ImportedLocalModelFile[];
  ignoredFileNames: string[];
};

export class ExpoDocumentLocalModelAssetStore implements ILocalModelAssetStore {
  constructor(private readonly manifest: LocalModelManifest) {}

  async resolveAsset(asset: LocalModelAsset): Promise<{ uri: string; byteLength?: number } | undefined> {
    if (Platform.OS === "web") return undefined;

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

export async function pickAndImportLocalModelFiles(manifests: LocalModelManifest[]): Promise<LocalModelImportResult> {
  if (Platform.OS === "web") {
    throw new Error("Local model file import is available in the native app.");
  }

  const DocumentPicker = await import("expo-document-picker");
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: ["*/*"]
  });

  if (result.canceled) return { imported: [], ignoredFileNames: [] };

  return importLocalModelFiles(
    manifests,
    result.assets.map((asset) => ({
      name: asset.name,
      uri: asset.uri
    }))
  );
}

export async function importLocalModelFiles(
  manifests: LocalModelManifest[],
  files: Array<{ name: string; uri: string }>
): Promise<LocalModelImportResult> {
  const imported: ImportedLocalModelFile[] = [];
  const ignoredFileNames: string[] = [];

  for (const pickedFile of files) {
    const match = findLocalModelAssetByFileName(manifests, pickedFile.name);
    if (!match) {
      ignoredFileNames.push(pickedFile.name);
      continue;
    }

    const destinationDirectory = ensureLocalModelDirectory(match.manifest);
    const source = new File(pickedFile.uri);
    const destination = new File(destinationDirectory, match.asset.fileName);
    await source.copy(destination, { overwrite: true });
    imported.push({
      manifestId: match.manifest.id,
      fileName: match.asset.fileName,
      byteLength: destination.size
    });
  }

  return { imported, ignoredFileNames };
}

function ensureLocalModelDirectory(manifest: LocalModelManifest): Directory {
  const root = new Directory(Paths.document, LOCAL_MODEL_ROOT_FOLDER);
  root.create({ idempotent: true, intermediates: true });
  const modelDirectory = new Directory(root, manifest.id);
  modelDirectory.create({ idempotent: true, intermediates: true });
  return modelDirectory;
}
