import { ApiProperty } from '@nestjs/swagger';
import { IdentificationType } from '../../../common/domain/enums/identification-type.enum';

export class IdentificationTypeResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ enum: IdentificationType, example: IdentificationType.CC })
  name!: IdentificationType;
}
