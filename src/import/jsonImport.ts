import type { MemoryArchive } from "../core/archive";
import type { IImportProvider, ImportArtifact, ImportPreview } from "./contracts";

export class JsonImportProvider implements IImportProvider {
  async previewImport(artifacts: ImportArtifact[]): Promise<ImportPreview> {
    const artifact = artifacts.find((item) => item.fileName.endsWith(".json")) ?? artifacts[0];
    if (!artifact) throw new Error("No JSON import artifact provided.");

    const archive = JSON.parse(artifact.content) as MemoryArchive;
    const warnings = validateArchive(archive);

    return {
      archive,
      memoryCount: archive.memories?.length ?? 0,
      tagCount: archive.tags?.length ?? 0,
      warnings
    };
  }
}

function validateArchive(archive: MemoryArchive): string[] {
  const warnings: string[] = [];
  if (!archive.schemaVersion) warnings.push("Archive is missing schemaVersion.");
  if (!Array.isArray(archive.memories)) warnings.push("Archive is missing memories.");
  if (!Array.isArray(archive.tags)) warnings.push("Archive is missing tags.");
  if (!Array.isArray(archive.memoryTags)) warnings.push("Archive is missing memoryTags.");
  return warnings;
}

