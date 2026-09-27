import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import { QuestionInputDto, QuizDto, QuizSectionInputDto, QuizSettingsDto } from './quizzes.dto';
import { QuizzesService } from './quizzes.service';

type Quiz = Promise<{ data: QuizDto }>;

/** Quiz builder for teachers (FR-ASSESS-501); ownership of the course is checked per request. */
@ApiTags('Quiz builder')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@RequireRole('INSTRUCTOR')
@Controller('v1/tenants/:tenantId')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get('courses/:courseId/quizzes')
  @ApiOkResponse({ type: [QuizDto] })
  async list(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('courseId', ParseUUIDPipe) courseId: string): Promise<{ data: QuizDto[] }> {
    return { data: await this.quizzes.list(scope, user, courseId) };
  }

  @Post('courses/:courseId/quizzes')
  @ApiCreatedResponse({ type: QuizDto })
  async create(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: QuizSettingsDto,
  ): Quiz {
    return { data: await this.quizzes.create(scope, user, courseId, body) };
  }

  @Get('quizzes/:quizId')
  @ApiOkResponse({ type: QuizDto })
  async get(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('quizId', ParseUUIDPipe) quizId: string): Quiz {
    return { data: await this.quizzes.get(scope, user, quizId) };
  }

  @Patch('quizzes/:quizId')
  @ApiOkResponse({ type: QuizDto })
  async update(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('quizId', ParseUUIDPipe) quizId: string, @Body() body: QuizSettingsDto): Quiz {
    return { data: await this.quizzes.update(scope, user, quizId, body) };
  }

  @Post('quizzes/:quizId/sections')
  @ApiOkResponse({ type: QuizDto })
  async addSection(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() body: QuizSectionInputDto,
  ): Quiz {
    return { data: await this.quizzes.addSection(scope, user, quizId, body) };
  }

  @Patch('quizzes/:quizId/sections/:sectionId')
  @ApiOkResponse({ type: QuizDto })
  async updateSection(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() body: QuizSectionInputDto,
  ): Quiz {
    return { data: await this.quizzes.updateSection(scope, user, quizId, sectionId, body) };
  }

  @Delete('quizzes/:quizId/sections/:sectionId')
  @ApiOkResponse({ type: QuizDto })
  async deleteSection(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ): Quiz {
    return { data: await this.quizzes.deleteSection(scope, user, quizId, sectionId) };
  }

  @Post('quizzes/:quizId/sections/:sectionId/questions')
  @ApiOkResponse({ type: QuizDto })
  async addQuestion(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() body: QuestionInputDto,
  ): Quiz {
    return { data: await this.quizzes.addQuestion(scope, user, quizId, sectionId, body) };
  }

  @Patch('quizzes/:quizId/questions/:questionId')
  @ApiOkResponse({ type: QuizDto })
  async updateQuestion(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: QuestionInputDto,
  ): Quiz {
    return { data: await this.quizzes.updateQuestion(scope, user, quizId, questionId, body) };
  }

  @Delete('quizzes/:quizId/questions/:questionId')
  @ApiOkResponse({ type: QuizDto })
  async removeQuestion(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ): Quiz {
    return { data: await this.quizzes.removeQuestion(scope, user, quizId, questionId) };
  }

  @Post('quizzes/:quizId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuizDto })
  async publish(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('quizId', ParseUUIDPipe) quizId: string): Quiz {
    return { data: await this.quizzes.publish(scope, user, quizId) };
  }

  @Post('quizzes/:quizId/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuizDto })
  async unpublish(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('quizId', ParseUUIDPipe) quizId: string): Quiz {
    return { data: await this.quizzes.unpublish(scope, user, quizId) };
  }

  @Post('quizzes/:quizId/close')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: QuizDto })
  async close(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('quizId', ParseUUIDPipe) quizId: string): Quiz {
    return { data: await this.quizzes.close(scope, user, quizId) };
  }

  @Post('quizzes/:quizId/duplicate')
  @ApiCreatedResponse({ type: QuizDto })
  async duplicate(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Param('quizId', ParseUUIDPipe) quizId: string): Quiz {
    return { data: await this.quizzes.duplicate(scope, user, quizId) };
  }
}
