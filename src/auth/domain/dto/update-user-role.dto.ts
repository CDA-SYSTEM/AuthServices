import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.INSPECTOR, description: 'Nuevo rol para el usuario' })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}
