import { IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  anonId: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  entryPage?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}