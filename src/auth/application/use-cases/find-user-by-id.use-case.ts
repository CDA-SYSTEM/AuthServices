import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../domain/interfaces/user.interface';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }
}
