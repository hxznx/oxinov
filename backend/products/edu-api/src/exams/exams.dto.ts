import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDefined, IsObject, IsUUID, ValidateNested } from 'class-validator';

export class AnswerInput {
  @ApiProperty({ format: 'uuid', description: 'Attempt item ID from the attempt view.' })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description: '{ "choiceIds": ["a"] } for choice questions, { "text": "..." } for fill-in-the-blank.',
    example: { choiceIds: ['a'] },
  })
  @IsDefined()
  @IsObject()
  response: Record<string, unknown>;
}

export class SaveAnswersDto {
  @ApiProperty({ type: [AnswerInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AnswerInput)
  answers: AnswerInput[];
}
