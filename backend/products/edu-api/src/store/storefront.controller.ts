import { Body, Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@oxinov/server-kit';
import type { Response } from 'express';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { WorkspaceDto } from '../tenants/tenants.dto';
import { ListingDto, SetListingDto, StoreHomeDto, StoreOfferingDetailDto } from './storefront.dto';
import { StorefrontService } from './storefront.service';

/** Oxinov's public store (ADR-028): browsing needs no sign-in. */
@ApiTags('Store')
@Public()
@Controller('v1/store')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get()
  @ApiOkResponse({ type: StoreHomeDto })
  async home(): Promise<{ data: StoreHomeDto }> {
    return { data: await this.storefront.home() };
  }

  @Get('offerings/:slug')
  @ApiOkResponse({ type: StoreOfferingDetailDto })
  async offering(@Param('slug') slug: string): Promise<{ data: StoreOfferingDetailDto }> {
    return { data: await this.storefront.offering(slug) };
  }
}

/** Joining the store needs a signed-in person but no membership yet, so it sits outside the tenant routes. */
@ApiTags('Store')
@ApiBearerAuth()
@Controller('v1/store')
export class StoreJoinController {
  constructor(private readonly storefront: StorefrontService) {}

  /** 201 when the caller became a learner of the store; 200 when they already were one. */
  @Post('join')
  @ApiOkResponse({ type: WorkspaceDto })
  async join(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response): Promise<{ data: WorkspaceDto }> {
    const { workspace, joined } = await this.storefront.join(user);
    response.status(joined ? HttpStatus.CREATED : HttpStatus.OK);
    return { data: workspace };
  }
}

/** Kind and store category of one offering, set in Oxinov Studio. */
@ApiTags('Store')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId/courses/:courseId/listing')
export class ListingController {
  constructor(private readonly storefront: StorefrontService) {}

  @Put()
  @ApiOkResponse({ type: ListingDto })
  async set(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: SetListingDto,
  ): Promise<{ data: ListingDto }> {
    return { data: await this.storefront.setListing(scope, user, courseId, body) };
  }
}
