import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { RoleRepositoryPort } from '../../domain/ports/role-repository.port';
import { Role } from '../../domain/interfaces/role.interface';

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

  private mapEntityToRole(entity: RoleEntity): Role {
    return {
      id: entity.id,
      code: entity.code,
      scope: entity.scope,
      permissions: entity.permissions,
    };
  }
}
