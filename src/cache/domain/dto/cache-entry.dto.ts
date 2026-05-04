import { Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CacheEntryDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsDefined()
  value!: unknown;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  ttlSeconds?: number;
}