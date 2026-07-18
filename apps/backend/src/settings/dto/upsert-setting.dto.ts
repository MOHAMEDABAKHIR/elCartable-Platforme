import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty({
    description: 'Valeur du paramètre (JSON libre : chaîne, nombre, booléen ou objet)',
    example: '+212600000000',
  })
  @IsDefined()
  value!: unknown;
}
