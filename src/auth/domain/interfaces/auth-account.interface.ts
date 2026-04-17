import { UserRole } from '../../../common/domain/enums/user-role.enum';

export interface AuthAccount {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthAccountWithPassword extends AuthAccount {
  password: string;
}
