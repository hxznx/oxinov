import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';
import { hasRole } from '../tenancy/roles';
import type { CompleteUploadDto, CreateUploadDto, MediaDto, ProgressDto, SaveProgressDto, UploadTicketDto } from './media.dto';
import { looksLike, safeFileName, uploadProblem } from './media-rules';
import { ObjectStorage, UPLOAD_URL_TTL_SEC } from './object-storage';

/** Save calls arrive every few seconds; a single save can add at most this much watched time. */
const MAX_PLAYED_PER_SAVE_SEC = 30;
/** FR-PLAYER-402: a video or audio lesson completes after 90% of its duration has actually been played. */
const COMPLETION_RATIO = 0.9;

type AssetRow = { id: string; kind: string; status: string; fileName: string; sizeBytes: bigint; durationSec: number | null };
const toDto = (asset: AssetRow): MediaDto => ({
  id: asset.id,
  kind: asset.kind,
  status: asset.status,
  fileName: asset.fileName,
  sizeBytes: Number(asset.sizeBytes),
  durationSec: asset.durationSec,
});

/**
 * Lesson media uploads and playback progress (FR-COURSE-202/205, FR-PLAYER-401/402). Teachers upload
 * straight to object storage with a signed URL; the API then checks the stored object before any lesson
 * can use it. Playback URLs are issued by the catalog only after the lesson access check.
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly storage: ObjectStorage,
  ) {}

  async createUpload(scope: TenantScope, user: AuthUser, input: CreateUploadDto): Promise<UploadTicketDto> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    const problem = uploadProblem(input.kind, input.contentType, input.sizeBytes);
    if (problem) throw Errors.mediaInvalid(problem);

    const id = randomUUID();
    const fileName = safeFileName(input.fileName);
    const objectKey = `tenants/${scope.tenantId}/media/${id}/${fileName}`;
    await this.db.run({ tenantId: scope.tenantId, userId: user.userId }, (tx) =>
      tx.mediaAsset.create({
        data: {
          id,
          tenantId: scope.tenantId,
          kind: input.kind,
          objectKey,
          contentType: input.contentType,
          fileName,
          sizeBytes: BigInt(input.sizeBytes),
          createdByUserId: user.userId,
        },
      }),
    );
    return {
      mediaId: id,
      uploadUrl: await this.storage.presignUpload(objectKey, input.contentType, input.sizeBytes),
      headers: { 'Content-Type': input.contentType },
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SEC * 1000),
    };
  }

  /** Confirms an upload: the object must exist with the declared size and really be media of that type. */
  async completeUpload(scope: TenantScope, user: AuthUser, mediaId: string, input: CompleteUploadDto): Promise<MediaDto> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    const asset = await this.db.run(ctx, (tx) => tx.mediaAsset.findFirst({ where: { id: mediaId, tenantId: scope.tenantId } }));
    if (!asset) throw Errors.notFound('Media');
    if (asset.createdByUserId !== user.userId && !hasRole(scope.role, 'ADMIN')) throw Errors.forbidden('Only the uploader can finish this upload.');
    if (asset.status === 'READY') return toDto(asset);
    if (asset.status === 'FAILED') throw Errors.mediaInvalid('This upload failed. Upload the file again.');

    const stored = await this.storage.head(asset.objectKey);
    if (!stored) throw Errors.mediaNotUploaded();
    const reject = async (message: string) => {
      await this.storage.remove(asset.objectKey).catch(() => undefined);
      await this.db.run(ctx, (tx) => tx.mediaAsset.update({ where: { id: asset.id }, data: { status: 'FAILED' } }));
      return Errors.mediaInvalid(message);
    };
    if (stored.sizeBytes !== Number(asset.sizeBytes)) throw await reject('The uploaded file does not match the expected size.');
    if (!looksLike(asset.contentType, await this.storage.prefix(asset.objectKey))) {
      throw await reject('This file is not a valid video or audio file of the selected type.');
    }

    return this.db.run(ctx, async (tx) => {
      const ready = await tx.mediaAsset.update({
        where: { id: asset.id },
        data: { status: 'READY', durationSec: input.durationSec, readyAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          tenantId: scope.tenantId,
          actorUserId: user.userId,
          action: 'media.uploaded',
          targetType: 'media_asset',
          targetId: asset.id,
          metadata: { kind: asset.kind, contentType: asset.contentType, sizeBytes: Number(asset.sizeBytes) },
        },
      });
      return toDto(ready);
    });
  }

  /** Records playback for resume and completion; only the learner's own row is visible (RLS). */
  saveProgress(scope: TenantScope, user: AuthUser, mediaId: string, input: SaveProgressDto): Promise<ProgressDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const asset = await tx.mediaAsset.findFirst({ where: { id: mediaId, tenantId: scope.tenantId, status: 'READY' }, select: { id: true, durationSec: true } });
      if (!asset?.durationSec) throw Errors.notFound('Media');
      const duration = asset.durationSec;
      const position = Math.min(input.positionSec, duration);
      const current = await tx.mediaProgress.findUnique({
        where: { tenantId_userId_mediaAssetId: { tenantId: scope.tenantId, userId: user.userId, mediaAssetId: mediaId } },
      });
      const watched = Math.min(duration, (current?.watchedSec ?? 0) + Math.min(input.playedSec, MAX_PLAYED_PER_SAVE_SEC));
      const completedAt = current?.completedAt ?? (watched >= duration * COMPLETION_RATIO ? new Date() : null);
      const saved = await tx.mediaProgress.upsert({
        where: { tenantId_userId_mediaAssetId: { tenantId: scope.tenantId, userId: user.userId, mediaAssetId: mediaId } },
        create: { tenantId: scope.tenantId, userId: user.userId, mediaAssetId: mediaId, positionSec: position, watchedSec: watched, completedAt },
        update: { positionSec: position, watchedSec: watched, completedAt },
      });
      return { positionSec: saved.positionSec, watchedSec: saved.watchedSec, completed: saved.completedAt !== null };
    });
  }
}
