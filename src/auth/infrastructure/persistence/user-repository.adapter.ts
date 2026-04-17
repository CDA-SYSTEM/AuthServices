import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/interfaces/user.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { id },
    });
    return userEntity ? this.mapEntityToUser(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return userEntity ? this.mapEntityToUser(userEntity) : null;
  }

  async findByIdentificationNumber(identificationNumber: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { identificationNumber },
    });
    return userEntity ? this.mapEntityToUser(userEntity) : null;
  }

  async searchByNameOrDocument(term: string): Promise<User[]> {
    const userEntities = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where(
        'user.firstName ILIKE :term OR user.lastName ILIKE :term OR user.identificationNumber ILIKE :term',
        {
        term: `%${term}%`,
      },
      )
      .andWhere('user.isActive = true')
      .andWhere('role.code IN (:...operationalRoles)', {
        operationalRoles: [UserRole.OPERARIO, UserRole.INSPECTOR],
      })
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();

    return userEntities.map((entity: UserEntity) => this.mapEntityToUser(entity));
  }

  async findAll(roleFilter?: UserRole): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('user.isActive = true');

    query.andWhere('role.code IN (:...operationalRoles)', {
      operationalRoles: [UserRole.OPERARIO, UserRole.INSPECTOR],
    });

    if (roleFilter === UserRole.OPERARIO || roleFilter === UserRole.INSPECTOR) {
      query.andWhere('role.code = :role', { role: roleFilter });
    }

    const userEntities = await query
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();

    return userEntities.map((entity: UserEntity) => this.mapEntityToUser(entity));
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const roleEntity = await this.resolveRole(userData.role);

    const userEntity = this.userRepository.create({
      identificationType: userData.identificationType,
      identificationNumber: userData.identificationNumber,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      email: userData.email.toLowerCase(),
      role: roleEntity,
      isActive: userData.isActive,
    });

    const savedUser = await this.userRepository.save(userEntity);
    return this.mapEntityToUser(savedUser);
  }

  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    if (!userEntity) {
      return null;
    }

    if (updates.identificationType !== undefined) {
      userEntity.identificationType = updates.identificationType;
    }
    if (updates.identificationNumber !== undefined) {
      userEntity.identificationNumber = updates.identificationNumber;
    }
    if (updates.firstName !== undefined) {
      userEntity.firstName = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      userEntity.lastName = updates.lastName;
    }
    if (updates.phoneNumber !== undefined) {
      userEntity.phoneNumber = updates.phoneNumber;
    }
    if (updates.email !== undefined) {
      userEntity.email = updates.email.toLowerCase();
    }
    if (updates.role !== undefined) {
      userEntity.role = await this.resolveRole(updates.role);
    }
    if (updates.isActive !== undefined) {
      userEntity.isActive = updates.isActive;
    }

    const savedUser = await this.userRepository.save(userEntity);
    return this.mapEntityToUser(savedUser);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private mapEntityToUser(entity: UserEntity): User {
    return {
      id: entity.id,
      identificationType: entity.identificationType,
      identificationNumber: entity.identificationNumber,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phoneNumber: entity.phoneNumber,
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
