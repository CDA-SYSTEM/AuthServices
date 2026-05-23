import { AuthAccount, AuthAccountWithPassword } from '../interfaces/auth-account.interface';

export const AUTH_ACCOUNT_REPOSITORY = Symbol('AUTH_ACCOUNT_REPOSITORY');

export interface AuthAccountRepositoryPort {
  findAll(): Promise<AuthAccount[]>;
  findById(id: string): Promise<AuthAccount | null>;
  findByEmail(email: string): Promise<AuthAccountWithPassword | null>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
}
