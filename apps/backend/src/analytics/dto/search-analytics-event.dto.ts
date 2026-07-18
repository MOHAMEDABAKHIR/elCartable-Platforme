import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { AnalyticsEventType } from '@prisma/client';

export class SearchAnalyticsEventDto {
  @ApiPropertyOptional({ enum: AnalyticsEventType })
  @IsOptional()
  @IsEnum(AnalyticsEventType)
  type?: AnalyticsEventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Événements créés à partir de cette date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: "Événements créés jusqu'à cette date (ISO 8601)" })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
