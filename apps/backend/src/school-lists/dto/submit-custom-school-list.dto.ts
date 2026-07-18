import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { SchoolListSource } from '@prisma/client';

const CUSTOM_SOURCES = [
  SchoolListSource.CUSTOM_PHOTO,
  SchoolListSource.CUSTOM_FILE,
  SchoolListSource.CUSTOM_MANUAL,
] as const;

export class SubmitCustomSchoolListDto {
  @ApiProperty({
    enum: CUSTOM_SOURCES,
    description: "Scénario 2 : l'école n'existe pas dans le catalogue",
  })
  @IsEnum(CUSTOM_SOURCES, {
    message: `source doit être l'une des valeurs suivantes: ${CUSTOM_SOURCES.join(', ')}`,
  })
  source: (typeof CUSTOM_SOURCES)[number];

  @ApiPropertyOptional({ description: 'URL retournée par /uploads — requis si source = photo ou fichier' })
  @ValidateIf((dto) => dto.source !== SchoolListSource.CUSTOM_MANUAL)
  @IsString({ message: 'fileUrl est requis pour une liste envoyée en photo ou en fichier.' })
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Texte libre de la liste — requis si source = saisie manuelle' })
  @ValidateIf((dto) => dto.source === SchoolListSource.CUSTOM_MANUAL)
  @IsString({ message: 'rawText est requis pour une liste saisie manuellement.' })
  rawText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeId?: string;
}
