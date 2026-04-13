export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERARIO = 'operario',
  INSPECTOR = 'inspector',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.INSPECTOR]: 2,
  [UserRole.OPERARIO]: 1,
};
