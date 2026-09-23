import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { EnrollmentsService, type EnrollmentView } from './enrollments.service';

@ApiTags('Learning')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  /** 201 when a new enrollment is created; 200 when the caller was already enrolled. */
  @Post('courses/:courseId/enrollments')
  async enroll(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: EnrollmentView }> {
    const { enrollment, created } = await this.enrollments.enroll(scope, user, courseId);
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return { data: enrollment };
  }

  @Get('me/enrollments')
  async mine(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
  ): Promise<{ data: EnrollmentView[] }> {
    return { data: await this.enrollments.listMine(scope, user) };
  }
}
