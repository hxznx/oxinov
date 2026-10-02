import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import {
  BankCheckoutDto,
  BankPaymentDto,
  CheckoutInfoDto,
  CompleteQrDto,
  CouponDto,
  CreateCouponDto,
  GrantAccessDto,
  GrantDto,
  EvidenceUploadDto,
  PlanDto,
  QrUploadDto,
  RejectPaymentDto,
  RevokeGrantDto,
  ReviewItemDto,
  SetPlansDto,
  SettingsDto,
  StartBankQrDto,
  SubmitEvidenceDto,
  SubscriptionDto,
  UpdateCouponDto,
  UpdateSettingsDto,
  UploadTicketDto,
} from './store.dto';
import { StoreService } from './store.service';
import type { PlanPeriod } from './store-rules';

const REVIEW_STATES = ['PENDING_REVIEW', 'SUCCEEDED', 'REJECTED'] as const;

/** Oxinov's store: plans, bank QR checkout, payment review, settings, and coupons (ADR-028). */
@ApiTags('Store')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  // Learners --------------------------------------------------------------------------------

  /** Plans on sale, bank payment details, the learner's access, and any open bank payment. */
  @Get('courses/:courseId/plans')
  async checkoutInfo(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Promise<{ data: CheckoutInfoDto }> {
    return { data: await this.store.checkoutInfo(scope, user, courseId) };
  }

  /** Starts a bank QR checkout for one plan; returns the reference and amount to pay. Grants nothing. */
  @Post('courses/:courseId/checkout/bank-qr')
  async startBankQr(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: StartBankQrDto,
  ): Promise<{ data: BankCheckoutDto }> {
    return { data: await this.store.startBankQr(scope, user, courseId, body.period, body.couponCode) };
  }

  // Free access (FR-MGMT-1404) ----------------------------------------------------------------

  @Get('store/grants')
  async grants(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: GrantDto[] }> {
    return { data: await this.store.listGrants(scope, user) };
  }

  @Post('store/grants')
  async grant(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: GrantAccessDto): Promise<{ data: GrantDto }> {
    return { data: await this.store.grantAccess(scope, user, body) };
  }

  @Post('store/grants/:grantId/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeGrant(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('grantId', ParseUUIDPipe) grantId: string,
    @Body() body: RevokeGrantDto,
  ): Promise<{ data: GrantDto }> {
    return { data: await this.store.revokeGrant(scope, user, grantId, body.reason) };
  }

  /** The caller's own subscriptions and free courses, active first (FR-AUTH-104). */
  @Get('me/subscriptions')
  async mySubscriptions(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: SubscriptionDto[] }> {
    return { data: await this.store.mySubscriptions(scope, user) };
  }

  /** The caller's own bank payments, newest first (FR-AUTH-104, FR-PAY-2705). */
  @Get('me/bank-payments')
  async myPayments(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: BankPaymentDto[] }> {
    return { data: await this.store.myPayments(scope, user) };
  }

  @Get('me/bank-payments/:paymentId')
  async myPayment(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('paymentId', ParseUUIDPipe) paymentId: string): Promise<{ data: BankCheckoutDto }> {
    return { data: await this.store.myPayment(scope, user, paymentId) };
  }

  /** Signed upload for the receipt screenshot or PDF. */
  @Post('me/bank-payments/:paymentId/evidence-upload')
  async evidenceUpload(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() body: EvidenceUploadDto,
  ): Promise<{ data: UploadTicketDto }> {
    return { data: await this.store.createEvidenceUpload(scope, user, paymentId, body.contentType, body.sizeBytes) };
  }

  /** Sends the payment for review with the bank transaction ID; resubmits a rejected payment. */
  @Post('me/bank-payments/:paymentId/submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() body: SubmitEvidenceDto,
  ): Promise<{ data: BankPaymentDto }> {
    return {
      data: await this.store.submitEvidence(scope, user, paymentId, body.bankTransactionId, {
        paidAmountMinor: body.paidAmount === undefined ? null : Math.round(body.paidAmount * 100),
        referenceIncluded: body.referenceIncluded ?? null,
      }),
    };
  }

  // Administrators ---------------------------------------------------------------------------

  @Get('store/payments')
  @ApiQuery({ name: 'status', required: false, enum: REVIEW_STATES })
  async reviewQueue(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Query('status') status?: string): Promise<{ data: ReviewItemDto[] }> {
    const wanted = (status ?? 'PENDING_REVIEW') as (typeof REVIEW_STATES)[number];
    if (!REVIEW_STATES.includes(wanted)) throw Errors.notFound('Payment status');
    return { data: await this.store.reviewQueue(scope, user, wanted) };
  }

  @Get('store/payments/:paymentId')
  async reviewDetail(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('paymentId', ParseUUIDPipe) paymentId: string): Promise<{ data: ReviewItemDto }> {
    return { data: await this.store.reviewDetail(scope, user, paymentId) };
  }

  @Post('store/payments/:paymentId/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('paymentId', ParseUUIDPipe) paymentId: string): Promise<{ data: ReviewItemDto }> {
    return { data: await this.store.approve(scope, user, paymentId) };
  }

  @Post('store/payments/:paymentId/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() body: RejectPaymentDto,
  ): Promise<{ data: ReviewItemDto }> {
    return { data: await this.store.reject(scope, user, paymentId, body.reason) };
  }

  @Get('courses/:courseId/plans/manage')
  async listPlans(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: { plans: PlanDto[]; defaults: Record<PlanPeriod, number> } }> {
    return { data: await this.store.listPlans(scope, user, courseId) };
  }

  @Put('courses/:courseId/plans')
  async setPlans(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: SetPlansDto,
  ): Promise<{ data: PlanDto[] }> {
    return { data: await this.store.setPlans(scope, user, courseId, body.plans) };
  }

  @Get('store/settings')
  async settings(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: SettingsDto }> {
    return { data: await this.store.getSettings(scope, user) };
  }

  @Patch('store/settings')
  async updateSettings(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: UpdateSettingsDto): Promise<{ data: SettingsDto }> {
    return { data: await this.store.updateSettings(scope, user, body) };
  }

  @Post('store/settings/qr-upload')
  async qrUpload(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: QrUploadDto): Promise<{ data: UploadTicketDto }> {
    return { data: await this.store.createQrUpload(scope, user, body.contentType, body.sizeBytes) };
  }

  @Post('store/settings/qr-complete')
  @HttpCode(HttpStatus.OK)
  async qrComplete(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: CompleteQrDto): Promise<{ data: SettingsDto }> {
    return { data: await this.store.completeQrUpload(scope, user, body.uploadId, body.contentType) };
  }

  @Get('store/coupons')
  async coupons(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: CouponDto[] }> {
    return { data: await this.store.listCoupons(scope, user) };
  }

  @Post('store/coupons')
  async createCoupon(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: CreateCouponDto): Promise<{ data: CouponDto }> {
    return { data: await this.store.createCoupon(scope, user, body) };
  }

  @Patch('store/coupons/:couponId')
  async updateCoupon(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('couponId', ParseUUIDPipe) couponId: string,
    @Body() body: UpdateCouponDto,
  ): Promise<{ data: CouponDto }> {
    return { data: await this.store.setCouponActive(scope, user, couponId, body.active) };
  }
}
