import { Inject, Injectable, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { LOGGER, type JsonLogger } from '@oxinov/server-kit';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { Errors } from '../common/errors';
import type { AuthUser } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';
import { MAILER, type Mailer } from '../notifications/mailer';
import { deletionRequestedMail } from '../notifications/templates';
import { DELETED_CERTIFICATE_REASON, DELETED_HOLDER, deletionDate, deletionProblem, deletionState } from './deletion-rules';
import type { DataExportDto, DeletionStatusDto } from './account.dto';

/** First sweep a minute after start, so a deploy never delays sign-in or health checks. */
const FIRST_RUN_MS = 60_000;
/** Deletions handled per sweep; the rest wait for the next one. */
const SWEEP_BATCH = 50;
/** Workspaces read for one export; nobody belongs to more today. */
const EXPORT_WORKSPACES = 50;

/**
 * The person's own account in Edu: a copy of their data (FR-PRIV-3201) and account deletion with a 14-day
 * wait (FR-PRIV-3202, the owner's choice). The deletion sweep runs hourly in the API process. It anonymises
 * the profile (no name, email, or sign-in subject, so signing in again creates a new, empty account),
 * removes the person's own learning data, revokes their certificates, and ends their memberships. Payments,
 * enrollments, entitlements, attempts, and submissions stay as records without personal details.
 * Row-level security allows those writes only for a request whose waiting period has ended.
 */
@Injectable()
export class AccountService implements OnApplicationBootstrap, OnModuleDestroy {
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly db: DatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(LOGGER) private readonly logger: JsonLogger,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.config.reminders.deletionSweep) return;
    const run = () => {
      this.sweep().catch((error: unknown) => this.logger.event('error', 'account.deletion_sweep_failed', { error: error instanceof Error ? error.name : 'unknown' }));
    };
    const first = setTimeout(run, FIRST_RUN_MS);
    const every = setInterval(run, this.config.reminders.intervalMinutes * 60_000);
    first.unref();
    every.unref();
    this.timers = [first, every];
  }

  onModuleDestroy(): void {
    for (const timer of this.timers) clearTimeout(timer);
  }

  deletionStatus(user: AuthUser): Promise<DeletionStatusDto> {
    return this.db.run({ userId: user.userId }, async (tx) => {
      const request = await tx.accountDeletionRequest.findUnique({ where: { userId: user.userId } });
      const state = deletionState(request);
      return { state, requestedAt: state === 'SCHEDULED' ? request!.requestedAt : null, deleteAfter: state === 'SCHEDULED' ? request!.deleteAfter : null };
    });
  }

  /** Schedules deletion in 14 days and emails the person how to cancel. */
  async requestDeletion(user: AuthUser, confirm: string): Promise<DeletionStatusDto> {
    const { status, email } = await this.db.run({ userId: user.userId }, async (tx) => {
      const owned = await tx.tenantMembership.findMany({
        where: { userId: user.userId, role: 'OWNER', status: 'ACTIVE' },
        select: { tenant: { select: { name: true } } },
      });
      const problem = deletionProblem({ confirm, ownsWorkspaces: owned.map((row) => row.tenant.name) });
      if (problem) throw Errors.conflict(problem);
      const existing = await tx.accountDeletionRequest.findUnique({ where: { userId: user.userId } });
      if (existing && deletionState(existing) === 'SCHEDULED') {
        return { status: { state: 'SCHEDULED' as const, requestedAt: existing.requestedAt, deleteAfter: existing.deleteAfter }, email: null };
      }
      const now = new Date();
      const fields = { requestedAt: now, deleteAfter: deletionDate(now), cancelledAt: null, completedAt: null };
      const saved = await tx.accountDeletionRequest.upsert({ where: { userId: user.userId }, create: { userId: user.userId, ...fields }, update: fields });
      const profile = await tx.userProfile.findUnique({ where: { id: user.userId }, select: { email: true } });
      return { status: { state: 'SCHEDULED' as const, requestedAt: saved.requestedAt, deleteAfter: saved.deleteAfter }, email: profile?.email ?? null };
    });
    this.logger.event('info', 'account.deletion_requested', { userId: user.userId });
    if (email && this.config.mail.smtpHost) {
      const mail = deletionRequestedMail({
        to: email,
        deleteAfter: status.deleteAfter,
        privacyUrl: `${this.config.payments.webUrl}/account/privacy`,
        support: this.config.mail.supportAddress,
      });
      await this.mailer.send(mail).catch((error: unknown) => this.logger.event('warn', 'mail.failed', { trigger: 'account.deletion_requested', error: error instanceof Error ? error.name : 'unknown' }));
    }
    return status;
  }

  cancelDeletion(user: AuthUser): Promise<DeletionStatusDto> {
    return this.db.run({ userId: user.userId }, async (tx) => {
      const request = await tx.accountDeletionRequest.findUnique({ where: { userId: user.userId } });
      if (!request || deletionState(request) !== 'SCHEDULED') throw Errors.notFound('Deletion request');
      await tx.accountDeletionRequest.update({ where: { id: request.id }, data: { cancelledAt: new Date() } });
      this.logger.event('info', 'account.deletion_cancelled', { userId: user.userId });
      return { state: 'CANCELLED' as const, requestedAt: null, deleteAfter: null };
    });
  }

  /** Deletes every account whose waiting period has ended; returns how many were deleted. */
  async sweep(): Promise<number> {
    const due = await this.db.run({}, (tx) =>
      tx.accountDeletionRequest.findMany({
        where: { deleteAfter: { lte: new Date() }, cancelledAt: null, completedAt: null },
        orderBy: { deleteAfter: 'asc' },
        take: SWEEP_BATCH,
        select: { userId: true },
      }),
    );
    let deleted = 0;
    for (const { userId } of due) {
      try {
        if (await this.deleteAccount(userId)) deleted += 1;
      } catch (error) {
        this.logger.event('error', 'account.deletion_failed', { userId, error: error instanceof Error ? error.name : 'unknown' });
      }
    }
    return deleted;
  }

  private deleteAccount(userId: string): Promise<boolean> {
    return this.db.run({ userId, deletingUserId: userId }, async (tx) => {
      // An owner must hand over first; their deletion waits until they do.
      const owns = await tx.tenantMembership.count({ where: { userId, role: 'OWNER', status: 'ACTIVE' } });
      if (owns > 0) {
        this.logger.event('warn', 'account.deletion_waiting_for_owner_handover', { userId });
        return false;
      }
      const now = new Date();
      const certificates = await tx.certificate.findMany({ where: { userId }, select: { id: true, code: true, revokedAt: true } });
      for (const certificate of certificates) {
        await tx.certificate.update({
          where: { id: certificate.id },
          data: { holderName: DELETED_HOLDER, ...(certificate.revokedAt ? {} : { revokedAt: now, revokeReason: DELETED_CERTIFICATE_REASON }) },
        });
        await tx.certificateVerification.updateMany({ where: { code: certificate.code }, data: { holderName: DELETED_HOLDER, revokedAt: certificate.revokedAt ?? now } });
      }
      await tx.lessonNote.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.courseReview.deleteMany({ where: { userId } });
      await tx.answerVote.deleteMany({ where: { userId } });
      await tx.mediaProgress.deleteMany({ where: { userId } });
      await tx.lessonCompletion.deleteMany({ where: { userId } });
      await tx.supportThread.deleteMany({ where: { userId } });
      await tx.tenantMembership.deleteMany({ where: { userId } });
      await tx.userProfile.update({ where: { id: userId }, data: { email: null, displayName: null, emailVerified: false, authSubject: `deleted|${userId}` } });
      await tx.accountDeletionRequest.update({ where: { userId }, data: { completedAt: now } });
      this.logger.event('info', 'account.deleted', { userId });
      return true;
    });
  }

  /** A copy of everything Edu holds about the caller, across every workspace they belong to (FR-PRIV-3201). */
  async exportData(user: AuthUser): Promise<DataExportDto> {
    const base = await this.db.run({ userId: user.userId }, async (tx) => {
      const profile = await tx.userProfile.findUnique({ where: { id: user.userId }, select: { displayName: true, email: true, createdAt: true } });
      if (!profile) throw Errors.notFound('Profile');
      const memberships = await tx.tenantMembership.findMany({
        where: { userId: user.userId },
        select: { tenantId: true, role: true, status: true, createdAt: true },
        take: EXPORT_WORKSPACES,
      });
      const request = await tx.accountDeletionRequest.findUnique({ where: { userId: user.userId } });
      return { profile, memberships, request };
    });
    const workspaces: DataExportDto['workspaces'] = [];
    for (const membership of base.memberships) {
      workspaces.push(
        await this.db.run({ tenantId: membership.tenantId, userId: user.userId }, async (tx) => {
          const own = { tenantId: membership.tenantId, userId: user.userId };
          const [tenant, access, payments, certificates, notes, reviews, notifications, attempts] = await Promise.all([
            tx.tenant.findUnique({ where: { id: membership.tenantId }, select: { name: true, slug: true } }),
            tx.entitlement.findMany({ where: own, select: { courseId: true, source: true, startsAt: true, endsAt: true, revokedAt: true, course: { select: { slug: true } } } }),
            tx.payment.findMany({
              where: own,
              select: { courseId: true, providerPaymentId: true, amountMinor: true, currency: true, status: true, planPeriod: true, bankTransactionId: true, submittedAt: true, reviewedAt: true, createdAt: true },
            }),
            tx.certificate.findMany({ where: own, select: { code: true, courseTitle: true, issuedAt: true, revokedAt: true } }),
            tx.lessonNote.findMany({ where: own, select: { courseId: true, lessonTitle: true, timestampSec: true, body: true, createdAt: true, updatedAt: true } }),
            tx.courseReview.findMany({ where: own, select: { courseId: true, rating: true, body: true, status: true, createdAt: true, updatedAt: true } }),
            tx.notification.findMany({ where: own, select: { kind: true, title: true, body: true, createdAt: true, readAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
            tx.examAttempt.findMany({ where: own, select: { attemptNumber: true, status: true, startedAt: true, submittedAt: true, blueprint: { select: { title: true } } } }),
          ]);
          return {
            workspace: { name: tenant?.name ?? '', slug: tenant?.slug ?? '', role: membership.role, status: membership.status, joinedAt: membership.createdAt },
            access: access.map(({ course, ...row }) => ({ ...row, offering: course.slug })),
            payments,
            certificates,
            notes,
            reviews,
            notifications,
            examAttempts: attempts.map(({ blueprint, ...row }) => ({ ...row, exam: blueprint.title })),
          };
        }),
      );
    }
    return {
      exportedAt: new Date(),
      profile: { displayName: base.profile.displayName, email: base.profile.email, memberSince: base.profile.createdAt },
      deletion: { state: deletionState(base.request), deleteAfter: deletionState(base.request) === 'SCHEDULED' ? base.request!.deleteAfter : null },
      workspaces,
    };
  }
}
