import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({ example: 'CP', description: 'Nom du niveau scolaire' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'Primaire', description: 'Cycle scolaire' })
  @IsOptional()
  @IsString()
  cycle?: string;

  @ApiPropertyOptional({ default: 0, description: "Ordre d'affichage" })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
