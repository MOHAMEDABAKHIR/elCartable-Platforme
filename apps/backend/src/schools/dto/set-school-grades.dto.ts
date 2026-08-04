import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class SetSchoolGradesDto {
  @ApiProperty({
    example: [
      '5a2f2a18-3f30-4fb3-a37c-31c2d8f49f66',
      'ab02d4ce-4d12-43fd-80e2-bb56d784b872',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  gradeIds: string[];
}