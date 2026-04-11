import { ImageStorageService } from './images-storage.service';

export class ImagesService {
  constructor(
    private readonly storageService: ImageStorageService,
    private readonly featureName: string,
  ) {}

  async upload(
    filename: string,
    file: Buffer,
    mimeType: string,
  ): Promise<string> {
    const key = this.buildKey(filename);
    return this.storageService.upload(key, file, mimeType);
  }

  async delete(filename: string): Promise<void> {
    const key = this.buildKey(filename);
    return this.storageService.delete(key);
  }

  private buildKey(filename: string): string {
    return `${this.featureName}/${filename}`;
  }
}
