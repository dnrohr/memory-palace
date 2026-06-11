import { Platform, Share } from "react-native";
import type { ExportArtifact } from "../../../src/export/contracts";
import type { ImportArtifact } from "../../../src/import/contracts";

export async function pickImportArtifacts(): Promise<ImportArtifact[]> {
  const DocumentPicker = await import("expo-document-picker");
  const { File } = await import("expo-file-system");
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: ["application/json", "text/markdown", "text/plain"]
  });

  if (result.canceled) return [];

  return Promise.all(
    result.assets.map(async (asset) => ({
      fileName: asset.name,
      content: await new File(asset.uri).text()
    }))
  );
}

export async function shareExportArtifact(artifact: ExportArtifact): Promise<void> {
  if (Platform.OS === "web") {
    await Share.share({ title: artifact.fileName, message: artifact.content });
    return;
  }

  const { File, Paths } = await import("expo-file-system");
  const safeName = artifact.fileName.replace(/[^a-z0-9._-]+/gi, "-");
  const file = new File(Paths.cache, safeName);
  file.write(artifact.content);
  await Share.share({
    title: artifact.fileName,
    message: artifact.fileName,
    url: file.uri
  });
}

export function combineMarkdownArtifacts(artifacts: ExportArtifact[]): ExportArtifact {
  return {
    fileName: `memory-palace-markdown-${new Date().toISOString().slice(0, 10)}.md`,
    mediaType: "text/markdown",
    content: artifacts.map((artifact) => `<!-- ${artifact.fileName} -->\n\n${artifact.content}`).join("\n\n---\n\n")
  };
}
