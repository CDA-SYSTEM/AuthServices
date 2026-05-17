import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class RoleResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  code!: UserRole;

  @ApiProperty({ example: 'Acceso total al sistema' })
  scope!: string;

  @ApiProperty({ example: 'Lectura, escritura, administracion de usuarios y configuracion' })
  permissions!: string;
}
