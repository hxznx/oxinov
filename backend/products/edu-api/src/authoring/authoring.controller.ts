import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import {
  AuthoredCourseDto,
  CreateLessonDto,
  DraftDto,
  RejectDto,
  ReorderDto,
  ResourceInputDto,
  ResourceRenameDto,
  ResourceUploadDto,
  ResourceUploadTicketDto,
  SectionInputDto,
  UpdateDraftDto,
  UpdateLessonDto,
  BulkLessonsDto,
  BulkLessonsResultDto,
  DuplicateCourseDto,
  DuplicatedCourseDto,
} from './authoring.dto';
import { AuthoringService } from './authoring.service';

type Draft = Promise<{ data: DraftDto }>;

/** Teacher tools (FR-COURSE-201/203): instructors and above; ownership is checked per course. */
@ApiTags('Authoring')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@RequireRole('INSTRUCTOR')
@Controller('v1/tenants/:tenantId')
export class AuthoringController {
  constructor(private readonly authoring: AuthoringService) {}

  @Get('authoring/courses')
  @ApiOkResponse({ type: [AuthoredCourseDto] })
  async courses(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: AuthoredCourseDto[] }> {
    return { data: await this.authoring.listCourses(scope, user) };
  }

  @Get('courses/:courseId/draft')
  @ApiOkResponse({ type: DraftDto })
  async draft(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Draft {
    return { data: await this.authoring.getDraft(scope, user, courseId) };
  }

  /** 201 when a new draft was copied from the published version; 200 when resuming the open draft. */
  @Post('courses/:courseId/draft')
  @ApiOkResponse({ type: DraftDto })
  async start(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Res({ passthrough: true }) response: Response,
  ): Draft {
    const { draft, created } = await this.authoring.startDraft(scope, user, courseId);
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return { data: draft };
  }

  @Patch('courses/:courseId/draft')
  @ApiOkResponse({ type: DraftDto })
  async update(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: UpdateDraftDto,
  ): Draft {
    return { data: await this.authoring.updateDraft(scope, user, courseId, body) };
  }

  @Post('courses/:courseId/draft/sections')
  @ApiOkResponse({ type: DraftDto })
  async addSection(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: SectionInputDto,
  ): Draft {
    return { data: await this.authoring.addSection(scope, user, courseId, body.title) };
  }

  @Patch('courses/:courseId/draft/sections/:sectionId')
  @ApiOkResponse({ type: DraftDto })
  async renameSection(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() body: SectionInputDto,
  ): Draft {
    return { data: await this.authoring.renameSection(scope, user, courseId, sectionId, body.title) };
  }

  @Delete('courses/:courseId/draft/sections/:sectionId')
  @ApiOkResponse({ type: DraftDto })
  async deleteSection(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ): Draft {
    return { data: await this.authoring.deleteSection(scope, user, courseId, sectionId) };
  }

  @Post('courses/:courseId/draft/sections/:sectionId/lessons')
  @ApiOkResponse({ type: DraftDto })
  async addLesson(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() body: CreateLessonDto,
  ): Draft {
    return { data: await this.authoring.addLesson(scope, user, courseId, sectionId, body) };
  }

  /** Many YouTube or Google Drive links at once become lessons in order (FR-COURSE-209). */
  @Post('courses/:courseId/draft/sections/:sectionId/lessons/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BulkLessonsResultDto })
  async addLessonsFromLinks(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() body: BulkLessonsDto,
  ): Promise<{ data: BulkLessonsResultDto }> {
    return { data: await this.authoring.addLessonsFromLinks(scope, user, courseId, sectionId, body) };
  }

  /** A copy of an offering to start a new one from, without its learners or sales (FR-COURSE-209). */
  @Post('courses/:courseId/duplicate')
  @ApiOkResponse({ type: DuplicatedCourseDto })
  async duplicate(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: DuplicateCourseDto,
  ): Promise<{ data: DuplicatedCourseDto }> {
    return { data: await this.authoring.duplicate(scope, user, courseId, body) };
  }

  @Patch('courses/:courseId/draft/lessons/:lessonId')
  @ApiOkResponse({ type: DraftDto })
  async updateLesson(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: UpdateLessonDto,
  ): Draft {
    return { data: await this.authoring.updateLesson(scope, user, courseId, lessonId, body) };
  }

  @Delete('courses/:courseId/draft/lessons/:lessonId')
  @ApiOkResponse({ type: DraftDto })
  async deleteLesson(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ): Draft {
    return { data: await this.authoring.deleteLesson(scope, user, courseId, lessonId) };
  }

  @Put('courses/:courseId/draft/order')
  @ApiOkResponse({ type: DraftDto })
  async reorder(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: ReorderDto,
  ): Draft {
    return { data: await this.authoring.reorder(scope, user, courseId, body) };
  }

  @Post('courses/:courseId/draft/resources/uploads')
  @ApiOkResponse({ type: ResourceUploadTicketDto })
  async startResourceUpload(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: ResourceUploadDto,
  ): Promise<{ data: ResourceUploadTicketDto }> {
    return { data: await this.authoring.startResourceUpload(scope, user, courseId, body) };
  }

  @Post('courses/:courseId/draft/resources/uploads/:fileId/complete')
  @HttpCode(HttpStatus.OK)
  async completeResourceUpload(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<{ data: { fileId: string; fileName: string } }> {
    return { data: await this.authoring.completeResourceUpload(scope, user, courseId, fileId) };
  }

  @Post('courses/:courseId/draft/lessons/:lessonId/resources')
  @ApiOkResponse({ type: DraftDto })
  async addResource(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: ResourceInputDto,
  ): Draft {
    return { data: await this.authoring.addResource(scope, user, courseId, lessonId, body) };
  }

  @Patch('courses/:courseId/draft/resources/:resourceId')
  @ApiOkResponse({ type: DraftDto })
  async renameResource(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Body() body: ResourceRenameDto,
  ): Draft {
    return { data: await this.authoring.renameResource(scope, user, courseId, resourceId, body.title) };
  }

  @Delete('courses/:courseId/draft/resources/:resourceId')
  @ApiOkResponse({ type: DraftDto })
  async removeResource(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ): Draft {
    return { data: await this.authoring.removeResource(scope, user, courseId, resourceId) };
  }

  @Post('courses/:courseId/draft/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DraftDto })
  async submit(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Draft {
    return { data: await this.authoring.submit(scope, user, courseId) };
  }

  @Post('courses/:courseId/draft/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DraftDto })
  async withdraw(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Draft {
    return { data: await this.authoring.withdraw(scope, user, courseId) };
  }

  @Post('courses/:courseId/draft/approve')
  @RequireRole('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DraftDto })
  async approve(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Draft {
    return { data: await this.authoring.approve(scope, user, courseId) };
  }

  @Post('courses/:courseId/draft/reject')
  @RequireRole('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DraftDto })
  async reject(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: RejectDto,
  ): Draft {
    return { data: await this.authoring.reject(scope, user, courseId, body.reason) };
  }
}
