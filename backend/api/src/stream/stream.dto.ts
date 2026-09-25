import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length, Matches, ValidateIf } from 'class-validator';

const NOT_BLANK = /\S/;

export class PostBodyDto {
  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @IsString()
  @Length(1, 5000)
  @Matches(NOT_BLANK, { message: 'body must not be blank' })
  body: string;
}

export class HideDto {
  @ApiProperty({ minLength: 3, maxLength: 500, description: 'Shown to the author and to staff.' })
  @IsString()
  @Length(3, 500)
  @Matches(NOT_BLANK, { message: 'reason must not be blank' })
  reason: string;
}

export class AcceptDto {
  @ApiProperty({ nullable: true, format: 'uuid', description: 'null clears the accepted answer.' })
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  answerId: string | null;
}

export class AuthorDto {
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Teaches this course or runs the school.' }) teacher: boolean;
}

export class HiddenDto {
  @ApiProperty() reason: string;
  @ApiProperty() at: Date;
}

export class AnnouncementDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() body: string;
  @ApiProperty({ type: AuthorDto }) author: AuthorDto;
  @ApiProperty() createdAt: Date;
  @ApiProperty() edited: boolean;
}

export class AnnouncementsDto {
  @ApiProperty() canPost: boolean;
  @ApiProperty({ type: [AnnouncementDto] }) announcements: AnnouncementDto[];
}

export class AnswerDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() body: string;
  @ApiProperty({ type: AuthorDto }) author: AuthorDto;
  @ApiProperty() mine: boolean;
  @ApiProperty() votes: number;
  @ApiProperty() voted: boolean;
  @ApiProperty() accepted: boolean;
  @ApiProperty({ type: HiddenDto, nullable: true }) hidden: HiddenDto | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() edited: boolean;
}

export class QuestionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({
    nullable: true,
    format: 'uuid',
    description: 'The lesson in the current published version, if it still exists.',
  })
  lessonId: string | null;
  @ApiProperty() lessonTitle: string;
  @ApiProperty() body: string;
  @ApiProperty({ type: AuthorDto }) author: AuthorDto;
  @ApiProperty() mine: boolean;
  @ApiProperty({ nullable: true, format: 'uuid' }) acceptedAnswerId: string | null;
  @ApiProperty({
    description: 'The caller may mark the best answer (question author or course staff).',
  })
  canAccept: boolean;
  @ApiProperty({ type: HiddenDto, nullable: true }) hidden: HiddenDto | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() edited: boolean;
  @ApiProperty({ type: [AnswerDto] }) answers: AnswerDto[];
}

export class QuestionsDto {
  @ApiProperty({ description: 'The caller teaches the course and may hide posts.' })
  canModerate: boolean;
  @ApiProperty({ type: [QuestionDto] }) questions: QuestionDto[];
}
