import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import { AuditEventDto, CreateInviteDto, InviteDto, MemberDto, RedeemInviteDto, UpdateMemberDto } from './invites.dto';
import { InvitesService } from './invites.service';
import { WorkspaceDto } from './tenants.dto';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class TenantInvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post('invites')
  @RequireRole('ADMIN')
  @ApiCreatedResponse({ type: InviteDto })
  async create(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateInviteDto,
  ): Promise<{ data: InviteDto }> {
    return { data: await this.invites.create(scope, user, body) };
  }

  @Get('invites')
  @RequireRole('ADMIN')
  @ApiOkResponse({ type: [InviteDto] })
  async list(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: InviteDto[] }> {
    return { data: await this.invites.list(scope, user) };
  }

  @Delete('invites/:inviteId')
  @RequireRole('ADMIN')
  @ApiOkResponse({ type: InviteDto })
  async revoke(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
  ): Promise<{ data: InviteDto }> {
    return { data: await this.invites.revoke(scope, user, inviteId) };
  }

  @Get('members')
  @RequireRole('ADMIN')
  @ApiOkResponse({ type: [MemberDto] })
  async members(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: MemberDto[] }> {
    return { data: await this.invites.members(scope, user) };
  }

  /** Change a member's role or suspend and restore access (owners for administrators and owners). */
  @Patch('members/:userId')
  @RequireRole('ADMIN')
  @ApiOkResponse({ type: MemberDto })
  async updateMember(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateMemberDto,
  ): Promise<{ data: MemberDto }> {
    return { data: await this.invites.updateMember(scope, user, userId, body) };
  }

  @Get('audit-events')
  @RequireRole('ADMIN')
  @ApiOkResponse({ type: [AuditEventDto] })
  async auditLog(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: AuditEventDto[] }> {
    return { data: await this.invites.auditLog(scope, user) };
  }
}

/** Redeeming needs no membership yet, so it lives outside the tenant-scoped routes. */
@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('v1/invites')
export class InviteRedemptionController {
  constructor(private readonly invites: InvitesService) {}

  /** 201 when the caller joined; 200 when they were already a member. */
  @Post('redeem')
  @ApiOkResponse({ type: WorkspaceDto })
  async redeem(
    @CurrentUser() user: AuthUser,
    @Body() body: RedeemInviteDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: WorkspaceDto }> {
    const { workspace, joined } = await this.invites.redeem(user, body.code);
    response.status(joined ? HttpStatus.CREATED : HttpStatus.OK);
    return { data: workspace };
  }
}
