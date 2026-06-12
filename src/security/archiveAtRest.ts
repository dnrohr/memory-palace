import type { MemoryArchive } from "../core/archive";
import type { EncryptedTextEnvelope, IEncryptionProvider } from "./encryption";

export type PlaintextArchiveAtRestRecord = {
  format: "memory-palace.archive.plaintext.v1";
  archive: MemoryArchive;
  updatedAt: string;
};

export type EncryptedArchiveAtRestRecord = {
  format: "memory-palace.archive.encrypted.v1";
  envelope: EncryptedTextEnvelope;
  updatedAt: string;
};

export type ArchiveAtRestRecord = PlaintextArchiveAtRestRecord | EncryptedArchiveAtRestRecord;

export interface IArchiveAtRestRecordStore {
  read(): Promise<ArchiveAtRestRecord | undefined>;
  write(record: ArchiveAtRestRecord): Promise<void>;
  clear(): Promise<void>;
}

export interface IArchivePassphraseProvider {
  getPassphrase(): Promise<string | undefined>;
}

export type ArchiveAtRestStatus = {
  providerId: string;
  available: boolean;
  active: boolean;
  encrypted: boolean;
  warning?: string;
};

export class EncryptedArchiveAtRestAdapter {
  constructor(
    private readonly store: IArchiveAtRestRecordStore,
    private readonly encryptionProvider: IEncryptionProvider,
    private readonly passphraseProvider: IArchivePassphraseProvider
  ) {}

  async getStatus(): Promise<ArchiveAtRestStatus> {
    const encryptionStatus = await this.encryptionProvider.getStatus();
    const record = await this.store.read();
    const readyForArchiveEncryption =
      encryptionStatus.available &&
      encryptionStatus.settings.scope === "archive" &&
      encryptionStatus.settings.keySource === "user_passphrase";

    return {
      providerId: "encrypted-archive-at-rest",
      available: encryptionStatus.available,
      active: readyForArchiveEncryption,
      encrypted: record?.format === "memory-palace.archive.encrypted.v1",
      ...(!readyForArchiveEncryption
        ? {
            warning: "Archive-at-rest encryption requires archive scope with a user passphrase key source."
          }
        : {})
    };
  }

  async loadArchive(): Promise<MemoryArchive | undefined> {
    const record = await this.store.read();
    if (!record) return undefined;
    if (record.format === "memory-palace.archive.plaintext.v1") return record.archive;

    const passphrase = await this.requirePassphrase();
    const plaintext = await this.encryptionProvider.decryptText(record.envelope, passphrase);
    return JSON.parse(plaintext) as MemoryArchive;
  }

  async saveArchive(archive: MemoryArchive): Promise<void> {
    await this.requireArchiveEncryptionSettings();
    const passphrase = await this.requirePassphrase();
    const envelope = await this.encryptionProvider.encryptText(JSON.stringify(withFreshExportDate(archive)), passphrase, {
      fileName: "memory-palace-archive.json",
      mediaType: "application/json"
    });

    await this.store.write({
      format: "memory-palace.archive.encrypted.v1",
      envelope,
      updatedAt: envelope.createdAt
    });
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  private async requireArchiveEncryptionSettings(): Promise<void> {
    const status = await this.encryptionProvider.getStatus();
    if (!status.available) {
      throw new Error(status.warning ?? "Archive-at-rest encryption is unavailable.");
    }

    if (status.settings.scope !== "archive" || status.settings.keySource !== "user_passphrase") {
      throw new Error("Archive-at-rest encryption requires archive scope with a user passphrase key source.");
    }
  }

  private async requirePassphrase(): Promise<string> {
    const passphrase = await this.passphraseProvider.getPassphrase();
    if (!passphrase?.trim()) {
      throw new Error("A passphrase is required for archive-at-rest encryption.");
    }
    return passphrase;
  }
}

function withFreshExportDate(archive: MemoryArchive): MemoryArchive {
  return {
    ...archive,
    exportedAt: new Date().toISOString()
  };
}
