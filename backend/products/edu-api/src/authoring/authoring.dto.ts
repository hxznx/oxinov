import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Lesson kinds authors can create (FR-COURSE-202/205). Video and audio lessons attach an uploaded media file
 * or, for video, an unlisted YouTube or Google Drive link; document lessons show a Google Drive file (ADR-028).
 */
export const AUTHORABLE_LESSON_KINDS = ['TEXT', 'VIDEO', 'AUDIO', 'DOCUMENT'] as const;

export class UpdateDraftDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(10, 500) summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 20000) description?: string;

  @ApiPropertyOptional({ example: 'en', description: 'Teaching language (BCP 47).' })
  @IsOptional()
  @Matches(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, { message: 'language must be a BCP 47 tag' })
  language?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 300, { each: true })
  outcomes?: string[];

  @ApiPropertyOptional({ description: 'Price in minor units; 0 is free.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  priceMinor?: number;

  @ApiPropertyOptional({ example: 'NPR' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be an ISO 4217 code' })
  currency?: string;
}

export class SectionInputDto {
  @ApiProperty({ example: 'Chapter 1: Hiragana' }) @IsString() @Length(1, 200) title: string;
}

export class CreateLessonDto {
  @ApiProperty() @IsString() @Length(1, 200) title: string;

  @ApiPropertyOptional({ enum: AUTHORABLE_LESSON_KINDS, default: 'TEXT' })
  @IsOptional()
  @IsIn(AUTHORABLE_LESSON_KINDS)
  kind?: (typeof AUTHORABLE_LESSON_KINDS)[number];

  @ApiPropertyOptional({ description: 'Markdown. Raw HTML is shown as text to learners.' })
  @IsOptional()
  @IsString()
  @Length(0, 100_000)
  bodyMarkdown?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'A READY media file of the same kind, for video and audio lessons.' })
  @IsOptional()
  @IsUUID()
  mediaId?: string;

  @ApiPropertyOptional({ description: 'An unlisted YouTube video (video lessons) or a Google Drive file (video or document lessons), instead of an uploaded file.' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  externalUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Estimated reading or viewing time in seconds.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(86_400)
  durationSec?: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 100_000) bodyMarkdown?: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, description: 'Attach (or with null, detach) the lesson media.' })
  @IsOptional()
  @IsUUID()
  mediaId?: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Set (or with null, remove) the YouTube or Google Drive link; replaces any uploaded file.' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  externalUrl?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(86_400) durationSec?: number | null;
}

export class SectionOrderDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id: string;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(500) @IsUUID('all', { each: true }) lessonIds: string[];
}

/** The complete new order: every section and lesson of the draft exactly once; lessons may change section. */
export class ReorderDto {
  @ApiProperty({ type: [SectionOrderDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SectionOrderDto)
  sections: SectionOrderDto[];
}

export class RejectDto {
  @ApiProperty({ description: 'What the author should change.' }) @IsString() @Length(3, 2000) reason: string;
}

export class DraftLessonDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty() kind: string;
  @ApiProperty() position: number;
  @ApiProperty() bodyMarkdown: string;
  @ApiProperty() isPreview: boolean;
  @ApiProperty() isRequired: boolean;
  @ApiProperty({ nullable: true, type: Number }) durationSec: number | null;
  @ApiProperty({ nullable: true, description: 'Attached video or audio file.' })
  media: { id: string; status: string; fileName: string; durationSec: number | null } | null;
  @ApiProperty({ nullable: true, description: 'YouTube or Google Drive source, with a link authors can open.' })
  external: { source: 'YOUTUBE' | 'GOOGLE_DRIVE'; id: string; url: string } | null;
  @ApiProperty({ description: 'Files and links attached to the lesson.' })
  resources: { id: string; kind: string; title: string; url: string | null; file: { name: string; sizeBytes: number; contentType: string } | null }[];
}

export class DraftSectionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty() position: number;
  @ApiProperty({ type: [DraftLessonDto] }) lessons: DraftLessonDto[];
}

export class DraftDto {
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty({ format: 'uuid' }) versionId: string;
  @ApiProperty() version: number;
  @ApiProperty({ enum: ['DRAFT', 'IN_REVIEW'] }) status: string;
  @ApiProperty() courseStatus: string;
  @ApiProperty() title: string;
  @ApiProperty() summary: string;
  @ApiProperty() description: string;
  @ApiProperty() language: string;
  @ApiProperty({ type: [String] }) outcomes: string[];
  @ApiProperty() priceMinor: number;
  @ApiProperty() currency: string;
  @ApiProperty({ nullable: true, type: String }) reviewFeedback: string | null;
  @ApiProperty({ nullable: true, type: Date }) submittedAt: Date | null;
  @ApiProperty({ description: 'Learners currently see an earlier published version.' }) hasPublishedVersion: boolean;
  @ApiProperty({ description: 'The caller may approve or reject this draft.' }) canReview: boolean;
  @ApiProperty({ type: [DraftSectionDto] }) sections: DraftSectionDto[];
}

export class AuthoredCourseDto {
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty() title: string;
  @ApiProperty() courseStatus: string;
  @ApiProperty({ nullable: true, enum: ['DRAFT', 'IN_REVIEW'] }) draftStatus: string | null;
  @ApiProperty() mine: boolean;
  @ApiProperty() updatedAt: Date;
}

export class ResourceUploadDto {
  @ApiProperty() @IsString() @Length(1, 255) fileName: string;
  @ApiProperty() @IsString() @Length(3, 120) contentType: string;
  @ApiProperty() @IsInt() @Min(1) @Max(100 * 1024 * 1024) sizeBytes: number;
}

export class ResourceInputDto {
  @ApiProperty() @IsString() @Length(1, 200) title: string;
  @ApiPropertyOptional({ format: 'uuid', description: 'A checked uploaded file.' }) @IsOptional() @IsUUID() fileId?: string;
  @ApiPropertyOptional({ description: 'Or a web link (http or https).' }) @IsOptional() @IsString() @Length(8, 2000) url?: string;
}

export class ResourceRenameDto {
  @ApiProperty() @IsString() @Length(1, 200) title: string;
}

export class ResourceUploadTicketDto {
  @ApiProperty({ format: 'uuid' }) fileId: string;
  @ApiProperty() uploadUrl: string;
  @ApiProperty() headers: Record<string, string>;
}

export class DraftResourceDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: ['FILE', 'LINK'] }) kind: string;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true, type: String }) url: string | null;
  @ApiProperty({ nullable: true }) file: { name: string; sizeBytes: number; contentType: string } | null;
}
