import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export const VISIBILITIES = ['FREE', 'SUBSCRIBERS'] as const;
export type Visibility = (typeof VISIBILITIES)[number];
export const LIVE_PROVIDERS = ['GOOGLE_MEET', 'ZOOM', 'MICROSOFT_TEAMS', 'OTHER'] as const;

/** A live class as a member sees it: the join link only when they may join (ADR-028 points 7 and 8). */
export class LiveSessionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty({ format: 'date-time' }) startsAt: Date;
  @ApiProperty() durationMin: number;
  @ApiProperty({ enum: VISIBILITIES }) visibility: Visibility;
  @ApiProperty({ enum: LIVE_PROVIDERS }) provider: (typeof LIVE_PROVIDERS)[number];
  @ApiProperty() cancelled: boolean;
  @ApiProperty({ nullable: true, type: String, description: 'Only for people allowed to join: authors, free classes, or subscribers.' }) joinUrl: string | null;
  @ApiProperty({ description: 'Subscribers-only class and the caller has no active access.' }) locked: boolean;
}

export class CreateLiveSessionDto {
  @ApiProperty() @IsString() @Length(1, 200) title: string;
  @ApiProperty({ format: 'date-time' }) @IsISO8601({ strict: true }) startsAt: string;
  @ApiProperty({ minimum: 5, maximum: 600 }) @IsInt() @Min(5) @Max(600) durationMin: number;
  @ApiProperty({ description: 'https link to Google Meet, Zoom, Microsoft Teams, or another meeting service.' }) @IsString() @Length(9, 500) joinUrl: string;
  @ApiPropertyOptional({ enum: VISIBILITIES, default: 'SUBSCRIBERS' }) @IsOptional() @IsIn(VISIBILITIES) visibility?: Visibility;
}

export class UpdateLiveSessionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiPropertyOptional({ format: 'date-time' }) @IsOptional() @IsISO8601({ strict: true }) startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(5) @Max(600) durationMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(9, 500) joinUrl?: string;
  @ApiPropertyOptional({ enum: VISIBILITIES }) @IsOptional() @IsIn(VISIBILITIES) visibility?: Visibility;
  @ApiPropertyOptional({ description: 'true cancels the class; learners still see it, marked cancelled.' }) @IsOptional() @IsBoolean() cancelled?: boolean;
}
