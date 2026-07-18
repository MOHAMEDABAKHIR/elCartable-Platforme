import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CustomerRole, Gender } from '@prisma/client';

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(9)
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  customerGender?: Gender;

  @ApiPropertyOptional({ enum: CustomerRole })
  @IsOptional()
  @IsEnum(CustomerRole)
  customerRole?: CustomerRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
