import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchSchoolDto {
  @ApiPropertyOptional({ description: 'Recherche libre sur le nom ou la ville', example: 'Al Massar' })
  @IsOptional()
  @IsString()
  search?: string;
}
