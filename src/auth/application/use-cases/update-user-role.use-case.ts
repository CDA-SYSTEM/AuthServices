import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/interfaces/user.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string, newRole: UserRole, requestingUserRole: UserRole): Promise<User> {
    if (requestingUserRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo SUPERADMIN puede cambiar el rol de un usuario');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updated = await this.userRepository.update(id, { role: newRole });
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado al actualizar');
    }

    return updated;
  }
}
