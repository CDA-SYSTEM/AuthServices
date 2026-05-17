import { UserRole } from '../../../common/domain/enums/user-role.enum';

export interface Role {
  id: string;
  code: UserRole;
  scope: string;
  permissions: string;
}
