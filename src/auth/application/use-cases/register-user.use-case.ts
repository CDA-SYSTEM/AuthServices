import { Injectable, Inject, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { RegisterUserDto } from '../../domain/dto/register-user.dto';
import { User } from '../../domain/interfaces/user.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
  ) {}

  async execute(registerDto: RegisterUserDto, requestingUserRole: UserRole): Promise<User> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede registrar usuarios');
    }

    if (registerDto.role !== UserRole.OPERARIO && registerDto.role !== UserRole.INSPECTOR) {
      throw new BadRequestException('Solo se pueden registrar usuarios con rol OPERARIO o INSPECTOR');
    }

    const existingByEmail = await this.userRepository.findByEmail(registerDto.email);
    if (existingByEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    const existingAuthAccount = await this.authAccountRepository.findByEmail(registerDto.email);
    if (existingAuthAccount) {
      throw new ConflictException('El email ya está registrado para acceso al sistema');
    }

    const existingByDocument = await this.userRepository.findByIdentificationNumber(
      registerDto.identificationNumber,
    );
    if (existingByDocument) {
      throw new ConflictException('El número de identificación ya está registrado');
    }

    const newUser = await this.userRepository.create({
      identificationType: registerDto.identificationType,
      identificationNumber: registerDto.identificationNumber,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phoneNumber,
      email: registerDto.email,
      role: registerDto.role,
      isActive: true,
    });

    const plainPassword = registerDto.password ?? registerDto.identificationNumber;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await this.authAccountRepository.create({
      email: newUser.email,
      password: hashedPassword,
      role: newUser.role,
      isActive: newUser.isActive,
    });

    return newUser;
  }
}
