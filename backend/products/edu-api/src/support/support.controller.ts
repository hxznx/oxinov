import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { oxiAnswer } from '../oxi/oxi-rules';
import { StorefrontService } from '../store/storefront.service';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import { AskOxiDto, LearnerSupportDto, OxiAnswerDto, SendMessageDto, SupportThreadDto, SupportThreadSummaryDto } from './support.dto';
import { SupportService } from './support.service';

/** Support messages (FR-CHAT-1301): learners write to support; administrators answer from the inbox. */
@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('me/support')
  @ApiOkResponse({ type: LearnerSupportDto })
  async mine(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: LearnerSupportDto }> {
    return { data: await this.support.mine(scope, user) };
  }

  @Get('me/support/unread')
  @ApiOkResponse({ type: Boolean })
  async unread(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: boolean }> {
    return { data: await this.support.learnerUnread(scope, user) };
  }

  @Post('me/support')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LearnerSupportDto })
  async send(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: SendMessageDto): Promise<{ data: LearnerSupportDto }> {
    return { data: await this.support.send(scope, user, body.body) };
  }

  @Get('support/threads')
  @RequireRole('ADMIN')
  @ApiOkResponse({ type: [SupportThreadSummaryDto] })
  async inbox(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: SupportThreadSummaryDto[] }> {
    return { data: await this.support.inbox(scope, user) };
  }

  @Get('support/threads/:threadId')
  @RequireRole('ADMIN')
  @ApiOkResponse({ type: SupportThreadDto })
  async thread(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('threadId', ParseUUIDPipe) threadId: string): Promise<{ data: SupportThreadDto }> {
    return { data: await this.support.thread(scope, user, threadId) };
  }

  @Post('support/threads/:threadId/messages')
  @RequireRole('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SupportThreadDto })
  async reply(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Body() body: SendMessageDto,
  ): Promise<{ data: SupportThreadDto }> {
    return { data: await this.support.reply(scope, user, threadId, body.body) };
  }
}

/**
 * OXI, the rule-based course advisor (FR-AI-1705): signed-in learners ask what to learn and get picks from
 * the store's published offerings only. Nothing is stored and no model is called.
 */
@ApiTags('Messages')
@ApiBearerAuth()
@Controller('v1/oxi')
export class OxiController {
  constructor(private readonly storefront: StorefrontService) {}

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OxiAnswerDto })
  async ask(@CurrentUser() _user: AuthUser, @Body() body: AskOxiDto): Promise<{ data: OxiAnswerDto }> {
    const store = await this.storefront.home();
    const plans = store.defaultPlans.map((plan) => ({ label: plan.label, priceMinor: plan.priceMinor }));
    return { data: oxiAnswer(body.question, store.offerings, plans) };
  }
}
