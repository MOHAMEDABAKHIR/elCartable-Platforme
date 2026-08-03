import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/** Identique à SearchSchoolDto mais dédié au back-office (inclut les inactives). */
export class SearchSchoolAdminDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Recherche libre sur le nom ou la ville', example: 'Al Massar' })
  @IsOptional()
  @IsString()
  search?: string;
}
