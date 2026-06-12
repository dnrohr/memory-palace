export type EncryptionScope = "disabled" | "exports" | "archive";

export type EncryptionKeySource = "none" | "device_secure_store" | "user_passphrase";

export type EncryptionSettings = {
  scope: EncryptionScope;
  keySource: EncryptionKeySource;
  requireUnlockForExport: boolean;
};

export type EncryptionStatus = {
  providerId: string;
  available: boolean;
  active: boolean;
  settings: EncryptionSettings;
  warning?: string;
};

export type EncryptionInputMetadata = {
  fileName: string;
  mediaType: string;
};

export type EncryptedTextEnvelope = {
  format: "memory-palace.encrypted.v1";
  algorithm: "AES-GCM";
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: number[];
  iv: number[];
  ciphertext: number[];
  fileName: string;
  mediaType: string;
  createdAt: string;
};

export interface IEncryptionProvider {
  getSettings(): Promise<EncryptionSettings>;
  saveSettings(settings: EncryptionSettings): Promise<void>;
  getStatus(): Promise<EncryptionStatus>;
  encryptText(text: string, passphrase: string, metadata: EncryptionInputMetadata): Promise<EncryptedTextEnvelope>;
  decryptText(envelope: EncryptedTextEnvelope, passphrase: string): Promise<string>;
}

export const DISABLED_ENCRYPTION_SETTINGS: EncryptionSettings = {
  scope: "disabled",
  keySource: "none",
  requireUnlockForExport: false
};

export class NoEncryptionProvider implements IEncryptionProvider {
  private settings = DISABLED_ENCRYPTION_SETTINGS;

  async getSettings(): Promise<EncryptionSettings> {
    return this.settings;
  }

  async saveSettings(settings: EncryptionSettings): Promise<void> {
    this.settings = {
      ...settings,
      keySource: settings.scope === "disabled" ? "none" : settings.keySource
    };
  }

  async getStatus(): Promise<EncryptionStatus> {
    return {
      providerId: "none",
      available: false,
      active: false,
      settings: this.settings,
      warning: "No encryption provider is installed. Data remains protected only by device storage controls."
    };
  }

  async encryptText(_text: string, _passphrase: string, _metadata: EncryptionInputMetadata): Promise<EncryptedTextEnvelope> {
    throw new Error("No encryption provider is installed.");
  }

  async decryptText(_envelope: EncryptedTextEnvelope, _passphrase: string): Promise<string> {
    throw new Error("No encryption provider is installed.");
  }
}

export class WebCryptoExportEncryptionProvider implements IEncryptionProvider {
  private settings: EncryptionSettings = DISABLED_ENCRYPTION_SETTINGS;
  private readonly iterations: number;

  constructor(options: { iterations?: number } = {}) {
    this.iterations = options.iterations ?? 310_000;
  }

  async getSettings(): Promise<EncryptionSettings> {
    return this.settings;
  }

  async saveSettings(settings: EncryptionSettings): Promise<void> {
    this.settings = {
      ...settings,
      keySource: settings.scope === "disabled" ? "none" : settings.keySource
    };
  }

  async getStatus(): Promise<EncryptionStatus> {
    const available = Boolean(getWebCrypto()?.subtle);
    const active = available && this.settings.scope !== "disabled" && this.settings.keySource === "user_passphrase";
    return {
      providerId: "web-crypto-export",
      available,
      active,
      settings: this.settings,
      ...(!available ? { warning: "Web Crypto is unavailable in this runtime." } : {})
    };
  }

  async encryptText(text: string, passphrase: string, metadata: EncryptionInputMetadata): Promise<EncryptedTextEnvelope> {
    const crypto = requireWebCrypto();
    const salt = randomBytes(16, crypto);
    const iv = randomBytes(12, crypto);
    const key = await deriveAesKey(passphrase, salt, this.iterations, crypto);
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, new TextEncoder().encode(text))
    );

    return {
      format: "memory-palace.encrypted.v1",
      algorithm: "AES-GCM",
      kdf: "PBKDF2-SHA-256",
      iterations: this.iterations,
      salt: [...salt],
      iv: [...iv],
      ciphertext: [...ciphertext],
      fileName: metadata.fileName,
      mediaType: metadata.mediaType,
      createdAt: new Date().toISOString()
    };
  }

  async decryptText(envelope: EncryptedTextEnvelope, passphrase: string): Promise<string> {
    const crypto = requireWebCrypto();
    const key = await deriveAesKey(passphrase, new Uint8Array(envelope.salt), envelope.iterations, crypto);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(new Uint8Array(envelope.iv)) },
      key,
      new Uint8Array(envelope.ciphertext)
    );
    return new TextDecoder().decode(plaintext);
  }
}

async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  crypto: Crypto
): Promise<CryptoKey> {
  if (!passphrase.trim()) {
    throw new Error("A passphrase is required for encrypted exports.");
  }

  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function randomBytes(length: number, crypto: Crypto): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function requireWebCrypto(): Crypto {
  const crypto = getWebCrypto();
  if (!crypto?.subtle) {
    throw new Error("Web Crypto is unavailable in this runtime.");
  }
  return crypto;
}

function getWebCrypto(): Crypto | undefined {
  return globalThis.crypto;
}
