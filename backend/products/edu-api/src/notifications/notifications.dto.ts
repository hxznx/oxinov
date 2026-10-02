import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export const NOTIFICATION_KINDS = ['PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'RENEWAL_DUE', 'ACCESS_ENDED', 'NOTICE'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export class NotificationDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: NOTIFICATION_KINDS }) kind: NotificationKind;
  @ApiProperty() title: string;
  @ApiProperty() body: string;
  @ApiProperty({ nullable: true, type: String, description: 'Path inside the Edu web app.' }) linkPath: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) readAt: Date | null;
}

export class NotificationListDto {
  @ApiProperty({ type: [NotificationDto], description: 'Newest first, at most 50.' }) items: NotificationDto[];
  @ApiProperty() unread: number;
}

/** A notice from the workspace to all of its members (design screen 8, "Send a notice"). In-app only. */
export class SendNoticeDto {
  @ApiProperty() @IsString() @Length(3, 200) title: string;
  @ApiProperty() @IsString() @Length(1, 2000) body: string;
  @ApiPropertyOptional({ description: 'Optional path inside the Edu web app, for example /o/japanese-n5.' })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  @Matches(/^\/[^/\\]/, { message: 'linkPath must be a path inside Oxinov Edu, starting with a single /' })
  linkPath?: string;
}

export class NoticeSentDto {
  @ApiProperty({ description: 'How many members received it.' }) recipients: number;
}
