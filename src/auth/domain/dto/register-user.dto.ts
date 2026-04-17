import { IsEmail, IsString, MinLength, IsEnum, Matches, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { IdentificationType } from '../../../common/domain/enums/identification-type.enum';

export class RegisterUserDto {
  @IsEnum(IdentificationType, {
    message: `El tipo de identificación debe ser uno de: ${Object.values(IdentificationType).join(', ')}`,
  })
  identificationType!: IdentificationType;

  @IsString()
  @Matches(/^[A-Za-z0-9-]{5,20}$/, {
    message: 'El número de identificación debe tener entre 5 y 20 caracteres alfanuméricos',
  })
  identificationNumber!: string;

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  firstName!: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  lastName!: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'El número celular debe contener entre 7 y 15 dígitos',
  })
  phoneNumber!: string;

  @IsEmail({}, { message: 'El formato del email no es válido' })
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @IsEnum(UserRole, { message: `El rol debe ser uno de: ${Object.values(UserRole).join(', ')}` })
  role!: UserRole;
}
