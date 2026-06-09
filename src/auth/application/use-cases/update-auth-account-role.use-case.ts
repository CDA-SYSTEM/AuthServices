import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { UpdateAuthAccountRoleDto } from '../../domain/dto/update-auth-account-role.dto';

@Injectable()
export class UpdateAuthAccountRoleUseCase {
  constructor(
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
  ) {}

  async execute(authAccountId: string, dto: UpdateAuthAccountRoleDto, requestingUserRole: UserRole): Promise<{ message: string }> {
    if (requestingUserRole !== UserRole.SUPERADMIN && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo SUPERADMIN o ADMIN pueden cambiar el rol de una cuenta de autenticacion');
    }

    const account = await this.authAccountRepository.findById(authAccountId);
    if (!account) {
      throw new NotFoundException('Cuenta de autenticacion no encontrada');
    }

    await this.authAccountRepository.updateRole(authAccountId, dto.role);

    return { message: 'Rol de la cuenta de autenticacion actualizado correctamente' };
  }
}
