import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty({ example: 'Groupe Scolaire Al Massar' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Casablanca' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '12 Rue des Écoles, Casablanca' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
