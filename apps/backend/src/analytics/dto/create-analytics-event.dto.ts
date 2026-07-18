import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { AnalyticsEventType } from '@prisma/client';

export class CreateAnalyticsEventDto {
  @ApiProperty({ description: 'Session visiteur en cours (créée via POST /visitors/sessions)' })
  @IsString()
  sessionId: string;

  @ApiProperty({ enum: AnalyticsEventType })
  @IsEnum(AnalyticsEventType)
  type: AnalyticsEventType;

  @ApiPropertyOptional({ example: '/ecole/nom-ecole' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description:
      'Payload libre selon le type: % de scroll, élément cliqué, école recherchée, produit consulté, etc.',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
