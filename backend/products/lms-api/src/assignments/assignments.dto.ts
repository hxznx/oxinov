import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class AssignmentInputDto {
  @ApiProperty() @IsString() @Length(3, 200) title: string;
  @ApiPropertyOptional({ description: 'Markdown shown to learners.' }) @IsOptional() @IsString() @Length(0, 20000) instructions?: string;
  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601 due date and time; omit or null for no deadline.' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowLate?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() acceptFile?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() acceptUrl?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() acceptText?: boolean;
  @ApiPropertyOptional({ minimum: 1, maximum: 100 }) @IsOptional() @IsInt() @Min(1) @Max(100) maxFileMb?: number;
  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 1000 }) @IsOptional() @IsInt() @Min(1) @Max(1000) maxPoints?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRequired?: boolean;
}

export class DraftInputDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 50000) text?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @Length(0, 2000) url?: string | null;
}

export class FileUploadDto {
  @ApiProperty() @IsString() @Length(1, 255) fileName: string;
  @ApiProperty() @IsString() @Length(3, 120) contentType: string;
  @ApiProperty() @IsInt() @Min(1) @Max(100 * 1024 * 1024) sizeBytes: number;
}

export class GradeInputDto {
  @ApiProperty({ enum: ['PASSED', 'FAILED', 'REVISION_REQUESTED'] })
  @IsIn(['PASSED', 'FAILED', 'REVISION_REQUESTED'])
  outcome: 'PASSED' | 'FAILED' | 'REVISION_REQUESTED';
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 10000) feedback?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsInt() @Min(0) @Max(1000) score?: number | null;
}

export class RevisionDto {
  @ApiProperty() revision: number;
  @ApiProperty() text: string;
  @ApiProperty({ nullable: true, type: String }) url: string | null;
  @ApiProperty({ nullable: true, description: 'File with a short-lived download link.' }) file: { name: string; sizeBytes: number; downloadUrl: string | null } | null;
  @ApiProperty() submittedAt: Date;
  @ApiProperty() late: boolean;
  @ApiProperty({ nullable: true, type: String }) outcome: string | null;
  @ApiProperty({ nullable: true, type: String }) feedback: string | null;
  @ApiProperty({ nullable: true, type: Number }) score: number | null;
  @ApiProperty({ nullable: true, type: Date }) gradedAt: Date | null;
}

export class AssignmentDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty() title: string;
  @ApiProperty() instructions: string;
  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED', 'CLOSED'] }) status: string;
  @ApiProperty({ nullable: true, type: Date }) dueAt: Date | null;
  @ApiProperty() allowLate: boolean;
  @ApiProperty() acceptFile: boolean;
  @ApiProperty() acceptUrl: boolean;
  @ApiProperty() acceptText: boolean;
  @ApiProperty() maxFileMb: number;
  @ApiProperty({ nullable: true, type: Number }) maxPoints: number | null;
  @ApiProperty() isRequired: boolean;
  @ApiPropertyOptional({ description: 'Teacher lists: submissions received and waiting for grading.' }) counts?: { submitted: number; toGrade: number };
  @ApiPropertyOptional({ description: 'Learner lists: the learner’s own status.' }) myStatus?: string | null;
}

export class MySubmissionDto {
  @ApiProperty({ type: AssignmentDto }) assignment: AssignmentDto;
  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED', 'REVISION_REQUESTED', 'PASSED', 'FAILED'] }) status: string;
  @ApiProperty() canEdit: boolean;
  @ApiProperty() draft: { text: string; url: string | null; file: { name: string; sizeBytes: number } | null };
  @ApiProperty({ type: [RevisionDto] }) revisions: RevisionDto[];
}

export class UploadTicketDto {
  @ApiProperty() uploadUrl: string;
  @ApiProperty() headers: Record<string, string>;
}

export class SubmissionSummaryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() learner: { name: string | null; email: string | null };
  @ApiProperty() status: string;
  @ApiProperty() revisions: number;
  @ApiProperty({ nullable: true, type: Date }) lastSubmittedAt: Date | null;
  @ApiProperty() late: boolean;
}

export class SubmissionDetailDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ type: AssignmentDto }) assignment: AssignmentDto;
  @ApiProperty() learner: { name: string | null; email: string | null };
  @ApiProperty() status: string;
  @ApiProperty({ type: [RevisionDto] }) revisions: RevisionDto[];
}
