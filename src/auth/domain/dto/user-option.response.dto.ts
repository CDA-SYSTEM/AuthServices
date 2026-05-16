import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class UserOptionResponseDto {
  @ApiProperty({ example: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a' })
  id!: string;

  @ApiProperty({ example: 'Laura Gomez', description: 'Texto amigable para combos o listas' })
  label!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.INSPECTOR })
  role!: UserRole;
}
