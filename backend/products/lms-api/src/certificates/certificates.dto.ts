import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RevokeCertificateDto {
  @ApiProperty({ description: 'Why the certificate is revoked; recorded and shown to administrators.' })
  @IsString()
  @Length(3, 500)
  reason: string;
}

export class CertificateDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty({ description: 'Public certificate ID used in /verify/{code}.' }) code: string;
  @ApiProperty() holderName: string;
  @ApiProperty() courseTitle: string;
  @ApiProperty({ nullable: true }) instructorName: string | null;
  @ApiProperty() schoolName: string;
  @ApiProperty() issuedAt: Date;
  @ApiProperty({ enum: ['VALID', 'REVOKED'] }) status: 'VALID' | 'REVOKED';
  @ApiProperty({ nullable: true }) revokedAt: Date | null;
  @ApiProperty({ nullable: true }) revokeReason: string | null;
}

/** Everything public verification shows (FR-CERT-602). */
export class VerificationDto {
  @ApiProperty() code: string;
  @ApiProperty() holderName: string;
  @ApiProperty() courseTitle: string;
  @ApiProperty() schoolName: string;
  @ApiProperty() issuedAt: Date;
  @ApiProperty({ enum: ['VALID', 'REVOKED'] }) status: 'VALID' | 'REVOKED';
}

export class ProgressLessonDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty({ enum: ['TEXT', 'VIDEO', 'AUDIO'] }) kind: string;
  @ApiProperty() required: boolean;
  @ApiProperty() completed: boolean;
}

export class ProgressItemDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty() passed: boolean;
}

export class CourseProgressDto {
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty({ description: 'The completion rule holds (FR-PLAYER-402).' }) complete: boolean;
  @ApiProperty() requiredLessons: number;
  @ApiProperty() completedRequiredLessons: number;
  @ApiProperty({ type: [ProgressLessonDto] }) lessons: ProgressLessonDto[];
  @ApiProperty({ type: [ProgressItemDto], description: 'Approved mock exams; each needs a pass.' }) exams: ProgressItemDto[];
  @ApiProperty({ type: [ProgressItemDto], description: 'Required assignments; each needs a PASSED grade.' }) assignments: ProgressItemDto[];
  @ApiProperty({ type: CertificateDto, nullable: true }) certificate: CertificateDto | null;
}
