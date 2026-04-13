import { UserRole } from '../../../common/domain/enums/user-role.enum';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  documentNumber: string;
}

export interface UserWithPassword extends User {
  password: string;
}
