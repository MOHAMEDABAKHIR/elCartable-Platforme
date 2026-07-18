import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class EndVisitorSessionDto {
  @ApiPropertyOptional({ example: '/checkout/confirmation' })
  @IsOptional()
  @IsString()
  exitPage?: string;
}
