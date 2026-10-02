import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JsonLogger, LOGGER, SecurityEventsService } from '@oxinov/server-kit';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import { UPLOAD_URL_TTL_SEC, ObjectStorage } from '../media/object-storage';
import { MAILER, type Mailer, type OutgoingMail } from '../notifications/mailer';
import { NotificationsService } from '../notifications/notifications.service';
import { rejectedMail, thankYouMail } from '../notifications/templates';
import { hasRole } from '../tenancy/roles';
import {
  EVIDENCE_MAX_BYTES,
  PLAN_LABELS,
  QR_MAX_BYTES,
  accessWindow,
  couponProblem,
  discountFor,
  looksLikeDocument,
  newReference,
  normalizeCode,
  normalizeTransactionId,
  summarizeAccess,
  type PlanPeriod,
} from './store-rules';
import type {
  BankCheckoutDto,
  BankDetailsDto,
  BankPaymentDto,
  CheckoutInfoDto,
  CouponDto,
  CreateCouponDto,
  PlanDto,
  ReviewItemDto,
  SettingsDto,
  SubscriptionDto,
  UpdateSettingsDto,
  UploadTicketDto,
} from './store.dto';

const CURRENCY = 'NPR';
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'application/pdf': 'pdf' };
const PERIOD_ORDER: Record<PlanPeriod, number> = { MONTH_1: 0, MONTH_6: 1, YEAR_1: 2, LIFETIME: 3 };

type Ctx = { tenantId: string; userId: string };
type SettingsRow = NonNullable<Awaited<ReturnType<Tx['storeSettings']['findUnique']>>>;
type PaymentWithRefs = Prisma.PaymentGetPayload<{
  include: { course: { select: { publishedVersion: { select: { title: true } } } }; coupon: { select: { code: true } } };
}>;

const paymentInclude = {
  course: { select: { publishedVersion: { select: { title: true } } } },
  coupon: { select: { code: true } },
} as const;

function toPaymentDto(p: PaymentWithRefs): BankPaymentDto {
  const period = p.planPeriod ?? 'MONTH_1';
  return {
    id: p.id,
    courseId: p.courseId,
    courseTitle: p.course.publishedVersion?.title ?? 'Course',
    status: p.status,
    reference: p.providerPaymentId,
    planPeriod: period,
    planLabel: PLAN_LABELS[period],
    listPriceMinor: p.listPriceMinor ?? p.amountMinor,
    discountMinor: p.discountMinor,
    amountMinor: p.amountMinor,
    currency: p.currency,
    couponCode: p.coupon?.code ?? null,
    bankTransactionId: p.bankTransactionId,
    hasEvidence: p.evidenceObjectKey !== null,
    submittedAt: p.submittedAt,
    reviewedAt: p.reviewedAt,
    reviewReason: p.reviewReason,
    createdAt: p.createdAt,
  };
}

const toPlanDto = (p: { id: string; period: PlanPeriod; priceMinor: number; currency: string; active: boolean }): PlanDto => ({
  id: p.id,
  period: p.period,
  label: PLAN_LABELS[p.period],
  priceMinor: p.priceMinor,
  currency: p.currency,
  active: p.active,
});

const toCouponDto = (c: Prisma.CouponGetPayload<object>): CouponDto => ({
  id: c.id,
  code: c.code,
  percentOff: c.percentOff,
  amountOffMinor: c.amountOffMinor,
  courseId: c.courseId,
  period: c.period,
  startsAt: c.startsAt,
  endsAt: c.endsAt,
  maxUses: c.maxUses,
  usedCount: c.usedCount,
  active: c.active,
});

/**
 * Oxinov's own store (ADR-028): access plans, bank QR payments that an administrator reviews, coupons, and
 * the store settings checkout reads. Money rules: the price, plan, and coupon are copied onto the payment
 * at checkout; a payment leaves PENDING_REVIEW once (conditional update); one approved payment grants
 * exactly one entitlement (unique payment_id); one bank transaction ID pays for one payment per seller
 * (unique index); and nothing is granted without an administrator's approval.
 */
