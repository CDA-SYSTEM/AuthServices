import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token que se desea revocar' })
  @IsString()
  @IsJWT()
  refreshToken!: string;
}
