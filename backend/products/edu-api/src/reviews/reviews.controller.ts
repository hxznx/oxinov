import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import { HideReviewDto, ModerationReviewDto, MyReviewDto, REVIEW_STATES, SaveReviewDto, isReviewState } from './reviews.dto';
import { ReviewsService } from './reviews.service';

/** Ratings and reviews (FR-CATALOG-304): learners write their own; administrators approve or hide. */
@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('courses/:courseId/review')
  @ApiOkResponse({ type: MyReviewDto })
  async mine(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Promise<{ data: MyReviewDto }> {
    return { data: await this.reviews.mine(scope, user, courseId) };
  }

  @Put('courses/:courseId/review')
  @ApiOkResponse({ type: MyReviewDto })
  async save(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: SaveReviewDto,
  ): Promise<{ data: MyReviewDto }> {
    return { data: await this.reviews.save(scope, user, courseId, body) };
  }

  @Delete('courses/:courseId/review')
  @HttpCode(HttpStatus.NO_CONTENT)
  async withdraw(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Promise<void> {
    await this.reviews.withdraw(scope, user, courseId);
  }

  @Get('store/reviews')
  @RequireRole('ADMIN')
  @ApiQuery({ name: 'status', required: false, enum: REVIEW_STATES })
  @ApiOkResponse({ type: [ModerationReviewDto] })
  async list(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Query('status') status?: string): Promise<{ data: ModerationReviewDto[] }> {
    const wanted = status ?? 'PENDING';
    if (!isReviewState(wanted)) throw Errors.notFound('Review status');
    return { data: await this.reviews.list(scope, user, wanted) };
  }

  @Post('store/reviews/:reviewId/approve')
  @RequireRole('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approve(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('reviewId', ParseUUIDPipe) reviewId: string): Promise<void> {
    await this.reviews.approve(scope, user, reviewId);
  }

  @Post('store/reviews/:reviewId/hide')
  @RequireRole('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hide(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() body: HideReviewDto,
  ): Promise<void> {
    await this.reviews.hide(scope, user, reviewId, body.reason);
  }
}
