import type { MemoryArchive } from "../core/archive";
import { mergeArchive, previewArchiveMerge, type ArchiveMergeOptions, type ArchiveMergePreview } from "../core/archiveOperations";
import type { ImportArtifact, ImportPreview } from "./contracts";
import { JsonImportProvider } from "./jsonImport";
import { MarkdownImportProvider } from "./markdownImport";

export type ArchiveImportWorkflowPreview = ImportPreview & {
  mergePreview: ArchiveMergePreview;
};

export async function previewArchiveImport(
  current: MemoryArchive,
  artifacts: ImportArtifact[]
): Promise<ArchiveImportWorkflowPreview> {
  const provider = artifacts.some((artifact) => artifact.fileName.endsWith(".json"))
    ? new JsonImportProvider()
    : new MarkdownImportProvider();
  const preview = await provider.previewImport(artifacts);

  return {
    ...preview,
    mergePreview: previewArchiveMerge(current, preview.archive)
  };
}

export function applyArchiveImport(current: MemoryArchive, preview: ImportPreview, options: ArchiveMergeOptions = {}): MemoryArchive {
  return mergeArchive(current, preview.archive, options);
}

export type { ArchiveMergeOptions };
