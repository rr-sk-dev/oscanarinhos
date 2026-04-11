export abstract class ImageStorageService {
  abstract upload(key: string, file: Buffer, mimeType: string): Promise<string>;
  abstract delete(key: string): Promise<void>;
}
