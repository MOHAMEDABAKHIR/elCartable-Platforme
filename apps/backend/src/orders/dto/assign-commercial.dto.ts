import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignCommercialDto {
  @ApiProperty()
  @IsString()
  commercialId: string;
}
