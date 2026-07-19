import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SearchUserDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filtrer par rôle' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Recherche libre sur le nom ou l’email' })
  @IsOptional()
  @IsString()
  search?: string;
}
