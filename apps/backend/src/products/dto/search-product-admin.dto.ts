import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/** Identique à SearchProductDto mais dédié au back-office (inclut les inactifs). */
export class SearchProductAdminDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Recherche libre sur le nom du produit' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}
