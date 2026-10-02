import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { CreateLiveSessionDto, LiveSessionDto, UpdateLiveSessionDto } from './live-sessions.dto';
import { LiveSessionsService } from './live-sessions.service';

/** Live classes of an offering (ADR-028 point 8). */
@ApiTags('Live classes')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class LiveSessionsController {
  constructor(private readonly live: LiveSessionsService) {}

  @Get('courses/:courseId/live-sessions')
  @ApiOkResponse({ type: [LiveSessionDto] })
  async list(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Promise<{ data: LiveSessionDto[] }> {
    return { data: await this.live.list(scope, user, courseId) };
  }

  @Post('courses/:courseId/live-sessions')
  @ApiOkResponse({ type: LiveSessionDto })
  async create(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: CreateLiveSessionDto,
  ): Promise<{ data: LiveSessionDto }> {
    return { data: await this.live.create(scope, user, courseId, body) };
  }

  @Patch('live-sessions/:sessionId')
  @ApiOkResponse({ type: LiveSessionDto })
  async update(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: UpdateLiveSessionDto,
  ): Promise<{ data: LiveSessionDto }> {
    return { data: await this.live.update(scope, user, sessionId, body) };
  }
}
