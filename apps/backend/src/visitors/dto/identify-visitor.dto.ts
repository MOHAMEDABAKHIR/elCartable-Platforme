import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class IdentifyVisitorDto {
  @ApiProperty({ description: 'Identifiant anonyme généré et persisté côté front (cookie/localStorage)' })
  @IsString()
  @MinLength(8)
  anonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;
}
