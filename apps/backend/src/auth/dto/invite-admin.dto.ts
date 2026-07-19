import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class InviteAdminDto {
  @ApiProperty({ example: 'nouvel.admin@elcartable.ma' })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({ example: 'Sara Bennani' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '+212600000000' })
  @IsOptional()
  @IsString()
  phone?: string;
}
