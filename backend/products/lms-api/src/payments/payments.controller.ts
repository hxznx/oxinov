import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { CheckoutDto, CheckoutOptionsDto, PaymentDto, StartCheckoutDto } from './payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Whether the course can be bought, with which providers, and whether the caller already has it. */
  @Get('courses/:courseId/checkout')
  async options(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: CheckoutOptionsDto }> {
    return { data: await this.payments.options(scope, user, courseId) };
  }

  /** Starts a checkout and returns where to send the learner. Nothing is granted until verification. */
  @Post('courses/:courseId/checkout')
  async start(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: StartCheckoutDto,
  ): Promise<{ data: CheckoutDto }> {
    return { data: await this.payments.start(scope, user, courseId, body.provider) };
  }

  /** Asks the provider about the payment and grants access if it is complete for the right amount. */
  @Post('payments/:paymentId/verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<{ data: PaymentDto }> {
    return { data: await this.payments.verify(scope, user, paymentId) };
  }

  @Get('me/payments')
  @ApiQuery({ name: 'courseId', required: false })
  async mine(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Query('courseId', new ParseUUIDPipe({ optional: true })) courseId?: string,
  ): Promise<{ data: PaymentDto[] }> {
    return { data: await this.payments.listMine(scope, user, courseId) };
  }
}
