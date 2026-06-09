import { Role } from '../interfaces/role.interface';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface UpdateRoleData {
  scope?: string;
  permissions?: string;
}

export interface RoleRepositoryPort {
  findAll(): Promise<Role[]>;
  findByCode(code: UserRole): Promise<Role | null>;
  update(code: UserRole, data: UpdateRoleData): Promise<Role>;
}
