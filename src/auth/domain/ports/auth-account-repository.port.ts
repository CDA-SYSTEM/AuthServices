import { AuthAccount, AuthAccountWithPassword } from '../interfaces/auth-account.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export const AUTH_ACCOUNT_REPOSITORY = Symbol('AUTH_ACCOUNT_REPOSITORY');

export interface AuthAccountRepositoryPort {
  findById(id: string): Promise<AuthAccount | null>;
  findByEmail(email: string): Promise<AuthAccountWithPassword | null>;
  create(params: { email: string; password: string; role: UserRole; isActive?: boolean }): Promise<AuthAccount>;
  syncByEmail(params: {
    previousEmail?: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  }): Promise<void>;
  deleteByEmail(email: string): Promise<void>;
}
