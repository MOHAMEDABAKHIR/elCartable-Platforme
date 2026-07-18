import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateSchoolListItemDto {
  @ApiPropertyOptional({ description: 'ID produit du catalogue si disponible' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ example: 'Cahier 96 pages grands carreaux' })
  @IsString()
  @MinLength(1)
  label: string;

  @ApiProperty({ example: 2, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
