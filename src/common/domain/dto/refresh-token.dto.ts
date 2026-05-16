import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token emitido en el login' })
  @IsString()
  @IsJWT()
  refreshToken!: string;
}
