import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cahiers & Papeterie' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'cahiers-papeterie', description: 'Identifiant URL unique' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ description: 'ID de la catégorie parente, pour une hiérarchie' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
