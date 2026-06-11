export type SyncStatus = {
  providerId: string;
  enabled: boolean;
  lastSyncedAt?: string;
  pendingChangeCount: number;
};

export type SyncResult = {
  status: SyncStatus;
  pushedCount: number;
  pulledCount: number;
  conflicts: SyncConflict[];
};

export type SyncConflict = {
  id: string;
  entityType: "memory" | "tag" | "life_context" | "settings";
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  summary: string;
};

export interface ISyncProvider {
  id: string;
  displayName: string;
  isCloudProvider: boolean;
  getStatus(): Promise<SyncStatus>;
  sync(): Promise<SyncResult>;
  resolveConflict(conflict: SyncConflict): Promise<void>;
}

export class NoSyncProvider implements ISyncProvider {
  id = "none";
  displayName = "Sync disabled";
  isCloudProvider = false;

  async getStatus(): Promise<SyncStatus> {
    return {
      providerId: this.id,
      enabled: false,
      pendingChangeCount: 0
    };
  }

  async sync(): Promise<SyncResult> {
    return {
      status: await this.getStatus(),
      pushedCount: 0,
      pulledCount: 0,
      conflicts: []
    };
  }

  async resolveConflict(_conflict: SyncConflict): Promise<void> {
    return undefined;
  }
}

