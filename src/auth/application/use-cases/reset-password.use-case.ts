import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { ResetPasswordDto } from '../../domain/dto/reset-password.dto';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class ResetPasswordUseCase {
  private readonly sessionPrefix = 'auth:session:user:';

  constructor(
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
    private readonly redisService: RedisService,
  ) {}

  async execute(authAccountId: string, dto: ResetPasswordDto, requestingUserRole: UserRole): Promise<{ message: string }> {
    if (requestingUserRole !== UserRole.ADMIN && requestingUserRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Solo ADMIN o MANAGER pueden restablecer contraseñas');
    }

    const account = await this.authAccountRepository.findById(authAccountId);
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authAccountRepository.updatePassword(authAccountId, hashedPassword);

    await this.redisService.del(`${this.sessionPrefix}${authAccountId}`);

    return { message: 'Contraseña restablecida correctamente' };
  }
}
