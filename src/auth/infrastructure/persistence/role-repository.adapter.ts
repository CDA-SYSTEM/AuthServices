import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { RoleRepositoryPort, UpdateRoleData } from '../../domain/ports/role-repository.port';
import { Role } from '../../domain/interfaces/role.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class RoleRepositoryAdapter implements RoleRepositoryPort {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findAll(): Promise<Role[]> {
    const roleEntities = await this.roleRepository.find({
      order: { code: 'ASC' },
    });
    return roleEntities.map((entity) => this.mapEntityToRole(entity));
  }

  async findByCode(code: UserRole): Promise<Role | null> {
    const entity = await this.roleRepository.findOne({ where: { code } });
    return entity ? this.mapEntityToRole(entity) : null;
  }

  async update(code: UserRole, data: UpdateRoleData): Promise<Role> {
    const entity = await this.roleRepository.findOne({ where: { code } });
    if (!entity) {
      throw new NotFoundException(`Rol ${code} no encontrado`);
    }

    if (data.scope !== undefined) entity.scope = data.scope;
    if (data.permissions !== undefined) entity.permissions = data.permissions;

    const saved = await this.roleRepository.save(entity);
    return this.mapEntityToRole(saved);
  }

  private mapEntityToRole(entity: RoleEntity): Role {
    return {
      id: entity.id,
      code: entity.code,
      scope: entity.scope,
      permissions: entity.permissions,
    };
  }
}
