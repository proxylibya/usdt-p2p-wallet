import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: string;
  private localStoragePath: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get('STORAGE_PROVIDER', 'local');
    this.localStoragePath = this.configService.get('LOCAL_STORAGE_PATH', './uploads');
  }

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { folder = 'general', maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } = options;

    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);
    }

    switch (this.provider) {
      case 's3':
        return this.uploadToS3(file, folder);
      case 'cloudinary':
        return this.uploadToCloudinary(file, folder);
      case 'local':
      default:
        return this.uploadToLocal(file, folder);
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    switch (this.provider) {
      case 's3':
        return this.deleteFromS3(key);
      case 'cloudinary':
        return this.deleteFromCloudinary(key);
      case 'local':
      default:
        return this.deleteFromLocal(key);
    }
  }

  private generateKey(originalname: string, folder: string): string {
    const ext = path.extname(originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${folder}/${timestamp}-${hash}${ext}`;
  }

  private async uploadToLocal(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }, folder: string): Promise<UploadResult> {
    try {
      const key = this.generateKey(file.originalname, folder);
      const fullPath = path.join(this.localStoragePath, key);
      const dir = path.dirname(fullPath);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, file.buffer);

      const baseUrl = this.configService.get('APP_URL', 'http://localhost:3002');

      return {
        url: `${baseUrl}/uploads/${key}`,
        key,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file locally: ${error.message}`);
      throw new BadRequestException('File upload failed');
    }
  }

  private async uploadToS3(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }, folder: string): Promise<UploadResult> {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.configService.get('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        },
      });

      const bucket = this.configService.get('AWS_S3_BUCKET');
      const key = this.generateKey(file.originalname, folder);

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      const cdnUrl = this.configService.get('AWS_CLOUDFRONT_URL');
      const url = cdnUrl ? `${cdnUrl}/${key}` : `https://${bucket}.s3.amazonaws.com/${key}`;

      return { url, key, size: file.size, mimeType: file.mimetype };
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${error.message}`);
      throw new BadRequestException('File upload failed');
    }
  }

  private async uploadToCloudinary(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }, folder: string): Promise<UploadResult> {
    try {
      const cloudinary = await import('cloudinary');

      cloudinary.v2.config({
        cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      });

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder, resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      return {
        url: result.secure_url,
        key: result.public_id,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Failed to upload to Cloudinary: ${error.message}`);
      throw new BadRequestException('File upload failed');
    }
  }

  private async deleteFromLocal(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.localStoragePath, key);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private async deleteFromS3(key: string): Promise<boolean> {
    try {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.configService.get('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        },
      });

      const bucket = this.configService.get('AWS_S3_BUCKET');
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  private async deleteFromCloudinary(key: string): Promise<boolean> {
    try {
      const cloudinary = await import('cloudinary');

      cloudinary.v2.config({
        cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      });

      await cloudinary.v2.uploader.destroy(key);
      return true;
    } catch {
      return false;
    }
  }
}
