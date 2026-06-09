import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ROLE_REPOSITORY, RoleRepositoryPort, UpdateRoleData } from '../../domain/ports/role-repository.port';
import { Role } from '../../domain/interfaces/role.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(code: UserRole, data: UpdateRoleData, requestingUserRole: UserRole): Promise<Role> {
    if (requestingUserRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo SUPERADMIN puede editar roles');
    }

    const existing = await this.roleRepository.findByCode(code);
    if (!existing) {
      throw new NotFoundException(`Rol ${code} no encontrado`);
    }

    return this.roleRepository.update(code, data);
  }
}
