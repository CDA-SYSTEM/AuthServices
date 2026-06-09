import { AuthAccount, AuthAccountWithPassword } from '../interfaces/auth-account.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export const AUTH_ACCOUNT_REPOSITORY = Symbol('AUTH_ACCOUNT_REPOSITORY');

export interface CreateAuthAccountData {
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface AuthAccountRepositoryPort {
  findAll(): Promise<AuthAccount[]>;
  findById(id: string): Promise<AuthAccount | null>;
  findByEmail(email: string): Promise<AuthAccountWithPassword | null>;
  create(data: CreateAuthAccountData): Promise<AuthAccount>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  updateRole(id: string, roleCode: UserRole): Promise<void>;
}
