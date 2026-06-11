import type { MemoryArchive } from "../core/archive";
import type { ExportArtifact, IExportProvider } from "./contracts";

export class JsonExportProvider implements IExportProvider {
  async exportArchive(archive: MemoryArchive): Promise<ExportArtifact[]> {
    return [
      {
        fileName: "memory-palace-export.json",
        mediaType: "application/json",
        content: `${JSON.stringify(archive, null, 2)}\n`
      }
    ];
  }
}
