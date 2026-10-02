import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import { ReviewsService } from '../reviews/reviews.service';
import { hasRole } from '../tenancy/roles';
import type { WorkspaceDto } from '../tenants/tenants.dto';
import { PLAN_LABELS, PLAN_PERIODS, storefrontPrice, type PlanPeriod } from './store-rules';
import type { ListingDto, SetListingDto, StoreHomeDto, StoreOfferingDetailDto, StoreOfferingDto, StorePlanDto } from './storefront.dto';

const PERIOD_ORDER: Record<PlanPeriod, number> = { MONTH_1: 0, MONTH_6: 1, YEAR_1: 2, LIFETIME: 3 };
/** Schema defaults, used before the owner has saved store settings. */
const DEFAULT_PRICES: Record<PlanPeriod, number> = { MONTH_1: 500_000, MONTH_6: 1_000_000, YEAR_1: 1_500_000, LIFETIME: 2_000_000 };
const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;

const workspaceSelect = { id: true, slug: true, name: true, status: true, primaryColor: true, timeZone: true, defaultLocale: true } as const;

const offeringInclude = {
  publishedVersion: {
    select: {
      title: true,
      summary: true,
      language: true,
      sections: { orderBy: { position: 'asc' }, select: { lessons: { select: { isPreview: true } } } },
    },
  },
  plans: { where: { active: true }, select: { priceMinor: true } },
} as const;

type OfferingRow = Prisma.CourseGetPayload<{ include: typeof offeringInclude }>;

/**
 * The public face of Oxinov's store (ADR-028): the seller workspace's published offerings, their syllabus,
 * and their plans, readable without signing in. Only what a visitor may see leaves this service: titles,
 * summaries, the outline, prices, and the checkout policy. Lesson content stays behind the entitlement
 * checks of the catalog. Signed-in visitors join the store as learners with one call, so buying needs no
 * join code.
 */
