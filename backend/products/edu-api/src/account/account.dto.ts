import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RequestDeletionDto {
  @ApiProperty({ example: 'DELETE', description: 'The person types DELETE to confirm.' }) @IsString() @MaxLength(20) confirm: string;
}

export class DeletionStatusDto {
  @ApiProperty({ enum: ['NONE', 'SCHEDULED', 'CANCELLED'] }) state: 'NONE' | 'SCHEDULED' | 'CANCELLED';
  @ApiProperty({ nullable: true, type: Date }) requestedAt: Date | null;
  @ApiProperty({ nullable: true, type: Date, description: 'When the account is deleted unless the request is cancelled first.' }) deleteAfter: Date | null;
}

/** A copy of the caller's Edu data (FR-PRIV-3201). Shapes follow the stored records. */
export class DataExportDto {
  @ApiProperty() exportedAt: Date;
  @ApiProperty() profile: { displayName: string | null; email: string | null; memberSince: Date };
  @ApiProperty() deletion: { state: string; deleteAfter: Date | null };
  @ApiProperty({ type: [Object] }) workspaces: {
    workspace: { name: string; slug: string; role: string; status: string; joinedAt: Date };
    access: unknown[];
    payments: unknown[];
    certificates: unknown[];
    notes: unknown[];
    reviews: unknown[];
    notifications: unknown[];
    examAttempts: unknown[];
  }[];
}
