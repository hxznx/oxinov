import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { OFFERING_CATEGORIES, OFFERING_KINDS, type OfferingCategory, type OfferingKind } from '../store/store-rules';

export class ListCoursesQuery {
  @ApiPropertyOptional({ description: 'Case-insensitive title search.' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cursor from the previous page.' })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}

export class CreateCourseDto {
  @ApiProperty({ example: 'jlpt-n5-kanji' })
  @Matches(/^[a-z0-9]([a-z0-9-]{0,118}[a-z0-9])?$/, {
    message: 'slug must be lowercase letters, digits, or hyphens',
  })
  slug: string;

  @ApiProperty({ example: 'N5 Kanji in 30 Days' })
  @IsString()
  @Length(3, 200)
  title: string;

  @ApiProperty()
  @IsString()
  @Length(10, 500)
  summary: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 20000)
  description?: string;

  @ApiProperty({ example: 'en', description: 'Teaching language (BCP 47).' })
  @Matches(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, { message: 'language must be a BCP 47 tag' })
  language: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiProperty({ example: 0, description: 'Price in minor units; 0 is free.' })
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  priceMinor: number;

  @ApiProperty({ example: 'JPY' })
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be an ISO 4217 code' })
  currency: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 300, { each: true })
  outcomes?: string[];
}

export class PriceDto {
  @ApiProperty() amountMinor: number;
  @ApiProperty() currency: string;
}

export class CourseSummaryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() slug: string;
  @ApiProperty() status: string;
  @ApiProperty() title: string;
  @ApiProperty() summary: string;
  @ApiProperty({ type: PriceDto, description: 'One-time price, or the cheapest access plan when hasPlans is true.' }) price: PriceDto;
  @ApiProperty({ description: 'Sold through access plans (ADR-028); show the price as "from".' }) hasPlans: boolean;
  @ApiProperty({ enum: OFFERING_KINDS }) kind: OfferingKind;
  @ApiProperty({ enum: OFFERING_CATEGORIES }) category: OfferingCategory;
  @ApiProperty({ nullable: true, type: String }) programId: string | null;
}

export class LessonOutlineDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty() kind: string;
  @ApiProperty() isPreview: boolean;
  @ApiProperty() isRequired: boolean;
  @ApiProperty({ nullable: true, type: Number }) durationSec: number | null;
}

export class SectionOutlineDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty({ type: [LessonOutlineDto] }) lessons: LessonOutlineDto[];
}

export class CourseAccessDto {
  @ApiProperty() entitled: boolean;
  @ApiProperty() canAuthor: boolean;
}

export class CourseDetailDto extends CourseSummaryDto {
  @ApiProperty() description: string;
  @ApiProperty() language: string;
  @ApiProperty({ type: [String] }) outcomes: string[];
  @ApiProperty() version: number;
  @ApiProperty({ type: [SectionOutlineDto] }) curriculum: SectionOutlineDto[];
  @ApiProperty({ type: CourseAccessDto }) access: CourseAccessDto;
}

export class LessonMediaDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: ['VIDEO', 'AUDIO'] }) kind: string;
  @ApiProperty() contentType: string;
  @ApiProperty({ description: 'Short-lived signed playback URL, issued after the access check (FR-PLAYER-401).' }) url: string;
  @ApiProperty({ nullable: true, type: Number }) durationSec: number | null;
  @ApiProperty({ description: 'Where this learner stopped, in seconds (FR-PLAYER-402).' }) resumeSec: number;
  @ApiProperty() completed: boolean;
}

export class LessonResourceDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: ['FILE', 'LINK'] }) kind: string;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true, type: String }) url: string | null;
  @ApiProperty({ nullable: true, description: 'Short-lived links; viewUrl opens PDFs in the browser.' })
  file: { name: string; sizeBytes: number; contentType: string; downloadUrl: string; viewUrl: string | null } | null;
}

export class LessonExternalDto {
  @ApiProperty({ enum: ['YOUTUBE', 'GOOGLE_DRIVE'] }) source: 'YOUTUBE' | 'GOOGLE_DRIVE';
  @ApiProperty({ description: 'View-only player address: YouTube privacy-enhanced embed or Drive preview.' }) embedUrl: string;
}

export class LessonDto extends LessonOutlineDto {
  @ApiProperty() bodyMarkdown: string;
  @ApiProperty({ type: LessonMediaDto, nullable: true }) media: LessonMediaDto | null;
  @ApiProperty({ type: LessonExternalDto, nullable: true, description: 'YouTube or Google Drive source, returned only after the access check (ADR-028 point 5).' })
  external: LessonExternalDto | null;
  @ApiProperty({ description: 'Text drawn over external players to discourage sharing: the viewer email.' }) watermark: string;
  @ApiProperty({ type: [LessonResourceDto], description: 'Only for learners with course access and teachers; never on free previews (FR-COURSE-204).' })
  resources: LessonResourceDto[];
}
