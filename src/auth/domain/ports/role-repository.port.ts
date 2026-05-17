import { Role } from '../interfaces/role.interface';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepositoryPort {
  findAll(): Promise<Role[]>;
}
