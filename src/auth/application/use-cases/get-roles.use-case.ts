import { Injectable, Inject } from '@nestjs/common';
import { ROLE_REPOSITORY, RoleRepositoryPort } from '../../domain/ports/role-repository.port';
import { Role } from '../../domain/interfaces/role.interface';

@Injectable()
export class GetRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}
