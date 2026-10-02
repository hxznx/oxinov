import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { NotificationListDto, NoticeSentDto, SendNoticeDto, EmailAllowanceDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

/** In-app notifications (FR-COMM-704): the caller's own, and notices from administrators. */
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('me/notifications')
  @ApiOkResponse({ type: NotificationListDto })
  async list(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: NotificationListDto }> {
    return { data: await this.notifications.list(scope, user) };
  }

  @Post('me/notifications/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async readAll(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<void> {
    await this.notifications.markAllRead(scope, user);
  }

  @Post('me/notifications/:notificationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async read(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('notificationId', ParseUUIDPipe) notificationId: string): Promise<void> {
    await this.notifications.markRead(scope, user, notificationId);
  }

  /** Today's email allowance for notices (FR-COMM-705), shown before sending. */
  @Get('notices/email-allowance')
  @ApiOkResponse({ type: EmailAllowanceDto })
  async allowance(@CurrentTenant() scope: TenantScope): Promise<{ data: EmailAllowanceDto }> {
    return { data: await this.notifications.emailAllowance(scope) };
  }

  /** Administrators send a notice to the workspace's members, in-app and optionally by email. */
  @Post('notices')
  @ApiOkResponse({ type: NoticeSentDto })
  async send(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: SendNoticeDto): Promise<{ data: NoticeSentDto }> {
    return { data: await this.notifications.sendNotice(scope, user, body) };
  }
}
