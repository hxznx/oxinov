import { Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { NotificationsService } from '../notifications/notifications.service';
import { reviewerName, summarizeRatings, type RatingSummary } from './review-rules';
import type { ModerationReviewDto, MyReviewDto, PublicReviewDto, ReviewState, SaveReviewDto } from './reviews.dto';

/** Approved reviews shown on an offering page, newest first. */
const PUBLIC_REVIEWS = 10;
const MODERATION_PAGE = 100;

/**
 * Ratings and reviews (FR-CATALOG-304). A learner who has had access to an offering writes one review and
 * can change or withdraw it. The owner chose "approve first": a new or changed review is PENDING until an
 * administrator approves it, and only APPROVED reviews are shown or counted. Hiding needs a reason that only
 * administrators see. Approving and hiding are audited.
 */
@Injectable()
export class ReviewsService {
  constructor(private readonly db: DatabaseContext) {}

  mine(scope: TenantScope, user: AuthUser, courseId: string): Promise<MyReviewDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      await this.publishedCourse(tx, scope.tenantId, courseId);
      const [canReview, review] = await Promise.all([
        this.hadAccess(tx, scope.tenantId, user.userId, courseId),
        tx.courseReview.findUnique({ where: { tenantId_courseId_userId: { tenantId: scope.tenantId, courseId, userId: user.userId } } }),
      ]);
      return { canReview, rating: review?.rating ?? null, body: review?.body ?? '', status: review?.status ?? null, updatedAt: review?.updatedAt ?? null };
    });
  }

  /** Writes or replaces the caller's review; it waits for approval again. */
  save(scope: TenantScope, user: AuthUser, courseId: string, input: SaveReviewDto): Promise<MyReviewDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      await this.publishedCourse(tx, scope.tenantId, courseId);
      if (!(await this.hadAccess(tx, scope.tenantId, user.userId, courseId))) throw Errors.forbidden('Only learners who joined this offering can review it.');
      const fields = { rating: input.rating, body: input.body ?? '', status: 'PENDING' as const, moderatedByUserId: null, moderatedAt: null, moderationReason: null };
      const review = await tx.courseReview.upsert({
        where: { tenantId_courseId_userId: { tenantId: scope.tenantId, courseId, userId: user.userId } },
        create: { tenantId: scope.tenantId, courseId, userId: user.userId, ...fields },
        update: fields,
      });
      return { canReview: true, rating: review.rating, body: review.body, status: review.status, updatedAt: review.updatedAt };
    });
  }

  /** Withdraws the caller's own review. */
  withdraw(scope: TenantScope, user: AuthUser, courseId: string): Promise<void> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const removed = await tx.courseReview.deleteMany({ where: { tenantId: scope.tenantId, courseId, userId: user.userId } });
      if (removed.count === 0) throw Errors.notFound('Review');
    });
  }

  /** Administrators: reviews in one state; pending ones oldest first, the others newest first. */
  list(scope: TenantScope, user: AuthUser, status: ReviewState): Promise<ModerationReviewDto[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const rows = await tx.courseReview.findMany({
        where: { tenantId: scope.tenantId, status },
        orderBy: { updatedAt: status === 'PENDING' ? 'asc' : 'desc' },
        take: MODERATION_PAGE,
        include: {
          user: { select: { displayName: true, email: true } },
          course: { select: { slug: true, publishedVersion: { select: { title: true } } } },
        },
      });
      return rows.map((row) => ({
        id: row.id,
        courseId: row.courseId,
        courseTitle: row.course.publishedVersion?.title ?? row.course.slug,
        learnerName: row.user.displayName,
        learnerEmail: row.user.email,
        rating: row.rating,
        body: row.body,
        status: row.status,
        moderationReason: row.moderationReason,
        updatedAt: row.updatedAt,
      }));
    });
  }

  approve(scope: TenantScope, user: AuthUser, reviewId: string): Promise<void> {
    return this.moderate(scope, user, reviewId, 'APPROVED', null);
  }

  hide(scope: TenantScope, user: AuthUser, reviewId: string, reason: string): Promise<void> {
    return this.moderate(scope, user, reviewId, 'HIDDEN', reason);
  }

  /** Public: the rating summary and newest approved reviews of one offering. */
  static async publicReviews(tx: Tx, tenantId: string, courseId: string): Promise<{ rating: RatingSummary; reviews: PublicReviewDto[] }> {
    const [ratings, newest] = await Promise.all([
      tx.courseReview.findMany({ where: { tenantId, courseId, status: 'APPROVED' }, select: { rating: true } }),
      tx.courseReview.findMany({
        where: { tenantId, courseId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: PUBLIC_REVIEWS,
        select: { rating: true, body: true, createdAt: true, user: { select: { displayName: true } } },
      }),
    ]);
    return {
      rating: summarizeRatings(ratings.map((row) => row.rating)),
      reviews: newest.map((row) => ({ author: reviewerName(row.user.displayName), rating: row.rating, body: row.body, createdAt: row.createdAt })),
    };
  }

  /** Public: average and count of approved reviews for many offerings, for store cards. */
  static async ratingsFor(tx: Tx, tenantId: string, courseIds: string[]): Promise<Map<string, { average: number | null; count: number }>> {
    if (courseIds.length === 0) return new Map();
    const groups = await tx.courseReview.groupBy({
      by: ['courseId'],
      where: { tenantId, courseId: { in: courseIds }, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return new Map(groups.map((group) => [group.courseId, { average: group._avg.rating === null ? null : Math.round(group._avg.rating * 10) / 10, count: group._count._all }]));
  }

  private moderate(scope: TenantScope, user: AuthUser, reviewId: string, status: 'APPROVED' | 'HIDDEN', reason: string | null): Promise<void> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const review = await tx.courseReview.findFirst({
        where: { id: reviewId, tenantId: scope.tenantId },
        select: { id: true, userId: true, courseId: true, rating: true, status: true, course: { select: { slug: true } } },
      });
      if (!review) throw Errors.notFound('Review');
      if (review.status === status) return;
      await tx.courseReview.update({
        where: { id: review.id },
        data: { status, moderatedByUserId: user.userId, moderatedAt: new Date(), moderationReason: reason },
      });
      await tx.auditEvent.create({
        data: {
          tenantId: scope.tenantId,
          actorUserId: user.userId,
          action: status === 'APPROVED' ? 'review.approved' : 'review.hidden',
          targetType: 'course_review',
          targetId: review.id,
          metadata: { courseId: review.courseId, rating: review.rating, ...(reason ? { reason } : {}) },
        },
      });
      if (status === 'APPROVED') {
        await NotificationsService.create(tx, {
          tenantId: scope.tenantId,
          userId: review.userId,
          kind: 'NOTICE',
          title: 'Your review is live',
          body: 'Thank you. Your review now shows on the offering page.',
          linkPath: `/o/${review.course.slug}`,
          dedupeKey: `review-approved:${review.id}:${Date.now()}`,
        });
      }
    });
  }

  private async publishedCourse(tx: Tx, tenantId: string, courseId: string): Promise<void> {
    const course = await tx.course.findFirst({ where: { id: courseId, tenantId, publishedVersionId: { not: null } }, select: { id: true } });
    if (!course) throw Errors.notFound('Course');
  }

  /** Anyone who has had access, even if it has since ended, may review; revoked access does not count. */
  private async hadAccess(tx: Tx, tenantId: string, userId: string, courseId: string): Promise<boolean> {
    const count = await tx.entitlement.count({ where: { tenantId, userId, courseId, revokedAt: null, startsAt: { lte: new Date() } } });
    return count > 0;
  }
}
