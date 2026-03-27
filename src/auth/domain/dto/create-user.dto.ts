import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
