import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class InviteCommercialDto {
  @ApiProperty({ example: 'nouveau.commercial@elcartable.ma' })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({ example: 'Yassine El Amrani' })
  @IsString()
  fullName: string;

  @ApiProperty({ required: false, example: '+212600000000' })
  @IsOptional()
  @IsString()
  phone?: string;
}
