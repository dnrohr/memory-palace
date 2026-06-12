import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ArchiveAtRestRecord, IArchiveAtRestRecordStore } from "../../../src/security/archiveAtRest";

const ARCHIVE_AT_REST_KEY = "memory-palace.archive-at-rest.v1";

export class AsyncStorageArchiveAtRestRecordStore implements IArchiveAtRestRecordStore {
  async read(): Promise<ArchiveAtRestRecord | undefined> {
    const raw = await AsyncStorage.getItem(ARCHIVE_AT_REST_KEY);
    return raw ? (JSON.parse(raw) as ArchiveAtRestRecord) : undefined;
  }

  async write(record: ArchiveAtRestRecord): Promise<void> {
    await AsyncStorage.setItem(ARCHIVE_AT_REST_KEY, JSON.stringify(record));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(ARCHIVE_AT_REST_KEY);
  }
}
