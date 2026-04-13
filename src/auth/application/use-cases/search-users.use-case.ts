import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/interfaces/user.interface';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class SearchUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(term: string): Promise<User[]> {
    return this.userRepository.searchByNameOrDocument(term);
  }
}
