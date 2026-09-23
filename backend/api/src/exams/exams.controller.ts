import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { SaveAnswersDto } from './exams.dto';
import { ExamsService, type AttemptView, type ExamSummary } from './exams.service';

@ApiTags('Exams')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  @Get('courses/:courseId/exams')
  async list(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: ExamSummary[] }> {
    return { data: await this.exams.listForCourse(scope, user, courseId) };
  }

  /** 201 for a new attempt; 200 when resuming the caller's unexpired attempt. */
  @Post('exams/:examId/attempts')
  async start(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('examId', ParseUUIDPipe) examId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: AttemptView }> {
    const { attempt, created } = await this.exams.start(scope, user, examId);
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return { data: attempt };
  }

  @Get('exam-attempts/:attemptId')
  async get(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ): Promise<{ data: AttemptView }> {
    return { data: await this.exams.get(scope, user, attemptId) };
  }

  @Put('exam-attempts/:attemptId/answers')
  async save(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() body: SaveAnswersDto,
  ): Promise<{ data: AttemptView }> {
    return { data: await this.exams.saveAnswers(scope, user, attemptId, body) };
  }

  @Post('exam-attempts/:attemptId/submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ): Promise<{ data: AttemptView }> {
    return { data: await this.exams.submit(scope, user, attemptId) };
  }
}
