import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, Matches, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { IdentificationType } from '../../../common/domain/enums/identification-type.enum';

export class RegisterUserDto {
  @ApiProperty({ enum: IdentificationType, example: IdentificationType.CC, description: 'Tipo de identificacion del usuario' })
  @IsEnum(IdentificationType, {
    message: `El tipo de identificación debe ser uno de: ${Object.values(IdentificationType).join(', ')}`,
  })
  identificationType!: IdentificationType;

  @ApiProperty({ example: '1234567890', description: 'Numero de identificacion del usuario' })
  @IsString()
  @Matches(/^[A-Za-z0-9-]{5,20}$/, {
    message: 'El número de identificación debe tener entre 5 y 20 caracteres alfanuméricos',
  })
  identificationNumber!: string;

  @ApiProperty({ example: 'Laura', description: 'Nombres del usuario' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  firstName!: string;

  @ApiProperty({ example: 'Gomez', description: 'Apellidos del usuario' })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  lastName!: string;

  @ApiProperty({ example: '+573001112233', description: 'Numero de contacto del usuario' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'El número celular debe contener entre 7 y 15 dígitos',
  })
  phoneNumber!: string;

  @ApiProperty({ example: 'laura@example.com', description: 'Correo electronico del usuario' })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email!: string;

  @ApiProperty({ example: 'Password123!', required: false, description: 'Clave inicial opcional' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.INSPECTOR, description: 'Rol que se asigna al usuario' })
  @IsEnum(UserRole, { message: `El rol debe ser uno de: ${Object.values(UserRole).join(', ')}` })
  role!: UserRole;
}
