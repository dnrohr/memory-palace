import type { MemoryArchive } from "../core/archive";
import type { ExportArtifact } from "./contracts";
import { JsonExportProvider } from "./jsonExport";
import { MarkdownExportProvider } from "./markdownExport";

export type BackupManifest = {
  createdAt: string;
  schemaVersion: string;
  artifactCount: number;
  memoryCount: number;
  tagCount: number;
};

export class BackupExportProvider {
  async exportBackup(archive: MemoryArchive, createdAt = new Date().toISOString()): Promise<ExportArtifact[]> {
    const json = await new JsonExportProvider().exportArchive(archive);
    const markdown = await new MarkdownExportProvider().exportArchive(archive);
    const manifest: BackupManifest = {
      createdAt,
      schemaVersion: archive.schemaVersion,
      artifactCount: json.length + markdown.length,
      memoryCount: archive.memories.filter((memory) => !memory.deletedAt).length,
      tagCount: archive.tags.length
    };

    return [
      {
        fileName: "backup-manifest.json",
        mediaType: "application/json",
        content: `${JSON.stringify(manifest, null, 2)}\n`
      },
      ...json,
      ...markdown
    ];
  }
}

