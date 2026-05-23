import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: '1234', description: 'Contraseña actual del usuario' })
  @IsString()
  @MinLength(4, { message: 'La contraseña actual debe tener al menos 4 caracteres' })
  currentPassword!: string;

  @ApiProperty({ example: 'NuevaClave123!', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  newPassword!: string;
}
