import { Body, Controller, Get, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { CreateTenantDto, WorkspaceDto } from './tenants.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('v1/tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @ApiOkResponse({ type: [WorkspaceDto] })
  async list(@CurrentUser() user: AuthUser): Promise<{ data: WorkspaceDto[] }> {
    return { data: await this.tenants.listForUser(user) };
  }

  /** 201 when created; 200 when the caller already owns a workspace at this address. */
  @Post()
  @ApiOkResponse({ type: WorkspaceDto })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateTenantDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: WorkspaceDto }> {
    const { workspace, created } = await this.tenants.create(user, body);
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return { data: workspace };
  }

  @Get(':tenantId')
  @UseGuards(TenantGuard)
  @ApiOkResponse({ type: WorkspaceDto })
  async get(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
  ): Promise<{ data: WorkspaceDto }> {
    return { data: await this.tenants.get(scope, user) };
  }
}
