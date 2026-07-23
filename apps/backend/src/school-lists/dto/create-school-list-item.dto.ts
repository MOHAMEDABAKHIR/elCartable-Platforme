import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/**
 * Article d'une liste officielle. Contrainte métier : une liste officielle est
 * *importée depuis le catalogue* — chaque article DOIT référencer un produit
 * catalogué existant (`productId`). Le libellé est dérivé côté serveur du nom
 * du produit, on ne l'accepte donc pas en entrée.
 */
export class CreateSchoolListItemDto {
  @ApiProperty({ description: 'ID du produit catalogué (obligatoire).' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
