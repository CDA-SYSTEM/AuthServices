import { Injectable, Inject } from '@nestjs/common';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';
import { AuthAccount } from '../../domain/interfaces/auth-account.interface';

@Injectable()
export class GetAuthAccountsUseCase {
  constructor(
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
  ) {}

  async execute(): Promise<AuthAccount[]> {
    return this.authAccountRepository.findAll();
  }
}
