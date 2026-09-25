import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import {
  AssignmentDto,
  AssignmentInputDto,
  DraftInputDto,
  FileUploadDto,
  GradeInputDto,
  MySubmissionDto,
  SubmissionDetailDto,
  SubmissionSummaryDto,
  UploadTicketDto,
} from './assignments.dto';
import { AssignmentsService } from './assignments.service';

type Id = string;

/** Teacher side of assignments (FR-ASSESS-503): course ownership is checked per request. */
@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@RequireRole('INSTRUCTOR')
@Controller('v1/tenants/:tenantId')
export class AssignmentsTeachingController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get('courses/:courseId/assignments/manage')
  @ApiOkResponse({ type: [AssignmentDto] })
  async list(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: Id): Promise<{ data: AssignmentDto[] }> {
    return { data: await this.assignments.manageList(scope, user, courseId) };
  }

  @Post('courses/:courseId/assignments')
  @ApiCreatedResponse({ type: AssignmentDto })
  async create(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: Id,
    @Body() body: AssignmentInputDto,
  ): Promise<{ data: AssignmentDto }> {
    return { data: await this.assignments.create(scope, user, courseId, body) };
  }

  @Patch('assignments/:assignmentId')
  @ApiOkResponse({ type: AssignmentDto })
  async update(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: Id,
    @Body() body: AssignmentInputDto,
  ): Promise<{ data: AssignmentDto }> {
    return { data: await this.assignments.update(scope, user, assignmentId, body) };
  }

  @Post('assignments/:assignmentId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AssignmentDto })
  async publish(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('assignmentId', ParseUUIDPipe) assignmentId: Id): Promise<{ data: AssignmentDto }> {
    return { data: await this.assignments.setStatus(scope, user, assignmentId, 'PUBLISHED') };
  }

  @Post('assignments/:assignmentId/close')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AssignmentDto })
  async close(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('assignmentId', ParseUUIDPipe) assignmentId: Id): Promise<{ data: AssignmentDto }> {
    return { data: await this.assignments.setStatus(scope, user, assignmentId, 'CLOSED') };
  }

  @Get('assignments/:assignmentId/submissions')
  @ApiOkResponse({ type: [SubmissionSummaryDto] })
  async submissions(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: Id,
  ): Promise<{ data: SubmissionSummaryDto[] }> {
    return { data: await this.assignments.submissions(scope, user, assignmentId) };
  }

  @Get('submissions/:submissionId')
  @ApiOkResponse({ type: SubmissionDetailDto })
  async submission(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('submissionId', ParseUUIDPipe) submissionId: Id,
  ): Promise<{ data: SubmissionDetailDto }> {
    return { data: await this.assignments.submission(scope, user, submissionId) };
  }

  @Post('submissions/:submissionId/grade')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SubmissionDetailDto })
  async grade(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('submissionId', ParseUUIDPipe) submissionId: Id,
    @Body() body: GradeInputDto,
  ): Promise<{ data: SubmissionDetailDto }> {
    return { data: await this.assignments.grade(scope, user, submissionId, body) };
  }
}

/** Learner side: any member with access to the course. */
@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class AssignmentsLearningController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get('courses/:courseId/assignments')
  @ApiOkResponse({ type: [AssignmentDto] })
  async list(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: Id): Promise<{ data: AssignmentDto[] }> {
    return { data: await this.assignments.learnerList(scope, user, courseId) };
  }

  @Get('assignments/:assignmentId/mine')
  @ApiOkResponse({ type: MySubmissionDto })
  async mine(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('assignmentId', ParseUUIDPipe) assignmentId: Id): Promise<{ data: MySubmissionDto }> {
    return { data: await this.assignments.mine(scope, user, assignmentId) };
  }

  @Put('assignments/:assignmentId/mine/draft')
  @ApiOkResponse({ type: MySubmissionDto })
  async draft(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: Id,
    @Body() body: DraftInputDto,
  ): Promise<{ data: MySubmissionDto }> {
    return { data: await this.assignments.saveDraft(scope, user, assignmentId, body) };
  }

  @Post('assignments/:assignmentId/mine/upload')
  @ApiCreatedResponse({ type: UploadTicketDto })
  async upload(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: Id,
    @Body() body: FileUploadDto,
  ): Promise<{ data: UploadTicketDto }> {
    return { data: await this.assignments.startUpload(scope, user, assignmentId, body) };
  }

  @Post('assignments/:assignmentId/mine/upload/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MySubmissionDto })
  async complete(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('assignmentId', ParseUUIDPipe) assignmentId: Id): Promise<{ data: MySubmissionDto }> {
    return { data: await this.assignments.finishUpload(scope, user, assignmentId) };
  }

  @Delete('assignments/:assignmentId/mine/file')
  @ApiOkResponse({ type: MySubmissionDto })
  async removeFile(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('assignmentId', ParseUUIDPipe) assignmentId: Id): Promise<{ data: MySubmissionDto }> {
    return { data: await this.assignments.removeDraftFile(scope, user, assignmentId) };
  }

  @Post('assignments/:assignmentId/mine/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MySubmissionDto })
  async submit(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('assignmentId', ParseUUIDPipe) assignmentId: Id): Promise<{ data: MySubmissionDto }> {
    return { data: await this.assignments.submit(scope, user, assignmentId) };
  }
}
