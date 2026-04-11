import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageStorageService } from './images-storage.service';

@Injectable()
export class R2ImageStorageService extends ImageStorageService {
  private readonly logger = new Logger(R2ImageStorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();

    const accountId = this.configService.getOrThrow('R2_ACCOUNT_ID');
    this.bucketName = this.configService.getOrThrow('R2_BUCKET_NAME');
    this.publicUrl = this.configService.getOrThrow<string>('R2_PUBLIC_URL');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(key: string, file: Buffer, mimeType: string): Promise<string> {
    this.logger.log(`Uploading image: ${key}`);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: mimeType,
        CacheControl: 'public, max-age=86400, s-maxage=604800',
      }),
    );

    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    this.logger.log(`Deleting image: ${key}`);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  private getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
