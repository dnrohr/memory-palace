import type { MemoryArchive } from "../core/archive";

export type ExportArtifact = {
  fileName: string;
  mediaType: string;
  content: string;
};

export interface IExportProvider {
  exportArchive(archive: MemoryArchive): Promise<ExportArtifact[]>;
}
