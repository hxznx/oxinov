import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../common/request';
import { DataExportDto, DeletionStatusDto, RequestDeletionDto } from './account.dto';
import { AccountService } from './account.service';

/** The signed-in person's own data: a copy (FR-PRIV-3201) and deletion with a 14-day wait (FR-PRIV-3202). */
@ApiTags('Account')
@ApiBearerAuth()
@Controller('v1/me')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('export')
  @ApiOkResponse({ type: DataExportDto })
  async exportData(@CurrentUser() user: AuthUser): Promise<{ data: DataExportDto }> {
    return { data: await this.account.exportData(user) };
  }

  @Get('deletion')
  @ApiOkResponse({ type: DeletionStatusDto })
  async deletion(@CurrentUser() user: AuthUser): Promise<{ data: DeletionStatusDto }> {
    return { data: await this.account.deletionStatus(user) };
  }

  /** Schedules deletion in 14 days; the person can cancel until then. */
  @Post('deletion')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DeletionStatusDto })
  async requestDeletion(@CurrentUser() user: AuthUser, @Body() body: RequestDeletionDto): Promise<{ data: DeletionStatusDto }> {
    return { data: await this.account.requestDeletion(user, body.confirm) };
  }

  @Delete('deletion')
  @ApiOkResponse({ type: DeletionStatusDto })
  async cancelDeletion(@CurrentUser() user: AuthUser): Promise<{ data: DeletionStatusDto }> {
    return { data: await this.account.cancelDeletion(user) };
  }
}
