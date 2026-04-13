import { IsJWT, IsString } from 'class-validator';

export class ValidateTokenDto {
  @IsString()
  @IsJWT()
  token!: string;
}
