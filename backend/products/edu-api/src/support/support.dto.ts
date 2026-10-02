import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SendMessageDto {
  @ApiProperty({ maxLength: 4000 }) @Transform(trim) @IsString() @Length(1, 4000) body: string;
}

export class AskOxiDto {
  @ApiProperty({ maxLength: 500, example: 'I want to work in Japan. Where do I start?' }) @Transform(trim) @IsString() @Length(0, 500) question: string;
}

export class SupportMessageDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: ['LEARNER', 'STAFF'] }) sender: 'LEARNER' | 'STAFF';
  @ApiProperty() body: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ nullable: true, type: String, description: "The learner's name on their own messages; null for support, shown as Oxinov support." }) authorName: string | null;
}

export class LearnerSupportDto {
  @ApiProperty({ nullable: true, type: String }) threadId: string | null;
  @ApiProperty({ description: 'Support replied since the learner last looked.' }) unread: boolean;
  @ApiProperty({ type: [SupportMessageDto] }) messages: SupportMessageDto[];
}

export class SupportThreadSummaryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ nullable: true, type: String }) learnerName: string | null;
  @ApiProperty({ nullable: true, type: String }) learnerEmail: string | null;
  @ApiProperty() lastMessage: string;
  @ApiProperty({ enum: ['LEARNER', 'STAFF'] }) lastSender: 'LEARNER' | 'STAFF';
  @ApiProperty() lastMessageAt: Date;
  @ApiProperty() unread: boolean;
}

export class SupportThreadDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ nullable: true, type: String }) learnerName: string | null;
  @ApiProperty({ nullable: true, type: String }) learnerEmail: string | null;
  @ApiProperty({ type: [SupportMessageDto] }) messages: SupportMessageDto[];
}

export class OxiPickDto {
  @ApiProperty() slug: string;
  @ApiProperty() title: string;
  @ApiProperty() kind: string;
  @ApiProperty() category: string;
  @ApiProperty({ description: 'One line on why it fits.' }) why: string;
}

export class OxiAnswerDto {
  @ApiProperty() reply: string;
  @ApiProperty({ type: [OxiPickDto] }) picks: OxiPickDto[];
  @ApiProperty({ description: 'The learner asked for a person; offer to pass the question to support.' }) handoff: boolean;
}
