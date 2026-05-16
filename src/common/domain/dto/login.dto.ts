import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Correo del usuario que inicia sesion' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '1234', minLength: 4, description: 'Clave de acceso del usuario' })
  @IsString()
  @MinLength(4)
  password!: string;
}
