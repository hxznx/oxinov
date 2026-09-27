import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { TenantGuard } from '../tenancy/tenant.guard';
import {
  AcceptDto,
  AnnouncementDto,
  AnnouncementsDto,
  HideDto,
  PostBodyDto,
  QuestionDto,
  QuestionsDto,
} from './stream.dto';
import { StreamService } from './stream.service';

type Question = Promise<{ data: QuestionDto }>;

/** The class stream (FR-COMM-701/702): announcements and lesson Q&A for people with course access. */
@ApiTags('Stream')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId')
export class StreamController {
  constructor(private readonly stream: StreamService) {}

  @Get('courses/:courseId/announcements')
  @ApiOkResponse({ type: AnnouncementsDto })
  async announcements(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: AnnouncementsDto }> {
    return { data: await this.stream.announcements(scope, user, courseId) };
  }

  @Post('courses/:courseId/announcements')
  @ApiCreatedResponse({ type: AnnouncementDto })
  async announce(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: PostBodyDto,
  ): Promise<{ data: AnnouncementDto }> {
    return { data: await this.stream.announce(scope, user, courseId, body.body) };
  }

  @Patch('announcements/:announcementId')
  @ApiOkResponse({ type: AnnouncementDto })
  async editAnnouncement(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
    @Body() body: PostBodyDto,
  ): Promise<{ data: AnnouncementDto }> {
    return { data: await this.stream.editAnnouncement(scope, user, announcementId, body.body) };
  }

  @Delete('announcements/:announcementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async removeAnnouncement(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
  ): Promise<void> {
    await this.stream.removeAnnouncement(scope, user, announcementId);
  }

  @Get('courses/:courseId/questions')
  @ApiOkResponse({ type: QuestionsDto })
  async courseQuestions(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: QuestionsDto }> {
    return { data: await this.stream.courseQuestions(scope, user, courseId) };
  }

  @Get('courses/:courseId/lessons/:lessonId/questions')
  @ApiOkResponse({ type: QuestionsDto })
  async lessonQuestions(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ): Promise<{ data: QuestionsDto }> {
    return { data: await this.stream.lessonQuestions(scope, user, courseId, lessonId) };
  }

  @Post('courses/:courseId/lessons/:lessonId/questions')
  @ApiCreatedResponse({ type: QuestionDto })
  async ask(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: PostBodyDto,
  ): Question {
    return { data: await this.stream.ask(scope, user, courseId, lessonId, body.body) };
  }

  @Patch('questions/:questionId')
  @ApiOkResponse({ type: QuestionDto })
  async editQuestion(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: PostBodyDto,
  ): Question {
    return { data: await this.stream.editQuestion(scope, user, questionId, body.body) };
  }

  @Post('questions/:questionId/answers')
  @ApiCreatedResponse({ type: QuestionDto })
  async answer(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: PostBodyDto,
  ): Question {
    return { data: await this.stream.answer(scope, user, questionId, body.body) };
  }

  @Post('questions/:questionId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuestionDto })
  async accept(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: AcceptDto,
  ): Question {
    return { data: await this.stream.accept(scope, user, questionId, body.answerId) };
  }

  @Post('questions/:questionId/hide')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuestionDto })
  async hideQuestion(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: HideDto,
  ): Question {
    return { data: await this.stream.hideQuestion(scope, user, questionId, body.reason) };
  }

  @Post('questions/:questionId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuestionDto })
  async restoreQuestion(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ): Question {
    return { data: await this.stream.hideQuestion(scope, user, questionId, null) };
  }

  @Patch('answers/:answerId')
  @ApiOkResponse({ type: QuestionDto })
  async editAnswer(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @Body() body: PostBodyDto,
  ): Question {
    return { data: await this.stream.editAnswer(scope, user, answerId, body.body) };
  }

  @Put('answers/:answerId/vote')
  @ApiOkResponse({ type: QuestionDto })
  async vote(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('answerId', ParseUUIDPipe) answerId: string,
  ): Question {
    return { data: await this.stream.vote(scope, user, answerId, true) };
  }

  @Delete('answers/:answerId/vote')
  @ApiOkResponse({ type: QuestionDto })
  async unvote(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('answerId', ParseUUIDPipe) answerId: string,
  ): Question {
    return { data: await this.stream.vote(scope, user, answerId, false) };
  }

  @Post('answers/:answerId/hide')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuestionDto })
  async hideAnswer(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @Body() body: HideDto,
  ): Question {
    return { data: await this.stream.hideAnswer(scope, user, answerId, body.reason) };
  }

  @Post('answers/:answerId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuestionDto })
  async restoreAnswer(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('answerId', ParseUUIDPipe) answerId: string,
  ): Question {
    return { data: await this.stream.hideAnswer(scope, user, answerId, null) };
  }
}
