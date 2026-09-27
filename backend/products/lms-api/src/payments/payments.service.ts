import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SecurityEventsService } from '@oxinov/server-kit';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import { hasActiveEntitlement } from '../learning/access';
import type { CheckoutDto, CheckoutOptionsDto, PaymentDto } from './payments.dto';
import { KHALTI_MIN_AMOUNT_MINOR, PAYMENT_PROVIDERS, ProviderError, type PaymentProviders, type ProviderName, type VerifyResult } from './providers';

/** Khalti and eSewa settle Nepali rupees only. */
const CURRENCY = 'NPR';

type PaymentRow = {
  id: string;
  courseId: string;
  provider: string;
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
  status: string;
  providerTransactionId: string | null;
  createdAt: Date;
  verifiedAt: Date | null;
};

const toDto = (payment: PaymentRow): PaymentDto => ({
  id: payment.id,
  courseId: payment.courseId,
  provider: payment.provider,
  amountMinor: payment.amountMinor,
  currency: payment.currency,
  status: payment.status,
  transactionId: payment.providerTransactionId,
  createdAt: payment.createdAt,
  verifiedAt: payment.verifiedAt,
});

/**
 * Paid-course checkout through Khalti and eSewa (FR-CATALOG-303, FR-PAY-2701/2702, ADR-023).
 *
 * The browser is sent to the provider and comes back, but coming back proves nothing: access is granted
 * only after this service asks the provider itself and the provider reports the payment complete for the
 * expected amount. Each provider transaction is recorded once, a payment moves out of PENDING once, and
 * one payment grants at most one entitlement, so repeated or concurrent checks cannot grant twice.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(PAYMENT_PROVIDERS) private readonly providers: PaymentProviders,
    private readonly securityEvents: SecurityEventsService,
  ) {}

  private get sellingProviders(): ProviderName[] {
    return [...this.providers.keys()];
  }

  /** What the course page needs to show a Buy button (or why there is none). */
  async options(scope: TenantScope, user: AuthUser, courseId: string): Promise<CheckoutOptionsDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const course = await this.sellableCourse(tx, scope.tenantId, courseId);
      const owned = await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId);
      const reason = this.unavailableReason(scope.tenantId, course.priceMinor, course.currency);
      return {
        available: !reason && !owned,
        providers: reason ? [] : this.sellingProviders,
        amountMinor: course.priceMinor,
        currency: course.currency,
        owned,
        ...(reason ? { reason } : {}),
        mode: this.config.payments.mode,
      };
    });
  }

  async start(scope: TenantScope, user: AuthUser, courseId: string, providerName: ProviderName): Promise<CheckoutDto> {
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    const { course, slug } = await this.db.run(ctx, async (tx) => {
      const found = await this.sellableCourse(tx, scope.tenantId, courseId);
      const reason = this.unavailableReason(scope.tenantId, found.priceMinor, found.currency);
      if (reason) throw Errors.notForSale(reason);
      if (await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId)) {
        throw Errors.conflict('You already have access to this course.');
      }
      const tenant = await tx.tenant.findUnique({ where: { id: scope.tenantId }, select: { slug: true } });
      if (!tenant) throw Errors.notFound('Workspace');
      return { course: found, slug: tenant.slug };
    });
    const provider = this.providers.get(providerName);
    if (!provider) throw Errors.notForSale('This payment method is not available.');
    if (providerName === 'KHALTI' && course.priceMinor < KHALTI_MIN_AMOUNT_MINOR) {
      throw Errors.notForSale('Khalti accepts payments of Rs 10 or more; use eSewa for this course.');
    }

    const paymentId = randomUUID();
    const base = `${this.config.payments.webUrl}/w/${encodeURIComponent(slug)}/pay/${paymentId}`;
    let started;
    try {
      started = await provider.start({
        paymentId,
        amountMinor: course.priceMinor,
        courseTitle: course.title,
        // The provider adds its own query parameters; the path identifies the payment.
        returnUrl: `${base}/${providerName.toLowerCase()}`,
        failureUrl: `${base}/${providerName.toLowerCase()}?cancelled=1`,
        websiteUrl: this.config.payments.webUrl,
      });
    } catch (error) {
      if (error instanceof ProviderError) throw Errors.paymentUnavailable();
      throw error;
    }

    await this.db.run(ctx, async (tx) => {
      await tx.payment.create({
        data: {
          id: paymentId,
          tenantId: scope.tenantId,
          userId: user.userId,
          courseId,
          provider: providerName,
          providerPaymentId: started.providerPaymentId,
          amountMinor: course.priceMinor,
          currency: course.currency,
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId: scope.tenantId,
          actorUserId: user.userId,
          action: 'payment.checkout_started',
          targetType: 'payment',
          targetId: paymentId,
          metadata: { courseId, provider: providerName, amountMinor: course.priceMinor, currency: course.currency },
        },
      });
    });
    return { paymentId, provider: providerName, redirect: started.redirect };
  }

  /**
   * Asks the provider about one of the caller's payments and applies the answer. Safe to call any number
   * of times: after the first final answer it only reports the stored result.
   */
  async verify(scope: TenantScope, user: AuthUser, paymentId: string): Promise<PaymentDto> {
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    const payment = await this.db.run(ctx, (tx) => this.findOwn(tx, scope.tenantId, user.userId, paymentId));
    if (payment.status !== 'PENDING') return toDto(payment);

    const provider = this.providers.get(payment.provider as ProviderName);
    if (!provider) throw Errors.paymentUnavailable();
    let result: VerifyResult;
    try {
      result = await provider.verify({
        paymentId: payment.id,
        providerPaymentId: payment.providerPaymentId,
        amountMinor: payment.amountMinor,
        createdAt: payment.createdAt,
      });
    } catch (error) {
      if (error instanceof ProviderError) throw Errors.paymentUnavailable('The payment provider did not answer. Check again in a minute.');
      throw error;
    }

    if (result.status === 'PENDING') return toDto(payment);
    if (result.status === 'COMPLETED' && result.amountMinor !== payment.amountMinor) {
      // Never grant on a different amount: record it and alert (a tampered or misconfigured checkout).
      this.securityEvents.emit({
        action: 'payment.amount_mismatch',
        category: 'payment',
        outcome: 'failure',
        severity: 7,
        reasonCode: 'AMOUNT_MISMATCH',
        tenantId: scope.tenantId,
        actor: { id: user.userId, type: 'user' },
      });
      return this.fail(ctx, payment, `Provider reported ${result.amountMinor}, expected ${payment.amountMinor}`);
    }
    if (result.status === 'FAILED') return this.fail(ctx, payment, result.detail);
    return this.succeed(ctx, payment, result.transactionId);
  }

  async listMine(scope: TenantScope, user: AuthUser, courseId?: string): Promise<PaymentDto[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const rows = await tx.payment.findMany({
        where: { tenantId: scope.tenantId, userId: user.userId, ...(courseId ? { courseId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return rows.map(toDto);
    });
  }

  private async succeed(
    ctx: { tenantId: string; userId: string },
    payment: PaymentRow,
    transactionId: string,
    retried = false,
  ): Promise<PaymentDto> {
    const eventId = `${transactionId}:completed`;
    let applied: PaymentDto | null;
    try {
      applied = await this.db.run(ctx, async (tx): Promise<PaymentDto | null> => {
        // The provider says this transaction already paid for another payment: never grant twice.
        const reused = await tx.providerEvent.findUnique({
          where: { provider_providerEventId: { provider: payment.provider as ProviderName, providerEventId: eventId } },
          select: { id: true },
        });
        if (reused) return null;
        const now = new Date();
        const moved = await tx.payment.updateMany({
          where: { id: payment.id, tenantId: ctx.tenantId, status: 'PENDING' },
          data: { status: 'SUCCEEDED', verifiedAt: now, providerTransactionId: transactionId },
        });
        // Another check applied the result first; report what it stored.
        if (moved.count === 0) return toDto(await this.findOwn(tx, ctx.tenantId, ctx.userId, payment.id));

        // One record per provider transaction (FR-PAY-2702); a concurrent duplicate aborts everything.
        await tx.providerEvent.create({
          data: {
            provider: payment.provider as ProviderName,
            providerEventId: eventId,
            eventType: 'payment.completed',
            tenantId: ctx.tenantId,
            processedAt: now,
          },
        });
        const enrollment =
          (await tx.enrollment.findFirst({
            where: { tenantId: ctx.tenantId, userId: ctx.userId, courseId: payment.courseId, status: 'ACTIVE' },
            select: { id: true },
          })) ??
          (await tx.enrollment.create({
            data: { tenantId: ctx.tenantId, userId: ctx.userId, courseId: payment.courseId },
            select: { id: true },
          }));
        await tx.entitlement.create({
          data: {
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            courseId: payment.courseId,
            enrollmentId: enrollment.id,
            source: 'PURCHASE',
            paymentId: payment.id,
          },
        });
        await tx.auditEvent.create({
          data: {
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: 'payment.succeeded',
            targetType: 'payment',
            targetId: payment.id,
            metadata: { courseId: payment.courseId, provider: payment.provider, transactionId, amountMinor: payment.amountMinor },
          },
        });
        return toDto(await this.findOwn(tx, ctx.tenantId, ctx.userId, payment.id));
      });
    } catch (error) {
      // A concurrent check or free enrollment won a unique-index race and everything rolled back; one
      // retry sees its result (or the reused transaction) and answers from that.
      if (!retried && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.succeed(ctx, payment, transactionId, true);
      }
      throw error;
    }
    if (applied) return applied;
    this.securityEvents.emit({
      action: 'payment.transaction_reused',
      category: 'payment',
      outcome: 'failure',
      severity: 7,
      reasonCode: 'TRANSACTION_REUSED',
      tenantId: ctx.tenantId,
      actor: { id: ctx.userId, type: 'user' },
    });
    return this.fail(ctx, payment, 'Provider transaction was already used for another payment');
  }

  private async fail(ctx: { tenantId: string; userId: string }, payment: PaymentRow, detail: string): Promise<PaymentDto> {
    return this.db.run(ctx, async (tx) => {
      const moved = await tx.payment.updateMany({
        where: { id: payment.id, tenantId: ctx.tenantId, status: 'PENDING' },
        data: { status: 'FAILED', verifiedAt: new Date(), failureReason: detail.slice(0, 500) },
      });
      if (moved.count > 0) {
        await tx.auditEvent.create({
          data: {
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: 'payment.failed',
            targetType: 'payment',
            targetId: payment.id,
            metadata: { courseId: payment.courseId, provider: payment.provider, detail: detail.slice(0, 200) },
          },
        });
      }
      return toDto(await this.findOwn(tx, ctx.tenantId, ctx.userId, payment.id));
    });
  }

  /** Learners only ever see and check their own payments; anyone else's is simply not found. */
  private async findOwn(tx: Tx, tenantId: string, userId: string, paymentId: string): Promise<PaymentRow> {
    const payment = await tx.payment.findFirst({ where: { id: paymentId, tenantId, userId } });
    if (!payment) throw Errors.notFound('Payment');
    return payment;
  }

  private async sellableCourse(tx: Tx, tenantId: string, courseId: string) {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId, status: 'PUBLISHED' },
      select: { priceMinor: true, currency: true, publishedVersion: { select: { title: true } } },
    });
    if (!course?.publishedVersion) throw Errors.notFound('Course');
    return { priceMinor: course.priceMinor, currency: course.currency, title: course.publishedVersion.title };
  }

  private unavailableReason(tenantId: string, priceMinor: number, currency: string): string | undefined {
    if (priceMinor <= 0) return 'This course is free; enroll instead.';
    if (!this.config.payments.sellerTenantIds.has(tenantId)) return 'Paid courses from this school are not on sale yet.';
    if (currency !== CURRENCY) return 'Only courses priced in Nepali rupees (NPR) can be bought with Khalti or eSewa.';
    if (this.providers.size === 0) return 'Online payment is not set up yet.';
    return undefined;
  }
}
