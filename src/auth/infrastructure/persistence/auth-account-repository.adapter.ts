import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { AuthAccount, AuthAccountWithPassword } from '../../domain/interfaces/auth-account.interface';
import { AuthAccountEntity } from './entities/auth-account.entity';

@Injectable()
export class AuthAccountRepositoryAdapter implements AuthAccountRepositoryPort {
  constructor(
    @InjectRepository(AuthAccountEntity)
    private readonly authAccountRepository: Repository<AuthAccountEntity>,
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
