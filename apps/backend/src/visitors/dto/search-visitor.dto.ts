import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class SearchVisitorDto {
  @ApiPropertyOptional({ description: 'Recherche par anonId (préfixe ou exact)' })
  @IsOptional()
  @IsString()
  anonId?: string;

  @ApiPropertyOptional({ description: 'Vus pour la première fois à partir de cette date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: "Vus pour la première fois jusqu'à cette date (ISO 8601)" })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
