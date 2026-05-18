import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description:
      'Correo institucional de login. Valores esperados: admin@example.com, manager@example.com, inspector@example.com, operario@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '1234', minLength: 4, description: 'Clave de acceso del usuario' })
  @IsString()
  @MinLength(4)
  password!: string;
}
