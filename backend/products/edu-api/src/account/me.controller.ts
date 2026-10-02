import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Errors } from '../common/errors';
import type { AuthUser } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';

export class MeDto {
  @ApiProperty({ nullable: true, type: String }) displayName: string | null;
  @ApiProperty({ nullable: true, type: String }) email: string | null;
  @ApiProperty({ format: 'date-time' }) memberSince: Date;
  @ApiProperty({ description: 'Unread notifications across every workspace the person belongs to (FR-COMM-704).' }) unreadNotifications: number;
}

/** The signed-in person's own Edu profile, for the account centre (FR-AUTH-104). */
@ApiTags('Account')
@ApiBearerAuth()
@Controller('v1/me')
export class MeController {
  constructor(private readonly db: DatabaseContext) {}

  @Get()
  @ApiOkResponse({ type: MeDto })
  async me(@CurrentUser() user: AuthUser): Promise<{ data: MeDto }> {
    // Row-level security shows a person only their own profile here (no workspace is active).
    const profile = await this.db.run({ userId: user.userId }, (tx) =>
      tx.userProfile.findUnique({ where: { id: user.userId }, select: { displayName: true, email: true, createdAt: true } }),
    );
    if (!profile) throw Errors.notFound('Profile');
    // Notifications are tenant-scoped under row-level security, so count them one workspace at a time.
    const memberships = await this.db.run({ userId: user.userId }, (tx) =>
      tx.tenantMembership.findMany({ where: { userId: user.userId, status: 'ACTIVE' }, select: { tenantId: true }, take: 50 }),
    );
    let unreadNotifications = 0;
    for (const { tenantId } of memberships) {
      unreadNotifications += await this.db.run({ tenantId, userId: user.userId }, (tx) => tx.notification.count({ where: { tenantId, userId: user.userId, readAt: null } }));
    }
    return { data: { displayName: profile.displayName, email: profile.email, memberSince: profile.createdAt, unreadNotifications } };
  }
}
