import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import type { FileStoragePort } from '../../application/ports/out/car-rental-out.ports';

@Injectable()
export class S3FileStorageAdapter implements FileStoragePort {
  private s3: S3Client;
  private bucket: string;
  private region: string;

  constructor(private readonly cs: ConfigService) {
    this.region = this.cs.get<string>('AWS_S3_REGION')!;
    this.bucket = this.cs.get<string>('AWS_S3_BUCKET')!;
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.cs.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.cs.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
      endpoint: this.cs.get<string>('S3_ENDPOINT') ?? undefined,
      forcePathStyle: this.cs.get<string>('S3_FORCE_PATH_STYLE') === 'true',
    });
  }

  async upload({
    key,
    buffer,
    contentType,
  }: {
    key: string;
    buffer: Buffer;
    contentType: string;
  }) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getPresignedPutUrl(key: string, expiresInSec = 900) {
    const cmd = new PutObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSec });
  }
}
