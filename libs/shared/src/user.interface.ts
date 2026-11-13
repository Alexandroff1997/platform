import { UserRole } from './enums/user-role.enum';

export interface IUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}
