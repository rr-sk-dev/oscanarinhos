export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  abstract create(data: CreateInput): Promise<T>;
  abstract findAll(filters?: unknown): Promise<T[]>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract count(filters?: unknown): Promise<number>;
}
