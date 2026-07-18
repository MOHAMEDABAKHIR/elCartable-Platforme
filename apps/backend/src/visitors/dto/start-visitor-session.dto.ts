import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class StartVisitorSessionDto {
  @ApiProperty({ description: 'Identifiant anonyme du visiteur (créé si inconnu)' })
  @IsString()
  @MinLength(8)
  anonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: '/' })
  @IsOptional()
  @IsString()
  entryPage?: string;
}
