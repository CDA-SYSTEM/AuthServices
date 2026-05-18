import { Injectable, Inject, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { RegisterUserDto } from '../../domain/dto/register-user.dto';
import { User } from '../../domain/interfaces/user.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
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

    return newUser;
  }
}
