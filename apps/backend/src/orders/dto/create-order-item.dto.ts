import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator';

export class CreateOrderItemDto {
  @ApiPropertyOptional({ description: 'ID produit catalogué — si fourni, le prix et le libellé sont pris depuis le catalogue (le client ne peut pas falsifier le prix).' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ example: 'Cahier 96 pages grands carreaux', description: 'Libellé — requis pour un article libre (sans productId), ignoré et écrasé sinon' })
  @IsString()
  @MinLength(1)
  label: string;

  @ApiProperty({ example: 2, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Prix unitaire — requis uniquement pour un article libre (sans productId)' })
  @ValidateIf((dto) => !dto.productId)
  @IsNumber({}, { message: 'unitPrice est requis pour un article sans productId.' })
  @Min(0)
  unitPrice?: number;
}
