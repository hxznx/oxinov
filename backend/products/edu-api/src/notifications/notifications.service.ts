import { Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { hasRole } from '../tenancy/roles';
import type { NotificationKind, NotificationListDto, NoticeSentDto, SendNoticeDto } from './notifications.dto';

export interface NewNotification {
  tenantId: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  linkPath?: string | null;
  /** Makes this notification happen at most once for the person. */
  dedupeKey?: string;
}

const CHUNK = 1000;

/**
 * In-app notifications (FR-COMM-704): each learner reads and clears only their own. Payments and renewal
 * reminders write them inside their own transactions through `create`, so a notice exists exactly when the
 * event committed. Administrators can send a notice to every member of the workspace (in-app only).
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseContext) {}

  /** Writes one notification in the caller's transaction; returns false when its dedupe key already exists. */
  static async create(tx: Tx, input: NewNotification): Promise<boolean> {
    const created = await tx.notification.createMany({
      data: [
        {
          tenantId: input.tenantId,
          userId: input.userId,
          kind: input.kind,
          title: input.title.slice(0, 200),
          body: (input.body ?? '').slice(0, 2000),
          linkPath: input.linkPath ?? null,
          dedupeKey: input.dedupeKey ?? null,
        },
      ],
      skipDuplicates: true,
    });
    return created.count === 1;
  }

  list(scope: TenantScope, user: AuthUser): Promise<NotificationListDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const where = { tenantId: scope.tenantId, userId: user.userId };
      const [items, unread] = await Promise.all([
        tx.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, kind: true, title: true, body: true, linkPath: true, createdAt: true, readAt: true },
        }),
        tx.notification.count({ where: { ...where, readAt: null } }),
      ]);
      return { items, unread };
    });
  }

  async markRead(scope: TenantScope, user: AuthUser, notificationId: string): Promise<void> {
    await this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      // Scoped to the caller: another person's notification is simply not found.
      const exists = await tx.notification.findFirst({ where: { id: notificationId, tenantId: scope.tenantId, userId: user.userId }, select: { id: true } });
      if (!exists) throw Errors.notFound('Notification');
      await tx.notification.updateMany({ where: { id: notificationId, tenantId: scope.tenantId, userId: user.userId, readAt: null }, data: { readAt: new Date() } });
    });
  }

  async markAllRead(scope: TenantScope, user: AuthUser): Promise<void> {
    await this.db.run({ tenantId: scope.tenantId, userId: user.userId }, (tx) =>
      tx.notification.updateMany({ where: { tenantId: scope.tenantId, userId: user.userId, readAt: null }, data: { readAt: new Date() } }),
    );
  }

  /**
   * A notice to every active member except the sender, or only to the learners enrolled in one offering
   * (design screen 8). Administrators only.
   */
  sendNotice(scope: TenantScope, user: AuthUser, input: SendNoticeDto): Promise<NoticeSentDto> {
    if (!hasRole(scope.role, 'ADMIN')) throw Errors.forbidden('Only administrators can send notices.');
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      if (input.courseId) {
        const course = await tx.course.findFirst({ where: { id: input.courseId, tenantId: scope.tenantId }, select: { id: true } });
        if (!course) throw Errors.notFound('Course');
      }
      const members = await tx.tenantMembership.findMany({
        where: {
          tenantId: scope.tenantId,
          status: 'ACTIVE',
          userId: { not: user.userId },
          ...(input.courseId ? { user: { enrollments: { some: { tenantId: scope.tenantId, courseId: input.courseId, status: 'ACTIVE' } } } } : {}),
        },
        select: { userId: true },
      });
      const title = input.title.trim();
      const body = input.body.trim();
      for (let i = 0; i < members.length; i += CHUNK) {
        await tx.notification.createMany({
          data: members.slice(i, i + CHUNK).map((member) => ({
            tenantId: scope.tenantId,
            userId: member.userId,
            kind: 'NOTICE' as const,
            title,
            body,
            linkPath: input.linkPath ?? null,
          })),
        });
      }
      await tx.auditEvent.create({
        data: { tenantId: scope.tenantId, actorUserId: user.userId, action: 'notice.sent', targetType: 'tenant', targetId: scope.tenantId, metadata: { recipients: members.length, title, courseId: input.courseId ?? null } },
      });
      return { recipients: members.length };
    });
  }
}
