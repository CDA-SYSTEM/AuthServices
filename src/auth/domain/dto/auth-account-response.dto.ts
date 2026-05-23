import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class AuthAccountResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role!: UserRole;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-05-16T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-16T00:00:00.000Z' })
  updatedAt!: Date;
}
