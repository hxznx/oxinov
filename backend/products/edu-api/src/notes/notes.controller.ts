import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import { NoteDto, NoteInputDto, NoteUpdateDto } from './notes.dto';
import { NotesService } from './notes.service';

/** Private lesson notes (FR-PLAYER-403); every member manages only their own. */
@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get('courses/:courseId/lessons/:lessonId/notes')
  @ApiOkResponse({ type: [NoteDto] })
  async forLesson(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ): Promise<{ data: NoteDto[] }> {
    return { data: await this.notes.forLesson(scope, user, courseId, lessonId) };
  }

  @Post('courses/:courseId/lessons/:lessonId/notes')
  @ApiCreatedResponse({ type: NoteDto })
  async create(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: NoteInputDto,
  ): Promise<{ data: NoteDto }> {
    return { data: await this.notes.create(scope, user, courseId, lessonId, body) };
  }

  @Get('courses/:courseId/notes')
  @ApiOkResponse({ type: [NoteDto] })
  async forCourse(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Promise<{ data: NoteDto[] }> {
    return { data: await this.notes.forCourse(scope, user, courseId) };
  }

  @Patch('notes/:noteId')
  @ApiOkResponse({ type: NoteDto })
  async update(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() body: NoteUpdateDto,
  ): Promise<{ data: NoteDto }> {
    return { data: await this.notes.update(scope, user, noteId, body) };
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('noteId', ParseUUIDPipe) noteId: string): Promise<void> {
    await this.notes.remove(scope, user, noteId);
  }
}
