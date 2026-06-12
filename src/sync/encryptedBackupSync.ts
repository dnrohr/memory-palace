import type { MemoryArchive } from "../core/archive";
import { mergeArchive, previewArchiveMerge } from "../core/archiveOperations";
import type { EncryptedArchiveAtRestAdapter } from "../security/archiveAtRest";
import type { ISyncProvider, SyncConflict, SyncResult, SyncStatus } from "./contracts";

export type EncryptedBackupSyncProviderOptions = {
  getLocalArchive: () => Promise<MemoryArchive>;
  saveLocalArchive: (archive: MemoryArchive) => Promise<void>;
  backupArchive: EncryptedArchiveAtRestAdapter;
  isCloudProvider?: boolean;
  now?: () => string;
};

export class EncryptedBackupSyncProvider implements ISyncProvider {
  id = "encrypted-backup";
  displayName = "Encrypted backup";
  isCloudProvider: boolean;

  constructor(private readonly options: EncryptedBackupSyncProviderOptions) {
    this.isCloudProvider = Boolean(options.isCloudProvider);
  }

  async getStatus(): Promise<SyncStatus> {
    const backupStatus = await this.options.backupArchive.getStatus();
    return {
      providerId: this.id,
      enabled: backupStatus.active,
      pendingChangeCount: 0,
      ...(backupStatus.encrypted ? { lastSyncedAt: this.now() } : {})
    };
  }

  async sync(): Promise<SyncResult> {
    const status = await this.getStatus();
    if (!status.enabled) {
      return {
        status,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [
          {
            id: "encrypted-backup-disabled",
            entityType: "settings",
            summary: "Encrypted backup sync requires archive encryption with a user passphrase."
          }
        ]
      };
    }

    const localArchive = await this.options.getLocalArchive();
    const remoteArchive = await this.options.backupArchive.loadArchive();

    if (!remoteArchive) {
      await this.options.backupArchive.saveArchive(localArchive);
      return {
        status: await this.getStatus(),
        pushedCount: localArchive.memories.filter((memory) => !memory.deletedAt).length,
        pulledCount: 0,
        conflicts: []
      };
    }

    const mergePreview = previewArchiveMerge(localArchive, remoteArchive);
    const conflicts = mergePreview.conflicts.map(toSyncConflict);
    if (conflicts.length > 0) {
      return {
        status,
        pushedCount: 0,
        pulledCount: 0,
        conflicts
      };
    }

    const mergedArchive = mergeArchive(localArchive, remoteArchive);
    await this.options.saveLocalArchive(mergedArchive);
    await this.options.backupArchive.saveArchive(mergedArchive);

    return {
      status: await this.getStatus(),
      pushedCount: mergePreview.newTagCount,
      pulledCount: mergePreview.newMemoryCount,
      conflicts: []
    };
  }

  async resolveConflict(_conflict: SyncConflict): Promise<void> {
    throw new Error("Encrypted backup sync conflicts must be resolved during archive import/merge.");
  }

  private now(): string {
    return this.options.now?.() ?? new Date().toISOString();
  }
}

function toSyncConflict(conflict: ReturnType<typeof previewArchiveMerge>["conflicts"][number]): SyncConflict {
  switch (conflict.kind) {
    case "duplicate_memory":
      return {
        id: `duplicate-memory-${conflict.incomingId}`,
        entityType: "memory",
        summary: `Duplicate memory${conflict.title ? `: ${conflict.title}` : ""}`
      };
    case "memory_id_conflict":
      return {
        id: `memory-id-${conflict.memoryId}`,
        entityType: "memory",
        summary: `Memory ID conflict: ${conflict.memoryId}`
      };
    case "tag_type_conflict":
      return {
        id: `tag-type-${conflict.tagName}`,
        entityType: "tag",
        summary: `Tag type conflict: ${conflict.tagName}`
      };
  }
}
