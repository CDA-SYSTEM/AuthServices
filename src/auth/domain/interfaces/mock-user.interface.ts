import { UserRole } from '../../../common/domain/enums/user-role.enum';

export interface MockUser {
  id: string;
  email: string;
  role: UserRole;
  password: string;
}
