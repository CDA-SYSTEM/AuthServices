import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CacheEntryDto {
  @ApiProperty({ example: 'auth:users:inspectors', description: 'Clave unica del cache' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    description: 'Valor serializable a JSON. Puede ser una lista u objeto compartido entre microservicios.',
    example: [
      { id: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a', label: 'Laura Gomez', role: 'INSPECTOR' },
      { id: '5c2e71f0-3a2d-4a0b-9b0d-1b0f1c8d3f71', label: 'Carlos Ruiz', role: 'INSPECTOR' },
    ],
  })
  @IsDefined()
  value!: unknown;

  @ApiPropertyOptional({ example: 60, default: 60, description: 'Tiempo de vida en segundos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  ttlSeconds?: number;
}