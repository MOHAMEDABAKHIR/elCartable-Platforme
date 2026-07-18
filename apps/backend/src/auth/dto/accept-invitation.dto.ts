import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'commercial@elcartable.ma' })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({ description: "Code d'invitation envoyé par l'administrateur" })
  @IsString()
  invitationCode: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre.',
  })
  newPassword: string;
}
