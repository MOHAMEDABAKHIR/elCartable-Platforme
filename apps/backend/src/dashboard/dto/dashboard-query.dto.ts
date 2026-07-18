import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Début de la période (ISO 8601) — défaut : depuis toujours' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Fin de la période (ISO 8601) — défaut : maintenant' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
