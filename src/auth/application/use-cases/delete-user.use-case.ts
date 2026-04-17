import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
  ) {}

  async execute(id: string, requestingUserRole: UserRole): Promise<{ message: string }> {
    if (requestingUserRole !== UserRole.ADMIN && requestingUserRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Solo ADMIN o MANAGER pueden eliminar usuarios');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role !== UserRole.OPERARIO && user.role !== UserRole.INSPECTOR) {
      throw new ForbiddenException('Solo se pueden eliminar usuarios con rol OPERARIO o INSPECTOR');
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.authAccountRepository.deleteByEmail(user.email);

    return { message: 'Usuario eliminado correctamente' };
  }
}
