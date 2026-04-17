import { IsEmail, IsEnum, IsOptional, IsString, MinLength, Matches, IsBoolean } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { IdentificationType } from '../../../common/domain/enums/identification-type.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(IdentificationType, {
    message: `El tipo de identificación debe ser uno de: ${Object.values(IdentificationType).join(', ')}`,
  })
  identificationType?: IdentificationType;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{5,20}$/, {
    message: 'El número de identificación debe tener entre 5 y 20 caracteres alfanuméricos',
  })
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'El número celular debe contener entre 7 y 15 dígitos',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: `El rol debe ser uno de: ${Object.values(UserRole).join(', ')}` })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
