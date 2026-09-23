import { Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';

export interface EnrollmentView {
  id: string;
  courseId: string;
  courseTitle: string;
  status: string;
  enrolledAt: Date;
  hasAccess: boolean;
}

@Injectable()
export class EnrollmentsService {
  constructor(private readonly db: DatabaseContext) {}

  /**
   * Free published courses enroll immediately with a FREE entitlement (FR-CATALOG-303).
   * Paid courses require a verified payment event, which the checkout flow will add; until then
   * they return PAYMENT_REQUIRED. Enrolling twice returns the existing enrollment.
   */
  async enroll(
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
  ): Promise<{ enrollment: EnrollmentView; created: boolean }> {
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    try {
      return await this.db.run(ctx, async (tx) => {
        const course = await tx.course.findFirst({
          where: { id: courseId, tenantId: scope.tenantId },
          include: { publishedVersion: { select: { title: true } } },
        });
        if (!course) throw Errors.notFound('Course');
        const existing = await this.findActive(tx, scope.tenantId, user.userId, courseId);
        if (existing) return { enrollment: existing, created: false };

        if (course.status !== 'PUBLISHED' || !course.publishedVersion) {
          // Drafts are invisible to learners; archived courses accept no new enrollments.
          if (course.status === 'DRAFT') throw Errors.notFound('Course');
          throw Errors.courseNotAvailable();
        }
        if (course.priceMinor > 0) throw Errors.paymentRequired();

        const enrollment = await tx.enrollment.create({
          data: { tenantId: scope.tenantId, userId: user.userId, courseId },
        });
        await tx.entitlement.create({
          data: {
            tenantId: scope.tenantId,
            userId: user.userId,
            courseId,
            enrollmentId: enrollment.id,
            source: 'FREE',
          },
        });
        return {
          enrollment: {
            id: enrollment.id,
            courseId,
            courseTitle: course.publishedVersion.title,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            hasAccess: true,
          },
          created: true,
        };
      });
    } catch (error) {
      // A concurrent duplicate request lost the race on the one-active-enrollment index.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.db.run(ctx, (tx) =>
          this.findActive(tx, scope.tenantId, user.userId, courseId),
        );
        if (existing) return { enrollment: existing, created: false };
      }
      throw error;
    }
  }

  listMine(scope: TenantScope, user: AuthUser): Promise<EnrollmentView[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const now = new Date();
      const enrollments = await tx.enrollment.findMany({
        where: { tenantId: scope.tenantId, userId: user.userId },
        include: {
          course: { include: { publishedVersion: { select: { title: true } } } },
          entitlements: {
            where: {
              revokedAt: null,
              startsAt: { lte: now },
              OR: [{ endsAt: null }, { endsAt: { gt: now } }],
            },
            select: { id: true },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });
      return enrollments.map((enrollment) => ({
        id: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.publishedVersion?.title ?? '',
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        hasAccess: enrollment.status === 'ACTIVE' && enrollment.entitlements.length > 0,
      }));
    });
  }

  private async findActive(
    tx: Prisma.TransactionClient,
    tenantId: string,
    userId: string,
    courseId: string,
  ): Promise<EnrollmentView | null> {
    const enrollment = await tx.enrollment.findFirst({
      where: { tenantId, userId, courseId, status: 'ACTIVE' },
      include: {
        course: { include: { publishedVersion: { select: { title: true } } } },
        entitlements: { where: { revokedAt: null }, select: { id: true } },
      },
    });
    if (!enrollment) return null;
    return {
      id: enrollment.id,
      courseId,
      courseTitle: enrollment.course.publishedVersion?.title ?? '',
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      hasAccess: enrollment.entitlements.length > 0,
    };
  }
}
