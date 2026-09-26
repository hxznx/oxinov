import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Length, Max, Min } from 'class-validator';
import { MAX_DURATION_SEC } from './media-rules';

export class CreateUploadDto {
  @ApiProperty({ enum: ['VIDEO', 'AUDIO'] }) @IsIn(['VIDEO', 'AUDIO']) kind: 'VIDEO' | 'AUDIO';
  @ApiProperty({ example: 'video/mp4' }) @IsString() @Length(3, 100) contentType: string;
  @ApiProperty({ description: 'Exact file size in bytes.' }) @IsInt() @Min(1) @Max(2 * 1024 * 1024 * 1024) sizeBytes: number;
  @ApiProperty({ example: 'lesson-1.mp4' }) @IsString() @Length(1, 255) fileName: string;
}

export class CompleteUploadDto {
  @ApiProperty({ description: 'Duration measured by the browser, in seconds.' })
  @IsInt()
  @Min(1)
  @Max(MAX_DURATION_SEC)
  durationSec: number;
}

export class SaveProgressDto {
  @ApiProperty({ description: 'Where playback is now, in seconds.' }) @IsInt() @Min(0) @Max(MAX_DURATION_SEC) positionSec: number;
  @ApiProperty({ description: 'Seconds actually played since the last save (capped by the server).' })
  @IsInt()
  @Min(0)
  @Max(3600)
  playedSec: number;
}

export class UploadTicketDto {
  @ApiProperty({ format: 'uuid' }) mediaId: string;
  @ApiProperty({ description: 'Signed URL; PUT the file bytes with the given headers before it expires.' }) uploadUrl: string;
  @ApiProperty({ example: { 'Content-Type': 'video/mp4' } }) headers: Record<string, string>;
  @ApiProperty() expiresAt: Date;
}

export class MediaDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: ['VIDEO', 'AUDIO'] }) kind: string;
  @ApiProperty({ enum: ['UPLOADING', 'READY', 'FAILED'] }) status: string;
  @ApiProperty() fileName: string;
  @ApiProperty() sizeBytes: number;
  @ApiProperty({ nullable: true, type: Number }) durationSec: number | null;
}

export class ProgressDto {
  @ApiProperty() positionSec: number;
  @ApiProperty() watchedSec: number;
  @ApiProperty() completed: boolean;
}
