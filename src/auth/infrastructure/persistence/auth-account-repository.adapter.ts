import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAccountRepositoryPort, CreateAuthAccountData } from '../../domain/ports/auth-account-repository.port';
import { AuthAccount, AuthAccountWithPassword } from '../../domain/interfaces/auth-account.interface';
import { AuthAccountEntity } from './entities/auth-account.entity';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class AuthAccountRepositoryAdapter implements AuthAccountRepositoryPort {
  constructor(
    @InjectRepository(AuthAccountEntity)
    private readonly authAccountRepository: Repository<AuthAccountEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findAll(): Promise<AuthAccount[]> {
    const entities = await this.authAccountRepository.find({
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.mapToAuthAccount(entity));
  }

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

  async create(data: CreateAuthAccountData): Promise<AuthAccount> {
    const roleEntity = await this.roleRepository.findOne({ where: { code: data.role } });
    if (!roleEntity) {
      throw new Error(`Rol ${data.role} no configurado`);
    }

    const entity = this.authAccountRepository.create({
      email: data.email.toLowerCase(),
      password: data.password,
      role: roleEntity,
      isActive: data.isActive ?? true,
    });

    const saved = await this.authAccountRepository.save(entity);
    return this.mapToAuthAccount(saved);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.authAccountRepository.update(id, { password: hashedPassword });
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
}
