import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string, requestingUserRole: UserRole): Promise<{ message: string }> {
    if (requestingUserRole !== UserRole.SUPERADMIN && requestingUserRole !== UserRole.ADMIN && requestingUserRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Solo SUPERADMIN, ADMIN o MANAGER pueden eliminar usuarios');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (requestingUserRole !== UserRole.SUPERADMIN && user.role !== UserRole.OPERARIO && user.role !== UserRole.INSPECTOR) {
      throw new ForbiddenException('Solo se pueden eliminar usuarios con rol OPERARIO o INSPECTOR');
    }

    // Prefer soft-delete: marcar como inactivo para preservar trazabilidad
    const updated = await this.userRepository.update(id, { isActive: false });
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { message: 'Usuario inactivado correctamente' };
  }
}
