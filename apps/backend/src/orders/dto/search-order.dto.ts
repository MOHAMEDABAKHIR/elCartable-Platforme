import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class SearchOrderDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Filtrer sur les commandes assignées à ce commercial' })
  @IsOptional()
  @IsString()
  commercialId?: string;

  @ApiPropertyOptional({ description: 'Commandes créées à partir de cette date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: "Commandes créées jusqu'à cette date (ISO 8601)" })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Recherche libre sur nom / téléphone / numéro de commande' })
  @IsOptional()
  @IsString()
  search?: string;
}
