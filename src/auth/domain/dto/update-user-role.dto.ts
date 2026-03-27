import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class UpdateUserRoleDto {
  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