@Injectable()
export class StorefrontService {
  constructor(
    private readonly db: DatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async home(): Promise<StoreHomeDto> {
    const tenantId = this.sellerId();
    return this.db.run({ tenantId }, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: { name: true, slug: true } });
      if (!tenant) throw Errors.notFound('Store');
      const [settings, courses] = await Promise.all([
        tx.storeSettings.findUnique({ where: { tenantId } }),
        tx.course.findMany({
          where: { tenantId, status: 'PUBLISHED', publishedVersionId: { not: null } },
          include: offeringInclude,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 200,
        }),
      ]);
      const ratings = await ReviewsService.ratingsFor(tx, tenantId, courses.map((course) => course.id));
      // The next live classes of published offerings, free ones first among equals; no join links leave here.
      const live = await tx.liveSession.findMany({
        where: { tenantId, cancelledAt: null, startsAt: { gt: new Date(Date.now() - 60 * 60 * 1000) }, courseId: { in: courses.map((course) => course.id) } },
        orderBy: [{ startsAt: 'asc' }, { visibility: 'asc' }],
        take: 3,
        select: { title: true, startsAt: true, durationMin: true, visibility: true, courseId: true },
      });
      const bySlug = new Map(courses.map((course) => [course.id, course]));
      const defaults: Record<PlanPeriod, number> = settings
        ? { MONTH_1: settings.defaultMonth1Minor, MONTH_6: settings.defaultMonth6Minor, YEAR_1: settings.defaultYear1Minor, LIFETIME: settings.defaultLifetimeMinor }
        : DEFAULT_PRICES;
      return {
        name: tenant.name,
        slug: tenant.slug,
        defaultPlans: PLAN_PERIODS.map((period) => ({ period, label: PLAN_LABELS[period], priceMinor: defaults[period], currency: 'NPR' })),
        offerings: courses.map((course) => toOffering(course, ratings.get(course.id))),
        upcomingLive: live.map(({ courseId, ...session }) => ({
          ...session,
          offeringSlug: bySlug.get(courseId)?.slug ?? '',
          offeringTitle: bySlug.get(courseId)?.publishedVersion?.title ?? '',
        })),
      };
    });
  }

  async offering(slug: string): Promise<StoreOfferingDetailDto> {
    if (!SLUG.test(slug)) throw Errors.notFound('Offering');
    const tenantId = this.sellerId();
    return this.db.run({ tenantId }, async (tx) => {
      const course = await tx.course.findFirst({
        where: { tenantId, slug, status: 'PUBLISHED', publishedVersionId: { not: null } },
        include: offeringInclude,
      });
      if (!course?.publishedVersionId) throw Errors.notFound('Offering');
      const [version, plans, settings, tenant, live, reviews] = await Promise.all([
        tx.courseVersion.findUniqueOrThrow({
          where: { id: course.publishedVersionId },
          select: {
            description: true,
            outcomes: true,
            sections: {
              orderBy: { position: 'asc' },
              select: {
                title: true,
                lessons: { orderBy: { position: 'asc' }, select: { title: true, kind: true, isPreview: true, durationSec: true } },
              },
            },
          },
        }),
        tx.coursePlan.findMany({ where: { tenantId, courseId: course.id, active: true } }),
        tx.storeSettings.findUnique({ where: { tenantId }, select: { refundPolicy: true, reviewTimeText: true, bankQrObjectKey: true, accountName: true } }),
        tx.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
        tx.liveSession.findMany({
          where: { tenantId, courseId: course.id, cancelledAt: null, startsAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
          orderBy: { startsAt: 'asc' },
          take: 10,
          select: { title: true, startsAt: true, durationMin: true, visibility: true },
        }),
        ReviewsService.publicReviews(tx, tenantId, course.id),
      ]);
      return {
        ...toOffering(course, { average: reviews.rating.average, count: reviews.rating.count }),
        description: version.description,
        outcomes: version.outcomes,
        curriculum: version.sections.map((section) => ({ title: section.title, lessons: section.lessons })),
        plans: plans
          .sort((a, b) => PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period])
          .map((plan): StorePlanDto => ({ period: plan.period, label: PLAN_LABELS[plan.period], priceMinor: plan.priceMinor, currency: plan.currency })),
        refundPolicy: settings?.refundPolicy ?? '',
        reviewTimeText: settings?.reviewTimeText ?? 'Usually within a few hours',
        storeSlug: tenant.slug,
        liveSessions: live,
        // Same rule as checkout (StoreService.bankDetails): a QR and an account name must be set.
        checkoutOpen: Boolean(settings?.bankQrObjectKey && settings.accountName),
        rating: reviews.rating,
        reviews: reviews.reviews,
      };
    });
  }

  /**
   * Makes the signed-in caller a learner of the store, once. Returns the store workspace either way; a
   * suspended membership stays suspended. `joined` is true when a membership was created.
   */
  async join(user: AuthUser): Promise<{ workspace: WorkspaceDto; joined: boolean }> {
    const tenantId = this.sellerId();
    const attempt = () =>
      this.db.run({ tenantId, userId: user.userId }, async (tx) => {
        const tenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: workspaceSelect });
        if (!tenant) throw Errors.notFound('Store');
        const existing = await tx.tenantMembership.findUnique({
          where: { tenantId_userId: { tenantId, userId: user.userId } },
          select: { role: true, status: true },
        });
        if (existing?.status === 'ACTIVE') return { workspace: { ...tenant, role: existing.role }, joined: false };
        if (existing) throw Errors.forbidden('Your access to the Oxinov store is suspended. Contact support@oxinov.com.');
        await tx.tenantMembership.create({ data: { tenantId, userId: user.userId, role: 'LEARNER' } });
        await tx.auditEvent.create({
          data: { tenantId, actorUserId: user.userId, action: 'tenant.member.joined_store', targetType: 'tenant', targetId: tenantId, metadata: { role: 'LEARNER' } },
        });
        return { workspace: { ...tenant, role: 'LEARNER' as const }, joined: true };
      });
    try {
      return await attempt();
    } catch (error) {
      // Two joins at once by the same person: the second sees the first one's membership.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return attempt();
      throw error;
    }
  }

  /** Administrators set an offering's kind and store category in Oxinov Studio. */
  async setListing(scope: TenantScope, user: AuthUser, courseId: string, input: SetListingDto): Promise<ListingDto> {
    if (!hasRole(scope.role, 'ADMIN')) throw Errors.forbidden('Only administrators can change how an offering is listed.');
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx: Tx) => {
      const updated = await tx.course.updateMany({ where: { id: courseId, tenantId: scope.tenantId }, data: { kind: input.kind, category: input.category } });
      if (updated.count === 0) throw Errors.notFound('Course');
      await tx.auditEvent.create({
        data: { tenantId: scope.tenantId, actorUserId: user.userId, action: 'course.listing.updated', targetType: 'course', targetId: courseId, metadata: { kind: input.kind, category: input.category } },
      });
      return { courseId, kind: input.kind, category: input.category };
    });
  }

  /** The store is the first seller workspace (ADR-023); without one there is no public store. */
  private sellerId(): string {
    const [first] = this.config.payments.sellerTenantIds;
    if (!first) throw Errors.notFound('Store');
    return first;
  }
}

function toOffering(course: OfferingRow, rating?: { average: number | null; count: number }): StoreOfferingDto {
  const version = course.publishedVersion!;
  const lessons = version.sections.flatMap((section) => section.lessons);
  return {
    id: course.id,
    slug: course.slug,
    title: version.title,
    summary: version.summary,
    kind: course.kind,
    category: course.category,
    language: version.language,
    ...storefrontPrice(course.plans, course.priceMinor),
    currency: course.plans.length > 0 ? 'NPR' : course.currency,
    lessonCount: lessons.length,
    freeLessonCount: lessons.filter((lesson) => lesson.isPreview).length,
    ratingAverage: rating?.average ?? null,
    ratingCount: rating?.count ?? 0,
  };
}
