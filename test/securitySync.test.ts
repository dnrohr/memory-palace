import { afterEach, describe, expect, it, vi } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import {
  EncryptedArchiveAtRestAdapter,
  type ArchiveAtRestRecord,
  type IArchiveAtRestRecordStore
} from "../src/security/archiveAtRest";
import { NoAppLockProvider } from "../src/security/appLock";
import { NoEncryptionProvider, WebCryptoExportEncryptionProvider } from "../src/security/encryption";
import { NoSyncProvider } from "../src/sync/contracts";
import { EncryptedBackupSyncProvider } from "../src/sync/encryptedBackupSync";
import { WebDAVSyncProvider } from "../src/sync/webDavSync";

const archiveFixture: MemoryArchive = {
  exportedAt: "2026-06-12T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "A private memory",
      cleanedText: "A private memory",
      title: "Private",
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false
    }
  ],
  tags: [],
  memoryTags: [],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  lifeContextRelationships: [],
  lifeChapterDecisions: [],
  memoryEmbeddings: [],
  processingRuns: []
};

describe("security and sync seams", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps app lock disabled by default but supports lock state", async () => {
    const provider = new NoAppLockProvider();

    await expect(provider.isLocked()).resolves.toBe(false);
    await provider.saveSettings({ mode: "pin", autoLockTimeoutMs: 60_000, hidePreviewsInSwitcher: true });
    await expect(provider.isLocked()).resolves.toBe(true);
    await expect(provider.unlock("1234")).resolves.toBe(true);
    await expect(provider.isLocked()).resolves.toBe(false);
  });

  it("keeps sync disabled by default", async () => {
    const provider = new NoSyncProvider();

    await expect(provider.getStatus()).resolves.toEqual({
      providerId: "none",
      enabled: false,
      pendingChangeCount: 0
    });
    await expect(provider.sync()).resolves.toEqual({
      status: {
        providerId: "none",
        enabled: false,
        pendingChangeCount: 0
      },
      pushedCount: 0,
      pulledCount: 0,
      conflicts: []
    });
  });

  it("exposes encryption preferences while disabled without a provider", async () => {
    const provider = new NoEncryptionProvider();

    await expect(provider.getStatus()).resolves.toEqual(
      expect.objectContaining({
        providerId: "none",
        available: false,
        active: false
      })
    );

    await provider.saveSettings({
      scope: "exports",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });

    await expect(provider.getSettings()).resolves.toEqual({
      scope: "exports",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    await expect(provider.getStatus()).resolves.toEqual(expect.objectContaining({ active: false }));
  });

  it("encrypts and decrypts export text with a passphrase provider", async () => {
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "exports",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });

    await expect(provider.getStatus()).resolves.toEqual(
      expect.objectContaining({
        providerId: "web-crypto-export",
        available: true,
        active: true
      })
    );

    const envelope = await provider.encryptText("private archive", "correct horse battery staple", {
      fileName: "memory-palace-export.json",
      mediaType: "application/json"
    });

    expect(envelope).toEqual(
      expect.objectContaining({
        format: "memory-palace.encrypted.v1",
        algorithm: "AES-GCM",
        kdf: "PBKDF2-SHA-256",
        fileName: "memory-palace-export.json"
      })
    );
    expect(envelope.ciphertext).not.toEqual([...new TextEncoder().encode("private archive")]);
    await expect(provider.decryptText(envelope, "correct horse battery staple")).resolves.toBe("private archive");
    await expect(provider.decryptText(envelope, "wrong passphrase")).rejects.toThrow();
  });

  it("encrypts and decrypts export text when only secure random values are available", async () => {
    let nextByte = 1;
    vi.stubGlobal("crypto", {
      getRandomValues(bytes: Uint8Array) {
        for (let index = 0; index < bytes.length; index += 1) {
          bytes[index] = nextByte;
          nextByte = (nextByte % 250) + 1;
        }
        return bytes;
      }
    });
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "exports",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });

    await expect(provider.getStatus()).resolves.toEqual(
      expect.objectContaining({
        available: true,
        active: true
      })
    );

    const envelope = await provider.encryptText("native private archive", "correct horse battery staple", {
      fileName: "memory-palace-export.json",
      mediaType: "application/json"
    });

    expect(envelope).toEqual(
      expect.objectContaining({
        algorithm: "AES-GCM",
        kdf: "PBKDF2-SHA-256"
      })
    );
    expect(envelope.ciphertext).not.toEqual([...new TextEncoder().encode("native private archive")]);
    await expect(provider.decryptText(envelope, "correct horse battery staple")).resolves.toBe("native private archive");
    await expect(provider.decryptText(envelope, "wrong passphrase")).rejects.toThrow();
  });

  it("encrypts and decrypts an archive-at-rest record", async () => {
    const store = new InMemoryArchiveAtRestRecordStore();
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "archive",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    const adapter = new EncryptedArchiveAtRestAdapter(store, provider, {
      async getPassphrase() {
        return "correct horse battery staple";
      }
    });

    await adapter.saveArchive(archiveFixture);

    expect(store.record).toEqual(
      expect.objectContaining({
        format: "memory-palace.archive.encrypted.v1"
      })
    );
    expect(JSON.stringify(store.record)).not.toContain("A private memory");
    await expect(adapter.getStatus()).resolves.toEqual(expect.objectContaining({ active: true, encrypted: true }));
    await expect(adapter.loadArchive()).resolves.toEqual(expect.objectContaining({ memories: archiveFixture.memories }));
  });

  it("rejects archive-at-rest decryption with the wrong passphrase", async () => {
    const store = new InMemoryArchiveAtRestRecordStore();
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "archive",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    await new EncryptedArchiveAtRestAdapter(store, provider, {
      async getPassphrase() {
        return "correct horse battery staple";
      }
    }).saveArchive(archiveFixture);

    const lockedAdapter = new EncryptedArchiveAtRestAdapter(store, provider, {
      async getPassphrase() {
        return "wrong passphrase";
      }
    });

    await expect(lockedAdapter.loadArchive()).rejects.toThrow();
  });

  it("reads legacy plaintext archive-at-rest records for migration", async () => {
    const store = new InMemoryArchiveAtRestRecordStore({
      format: "memory-palace.archive.plaintext.v1",
      archive: archiveFixture,
      updatedAt: "2026-06-12T00:00:00.000Z"
    });
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    const adapter = new EncryptedArchiveAtRestAdapter(store, provider, {
      async getPassphrase() {
        return "correct horse battery staple";
      }
    });

    await expect(adapter.getStatus()).resolves.toEqual(expect.objectContaining({ encrypted: false }));
    await expect(adapter.loadArchive()).resolves.toEqual(archiveFixture);
  });

  it("pushes a local archive into an encrypted backup", async () => {
    const store = new InMemoryArchiveAtRestRecordStore();
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "archive",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    const backupArchive = new EncryptedArchiveAtRestAdapter(store, provider, {
      async getPassphrase() {
        return "correct horse battery staple";
      }
    });
    const sync = new EncryptedBackupSyncProvider({
      async getLocalArchive() {
        return archiveFixture;
      },
      async saveLocalArchive() {
        throw new Error("Initial backup should not overwrite local archive.");
      },
      backupArchive,
      now: () => "2026-06-12T00:00:00.000Z"
    });

    await expect(sync.sync()).resolves.toEqual(
      expect.objectContaining({
        pushedCount: 1,
        pulledCount: 0,
        conflicts: []
      })
    );
    expect(JSON.stringify(store.record)).not.toContain("A private memory");
    await expect(backupArchive.loadArchive()).resolves.toEqual(expect.objectContaining({ memories: archiveFixture.memories }));
  });

  it("pulls an encrypted backup into the local archive when there are no conflicts", async () => {
    const store = new InMemoryArchiveAtRestRecordStore();
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "archive",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    const backupArchive = new EncryptedArchiveAtRestAdapter(store, provider, {
      async getPassphrase() {
        return "correct horse battery staple";
      }
    });
    await backupArchive.saveArchive(archiveFixture);
    let savedArchive: MemoryArchive | undefined;
    const emptyArchive = { ...archiveFixture, memories: [] };
    const sync = new EncryptedBackupSyncProvider({
      async getLocalArchive() {
        return emptyArchive;
      },
      async saveLocalArchive(archive) {
        savedArchive = archive;
      },
      backupArchive,
      now: () => "2026-06-12T00:00:00.000Z"
    });

    await expect(sync.sync()).resolves.toEqual(
      expect.objectContaining({
        pulledCount: 1,
        conflicts: []
      })
    );
    expect(savedArchive?.memories).toEqual(archiveFixture.memories);
  });

  it("reports a settings conflict when encrypted backup sync is disabled", async () => {
    const sync = new EncryptedBackupSyncProvider({
      async getLocalArchive() {
        return archiveFixture;
      },
      async saveLocalArchive() {
        return undefined;
      },
      backupArchive: new EncryptedArchiveAtRestAdapter(new InMemoryArchiveAtRestRecordStore(), new WebCryptoExportEncryptionProvider(), {
        async getPassphrase() {
          return "correct horse battery staple";
        }
      })
    });

    await expect(sync.sync()).resolves.toEqual(
      expect.objectContaining({
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [expect.objectContaining({ entityType: "settings" })]
      })
    );
  });

  it("pushes an encrypted archive to WebDAV with explicit credentials", async () => {
    let remoteBody: string | undefined;
    let authorizationHeader: string | undefined;
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "archive",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        authorizationHeader = init?.headers ? (init.headers as Record<string, string>).Authorization : undefined;
        if (init?.method === "GET") {
          return remoteBody
            ? response(200, remoteBody)
            : response(404, "");
        }
        if (init?.method === "PUT") {
          remoteBody = String(init.body);
          return response(200, "");
        }
        return response(405, "");
      })
    );

    const sync = new WebDAVSyncProvider({
      async getLocalArchive() {
        return archiveFixture;
      },
      async saveLocalArchive() {
        throw new Error("Initial WebDAV backup should not overwrite local archive.");
      },
      encryptionProvider: provider,
      url: "https://example.test/memory-palace.json",
      username: "user",
      password: "pass",
      passphrase: "correct horse battery staple",
      now: () => "2026-06-12T00:00:00.000Z"
    });

    await expect(sync.sync()).resolves.toEqual(
      expect.objectContaining({
        pushedCount: 1,
        pulledCount: 0,
        conflicts: []
      })
    );
    expect(authorizationHeader).toBe("Basic dXNlcjpwYXNz");
    expect(remoteBody).toContain("memory-palace.archive.encrypted.v1");
    expect(remoteBody).not.toContain("A private memory");
  });

  it("keeps WebDAV sync disabled without an explicit sync passphrase", async () => {
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "archive",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    vi.stubGlobal("fetch", vi.fn(async () => response(404, "")));

    const sync = new WebDAVSyncProvider({
      async getLocalArchive() {
        return archiveFixture;
      },
      async saveLocalArchive() {
        return undefined;
      },
      encryptionProvider: provider,
      url: "https://example.test/memory-palace.json"
    });

    await expect(sync.sync()).resolves.toEqual(
      expect.objectContaining({
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [expect.objectContaining({ id: "webdav-sync-passphrase-missing" })]
      })
    );
  });
});

function response(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? "Not Found" : status === 405 ? "Method Not Allowed" : "OK",
    text: async () => body
  } as Response;
}

class InMemoryArchiveAtRestRecordStore implements IArchiveAtRestRecordStore {
  constructor(public record?: ArchiveAtRestRecord) {}

  async read(): Promise<ArchiveAtRestRecord | undefined> {
    return this.record;
  }

  async write(record: ArchiveAtRestRecord): Promise<void> {
    this.record = record;
  }

  async clear(): Promise<void> {
    this.record = undefined;
  }
}
