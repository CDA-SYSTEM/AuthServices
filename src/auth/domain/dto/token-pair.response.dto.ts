import { ApiProperty } from '@nestjs/swagger';

export class TokenPairResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Token de acceso para peticiones protegidas' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Token de refresco para renovar sesion' })
  refreshToken!: string;
}
