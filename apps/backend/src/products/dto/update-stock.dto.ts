import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ example: 100, description: 'Nouvelle quantité en stock (valeur absolue)' })
  @IsInt()
  @Min(0)
  stock: number;
}
