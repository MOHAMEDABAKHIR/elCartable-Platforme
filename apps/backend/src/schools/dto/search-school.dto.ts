import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchSchoolDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Recherche libre sur le nom ou la ville', example: 'Al Massar' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filtrer les écoles par ville",
    example: "Casablanca",
  })
  @IsOptional()
  @IsString()
  city?: string;
}
