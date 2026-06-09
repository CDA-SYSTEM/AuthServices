import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class UpdateAuthAccountRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN, description: 'Nuevo rol para la cuenta de autenticacion' })
  @IsEnum(UserRole, { message: `El rol debe ser uno de: ${Object.values(UserRole).join(', ')}` })
  role!: UserRole;
}
