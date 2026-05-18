import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 401, description: 'Codigo HTTP del error' })
  statusCode!: number;

  @ApiProperty({ example: 'Credenciales invalidas', description: 'Detalle del error' })
  message!: string;

  @ApiProperty({ example: 'Unauthorized', required: false, description: 'Tipo de error HTTP si aplica' })
  error?: string;
}
