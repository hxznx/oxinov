import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '@oxinov/server-kit';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { CertificateDto, CourseProgressDto, RevokeCertificateDto, VerificationDto } from './certificates.dto';
import { CertificatesService } from './certificates.service';

@ApiTags('Certificates')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  /** Progress against the completion rule; issues the certificate the first time the rule holds. */
  @Get('courses/:courseId/progress')
  async progress(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: CourseProgressDto }> {
    return { data: await this.certificates.progress(scope, user, courseId) };
  }

  /** The learner confirms a text lesson as done. */
  @Post('courses/:courseId/lessons/:lessonId/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ): Promise<{ data: CourseProgressDto }> {
    return { data: await this.certificates.completeLesson(scope, user, courseId, lessonId) };
  }

  @Get('me/certificates')
  async mine(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: CertificateDto[] }> {
    return { data: await this.certificates.mine(scope, user) };
  }

  @Get('certificates/:code')
  async one(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
  ): Promise<{ data: CertificateDto }> {
    return { data: await this.certificates.byCode(scope, user, code) };
  }

  /** Administrators: a course's certificates. */
  @Get('courses/:courseId/certificates')
  async forCourse(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: CertificateDto[] }> {
    return { data: await this.certificates.forCourse(scope, user, courseId) };
  }

  @Post('certificates/:code/revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Body() body: RevokeCertificateDto,
  ): Promise<{ data: CertificateDto }> {
    return { data: await this.certificates.revoke(scope, user, code, body.reason) };
  }
}

/** Public certificate verification (FR-CERT-602): no sign-in; shows only what a verifier needs. */
@ApiTags('Certificates')
@Public()
@Controller('v1/certificates')
export class CertificateVerificationController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get(':code')
  async verify(@Param('code') code: string): Promise<{ data: VerificationDto }> {
    return { data: await this.certificates.verify(code) };
  }
}
