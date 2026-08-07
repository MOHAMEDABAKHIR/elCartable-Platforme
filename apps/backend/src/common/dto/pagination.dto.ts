import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Base réutilisable pour toute route paginée. `page` démarre à 1.
 * `limit` est volontairement plafonné (voir MAX_PAGE_LIMIT) pour qu'un
 * client ne puisse jamais forcer un `findMany` sur la table entière.
 */
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Numéro de page (défaut 1)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Nombre d'éléments par page", default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
