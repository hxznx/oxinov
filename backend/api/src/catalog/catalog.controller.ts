import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import {
  CourseDetailDto,
  CourseSummaryDto,
  CreateCourseDto,
  LessonDto,
  ListCoursesQuery,
} from './catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId/courses')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOkResponse({ type: [CourseSummaryDto] })
  list(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Query() query: ListCoursesQuery,
  ): Promise<{ data: CourseSummaryDto[]; nextCursor: string | null }> {
    return this.catalog.list(scope, user, query);
  }

  @Post()
  @RequireRole('INSTRUCTOR')
  @ApiCreatedResponse({ type: CourseSummaryDto })
  async create(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateCourseDto,
  ): Promise<{ data: CourseSummaryDto }> {
    return { data: await this.catalog.create(scope, user, body) };
  }

  @Get(':courseId')
  @ApiOkResponse({ type: CourseDetailDto })
  async get(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ data: CourseDetailDto }> {
    return { data: await this.catalog.get(scope, user, courseId) };
  }

  @Get(':courseId/lessons/:lessonId')
  @ApiOkResponse({ type: LessonDto })
  async lesson(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ): Promise<{ data: LessonDto }> {
    return { data: await this.catalog.getLesson(scope, user, courseId, lessonId) };
  }
}
