import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { User } from '../../domain/interfaces/user.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { UpdateUserDto } from '../../domain/dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateUserDto, requestingUserRole: UserRole): Promise<User> {
    if (requestingUserRole !== UserRole.ADMIN && requestingUserRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Solo ADMIN o MANAGER pueden actualizar usuarios');
    }

    const currentUser = await this.userRepository.findById(id);
    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (currentUser.role !== UserRole.OPERARIO && currentUser.role !== UserRole.INSPECTOR) {
      throw new ForbiddenException('Solo se pueden actualizar usuarios con rol OPERARIO o INSPECTOR');
    }

    if (dto.role && dto.role !== UserRole.OPERARIO && dto.role !== UserRole.INSPECTOR) {
      throw new BadRequestException('El rol solo puede ser OPERARIO o INSPECTOR');
    }

    if (dto.email && dto.email !== currentUser.email) {
      const duplicateEmail = await this.userRepository.findByEmail(dto.email);
      if (duplicateEmail && duplicateEmail.id !== id) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    if (dto.identificationNumber && dto.identificationNumber !== currentUser.identificationNumber) {
      const duplicateDocument = await this.userRepository.findByIdentificationNumber(
        dto.identificationNumber,
      );
      if (duplicateDocument && duplicateDocument.id !== id) {
        throw new ConflictException('El número de identificación ya está registrado');
      }
    }

    const updates: Parameters<UserRepositoryPort['update']>[1] = {
      ...dto,
      email: dto.email ? dto.email.toLowerCase() : undefined,
    };

    const updatedUser = await this.userRepository.update(id, updates);
    if (!updatedUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.authAccountRepository.syncByEmail({
      previousEmail: currentUser.email,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    });

    return updatedUser;
  }
}
