import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { ChangePasswordDto } from '../../domain/dto/change-password.dto';
import { JwtPayload } from '../../../common/domain/interfaces/jwt-payload.interface';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class ChangePasswordUseCase {
  private readonly sessionPrefix = 'auth:session:user:';

  constructor(
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
    private readonly redisService: RedisService,
  ) {}

  async execute(dto: ChangePasswordDto, payload: JwtPayload): Promise<{ message: string }> {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    const account = await this.authAccountRepository.findByEmail(payload.email);
    if (!account) {
      throw new UnauthorizedException('Cuenta no encontrada');
    }

    const passwordMatch = await bcrypt.compare(dto.currentPassword, account.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authAccountRepository.updatePassword(account.id, hashedPassword);

    await this.redisService.del(`${this.sessionPrefix}${payload.sub}`);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
