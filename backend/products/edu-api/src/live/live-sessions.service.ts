import { Injectable } from '@nestjs/common';
import { liveProvider } from '../authoring/external-content';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { hasActiveEntitlement } from '../learning/access';
import { canAuthor } from '../tenancy/roles';
import type { CreateLiveSessionDto, LiveSessionDto, UpdateLiveSessionDto } from './live-sessions.dto';

/** Classes that ended more than a day ago drop off the list. */
const RECENT_MS = 24 * 60 * 60 * 1000;

type Row = { id: string; title: string; startsAt: Date; durationMin: number; joinUrl: string; visibility: 'FREE' | 'SUBSCRIBERS'; cancelledAt: Date | null };

/**
 * Live classes of an offering (ADR-028 point 8): links to Google Meet, Zoom, or Teams with a time. Oxinov
 * does not host the call. The join link is shown only to people allowed in: authors, anyone in the
 * workspace for a free class, and learners with active access for a subscribers-only class.
 */
@Injectable()
export class LiveSessionsService {
  constructor(private readonly db: DatabaseContext) {}

  list(scope: TenantScope, user: AuthUser, courseId: string): Promise<LiveSessionDto[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const author = canAuthor(scope.role);
      await this.findCourse(tx, scope.tenantId, courseId, author);
      const rows = await tx.liveSession.findMany({
        where: { tenantId: scope.tenantId, courseId },
        orderBy: { startsAt: 'asc' },
        take: 100,
      });
      const now = Date.now();
      const current = rows.filter((row) => row.startsAt.getTime() + row.durationMin * 60_000 + RECENT_MS > now);
      const entitled = author || (await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId));
      return current.map((row) => toDto(row, author || row.visibility === 'FREE' || entitled));
    });
  }

  create(scope: TenantScope, user: AuthUser, courseId: string, input: CreateLiveSessionDto): Promise<LiveSessionDto> {
    if (!canAuthor(scope.role)) throw Errors.forbidden('Only teachers and administrators can schedule live classes.');
    const joinUrl = checkedLink(input.joinUrl);
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      await this.findCourse(tx, scope.tenantId, courseId, true);
      const row = await tx.liveSession.create({
        data: {
          tenantId: scope.tenantId,
          courseId,
          title: input.title.trim(),
          startsAt: new Date(input.startsAt),
          durationMin: input.durationMin,
          joinUrl,
          visibility: input.visibility ?? 'SUBSCRIBERS',
          createdByUserId: user.userId,
        },
      });
      await this.audit(tx, scope, user, 'live_session.created', row.id, courseId);
      return toDto(row, true);
    });
  }

  update(scope: TenantScope, user: AuthUser, sessionId: string, input: UpdateLiveSessionDto): Promise<LiveSessionDto> {
    if (!canAuthor(scope.role)) throw Errors.forbidden('Only teachers and administrators can change live classes.');
    const joinUrl = input.joinUrl !== undefined ? checkedLink(input.joinUrl) : undefined;
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const existing = await tx.liveSession.findFirst({ where: { id: sessionId, tenantId: scope.tenantId }, select: { id: true, courseId: true, cancelledAt: true } });
      if (!existing) throw Errors.notFound('Live class');
      const row = await tx.liveSession.update({
        where: { id: sessionId },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
          ...(input.durationMin !== undefined ? { durationMin: input.durationMin } : {}),
          ...(joinUrl !== undefined ? { joinUrl } : {}),
          ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
          ...(input.cancelled !== undefined ? { cancelledAt: input.cancelled ? (existing.cancelledAt ?? new Date()) : null } : {}),
        },
      });
      await this.audit(tx, scope, user, input.cancelled ? 'live_session.cancelled' : 'live_session.updated', row.id, existing.courseId);
      return toDto(row, true);
    });
  }

  /** Learners see published courses only; authors also see drafts. */
  private async findCourse(tx: Tx, tenantId: string, courseId: string, author: boolean): Promise<void> {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId, ...(author ? {} : { status: 'PUBLISHED', publishedVersionId: { not: null } }) },
      select: { id: true },
    });
    if (!course) throw Errors.notFound('Course');
  }

  private async audit(tx: Tx, scope: TenantScope, user: AuthUser, action: string, sessionId: string, courseId: string): Promise<void> {
    await tx.auditEvent.create({
      data: { tenantId: scope.tenantId, actorUserId: user.userId, action, targetType: 'live_session', targetId: sessionId, metadata: { courseId } },
    });
  }
}

function checkedLink(input: string): string {
  const link = input.trim();
  if (!liveProvider(link)) throw Errors.contentLinkInvalid('Paste the https meeting link from Google Meet, Zoom, or Microsoft Teams.');
  return link;
}

function toDto(row: Row, mayJoin: boolean): LiveSessionDto {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.startsAt,
    durationMin: row.durationMin,
    visibility: row.visibility,
    provider: liveProvider(row.joinUrl) ?? 'OTHER',
    cancelled: row.cancelledAt !== null,
    joinUrl: mayJoin && row.cancelledAt === null ? row.joinUrl : null,
    locked: !mayJoin,
  };
}
