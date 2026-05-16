import { ApiProperty } from '@nestjs/swagger';

export class ValidateTokenResponseDto {
  @ApiProperty({ example: true, description: 'Indica si el token es valido' })
  valid!: true;

  @ApiProperty({ example: ['admin'], description: 'Roles resueltos desde el token' })
  roles!: string[];

  @ApiProperty({ example: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a', description: 'Identificador del usuario' })
  userId!: string;
}
