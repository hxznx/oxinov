import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class QuizSettingsDto {
  @ApiProperty({ example: 'Chapter 1 check' }) @IsString() @Length(3, 200) title: string;
  @ApiProperty({ enum: ['PRACTICE', 'MOCK'] }) @IsIn(['PRACTICE', 'MOCK']) kind: 'PRACTICE' | 'MOCK';
  @ApiProperty({ minimum: 1, maximum: 600 }) @IsInt() @Min(1) @Max(600) timeLimitMin: number;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsInt() @Min(0) @Max(100) passPercent: number;
  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 100, description: 'Omit or null for unlimited attempts.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxAttempts?: number | null;
  @ApiProperty({ enum: ['AFTER_SUBMIT', 'NEVER'] }) @IsIn(['AFTER_SUBMIT', 'NEVER']) answerRelease: 'AFTER_SUBMIT' | 'NEVER';
  @ApiProperty() @IsBoolean() shuffleQuestions: boolean;
}

export class QuizSectionInputDto {
  @ApiProperty({ example: 'Vocabulary' }) @IsString() @Length(1, 160) title: string;
  @ApiProperty({ description: 'Questions drawn at random from this section’s pool for each attempt.' }) @IsInt() @Min(1) @Max(200) questionCount: number;
}

export class QuestionInputDto {
  @ApiProperty({ enum: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK'] })
  @IsIn(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK'])
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';

  @ApiProperty() @IsString() @Length(1, 2000) prompt: string;
  @ApiPropertyOptional({ description: 'Optional reading passage shown above the question.' }) @IsOptional() @IsString() @Length(0, 5000) passage?: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) choices?: string[];
  @ApiPropertyOptional({ type: [Number], description: 'Indexes of the correct choices.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsInt({ each: true })
  correct?: number[];
  @ApiPropertyOptional({ description: 'True/false questions: whether the statement is true.' }) @IsOptional() @IsBoolean() answer?: boolean;
  @ApiPropertyOptional({ type: [String], description: 'Fill-in-the-blank: accepted answers.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  accepted?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 2000) explanation?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 10, default: 1 }) @IsOptional() @IsInt() @Min(1) @Max(10) marks?: number;
}

export class QuizQuestionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() type: string;
  @ApiProperty() prompt: string;
  @ApiProperty({ nullable: true, type: String }) passage: string | null;
  @ApiProperty() choices: { id: string; text: string }[];
  @ApiProperty({ type: [String] }) answerKey: string[];
  @ApiProperty({ nullable: true, type: String }) explanation: string | null;
  @ApiProperty() marks: number;
  @ApiProperty() version: number;
}

export class QuizSectionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() sectionKey: string;
  @ApiProperty() title: string;
  @ApiProperty() position: number;
  @ApiProperty() questionCount: number;
  @ApiProperty({ description: 'Active questions in this section’s pool.' }) available: number;
}

export class QuizDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty() title: string;
  @ApiProperty() kind: string;
  @ApiProperty({ enum: ['DRAFT', 'APPROVED', 'RETIRED'] }) status: string;
  @ApiProperty() timeLimitMin: number;
  @ApiProperty() passPercent: number;
  @ApiProperty({ nullable: true, type: Number }) maxAttempts: number | null;
  @ApiProperty() answerRelease: string;
  @ApiProperty() shuffleQuestions: boolean;
  @ApiProperty() attempts: number;
  @ApiProperty({ description: 'Structure and settings can change: a draft with no attempts yet.' }) editable: boolean;
  @ApiProperty({ type: [QuizSectionDto] }) sections: QuizSectionDto[];
  @ApiPropertyOptional({ type: Object, description: 'Section ID → its questions; only on the single-quiz view.' })
  questions?: Record<string, QuizQuestionDto[]>;
}
