import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * Le suivi public exige le numéro de commande ET le téléphone client — un
 * UUID seul ne suffit pas, pour éviter qu'un tiers devine l'URL et consulte
 * les coordonnées d'un autre client.
 */
export class TrackOrderDto {
  @ApiProperty({ example: 'ELC-2026-000123' })
  @IsString()
  orderNumber: string;

  @ApiProperty({ example: '0612345678' })
  @IsString()
  @MinLength(9)
  customerPhone: string;
}
