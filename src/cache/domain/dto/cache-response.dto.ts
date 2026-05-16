import { ApiProperty } from '@nestjs/swagger';

export class CacheSetResponseDto {
  @ApiProperty({ example: 'Cache guardado correctamente' })
  message!: string;

  @ApiProperty({ example: 'auth:users:inspectors' })
  key!: string;

  @ApiProperty({ example: 60 })
  ttlSeconds!: number;
}

export class CacheGetResponseDto {
  @ApiProperty({ example: 'auth:users:inspectors' })
  key!: string;

  @ApiProperty({ description: 'Valor recuperado desde Redis', example: [{ id: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a', label: 'Laura Gomez', role: 'INSPECTOR' }] })
  value!: unknown;
}

export class CacheDeleteResponseDto {
  @ApiProperty({ example: 'Cache invalidado correctamente' })
  message!: string;

  @ApiProperty({ example: 'auth:users:inspectors' })
  key!: string;
}
