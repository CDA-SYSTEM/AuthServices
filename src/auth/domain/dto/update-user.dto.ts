import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength, Matches, IsBoolean } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { IdentificationType } from '../../../common/domain/enums/identification-type.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: IdentificationType, example: IdentificationType.CC, description: 'Nuevo tipo de identificacion' })
  @IsOptional()
  @IsEnum(IdentificationType, {
    message: `El tipo de identificación debe ser uno de: ${Object.values(IdentificationType).join(', ')}`,
  })
  identificationType?: IdentificationType;

  @ApiPropertyOptional({ example: '1234567890', description: 'Nuevo numero de identificacion' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{5,20}$/, {
    message: 'El número de identificación debe tener entre 5 y 20 caracteres alfanuméricos',
  })
  identificationNumber?: string;

  @ApiPropertyOptional({ example: 'Laura', description: 'Nuevo nombre' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Gomez', description: 'Nuevo apellido' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+573001112233', description: 'Nuevo numero celular' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'El número celular debe contener entre 7 y 15 dígitos',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'laura@example.com', description: 'Nuevo correo electronico' })
  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.OPERARIO, description: 'Nuevo rol del usuario' })
  @IsOptional()
  @IsEnum(UserRole, { message: `El rol debe ser uno de: ${Object.values(UserRole).join(', ')}` })
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'Activa o inactiva el usuario' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
