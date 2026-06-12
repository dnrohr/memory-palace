import type { MemoryArchive } from "../core/archive";
import type { ExportArtifact, IExportProvider } from "./contracts";
import { MarkdownExportProvider } from "./markdownExport";

export type MarkdownBundleManifest = {
  format: "memory-palace.markdown-bundle.v1";
  createdAt: string;
  schemaVersion: string;
  memoryCount: number;
  files: string[];
};

export class MarkdownBundleExportProvider implements IExportProvider {
  async exportArchive(archive: MemoryArchive, createdAt = new Date().toISOString()): Promise<ExportArtifact[]> {
    const markdown = await new MarkdownExportProvider().exportArchive(archive);
    const manifest: MarkdownBundleManifest = {
      format: "memory-palace.markdown-bundle.v1",
      createdAt,
      schemaVersion: archive.schemaVersion,
      memoryCount: markdown.length,
      files: markdown.map((artifact) => artifact.fileName)
    };

    return [
      {
        fileName: "memory-palace-markdown-manifest.json",
        mediaType: "application/json",
        content: `${JSON.stringify(manifest, null, 2)}\n`
      },
      ...markdown
    ];
  }
}
