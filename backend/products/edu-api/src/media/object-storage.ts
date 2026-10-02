import { createHash } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

/** Signed upload links expire quickly; the browser starts uploading right away. */
export const UPLOAD_URL_TTL_SEC = 15 * 60;
/** Playback links are issued only after an access check and expire soon after (FR-PLAYER-401). */
export const PLAYBACK_URL_TTL_SEC = 10 * 60;

/**
 * Thin wrapper over S3 for lesson media. Browsers upload and stream directly with signed URLs, so media
 * bytes never pass through the API; credentials come from the standard AWS provider chain.
 */
@Injectable()
export class ObjectStorage {
  private readonly client?: S3Client;
  private readonly bucket?: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.bucket = config.media.bucket;
    if (this.bucket) {
      this.client = new S3Client({
        region: config.media.region,
        ...(config.media.endpoint ? { endpoint: config.media.endpoint } : {}),
        forcePathStyle: config.media.forcePathStyle,
        // Browsers upload the bytes to signed URLs, so a checksum cannot be computed when signing; add
        // checksums only where S3 requires them (otherwise the SDK signs the empty body's CRC32).
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    }
  }

  get enabled(): boolean {
    return this.client !== undefined;
  }

  /** Signed PUT for exactly this size and type; S3 rejects a different Content-Length or Content-Type. */
  presignUpload(key: string, contentType: string, sizeBytes: number): Promise<string> {
    return getSignedUrl(this.s3(), new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType, ContentLength: sizeBytes }), {
      expiresIn: UPLOAD_URL_TTL_SEC,
    });
  }

  presignPlayback(key: string): Promise<string> {
    return getSignedUrl(this.s3(), new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: PLAYBACK_URL_TTL_SEC });
  }

  /** Signed download that always saves the file (never renders it inline), under its original name. */
  presignDownload(key: string, fileName: string): Promise<string> {
    const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    return getSignedUrl(
      this.s3(),
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      }),
      { expiresIn: PLAYBACK_URL_TTL_SEC },
    );
  }

  /** Signed link that opens a PDF in the browser's viewer; only for PDFs, served from the storage domain. */
  presignInlinePdf(key: string): Promise<string> {
    return getSignedUrl(
      this.s3(),
      new GetObjectCommand({ Bucket: this.bucket, Key: key, ResponseContentDisposition: 'inline', ResponseContentType: 'application/pdf' }),
      { expiresIn: PLAYBACK_URL_TTL_SEC },
    );
  }

  async head(key: string): Promise<{ sizeBytes: number } | null> {
    try {
      const result = await this.s3().send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { sizeBytes: Number(result.ContentLength ?? 0) };
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return null;
      throw error;
    }
  }

  /** First bytes of an object, used to check the file really is the declared media type. */
  async prefix(key: string, bytes = 64): Promise<Buffer> {
    const result = await this.s3().send(new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${bytes - 1}` }));
    return Buffer.from(await result.Body!.transformToByteArray());
  }

  /** SHA-256 of a stored object (small files only, such as a payment receipt up to 5 MB). */
  async sha256(key: string): Promise<string> {
    const result = await this.s3().send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return createHash('sha256').update(await result.Body!.transformToByteArray()).digest('hex');
  }

  async remove(key: string): Promise<void> {
    await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private s3(): S3Client {
    if (!this.client) throw new Error('Media storage is not configured (MEDIA_BUCKET)');
    return this.client;
  }
}
