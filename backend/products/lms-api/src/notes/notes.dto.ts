import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class NoteInputDto {
  @ApiProperty() @IsString() @Length(1, 5000) body: string;
  @ApiPropertyOptional({ nullable: true, description: 'Video or audio moment in seconds.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6 * 60 * 60)
  timestampSec?: number | null;
}

export class NoteUpdateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 5000) body?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsInt() @Min(0) @Max(6 * 60 * 60) timestampSec?: number | null;
}

export class NoteDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() body: string;
  @ApiProperty({ nullable: true, type: Number }) timestampSec: number | null;
  @ApiProperty() lessonTitle: string;
  @ApiProperty({ nullable: true, format: 'uuid', description: 'The lesson in the current published version, if it still exists.' }) lessonId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
