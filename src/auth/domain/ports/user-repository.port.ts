import { User } from '../interfaces/user.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIdentificationNumber(identificationNumber: string): Promise<User | null>;
  searchByNameOrDocument(term: string): Promise<User[]>;
  findAll(role?: UserRole): Promise<User[]>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
