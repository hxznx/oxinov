import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { TenantRole } from '../generated/prisma/enums';

/** Roles an invite may grant; ownership is transferred separately, never by code. */
export const INVITABLE_ROLES = ['LEARNER', 'INSTRUCTOR', 'ADMIN'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export class CreateInviteDto {
  @ApiProperty({ enum: INVITABLE_ROLES, example: 'LEARNER' })
  @IsIn(INVITABLE_ROLES)
  role: InvitableRole;

  @ApiPropertyOptional({ minimum: 1, maximum: 90, default: 14, description: 'Days until the code stops working.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  expiresInDays?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 1000, description: 'Maximum number of people who can join; omit for no limit.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxUses?: number;
}

export class RedeemInviteDto {
  @ApiProperty({ example: 'K7PX-9QMD', description: 'Join code; case, spaces, and hyphens are ignored.' })
  @IsString()
  @Length(4, 32)
  code: string;
}

export class InviteDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'K7PX9QMD' }) code: string;
  @ApiProperty({ enum: TenantRole, enumName: 'TenantRole' }) role: TenantRole;
  @ApiProperty() expiresAt: Date;
  @ApiProperty({ nullable: true, type: Number }) maxUses: number | null;
  @ApiProperty() useCount: number;
  @ApiProperty({ enum: ['ACTIVE', 'EXPIRED', 'USED_UP', 'REVOKED'] }) status: 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'REVOKED';
  @ApiProperty() createdAt: Date;
}

export class MemberDto {
  @ApiProperty({ format: 'uuid' }) userId: string;
  @ApiProperty({ nullable: true, type: String }) displayName: string | null;
  @ApiProperty({ nullable: true, type: String }) email: string | null;
  @ApiProperty({ enum: TenantRole, enumName: 'TenantRole' }) role: TenantRole;
  @ApiProperty() status: string;
  @ApiProperty() joinedAt: Date;
}

const MEMBER_ROLES = ['LEARNER', 'INSTRUCTOR', 'ADMIN', 'OWNER'] as const;
const MEMBER_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

/** Change one member's role or access (design screen 22). Send at least one field. */
export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: MEMBER_ROLES }) @IsOptional() @IsIn(MEMBER_ROLES) role?: (typeof MEMBER_ROLES)[number];
  @ApiPropertyOptional({ enum: MEMBER_STATUSES }) @IsOptional() @IsIn(MEMBER_STATUSES) status?: (typeof MEMBER_STATUSES)[number];
}

/** One line of the workspace audit log (design screen 22). */
export class AuditEventDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() action: string;
  @ApiProperty() targetType: string;
  @ApiProperty({ nullable: true, type: String }) targetId: string | null;
  @ApiProperty({ nullable: true, type: String }) reason: string | null;
  @ApiProperty({ type: Object }) metadata: unknown;
  @ApiProperty({ nullable: true, type: String, description: 'Name or email of the person who did it; null for automatic actions.' }) actor: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
}
