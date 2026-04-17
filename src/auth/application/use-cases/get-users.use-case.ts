import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/interfaces/user.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(roleFilter?: UserRole): Promise<User[]> {
    return this.userRepository.findAll(roleFilter);
  }
}
