import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Length, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const REVIEW_STATES = ['PENDING', 'APPROVED', 'HIDDEN'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export class SaveReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) rating: number;
  @ApiProperty({ required: false, maxLength: 2000 }) @Transform(trim) @IsString() @MaxLength(2000) body: string = '';
}

export class HideReviewDto {
  @ApiProperty({ description: 'Seen only by administrators.' }) @Transform(trim) @IsString() @Length(3, 500) reason: string;
}

/** The caller's own review of an offering, and whether they may write one. */
export class MyReviewDto {
  @ApiProperty({ description: 'True when the caller has had access to the offering.' }) canReview: boolean;
  @ApiProperty({ nullable: true, minimum: 1, maximum: 5, type: Number }) rating: number | null;
  @ApiProperty() body: string;
  @ApiProperty({ nullable: true, enum: REVIEW_STATES, type: String }) status: ReviewState | null;
  @ApiProperty({ nullable: true, type: Date }) updatedAt: Date | null;
}

/** One review in the administrator's moderation list. */
export class ModerationReviewDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty() courseTitle: string;
  @ApiProperty({ nullable: true, type: String }) learnerName: string | null;
  @ApiProperty({ nullable: true, type: String }) learnerEmail: string | null;
  @ApiProperty() rating: number;
  @ApiProperty() body: string;
  @ApiProperty({ enum: REVIEW_STATES }) status: ReviewState;
  @ApiProperty({ nullable: true, type: String }) moderationReason: string | null;
  @ApiProperty() updatedAt: Date;
}

/** A review as visitors see it: first name and last initial only. */
export class PublicReviewDto {
  @ApiProperty() author: string;
  @ApiProperty() rating: number;
  @ApiProperty() body: string;
  @ApiProperty() createdAt: Date;
}

export class RatingSummaryDto {
  @ApiProperty({ nullable: true, type: Number }) average: number | null;
  @ApiProperty() count: number;
  @ApiProperty({ type: [Number], description: 'Approved reviews with 5, 4, 3, 2, and 1 stars.' }) stars: number[];
}

export const isReviewState = (value: string | undefined): value is ReviewState => REVIEW_STATES.includes(value as ReviewState);
