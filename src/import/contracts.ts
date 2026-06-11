import type { MemoryArchive } from "../core/archive";

export type ImportArtifact = {
  fileName: string;
  content: string;
};

export type ImportPreview = {
  archive: MemoryArchive;
  memoryCount: number;
  tagCount: number;
  warnings: string[];
};

export interface IImportProvider {
  previewImport(artifacts: ImportArtifact[]): Promise<ImportPreview>;
}

