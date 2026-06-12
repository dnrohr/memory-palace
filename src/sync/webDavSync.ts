import type { MemoryArchive } from "../core/archive";
import { mergeArchive, previewArchiveMerge } from "../core/archiveOperations";
import { EncryptedArchiveAtRestAdapter, type IArchiveAtRestRecordStore, type ArchiveAtRestRecord } from "../security/archiveAtRest";
import type { IEncryptionProvider } from "../security/encryption";
import type { ISyncProvider, SyncConflict, SyncResult, SyncStatus } from "./contracts";

export type WebDAVSyncProviderOptions = {
  getLocalArchive: () => Promise<MemoryArchive>;
  saveLocalArchive: (archive: MemoryArchive) => Promise<void>;
  encryptionProvider: IEncryptionProvider;
  url: string;
  username?: string;
  password?: string;
  passphrase?: string;
  now?: () => string;
};

export class WebDAVRecordStore implements IArchiveAtRestRecordStore {
  private readonly url: string;
  private readonly authHeader: string;

  constructor(url: string, username = "", password = "") {
    this.url = url;
    const credentials = `${username}:${password}`;
    this.authHeader = `Basic ${base64Encode(credentials)}`;
  }

  async read(): Promise<ArchiveAtRestRecord | undefined> {
    try {
      const response = await fetch(this.url, {
        method: "GET",
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json"
        }
      });

      if (response.status === 404) {
        return undefined;
      }

      if (!response.ok) {
        throw new Error(`WebDAV GET failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      if (!text.trim()) return undefined;

      return JSON.parse(text) as ArchiveAtRestRecord;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return undefined;
      }
      throw error;
    }
  }

  async write(record: ArchiveAtRestRecord): Promise<void> {
    const response = await fetch(this.url, {
      method: "PUT",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(record, null, 2)
    });

    if (!response.ok) {
      throw new Error(`WebDAV PUT failed: ${response.status} ${response.statusText}`);
    }
  }

  async clear(): Promise<void> {
    const response = await fetch(this.url, {
      method: "DELETE",
      headers: {
        Authorization: this.authHeader
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`WebDAV DELETE failed: ${response.status} ${response.statusText}`);
    }
  }
}

export class WebDAVSyncProvider implements ISyncProvider {
  id = "webdav-sync";
  displayName = "WebDAV Sync";
  isCloudProvider = true;

  private readonly recordStore: WebDAVRecordStore;
  private readonly backupAdapter: EncryptedArchiveAtRestAdapter;

  constructor(private readonly options: WebDAVSyncProviderOptions) {
    this.recordStore = new WebDAVRecordStore(
      options.url,
      options.username ?? "",
      options.password ?? ""
    );
    this.backupAdapter = new EncryptedArchiveAtRestAdapter(
      this.recordStore,
      options.encryptionProvider,
      {
        getPassphrase: async () => options.passphrase
      }
    );
  }

  async getStatus(): Promise<SyncStatus> {
    try {
      const backupStatus = await this.backupAdapter.getStatus();
      return {
        providerId: this.id,
        enabled: backupStatus.active,
        pendingChangeCount: 0,
        ...(backupStatus.encrypted ? { lastSyncedAt: this.now() } : {})
      };
    } catch {
      return {
        providerId: this.id,
        enabled: false,
        pendingChangeCount: 0
      };
    }
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
            id: "webdav-sync-encryption-required",
            entityType: "settings",
            summary: "WebDAV sync requires archive encryption with a user passphrase."
          }
        ]
      };
    }

    if (!this.options.passphrase) {
      return {
        status,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [
          {
            id: "webdav-sync-passphrase-missing",
            entityType: "settings",
            summary: "A sync passphrase is required."
          }
        ]
      };
    }

    try {
      const localArchive = await this.options.getLocalArchive();
      const remoteArchive = await this.backupAdapter.loadArchive();

      if (!remoteArchive) {
        await this.backupAdapter.saveArchive(localArchive);
        return {
          status: await this.getStatus(),
          pushedCount: localArchive.memories.filter((m) => !m.deletedAt).length,
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
      await this.backupAdapter.saveArchive(mergedArchive);

      return {
        status: await this.getStatus(),
        pushedCount: mergePreview.newTagCount,
        pulledCount: mergePreview.newMemoryCount,
        conflicts: []
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        status,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [
          {
            id: "webdav-sync-error",
            entityType: "settings",
            summary: `WebDAV sync failed: ${msg}`
          }
        ]
      };
    }
  }

  async resolveConflict(_conflict: SyncConflict): Promise<void> {
    throw new Error("WebDAV sync conflicts must be resolved during archive import/merge.");
  }

  private now(): string {
    return this.options.now?.() ?? new Date().toISOString();
  }
}

function base64Encode(str: string): string {
  if (typeof btoa === "function") {
    return btoa(str);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  while (i < str.length) {
    const c1 = str.charCodeAt(i++);
    const c2 = i < str.length ? str.charCodeAt(i++) : NaN;
    const c3 = i < str.length ? str.charCodeAt(i++) : NaN;
    const byte1 = c1 >> 2;
    const byte2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const byte3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6);
    const byte4 = isNaN(c3) ? 64 : c3 & 63;
    result += chars.charAt(byte1) + chars.charAt(byte2) + (byte3 === 64 ? "=" : chars.charAt(byte3)) + (byte4 === 64 ? "=" : chars.charAt(byte4));
  }
  return result;
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
