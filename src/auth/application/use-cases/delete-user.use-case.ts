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

    // Prefer soft-delete: marcar como inactivo para preservar trazabilidad
    const updated = await this.userRepository.update(id, { isActive: false });
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Mantener la cuenta de autenticacion sincronizada en estado inactivo
    await this.authAccountRepository.syncByEmail({
      previousEmail: user.email,
      email: user.email,
      role: user.role,
      isActive: false,
    });

    return { message: 'Usuario inactivado correctamente' };
  }
}
