import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser, TenantScope } from '../common/request';
import { RequireRole, TenantGuard } from '../tenancy/tenant.guard';
import { CompleteUploadDto, CreateUploadDto, LibraryItemDto, MediaDto, ProgressDto, SaveProgressDto, UploadTicketDto } from './media.dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('v1/tenants/:tenantId/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** The media library (FR-COURSE-210): every video, file, and upload in use, with where it is used. */
  @Get('library')
  @RequireRole('INSTRUCTOR')
  @ApiOkResponse({ type: [LibraryItemDto] })
  async library(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser): Promise<{ data: LibraryItemDto[] }> {
    return { data: await this.media.library(scope, user) };
  }

  /** Teachers get a signed URL to upload a lesson video or audio file directly to storage. */
  @Post('uploads')
  @RequireRole('INSTRUCTOR')
  @ApiCreatedResponse({ type: UploadTicketDto })
  async createUpload(@CurrentTenant() scope: TenantScope, @CurrentUser() user: AuthUser, @Body() body: CreateUploadDto): Promise<{ data: UploadTicketDto }> {
    return { data: await this.media.createUpload(scope, user, body) };
  }

  @Post(':mediaId/complete')
  @RequireRole('INSTRUCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MediaDto })
  async complete(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Body() body: CompleteUploadDto,
  ): Promise<{ data: MediaDto }> {
    return { data: await this.media.completeUpload(scope, user, mediaId, body) };
  }

  /** Any member saves their own playback position (FR-PLAYER-402). */
  @Put(':mediaId/progress')
  @ApiOkResponse({ type: ProgressDto })
  async progress(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() user: AuthUser,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Body() body: SaveProgressDto,
  ): Promise<{ data: ProgressDto }> {
    return { data: await this.media.saveProgress(scope, user, mediaId, body) };
  }
}
