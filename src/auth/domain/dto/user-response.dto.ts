import { ApiProperty } from '@nestjs/swagger';
import { IdentificationType } from '../../../common/domain/enums/identification-type.enum';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export class UserResponseDto {
  @ApiProperty({ example: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a' })
  id!: string;

  @ApiProperty({ enum: IdentificationType, example: IdentificationType.CC })
  identificationType!: IdentificationType;

  @ApiProperty({ example: '1234567890' })
  identificationNumber!: string;

  @ApiProperty({ example: 'Laura' })
  firstName!: string;

  @ApiProperty({ example: 'Gomez' })
  lastName!: string;

  @ApiProperty({ example: '+573001112233' })
  phoneNumber!: string;

  @ApiProperty({ example: 'laura@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.INSPECTOR })
  role!: UserRole;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-05-16T15:20:30.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-16T15:20:30.000Z' })
  updatedAt!: Date;
}
