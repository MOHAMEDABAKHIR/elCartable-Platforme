import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { CreateSchoolListItemDto } from './create-school-list-item.dto';

export class CreateOfficialSchoolListDto {
  @ApiProperty()
  @IsString()
  schoolId: string;

  @ApiProperty()
  @IsString()
  gradeId: string;

  @ApiProperty({ type: [CreateSchoolListItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'La liste doit contenir au moins un article.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSchoolListItemDto)
  items: CreateSchoolListItemDto[];
}
