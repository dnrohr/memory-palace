import type { Memory, MemoryTag, Tag, UserProfile } from "./types";

export interface IMemoryRepository {
  create(memory: Memory): Promise<Memory>;
  update(memory: Memory): Promise<Memory>;
  getById(id: string): Promise<Memory | undefined>;
  list(options?: { includeDeleted?: boolean }): Promise<Memory[]>;
  softDelete(id: string, deletedAt: string): Promise<void>;
}

export interface ITagRepository {
  upsert(tag: Tag): Promise<Tag>;
  getById(id: string): Promise<Tag | undefined>;
  list(): Promise<Tag[]>;
}

export interface IMemoryTagRepository {
  assign(link: MemoryTag): Promise<MemoryTag>;
  list(): Promise<MemoryTag[]>;
  listForMemory(memoryId: string): Promise<MemoryTag[]>;
}

export interface IUserProfileRepository {
  get(): Promise<UserProfile | undefined>;
  save(profile: UserProfile): Promise<UserProfile>;
}
