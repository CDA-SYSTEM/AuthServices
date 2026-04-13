import { User } from '../interfaces/user.interface';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  searchByNameOrDocument(term: string): Promise<User[]>;
}
