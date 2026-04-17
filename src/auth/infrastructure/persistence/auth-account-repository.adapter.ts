import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { AuthAccount, AuthAccountWithPassword } from '../../domain/interfaces/auth-account.interface';
import { AuthAccountEntity } from './entities/auth-account.entity';
import { RoleEntity } from './entities/role.entity';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class AuthAccountRepositoryAdapter implements AuthAccountRepositoryPort {
  constructor(
    @InjectRepository(AuthAccountEntity)
    private readonly authAccountRepository: Repository<AuthAccountEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findById(id: string): Promise<AuthAccount | null> {
    const entity = await this.authAccountRepository.findOne({ where: { id, isActive: true } });
    return entity ? this.mapToAuthAccount(entity) : null;
  }

  async findByEmail(email: string): Promise<AuthAccountWithPassword | null> {
    const entity = await this.authAccountRepository.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });

    return entity ? this.mapToAuthAccountWithPassword(entity) : null;
  }

  async create(params: {
    email: string;
    password: string;
    role: UserRole;
    isActive?: boolean;
  }): Promise<AuthAccount> {
    const roleEntity = await this.resolveRole(params.role);

    const created = await this.authAccountRepository.save(
      this.authAccountRepository.create({
        email: params.email.toLowerCase(),
        password: params.password,
        role: roleEntity,
        isActive: params.isActive ?? true,
      }),
    );

    return this.mapToAuthAccount(created);
  }

  async syncByEmail(params: {
    previousEmail?: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  }): Promise<void> {
    const lookupEmail = (params.previousEmail ?? params.email).toLowerCase();
    const account = await this.authAccountRepository.findOne({ where: { email: lookupEmail } });
    if (!account) {
      return;
    }

    account.email = params.email.toLowerCase();
    account.role = await this.resolveRole(params.role);
    account.isActive = params.isActive;
    await this.authAccountRepository.save(account);
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.authAccountRepository.delete({ email: email.toLowerCase() });
  }

  private mapToAuthAccount(entity: AuthAccountEntity): AuthAccount {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role.code,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapToAuthAccountWithPassword(entity: AuthAccountEntity): AuthAccountWithPassword {
    return {
      id: entity.id,
      email: entity.email,
      password: entity.password,
      role: entity.role.code,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private async resolveRole(roleCode: UserRole): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({ where: { code: roleCode } });
    if (!role) {
      throw new Error(`Rol ${roleCode} no configurado en la tabla roles`);
    }

    return role;
  }
}