@Injectable()
export class StoreService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly storage: ObjectStorage,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(LOGGER) private readonly logger: JsonLogger,
    private readonly securityEvents: SecurityEventsService,
  ) {}

  // ---------------------------------------------------------------- settings (FR-MGMT-1408)

  async getSettings(scope: TenantScope, user: AuthUser): Promise<SettingsDto> {
    this.require(scope, 'ADMIN');
    const settings = await this.db.run(this.ctx(scope, user), (tx) => this.loadSettings(tx, scope.tenantId));
    return {
      ...(await this.bankDetails(scope.tenantId, settings)),
      referencePrefix: settings.referencePrefix,
      defaultMonth1Minor: settings.defaultMonth1Minor,
      defaultMonth6Minor: settings.defaultMonth6Minor,
      defaultYear1Minor: settings.defaultYear1Minor,
      defaultLifetimeMinor: settings.defaultLifetimeMinor,
      isSeller: this.isSeller(scope.tenantId),
    };
  }

  async updateSettings(scope: TenantScope, user: AuthUser, input: UpdateSettingsDto): Promise<SettingsDto> {
    this.require(scope, 'OWNER', 'Only the owner can change payment details and prices.');
    const data = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
    await this.db.run(this.ctx(scope, user), async (tx) => {
      await tx.storeSettings.upsert({
        where: { tenantId: scope.tenantId },
        create: { tenantId: scope.tenantId, ...data, updatedByUserId: user.userId },
        update: { ...data, updatedByUserId: user.userId },
      });
      await this.audit(tx, scope, user, 'store.settings_changed', 'store_settings', scope.tenantId, { fields: Object.keys(data) });
    });
    return this.getSettings(scope, user);
  }

  async createQrUpload(scope: TenantScope, user: AuthUser, contentType: string, sizeBytes: number): Promise<UploadTicketDto> {
    this.require(scope, 'OWNER', 'Only the owner can change payment details.');
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    const uploadId = randomUUID();
    return this.ticket(uploadId, this.qrKey(scope.tenantId, uploadId, contentType), contentType, sizeBytes);
  }

  async completeQrUpload(scope: TenantScope, user: AuthUser, uploadId: string, contentType: string): Promise<SettingsDto> {
    this.require(scope, 'OWNER', 'Only the owner can change payment details.');
    const key = this.qrKey(scope.tenantId, uploadId, contentType);
    await this.checkUpload(key, contentType, QR_MAX_BYTES, 'Upload the QR as a PNG or JPG image up to 2 MB.');
    await this.db.run(this.ctx(scope, user), async (tx) => {
      await tx.storeSettings.upsert({
        where: { tenantId: scope.tenantId },
        create: { tenantId: scope.tenantId, bankQrObjectKey: key, bankQrContentType: contentType, updatedByUserId: user.userId },
        update: { bankQrObjectKey: key, bankQrContentType: contentType, updatedByUserId: user.userId },
      });
      await this.audit(tx, scope, user, 'store.qr_changed', 'store_settings', scope.tenantId, { contentType });
    });
    return this.getSettings(scope, user);
  }

  // ---------------------------------------------------------------- plans (FR-CATALOG-305)

  /** Every plan of a course for authors; missing periods are offered at the store's default prices. */
  async listPlans(scope: TenantScope, user: AuthUser, courseId: string): Promise<{ plans: PlanDto[]; defaults: Record<PlanPeriod, number> }> {
    this.require(scope, 'ADMIN');
    return this.db.run(this.ctx(scope, user), async (tx) => {
      await this.findCourse(tx, scope.tenantId, courseId, false);
      const [plans, settings] = await Promise.all([
        tx.coursePlan.findMany({ where: { tenantId: scope.tenantId, courseId } }),
        this.loadSettings(tx, scope.tenantId),
      ]);
      return {
        plans: plans.sort((a, b) => PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period]).map(toPlanDto),
        defaults: {
          MONTH_1: settings.defaultMonth1Minor,
          MONTH_6: settings.defaultMonth6Minor,
          YEAR_1: settings.defaultYear1Minor,
          LIFETIME: settings.defaultLifetimeMinor,
        },
      };
    });
  }

  async setPlans(
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
    plans: { period: PlanPeriod; priceMinor: number; active: boolean }[],
  ): Promise<PlanDto[]> {
    this.require(scope, 'OWNER', 'Only the owner can change prices.');
    if (new Set(plans.map((p) => p.period)).size !== plans.length) throw Errors.conflict('Each plan length can appear once.');
    return this.db.run(this.ctx(scope, user), async (tx) => {
      await this.findCourse(tx, scope.tenantId, courseId, false);
      for (const plan of plans) {
        await tx.coursePlan.upsert({
          where: { tenantId_courseId_period: { tenantId: scope.tenantId, courseId, period: plan.period } },
          create: { tenantId: scope.tenantId, courseId, period: plan.period, priceMinor: plan.priceMinor, currency: CURRENCY, active: plan.active },
          update: { priceMinor: plan.priceMinor, active: plan.active },
        });
      }
      await this.audit(tx, scope, user, 'store.plans_changed', 'course', courseId, {
        plans: plans.map((p) => ({ period: p.period, priceMinor: p.priceMinor, active: p.active })),
      });
      const rows = await tx.coursePlan.findMany({ where: { tenantId: scope.tenantId, courseId } });
      return rows.sort((a, b) => PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period]).map(toPlanDto);
    });
  }

  /** What a learner sees on the course page and at checkout. */
  async checkoutInfo(scope: TenantScope, user: AuthUser, courseId: string): Promise<CheckoutInfoDto> {
    const { info, settings } = await this.db.run(this.ctx(scope, user), async (tx) => {
      await this.findCourse(tx, scope.tenantId, courseId, true);
      const [plans, settingsRow, accessEnd, open] = await Promise.all([
        tx.coursePlan.findMany({ where: { tenantId: scope.tenantId, courseId, active: true } }),
        this.loadSettings(tx, scope.tenantId),
        this.currentAccessEnd(tx, scope.tenantId, user.userId, courseId),
        tx.payment.findFirst({
          where: { tenantId: scope.tenantId, userId: user.userId, courseId, provider: 'BANK_QR', status: { in: ['PENDING', 'PENDING_REVIEW', 'REJECTED'] } },
          include: paymentInclude,
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      return {
        settings: settingsRow,
        info: {
          plans: plans.sort((a, b) => PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period]).map(toPlanDto),
          owned: accessEnd !== undefined,
          accessEndsAt: accessEnd ?? null,
          openPayment: open ? toPaymentDto(open) : null,
        },
      };
    });
    return { ...info, bank: await this.bankDetails(scope.tenantId, settings, info.plans.length > 0) };
  }

  // ---------------------------------------------------------------- coupons (FR-CATALOG-317)

  async listCoupons(scope: TenantScope, user: AuthUser): Promise<CouponDto[]> {
    this.require(scope, 'ADMIN');
    const rows = await this.db.run(this.ctx(scope, user), (tx) =>
      tx.coupon.findMany({ where: { tenantId: scope.tenantId }, orderBy: { createdAt: 'desc' } }),
    );
    return rows.map((c) => toCouponDto(c));
  }

  async createCoupon(scope: TenantScope, user: AuthUser, input: CreateCouponDto): Promise<CouponDto> {
    this.require(scope, 'OWNER', 'Only the owner can create coupons.');
    if ((input.percentOff === undefined) === (input.amountOffMinor === undefined)) {
      throw Errors.couponInvalid('Give either a percentage or a fixed amount off, not both.');
    }
    const startsAt = input.startsAt ? new Date(input.startsAt) : null;
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (startsAt && endsAt && startsAt >= endsAt) throw Errors.couponInvalid('The end date must be after the start date.');
    const code = normalizeCode(input.code);
    try {
      return await this.db.run(this.ctx(scope, user), async (tx) => {
        if (input.courseId) await this.findCourse(tx, scope.tenantId, input.courseId, false);
        const coupon = await tx.coupon.create({
          data: {
            tenantId: scope.tenantId,
            code,
            percentOff: input.percentOff ?? null,
            amountOffMinor: input.amountOffMinor ?? null,
            courseId: input.courseId ?? null,
            period: input.period ?? null,
            startsAt,
            endsAt,
            maxUses: input.maxUses ?? null,
            createdByUserId: user.userId,
          },
        });
        await this.audit(tx, scope, user, 'store.coupon_created', 'coupon', coupon.id, { code });
        return toCouponDto(coupon);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw Errors.conflict('A coupon with this code already exists.');
      throw error;
    }
  }

  async setCouponActive(scope: TenantScope, user: AuthUser, couponId: string, active: boolean): Promise<CouponDto> {
    this.require(scope, 'OWNER', 'Only the owner can change coupons.');
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const found = await tx.coupon.findFirst({ where: { id: couponId, tenantId: scope.tenantId } });
      if (!found) throw Errors.notFound('Coupon');
      const coupon = await tx.coupon.update({ where: { id: couponId }, data: { active } });
      await this.audit(tx, scope, user, active ? 'store.coupon_enabled' : 'store.coupon_disabled', 'coupon', couponId, { code: coupon.code });
      return toCouponDto(coupon);
    });
  }

  // ---------------------------------------------------------------- bank QR checkout (FR-CATALOG-307)

  async startBankQr(scope: TenantScope, user: AuthUser, courseId: string, period: PlanPeriod, couponCode?: string): Promise<BankCheckoutDto> {
    if (!this.isSeller(scope.tenantId)) throw Errors.notForSale('Paid courses from this school are not on sale yet.');
    const ctx = this.ctx(scope, user);
    for (let attempt = 0; ; attempt += 1) {
      try {
        const { payment, settings } = await this.db.run(ctx, async (tx) => {
          await this.findCourse(tx, scope.tenantId, courseId, true);
          const settingsRow = await this.loadSettings(tx, scope.tenantId);
          if (!settingsRow.bankQrObjectKey || !settingsRow.accountName) throw Errors.notForSale('Bank payment is not set up yet. Please check back soon.');
          const plan = await tx.coursePlan.findFirst({ where: { tenantId: scope.tenantId, courseId, period, active: true } });
          if (!plan) throw Errors.notForSale('This plan is not on sale.');
          if ((await this.currentAccessEnd(tx, scope.tenantId, user.userId, courseId)) === null) {
            throw Errors.conflict('You already have lifetime access to this course.');
          }
          const inReview = await tx.payment.count({
            where: { tenantId: scope.tenantId, userId: user.userId, courseId, provider: 'BANK_QR', status: 'PENDING_REVIEW' },
          });
          if (inReview > 0) throw Errors.conflict('A payment for this course is already being checked. We will email you when it is done.');

          let discount = 0;
          let couponId: string | null = null;
          if (couponCode?.trim()) {
            const coupon = await tx.coupon.findUnique({ where: { tenantId_code: { tenantId: scope.tenantId, code: normalizeCode(couponCode) } } });
            if (!coupon) throw Errors.couponInvalid('This coupon code is not valid.');
            const problem = couponProblem(coupon, courseId, period, new Date());
            if (problem) throw Errors.couponInvalid(problem);
            discount = discountFor(coupon, plan.priceMinor);
            couponId = coupon.id;
          }

          // A new checkout replaces an unsubmitted one for the same course; submitted ones are kept.
          await tx.payment.updateMany({
            where: { tenantId: scope.tenantId, userId: user.userId, courseId, provider: 'BANK_QR', status: 'PENDING', submittedAt: null },
            data: { status: 'FAILED', verifiedAt: new Date(), failureReason: 'Replaced by a new checkout' },
          });
          const created = await tx.payment.create({
            data: {
              tenantId: scope.tenantId,
              userId: user.userId,
              courseId,
              provider: 'BANK_QR',
              providerPaymentId: newReference(settingsRow.referencePrefix),
              amountMinor: plan.priceMinor - discount,
              currency: plan.currency,
              planId: plan.id,
              planPeriod: plan.period,
              listPriceMinor: plan.priceMinor,
              discountMinor: discount,
              couponId,
            },
            include: paymentInclude,
          });
          await this.audit(tx, scope, user, 'payment.checkout_started', 'payment', created.id, {
            courseId,
            provider: 'BANK_QR',
            period,
            amountMinor: created.amountMinor,
            discountMinor: discount,
          });
          return { payment: created, settings: settingsRow };
        });
        return { payment: toPaymentDto(payment), bank: await this.bankDetails(scope.tenantId, settings) };
      } catch (error) {
        // A reference collided with another payment's; try a fresh one.
        if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
        throw error;
      }
    }
  }

  /** FR-AUTH-104: every offering the caller can open or could open, with plan, price paid, and end date. */
  async mySubscriptions(scope: TenantScope, user: AuthUser): Promise<SubscriptionDto[]> {
    const rows = await this.db.run(this.ctx(scope, user), (tx) =>
      tx.entitlement.findMany({
        where: { tenantId: scope.tenantId, userId: user.userId },
        select: {
          courseId: true,
          source: true,
          startsAt: true,
          endsAt: true,
          revokedAt: true,
          enrollment: { select: { status: true } },
          payment: { select: { planPeriod: true, amountMinor: true } },
          course: { select: { slug: true, kind: true, publishedVersion: { select: { title: true } } } },
        },
        take: 500,
      }),
    );
    const now = new Date();
    const byCourse = new Map<string, typeof rows>();
    for (const row of rows) byCourse.set(row.courseId, [...(byCourse.get(row.courseId) ?? []), row]);
    const out: SubscriptionDto[] = [];
    for (const [courseId, list] of byCourse) {
      const summary = summarizeAccess(
        list.map((row) => ({
          source: row.source,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
          revokedAt: row.revokedAt,
          enrollmentActive: row.enrollment.status === 'ACTIVE',
          planPeriod: row.payment?.planPeriod ?? null,
          paidMinor: row.payment?.amountMinor ?? null,
        })),
        now,
      );
      if (!summary) continue;
      const course = list[0]!.course;
      out.push({
        courseId,
        courseTitle: course.publishedVersion?.title ?? 'Course',
        courseSlug: course.slug,
        kind: course.kind,
        state: summary.state,
        source: summary.source,
        planLabel: summary.planPeriod ? PLAN_LABELS[summary.planPeriod] : null,
        paidMinor: summary.paidMinor,
        since: summary.since,
        endsAt: summary.endsAt,
      });
    }
    // Active first; then the ones ending soonest; lifetime and free last among the active.
    const rank = (s: SubscriptionDto) => (s.state === 'ACTIVE' ? 0 : 1);
    return out.sort((a, b) => rank(a) - rank(b) || (a.endsAt?.getTime() ?? Infinity) - (b.endsAt?.getTime() ?? Infinity) || a.courseTitle.localeCompare(b.courseTitle));
  }

  /** FR-AUTH-104: the caller's own bank payments, newest first. */
  async myPayments(scope: TenantScope, user: AuthUser): Promise<BankPaymentDto[]> {
    const rows = await this.db.run(this.ctx(scope, user), (tx) =>
      tx.payment.findMany({
        where: { tenantId: scope.tenantId, userId: user.userId, provider: 'BANK_QR' },
        include: paymentInclude,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
    return rows.map(toPaymentDto);
  }

  async myPayment(scope: TenantScope, user: AuthUser, paymentId: string): Promise<BankCheckoutDto> {
    const { payment, settings } = await this.db.run(this.ctx(scope, user), async (tx) => ({
      payment: await this.findOwnBankPayment(tx, scope.tenantId, user.userId, paymentId),
      settings: await this.loadSettings(tx, scope.tenantId),
    }));
    return { payment: toPaymentDto(payment), bank: await this.bankDetails(scope.tenantId, settings) };
  }

  async createEvidenceUpload(scope: TenantScope, user: AuthUser, paymentId: string, contentType: string, sizeBytes: number): Promise<UploadTicketDto> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    const uploadId = randomUUID();
    const key = `tenants/${scope.tenantId}/payments/${paymentId}/evidence-${uploadId}.${EXT[contentType]}`;
    await this.db.run(this.ctx(scope, user), async (tx) => {
      const payment = await this.findOwnBankPayment(tx, scope.tenantId, user.userId, paymentId);
      if (payment.status !== 'PENDING' && payment.status !== 'REJECTED') throw Errors.conflict('This payment can no longer be changed.');
      await tx.payment.update({ where: { id: payment.id }, data: { evidenceObjectKey: key, evidenceContentType: contentType } });
    });
    return this.ticket(uploadId, key, contentType, sizeBytes);
  }

  /** The learner's proof of payment: moves the payment to PENDING_REVIEW. Resubmitting a rejected one keeps it. */
  async submitEvidence(scope: TenantScope, user: AuthUser, paymentId: string, bankTransactionId: string): Promise<BankPaymentDto> {
    const ctx = this.ctx(scope, user);
    const payment = await this.db.run(ctx, (tx) => this.findOwnBankPayment(tx, scope.tenantId, user.userId, paymentId));
    if (payment.status === 'PENDING_REVIEW' || payment.status === 'SUCCEEDED') return toPaymentDto(payment);
    if (payment.status !== 'PENDING' && payment.status !== 'REJECTED') throw Errors.conflict('This payment can no longer be changed.');
    if (!payment.evidenceObjectKey || !payment.evidenceContentType) throw Errors.mediaNotUploaded();
    await this.checkUpload(payment.evidenceObjectKey, payment.evidenceContentType, EVIDENCE_MAX_BYTES, 'Upload a JPG, PNG, or PDF of your bank receipt, up to 5 MB.');

    const txId = normalizeTransactionId(bankTransactionId);
    try {
      return await this.db.run(ctx, async (tx) => {
        const moved = await tx.payment.updateMany({
          where: { id: payment.id, tenantId: scope.tenantId, status: { in: ['PENDING', 'REJECTED'] } },
          data: { status: 'PENDING_REVIEW', bankTransactionId: txId, submittedAt: new Date(), reviewedAt: null, reviewedByUserId: null, reviewReason: null },
        });
        if (moved.count > 0) {
          await this.audit(tx, scope, user, 'payment.submitted_for_review', 'payment', payment.id, { courseId: payment.courseId, resubmitted: payment.status === 'REJECTED' });
        }
        return toPaymentDto(await this.findOwnBankPayment(tx, scope.tenantId, user.userId, payment.id));
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.securityEvents.emit({
          action: 'payment.transaction_reused',
          category: 'payment',
          outcome: 'failure',
          severity: 6,
          reasonCode: 'TRANSACTION_REUSED',
          tenantId: scope.tenantId,
          actor: { id: user.userId, type: 'user' },
        });
        throw Errors.conflict('This bank transaction ID was already used for another payment. Check the receipt, or message support.');
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------- review (FR-MGMT-1403, FR-MGMT-1405)

  async reviewQueue(scope: TenantScope, user: AuthUser, status: 'PENDING_REVIEW' | 'SUCCEEDED' | 'REJECTED'): Promise<ReviewItemDto[]> {
    this.require(scope, 'ADMIN', 'Only administrators can review payments.');
    const rows = await this.db.run(this.ctx(scope, user), (tx) =>
      tx.payment.findMany({
        where: { tenantId: scope.tenantId, provider: 'BANK_QR', status },
        include: { ...paymentInclude, user: { select: { displayName: true, email: true } } },
        orderBy: status === 'PENDING_REVIEW' ? { submittedAt: 'asc' } : { reviewedAt: 'desc' },
        take: 100,
      }),
    );
    return Promise.all(rows.map((row) => this.reviewItem(row, false)));
  }

  async reviewDetail(scope: TenantScope, user: AuthUser, paymentId: string): Promise<ReviewItemDto> {
    this.require(scope, 'ADMIN', 'Only administrators can review payments.');
    const row = await this.db.run(this.ctx(scope, user), (tx) => this.findBankPaymentForReview(tx, scope.tenantId, paymentId));
    return this.reviewItem(row, true);
  }

  async approve(scope: TenantScope, user: AuthUser, paymentId: string): Promise<ReviewItemDto> {
    this.require(scope, 'ADMIN', 'Only administrators can approve payments.');
    const ctx = this.ctx(scope, user);
    const result = await this.db.run(ctx, async (tx) => {
      const payment = await this.findBankPaymentForReview(tx, scope.tenantId, paymentId);
      if (payment.status === 'SUCCEEDED') return { payment, granted: null, slug: '' };
      if (payment.status !== 'PENDING_REVIEW') throw Errors.conflict('Only payments waiting for review can be approved.');
      const now = new Date();

      if (payment.couponId) {
        const coupon = await tx.coupon.findFirstOrThrow({ where: { id: payment.couponId, tenantId: scope.tenantId } });
        // Dates and plan are judged when the learner submitted; the use limit is judged now.
        const problem = couponProblem({ ...coupon, maxUses: null }, payment.courseId, payment.planPeriod as PlanPeriod, payment.submittedAt ?? now);
        if (problem) throw Errors.couponInvalid(`The coupon ${coupon.code} cannot be applied: ${problem} Reject the payment with this reason.`);
        const used = await tx.coupon.updateMany({
          where: { id: coupon.id, tenantId: scope.tenantId, OR: [{ maxUses: null }, { usedCount: { lt: coupon.maxUses ?? 0 } }] },
          data: { usedCount: { increment: 1 } },
        });
        if (used.count === 0) throw Errors.couponInvalid(`The coupon ${coupon.code} has been fully used. Reject the payment with this reason.`);
      }

      const moved = await tx.payment.updateMany({
        where: { id: payment.id, tenantId: scope.tenantId, status: 'PENDING_REVIEW' },
        data: { status: 'SUCCEEDED', verifiedAt: now, reviewedAt: now, reviewedByUserId: user.userId, providerTransactionId: payment.bankTransactionId },
      });
      if (moved.count === 0) throw Errors.conflict('Someone else reviewed this payment just now. Reload the queue.');

      const window = accessWindow(payment.planPeriod as PlanPeriod, now, await this.currentAccessEnd(tx, scope.tenantId, payment.userId, payment.courseId));
      const enrollment =
        (await tx.enrollment.findFirst({
          where: { tenantId: scope.tenantId, userId: payment.userId, courseId: payment.courseId, status: 'ACTIVE' },
          select: { id: true },
        })) ??
        (await tx.enrollment.create({ data: { tenantId: scope.tenantId, userId: payment.userId, courseId: payment.courseId }, select: { id: true } }));
      await tx.entitlement.create({
        data: {
          tenantId: scope.tenantId,
          userId: payment.userId,
          courseId: payment.courseId,
          enrollmentId: enrollment.id,
          source: 'PURCHASE',
          paymentId: payment.id,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        },
      });
      const slug = await this.tenantSlug(tx, scope.tenantId);
      const title = (await tx.course.findFirst({ where: { id: payment.courseId, tenantId: scope.tenantId }, select: { publishedVersion: { select: { title: true } } } }))?.publishedVersion?.title ?? 'your course';
      await NotificationsService.create(tx, {
        tenantId: scope.tenantId,
        userId: payment.userId,
        kind: 'PAYMENT_APPROVED',
        title: `Thank you for subscribing to ${title}`,
        body: `Your ${PLAN_LABELS[payment.planPeriod as PlanPeriod]} plan is active${window.endsAt ? ` until ${window.endsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kathmandu' })}` : ' for life'}.`,
        linkPath: `/w/${slug}/courses/${payment.courseId}`,
        dedupeKey: `payment:${payment.id}:approved`,
      });
      await this.audit(tx, scope, user, 'payment.approved', 'payment', payment.id, {
        courseId: payment.courseId,
        learnerId: payment.userId,
        amountMinor: payment.amountMinor,
        period: payment.planPeriod,
        endsAt: window.endsAt?.toISOString() ?? null,
      });
      return { payment: await this.findBankPaymentForReview(tx, scope.tenantId, payment.id), granted: window, slug };
    });

    if (result.granted && result.payment.user.email) {
      await this.sendMail(
        thankYouMail({
          to: result.payment.user.email,
          courseTitle: result.payment.course.publishedVersion?.title ?? 'your course',
          planLabel: PLAN_LABELS[result.payment.planPeriod as PlanPeriod],
          amountMinor: result.payment.amountMinor,
          reference: result.payment.providerPaymentId,
          endsAt: result.granted.endsAt,
          courseUrl: this.courseUrl(result.slug, result.payment.courseId),
          support: this.config.mail.supportAddress,
        }),
        'payment.approved',
      );
    }
    return this.reviewItem(result.payment, true);
  }

  async reject(scope: TenantScope, user: AuthUser, paymentId: string, reason: string): Promise<ReviewItemDto> {
    this.require(scope, 'ADMIN', 'Only administrators can reject payments.');
    const trimmed = reason.trim();
    const result = await this.db.run(this.ctx(scope, user), async (tx) => {
      const payment = await this.findBankPaymentForReview(tx, scope.tenantId, paymentId);
      if (payment.status === 'REJECTED') return { payment, changed: false, slug: '' };
      if (payment.status !== 'PENDING_REVIEW') throw Errors.conflict('Only payments waiting for review can be rejected.');
      const now = new Date();
      const moved = await tx.payment.updateMany({
        where: { id: payment.id, tenantId: scope.tenantId, status: 'PENDING_REVIEW' },
        data: { status: 'REJECTED', reviewedAt: now, reviewedByUserId: user.userId, reviewReason: trimmed },
      });
      if (moved.count === 0) throw Errors.conflict('Someone else reviewed this payment just now. Reload the queue.');
      await this.audit(tx, scope, user, 'payment.rejected', 'payment', payment.id, { courseId: payment.courseId, learnerId: payment.userId, reason: trimmed });
      const slug = await this.tenantSlug(tx, scope.tenantId);
      await NotificationsService.create(tx, {
        tenantId: scope.tenantId,
        userId: payment.userId,
        kind: 'PAYMENT_REJECTED',
        title: 'Your payment needs a quick fix',
        body: `Reason from our team: ${trimmed}`,
        linkPath: `/w/${slug}/pay/bank/${payment.id}`,
        // One notice per review: a payment fixed and rejected again gets a new one.
        dedupeKey: `payment:${payment.id}:rejected:${now.toISOString()}`,
      });
      return { payment: await this.findBankPaymentForReview(tx, scope.tenantId, payment.id), changed: true, slug };
    });

    if (result.changed && result.payment.user.email) {
      const courseUrl = this.courseUrl(result.slug, result.payment.courseId);
      await this.sendMail(
        rejectedMail({
          to: result.payment.user.email,
          courseTitle: result.payment.course.publishedVersion?.title ?? 'your course',
          planLabel: PLAN_LABELS[result.payment.planPeriod as PlanPeriod],
          amountMinor: result.payment.amountMinor,
          reference: result.payment.providerPaymentId,
          reason: trimmed,
          courseUrl,
          fixUrl: `${this.config.payments.webUrl}/w/${encodeURIComponent(result.slug)}/pay/bank/${result.payment.id}`,
          support: this.config.mail.supportAddress,
        }),
        'payment.rejected',
      );
    }
    return this.reviewItem(result.payment, true);
  }

  // ---------------------------------------------------------------- helpers

  private ctx(scope: TenantScope, user: AuthUser): Ctx {
    return { tenantId: scope.tenantId, userId: user.userId };
  }

  private require(scope: TenantScope, role: 'ADMIN' | 'OWNER', message?: string): void {
    if (!hasRole(scope.role, role)) throw Errors.forbidden(message);
  }

  private isSeller(tenantId: string): boolean {
    return this.config.payments.sellerTenantIds.has(tenantId);
  }

  private async loadSettings(tx: Tx, tenantId: string): Promise<SettingsRow> {
    return (await tx.storeSettings.findUnique({ where: { tenantId } })) ?? (await tx.storeSettings.create({ data: { tenantId } }));
  }

  private async bankDetails(tenantId: string, s: SettingsRow, hasPlans = true): Promise<BankDetailsDto> {
    const reason = !this.isSeller(tenantId)
      ? 'Paid courses from this school are not on sale yet.'
      : !s.bankQrObjectKey || !s.accountName
        ? 'Bank payment is not set up yet. Please check back soon.'
        : !hasPlans
          ? 'This course has no plans on sale yet.'
          : undefined;
    return {
      available: !reason,
      ...(reason ? { reason } : {}),
      qrUrl: s.bankQrObjectKey && this.storage.enabled ? await this.storage.presignPlayback(s.bankQrObjectKey) : null,
      accountName: s.accountName,
      accountNumber: s.accountNumber,
      bankName: s.bankName,
      reviewTimeText: s.reviewTimeText,
      helpContact: s.helpContact,
      refundPolicy: s.refundPolicy,
    };
  }

  /** End of the learner's current access: `undefined` for none, `null` for lifetime. */
  private async currentAccessEnd(tx: Tx, tenantId: string, userId: string, courseId: string): Promise<Date | null | undefined> {
    const rows = await tx.entitlement.findMany({
      where: { tenantId, userId, courseId, revokedAt: null, enrollment: { status: 'ACTIVE' }, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      select: { endsAt: true, startsAt: true },
    });
    if (rows.length === 0) return undefined;
    if (rows.some((r) => r.endsAt === null)) return null;
    return rows.reduce<Date>((max, r) => (r.endsAt! > max ? r.endsAt! : max), rows[0]!.endsAt!);
  }

  private async findCourse(tx: Tx, tenantId: string, courseId: string, published: boolean) {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId, ...(published ? { status: 'PUBLISHED' } : {}) },
      select: { id: true, publishedVersion: { select: { title: true } } },
    });
    if (!course || (published && !course.publishedVersion)) throw Errors.notFound('Course');
    return course;
  }

  private async findOwnBankPayment(tx: Tx, tenantId: string, userId: string, paymentId: string): Promise<PaymentWithRefs> {
    const payment = await tx.payment.findFirst({ where: { id: paymentId, tenantId, userId, provider: 'BANK_QR' }, include: paymentInclude });
    if (!payment) throw Errors.notFound('Payment');
    return payment;
  }

  private async findBankPaymentForReview(tx: Tx, tenantId: string, paymentId: string) {
    const payment = await tx.payment.findFirst({
      where: { id: paymentId, tenantId, provider: 'BANK_QR' },
      include: { ...paymentInclude, user: { select: { displayName: true, email: true } } },
    });
    if (!payment) throw Errors.notFound('Payment');
    return payment;
  }

  private async reviewItem(
    row: PaymentWithRefs & { user: { displayName: string | null; email: string | null } },
    withEvidence: boolean,
  ): Promise<ReviewItemDto> {
    const checks = [
      { ok: row.bankTransactionId !== null, text: row.bankTransactionId ? 'Bank transaction ID not used on any other payment' : 'No bank transaction ID yet' },
      { ok: row.evidenceObjectKey !== null, text: row.evidenceObjectKey ? 'Receipt screenshot attached' : 'No receipt attached' },
      { ok: true, text: `Look for ${(row.amountMinor / 100).toLocaleString('en-US')} NPR with remark ${row.providerPaymentId} in the bank statement` },
    ];
    if (row.coupon) checks.push({ ok: true, text: `Coupon ${row.coupon.code}: ${(row.discountMinor / 100).toLocaleString('en-US')} NPR off` });
    let evidenceUrl: string | null = null;
    if (withEvidence && row.evidenceObjectKey && this.storage.enabled) {
      evidenceUrl =
        row.evidenceContentType === 'application/pdf'
          ? await this.storage.presignInlinePdf(row.evidenceObjectKey)
          : await this.storage.presignPlayback(row.evidenceObjectKey);
    }
    return { ...toPaymentDto(row), learnerName: row.user.displayName, learnerEmail: row.user.email, checks, evidenceUrl };
  }

  private qrKey(tenantId: string, uploadId: string, contentType: string): string {
    return `tenants/${tenantId}/store/qr-${uploadId}.${EXT[contentType] ?? 'bin'}`;
  }

  private async ticket(uploadId: string, key: string, contentType: string, sizeBytes: number): Promise<UploadTicketDto> {
    return {
      uploadId,
      uploadUrl: await this.storage.presignUpload(key, contentType, sizeBytes),
      headers: { 'Content-Type': contentType },
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SEC * 1000),
    };
  }

  /** The object must exist, be within the size limit, and really be the declared image or PDF. */
  private async checkUpload(key: string, contentType: string, maxBytes: number, message: string): Promise<void> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    const stored = await this.storage.head(key);
    if (!stored) throw Errors.mediaNotUploaded();
    if (stored.sizeBytes > maxBytes || !looksLikeDocument(contentType, await this.storage.prefix(key, 16))) {
      await this.storage.remove(key).catch(() => undefined);
      throw Errors.mediaInvalid(message);
    }
  }

  private async tenantSlug(tx: Tx, tenantId: string): Promise<string> {
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
    return tenant?.slug ?? '';
  }

  private courseUrl(slug: string, courseId: string): string {
    return `${this.config.payments.webUrl}/w/${encodeURIComponent(slug)}/courses/${courseId}`;
  }

  /** Email never decides the outcome: a failed send is logged without the address or body. */
  private async sendMail(mail: OutgoingMail, event: string): Promise<void> {
    try {
      await this.mailer.send(mail);
    } catch (error) {
      this.logger.event('warn', 'mail.failed', { trigger: event, error: error instanceof Error ? error.name : 'unknown' });
    }
  }

  private async audit(tx: Tx, scope: TenantScope, user: AuthUser, action: string, targetType: string, targetId: string, metadata: Prisma.InputJsonObject) {
    await tx.auditEvent.create({ data: { tenantId: scope.tenantId, actorUserId: user.userId, action, targetType, targetId, metadata } });
  }
}

